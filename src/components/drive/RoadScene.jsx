import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  CAM_HEIGHT,
  CARRIAGEWAY,
  MEDIAN_WIDTH,
  OPPOSING_EDGE,
  Z_FAR,
  cameraX,
  curveAt,
  hillAt,
} from './world'

/**
 * Drive mode rendered with a real depth buffer.
 *
 * The Canvas 2D renderer in RoadCanvas.jsx decides occlusion by paint order,
 * which is why its own comments describe the bugs it produced: "Clamping every
 * vertex to horizon is what painted a flat asphalt bar" (line 150) and "Two
 * surfaces exist at this depth now" (line 131). Those are hand-written answers
 * to a question the GPU answers per pixel.
 *
 * Nothing here sorts anything. The mainline, the ramp, the median and the ground
 * are ordinary meshes in a scene; the depth test rejects fragments that sit
 * behind others, so a ramp cannot show through the ground and a surface at eye
 * height cannot smear into a bar along the horizon. That class of bug is not
 * fixed here, it is unrepresentable.
 *
 * `world.js` already describes the road in metres, so it is reused unchanged.
 * The port replaces the renderer, not the model.
 */

const SEGMENTS = 240 // along-road samples; log spacing is unnecessary with a real camera

/**
 * Build one carriageway as a ribbon that follows curveAt and hillAt.
 *
 * A ribbon rather than a flat plane because the road banks and climbs, and the
 * whole point of the exercise is that where two ribbons cross, the depth buffer
 * resolves it without anyone deciding a draw order.
 */
function useRibbon(offsetX, width, spanZ) {
  return useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = []
    const idx = []
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS
      const z = t * spanZ
      const cx = curveAt(z) + offsetX
      const y = hillAt(z)
      pos.push(cx, y, -z, cx + width, y, -z)
    }
    for (let i = 0; i < SEGMENTS; i++) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [offsetX, width, spanZ])
}

function Ribbon({ offsetX, width, color, spanZ = Z_FAR }) {
  const geo = useRibbon(offsetX, width, spanZ)
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  )
}

/** Median barrier. In the 2D version this was the element that stayed visible on the ramp. */
function Barrier() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = []
    const idx = []
    const H = 0.9
    for (let i = 0; i <= SEGMENTS; i++) {
      const z = (i / SEGMENTS) * Z_FAR
      const cx = curveAt(z) - MEDIAN_WIDTH / 2
      const y = hillAt(z)
      pos.push(cx, y, -z, cx, y + H, -z)
    }
    for (let i = 0; i < SEGMENTS; i++) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#8a8f98" roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
  )
}

/** Camera driven by the existing sim. Same eye height, same lane maths. */
function Driver({ simRef }) {
  const ref = useRef()
  useFrame(({ camera }) => {
    const sim = simRef.current
    if (!sim) return
    const s = sim.travel
    const x = curveAt(s) + cameraX(sim) - CARRIAGEWAY
    camera.position.set(x, hillAt(s) + CAM_HEIGHT, -s)
    // Look a little down the road so hills read as hills rather than as a tilt.
    const ahead = s + 60
    camera.lookAt(curveAt(ahead) + cameraX(sim) - CARRIAGEWAY, hillAt(ahead) + CAM_HEIGHT * 0.8, -ahead)
    camera.updateProjectionMatrix()
  })
  return <group ref={ref} />
}

export default function RoadScene({ simRef }) {
  return (
    <Canvas
      className="absolute inset-0"
      // logarithmicDepthBuffer because the scene spans 2.4m to 980m: at that
      // range a normal 24-bit buffer z-fights where the ramp meets the mainline,
      // which would reintroduce the exact artefact this port removes.
      gl={{ antialias: true, logarithmicDepthBuffer: true }}
      camera={{ fov: 62, near: 0.5, far: Z_FAR * 1.4 }}
    >
      <color attach="background" args={['#0b0d13']} />
      <fog attach="fog" args={['#0b0d13', Z_FAR * 0.35, Z_FAR * 0.95]} />
      <hemisphereLight args={['#9fb4d8', '#1b1d24', 0.9]} />
      <directionalLight position={[40, 60, -40]} intensity={1.1} />

      {/* Ground, well below the tarmac, running past the far plane. The 2D
          renderer let the ramp draw through this. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, -Z_FAR / 2]}>
        <planeGeometry args={[Z_FAR * 2, Z_FAR * 2]} />
        <meshStandardMaterial color="#141720" roughness={1} />
      </mesh>

      <Ribbon offsetX={0} width={CARRIAGEWAY} color="#3a3b41" />
      <Ribbon offsetX={-OPPOSING_EDGE} width={CARRIAGEWAY} color="#35363c" />
      <Barrier />
      <Driver simRef={simRef} />
    </Canvas>
  )
}
