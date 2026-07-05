// Area-data aggregation — one call: address -> geocode -> Census + OSM + crime -> single blob.
// Framework-agnostic: used by the Vite dev middleware now and a Supabase Edge Function in prod.
// Every source is wrapped so one failing provider never sinks the whole lookup.

const MILE_M = 1609;

// ── Geocoding (US Census Geocoder — free, keyless, but no CORS so it must run server-side) ──
async function geocode(address) {
  const url =
    'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress' +
    `?address=${encodeURIComponent(address)}` +
    '&benchmark=Public_AR_Current&vintage=Current_Current&format=json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocoder ${res.status}`);
  const data = await res.json();
  const match = data?.result?.addressMatches?.[0];
  if (!match) return null;
  const tract = match.geographies?.['Census Tracts']?.[0] || {};
  return {
    matchedAddress: match.matchedAddress,
    lat: match.coordinates.y,
    lng: match.coordinates.x,
    geo: {
      state: tract.STATE,
      county: tract.COUNTY,
      tract: tract.TRACT,
      geoid: tract.GEOID,
    },
  };
}

// ── Demographics (Census ACS 5-year — free but needs a Census API key) ──
const ACS_VARS = {
  B19013_001E: 'medianIncome',
  B25077_001E: 'medianHomeValue',
  B25064_001E: 'medianRent',
  B01003_001E: 'population',
  B01002_001E: 'medianAge',
  B15003_001E: 'eduTotal',
  B15003_022E: 'eduBachelors',
  B15003_023E: 'eduMasters',
  B15003_024E: 'eduProfessional',
  B15003_025E: 'eduDoctorate',
};

async function demographics(geo, key) {
  if (!key) return { available: false, reason: 'no_census_key' };
  if (!geo?.state || !geo?.county || !geo?.tract) return { available: false, reason: 'no_tract' };
  const vars = Object.keys(ACS_VARS).join(',');
  const url =
    `https://api.census.gov/data/2022/acs/acs5?get=NAME,${vars}` +
    `&for=tract:${geo.tract}&in=state:${geo.state}+county:${geo.county}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return { available: false, reason: `acs_${res.status}` };
  const rows = await res.json();
  const header = rows[0];
  const values = rows[1] || [];
  const raw = {};
  header.forEach((h, i) => { raw[h] = values[i]; });

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > -66666666 ? n : null; // Census uses large negatives as null flags
  };
  const eduTotal = num(raw.B15003_001E);
  const bachelorsPlus = ['B15003_022E', 'B15003_023E', 'B15003_024E', 'B15003_025E']
    .reduce((s, k) => s + (num(raw[k]) || 0), 0);

  return {
    available: true,
    tractName: raw.NAME,
    medianIncome: num(raw.B19013_001E),
    medianHomeValue: num(raw.B25077_001E),
    medianRent: num(raw.B25064_001E),
    population: num(raw.B01003_001E),
    medianAge: num(raw.B01002_001E),
    bachelorsPlusPct: eduTotal ? Math.round((bachelorsPlus / eduTotal) * 100) : null,
  };
}

// ── Walkability / amenities / schools (OpenStreetMap Overpass — free, keyless) ──
function haversineMi(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

async function amenities(lat, lng) {
  const q = `[out:json][timeout:25];
(
  nwr(around:${MILE_M},${lat},${lng})[shop~"supermarket|grocery|convenience"];
  nwr(around:${MILE_M},${lat},${lng})[amenity~"restaurant|cafe|fast_food|bar|pub"];
  nwr(around:${MILE_M},${lat},${lng})[amenity~"school|college|university"];
  nwr(around:${MILE_M},${lat},${lng})[leisure=park];
  nwr(around:${MILE_M},${lat},${lng})[highway=bus_stop];
  nwr(around:${MILE_M},${lat},${lng})[railway=station];
);
out center tags 400;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'house-tour/1.0 (area lookup)',
    },
    body: 'data=' + encodeURIComponent(q),
  });
  if (!res.ok) return { available: false, reason: `overpass_${res.status}` };
  const data = await res.json();
  const counts = { grocery: 0, dining: 0, parks: 0, transit: 0, schools: 0 };
  const schools = [];
  for (const el of data.elements || []) {
    const t = el.tags || {};
    if (t.shop) counts.grocery++;
    else if (['restaurant', 'cafe', 'fast_food', 'bar', 'pub'].includes(t.amenity)) counts.dining++;
    else if (t.leisure === 'park') counts.parks++;
    else if (t.highway === 'bus_stop' || t.railway === 'station') counts.transit++;
    else if (['school', 'college', 'university'].includes(t.amenity)) {
      counts.schools++;
      if (t.name) {
        const c = el.center || el;
        schools.push({
          name: t.name,
          type: t.amenity,
          distMi: c.lat != null ? Math.round(haversineMi(lat, lng, c.lat, c.lon) * 10) / 10 : null,
        });
      }
    }
  }
  // Rough 0–100 walkability proxy from amenity density within 1 mile. Uses
  // diminishing returns (sqrt) per category so a handful of shops doesn't peg it
  // at 100 — leaves headroom to tell a walkable block from a car-dependent one.
  const w = (n, weight, cap) => Math.min(cap, Math.sqrt(n) * weight);
  const score = Math.round(
    Math.min(
      100,
      w(counts.grocery, 16, 32) +
        w(counts.dining, 9, 26) +
        w(counts.parks, 10, 18) +
        w(counts.transit, 8, 14) +
        w(counts.schools, 6, 10)
    )
  );
  schools.sort((a, b) => (a.distMi ?? 99) - (b.distMi ?? 99));
  return { available: true, counts, score, schools: schools.slice(0, 6) };
}

// ── Drive time to Children's Medical Center Dallas (OSRM public router — free, keyless) ──
const CHILDRENS = { name: "Children's Medical Center Dallas", lat: 32.808947, lng: -96.836127 };

async function commute(lat, lng, dest = CHILDRENS) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${lng},${lat};${dest.lng},${dest.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) return { available: false, reason: `osrm_${res.status}` };
  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route) return { available: false, reason: 'no_route' };
  return {
    available: true,
    destName: dest.name,
    distanceMi: Math.round((route.distance / 1609.34) * 10) / 10,
    durationMin: Math.round(route.duration / 60),
  };
}

// ── Crime / safety (no free national source — stubbed until a provider key is configured) ──
async function crime(/* lat, lng, env */) {
  return { available: false, reason: 'no_provider', note: 'Add a RentCast/ATTOM key to enable safety data.' };
}

export async function lookupArea(address, env = {}) {
  if (!address || !address.trim()) throw new Error('address required');
  const geocoded = await geocode(address).catch((e) => ({ error: String(e) }));
  if (!geocoded || geocoded.error || geocoded.lat == null) {
    return { address, ok: false, reason: geocoded?.error || 'no_geocode_match' };
  }
  const { lat, lng, geo, matchedAddress } = geocoded;
  const [demo, amen, commuteData, crimeData] = await Promise.all([
    demographics(geo, env.CENSUS_API_KEY).catch((e) => ({ available: false, reason: String(e) })),
    amenities(lat, lng).catch((e) => ({ available: false, reason: String(e) })),
    commute(lat, lng).catch((e) => ({ available: false, reason: String(e) })),
    crime().catch((e) => ({ available: false, reason: String(e) })),
  ]);
  return {
    address,
    ok: true,
    matchedAddress,
    location: { lat, lng },
    geo,
    demographics: demo,
    walkability: amen,
    schools: amen.available ? amen.schools : [],
    commute: commuteData,
    crime: crimeData,
  };
}
