import { useWatchStore } from '../../store/watchStore'
import { Commands } from '../../utils/commands'

const tiles = [
  { id: 'quickSettings', icon: '⚙️', label: 'Quick Set', sub: 'Controls' },
  { id: 'notifications', icon: '🔔', label: 'Alerts',      sub: 'Messages' },
  { id: 'fitness',   icon: '🏃', label: 'Fitness',      sub: 'Activity' },
  { id: 'weather',   icon: '☁️', label: 'Weather',      sub: 'Forecast' },
  { id: 'media',     icon: '🎵', label: 'Music',        sub: 'Now Playing' },
  { id: 'stopwatch', icon: '⏱️', label: 'Stopwatch',    sub: 'Sport Tool' },
  { id: 'timer',     icon: '⏲️', label: 'Timer',        sub: 'Countdown' },
  { id: 'locks',      icon: '🔐', label: 'Locks',       sub: 'Doors & Gates' },
  { id: 'lights',     icon: '💡', label: 'Lights',      sub: 'All Zones' },
  { id: 'thermostat', icon: '🌡️',  label: 'Climate',    sub: '22°C' },
  { id: 'cameras',    icon: '📷', label: 'Cameras',     sub: 'Live View' },
  { id: 'guest',      icon: '🔑', label: 'Guest Key',   sub: 'Temp Access' },
  { id: 'energy',     icon: '⚡', label: 'Energy',      sub: '2.4 kW' },
]

export default function HomeScreen({ send }) {
  const { setScreen, devices, triggerEmergency, batteryLevel, heartRate, isConnected, currentTime, notifications, watchFeatures } = useWatchStore()

  const allLocked = Object.keys(devices)
    .filter(k => 'locked' in devices[k])
    .every(k => devices[k].locked)

  const lightsOn = Object.keys(devices)
    .filter(k => 'on' in devices[k])
    .some(k => devices[k].on)

  const hours = currentTime.getHours()
  const greeting = hours < 12 ? 'Good Morning' : hours < 17 ? 'Good Afternoon' : 'Good Evening'
  const unreadCount = notifications.filter(n => !n.read).length

  const activateScene = (scene) => {
    send?.(Commands.ACTIVATE_SCENE(scene))
  }

  return (
    <div className="screen screen-scroll" style={{ justifyContent: 'flex-start', paddingTop: 0 }}>
      {/* Status bar */}
      <div className="mini-status-bar">
        <span className="item">🔋 {batteryLevel}%</span>
        <span className="item">♥ {heartRate}</span>
        <span className="item" style={{ color: isConnected ? '#00ff88' : '#ff3b3b' }}>
          {isConnected ? '● Online' : '○ Offline'}
        </span>
      </div>

      {/* Greeting */}
      <div style={{ padding: '6px 18px 2px', width: '100%' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>
          {greeting}
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'white', marginTop: 2 }}>
          {String(currentTime.getHours()).padStart(2,'0')}:{String(currentTime.getMinutes()).padStart(2,'0')}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
          {watchFeatures.weather.temperature}° • {watchFeatures.weather.condition}
        </div>
      </div>

      {/* Security pill */}
      <div style={{ padding: '6px 16px', width: '100%' }}>
        <div style={{
          background: allLocked ? 'rgba(0,255,136,0.07)' : 'rgba(255,136,0,0.07)',
          border: `1px solid ${allLocked ? 'rgba(0,255,136,0.2)' : 'rgba(255,136,0,0.2)'}`,
          borderRadius: 12, padding: '8px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 12, color: allLocked ? '#00ff88' : '#ff8800' }}>
            {allLocked ? '🔒 All Secured' : '⚠️ Door Open'}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
            {lightsOn ? '💡 Lights On' : '🌑 Dark'}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="home-grid">
        {tiles.map(tile => (
          <div
            key={tile.id}
            className="home-tile"
            onClick={() => setScreen(tile.id)}
          >
            <span className="tile-icon">{tile.icon}</span>
            <span className="tile-label">{tile.label}</span>
            <span className="tile-sub">{tile.sub}</span>
            {tile.id === 'notifications' && unreadCount > 0 ? <span className="badge" style={{ position: 'absolute', top: 10, right: 10 }}>{unreadCount}</span> : null}
          </div>
        ))}
      </div>

      {/* Scene row */}
      <div style={{ padding: '4px 14px', width: '100%' }}>
        <div className="section-label">Quick Scenes</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { name: 'AWAY', icon: '🚗', color: '#00d4ff' },
            { name: 'HOME', icon: '🏠', color: '#00ff88' },
            { name: 'SLEEP', icon: '🌙', color: '#8080ff' },
            { name: 'SECURE', icon: '🛡', color: '#ff8800' },
          ].map(s => (
            <button
              key={s.name}
              onClick={() => activateScene(s.name)}
              style={{
                flex: '0 0 auto',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: 10,
                padding: '6px 12px',
                color: s.color,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.08em',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency button */}
      <div style={{ padding: '6px 14px', width: '100%' }}>
        <button
          className="rylo-btn rylo-btn-danger"
          onClick={() => triggerEmergency('PANIC')}
          style={{ letterSpacing: '0.15em', fontSize: 12 }}
        >
          🚨 EMERGENCY
        </button>
      </div>
    </div>
  )
}
