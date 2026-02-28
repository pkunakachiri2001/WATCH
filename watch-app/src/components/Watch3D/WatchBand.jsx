import { useMemo } from 'react'
import * as THREE from 'three'

// Creates one band segment using a custom curve + TubeGeometry-like approach
// for a natural curved strap look

function createBandShape(width = 0.72, thickness = 0.09) {
  const shape = new THREE.Shape()
  const hw = width / 2
  const ht = thickness / 2
  const r = ht * 0.85
  shape.moveTo(-hw + r, -ht)
  shape.lineTo(hw - r, -ht)
  shape.quadraticCurveTo(hw, -ht, hw, -ht + r)
  shape.lineTo(hw, ht - r)
  shape.quadraticCurveTo(hw, ht, hw - r, ht)
  shape.lineTo(-hw + r, ht)
  shape.quadraticCurveTo(-hw, ht, -hw, ht - r)
  shape.lineTo(-hw, -ht + r)
  shape.quadraticCurveTo(-hw, -ht, -hw + r, -ht)
  return shape
}

function BandSegment({ position, rotation, length, isBottom = false }) {
  const bandShape = useMemo(() => createBandShape(0.72, 0.1), [])

  // Curved path for natural drape
  const curve = useMemo(() => {
    const mid = length * 0.5
    const sag = isBottom ? 0.06 : 0.03
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, mid, sag),
      new THREE.Vector3(0, length, sag * 0.5)
    )
  }, [length, isBottom])

  const geo = useMemo(() => {
    return new THREE.ExtrudeGeometry(bandShape, {
      extrudePath: curve,
      steps: 32,
      bevelEnabled: false,
      curveSegments: 16
    })
  }, [bandShape, curve])

  const bandMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0d1117'),   // Ultra dark midnight
    roughness: 0.85,
    metalness: 0.0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.5,
    envMapIntensity: 0.4,
    // Simulating the rubber/silicone micro-texture via roughness
  }), [])

  // Band groove texture lines (decorative grooves along band length)
  const grooveGeo = useMemo(() => {
    const lines = []
    const count = 28
    for (let i = 0; i < count; i++) {
      const t = i / count
      const point = curve.getPoint(t)
      const tangent = curve.getTangent(t)
      const geo = new THREE.BoxGeometry(0.76, 0.004, 0.004)
      const mat = new THREE.Matrix4()
      // Align along curve
      lines.push({ position: point, tangent })
    }
    return lines
  }, [curve])

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geo} material={bandMat} castShadow receiveShadow />

      {/* Side edge highlight strip */}
      <mesh castShadow>
        <extrudeGeometry
          args={[
            (() => {
              const s = new THREE.Shape()
              s.moveTo(-0.365, -0.045)
              s.lineTo(-0.36, -0.05)
              s.lineTo(-0.36, 0.05)
              s.lineTo(-0.365, 0.045)
              s.closePath()
              return s
            })(),
            {
              extrudePath: curve,
              steps: 32,
              bevelEnabled: false
            }
          ]}
        />
        <meshPhysicalMaterial
          color="#1a1f2e"
          roughness={0.6}
          metalness={0}
          envMapIntensity={0.3}
        />
      </mesh>
    </group>
  )
}

function BandPin({ position }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.025, 0.025, 0.78, 32]} />
      <meshPhysicalMaterial
        color="#c0c0c8"
        metalness={0.96}
        roughness={0.12}
        envMapIntensity={2.0}
        clearcoat={0.4}
      />
    </mesh>
  )
}

function BandBuckle({ position }) {
  return (
    <group position={position}>
      {/* Buckle frame */}
      <mesh castShadow>
        <torusGeometry args={[0.2, 0.04, 12, 32, Math.PI * 1.8]} />
        <meshPhysicalMaterial
          color="#b8b8c0"
          metalness={0.98}
          roughness={0.08}
          envMapIntensity={2.5}
          clearcoat={0.6}
        />
      </mesh>
      {/* Pin */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.45, 24]} />
        <meshPhysicalMaterial
          color="#c8c8d0"
          metalness={0.97}
          roughness={0.1}
          envMapIntensity={2.2}
        />
      </mesh>
    </group>
  )
}

