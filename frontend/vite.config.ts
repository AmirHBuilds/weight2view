import { defineConfig, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage } from 'http'

// The backend to proxy API requests to in dev. Defaults to localhost for
// `npm run dev` on a host machine; docker-compose overrides this to the
// backend service's container DNS name (see docker-compose.yml).
const PROXY_TARGET = process.env.VITE_PROXY_TARGET ?? 'http://localhost:8000'

// Proxying (rather than calling the backend cross-origin from the browser)
// is what makes the admin session cookie work correctly: the frontend and
// backend run on different ports, which browsers treat as different
// origins, and a cookie set cross-origin needs SameSite=None + Secure
// (HTTPS) to be sent back on later requests - not viable for plain-HTTP
// local dev. Routing these paths through Vite's dev server instead makes
// every request same-origin from the browser's point of view, so a normal
// SameSite=Lax HttpOnly cookie works exactly as it would in a production
// deployment sitting behind one reverse proxy / domain.

// `/admin/*` is special: it's BOTH a frontend client-route (the React
// admin UI lives at /admin, /admin/items, /admin/references, ...) AND the
// backend API's admin path prefix (GET /admin/items returns JSON). A plain
// path-prefix proxy can't tell those apart - it would hijack real page
// navigations to /admin/items and hand them to the backend, which 404s
// since it has no HTML to serve there. The standard fix: only proxy
// requests that look like API calls (no `Accept: text/html`), and let
// real browser navigations fall through to Vite's own SPA handling so
// React Router serves the page as normal.
function apiOnlyBypass(req: IncomingMessage): string | undefined {
  const accept = req.headers.accept ?? ''
  if (accept.includes('text/html')) {
    return req.url // returning the original URL tells Vite to skip proxying
  }
  return undefined
}

const proxyConfig: ProxyOptions = { target: PROXY_TARGET, changeOrigin: true }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/items': proxyConfig,
      '/calculate': proxyConfig,
      '/references': proxyConfig,
      '/requests': proxyConfig,
      '/health': proxyConfig,
      '/admin': { ...proxyConfig, bypass: apiOnlyBypass },
    },
  },
})
