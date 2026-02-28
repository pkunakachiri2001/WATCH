import { useEffect, useMemo, useState } from 'react'
import { useWatchStore } from '../../store/watchStore'

function formatMs(totalMs) {
  const total = Math.floor(totalMs / 10)
  const centis = String(total % 100).padStart(2, '0')
  const sec = String(Math.floor(total / 100) % 60).padStart(2, '0')
  const min = String(Math.floor(total / 6000)).padStart(2, '0')
  return `${min}:${sec}.${centis}`
}

export default function StopwatchScreen() {
  const { goBack } = useWatchStore()
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [laps, setLaps] = useState([])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed(v => v + 10), 10)
    return () => clearInterval(id)
  }, [running])

  const pace = useMemo(() => {
    if (laps.length < 1) return '—'
    const avg = Math.round(laps.reduce((a, b) => a + b, 0) / laps.length)
    return formatMs(avg)
  }, [laps])

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Stopwatch</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{running ? 'Running' : 'Paused'}</span>
      </div>

      <div className="screen-content">
        <div className="rylo-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 200, letterSpacing: '0.02em', color: '#ecf1f8' }}>{formatMs(elapsed)}</div>
          <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Average Lap: {pace}</div>

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button className="rylo-btn rylo-btn-primary" style={{ marginBottom: 0 }} onClick={() => setRunning(v => !v)}>
              {running ? 'Pause' : 'Start'}
            </button>
            <button
              className="rylo-btn"
              style={{ marginBottom: 0, background: 'rgba(255,255,255,0.08)', color: '#e9edf4', border: '1px solid rgba(255,255,255,0.14)' }}
              onClick={() => setLaps(prev => [elapsed, ...prev].slice(0, 10))}
              disabled={!running}
            >
              Lap
            </button>
            <button
              className="rylo-btn"
              style={{ marginBottom: 0, background: 'rgba(255,255,255,0.08)', color: '#e9edf4', border: '1px solid rgba(255,255,255,0.14)' }}
              onClick={() => { setRunning(false); setElapsed(0); setLaps([]) }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="section-label">Laps</div>
        {laps.length === 0 ? (
          <div className="rylo-card" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, textAlign: 'center' }}>
            No laps yet
          </div>
        ) : laps.map((lap, idx) => (
          <div key={idx} className="rylo-card" style={{ padding: '10px 12px' }}>
            <div className="device-row">
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Lap {laps.length - idx}</div>
              <div style={{ fontSize: 12, color: '#edf2f9' }}>{formatMs(lap)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
