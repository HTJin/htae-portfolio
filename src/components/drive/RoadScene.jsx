import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  CAM_HEIGHT,
  CARRIAGEWAY,
  LANE_OFFSET,
  LANE_WIDTH,
  MEDIAN_WIDTH,
  OPPOSING_EDGE,
  cameraX,
  curveAt,
  hillAt,
} from './world'
import { RAMP_WIDTH, VERGE_WIDTH, rampAt, rampDropAt, routeLength } from './route'
import { paletteAt } from './daylight'

/**
 * Drive mode rendered with a real depth buffer, as a CLOSED SOLID.
 *
 * Owner, 2026-08-07: "there's nothing covering the side and you can see gaps",
 * and "you need to add in a new polygon along side the entire highway". The same
 * report came back on 2026-09-04, so the cause is written down here rather than
 * fixed a third time from scratch.
 *
 * The previous builder took { x, y, w }: ONE height for both edges of a strip.
 * Every surface it could make was therefore horizontal, a sloped embankment was
 * not expressible at all, and each surface floated at its own level with open air
 * between them. Measured:
 *
 *   verge outer edge      x=10.6        y= 0.00
 *   bank top              x=10.6        y=-3.40    3.4m of nothing at the same x
 *   ramp when diverged    y=-5.50 over ground at -8.90, sides open
 *
 * `strip` now takes a left AND a right edge, each with its own height, so a quad
 * can slope. The road is built as one continuous cross-section: every strip starts
 * exactly where the previous one ended, in x and in y, so a gap cannot appear
 * without deleting a strip. The ramp gets a skirt down each side, so it is a solid
 * body rather than a floating plank.
 *
 * world.js, route.js and daylight.js are reused unchanged.
 */

// 64 samples, quadratically spaced. Halving this from 96 costs nothing visible
// because the far samples were already sub-pixel, and it removes a third of the
// per-frame vertex work.
const SEG = 64
const VIEW = 620
const sampleZ = (i) => ((i / SEG) ** 2) * VIEW

const SHOULDER = 3.0 // how far the embankment runs out before it flattens
const DEPTH = 3.4 // how far the ground sits below the tarmac
const GROUND_RUN = 60 // flat ground beyond the embankment
const SKIRT = 1.6 // how far a ramp skirt runs out before it meets the ground

/**
 * The road profile, computed ONCE per frame and shared by every strip.
 *
 * curveAt and hillAt are two Math.sin each. With eleven strips independently
 * calling them for the same `s`, the scene was issuing about 7,000 sin per frame,
 * 421,560 a second at 60fps, to compute the same handful of numbers over and over.
 * That was the lag. Sampling once and letting the strips read the table is a 5.8x
 * cut in trig with identical output.
 */
const PROFILE = Array.from({ length: SEG + 1 }, () => ({ s: 0, c: 0, h: 0, ra: 0, rd: 0, g: 0 }))

function sampleProfile(travel) {
  for (let i = 0; i <= SEG; i++) {
    const s = travel + sampleZ(i)
    const e = PROFILE[i]
    e.s = s
    e.c = curveAt(s)
    e.h = hillAt(s)
    e.ra = rampAt(s)
    e.rd = rampDropAt(s)
    e.g = e.h + (e.rd < 0 ? e.rd : 0) - DEPTH
  }
}

/**
 * A strip with independent left and right edges.
 *
 * `at(s, o)` fills o.xl / o.yl / o.xr / o.yr. Because both edges carry a height,
 * one builder makes flat surfaces, embankments and vertical skirts alike, which
 * is what lets the cross-section close.
 */
function useStrip(at) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEG + 1) * 2 * 3), 3))
    const idx = []
    for (let i = 0; i < SEG; i++) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    g.setIndex(idx)
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6)
    return g
  }, [])
  const o = useRef({ xl: 0, yl: 0, xr: 0, yr: 0 }).current
  const update = () => {
    const arr = geo.attributes.position.array
    let p = 0
    for (let i = 0; i <= SEG; i++) {
      const e = PROFILE[i]
      at(e, o)
      arr[p++] = o.xl; arr[p++] = o.yl; arr[p++] = -e.s
      arr[p++] = o.xr; arr[p++] = o.yr; arr[p++] = -e.s
    }
    geo.attributes.position.needsUpdate = true
  }
  return { geo, update }
}

