import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { lookupArea } from './api/area-lookup.mjs'
import { fetchListing } from './api/listing.mjs'

// Dev-only middleware that serves the area-lookup + listing handlers.
// In production these same handlers are deployed as Supabase Edge Functions.
function areaApiPlugin(env) {
  const json = (res, code, body) => {
    res.statusCode = code
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(body))
  }
  return {
    name: 'area-api',
    configureServer(server) {
      server.middlewares.use('/api/area', async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost')
          const result = await lookupArea(url.searchParams.get('address'), { CENSUS_API_KEY: env.CENSUS_API_KEY })
          json(res, 200, result)
        } catch (e) {
          json(res, 400, { ok: false, reason: String(e) })
        }
      })
      server.middlewares.use('/api/listing', async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost')
          const result = await fetchListing(url.searchParams.get('url'))
          json(res, 200, result)
        } catch (e) {
          json(res, 400, { ok: false, reason: String(e) })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '')
  return {
    plugins: [react(), areaApiPlugin(env)],
  }
})
