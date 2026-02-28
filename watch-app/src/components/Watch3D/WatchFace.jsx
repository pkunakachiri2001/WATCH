import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useWatchStore } from '../../store/watchStore'

// Canvas-based watch face (renders the dark OLED display with ambient glow)
function WatchFaceDisplay() {
  const canvasRef = useRef(document.createElement('canvas'))
  const textureRef = useRef()
  const { currentTime, batteryLevel, heartRate, isConnected } = useWatchStore()

  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width = 512
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    drawAmbientFace(ctx, canvas, currentTime, batteryLevel, heartRate, isConnected)
    if (textureRef.current) {
      textureRef.current.needsUpdate = true
    }
  }, [currentTime, batteryLevel, heartRate, isConnected])

  const texture = useMemo(() => {
    const canvas = canvasRef.current
    canvas.width = 512
    canvas.height = 600
    const t = new THREE.CanvasTexture(canvas)
    textureRef.current = t
    return t
  }, [])

  const displayShape = useMemo(() => {
    const shape = new THREE.Shape()
    const w = 0.94
    const h = 1.10
    const r = 0.20
    shape.moveTo(-w + r, -h)
    shape.lineTo(w - r, -h)
    shape.quadraticCurveTo(w, -h, w, -h + r)
    shape.lineTo(w, h - r)
    shape.quadraticCurveTo(w, h, w - r, h)
    shape.lineTo(-w + r, h)
    shape.quadraticCurveTo(-w, h, -w, h - r)
    shape.lineTo(-w, -h + r)
    shape.quadraticCurveTo(-w, -h, -w + r, -h)
    return shape
  }, [])

  const displayGeo = useMemo(() => new THREE.ShapeGeometry(displayShape, 64), [displayShape])

  const displayMat = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture,
    toneMapped: false,
  }), [texture])

  return <mesh geometry={displayGeo} material={displayMat} position={[0, 0, 0.228]} />
}

function drawAmbientFace(ctx, canvas, time, battery, heartRate, connected) {
  const W = canvas.width
  const H = canvas.height
  const cx = W / 2
  const cy = H / 2

  // Pure OLED black
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, W, H)

  // Very subtle ambient vignette
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.5)
  grd.addColorStop(0, 'rgba(255, 255, 255, 0.03)')
  grd.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, W, H)

  // Time
  const hours = String(time.getHours()).padStart(2, '0')
  const mins = String(time.getMinutes()).padStart(2, '0')
  const secs = String(time.getSeconds()).padStart(2, '0')

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 128px "Inter", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.fillText(`${hours}:${mins}`, cx, cy - 20)

  ctx.shadowBlur = 0
  ctx.font = '400 36px "Inter", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText(secs, cx, cy + 80)

  // Date
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT']
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  const dateStr = `${days[time.getDay()]} ${time.getDate()} ${months[time.getMonth()]}`
  ctx.font = '300 28px "Inter", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.letterSpacing = '4px'
  ctx.fillText(dateStr, cx, cy - 130)

  // Battery bar (top area)
  const battW = 80
  const battH = 18
  const battX = cx - battW / 2
  const battY = 40
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(battX, battY, battW, battH, 4)
  ctx.stroke()
  
  const battColor = battery > 30 ? '#dfe4ea' : battery > 15 ? '#b89a64' : '#a45a5a'
  ctx.fillStyle = battColor
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.roundRect(battX + 2, battY + 2, (battW - 4) * (battery / 100), battH - 4, 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // Battery terminal
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fillRect(battX + battW + 2, battY + 5, 5, battH - 10)

  // Battery % text
  ctx.font = '500 20px "Inter", sans-serif'
  ctx.fillStyle = battColor
  ctx.fillText(`${battery}%`, cx, battY + battH + 22)

  // Heart rate (bottom)
  ctx.fillStyle = '#d7d9de'
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.font = '400 22px "Inter", sans-serif'
  ctx.fillText(`♥  ${heartRate} BPM`, cx, H - 60)
  ctx.shadowBlur = 0

  // Connection dot
  const dotColor = connected ? '#98b79f' : '#9a6a6a'
  ctx.fillStyle = dotColor
  ctx.shadowColor = dotColor
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.arc(cx + 120, 52, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // RYLO brand (very subtle at bottom)
  ctx.font = '200 20px "Inter", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.letterSpacing = '8px'
  ctx.fillText('RYLO', cx, H - 28)
}

export default function WatchFace() {
  const faceRef = useRef()
  const { currentTime, updateTime } = useWatchStore()

  // Update clock every second
  useFrame((state) => {
    const now = Math.floor(state.clock.elapsedTime)
    if (now % 1 === 0) {
      updateTime()
    }
  })

  return (
    <group ref={faceRef}>
      <WatchFaceDisplay />
    </group>
  )
}
