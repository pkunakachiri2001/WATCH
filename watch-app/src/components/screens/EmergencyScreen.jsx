import { useState, useEffect } from 'react'
import { useWatchStore } from '../../store/watchStore'
import { Commands } from '../../utils/commands'

const EMERGENCY_TYPES = [
  { id: 'PANIC',    icon: '🆘', label: 'Panic',    color: '#ff3b3b', desc: 'General danger' },
  { id: 'INTRUDER', icon: '🚨', label: 'Intruder', color: '#ff6600', desc: 'Break-in detected' },
  { id: 'FIRE',     icon: '🔥', label: 'Fire',     color: '#ff8800', desc: 'Fire emergency' },
  { id: 'MEDICAL',  icon: '🏥', label: 'Medical',  color: '#ff3b6b', desc: 'Medical help' },
]

export default function EmergencyScreen({ send }) {
  const {
    emergencyActive, emergencyType, cancelEmergency,
    triggerEmergency, setDeviceValue, goBack, setScreen
  } = useWatchStore()

  const [countdown, setCountdown] = useState(null)
  const [selectedType, setSelectedType] = useState('PANIC')
  const [triggered, setTriggered] = useState(emergencyActive)
  const [holdTimer, setHoldTimer] = useState(null)
  const [holdProgress, setHoldProgress] = useState(0)

  useEffect(() => {
    if (triggered && !countdown) {
      let c = 3
      setCountdown(c)
      const interval = setInterval(() => {
        c--
        setCountdown(c)
        if (c <= 0) {
          clearInterval(interval)
          sendEmergency()
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [triggered])

  const sendEmergency = () => {
    send?.(Commands.EMERGENCY_TRIGGER(selectedType))
    // Lock all, cameras on, alarm on
    setDeviceValue('frontDoor', 'locked', true)
    setDeviceValue('backDoor', 'locked', true)
    setDeviceValue('garageDoor', 'locked', true)
    setDeviceValue('camera1', 'active', true)
    setDeviceValue('camera2', 'active', true)
    setDeviceValue('alarm', 'armed', true)
    triggerEmergency(selectedType)
  }

  const handleCancel = () => {
    setTriggered(false)
    setCountdown(null)
    cancelEmergency()
    send?.(Commands.EMERGENCY_CANCEL())
    setScreen('home')
  }

  const handleHoldStart = () => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setHoldProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        setTriggered(true)
      }
    }, 80)
    setHoldTimer(interval)
  }

  const handleHoldEnd = () => {
    if (holdTimer) clearInterval(holdTimer)
    if (holdProgress < 100) setHoldProgress(0)
    setHoldTimer(null)
  }

  const typeData = emergencyActive
    ? EMERGENCY_TYPES.find(t => t.id === emergencyType) || EMERGENCY_TYPES[0]
    : EMERGENCY_TYPES.find(t => t.id === selectedType)

  return (
    <div className="screen emergency-bg">
      {/* Already triggered state */}
      {emergencyActive ? (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, animation: 'heartbeat 1.5s infinite', marginBottom: 16 }}>
              {typeData.icon}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: typeData.color, letterSpacing: '0.1em', marginBottom: 4 }}>
              {typeData.label.toUpperCase()} — ACTIVE
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
              Emergency services notified
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <div className="rylo-card" style={{ textAlign: 'left' }}>
                {[
                  { icon: '🔒', text: 'All doors locked', done: true },
                  { icon: '📷', text: 'Cameras recording', done: true },
                  { icon: '🚨', text: 'Alarm activated', done: true },
                  { icon: '📍', text: 'Location shared', done: true },
                  { icon: '📞', text: 'Contacts notified', done: true },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span>{item.icon}</span>
                    <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{item.text}</span>
                    <span style={{ color: '#00ff88', fontSize: 14 }}>✓</span>
                  </div>
                ))}
              </div>
              <button className="rylo-btn rylo-btn-success" onClick={handleCancel} style={{ fontSize: 12 }}>
                ✓ Cancel Emergency
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="screen-header">
            <button className="back-btn" onClick={goBack}>←</button>
            <span className="screen-title" style={{ color: '#ff3b3b' }}>Emergency</span>
            <span style={{ fontSize: 16 }}>🚨</span>
          </div>

          <div className="screen-content">
            {/* Hold-to-trigger big button */}
            {!triggered ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
                    Hold button to trigger emergency
                  </div>

                  {/* Hold progress ring */}
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div className="emergency-ring">
                      <button
                        className="big-emergency-btn"
                        onMouseDown={handleHoldStart}
                        onMouseUp={handleHoldEnd}
                        onTouchStart={handleHoldStart}
                        onTouchEnd={handleHoldEnd}
                        onMouseLeave={handleHoldEnd}
                      >
                        🆘
                      </button>
                    </div>
                    {holdProgress > 0 && (
                      <div style={{
                        position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                        width: `${holdProgress}%`, height: 3, background: '#ff3b3b',
                        borderRadius: 2, transition: 'width 0.08s', maxWidth: 120
                      }} />
                    )}
                  </div>

                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 18 }}>
                    {holdProgress > 0 ? `Hold... ${Math.round(holdProgress)}%` : 'Hold for 2 seconds'}
                  </div>
                </div>

                <div className="section-label">Emergency Type</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {EMERGENCY_TYPES.map(type => (
                    <div
                      key={type.id}
                      className="rylo-card"
                      onClick={() => setSelectedType(type.id)}
                      style={{
                        textAlign: 'center',
                        background: selectedType === type.id ? `${type.color}12` : 'rgba(255,255,255,0.03)',
                        borderColor: selectedType === type.id ? `${type.color}40` : 'rgba(255,255,255,0.07)',
                        padding: '12px 8px',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{type.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: selectedType === type.id ? type.color : 'rgba(255,255,255,0.6)' }}>
                        {type.label}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{type.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 12, animation: 'pulse-dot 0.5s infinite' }}>🆘</div>
                <div className="glow-red" style={{ fontSize: 28, fontWeight: 700 }}>
                  {countdown !== null && countdown > 0 ? countdown : '!'}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                  {countdown > 0 ? `Triggering in ${countdown}s...` : 'Alerting emergency contacts'}
                </div>
                <button className="rylo-btn rylo-btn-success" onClick={handleCancel} style={{ marginTop: 20 }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
