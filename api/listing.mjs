// Listing importer — fetch a real-estate listing URL server-side and pull out
// photo + basic facts. Works best with Redfin (returns 200 + rich OG/JSON-LD);
// Zillow blocks server fetches (403), so it's Redfin-first with a generic
// OpenGraph fallback for anything else.

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function metaTag(html, prop) {
  // Matches <meta property="og:image" content="..."> in either attribute order.
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
  }
  return null;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
}

const num = (s) => {
  if (s == null) return null;
  const n = Number(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Redfin embeds MULTIPLE JSON-LD residence blocks (the listing itself + "similar
// homes"). We disambiguate by matching each block's street address against the
// street parsed from the listing URL, so facts never bleed from a nearby home.
function collectResidences(html) {
  const found = [];
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    let data;
    try { data = JSON.parse(b[1].trim()); } catch { continue; }
    for (const it of (Array.isArray(data) ? data : [data])) {
      const t = it['@type'];
      if (['Product', 'SingleFamilyResidence', 'Residence', 'House', 'Apartment'].includes(t)) found.push(it);
    }
  }
  return found;
}

function factsFrom(it) {
  const addr = it.address || {};
  const offer = it.offers || {};
  const fa = it.floorSize?.value;
  return {
    street: addr.streetAddress || null,
    zip: addr.addressLocality
      ? [addr.addressLocality, addr.addressRegion, addr.postalCode].filter(Boolean).join(', ')
      : null,
    price: num(offer.price),
    beds: num(it.numberOfRooms),
    sqft: num(fa),
    image: Array.isArray(it.image) ? it.image[0] : (typeof it.image === 'string' ? it.image : null),
  };
}

// "17293-Texas-Pistache-Dr-75252" -> "17293 texas pistache dr"
function streetFromUrl(url) {
  const seg = url.split('/home/')[0].split('/').pop() || '';
  return seg.replace(/-\d{5}$/, '').replace(/-/g, ' ').trim().toLowerCase();
}

function normStreet(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

export async function fetchListing(url) {
  if (!url || !/^https?:\/\//i.test(url)) return { ok: false, reason: 'invalid_url' };
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return { ok: false, reason: 'invalid_url' }; }

  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
      redirect: 'follow',
    });
  } catch (e) {
    return { ok: false, reason: 'fetch_failed', detail: String(e), host };
  }

  if (res.status === 403 || res.status === 429) {
    // Zillow/Realtor commonly land here — tell the UI to fall back to manual entry.
    return { ok: false, reason: 'blocked', status: res.status, host };
  }
  if (!res.ok && res.status !== 202) return { ok: false, reason: `http_${res.status}`, host };

  const html = await res.text();

  // AWS WAF (Redfin) serves a 202 JS-challenge stub instead of the page.
  if (/awsWaf|challenge-container|captcha|press.and.hold/i.test(html) && !/og:image/i.test(html)) {
    return { ok: false, reason: 'blocked', status: res.status, host };
  }

  // Photo + address come from the page's own OpenGraph tags — always about THIS
  // listing, never a recommendation block.
  const ogImage = metaTag(html, 'og:image');
  const ogTitle = metaTag(html, 'og:title');
  // og/twitter description carries the facts in a clean, consistent line, e.g.
  // "For Sale: 3 beds, 2 baths ∙ 2027 sq. ft. ∙ 605 Palomar Ln, ... ∙ $420,000 ∙ MLS# ..."
  const desc = metaTag(html, 'og:description') || metaTag(html, 'twitter:description') || '';

  const listing = {
    photo: ogImage || null,
    address: null,
    zip: null,
    price: null,
    beds: null,
    baths: null,
    sqft: null,
    title: ogTitle,
    sourceUrl: url,
    host,
  };

  // Beds / baths / sqft / price — parse each independently from the description.
  const facts = parseDescription(desc);
  listing.beds = facts.beds;
  listing.baths = facts.baths;
  listing.sqft = facts.sqft;
  listing.price = facts.price;

  // Address from og:title, e.g. "605 Palomar Ln, Richardson, TX 75081 - 3 beds/2 baths"
  // or "123 Main St, Dallas, TX 75201 | Redfin". Strip the trailing beds/baths or "| Redfin".
  if (ogTitle) {
    const head = ogTitle.split('|')[0].split(/\s[-–]\s/)[0].trim();
    const seg = head.split(',');
    listing.address = seg[0]?.trim() || null;
    if (seg.length > 1) listing.zip = seg.slice(1).join(',').trim();
  }

  // Fallback: fill any gaps from the JSON-LD block whose street matches this URL.
  const wantStreet = normStreet(streetFromUrl(url));
  const residences = collectResidences(html).map(factsFrom);
  const match =
    residences.find((r) => wantStreet && normStreet(r.street) === wantStreet) ||
    residences.find((r) => wantStreet && r.street && (normStreet(r.street).includes(wantStreet) || wantStreet.includes(normStreet(r.street))));
  if (match) {
    listing.price ??= match.price ?? null;
    listing.beds ??= match.beds ?? null;
    listing.sqft ??= match.sqft ?? null;
    if (!listing.photo) listing.photo = match.image;
    if (!listing.zip && match.zip) listing.zip = match.zip;
    if (!listing.address && match.street) listing.address = match.street;
  }

  const gotAnything = listing.photo || listing.address || listing.price || listing.beds;
  if (!gotAnything) return { ok: false, reason: 'no_data', host };
  return { ok: true, listing };
}

// Pull beds / baths / sqft / price from a listing description line.
function parseDescription(desc) {
  const beds = desc.match(/(\d+(?:\.\d+)?)\s*beds?\b/i);
  const baths = desc.match(/(\d+(?:\.\d+)?)\s*baths?\b/i);
  const sqft = desc.match(/([\d,]+)\s*sq\.?\s*ft\.?/i);
  const price = desc.match(/\$\s?([\d,]+(?:\.\d+)?)/);
  return {
    beds: beds ? num(beds[1]) : null,
    baths: baths ? Number(baths[1]) || null : null,
    sqft: sqft ? num(sqft[1]) : null,
    price: price ? num(price[1]) : null,
  };
}
