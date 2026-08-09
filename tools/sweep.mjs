// Sweep the REAL module, not a retyped copy of its constants (guardrail 2).
const m = await import(
  'file:///D:/CT/Work/htae-portfolio/src/components/drive/route.js'
)
const { rampAt, rampDropAt, LEG_LENGTH, RAMP_LENGTH, RAMP_OFFSET } = m
const STEP = 0.25

function sweep(centre, label) {
  const rows = []
  for (let s = centre - RAMP_LENGTH - 4; s <= centre + 4; s += STEP) {
    rows.push({ s: +s.toFixed(2), lat: rampAt(s), drop: rampDropAt(s) })
  }
  let maxDLat = 0,
    maxDDrop = 0,
    atLat = 0,
    atDrop = 0
  let maxD2Lat = 0,
    atD2 = 0
  for (let i = 1; i < rows.length; i++) {
    const dLat = Math.abs(rows[i].lat - rows[i - 1].lat)
    const dDrop = Math.abs(rows[i].drop - rows[i - 1].drop)
    if (dLat > maxDLat) {
      maxDLat = dLat
      atLat = rows[i].s
    }
    if (dDrop > maxDDrop) {
      maxDDrop = dDrop
      atDrop = rows[i].s
    }
    if (i > 1) {
      const d2 = Math.abs(
        rows[i].lat - rows[i - 1].lat - (rows[i - 1].lat - rows[i - 2].lat)
      )
      if (d2 > maxD2Lat) {
        maxD2Lat = d2
        atD2 = rows[i].s
      }
    }
  }
  console.log(`\n--- ${label} (centre ${centre}) ---`)
  console.log(
    `  max |d lat|  = ${maxDLat.toFixed(6)} m per ${STEP}m  at s=${atLat}`
  )
  console.log(
    `  max |d drop| = ${maxDDrop.toFixed(6)} m per ${STEP}m  at s=${atDrop}`
  )
  console.log(
    `  max |d2 lat| = ${maxD2Lat.toFixed(
      6
    )}  at s=${atD2}   <- a kink shows up here`
  )
  const merge = rows.find((r) => r.s >= centre - RAMP_LENGTH)
  console.log(
    `  at merge point s=${merge.s}: lat=${merge.lat.toFixed(
      6
    )} drop=${merge.drop.toFixed(6)}`
  )
  return { maxDLat, maxD2Lat, maxDDrop }
}

console.log(
  `LEG_LENGTH=${LEG_LENGTH} RAMP_LENGTH=${RAMP_LENGTH} RAMP_OFFSET=${RAMP_OFFSET} grid=${STEP}m`
)
const stop = sweep(LEG_LENGTH, 'MERGE at a stop')
const ctrl = sweep(
  LEG_LENGTH * 0.5 + LEG_LENGTH,
  'CONTROL: open mainline (must be flat zero)'
)
console.log('\n=== VERDICT ===')
console.log(
  'control flat?',
  ctrl.maxDLat === 0 && ctrl.maxDDrop === 0
    ? 'YES (sampler trustworthy)'
    : 'NO -> SAMPLER IS WRONG, ignore the merge numbers'
)
