import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  CAM_HEIGHT,
  CARRIAGEWAY,
  LANE_WIDTH,
  LANES,
  LANE_OFFSET,
  MEDIAN_WIDTH,
  OPPOSING_EDGE,
  Z_FAR,
  cameraX,
  curveAt,
  hillAt,
} from './world'
import {
  BANK_TOP_OFFSET,
  RAMP_WIDTH,
  VERGE_WIDTH,
  rampAt,
  rampDropAt,
  routeLength,
} from './route'
import { paletteAt } from './daylight'

/**
 * Drive mode rendered with a real depth buffer.
 *
 * RoadCanvas.jsx decides occlusion by paint order, which is why its own comments
 * describe the reported bugs: line 150 "Clamping every vertex to horizon is what
 * painted a flat asphalt bar", line 131 "Two surfaces exist at this depth now".
 * Nothing here sorts anything; the depth test decides what is in front.
 *
 * EVERYTHING IS CAMERA RELATIVE.
 *
 * The first version built the road once, in world space, from 0 to Z_FAR. The
 * camera keeps travelling, so past 980m you simply drove off the end of the
 * geometry and the road vanished, leaving the ground plane and a trail of lamps
 * that had been placed further out. Geometry is now rebuilt every frame from the
 * car's own position, into buffers allocated once. Nothing is allocated per frame
 * and nothing is ever behind the camera, which is also why this is cheaper than
 * the version that drew a kilometre of road whether or not it was visible.
 *
 * world.js, route.js and daylight.js are reused unchanged.
 */

// Samples along the road. 96 is enough because spacing is quadratic: dense in the
// near field where a metre is many pixels, sparse at the horizon where it is not.
// The old build used 260 evenly spaced, which spent most of its vertices past 600m
// where they were smaller than a pixel.
const SEG = 96
const VIEW = 620 // metres drawn ahead. Beyond this the fog has closed anyway.
const sampleZ = (i) => ((i / SEG) ** 2) * VIEW

/**
 * A ribbon whose vertices are rewritten in place each frame.
 *
 * `at(s, out)` fills `out` with the left edge, height and width at `s` metres
 * AHEAD OF THE CAR, so the geometry never runs out however far you drive.
 */
function useRibbon(at) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array((SEG + 1) * 2 * 3)
    const idx = []
    for (let i = 0; i < SEG; i++) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6) // never frustum-culled
    return g
  }, [])
  const out = useRef({ x: 0, y: 0, w: 0 }).current
  const update = (travel) => {
    const arr = geo.attributes.position.array
    let p = 0
    for (let i = 0; i <= SEG; i++) {
      const s = sampleZ(i)
      at(travel + s, out)
      arr[p++] = out.x
      arr[p++] = out.y
      arr[p++] = -(travel + s)
      arr[p++] = out.x + out.w
      arr[p++] = out.y
      arr[p++] = -(travel + s)
    }
    geo.attributes.position.needsUpdate = true
  }
  return { geo, update }
}

