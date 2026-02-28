import { useState } from 'react'
import { useWatchStore } from '../../store/watchStore'
import { Commands } from '../../utils/commands'

const USAGE_DATA = [0.8, 1.2, 1.5, 2.1, 2.8, 3.2, 2.4, 1.8, 2.0, 2.4, 2.6, 2.4]
const HOUR_LABELS = ['12a','2a','4a','6a','8a','10a','12p','2p','4p','6p','8p','10p']

export default function EnergyScreen({ send }) {
  const { devices, setDeviceValue, goBack } = useWatchStore()
  const [powerSaving, setPowerSaving] = useState(false)
  const mainPower = devices.mainPower
  const maxUsage = Math.max(...USAGE_DATA)

  const toggleMainPower = () => {
    const newState = !mainPower.on
    setDeviceValue('mainPower', 'on', newState)
    send?.(Commands.SET_MAIN_POWER(newState))
  }

  const togglePowerSaving = () => {
    setPowerSaving(p => !p)
    if (!powerSaving) {
      // Lower all lights
      ['livingLight','bedroomLight','kitchenLight'].forEach(k => {
        setDeviceValue(k, 'brightness', 30)
      })
    }
  }

  const totalUsage = mainPower.on ? mainPower.usage : 0
  const dailyEst = (totalUsage * 24 * 0.12).toFixed(2)

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Energy</span>
        <span style={{ fontSize: 10, color: '#00ff88' }}>Live</span>
      </div>

      <div className="screen-content">
        {/* Current usage */}
        <div className="rylo-card" style={{ textAlign: 'center', background: 'rgba(0,212,255,0.04)', borderColor: 'rgba(0,212,255,0.15)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: 6 }}>
            CURRENT DRAW
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 40, fontWeight: 200, color: '#00d4ff', textShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
              {totalUsage.toFixed(1)}
            </span>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>kW</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            ≈ ${dailyEst}/day estimated
          </div>
        </div>

        {/* Mini chart */}
        <div className="section-label">Today's Usage</div>
        <div className="rylo-card" style={{ padding: '14px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
            {USAGE_DATA.map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{
                  width: '100%',
                  height: `${(val / maxUsage) * 100}%`,
                  background: i === USAGE_DATA.length - 1
                    ? 'linear-gradient(180deg, #00d4ff, #0088aa)'
                    : `rgba(0,212,255,${0.15 + (val/maxUsage)*0.3})`,
                  borderRadius: '2px 2px 0 0',
                  transition: 'height 0.5s ease',
                  minHeight: 3,
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {[0,2,4,6,8,10].map(i => (
              <span key={i} style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{HOUR_LABELS[i]}</span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[
            { icon: '📊', label: 'Today', value: '18.2 kWh' },
            { icon: '💰', label: 'Cost',  value: '$2.18' },
            { icon: '🌿', label: 'CO₂',   value: '8.2 kg' },
          ].map(stat => (
            <div key={stat.label} className="rylo-card" style={{ textAlign: 'center', padding: '10px 8px' }}>
              <div style={{ fontSize: 18 }}>{stat.icon}</div>
              <div style={{ fontSize: 11, color: '#00d4ff', fontWeight: 600, marginTop: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="section-label">Controls</div>
        <div className="rylo-card" onClick={togglePowerSaving} style={{ cursor: 'pointer' }}>
          <div className="device-row">
            <div className="device-icon">🌙</div>
            <div className="device-label">
              <div className="device-name">Power Saving Mode</div>
              <div className="device-status">Dims lights to 30%</div>
            </div>
            <label className="rylo-toggle" onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={powerSaving} onChange={togglePowerSaving} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <div className="rylo-card" onClick={toggleMainPower} style={{ cursor: 'pointer' }}>
          <div className="device-row">
            <div className="device-icon">⚡</div>
            <div className="device-label">
              <div className="device-name">Main Power</div>
              <div className="device-status" style={{ color: mainPower.on ? '#00ff88' : '#ff3b3b' }}>
                {mainPower.on ? 'Active' : 'Off'}
              </div>
            </div>
            <label className="rylo-toggle" onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={mainPower.on} onChange={toggleMainPower} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* AI suggestion */}
        <div className="rylo-card" style={{ background: 'rgba(200,169,110,0.05)', borderColor: 'rgba(200,169,110,0.15)' }}>
          <div style={{ fontSize: 10, color: '#c8a96e', fontWeight: 600, marginBottom: 6, letterSpacing: '0.1em' }}>
            🧠 AI SUGGESTION
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Usage is 12% higher than your weekly average. Consider enabling Power Saving Mode at 10 PM.
          </div>
        </div>
      </div>
    </div>
  )
}
