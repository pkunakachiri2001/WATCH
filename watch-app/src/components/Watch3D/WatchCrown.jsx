import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Digital Crown with real knurling/ridges
function DigitalCrown({ position }) {
  const crownRef = useRef()
  const ridgeCount = 32

  const crownBodyGeo = useMemo(() => new THREE.CylinderGeometry(0.09, 0.09, 0.25, 64), [])

  const knurlGeo = useMemo(() => {
    const knurls = []
    for (let i = 0; i < ridgeCount; i++) {
      const angle = (i / ridgeCount) * Math.PI * 2
      const x = Math.cos(angle) * 0.092
      const z = Math.sin(angle) * 0.092
      const geo = new THREE.BoxGeometry(0.012, 0.24, 0.018)
      const mat = new THREE.Matrix4().makeRotationY(angle)
      const translated = new THREE.Matrix4().makeTranslation(x, 0, z)
      const combined = translated.multiply(mat)
      knurls.push({ geometry: geo, matrix: combined })
    }
    return knurls
  }, [ridgeCount])

  const crownMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#a9adb6'),
    metalness: 0.98,
    roughness: 0.16,
    envMapIntensity: 1.5,
    clearcoat: 0.18,
    clearcoatRoughness: 0.25,
  }), [])

  const knurlMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#8e939c'),
    metalness: 0.96,
    roughness: 0.24,
    envMapIntensity: 1.2,
  }), [])

  const ryloGlyphMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#6f7681'),
    emissive: new THREE.Color('#000000'),
    emissiveIntensity: 0,
    metalness: 0.85,
    roughness: 0.35,
  }), [])

  useFrame((state) => {
    // Subtle crown glint
    if (crownRef.current) {
      crownRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
    }
  })

  return (
    <group ref={crownRef} position={position} rotation={[0, 0, Math.PI / 2]}>
      {/* Crown body */}
      <mesh geometry={crownBodyGeo} material={crownMat} castShadow />

      {/* Knurling ridges */}
      {knurlGeo.map((k, i) => (
        <mesh key={i} geometry={k.geometry} material={knurlMat} matrixAutoUpdate={false} matrix={k.matrix} castShadow />
      ))}

      {/* Crown cap disk */}
      <mesh position={[0, 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.02, 64]} />
        <primitive object={crownMat} />
      </mesh>

      {/* Rylo cyan accent ring */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.093, 0.006, 12, 64]} />
        <primitive object={ryloGlyphMat} />
      </mesh>
    </group>
  )
}

// Side button
function SideButton({ position, label }) {
  const btnMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1c1c24'),
    metalness: 0.95,
    roughness: 0.12,
    envMapIntensity: 2.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.05,
  }), [])

  const btnEdgeMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#2a2a35'),
    metalness: 0.97,
    roughness: 0.08,
    envMapIntensity: 2.2,
  }), [])

  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      {/* Button shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.22, 32]} />
        <primitive object={btnMat} />
      </mesh>
      {/* Button face */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.025, 32]} />
        <primitive object={btnEdgeMat} />
      </mesh>
      {/* Grip ridges */}
      {[0.05, 0, -0.05].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <torusGeometry args={[0.057, 0.006, 6, 32]} />
          <primitive object={btnEdgeMat} />
        </mesh>
      ))}
    </group>
  )
}

// Emergency / Action button (left side - orange accent)
function EmergencyButton({ position }) {
  const btnMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#565b65'),
    metalness: 0.94,
    roughness: 0.24,
    envMapIntensity: 1.2,
  }), [])

  const accentMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#7f8792'),
    emissive: new THREE.Color('#000000'),
    emissiveIntensity: 0,
    metalness: 0.9,
    roughness: 0.3,
    transparent: false,
    opacity: 1,
  }), [])

  return (
    <group position={position} rotation={[0, 0, -Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.18, 32]} />
        <primitive object={btnMat} />
      </mesh>
      {/* Orange accent ring */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.053, 0.008, 8, 32]} />
        <primitive object={accentMat} />
      </mesh>
      {/* Button face */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.038, 0.05, 0.02, 32]} />
        <primitive object={accentMat} />
      </mesh>
    </group>
  )
}

// Sapphire Crystal Glass with ambient reflection
export function WatchGlass() {
  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f3f6fb'),
    metalness: 0.0,
    roughness: 0.01,
    transmission: 0.98,
    thickness: 0.05,
    ior: 1.76,
    reflectivity: 0.65,
    envMapIntensity: 1.6,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    transparent: true,
    opacity: 1,
    side: THREE.FrontSide,
  }), [])

  const glassShape = useMemo(() => {
    const shape = new THREE.Shape()
    const w = 0.97
    const h = 1.14
    const r = 0.22
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
  }, [])

  const glassGeo = useMemo(() => new THREE.ExtrudeGeometry(glassShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 8,
    curveSegments: 32
  }), [glassShape])

  // AR coating shimmer
  const coatingMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#d9e2ee'),
    metalness: 0,
    roughness: 0.05,
    transparent: true,
    opacity: 0.025,
    side: THREE.FrontSide,
  }), [])

  return (
    <group position={[0, 0, 0.235]}>
      <mesh geometry={glassGeo} material={glassMat} castShadow />
      {/* AR coating tint layer */}
      <mesh geometry={glassGeo} position={[0, 0, 0.001]}>
        <primitive object={coatingMat} />
      </mesh>
    </group>
  )
}

export default function WatchCrown() {
  return (
    <group>
      {/* Digital Crown — right side, center */}
      <DigitalCrown position={[1.15, 0.15, 0]} />

      {/* Upper side button — right side */}
      <SideButton position={[1.15, -0.35, 0]} label="action" />

      {/* Emergency button — left side */}
      <EmergencyButton position={[-1.14, 0, 0]} />

      <WatchGlass />
    </group>
  )
}
