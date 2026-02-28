import { useWatchStore } from '../../store/watchStore'

export default function QuickSettingsScreen() {
  const {
    goBack,
    screenBrightness,
    setScreenBrightness,
    setBattery,
    batteryLevel,
    watchFeatures,
    toggleDnd,
    setDeviceValue,
    devices,
  } = useWatchStore()

  const setBrightness = (value) => {
    const clamped = Math.max(20, Math.min(100, Number(value)))
    setScreenBrightness(clamped)
    const root = document.documentElement
    root.style.setProperty('--watch-brightness', `${clamped}%`)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Quick Settings</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Swipe apps</span>
      </div>

      <div className="screen-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="rylo-card app-chip" onClick={toggleDnd} style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 22 }}>{watchFeatures.doNotDisturb ? '🌙' : '🔔'}</div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#e8edf5' }}>DND</div>
            <div style={{ marginTop: 2, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{watchFeatures.doNotDisturb ? 'On' : 'Off'}</div>
          </button>

          <button
            className="rylo-card app-chip"
            onClick={() => setDeviceValue('mainPower', 'on', !devices.mainPower.on)}
            style={{ marginBottom: 0 }}
          >
            <div style={{ fontSize: 22 }}>{devices.mainPower.on ? '⚡' : '🔌'}</div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#e8edf5' }}>Power</div>
            <div style={{ marginTop: 2, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{devices.mainPower.on ? 'On' : 'Off'}</div>
          </button>

          <button className="rylo-card app-chip" onClick={() => setBattery(Math.max(5, batteryLevel - 5))} style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 22 }}>🔋</div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#e8edf5' }}>Battery</div>
            <div style={{ marginTop: 2, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{batteryLevel}%</div>
          </button>

          <button className="rylo-card app-chip" onClick={() => setBrightness(100)} style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 22 }}>☀️</div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#e8edf5' }}>Display</div>
            <div style={{ marginTop: 2, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{screenBrightness}%</div>
          </button>
        </div>

        <div className="section-label">Brightness</div>
        <div className="rylo-card" style={{ marginBottom: 0 }}>
          <input
            className="rylo-slider"
            type="range"
            min="20"
            max="100"
            value={screenBrightness}
            onChange={(e) => setBrightness(e.target.value)}
          />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Adjust display intensity</div>
        </div>
      </div>
    </div>
  )
}
