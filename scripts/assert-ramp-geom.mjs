/**
 * Measured controls for st023 (along-s length) + st024 (lateral offset).
 * Run from the worktree: `node scripts/assert-ramp-geom.mjs`
 *
 * Loads route via a tiny @/ alias hook. No new deps.
 */
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

register('./worktree-alias-hook.mjs', pathToFileURL(path.join(root, 'scripts/')))

async function main() {
  const routeMod = await import('../src/components/drive/route.js')
  const worldMod = await import('../src/components/drive/world.js')

  const {
    LEG_LENGTH,
    RAMP_SEPARATES,
    RAMP_OFFSET_EXTRA_MIN,
    RAMP_OFFSET_EXTRA_MAX,
    attachRampLengths,
    attachRampOffsets,
    drawRampLength,
    drawRampOffset,
    rampAt,
    rampDropAt,
    rampLengthFor,
    rampOffsetFor,
    rampLengths,
    rampOffsets,
    dropHolds,
    route,
    RAMP_LENGTH_SEED,
    RAMP_OFFSET_SEED,
  } = routeMod

  const { CARRIAGEWAY, LANE_OFFSET, cameraX } = worldMod

  const fails = []
  function ok(name, cond, detail = '') {
    if (!cond) fails.push(`${name}: ${detail}`)
    else console.log(`PASS ${name}${detail ? ` (${detail})` : ''}`)
  }

  // Control A: two seeds → different lengths at same stop index
  {
    const stops = route.map(({ id, index }) => ({ id, index }))
    const a = attachRampLengths(stops, 1).rampLengths
    const b = attachRampLengths(stops, 2).rampLengths
    const differ = a.some((v, i) => Math.abs(v - b[i]) > 1e-9)
    ok(
      'A_seed_lengths_differ',
      differ,
      `stop0 ${a[0].toFixed(3)} vs ${b[0].toFixed(3)}`
    )
  }

  // Control A2: two offset seeds → different peaks
  {
    const stops = route.map(({ id, index }) => ({ id, index }))
    const a = attachRampOffsets(stops, 11).rampOffsets
    const b = attachRampOffsets(stops, 22).rampOffsets
    const differ = a.some((v, i) => Math.abs(v - b[i]) > 1e-9)
    ok(
      'A2_seed_offsets_differ',
      differ,
      `stop0 ${a[0].toFixed(3)} vs ${b[0].toFixed(3)}`
    )
  }

  // Control B: mainline mid-leg rampAt ≈ 0
  {
    const mid = LEG_LENGTH / 2
    const peak = Math.abs(rampAt(mid))
    ok('B_midleg_rampAt_near_zero', peak < 1e-6, `rampAt(${mid})=${peak}`)
  }

  // Invariant: 2 * length < legLength
  {
    let all = true
    let worst = Infinity
    for (let i = 0; i < rampLengths.length; i += 1) {
      const len = rampLengths[i]
      const gap = LEG_LENGTH - 2 * len
      if (gap <= 0) all = false
      worst = Math.min(worst, gap)
    }
    ok('inv_mainline_gap', all, `min_gap=${worst.toFixed(3)}m`)
  }

  // Mid-ramp sample matches that stop's length (progress in (0,1))
  {
    const index = 2
    const len = rampLengthFor(index)
    const s = index * LEG_LENGTH - len * 0.5
    const lateral = rampAt(s)
    const peak = rampOffsetFor(index)
    const progress = lateral / peak
    ok(
      'mid_ramp_progress',
      progress > 0.05 && progress < 0.99,
      `s=${s.toFixed(1)} progress=${progress.toFixed(3)} len=${len.toFixed(1)}`
    )
  }

  // Offset band + clears RAMP_SEPARATES
  {
    let band = true
    let clears = true
    const lo = CARRIAGEWAY + RAMP_OFFSET_EXTRA_MIN
    const hi = CARRIAGEWAY + RAMP_OFFSET_EXTRA_MAX
    for (const off of rampOffsets) {
      if (off < lo - 1e-9 || off > hi + 1e-9) band = false
      if (off <= RAMP_SEPARATES) clears = false
    }
    ok(
      'offset_band',
      band,
      `n=${rampOffsets.length} sample=${rampOffsets[0].toFixed(2)}`
    )
    ok('full_peel_clears_separates', clears, `separates=${RAMP_SEPARATES}`)
  }

  // Park peak = table
  {
    const index = 3
    const s = index * LEG_LENGTH
    const peak = rampAt(s)
    ok(
      'park_peak_matches_table',
      Math.abs(peak - rampOffsetFor(index)) < 1e-9,
      `${peak.toFixed(3)} vs ${rampOffsetFor(index).toFixed(3)}`
    )
  }

  // DROP_HOLD recomputed; mid-descent drop differs from open mainline
  {
    const index = 2
    const len = rampLengthFor(index)
    const hold = dropHolds[index]
    const sMid = index * LEG_LENGTH - len * 0.35
    const dropMid = rampDropAt(sMid)
    const dropOpen = rampDropAt(index * LEG_LENGTH - LEG_LENGTH / 2)
    ok('drop_hold_in_0_1', hold > 0 && hold < 0.9, `hold=${hold.toFixed(3)}`)
    ok(
      'mid_exit_drop_differs_mainline',
      Math.abs(dropMid) > 0.05 && Math.abs(dropOpen) < 1e-6,
      `mid=${dropMid.toFixed(3)} open=${dropOpen}`
    )
  }

  ok(
    'separate_seeds',
    RAMP_LENGTH_SEED !== RAMP_OFFSET_SEED,
    `${RAMP_LENGTH_SEED} vs ${RAMP_OFFSET_SEED}`
  )

  {
    const sim = { ramp: 12.5, x: -0.4 }
    const cx = cameraX(sim)
    ok(
      'cameraX_composition',
      Math.abs(cx - (LANE_OFFSET + 12.5 + -0.4)) < 1e-12,
      `cx=${cx}`
    )
  }

  {
    const u = 0.37
    ok(
      'draw_length_deterministic',
      drawRampLength(u) === drawRampLength(u),
      `${drawRampLength(u)}`
    )
    ok(
      'draw_offset_deterministic',
      drawRampOffset(u) === drawRampOffset(u),
      `${drawRampOffset(u)}`
    )
  }

  console.log(`\nroute stops=${route.length} LEG_LENGTH=${LEG_LENGTH}`)
  console.log(
    'lengths sample',
    rampLengths
      .slice(0, 4)
      .map((v) => v.toFixed(1))
      .join(', ')
  )
  console.log(
    'offsets sample',
    rampOffsets
      .slice(0, 4)
      .map((v) => v.toFixed(1))
      .join(', ')
  )

  if (fails.length) {
    console.error('\nFAILS:')
    for (const f of fails) console.error(' -', f)
    process.exit(1)
  }
  console.log('\nALL CONTROLS PASSED')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
