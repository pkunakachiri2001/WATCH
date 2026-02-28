import { useState } from 'react'
import { useWatchStore } from '../../store/watchStore'
import { Commands } from '../../utils/commands'

const DURATIONS = [
  { label: '30 min', value: 1800 },
  { label: '1 hr',  value: 3600 },
  { label: '3 hrs', value: 10800 },
  { label: '1 day', value: 86400 },
]

const PERMS = [
  { id: 'frontDoor', icon: '🚪', label: 'Front Door' },
  { id: 'backDoor',  icon: '🚪', label: 'Back Door' },
  { id: 'garageDoor',icon: '🏠', label: 'Garage' },
]

export default function GuestAccess({ send }) {
  const { guestKeys, addGuestKey, removeGuestKey, goBack } = useWatchStore()
  const [selectedDuration, setSelectedDuration] = useState(3600)
  const [selectedPerms, setSelectedPerms] = useState(['frontDoor'])
  const [generating, setGenerating] = useState(false)
  const [newKey, setNewKey] = useState(null)

  const togglePerm = (id) => {
    setSelectedPerms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const generateKey = () => {
    setGenerating(true)
    send?.(Commands.GENERATE_GUEST_KEY(selectedDuration, selectedPerms))
    setTimeout(() => {
      const key = {
        id: Date.now(),
        code: Math.random().toString(36).slice(2, 8).toUpperCase(),
        duration: selectedDuration,
        permissions: [...selectedPerms],
        expires: Date.now() + selectedDuration * 1000,
        created: new Date().toLocaleTimeString()
      }
      addGuestKey(key)
      setNewKey(key)
      setGenerating(false)
    }, 1500)
  }

  const revoke = (id) => {
    removeGuestKey(id)
    send?.(Commands.REVOKE_GUEST_KEY(id))
  }

  const formatExpiry = (ms) => {
    const remaining = ms - Date.now()
    if (remaining <= 0) return 'Expired'
    const hours = Math.floor(remaining / 3600000)
    const mins = Math.floor((remaining % 3600000) / 60000)
    return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Guest Key</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{guestKeys.length} active</span>
      </div>

      <div className="screen-content">
        {/* New key generated */}
        {newKey && (
          <div className="rylo-card active" style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: '0.1em' }}>
              KEY GENERATED
            </div>
            <div className="qr-placeholder">📱</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.3em', color: '#00d4ff', marginTop: 8 }}>
              {newKey.code}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              Share code or scan QR
            </div>
            <button
              onClick={() => setNewKey(null)}
              style={{
                marginTop: 10, background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Generator */}
        <div className="rylo-card">
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 10 }}>
            New Guest Key
          </div>

          <div className="section-label">Duration</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {DURATIONS.map(d => (
              <button
                key={d.value}
                onClick={() => setSelectedDuration(d.value)}
                style={{
                  flex: 1, padding: '7px 4px',
                  background: selectedDuration === d.value ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedDuration === d.value ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 9,
                  color: selectedDuration === d.value ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                  fontSize: 10, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="section-label">Access To</div>
          {PERMS.map(p => (
            <div
              key={p.id}
              className="device-row"
              onClick={() => togglePerm(p.id)}
              style={{ marginBottom: 8, cursor: 'pointer' }}
            >
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginLeft: 8 }}>{p.label}</span>
              <div style={{
                width: 18, height: 18, borderRadius: 4,
                border: `2px solid ${selectedPerms.includes(p.id) ? '#00d4ff' : 'rgba(255,255,255,0.15)'}`,
                background: selectedPerms.includes(p.id) ? 'rgba(0,212,255,0.2)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#00d4ff', fontSize: 12,
              }}>
                {selectedPerms.includes(p.id) ? '✓' : ''}
              </div>
            </div>
          ))}

          <button
            className="rylo-btn rylo-btn-primary"
            onClick={generateKey}
            disabled={generating || selectedPerms.length === 0}
            style={{ marginTop: 8 }}
          >
            {generating ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #00d4ff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                Generating...
              </span>
            ) : '🔑 Generate Key'}
          </button>
        </div>

        {/* Active keys */}
        {guestKeys.length > 0 && (
          <>
            <div className="section-label">Active Keys</div>
            {guestKeys.map(key => (
              <div key={key.id} className="rylo-card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 20 }}>🔑</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: '#00d4ff' }}>{key.code}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{formatExpiry(key.expires)}</div>
                </div>
                <button
                  onClick={() => revoke(key.id)}
                  style={{
                    background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.2)',
                    borderRadius: 8, padding: '5px 10px', color: '#ff3b3b', fontSize: 10,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
