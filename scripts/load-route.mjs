/**
 * Load worktree route.js via Node ESM resolve hook.
 *   node --import ./scripts/load-route.mjs ./scripts/assert-ramp-lengths.mjs
 */
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const hook = path.join(here, 'worktree-alias-hook.mjs')
register(pathToFileURL(hook).href)
