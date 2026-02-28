import { useWatchStore } from '../../store/watchStore'
import { Commands } from '../../utils/commands'

const LOCKS = [
  { key: 'frontDoor', icon: '🚪', label: 'Front Door' },
  { key: 'garageDoor', icon: '🏠', label: 'Garage' },
  { key: 'backDoor', icon: '🚪', label: 'Back Door' },
]

export default function LockControl({ send }) {
  const { devices, toggleDevice, goBack, setDeviceValue } = useWatchStore()

  const handle = (key) => {
    const device = devices[key]
    const newLocked = !device.locked
    toggleDevice(key)
    send?.(Commands.LOCK_DOOR(key, newLocked))
  }

  const lockAll = () => {
    LOCKS.forEach(l => {
      if (!devices[l.key].locked) {
        setDeviceValue(l.key, 'locked', true)
        send?.(Commands.LOCK_DOOR(l.key, true))
      }
    })
  }

  const unlockAll = () => {
    LOCKS.forEach(l => {
      if (devices[l.key].locked) {
        setDeviceValue(l.key, 'locked', false)
        send?.(Commands.LOCK_DOOR(l.key, false))
      }
    })
  }

  const allLocked = LOCKS.every(l => devices[l.key].locked)

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Locks</span>
        <div className={`status-dot ${allLocked ? '' : 'offline'}`} />
      </div>

      <div className="screen-content">
        {/* Overall status */}
        <div className="rylo-card" style={{
          background: allLocked ? 'rgba(0,255,136,0.05)' : 'rgba(255,136,0,0.05)',
          borderColor: allLocked ? 'rgba(0,255,136,0.15)' : 'rgba(255,136,0,0.15)',
          textAlign: 'center', padding: '14px'
        }}>
          <div style={{ fontSize: 32 }}>{allLocked ? '🔒' : '🔓'}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: allLocked ? '#00ff88' : '#ff8800', marginTop: 4 }}>
            {allLocked ? 'All Doors Secured' : 'Some Doors Open'}
          </div>
        </div>

        <div className="section-label">Individual Doors</div>

        {LOCKS.map(lock => {
          const locked = devices[lock.key].locked
          return (
            <div
              key={lock.key}
              className={`rylo-card ${locked ? 'success' : ''}`}
              onClick={() => handle(lock.key)}
            >
              <div className="device-row">
                <div className="device-icon">{lock.icon}</div>
                <div className="device-label">
                  <div className="device-name">{lock.label}</div>
                  <div className="device-status" style={{ color: locked ? '#00ff88' : '#ff8800' }}>
                    {locked ? 'Locked' : 'Unlocked'}
                  </div>
                </div>
                <label className="rylo-toggle lock-toggle">
                  <input
                    type="checkbox"
                    checked={!locked}
                    onChange={() => handle(lock.key)}
                    onClick={e => e.stopPropagation()}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          )
        })}

        <div className="section-label">Quick Actions</div>
        <button className="rylo-btn rylo-btn-success" onClick={lockAll}>
          🔒 Lock All Doors
        </button>
        <button className="rylo-btn rylo-btn-primary" onClick={unlockAll} style={{ marginTop: 0 }}>
          🔓 Unlock All
        </button>
      </div>
    </div>
  )
}
