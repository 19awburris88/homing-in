// Vercel serverless function: GET /api/listing?url=...
import { fetchListing } from './_lib/listing.mjs';

export default async function handler(req, res) {
  try {
    const url = req.query?.url;
    const result = await fetchListing(url);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ ok: false, reason: String(e) });
  }
}
