import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import http from 'node:http'
import net from 'node:net'

function apiTarget() {
  const raw = process.env.VITE_API_TARGET || 'http://127.0.0.1:3001'
  const url = new URL(raw)
  return { hostname: url.hostname, port: Number(url.port || 80) }
}

function waitForApi(hostname: string, port: number, tries: number, delayMs: number) {
  return new Promise<void>((resolve, reject) => {
    const attempt = (left: number) => {
      const socket = net.connect({ host: hostname, port }, () => {
        socket.end()
        resolve()
      })
      socket.on('error', () => {
        socket.destroy()
        if (left <= 0) {
          reject(new Error(`ECONNREFUSED ${hostname}:${port}`))
          return
        }
        setTimeout(() => attempt(left - 1), delayMs)
      })
    }
    attempt(tries)
  })
}

function clinmaxApiProxy(): Plugin {
  const { hostname, port } = apiTarget()
  return {
    name: 'clinmax-api-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          next()
          return
        }

        const run = async () => {
          try {
            await waitForApi(hostname, port, 25, 400)
          } catch {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'API indisponivel. Rode npm run start-back.',
              })
            )
            return
          }

          const proxyReq = http.request(
            {
              hostname,
              port,
              path: req.url,
              method: req.method,
              headers: { ...req.headers, host: `${hostname}:${port}` },
            },
            (proxyRes) => {
              res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
              proxyRes.pipe(res)
            }
          )
          proxyReq.on('error', () => {
            if (!res.headersSent) {
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'API indisponivel. Rode npm run start-back.' }))
            }
          })
          req.pipe(proxyReq)
        }

        void run()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), clinmaxApiProxy()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: Number(process.env.VITE_PORT) || 5173,
    strictPort: false,
    watch: {
      usePolling: process.platform === 'win32',
      interval: 1000,
    },
  },
})
