// Resolve the project's "@/" alias AND webpack-style extensionless imports so the
// REAL modules can be imported. This RESOLVES; it never reimplements or copies.
import fs from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'
const SRC = 'D:/CT/Work/htae-portfolio/src/'

function firstExisting(base) {
  for (const t of [base, base + '.js', base + '.jsx', base + '/index.js']) {
    if (fs.existsSync(t) && fs.statSync(t).isFile()) return t
  }
  return null
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const hit = firstExisting(SRC + specifier.slice(2))
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true }
  }
  if (specifier.startsWith('.') && context.parentURL) {
    const parentDir = fileURLToPath(new URL('.', context.parentURL))
    const hit = firstExisting(parentDir + specifier.replace(/^\.\//, '').replace(/\//g, '\'))
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true }
  }
  return next(specifier, context)
}
