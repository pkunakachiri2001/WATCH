import { useState, useEffect } from 'react'
import { useWatchStore } from '../../store/watchStore'
import { Commands } from '../../utils/commands'

const CORRECT_PIN = '1234'

export default function AuthScreen({ send }) {
  const [pin, setPin] = useState('')
  const [step, setStep] = useState('pin') // 'pin' | 'biometric' | 'verifying' | 'done'
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const { setAuthenticated, batteryLevel, heartRate, isConnected } = useWatchStore()

  const handleKey = (k) => {
    if (pin.length >= 4) return
    const next = pin + k
    setPin(next)
    if (next.length === 4) {
      checkPin(next)
    }
  }

  const handleDelete = () => {
    setPin(p => p.slice(0, -1))
    setError(false)
  }

  const checkPin = (p) => {
    if (p === CORRECT_PIN) {
      setStep('biometric')
    } else {
      setShake(true)
      setError(true)
      setTimeout(() => { setPin(''); setShake(false); setError(false) }, 700)
    }
  }

  const handleBiometric = () => {
    setStep('verifying')
    setTimeout(() => {
      setStep('done')
      send?.(Commands.AUTH_SUCCESS('RYLO_BIO_HASH_' + Date.now()))
      setTimeout(() => setAuthenticated(true), 600)
    }, 2000)
  }

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', paddingTop: '0' }}>
      {/* Status bar */}
      <div className="mini-status-bar">
        <span className="item">🔋 <span className={batteryLevel < 20 ? 'glow-red' : ''}>{batteryLevel}%</span></span>
        <span className="item">♥ {heartRate}</span>
        <span className="item" style={{color: isConnected ? '#00ff88' : '#ff3b3b'}}>
          {isConnected ? '●' : '○'} {isConnected ? 'Hub' : 'No Hub'}
        </span>
      </div>

      {/* Brand */}
      <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        <div style={{
          fontSize: 22, fontWeight: 700, letterSpacing: '0.35em',
          color: '#00d4ff', textShadow: '0 0 20px rgba(0,212,255,0.5)',
          fontFamily: 'Space Grotesk, sans-serif'
        }}>RYLO</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', marginTop: 2 }}>
          SMART HOME
        </div>
      </div>

      {/* ─── PIN SCREEN ─── */}
      {step === 'pin' && (
        <>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 10 }}>
            Enter PIN
          </div>

          {/* PIN dots */}
          <div className={`pin-display ${shake ? 'shake' : ''}`}
            style={{ animation: shake ? 'shake 0.4s ease' : undefined }}>
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
            ))}
          </div>

          {error && (
            <div style={{ fontSize: 11, color: '#ff3b3b', textAlign: 'center', marginBottom: 8, animationName: 'fadeIn' }}>
              Incorrect PIN
            </div>
          )}

          {/* PIN pad */}
          <div className="pin-pad" style={{ width: '100%', maxWidth: 260, margin: '0 auto' }}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
              <button
                key={i}
                className="pin-key"
                onClick={() => k === '⌫' ? handleDelete() : k !== '' ? handleKey(k) : null}
                style={{ opacity: k === '' ? 0 : 1, pointerEvents: k === '' ? 'none' : 'auto' }}
              >
                {k}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ─── BIOMETRIC SCREEN ─── */}
      {step === 'biometric' && (
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="bio-scan" onClick={handleBiometric} style={{ cursor: 'pointer' }}>
            ☝️
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
            Fingerprint Verify
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            Touch sensor to authenticate
          </div>
          <button
            className="rylo-btn rylo-btn-primary"
            onClick={handleBiometric}
            style={{ marginTop: 20, maxWidth: 200 }}
          >
            Scan Now
          </button>
        </div>
      )}

      {/* ─── VERIFYING ─── */}
      {step === 'verifying' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#00d4ff',
            animation: 'spin 0.8s linear infinite',
            marginBottom: 20
          }} />
          <div style={{ fontSize: 13, color: '#00d4ff' }}>Verifying Identity</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
            AI behavioral check...
          </div>
        </div>
      )}

      {/* ─── DONE ─── */}
      {step === 'done' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%',
            border: '3px solid #00ff88',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, color: '#00ff88',
            boxShadow: '0 0 30px rgba(0,255,136,0.3)',
            animation: 'fadeIn 0.4s ease'
          }}>✓</div>
          <div style={{ fontSize: 15, color: '#00ff88', marginTop: 16 }}>Identity Verified</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
            Welcome back, Owner
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
