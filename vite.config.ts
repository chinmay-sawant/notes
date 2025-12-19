import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function notesDevToolsPlugin(): Plugin {
  return {
    name: 'notes-dev-tools',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        // Support both '/__notes/refresh' and '/notes/__notes/refresh' (base path)
        if (!url.includes('/__notes/refresh')) return next()

        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)
        const scriptPath = path.join(__dirname, 'scripts', 'generate-index.js')

        execFile('node', [scriptPath], { cwd: server.config.root }, (err) => {
          if (err) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: String(err) }))
            return
          }

          res.statusCode = 200
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
        })
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), notesDevToolsPlugin()],
  base: '/notes/',
})
