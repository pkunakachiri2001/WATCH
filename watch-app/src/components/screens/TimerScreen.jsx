import { useEffect, useState } from 'react'
import { useWatchStore } from '../../store/watchStore'

function formatTime(totalSec) {
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function TimerScreen() {
  const { goBack } = useWatchStore()
  const [seconds, setSeconds] = useState(300)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds((v) => {
        if (v <= 1) {
          clearInterval(id)
          setRunning(false)
          setDone(true)
          return 0
        }
        return v - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [running])

  const adjust = (delta) => {
    setDone(false)
    setSeconds((v) => Math.max(0, Math.min(7200, v + delta)))
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Timer</span>
        <span style={{ fontSize: 10, color: done ? '#9fd6a8' : 'rgba(255,255,255,0.45)' }}>{done ? 'Done' : running ? 'Running' : 'Ready'}</span>
      </div>

      <div className="screen-content">
        <div className="rylo-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 200, color: done ? '#9fd6a8' : '#edf2f9' }}>{formatTime(seconds)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
            {done ? 'Timer completed' : 'Set countdown and start'}
          </div>

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button className="thermo-btn" onClick={() => adjust(-60)}>-1m</button>
            <button className="thermo-btn" onClick={() => adjust(-10)}>-10s</button>
            <button className="thermo-btn" onClick={() => adjust(10)}>+10s</button>
            <button className="thermo-btn" onClick={() => adjust(60)}>+1m</button>
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button className="rylo-btn rylo-btn-primary" style={{ marginBottom: 0 }} onClick={() => setRunning(v => !v)}>
              {running ? 'Pause' : 'Start'}
            </button>
            <button
              className="rylo-btn"
              style={{ marginBottom: 0, background: 'rgba(255,255,255,0.08)', color: '#e9edf4', border: '1px solid rgba(255,255,255,0.14)' }}
              onClick={() => { setRunning(false); setDone(false); setSeconds(300) }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
