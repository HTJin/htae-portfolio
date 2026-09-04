import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  CAM_HEIGHT,
  CARRIAGEWAY,
  LANE_WIDTH,
  LANES,
  MEDIAN_WIDTH,
  OPPOSING_EDGE,
  Z_FAR,
  cameraX,
  curveAt,
  hillAt,
} from './world'
import {
  BANK_TOP_OFFSET,
  RAMP_DROP,
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
 * The renderer is the only thing replaced. world.js, route.js and daylight.js are
 * all reused, so the road, the route and the time of day stay one definition.
 *
 * The canvas is TRANSPARENT on purpose. `<Sky>` is a DOM layer underneath that
 * paints the gradient, the sun glow and the moon. An earlier version of this file
 * set `<color attach="background">`, which painted an opaque slab straight over
 * it and turned a sunset into a black void.
 */

const SEG = 260
const c3 = (rgb) => new THREE.Color(rgb)

function ribbon(at, span = Z_FAR, segments = SEG) {
  const g = new THREE.BufferGeometry()
  const pos = []
  const idx = []
  for (let i = 0; i <= segments; i++) {
    const s = (i / segments) * span
    const { x, y, w } = at(s)
    pos.push(x, y, -s, x + w, y, -s)
    if (i < segments) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** A surface whose colour tracks the daylight palette rather than being typed. */
function Surface({ build, pick, unlit = false }) {
  const geo = useMemo(build, [build])
  const mat = useRef()
  useFrame(({ scene }) => {
    const c = scene.userData.colors
    if (c && mat.current) mat.current.color.set(pick(c))
  })
  return (
    <mesh geometry={geo}>
      {unlit ? (
        <meshBasicMaterial ref={mat} side={THREE.DoubleSide} />
      ) : (
        <meshStandardMaterial ref={mat} roughness={0.95} side={THREE.DoubleSide} />
      )}
    </mesh>
  )
}

/** A vertical strip along the road: median barrier, roadside guardrail. */
function Wall({ at, height, pick }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = []
    const idx = []
    for (let i = 0; i <= SEG; i++) {
      const s = (i / SEG) * Z_FAR
      const { x, y } = at(s)
      pos.push(x, y, -s, x, y + height, -s)
      if (i < SEG) {
        const a = i * 2
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [at, height])
  const mat = useRef()
  useFrame(({ scene }) => {
    const c = scene.userData.colors
    if (c && mat.current) mat.current.color.set(pick(c))
  })
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial ref={mat} roughness={0.7} side={THREE.DoubleSide} />
    </mesh>
  )
}

/**
 * Painted lines. Dashed lane divider, solid white outer edge, solid yellow against
 * the median, which is the marking a divided highway actually carries.
 */
function Markings() {
  const geo = useMemo(() => {
    const pos = []
    const idx = []
    let v = 0
    const quad = (s, e, off, half) => {
      const x0 = curveAt(s) + off
      const x1 = curveAt(e) + off
      pos.push(
        x0 - half, hillAt(s) + 0.015, -s,
        x0 + half, hillAt(s) + 0.015, -s,
        x1 - half, hillAt(e) + 0.015, -e,
        x1 + half, hillAt(e) + 0.015, -e,
      )
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2)
      v += 4
    }
    const END = Z_FAR * 0.72
    for (let lane = 1; lane < LANES; lane++) {
      for (let s = 4; s < END; s += 15) quad(s, s + 6, lane * LANE_WIDTH, 0.13)
    }
    for (let s = 0; s < END; s += 8) quad(s, s + 8, CARRIAGEWAY - 0.18, 0.13)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    return g
  }, [])
  const mat = useRef()
  useFrame(({ scene }) => {
    const c = scene.userData.colors
    if (c && mat.current) mat.current.color.set(c.paint)
  })
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial ref={mat} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

function MedianLine() {
  const geo = useMemo(() => {
    const pos = []
    const idx = []
    let v = 0
    for (let s = 0; s < Z_FAR * 0.72; s += 8) {
      const e = s + 8
      const x0 = curveAt(s) + 0.2
      const x1 = curveAt(e) + 0.2
      pos.push(
        x0 - 0.13, hillAt(s) + 0.015, -s,
        x0 + 0.13, hillAt(s) + 0.015, -s,
        x1 - 0.13, hillAt(e) + 0.015, -e,
        x1 + 0.13, hillAt(e) + 0.015, -e,
      )
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2)
      v += 4
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    return g
  }, [])
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color="#e8b23c" side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

/** Roadside lamps. The 2D renderer mentions lamps 25 times; dropping them is what
 *  emptied the verge. Instanced so 60 of them cost one draw call. */
function Lamps({ count = 60, spacing = 46 }) {
  const posts = useRef()
  const heads = useRef()
  const headMat = useRef()
  const { postGeo, headGeo } = useMemo(
    () => ({
      postGeo: new THREE.CylinderGeometry(0.09, 0.11, 8, 6),
      headGeo: new THREE.SphereGeometry(0.42, 10, 8),
    }),
    [],
  )
  useFrame(({ scene }) => {
    const c = scene.userData.colors
    if (c && headMat.current) headMat.current.color.set(c.glow)
    if (!posts.current || posts.current.userData.built) return
    const m = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const s = 30 + i * spacing
      const x = curveAt(s) + CARRIAGEWAY + VERGE_WIDTH + 1.4
      m.position.set(x, hillAt(s) + 4, -s)
      m.updateMatrix()
      posts.current.setMatrixAt(i, m.matrix)
      m.position.set(x - 0.9, hillAt(s) + 8, -s)
      m.updateMatrix()
      heads.current.setMatrixAt(i, m.matrix)
    }
    posts.current.instanceMatrix.needsUpdate = true
    heads.current.instanceMatrix.needsUpdate = true
    posts.current.userData.built = true
  })
  return (
    <>
      <instancedMesh ref={posts} args={[postGeo, undefined, count]}>
        <meshStandardMaterial color="#6a6f78" roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[headGeo, undefined, count]}>
        <meshBasicMaterial ref={headMat} toneMapped={false} />
      </instancedMesh>
    </>
  )
}

/** Distant skyline, so the horizon is a landscape rather than a hard cut. */
function Skyline() {
  const geo = useMemo(() => {
    const pos = []
    const idx = []
    let v = 0
    for (let i = 0; i < 46; i++) {
      const s = Z_FAR * 0.94
      const cx = curveAt(s) + (i - 23) * 46
      const w = 26 + ((i * 37) % 40)
      const h = 9 + ((i * 53) % 26)
      const y = hillAt(s) - 2
      pos.push(cx - w, y, -s, cx + w, y, -s, cx - w * 0.55, y + h, -s, cx + w * 0.55, y + h, -s)
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2)
      v += 4
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    return g
  }, [])
  const mat = useRef()
  useFrame(({ scene }) => {
    const c = scene.userData.colors
    if (c && mat.current) mat.current.color.set(c.skyline)
  })
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial ref={mat} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

/**
 * Camera, plus the per-frame palette read.
 *
 * The palette is stashed on scene.userData so every material can pick the field it
 * needs without each one recomputing paletteAt.
 */
function Driver({ simRef }) {
  useFrame(({ camera, scene }) => {
    const sim = simRef.current
    if (!sim) return
    const colors = paletteAt(routeLength > 0 ? sim.travel / routeLength : 0)
    scene.userData.colors = colors
    if (scene.fog) scene.fog.color.set(colors.skyHorizon)

    const s = sim.travel
    // cameraX already returns the offset INTO the carriageway from the median edge.
    const lat = cameraX(sim)
    camera.position.set(curveAt(s) + lat, hillAt(s) + rampDropAt(s) + CAM_HEIGHT, -s)
    const a = s + 55
    camera.lookAt(curveAt(a) + lat, hillAt(a) + rampDropAt(a) + CAM_HEIGHT * 0.85, -a)
  })
  return null
}

const mainline = () => ribbon((s) => ({ x: curveAt(s), y: hillAt(s), w: CARRIAGEWAY }))
const opposing = () =>
  ribbon((s) => ({ x: curveAt(s) - OPPOSING_EDGE, y: hillAt(s), w: CARRIAGEWAY }))
const verge = () =>
  ribbon((s) => ({ x: curveAt(s) + CARRIAGEWAY, y: hillAt(s), w: VERGE_WIDTH }))
const bank = () =>
  ribbon((s) => ({ x: curveAt(s) + BANK_TOP_OFFSET, y: hillAt(s) - 3.2, w: 40 }))
const median = () =>
  ribbon((s) => ({ x: curveAt(s) - MEDIAN_WIDTH, y: hillAt(s) - 0.05, w: MEDIAN_WIDTH }))

/** The exit ramp diverges by rampAt and descends by rampDropAt beneath the
 *  mainline. This is the intersection the 2D renderer could not resolve. */
const ramp = () =>
  ribbon((s) => ({
    x: curveAt(s) + CARRIAGEWAY + rampAt(s),
    y: hillAt(s) + rampDropAt(s),
    w: RAMP_WIDTH,
  }))

const medianEdge = (s) => ({ x: curveAt(s) - MEDIAN_WIDTH / 2, y: hillAt(s) })
const roadsideEdge = (s) => ({ x: curveAt(s) + CARRIAGEWAY + VERGE_WIDTH, y: hillAt(s) })

export function RoadScene({ drive, simRef, className }) {
  const ref = drive?.simRef ?? simRef
  return (
    <Canvas
      className={className}
      // alpha so <Sky> shows through. logarithmicDepthBuffer because the scene spans
      // 2.4m to 980m and a plain 24-bit buffer z-fights where the ramp meets the
      // mainline, which is the artefact this port exists to remove.
      gl={{ antialias: true, alpha: true, logarithmicDepthBuffer: true }}
      camera={{ fov: 62, near: 0.4, far: Z_FAR * 1.6 }}
      dpr={[1, 2]}
    >
      {/* Fog colour is set per frame from the palette, so haze matches the sky
          instead of fading everything to black. */}
      <fog attach="fog" args={['#e28c54', Z_FAR * 0.3, Z_FAR * 0.95]} />
      <hemisphereLight args={['#cbd6ec', '#241d20', 1.15]} />
      <directionalLight position={[60, 70, -120]} intensity={1.0} />

      <Skyline />
      <Surface build={bank} pick={(c) => c.groundFar} />
      <Surface build={median} pick={(c) => c.vergeDark} />
      <Surface build={verge} pick={(c) => c.vergeLight} />
      <Surface build={opposing} pick={(c) => c.tarmacFar} />
      <Surface build={mainline} pick={(c) => c.tarmacNear} />
      <Surface build={ramp} pick={(c) => c.tarmacNear} />

      <Markings />
      <MedianLine />
      <Wall at={medianEdge} height={0.9} pick={(c) => c.vergeLight} />
      <Wall at={roadsideEdge} height={0.75} pick={(c) => c.vergeDark} />
      <Lamps />

      <Driver simRef={ref} />
    </Canvas>
  )
}

export default RoadScene
