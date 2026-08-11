import fs from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src') + path.sep

function firstExisting(base) {
  for (const t of [base, base + '.js', base + '.jsx', base + '/index.js']) {
    if (fs.existsSync(t) && fs.statSync(t).isFile()) return t
  }
  return null
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const hit = firstExisting(path.join(SRC, specifier.slice(2)))
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true }
  }
  if (specifier.startsWith('.') && context.parentURL) {
    const parentDir = fileURLToPath(new URL('.', context.parentURL))
    const rel = specifier.replace(/^\.\//, '')
    const hit = firstExisting(path.join(parentDir, rel))
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true }
  }
  return next(specifier, context)
}
