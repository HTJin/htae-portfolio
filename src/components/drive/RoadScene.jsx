import { useMemo } from 'react'
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
} from './route'

/**
 * Drive mode rendered with a real depth buffer.
 *
 * RoadCanvas.jsx decides occlusion by paint order, which is why its own comments
 * describe the reported bugs: line 150 "Clamping every vertex to horizon is what
 * painted a flat asphalt bar", line 131 "Two surfaces exist at this depth now".
 * Those are hand-written answers to a question the GPU answers per pixel.
 *
 * Nothing in this file sorts anything. Every surface is a mesh and the depth test
 * decides what is in front, so the exit ramp cannot show through the ground and a
 * surface at eye height cannot smear into a bar along the horizon.
 *
 * world.js and route.js are reused unchanged. They already describe the road in
 * metres, so this replaces the renderer, not the model.
 */

const SEG = 260

/**
 * Build a ribbon from a function of distance ahead.
 *
 * `at(s)` returns the left edge, the height and the width of a surface at `s`
 * metres. One builder covers both carriageways, the ramp, the verge and the bank,
 * so a change to the road model cannot leave one surface behind.
 */
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

function Surface({ build, color, roughness = 0.95 }) {
  const geo = useMemo(build, [build])
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color={color} roughness={roughness} side={THREE.DoubleSide} />
    </mesh>
  )
}

/** A vertical wall along the road: median barrier, roadside guardrail. */
function Wall({ at, height, color }) {
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
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.7} side={THREE.DoubleSide} />
    </mesh>
  )
}

/** Dashed lane markings, lifted a hair off the tarmac so they never z-fight it. */
function LaneMarkings() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = []
    const idx = []
    let v = 0
    const DASH = 6
    const GAP = 9
    const HALF = 0.14
    for (let lane = 1; lane < LANES; lane++) {
      const off = lane * LANE_WIDTH
      for (let s = 4; s < Z_FAR * 0.7; s += DASH + GAP) {
        const e = s + DASH
        const x0 = curveAt(s) + off
        const x1 = curveAt(e) + off
        pos.push(
          x0 - HALF, hillAt(s) + 0.015, -s,
          x0 + HALF, hillAt(s) + 0.015, -s,
          x1 - HALF, hillAt(e) + 0.015, -e,
          x1 + HALF, hillAt(e) + 0.015, -e,
        )
        idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2)
        v += 4
      }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color="#c9ccd4" side={THREE.DoubleSide} />
    </mesh>
  )
}

function Driver({ simRef }) {
  useFrame(({ camera }) => {
    const sim = simRef.current
    if (!sim) return
    const s = sim.travel
    // cameraX already returns the offset INTO the carriageway, measured from the
    // median edge at x = 0. It is LANE_OFFSET plus the ramp plus steering drift, so
    // it must be added to curveAt as-is. Subtracting CARRIAGEWAY on top of it put the
    // eye out in the median, looking across the road rather than down it.
    const lat = cameraX(sim)
    camera.position.set(curveAt(s) + lat, hillAt(s) + rampDropAt(s) + CAM_HEIGHT, -s)
    const a = s + 55
    camera.lookAt(
      curveAt(a) + lat,
      hillAt(a) + rampDropAt(a) + CAM_HEIGHT * 0.85,
      -a,
    )
  })
  return null
}

const mainline = () => ribbon((s) => ({ x: curveAt(s), y: hillAt(s), w: CARRIAGEWAY }))
const opposing = () =>
  ribbon((s) => ({ x: curveAt(s) - OPPOSING_EDGE, y: hillAt(s), w: CARRIAGEWAY }))
const verge = () =>
  ribbon((s) => ({ x: curveAt(s) + CARRIAGEWAY, y: hillAt(s), w: VERGE_WIDTH }))
const bank = () =>
  ribbon((s) => ({ x: curveAt(s) + BANK_TOP_OFFSET, y: hillAt(s) - 3.2, w: 30 }))

/**
 * The exit ramp diverges laterally by rampAt and descends by rampDropAt, passing
 * beneath the mainline. This is the intersection the 2D renderer could not resolve.
 * Nothing here resolves it either. The depth buffer does.
 */
const ramp = () =>
  ribbon((s) => ({
    x: curveAt(s) + CARRIAGEWAY + rampAt(s),
    y: hillAt(s) + rampDropAt(s),
    w: RAMP_WIDTH,
  }))

const medianEdge = (s) => ({ x: curveAt(s) - MEDIAN_WIDTH / 2, y: hillAt(s) })
const roadsideEdge = (s) => ({ x: curveAt(s) + CARRIAGEWAY + VERGE_WIDTH, y: hillAt(s) })

export function RoadScene({ drive, simRef, className }) {
  // Same props as RoadCanvas so DriveScene swaps one import. `simRef` is accepted
  // directly for the standalone proving page, which drives a minimal sim.
  const ref = drive?.simRef ?? simRef
  return (
    <Canvas
      className={className}
      // logarithmicDepthBuffer because the scene spans 2.4m to 980m. At that range a
      // plain 24-bit buffer z-fights exactly where the ramp meets the mainline, which
      // is the artefact this port exists to remove.
      gl={{ antialias: true, logarithmicDepthBuffer: true }}
      camera={{ fov: 62, near: 0.4, far: Z_FAR * 1.5 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0b0d13']} />
      {/* Haze. The 2D renderer hand-rolled this in 25 places. */}
      <fog attach="fog" args={['#0b0d13', Z_FAR * 0.3, Z_FAR * 0.92]} />
      <hemisphereLight args={['#93a9cc', '#14161d', 1.0]} />
      <directionalLight position={[60, 90, -60]} intensity={0.9} />

      {/* Ground, well below the tarmac. The 2D renderer let the descending ramp draw
          straight through this. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -RAMP_DROP - 8, -Z_FAR / 2]}>
        <planeGeometry args={[Z_FAR * 3, Z_FAR * 3]} />
        <meshStandardMaterial color="#12141b" roughness={1} />
      </mesh>

      <Surface build={mainline} color="#3a3b41" />
      <Surface build={opposing} color="#34353b" />
      <Surface build={verge} color="#2a2c33" />
      <Surface build={bank} color="#191c23" />
      <Surface build={ramp} color="#37383e" />

      <LaneMarkings />
      <Wall at={medianEdge} height={0.9} color="#7f858f" />
      <Wall at={roadsideEdge} height={0.75} color="#5d636d" />

      <Driver simRef={ref} />
    </Canvas>
  )
}

export default RoadScene
