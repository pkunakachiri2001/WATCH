import { useWatchStore } from '../../store/watchStore'

function formatTime(total) {
  const m = Math.floor(total / 60)
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function MediaScreen() {
  const { watchFeatures, goBack, updateMedia, nextTrack, prevTrack } = useWatchStore()
  const media = watchFeatures.media

  const progressPct = Math.min(100, (media.progress / media.duration) * 100)

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <span className="screen-title">Music</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{media.source}</span>
      </div>

      <div className="screen-content">
        <div className="rylo-card" style={{ textAlign: 'center' }}>
          <div style={{
            width: 120,
            height: 120,
            margin: '0 auto',
            borderRadius: 18,
            background: 'linear-gradient(135deg, #2c3139, #5f6978)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 38,
          }}>
            🎵
          </div>

          <div style={{ fontSize: 14, color: '#eef2f8', marginTop: 12, fontWeight: 600 }}>{media.title}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{media.artist}</div>

          <div className="energy-bar-wrap" style={{ marginTop: 12 }}>
            <div className="energy-bar-fill" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #7f8da1, #dce3ee)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
            <span>{formatTime(media.progress)}</span>
            <span>{formatTime(media.duration)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14 }}>
            <button className="thermo-btn" onClick={prevTrack}>⏮</button>
            <button className="thermo-btn" onClick={() => updateMedia({ isPlaying: !media.isPlaying })}>
              {media.isPlaying ? '⏸' : '▶'}
            </button>
            <button className="thermo-btn" onClick={nextTrack}>⏭</button>
          </div>
        </div>

        <div className="section-label">Volume</div>
        <div className="rylo-card" style={{ marginBottom: 0 }}>
          <input
            className="rylo-slider"
            type="range"
            min="0"
            max="100"
            value={media.volume}
            onChange={(e) => updateMedia({ volume: Number(e.target.value) })}
          />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'right' }}>{media.volume}%</div>
        </div>
      </div>
    </div>
  )
}
