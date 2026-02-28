import { useRef, useMemo } from 'react'
import * as THREE from 'three'

// Builds the main watch case body with chamfered/rounded edges
// using ExtrudeGeometry for the premium look

function createWatchCaseShape() {
  const shape = new THREE.Shape()
  const w = 1.05  // half width
  const h = 1.22  // half height
  const r = 0.28  // corner radius

  shape.moveTo(-w + r, -h)
  shape.lineTo(w - r, -h)
  shape.quadraticCurveTo(w, -h, w, -h + r)
  shape.lineTo(w, h - r)
  shape.quadraticCurveTo(w, h, w - r, h)
  shape.lineTo(-w + r, h)
  shape.quadraticCurveTo(-w, h, -w, h - r)
  shape.lineTo(-w, -h + r)
  shape.quadraticCurveTo(-w, -h, -w + r, -h)

  return shape
}

function createLugShape() {
  const shape = new THREE.Shape()
  shape.moveTo(-0.18, 0)
  shape.lineTo(0.18, 0)
  shape.lineTo(0.15, 0.35)
  shape.lineTo(-0.15, 0.35)
  shape.closePath()
  return shape
}

export default function WatchBody() {
  const caseRef = useRef()
  const bezelRef = useRef()

  // Case geometry - titanium black body
  const caseGeometry = useMemo(() => {
    const shape = createWatchCaseShape()
    const extrudeSettings = {
      depth: 0.42,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 12,
      curveSegments: 32
    }
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geo.center()
    return geo
  }, [])

  // Flat back plate geometry (slightly smaller)
  const backPlateGeo = useMemo(() => {
    const shape = createWatchCaseShape()
    const extrudeSettings = {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 8,
      curveSegments: 32
    }
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geo.center()
    return geo
  }, [])

  // Bezel rim - slightly larger, thinner
  const bezelGeo = useMemo(() => {
    const outerShape = createWatchCaseShape()
    // Inner cutout
    const innerShape = new THREE.Shape()
    const wi = 0.98
    const hi = 1.15
    const ri = 0.24
    innerShape.moveTo(-wi + ri, -hi)
    innerShape.lineTo(wi - ri, -hi)
    innerShape.quadraticCurveTo(wi, -hi, wi, -hi + ri)
    innerShape.lineTo(wi, hi - ri)
    innerShape.quadraticCurveTo(wi, hi, wi - ri, hi)
    innerShape.lineTo(-wi + ri, hi)
    innerShape.quadraticCurveTo(-wi, hi, -wi, hi - ri)
    innerShape.lineTo(-wi, -hi + ri)
    innerShape.quadraticCurveTo(-wi, -hi, -wi + ri, -hi)
    outerShape.holes.push(innerShape)
    const geo = new THREE.ExtrudeGeometry(outerShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 8,
      curveSegments: 32
    })
    geo.center()
    return geo
  }, [])

  // Sensor bump on back
  const sensorGeo = useMemo(() => new THREE.CylinderGeometry(0.28, 0.28, 0.08, 64), [])

  // Heart rate sensor ring
  const hrSensorGeo = useMemo(() => new THREE.TorusGeometry(0.22, 0.025, 16, 64), [])

  // Materials
  const titaniumMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#2f3238'),
    metalness: 0.93,
    roughness: 0.28,
    envMapIntensity: 1.25,
    clearcoat: 0.08,
    clearcoatRoughness: 0.35,
  }), [])

  const bezelMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#595d66'),
    metalness: 0.96,
    roughness: 0.2,
    envMapIntensity: 1.3,
    clearcoat: 0.12,
    clearcoatRoughness: 0.25,
  }), [])

  const backPlateMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#23262d'),
    metalness: 0.8,
    roughness: 0.48,
    envMapIntensity: 0.9,
  }), [])

  const sensorMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#111318'),
    metalness: 0.18,
    roughness: 0.14,
    envMapIntensity: 1.05,
    clearcoat: 0.45,
    clearcoatRoughness: 0.08,
  }), [])

  const sensorGlowMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#4f5a66'),
    emissive: new THREE.Color('#000000'),
    emissiveIntensity: 0,
    metalness: 0.18,
    roughness: 0.25,
    transparent: true,
    opacity: 0.65,
  }), [])

  const lugsGeo = useMemo(() => {
    const shape = createLugShape()
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 6,
      curveSegments: 16
    })
  }, [])

  return (
    <group>
      {/* Main Case Body */}
      <mesh ref={caseRef} geometry={caseGeometry} material={titaniumMat} castShadow receiveShadow />

      {/* Bezel rim */}
      <mesh
        ref={bezelRef}
        geometry={bezelGeo}
        material={bezelMat}
        position={[0, 0, 0.215]}
        castShadow
      />

      {/* Back plate */}
      <mesh
        geometry={backPlateGeo}
        material={backPlateMat}
        position={[0, 0, -0.235]}
        castShadow
      />

      {/* Heart rate sensor bump */}
      <mesh
        geometry={sensorGeo}
        material={sensorMat}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -0.3]}
        castShadow
      />

      {/* HR sensor glow ring */}
      <mesh
        geometry={hrSensorGeo}
        material={sensorGlowMat}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -0.31]}
      />

      {/* Lugs top */}
      <group position={[0, 1.22, 0]}>
        <mesh
          geometry={lugsGeo}
          material={titaniumMat}
          position={[-0.18, 0, -0.16]}
          rotation={[0, 0, 0]}
          castShadow
        />
      </group>

      {/* Lugs bottom */}
      <group position={[0, -1.22, 0]} rotation={[0, 0, Math.PI]}>
        <mesh
          geometry={lugsGeo}
          material={titaniumMat}
          position={[-0.18, 0, -0.16]}
          castShadow
        />
      </group>

      {/* RYLO text engraving (simulated as a slightly recessed flat panel) */}
      <mesh position={[0, -0.2, -0.26]}>
        <planeGeometry args={[0.6, 0.1]} />
        <meshPhysicalMaterial
          color="#0a0a0e"
          metalness={0.5}
          roughness={0.8}
          envMapIntensity={0.3}
        />
      </mesh>
    </group>
  )
}
