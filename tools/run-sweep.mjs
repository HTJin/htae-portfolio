import { register } from 'node:module'
// Resolve the hook relative to THIS file, so no shell quoting is involved.
register(new URL('./alias-hook.mjs', import.meta.url))
await import(new URL('./sweep.mjs', import.meta.url))