function Ribbon({ at, pick, registry }) {
  const { geo, update } = useRibbon(at)
  const mat = useRef()
  registry.current.push({ update, mat, pick })
  return (
    <mesh geometry={geo} frustumCulled={false}>
      <meshBasicMaterial ref={mat} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

/**
 * Lamps, recycled.
 *
 * Owner: "decrease the number of light posts, they are needlessly taking away the
 * performance. only render the ones that are within a few distance from the car."
 * Twelve instances are reused forever: each frame every lamp is snapped to the next
 * multiple of SPACING ahead of the car, so the same twelve objects walk down the
 * road with you and nothing is drawn behind or beyond the fog.
 */
const LAMPS = 12
const LAMP_SPACING = 52

function Lamps({ registry }) {
  const posts = useRef()
  const heads = useRef()
  const headMat = useRef()
  const geoms = useMemo(
    () => ({
      post: new THREE.CylinderGeometry(0.1, 0.13, 8.4, 5),
      head: new THREE.SphereGeometry(0.5, 8, 6),
    }),
    [],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  registry.current.push({
    lamps: (travel, colors) => {
      if (!posts.current || !heads.current) return
      if (headMat.current) headMat.current.color.set(colors.glow)
      const first = Math.ceil(travel / LAMP_SPACING) * LAMP_SPACING
      for (let i = 0; i < LAMPS; i++) {
        const s = first + i * LAMP_SPACING
        const x = curveAt(s) + CARRIAGEWAY + VERGE_WIDTH + 1.5
        const y = hillAt(s)
        dummy.position.set(x, y + 4.2, -s)
        dummy.updateMatrix()
        posts.current.setMatrixAt(i, dummy.matrix)
        dummy.position.set(x - 0.85, y + 8.4, -s)
        dummy.updateMatrix()
        heads.current.setMatrixAt(i, dummy.matrix)
      }
      posts.current.instanceMatrix.needsUpdate = true
      heads.current.instanceMatrix.needsUpdate = true
    },
  })
  return (
    <>
      <instancedMesh ref={posts} args={[geoms.post, undefined, LAMPS]} frustumCulled={false}>
        <meshBasicMaterial color="#4a4f58" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[geoms.head, undefined, LAMPS]} frustumCulled={false}>
        <meshBasicMaterial ref={headMat} toneMapped={false} />
      </instancedMesh>
    </>
  )
}

/** Dashed lane line and solid edges, also rewritten in place from the car. */
function Markings({ registry }) {
  const N = 26
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(N * 3 * 4 * 3)
    const idx = []
    for (let q = 0; q < N * 3; q++) {
      const v = q * 4
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
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
        const y0 = hillAt(s) + 0.02
        const y1 = hillAt(e) + 0.02
        arr[p++] = x0 - half; arr[p++] = y0; arr[p++] = -s
        arr[p++] = x0 + half; arr[p++] = y0; arr[p++] = -s
        arr[p++] = x1 - half; arr[p++] = y1; arr[p++] = -e
        arr[p++] = x1 + half; arr[p++] = y1; arr[p++] = -e
      }
      const base = Math.floor(travel / 15) * 15
      for (let i = 0; i < N; i++) {
        const s = base + i * 15
        quad(s, s + 6, LANE_WIDTH, 0.14) // dashed lane divider
        quad(s, s + 15, CARRIAGEWAY - 0.2, 0.14) // solid white outer edge
        quad(s, s + 15, 0.22, 0.14) // solid yellow against the median
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

/**
 * One useFrame for the whole scene.
 *
 * Every surface registers an updater and this drives them all, so the palette is
 * computed once per frame rather than once per material, and there is exactly one
 * render-loop callback instead of a dozen.
 */
function Director({ simRef, registry }) {
  useFrame(({ camera, scene }) => {
    const sim = simRef.current
    if (!sim) return
    const travel = sim.travel
    const colors = paletteAt(routeLength > 0 ? travel / routeLength : 0)
    if (scene.fog) scene.fog.color.set(colors.skyHorizon)

    const lat = cameraX(sim)
    camera.position.set(curveAt(travel) + lat, hillAt(travel) + rampDropAt(travel) + CAM_HEIGHT, -travel)
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

// Each surface as a function of absolute distance, filling a reused object.
const mainline = (s, o) => { o.x = curveAt(s); o.y = hillAt(s); o.w = CARRIAGEWAY }
const opposing = (s, o) => { o.x = curveAt(s) - OPPOSING_EDGE; o.y = hillAt(s); o.w = CARRIAGEWAY }
const median = (s, o) => { o.x = curveAt(s) - MEDIAN_WIDTH; o.y = hillAt(s) - 0.06; o.w = MEDIAN_WIDTH }
const verge = (s, o) => { o.x = curveAt(s) + CARRIAGEWAY; o.y = hillAt(s); o.w = VERGE_WIDTH }
/**
 * Ground either side, following the ramp down.
 *
 * These were flat planes at road level minus 3.4m. An exit drops the car 5.5m via
 * rampDropAt, and the car's lateral position on a full ramp is x = 36.4, which sits
 * inside this surface's own span of 10.6 to 56.6. So the eye ended up at y = -4.15
 * underneath a plane at y = -3.40: a horizontal grey slab across the view, hiding
 * the lamps and the highway until the ramp climbed back to level. Exactly what the
 * owner described.
 *
 * Terrain now carries rampDropAt, so the ground beside a descending ramp descends
 * with it and can never close over the driver. Away from an exit rampDropAt is 0,
 * so the level road is unchanged.
 */
const GROUND_BELOW = 3.4
const bank = (s, o) => {
  o.x = curveAt(s) + BANK_TOP_OFFSET
  o.y = hillAt(s) + rampDropAt(s) - GROUND_BELOW
  o.w = 46
}
const farSide = (s, o) => {
  o.x = curveAt(s) - OPPOSING_EDGE - 46
  o.y = hillAt(s) + rampDropAt(s) - GROUND_BELOW
  o.w = 46
}
// The ramp is the road the CAR is carried onto, not a strip beside it. cameraX adds
// sim.ramp to the lane offset, so the eye moves sideways by rampAt; the ramp surface has
// to move with it or the car ends up driving 2m to the left of its own road, which is
// what left the mainline hanging off the edge of the screen at 2000m.
const ramp = (s, o) => {
  o.x = curveAt(s) + rampAt(s) + LANE_OFFSET - RAMP_WIDTH / 2
  o.y = hillAt(s) + rampDropAt(s)
  o.w = RAMP_WIDTH
}

export function RoadScene({ drive, simRef, className }) {
  const ref = drive?.simRef ?? simRef
  const registry = useRef([])
  registry.current = []
  return (
    <Canvas
      className={className}
      // alpha so <Sky> shows through; it draws the gradient, sun glow and moon.
      // Unlit basic materials throughout, so no light has to be evaluated per
      // fragment: the palette already encodes the lighting for the time of day.
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 62, near: 0.5, far: VIEW * 1.3 }}
      dpr={[1, 1.5]}
      flat
    >
      <fog attach="fog" args={['#e28c54', VIEW * 0.35, VIEW]} />

      <Ribbon at={farSide} pick={(c) => c.groundFar} registry={registry} />
      <Ribbon at={bank} pick={(c) => c.groundFar} registry={registry} />
      <Ribbon at={median} pick={(c) => c.vergeDark} registry={registry} />
      <Ribbon at={verge} pick={(c) => c.vergeLight} registry={registry} />
      <Ribbon at={opposing} pick={(c) => c.tarmacFar} registry={registry} />
      <Ribbon at={mainline} pick={(c) => c.tarmacNear} registry={registry} />
      <Ribbon at={ramp} pick={(c) => c.tarmacNear} registry={registry} />

      <Markings registry={registry} />
      <Lamps registry={registry} />

      <Director simRef={ref} registry={registry} />
    </Canvas>
  )
}

export default RoadScene
