import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'

async function readJsonBody(req: any): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf-8')
  if (!raw) return {}
  return JSON.parse(raw)
}

function isLocalhost(req: any): boolean {
  const host = String(req.headers?.host ?? '')
  return host.includes('localhost') || host.includes('127.0.0.1')
}

function notesDevToolsPlugin(): Plugin {
  return {
    name: 'notes-dev-tools',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        // Support both '/__notes/*' and '/notes/__notes/*' (base path)
        if (!url.includes('/__notes/')) return next()

        if (!isLocalhost(req)) {
          res.statusCode = 403
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: 'Dev tools endpoints are only available on localhost.' }))
          return
        }

        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)
        const scriptPath = path.join(__dirname, 'scripts', 'generate-index.js')
        const publicDir = path.join(__dirname, 'public')

        const pathname = url.split('?')[0]

        const sendJson = (status: number, payload: any) => {
          res.statusCode = status
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(payload))
        }

        const safeJoinPublic = (folderPath: string, name?: string) => {
          const cleanedFolder = String(folderPath ?? '')
            .replace(/^\/+/, '')
            .replace(/\/+$/, '')
            .replace(/\\/g, '/')

          const cleanedName = name
            ? String(name).replace(/\\/g, '/').replace(/^\/+/, '')
            : ''

          // Prevent traversal
          const unsafe = [cleanedFolder, cleanedName].some((p) => p.split('/').includes('..'))
          if (unsafe) throw new Error('Invalid path')

          const target = name
            ? path.join(publicDir, cleanedFolder, cleanedName)
            : path.join(publicDir, cleanedFolder)

          const rel = path.relative(publicDir, target)
          if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Invalid path')
          return target
        }

        // Refresh index
        if (pathname.includes('/__notes/refresh')) {
          execFile('node', [scriptPath], { cwd: server.config.root }, (err) => {
            if (err) return sendJson(500, { ok: false, error: String(err) })
            return sendJson(200, { ok: true })
          })
          return
        }

        // Create folder
        if (pathname.includes('/__notes/mkdir') && req.method === 'POST') {
          readJsonBody(req)
            .then(async (body) => {
              const folderPath = body?.folderPath ?? ''
              const folderName = body?.folderName
              if (!folderName) throw new Error('folderName is required')
              const targetParent = safeJoinPublic(folderPath)
              const target = safeJoinPublic(folderPath, folderName)
              await fs.mkdir(targetParent, { recursive: true })
              await fs.mkdir(target, { recursive: true })
              return sendJson(200, { ok: true })
            })
            .catch((err) => sendJson(400, { ok: false, error: String(err?.message ?? err) }))
          return
        }

        // Write file
        if (pathname.includes('/__notes/write') && req.method === 'POST') {
          readJsonBody(req)
            .then(async (body) => {
              const folderPath = body?.folderPath ?? ''
              const fileName = body?.fileName
              const content = body?.content ?? ''
              if (!fileName) throw new Error('fileName is required')
              const targetFile = safeJoinPublic(folderPath, fileName)
              // Create the parent directory for the target file.
              // This covers both cases:
              // 1) folderPath is provided (e.g. "go")
              // 2) folderPath is empty but fileName includes nested dirs (e.g. "newthing/note.md")
              await fs.mkdir(path.dirname(targetFile), { recursive: true })
              await fs.writeFile(targetFile, String(content), 'utf-8')
              return sendJson(200, { ok: true })
            })
            .catch((err) => sendJson(400, { ok: false, error: String(err?.message ?? err) }))
          return
        }

        return next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), notesDevToolsPlugin()],
  base: '/notes/',
})
