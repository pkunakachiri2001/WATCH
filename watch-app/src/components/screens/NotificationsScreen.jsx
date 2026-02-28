import { useWatchStore } from '../../store/watchStore'

export default function NotificationsScreen() {
  const { notifications, goBack, markAllNotificationsRead, watchFeatures, toggleDnd } = useWatchStore()

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Notifications</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>{notifications.length}</span>
      </div>

      <div className="screen-content">
        <div className="rylo-card" style={{ padding: '12px 14px' }}>
          <div className="device-row">
            <div className="device-icon">🌙</div>
            <div className="device-label">
              <div className="device-name">Do Not Disturb</div>
              <div className="device-status">Mute alert vibrations and popups</div>
            </div>
            <label className="rylo-toggle" onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={watchFeatures.doNotDisturb} onChange={toggleDnd} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <button className="rylo-btn rylo-btn-primary" onClick={markAllNotificationsRead}>
          Mark All as Read
        </button>

        <div className="section-label">Recent Alerts</div>
        {notifications.map((item) => (
          <div key={item.id} className="rylo-card" style={{
            background: item.read ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.06)',
            borderColor: item.read ? 'rgba(255,255,255,0.08)' : 'rgba(0,212,255,0.22)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.62)', marginTop: 4 }}>{item.body}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>{item.app}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {!item.read ? <span className="badge">New</span> : null}
                <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{item.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