function BandHoles({ startY, count = 6 }) {
  const holeMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#060608'),
    roughness: 0.9,
    metalness: 0,
  }), [])

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          position={[0, startY + i * 0.22, -0.21]}
          material={holeMat}
          castShadow={false}
        >
          <cylinderGeometry args={[0.04, 0.04, 0.12, 20]} />
        </mesh>
      ))}
    </>
  )
}

export default function WatchBand() {
  const topY = 1.22 + 0.02
  const bottomY = -(1.22 + 0.02)

  const topBandMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0d1117'),
    roughness: 0.88,
    metalness: 0.0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.6,
    envMapIntensity: 0.3,
  }), [])

  const bottomBandMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0a0e14'),
    roughness: 0.9,
    metalness: 0.0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.7,
    envMapIntensity: 0.25,
  }), [])

  // Top band - shorter (goes over wrist)
  const topBandGeo = useMemo(() => {
    const shape = createBandShape(0.72, 0.1)
    return new THREE.ExtrudeGeometry(shape, {
      depth: 1.6,
      bevelEnabled: false,
      curveSegments: 16
    })
  }, [])

  // Bottom band - longer (goes under wrist)
  const bottomBandGeo = useMemo(() => {
    const shape = createBandShape(0.72, 0.1)
    return new THREE.ExtrudeGeometry(shape, {
      depth: 2.2,
      bevelEnabled: false,
      curveSegments: 16
    })
  }, [])

  // Band groove lines
  const grooveMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#080b0f',
    transparent: true,
    opacity: 0.5
  }), [])

  return (
    <group>
      {/* ─── TOP BAND ─── */}
      <group position={[0, topY, -0.04]} rotation={[-0.08, 0, 0]}>
        <mesh geometry={topBandGeo} material={topBandMat} castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]} />

        {/* Groove lines on top band */}
        {Array.from({ length: 22 }).map((_, i) => (
          <mesh key={i} position={[0, 0.08 + i * 0.07, 0.05]} castShadow={false}>
            <boxGeometry args={[0.76, 0.003, 0.003]} />
            <primitive object={grooveMat} />
          </mesh>
        ))}

        {/* Band pin at lug interface */}
        <BandPin position={[0, 0.05, 0.0]} />
      </group>

      {/* ─── BOTTOM BAND ─── */}
      <group position={[0, bottomY, -0.04]} rotation={[Math.PI + 0.08, 0, 0]}>
        <mesh geometry={bottomBandGeo} material={bottomBandMat} castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]} />

        {/* Groove lines on bottom band */}
        {Array.from({ length: 30 }).map((_, i) => (
          <mesh key={i} position={[0, 0.08 + i * 0.07, 0.05]} castShadow={false}>
            <boxGeometry args={[0.76, 0.003, 0.003]} />
            <primitive object={grooveMat} />
          </mesh>
        ))}

        {/* Adjustment holes */}
        <BandHoles startY={0.9} count={6} />

        {/* Band pin */}
        <BandPin position={[0, 0.05, 0.0]} />

        {/* Buckle */}
        <BandBuckle position={[0, 1.85, 0.02]} />
      </group>

      {/* ─── LOOP KEEPER ─── */}
      <group position={[0, bottomY - 0.55, -0.04]} rotation={[Math.PI + 0.08, 0, 0]}>
        <mesh castShadow>
          <extrudeGeometry
            args={[
              createBandShape(0.72, 0.1),
              { depth: 0.18, bevelEnabled: false }
            ]}
          />
          <meshPhysicalMaterial
            color="#0a0e14"
            roughness={0.9}
            metalness={0}
            envMapIntensity={0.2}
          />
        </mesh>
      </group>
    </group>
  )
}
