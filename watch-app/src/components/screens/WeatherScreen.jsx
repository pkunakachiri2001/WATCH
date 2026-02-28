import { useWatchStore } from '../../store/watchStore'

const HOURLY = [
  { time: 'Now', icon: '⛅', temp: 24 },
  { time: '1 PM', icon: '☀️', temp: 26 },
  { time: '2 PM', icon: '☀️', temp: 27 },
  { time: '3 PM', icon: '🌤️', temp: 27 },
  { time: '4 PM', icon: '⛅', temp: 25 },
]

export default function WeatherScreen() {
  const { watchFeatures, goBack } = useWatchStore()
  const { weather } = watchFeatures

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Weather</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{weather.location}</span>
      </div>

      <div className="screen-content">
        <div className="rylo-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>{weather.condition.includes('Cloud') ? '⛅' : '☀️'}</div>
          <div style={{ fontSize: 42, fontWeight: 200, color: '#edf2f9', marginTop: 4 }}>{weather.temperature}°</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)' }}>{weather.condition}</div>
          <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
            H: {weather.high}°  L: {weather.low}°  •  Feels like {weather.feelsLike}°
          </div>
        </div>

        <div className="section-label">Hourly</div>
        <div className="rylo-card" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: 10 }}>
          {HOURLY.map(h => (
            <div key={h.time} style={{ minWidth: 64, textAlign: 'center', padding: '8px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{h.time}</div>
              <div style={{ fontSize: 18, marginTop: 4 }}>{h.icon}</div>
              <div style={{ fontSize: 12, color: '#e6ebf2', marginTop: 4 }}>{h.temp}°</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div className="rylo-card" style={{ textAlign: 'center', padding: '10px 8px' }}>
            <div style={{ fontSize: 16 }}>💧</div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#e6ebf2' }}>{weather.humidity}%</div>
            <div style={{ marginTop: 2, fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Humidity</div>
          </div>
          <div className="rylo-card" style={{ textAlign: 'center', padding: '10px 8px' }}>
            <div style={{ fontSize: 16 }}>🌬️</div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#e6ebf2' }}>{weather.windKmh} km/h</div>
            <div style={{ marginTop: 2, fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Wind</div>
          </div>
          <div className="rylo-card" style={{ textAlign: 'center', padding: '10px 8px' }}>
            <div style={{ fontSize: 16 }}>👁️</div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#e6ebf2' }}>9 km</div>
            <div style={{ marginTop: 2, fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Visibility</div>
          </div>
        </div>
      </div>
    </div>
  )
}
