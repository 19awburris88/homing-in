// Vercel serverless function: GET /api/area?address=...
// Wraps the shared aggregator; the Census key comes from a server-side env var.
import { lookupArea } from './_lib/area-lookup.mjs';

export default async function handler(req, res) {
  try {
    const address = req.query?.address;
    const result = await lookupArea(address, { CENSUS_API_KEY: process.env.CENSUS_API_KEY });
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ ok: false, reason: String(e) });
  }
}
