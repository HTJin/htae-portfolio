/**
 * Measured controls for st023 (along-s length) + st024 (lateral offset).
 * Alternate coder-2 path: shared `{ length, offset, dropHold }` table.
 *
 * Run from the worktree:
 *   node --experimental-loader=./scripts/worktree-alias-hook.mjs scripts/assert-ramp-geom.mjs
 * or via register() below.
 */
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
register(
  './worktree-alias-hook.mjs',
  pathToFileURL(path.join(root, 'scripts/'))
)

async function main() {
  const routeMod = await import('../src/components/drive/route.js')
  const worldMod = await import('../src/components/drive/world.js')
  const rngMod = await import('../src/components/drive/rng.js')

  const {
    LEG_LENGTH,
    RAMP_SEPARATES,
    previewRampGeometry,
    getRampGeometry,
    rampAt,
    rampDropAt,
    rampProgress,
    rampLengthAt,
    rampOffsetAt,
    route,
  } = routeMod

  const { CARRIAGEWAY, LANE_OFFSET, cameraX } = worldMod
  const { RAMP_EXTRA_MIN, RAMP_EXTRA_MAX } = rngMod

  const fails = []
  function ok(name, cond, detail = '') {
    if (!cond) fails.push(`${name}: ${detail}`)
    else console.log(`PASS ${name}${detail ? ` (${detail})` : ''}`)
  }

  const live = getRampGeometry()
  ok('table_populated', live.length === route.length, `n=${live.length}`)

  // Control A: two seeds → different lengths at same stop index
  {
    const a = previewRampGeometry(1)
    const b = previewRampGeometry(2)
    const differ = a.some((g, i) => Math.abs(g.length - b[i].length) > 1e-9)
    ok(
      'A_seed_lengths_differ',
      differ,
      `stop0 ${a[0].length.toFixed(3)} vs ${b[0].length.toFixed(3)}`
    )
  }

  // Control A2: two seeds → different peak offsets
  {
    const a = previewRampGeometry(11)
    const b = previewRampGeometry(22)
    const differ = a.some((g, i) => Math.abs(g.offset - b[i].offset) > 1e-9)
    ok(
      'A2_seed_offsets_differ',
      differ,
      `stop0 ${a[0].offset.toFixed(3)} vs ${b[0].offset.toFixed(3)}`
    )
  }

  // Control B: mainline mid-leg rampProgress ≈ 0
  {
    const mid = LEG_LENGTH / 2
    const p = rampProgress(mid)
    ok('B_midleg_progress_near_zero', p < 1e-6, `progress(${mid})=${p}`)
    ok(
      'B_midleg_rampAt_near_zero',
      Math.abs(rampAt(mid)) < 1e-6,
      `rampAt=${rampAt(mid)}`
    )
  }

  // Control C: every consecutive pair leaves open mainline
  {
    let allOk = true
    let detail = ''
    for (let i = 0; i < live.length - 1; i += 1) {
      const sum = live[i].length + live[i + 1].length
      if (!(sum < LEG_LENGTH)) {
        allOk = false
        detail = `pair ${i}/${i + 1} sum=${sum}`
        break
      }
    }
    ok('C_mainline_gap', allOk, detail || `maxPair ok legs=${live.length - 1}`)
  }

  // Control D: mid-ramp progress matches that stop's length (sample exit of stop 1)
  {
    const index = Math.min(1, route.length - 1)
    const len = rampLengthAt(index)
    const s = index * LEG_LENGTH - len * 0.5
    const p = rampProgress(s)
    // smoothstep(0.5) = 0.5
    ok(
      'D_midramp_progress',
      Math.abs(p - 0.5) < 1e-6,
      `s=${s.toFixed(2)} len=${len.toFixed(2)} p=${p.toFixed(6)}`
    )
  }

  // Control E: full peel clears RAMP_SEPARATES; DROP_HOLD < 1
  {
    let allOk = true
    let detail = ''
    for (let i = 0; i < live.length; i += 1) {
      const { offset, dropHold } = live[i]
      if (!(offset >= RAMP_SEPARATES)) {
        allOk = false
        detail = `stop ${i} offset ${offset} < separates ${RAMP_SEPARATES}`
        break
      }
      if (!(dropHold < 1 && dropHold > 0)) {
        allOk = false
        detail = `stop ${i} dropHold=${dropHold}`
        break
      }
      const extra = offset - CARRIAGEWAY
      if (!(extra >= RAMP_EXTRA_MIN - 1e-9 && extra <= RAMP_EXTRA_MAX + 1e-9)) {
        allOk = false
        detail = `stop ${i} extra=${extra}`
        break
      }
    }
    ok('E_clear_carriageway_and_hold', allOk, detail || 'all stops')
  }

  // Control F: peak at stop equals table offset; mid-exit drop differs from mainline
  {
    const index = Math.min(2, route.length - 1)
    const peak = rampAt(index * LEG_LENGTH)
    ok(
      'F_park_peak_matches_offset',
      Math.abs(peak - rampOffsetAt(index)) < 1e-6,
      `peak=${peak.toFixed(3)}`
    )
    const len = rampLengthAt(index)
    const midExit = index * LEG_LENGTH - len * 0.35
    const dropMid = rampDropAt(midExit)
    const dropMain = rampDropAt(LEG_LENGTH / 2)
    ok(
      'F_midexit_drop_differs_mainline',
      Math.abs(dropMid - dropMain) > 1e-6,
      `mid=${dropMid.toFixed(4)} main=${dropMain.toFixed(4)}`
    )
  }

  // Control G: cameraX composition unchanged (ramp outside sim.x)
  {
    const sim = { ramp: 12.5, x: -1.2 }
    const expected = LANE_OFFSET + 12.5 + -1.2
    ok(
      'G_cameraX_composition',
      Math.abs(cameraX(sim) - expected) < 1e-9,
      `got=${cameraX(sim)}`
    )
  }

  // Axes independence: same base seed salts must not force length==scaled offset
  {
    const g = previewRampGeometry(99)
    const correlated = g.every(
      (row, i) =>
        Math.abs(row.length / LEG_LENGTH - (row.offset - CARRIAGEWAY) / 23) <
        0.02
    )
    ok(
      'H_axes_not_single_scalar',
      !correlated || g.length < 2,
      'separate salted streams'
    )
  }

  if (fails.length) {
    console.error('FAILS:')
    for (const f of fails) console.error(' ', f)
    process.exit(1)
  }
  console.log(`OK ${fails.length === 0 ? 'all controls passed' : ''}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
