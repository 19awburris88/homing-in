// Client wrapper for the area-lookup endpoint (Vite middleware in dev, Edge Function in prod).
export async function lookupArea(address) {
  try {
    const res = await fetch(`/api/area?address=${encodeURIComponent(address)}`);
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    return await res.json();
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

// Import basic facts + photo from a listing URL (Redfin works best).
export async function fetchListing(url) {
  try {
    const res = await fetch(`/api/listing?url=${encodeURIComponent(url)}`);
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    return await res.json();
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

export const fmtMoney = (n) =>
  n == null ? '—' : '$' + Number(n).toLocaleString();

// Turn the raw walkability score into a short human label.
export function walkLabel(score) {
  if (score == null) return null;
  if (score >= 85) return 'Very walkable';
  if (score >= 60) return 'Somewhat walkable';
  if (score >= 30) return 'Car-dependent';
  return 'Very car-dependent';
}
