import { useWatchStore } from '../../store/watchStore'

export default function FitnessScreen() {
  const { watchFeatures, heartRate, goBack } = useWatchStore()
  const { fitness } = watchFeatures

  const stepPercent = Math.min(100, Math.round((fitness.steps / fitness.goal) * 100))

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Fitness</span>
        <span style={{ fontSize: 10, color: '#9fd6a8' }}>{fitness.heartZone}</span>
      </div>

      <div className="screen-content">
        <div className="rylo-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)' }}>STEPS TODAY</div>
          <div style={{ fontSize: 42, fontWeight: 200, color: '#dfe6ee', marginTop: 8 }}>{fitness.steps.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Goal {fitness.goal.toLocaleString()} • {stepPercent}%</div>
          <div className="energy-bar-wrap" style={{ marginTop: 10 }}>
            <div className="energy-bar-fill" style={{ width: `${stepPercent}%`, background: 'linear-gradient(90deg, #7e8d9f, #d6dde7)' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { icon: '🔥', label: 'Calories', value: `${fitness.calories}` },
            { icon: '🛣️', label: 'Distance', value: `${fitness.distanceKm} km` },
            { icon: '⏱️', label: 'Active', value: `${fitness.activeMinutes} min` },
            { icon: '🧍', label: 'Stand', value: `${fitness.standHours} h` },
          ].map(item => (
            <div key={item.label} className="rylo-card" style={{ marginBottom: 0, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 18 }}>{item.icon}</div>
              <div style={{ fontSize: 13, color: '#e6ebf2', marginTop: 6 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.36)', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div className="rylo-card" style={{ marginTop: 10 }}>
          <div className="device-row">
            <div className="device-icon">❤️</div>
            <div className="device-label">
              <div className="device-name">Heart Rate</div>
              <div className="device-status">Live Sensor</div>
            </div>
            <div style={{ fontSize: 16, color: '#e6ebf2', fontWeight: 600 }}>{heartRate} BPM</div>
          </div>
        </div>
      </div>
    </div>
  )
}
