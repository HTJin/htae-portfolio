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

const SEG = 96
const VIEW = 620
const sampleZ = (i) => ((i / SEG) ** 2) * VIEW

const SHOULDER = 3.0 // how far the embankment runs out before it flattens
const DEPTH = 3.4 // how far the ground sits below the tarmac
const GROUND_RUN = 60 // flat ground beyond the embankment
const SKIRT = 1.6 // how far a ramp skirt runs out before it meets the ground

/** Ground level at `s`. Follows the ramp down so terrain never closes over the car. */
const groundY = (s) => hillAt(s) + Math.min(0, rampDropAt(s)) - DEPTH

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
  const update = (travel) => {
    const arr = geo.attributes.position.array
    let p = 0
    for (let i = 0; i <= SEG; i++) {
      const s = travel + sampleZ(i)
      at(s, o)
      arr[p++] = o.xl; arr[p++] = o.yl; arr[p++] = -s
      arr[p++] = o.xr; arr[p++] = o.yr; arr[p++] = -s
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
    const colors = paletteAt(routeLength > 0 ? travel / routeLength : 0)
    if (scene.fog) scene.fog.color.set(colors.skyHorizon)
    const lat = cameraX(sim)
    camera.position.set(
      curveAt(travel) + lat,
      hillAt(travel) + rampDropAt(travel) + CAM_HEIGHT,
      -travel,
    )
    const a = travel + 55
    camera.lookAt(curveAt(a) + lat, hillAt(a) + rampDropAt(a) + CAM_HEIGHT * 0.85, -a)
    for (const r of registry.current) {
      if (r.update) {
        r.update(travel)
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

const farGround = (s, o) => {
  const c = curveAt(s), g = groundY(s)
  o.xl = c - OPPOSING_EDGE - SHOULDER - GROUND_RUN; o.yl = g
  o.xr = c - OPPOSING_EDGE - SHOULDER; o.yr = g
}
/** Embankment climbing from the far ground up to the opposing carriageway. */
const farSlope = (s, o) => {
  const c = curveAt(s)
  o.xl = c - OPPOSING_EDGE - SHOULDER; o.yl = groundY(s)
  o.xr = c - OPPOSING_EDGE; o.yr = hillAt(s)
}
const opposing = (s, o) => {
  const c = curveAt(s), y = hillAt(s)
  o.xl = c - OPPOSING_EDGE; o.yl = y
  o.xr = c - MEDIAN_WIDTH; o.yr = y
}
const median = (s, o) => {
  const c = curveAt(s), y = hillAt(s)
  o.xl = c - MEDIAN_WIDTH; o.yl = y - 0.08
  o.xr = c; o.yr = y
}
const mainline = (s, o) => {
  const c = curveAt(s), y = hillAt(s)
  o.xl = c; o.yl = y
  o.xr = c + CARRIAGEWAY; o.yr = y
}
const verge = (s, o) => {
  const c = curveAt(s), y = hillAt(s)
  o.xl = c + CARRIAGEWAY; o.yl = y
  o.xr = c + CARRIAGEWAY + VERGE_WIDTH; o.yr = y
}
/**
 * The polygon the owner asked for twice: the sloped body closing the side of the
 * highway. Begins exactly at the verge edge and lands exactly on ground level, so
 * the 3.4m of open air that used to sit at x=10.6 is now covered.
 */
const embankment = (s, o) => {
  o.xl = curveAt(s) + CARRIAGEWAY + VERGE_WIDTH; o.yl = hillAt(s)
  o.xr = curveAt(s) + CARRIAGEWAY + VERGE_WIDTH + SHOULDER; o.yr = groundY(s)
}
const nearGround = (s, o) => {
  const c = curveAt(s), g = groundY(s)
  o.xl = c + CARRIAGEWAY + VERGE_WIDTH + SHOULDER; o.yl = g
  o.xr = c + CARRIAGEWAY + VERGE_WIDTH + SHOULDER + GROUND_RUN; o.yr = g
}

const rampLeftX = (s) => curveAt(s) + rampAt(s) + LANE_OFFSET - RAMP_WIDTH / 2
const rampY = (s) => hillAt(s) + rampDropAt(s)
const ramp = (s, o) => {
  const l = rampLeftX(s), y = rampY(s)
  o.xl = l; o.yl = y
  o.xr = l + RAMP_WIDTH; o.yr = y
}
/** Skirts, so the ramp is a solid body and not a plank floating over the ground. */
const rampSkirtL = (s, o) => {
  const l = rampLeftX(s)
  o.xl = l - SKIRT; o.yl = groundY(s)
  o.xr = l; o.yr = rampY(s)
}
const rampSkirtR = (s, o) => {
  const l = rampLeftX(s)
  o.xl = l + RAMP_WIDTH; o.yl = rampY(s)
  o.xr = l + RAMP_WIDTH + SKIRT; o.yr = groundY(s)
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
