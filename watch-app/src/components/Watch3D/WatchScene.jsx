import { useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  Environment,
  OrbitControls,
  ContactShadows,
  Float,
  Preload,
  AdaptiveDpr,
  AdaptiveEvents,
  BakeShadows,
  PerformanceMonitor,
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, DepthOfField, Noise, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import WatchBody from './WatchBody'
import WatchBand from './WatchBand'
import WatchCrown from './WatchCrown'
import WatchFace from './WatchFace'
import { Html } from '@react-three/drei'
import WatchUI from '../WatchUI/WatchScreen'

function WatchModel() {
  const groupRef = useRef()

  return (
    <Float
      speed={0.45}
      rotationIntensity={0.025}
      floatIntensity={0.02}
      floatingRange={[-0.01, 0.01]}
    >
      <group
        ref={groupRef}
        rotation={[0.16, -0.12, 0.02]}
        scale={[0.74, 0.74, 0.74]}
      >
        {/* Watch Band first (behind body) */}
        <WatchBand />

        {/* Main Watch Case */}
        <WatchBody />

        {/* Crown, Buttons, Glass */}
        <WatchCrown />

        {/* OLED Display - ambient clock face */}
        <WatchFace />

        {/* Interactive UI Panel mounted on face */}
        <Html
          transform
          occlude={false}
          position={[0, 0, 0.26]}
          rotation={[0, 0, 0]}
          scale={[0.155, 0.155, 0.155]}
          style={{
            width: '390px',
            height: '455px',
            pointerEvents: 'all',
          }}
          zIndexRange={[100, 0]}
        >
          <WatchUI />
        </Html>
      </group>
    </Float>
  )
}

function Lighting() {
  return (
    <>
      {/* Key light - neutral studio */}
      <directionalLight
        position={[4, 5, 3]}
        intensity={2.1}
        color="#fff7ef"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.001}
      />

      {/* Fill light */}
      <directionalLight
        position={[-5, 2, 0]}
        intensity={0.6}
        color="#f4f6fb"
      />

      {/* Rim light */}
      <directionalLight
        position={[0, 1.5, -5]}
        intensity={0.85}
        color="#e8edf4"
      />

      {/* Bottom bounce */}
      <directionalLight
        position={[0, -4, 1.5]}
        intensity={0.3}
        color="#ffffff"
      />

      <ambientLight intensity={0.16} color="#f1f3f7" />
    </>
  )
}

function PostFX() {
  return (
    <EffectComposer multisampling={4}>
      <DepthOfField
        focusDistance={0.015}
        focalLength={0.02}
        bokehScale={1.1}
        height={480}
      />

      <Bloom
        luminanceThreshold={0.9}
        luminanceSmoothing={0.9}
        height={300}
        intensity={0.12}
        mipmapBlur
      />

      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.00015, 0.00015]}
        radialModulation={false}
        modulationOffset={0.8}
      />

      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={0.012}
      />

      <Vignette
        darkness={0.25}
        offset={0.32}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />

      <ToneMapping
        blendFunction={BlendFunction.NORMAL}
        mode={ToneMappingMode.ACES_FILMIC}
        resolution={256}
        whitePoint={3.6}
        middleGrey={0.58}
        minLuminance={0.01}
        averageLuminance={1.0}
        adaptationRate={1.0}
      />
    </EffectComposer>
  )
}

export default function WatchScene() {
  return (
    <Canvas
      shadows="soft"
      camera={{
        position: [0, 0, 7.2],
        fov: 24,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        outputColorSpace: THREE.SRGBColorSpace,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{ background: '#000000' }}
    >
      <PerformanceMonitor />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      {/* Studio environment — HDRI-like reflections */}
      <Environment
        preset="studio"
        environmentIntensity={1.05}
        background={false}
      />

      <Lighting />

      <Suspense fallback={null}>
        <WatchModel />

        {/* Beautiful soft ground shadow */}
        <ContactShadows
          position={[0, -3.2, 0]}
          opacity={0.42}
          scale={8}
          blur={2.8}
          far={6}
          resolution={512}
          color="#000000"
        />
      </Suspense>

      <PostFX />

      {/* Orbit Controls — user can rotate the watch */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI - Math.PI / 5}
        minDistance={4}
        maxDistance={12}
        autoRotate={false}
        dampingFactor={0.06}
        enableDamping
        makeDefault
      />

      <Preload all />
    </Canvas>
  )
}
