import { Suspense } from 'react'
import WatchScene from './components/Watch3D/WatchScene'
import './App.css'

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, fontFamily: 'Space Grotesk, sans-serif',
    }}>
      <div style={{
        fontSize: 32, fontWeight: 700, letterSpacing: '0.4em',
        color: '#00d4ff', textShadow: '0 0 30px rgba(0,212,255,0.6)'
      }}>
        RYLO
      </div>
      <div style={{
        width: 200, height: 2,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 1, overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
          borderRadius: 1,
          animation: 'loadBar 1.8s ease-in-out infinite',
        }} />
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>
        INITIALIZING SECURE ENVIRONMENT
      </div>
      <style>{`
        @keyframes loadBar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <div className="app-root">
      {/* Ambient background particles */}
      <div className="ambient-bg">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />
        <div className="scan-line" />
      </div>

      {/* Brand watermark */}
      <div className="brand-watermark">
        <span className="rylo-logo-text" style={{ fontSize: 11, letterSpacing: '0.4em', color: 'rgba(0,212,255,0.15)' }}>
          RYLO
        </span>
        <span style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.08)', marginTop: 2 }}>
          SMART HOME ECOSYSTEM
        </span>
      </div>

      {/* Hint overlay */}
      <div className="hint-bar">
        <span>🖱 Drag to rotate</span>
        <span>🔍 Scroll to zoom</span>
        <span>👆 Tap watch screen</span>
      </div>

      {/* Corner decorations */}
      <div className="corner-tl"><div className="corner-line" /></div>
      <div className="corner-tr"><div className="corner-line" /></div>
      <div className="corner-bl"><div className="corner-line" /></div>
      <div className="corner-br"><div className="corner-line" /></div>

      {/* Main 3D Canvas */}
      <Suspense fallback={<LoadingScreen />}>
        <WatchScene />
      </Suspense>
    </div>
  )
}
