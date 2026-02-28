import { useWatchStore } from '../../store/watchStore'
import { Commands } from '../../utils/commands'

const LIGHTS = [
  { key: 'livingLight',  icon: '🛋️', label: 'Living Room' },
  { key: 'bedroomLight', icon: '🛏️', label: 'Bedroom' },
  { key: 'kitchenLight', icon: '🍳', label: 'Kitchen' },
  { key: 'outsideLight', icon: '🌿', label: 'Outside' },
]

const COLOR_PRESETS = [
  { hex: '#ffffff', label: 'White' },
  { hex: '#ffeedd', label: 'Warm' },
  { hex: '#ddeeff', label: 'Cool' },
  { hex: '#00d4ff', label: 'Cyan' },
  { hex: '#ff6600', label: 'Amber' },
  { hex: '#aa00ff', label: 'Purple' },
  { hex: '#00ff88', label: 'Green' },
  { hex: '#ff0055', label: 'Red' },
]

export default function LightsControl({ send }) {
  const { devices, toggleDevice, setDeviceValue, goBack } = useWatchStore()

  const handleToggle = (key) => {
    const d = devices[key]
    const newOn = !d.on
    toggleDevice(key)
    send?.(Commands.SET_LIGHT(key, newOn, d.brightness, d.color))
  }

  const handleBrightness = (key, val) => {
    setDeviceValue(key, 'brightness', val)
    const d = devices[key]
    send?.(Commands.SET_LIGHT(key, d.on, val, d.color))
  }

  const handleColor = (key, color) => {
    setDeviceValue(key, 'color', color)
    const d = devices[key]
    send?.(Commands.SET_LIGHT(key, d.on, d.brightness, color))
  }

  const allOn = LIGHTS.every(l => devices[l.key].on)

  const toggleAll = () => {
    LIGHTS.forEach(l => {
      const d = devices[l.key]
      if (d.on === allOn) {
        toggleDevice(l.key)
        send?.(Commands.SET_LIGHT(l.key, !allOn, d.brightness, d.color))
      }
    })
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Lights</span>
        <label className="rylo-toggle" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={allOn} onChange={toggleAll} />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="screen-content">
        {LIGHTS.map(light => {
          const d = devices[light.key]
          return (
            <div key={light.key} className={`rylo-card ${d.on ? 'active' : ''}`}>
              <div className="device-row" onClick={() => handleToggle(light.key)}>
                <div className="device-icon" style={{ color: d.on ? d.color : 'inherit' }}>
                  {light.icon}
                </div>
                <div className="device-label">
                  <div className="device-name">{light.label}</div>
                  <div className="device-status">
                    {d.on ? `${d.brightness}% brightness` : 'Off'}
                  </div>
                </div>
                <label className="rylo-toggle" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={d.on} onChange={() => handleToggle(light.key)} />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* Brightness + Color (shown when on) */}
              {d.on && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>
                    <span>Brightness</span>
                    <span>{d.brightness}%</span>
                  </div>
                  <input
                    className="rylo-slider"
                    type="range"
                    min={5}
                    max={100}
                    value={d.brightness}
                    onChange={e => handleBrightness(light.key, Number(e.target.value))}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="color-chips">
                    {COLOR_PRESETS.map(c => (
                      <div
                        key={c.hex}
                        className={`color-chip ${d.color === c.hex ? 'selected' : ''}`}
                        style={{ background: c.hex }}
                        onClick={() => handleColor(light.key, c.hex)}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div className="section-label">Scene Lights</div>
        {[
          { name: 'Movie Mode', action: () => { LIGHTS.forEach(l => { setDeviceValue(l.key, 'brightness', 20); setDeviceValue(l.key, 'on', true) }) }},
          { name: 'Party Mode', action: () => { LIGHTS.forEach((l,i) => { setDeviceValue(l.key, 'on', true); setDeviceValue(l.key, 'color', COLOR_PRESETS[i*2]?.hex || '#ffffff') }) }},
          { name: 'All Off',    action: () => { LIGHTS.forEach(l => setDeviceValue(l.key, 'on', false)) }},
        ].map(scene => (
          <button key={scene.name} className="rylo-btn rylo-btn-primary" onClick={scene.action} style={{ marginBottom: 8, fontSize: 12 }}>
            {scene.name}
          </button>
        ))}
      </div>
    </div>
  )
}
