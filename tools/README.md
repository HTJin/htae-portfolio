# tools/

Read-only measurement harnesses. Nothing here ships; nothing here is imported by the app.

## The ramp merge sweep (T152-1)

`sweep.mjs` samples the REAL `route.js` across the ramp merge, looking for a step in `rampAt`,
in its first difference (a kink), or in `rampDropAt`. It carries a control: the identical sweep
on open mainline, where all three must be flat zero. If the control is not flat, the sampler is
wrong and no conclusion about the road may be drawn.

```
node tools/run-sweep.mjs
```

`alias-hook.mjs` is a Node resolve hook that maps the project's `@/` alias and webpack-style
extensionless imports. It **resolves**; it never reimplements. That distinction is the point:
retyping `RAMP_OFFSET` and `smoothstep` into a scratch file proves what you typed, not what the
page runs, and `VERGE_WIDTH` was two disagreeing numbers in two files for four cycles here.

### Status: BLOCKED, and why

The hook gets `@/content` and `./world` resolving, then Node fails with a SyntaxError: something
in the import graph is JSX, which Node cannot parse. Options for the next shift, in order of
preference:

1. **Sweep in the browser against the running bundle.** Drive a full leg and record
   `(travel, drop, ramp)` at <= 0.5m intervals from `simRef`. Those values ARE `rampDropAt` and
   `rampAt` evaluated by the real shipped code, which is strictly better evidence than importing
   the source. Look for a step in the first difference of `drop` against `travel`.
2. Add a JSX-aware transform to the hook (esbuild is not a dependency here, so this needs care
   against the no-new-dependencies guardrail).

Do NOT resolve this by copying the constants into a standalone script. That is inspection wearing
the costume of execution, and it is explicitly forbidden by cycle 152's guardrail 2.
