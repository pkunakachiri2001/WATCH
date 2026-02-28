import { useWatchStore } from '../../store/watchStore'
import { Commands } from '../../utils/commands'

export default function ThermostatControl({ send }) {
  const { devices, setDeviceValue, goBack } = useWatchStore()
  const t = devices.thermostat

  const setTemp = (delta) => {
    const newTemp = Math.max(16, Math.min(30, t.temperature + delta))
    setDeviceValue('thermostat', 'temperature', newTemp)
    send?.(Commands.SET_THERMOSTAT(newTemp, t.mode, t.fan))
  }

  const setMode = (mode) => {
    setDeviceValue('thermostat', 'mode', mode)
    send?.(Commands.SET_THERMOSTAT(t.temperature, mode, t.fan))
  }

  const setFan = (fan) => {
    setDeviceValue('thermostat', 'fan', fan)
    send?.(Commands.SET_THERMOSTAT(t.temperature, t.mode, fan))
  }

  const tempColor = t.temperature < 20 ? '#00d4ff' : t.temperature > 26 ? '#ff6600' : '#00ff88'

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Climate</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Indoor</span>
      </div>

      <div className="screen-content">
        {/* Dial */}
        <div className="thermo-dial" style={{ borderColor: `${tempColor}44` }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${tempColor}08 0%, transparent 70%)` }} />
          <div className="thermo-temp" style={{ color: tempColor }}>{t.temperature}°</div>
          <div className="thermo-unit">Celsius</div>
        </div>

        {/* +/- controls */}
        <div className="thermo-controls">
          <button className="thermo-btn" onClick={() => setTemp(-1)}>−</button>
          <button className="thermo-btn" onClick={() => setTemp(1)}>+</button>
        </div>

        <div className="section-label">Mode</div>
        <div style={{ display: 'flex', gap: 8, padding: '0 2px' }}>
          {[
            { id: 'cool', icon: '❄️', label: 'Cool' },
            { id: 'heat', icon: '🔥', label: 'Heat' },
            { id: 'auto', icon: '🔄', label: 'Auto' },
            { id: 'fan',  icon: '💨', label: 'Fan' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1,
                padding: '8px 0',
                background: t.mode === m.id ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${t.mode === m.id ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 12,
                color: t.mode === m.id ? '#00d4ff' : 'rgba(255,255,255,0.5)',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        <div className="section-label">Fan Speed</div>
        <div style={{ display: 'flex', gap: 8, padding: '0 2px' }}>
          {['auto', 'low', 'med', 'high'].map(f => (
            <button
              key={f}
              onClick={() => setFan(f)}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: t.fan === f ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${t.fan === f ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 10,
                color: t.fan === f ? '#00ff88' : 'rgba(255,255,255,0.4)',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="section-label">Stats</div>
        <div className="rylo-card" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          {[
            { icon: '🌡️', label: 'Target', value: `${t.temperature}°C` },
            { icon: '💧', label: 'Humidity', value: '58%' },
            { icon: '🌬️', label: 'AQI', value: 'Good' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: 20 }}>{stat.icon}</div>
              <div style={{ fontSize: 13, color: '#00d4ff', fontWeight: 600, marginTop: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
