import { useWatchStore } from '../../store/watchStore'
import { Commands } from '../../utils/commands'

const CAMERAS = [
  { key: 'camera1', icon: '📷', label: 'Front Camera', position: 'Front Entrance' },
  { key: 'camera2', icon: '📷', label: 'Back Camera',  position: 'Back Yard' },
]

export default function CameraControl({ send }) {
  const { devices, toggleDevice, setDeviceValue, goBack } = useWatchStore()

  const handleToggle = (key) => {
    const d = devices[key]
    const newActive = !d.active
    toggleDevice(key)
    send?.(Commands.SET_CAMERA(key, newActive, d.recording))
  }

  const handleRecord = (key) => {
    const d = devices[key]
    const newRec = !d.recording
    setDeviceValue(key, 'recording', newRec)
    send?.(Commands.SET_CAMERA(key, d.active, newRec))
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Cameras</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
          {CAMERAS.filter(c => devices[c.key].active).length}/{CAMERAS.length} Live
        </span>
      </div>

      <div className="screen-content">
        {CAMERAS.map(cam => {
          const d = devices[cam.key]
          return (
            <div key={cam.key} style={{ marginBottom: 14 }}>
              {/* Feed Preview */}
              <div className="camera-feed">
                {d.active ? (
                  <>
                    <div className="camera-feed-live">● REC</div>
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, #0a1520 0%, #050810 50%, #0d1a28 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column', gap: 8
                    }}>
                      {/* Simulated camera grid */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: 2, width: '80%', opacity: 0.3
                      }}>
                        {Array.from({ length: 32 }).map((_,i) => (
                          <div key={i} style={{
                            height: 4,
                            background: `rgba(${Math.random()>0.7?'100,200,255':'255,255,255'},${(Math.random()*0.4+0.1).toFixed(2)})`,
                            borderRadius: 1
                          }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(100,200,255,0.5)', letterSpacing: '0.15em' }}>
                        {cam.position.toUpperCase()}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Camera Off</div>
                  </>
                )}
              </div>

              {/* Controls row */}
              <div className="rylo-card" style={{ marginBottom: 0 }}>
                <div className="device-row">
                  <div className="device-label">
                    <div className="device-name">{cam.label}</div>
                    <div className="device-status">{cam.position}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {d.active && (
                      <button
                        onClick={() => handleRecord(cam.key)}
                        style={{
                          background: d.recording ? 'rgba(255,30,30,0.2)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${d.recording ? 'rgba(255,59,59,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 8, padding: '4px 10px',
                          color: d.recording ? '#ff3b3b' : 'rgba(255,255,255,0.5)',
                          fontSize: 10, cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          animation: d.recording ? 'pulse-dot 1s infinite' : 'none',
                        }}
                      >
                        {d.recording ? '⏹ STOP' : '⏺ REC'}
                      </button>
                    )}
                    <label className="rylo-toggle">
                      <input type="checkbox" checked={d.active} onChange={() => handleToggle(cam.key)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        <div className="section-label">Actions</div>
        <button
          className="rylo-btn rylo-btn-primary"
          onClick={() => {
            CAMERAS.forEach(c => {
              setDeviceValue(c.key, 'active', true)
              send?.(Commands.SET_CAMERA(c.key, true, false))
            })
          }}
        >
          📷 Activate All Cameras
        </button>
        <button
          className="rylo-btn"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12 }}
          onClick={() => {
            CAMERAS.forEach(c => {
              setDeviceValue(c.key, 'active', false)
              setDeviceValue(c.key, 'recording', false)
            })
          }}
        >
          All Off
        </button>
      </div>
    </div>
  )
}