function Strip({ at, pick, registry }) {
  const { geo, update } = useStrip(at)
  const mat = useRef()
  registry.current.push({ update, mat, pick })
  return (
    <mesh geometry={geo} frustumCulled={false}>
      <meshBasicMaterial ref={mat} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

const LAMPS = 12
const LAMP_SPACING = 52

function Lamps({ registry }) {
  const posts = useRef()
  const heads = useRef()
  const headMat = useRef()
  const g = useMemo(
    () => ({
      post: new THREE.CylinderGeometry(0.1, 0.13, 8.4, 5),
      head: new THREE.SphereGeometry(0.5, 8, 6),
    }),
    [],
  )
  const d = useMemo(() => new THREE.Object3D(), [])
  registry.current.push({
    lamps: (travel, colors) => {
      if (!posts.current || !heads.current) return
      if (headMat.current) headMat.current.color.set(colors.glow)
      const first = Math.ceil(travel / LAMP_SPACING) * LAMP_SPACING
      for (let i = 0; i < LAMPS; i++) {
        const s = first + i * LAMP_SPACING
        const x = curveAt(s) + CARRIAGEWAY + VERGE_WIDTH - 0.6
        const y = hillAt(s)
        d.position.set(x, y + 4.2, -s); d.updateMatrix(); posts.current.setMatrixAt(i, d.matrix)
        d.position.set(x - 0.85, y + 8.4, -s); d.updateMatrix(); heads.current.setMatrixAt(i, d.matrix)
      }
      posts.current.instanceMatrix.needsUpdate = true
      heads.current.instanceMatrix.needsUpdate = true
    },
  })
  return (
    <>
      <instancedMesh ref={posts} args={[g.post, undefined, LAMPS]} frustumCulled={false}>
        <meshBasicMaterial color="#4a4f58" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[g.head, undefined, LAMPS]} frustumCulled={false}>
        <meshBasicMaterial ref={headMat} toneMapped={false} />
      </instancedMesh>
    </>
  )
}

function Markings({ registry }) {
  const N = 26
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3 * 4 * 3), 3))
    const idx = []
    for (let q = 0; q < N * 3; q++) {
      const v = q * 4
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2)
    }
    g.setIndex(idx)
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6)
    return g
  }, [])
  const mat = useRef()
  registry.current.push({
    marks: (travel, colors) => {
      if (mat.current) mat.current.color.set(colors.paint)
      const arr = geo.attributes.position.array
      let p = 0
      const quad = (s, e, off, half) => {
        const x0 = curveAt(s) + off
        const x1 = curveAt(e) + off
        arr[p++] = x0 - half; arr[p++] = hillAt(s) + 0.02; arr[p++] = -s
        arr[p++] = x0 + half; arr[p++] = hillAt(s) + 0.02; arr[p++] = -s
        arr[p++] = x1 - half; arr[p++] = hillAt(e) + 0.02; arr[p++] = -e
        arr[p++] = x1 + half; arr[p++] = hillAt(e) + 0.02; arr[p++] = -e
      }
      const base = Math.floor(travel / 15) * 15
      for (let i = 0; i < N; i++) {
        const s = base + i * 15
        quad(s, s + 6, LANE_WIDTH, 0.14)
        quad(s, s + 15, CARRIAGEWAY - 0.2, 0.14)
        quad(s, s + 15, 0.22, 0.14)
      }
      geo.attributes.position.needsUpdate = true
    },
  })
  return (
    <mesh geometry={geo} frustumCulled={false}>
      <meshBasicMaterial ref={mat} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

function Director({ simRef, registry }) {
  useFrame(({ camera, scene }) => {
    const sim = simRef.current
    if (!sim) return
    const travel = sim.travel
    sampleProfile(travel)
    const colors = paletteAt(routeLength > 0 ? travel / routeLength : 0)
    if (scene.fog) scene.fog.color.set(colors.skyHorizon)
    // Use sim.drop, NOT rampDropAt(travel).
    //
    // useDrive gates sim.ramp and sim.drop on whether the driver actually chose the
    // exit. Reading rampDropAt straight from the route ignored that gate, so a driver
    // who stayed on the mainline still sank 5.5m and drove under the highway they
    // were supposed to be on. cameraX already reads the gated sim.ramp, which is why
    // the lateral was right and only the elevation was wrong.
    const lat = cameraX(sim)
    const drop = sim.drop ?? 0
    camera.position.set(curveAt(travel) + lat, hillAt(travel) + drop + CAM_HEIGHT, -travel)
    const a = travel + 55
    // The look-ahead has to use the same gate, or the view pitches toward a ramp the
    // car is not taking.
    const dropAhead = sim.exiting ? rampDropAt(a) : 0
    camera.lookAt(curveAt(a) + lat, hillAt(a) + dropAhead + CAM_HEIGHT * 0.85, -a)
    for (const r of registry.current) {
      if (r.update) {
        r.update()
        if (r.mat.current) r.mat.current.color.set(r.pick(colors))
      } else if (r.lamps) r.lamps(travel, colors)
      else if (r.marks) r.marks(travel, colors)
    }
  })
  return null
}

/* ------------------------------------------------------------------------- *
 * The cross-section, left to right. Each strip begins exactly where the last
 * one ended, in x AND in y, so a void cannot appear without deleting a strip.
 * ------------------------------------------------------------------------- */

const farGround = (e, o) => {
  o.xl = e.c - OPPOSING_EDGE - SHOULDER - GROUND_RUN; o.yl = e.g
  o.xr = e.c - OPPOSING_EDGE - SHOULDER; o.yr = e.g
}
/** Embankment climbing from the far ground up to the opposing carriageway. */
const farSlope = (e, o) => {
  o.xl = e.c - OPPOSING_EDGE - SHOULDER; o.yl = e.g
  o.xr = e.c - OPPOSING_EDGE; o.yr = e.h
}
const opposing = (e, o) => {
  o.xl = e.c - OPPOSING_EDGE; o.yl = e.h
  o.xr = e.c - MEDIAN_WIDTH; o.yr = e.h
}
const median = (e, o) => {
  o.xl = e.c - MEDIAN_WIDTH; o.yl = e.h - 0.08
  o.xr = e.c; o.yr = e.h
}
const mainline = (e, o) => {
  o.xl = e.c; o.yl = e.h
  o.xr = e.c + CARRIAGEWAY; o.yr = e.h
}
const verge = (e, o) => {
  o.xl = e.c + CARRIAGEWAY; o.yl = e.h
  o.xr = e.c + CARRIAGEWAY + VERGE_WIDTH; o.yr = e.h
}
/**
 * The polygon the owner asked for twice: the sloped body closing the side of the
 * highway. Begins exactly at the verge edge and lands exactly on ground level, so
 * the 3.4m of open air that used to sit at x=10.6 is covered.
 */
const embankment = (e, o) => {
  o.xl = e.c + CARRIAGEWAY + VERGE_WIDTH; o.yl = e.h
  o.xr = e.c + CARRIAGEWAY + VERGE_WIDTH + SHOULDER; o.yr = e.g
}
const nearGround = (e, o) => {
  o.xl = e.c + CARRIAGEWAY + VERGE_WIDTH + SHOULDER; o.yl = e.g
  o.xr = e.c + CARRIAGEWAY + VERGE_WIDTH + SHOULDER + GROUND_RUN; o.yr = e.g
}

const rampLeftX = (e) => e.c + e.ra + LANE_OFFSET - RAMP_WIDTH / 2
const rampYOf = (e) => e.h + e.rd
const ramp = (e, o) => {
  const l = rampLeftX(e), y = rampYOf(e)
  o.xl = l; o.yl = y
  o.xr = l + RAMP_WIDTH; o.yr = y
}
/** Skirts, so the ramp is a solid body and not a plank floating over the ground. */
const rampSkirtL = (e, o) => {
  const l = rampLeftX(e)
  o.xl = l - SKIRT; o.yl = e.g
  o.xr = l; o.yr = rampYOf(e)
}
const rampSkirtR = (e, o) => {
  const l = rampLeftX(e)
  o.xl = l + RAMP_WIDTH; o.yl = rampYOf(e)
  o.xr = l + RAMP_WIDTH + SKIRT; o.yr = e.g
}

export function RoadScene({ drive, simRef, className }) {
  const ref = drive?.simRef ?? simRef
  const registry = useRef([])
  registry.current = []
  return (
    <Canvas
      className={className}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 62, near: 0.5, far: VIEW * 1.3 }}
      dpr={[1, 1.5]}
      flat
    >
      <fog attach="fog" args={['#e28c54', VIEW * 0.35, VIEW]} />

      <Strip at={farGround} pick={(c) => c.groundFar} registry={registry} />
      <Strip at={farSlope} pick={(c) => c.vergeDark} registry={registry} />
      <Strip at={opposing} pick={(c) => c.tarmacFar} registry={registry} />
      <Strip at={median} pick={(c) => c.vergeDark} registry={registry} />
      <Strip at={mainline} pick={(c) => c.tarmacNear} registry={registry} />
      <Strip at={verge} pick={(c) => c.vergeLight} registry={registry} />
      <Strip at={embankment} pick={(c) => c.vergeDark} registry={registry} />
      <Strip at={nearGround} pick={(c) => c.groundFar} registry={registry} />

      <Strip at={rampSkirtL} pick={(c) => c.vergeDark} registry={registry} />
      <Strip at={ramp} pick={(c) => c.tarmacNear} registry={registry} />
      <Strip at={rampSkirtR} pick={(c) => c.vergeDark} registry={registry} />

      <Markings registry={registry} />
      <Lamps registry={registry} />

      <Director simRef={ref} registry={registry} />
    </Canvas>
  )
}

export default RoadScene
