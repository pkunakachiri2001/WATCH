/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           RYLO SMART HOME — SECURE HUB SERVER               ║
 * ║           WebSocket Bridge: Watch ↔ Unity House              ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Architecture:
 *   [ Rylo Watch App ] ──WS──▶ [ Hub Server ] ──WS──▶ [ Unity House ]
 *
 * Port: 8080
 */

const WebSocket = require('ws')
const http = require('http')
const { v4: uuidv4 } = require('uuid')

// ──────────────────────────────
// Config
// ──────────────────────────────
const PORT = Number(process.env.PORT || 8080)
const HEARTBEAT_INTERVAL = 15000
const MAX_CLIENTS = 20

// ──────────────────────────────
// State
// ──────────────────────────────
const clients = new Map()   // clientId → { ws, type, lastPing, authenticated }
const homeState = {
  frontDoor:     { locked: true },
  backDoor:      { locked: true },
  garageDoor:    { locked: true },
  livingLight:   { on: false, brightness: 80, color: '#ffffff' },
  bedroomLight:  { on: false, brightness: 60, color: '#ffeedd' },
  kitchenLight:  { on: false, brightness: 100, color: '#ffffff' },
  outsideLight:  { on: false, brightness: 100, color: '#ffffff' },
  thermostat:    { temperature: 22, mode: 'cool', fan: 'auto' },
  camera1:       { active: false, recording: false },
  camera2:       { active: false, recording: false },
  alarm:         { armed: false, triggered: false },
  mainPower:     { on: true, usage: 2.4 },
}
let emergencyMode = false

// ──────────────────────────────
// Logger
// ──────────────────────────────
const log = {
  info:  (msg, ...a) => console.log(`\x1b[36m[RYLO HUB]\x1b[0m ${msg}`, ...a),
  ok:    (msg, ...a) => console.log(`\x1b[32m[RYLO HUB]\x1b[0m ${msg}`, ...a),
  warn:  (msg, ...a) => console.log(`\x1b[33m[RYLO HUB]\x1b[0m ${msg}`, ...a),
  error: (msg, ...a) => console.log(`\x1b[31m[RYLO HUB]\x1b[0m ${msg}`, ...a),
  em:    (msg, ...a) => console.log(`\x1b[41m\x1b[37m[EMERGENCY]\x1b[0m ${msg}`, ...a),
}

// ──────────────────────────────
// HTTP + WebSocket Server
// ──────────────────────────────
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', service: 'rylo-hub' }))
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('RYLO Hub WebSocket server is running.')
})

const wss = new WebSocket.Server({ server })

log.info(`Starting Rylo Hub on port ${PORT}...`)
log.info(`Waiting for Rylo Watch and Unity House connections...`)

wss.on('connection', (ws, req) => {
  if (clients.size >= MAX_CLIENTS) {
    ws.close(1008, 'Max clients reached')
    return
  }

  const clientId = uuidv4().slice(0, 8)
  const ip = req.socket.remoteAddress || 'unknown'

  clients.set(clientId, {
    ws,
    type: 'unknown',
    lastPing: Date.now(),
    authenticated: false,
    ip,
  })

  log.info(`Client connected: ${clientId} from ${ip}`)

  // Send welcome
  send(ws, {
    type: 'WELCOME',
    clientId,
    hubVersion: '1.0.0',
    timestamp: Date.now(),
  })

  // ── Message Handler ──
  ws.on('message', (rawData) => {
    let msg
    try {
      msg = JSON.parse(rawData.toString())
    } catch (e) {
      log.warn(`Bad JSON from ${clientId}`)
      return
    }

    const client = clients.get(clientId)
    if (!client) return

    handleMessage(clientId, client, msg)
  })

  ws.on('close', () => {
    log.warn(`Client disconnected: ${clientId} (${clients.get(clientId)?.type || 'unknown'})`)
    clients.delete(clientId)
    broadcastToAll({
      type: 'CLIENT_DISCONNECTED',
      clientId,
      timestamp: Date.now(),
    })
  })

  ws.on('error', (err) => {
    log.error(`Error from ${clientId}:`, err.message)
  })

  // Set up heartbeat
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })
})

// ──────────────────────────────
// Message Handler
// ──────────────────────────────
function handleMessage(clientId, client, msg) {
  client.lastPing = Date.now()

  switch (msg.type) {

    // ── Handshake ──
    case 'HANDSHAKE': {
      const deviceType = msg.device || 'UNKNOWN'
      client.type = deviceType
      client.authenticated = true
      clients.set(clientId, client)
      log.ok(`Handshake: ${clientId} identified as ${deviceType}`)

      send(client.ws, {
        type: 'HANDSHAKE_ACK',
        status: 'OK',
        homeState,
        timestamp: Date.now(),
      })

      // Notify Unity that watch connected
      if (deviceType === 'RYLO_WATCH') {
        broadcastToType('UNITY_HOUSE', {
          type: 'WATCH_CONNECTED',
          clientId,
          timestamp: Date.now(),
        })
      }
      break
    }

    // ── Ping ──
    case 'PING': {
      send(client.ws, { type: 'PONG', timestamp: Date.now() })
      break
    }

    // ── Control Command ──
    case 'CONTROL': {
      if (!client.authenticated) {
        send(client.ws, { type: 'ERROR', message: 'Not authenticated' })
        return
      }

      log.info(`[CTRL] ${msg.category} → ${msg.device} → ${msg.action}`)

      // Update home state
      updateHomeState(msg)

      // Forward to Unity
      broadcastToType('UNITY_HOUSE', {
        type: 'HOME_COMMAND',
        ...msg,
        fromClient: clientId,
        timestamp: Date.now(),
      })

      // Acknowledge to watch
      send(client.ws, {
        type: 'COMMAND_ACK',
        category: msg.category,
        device: msg.device,
        action: msg.action,
        timestamp: Date.now(),
      })

      // Broadcast state update to all
      broadcastStateUpdate(msg.device)
      break
    }

    // ── Scene Command ──
    case 'SCENE': {
      log.info(`[SCENE] Activating: ${msg.scene}`)
      applyScene(msg.scene, clientId)
      break
    }

    // ── Emergency ──
    case 'EMERGENCY': {
      emergencyMode = true
      log.em(`🚨 EMERGENCY TRIGGERED by ${clientId}`)
      log.em(`Type: ${msg.emergencyType}`)

      // Execute emergency actions in state
      if (msg.actions?.lockAllDoors) {
        homeState.frontDoor.locked = true
        homeState.backDoor.locked = true
        homeState.garageDoor.locked = true
      }
      if (msg.actions?.activateAllCameras) {
        homeState.camera1.active = true
        homeState.camera2.active = true
        homeState.camera1.recording = true
        homeState.camera2.recording = true
      }
      if (msg.actions?.activateAlarm) {
        homeState.alarm.armed = true
        homeState.alarm.triggered = true
      }
      if (msg.actions?.turnOnAllLights) {
        Object.keys(homeState)
          .filter(k => 'on' in homeState[k])
          .forEach(k => { homeState[k].on = true; homeState[k].brightness = 100 })
      }

      // Forward full emergency to Unity
      broadcastToType('UNITY_HOUSE', {
        type: 'EMERGENCY',
        ...msg,
        fromClient: clientId,
        timestamp: Date.now(),
      })

      // Acknowledge
      send(client.ws, {
        type: 'EMERGENCY_ACK',
        message: 'Emergency services are being notified',
        timestamp: Date.now(),
      })

      // Broadcast updated state
      broadcastToAll({
        type: 'FULL_STATE_UPDATE',
        homeState,
        emergency: true,
        timestamp: Date.now(),
      })
      break
    }

    // ── Cancel Emergency ──
    case 'EMERGENCY_CANCEL': {
      emergencyMode = false
      log.warn(`Emergency cancelled by ${clientId}`)
      homeState.alarm.triggered = false

      broadcastToType('UNITY_HOUSE', {
        type: 'EMERGENCY_CANCEL',
        fromClient: clientId,
        timestamp: Date.now(),
      })

      broadcastToAll({
        type: 'FULL_STATE_UPDATE',
        homeState,
        emergency: false,
        timestamp: Date.now(),
      })
      break
    }

    // ── Auth success ──
    case 'AUTH': {
      if (msg.action === 'SUCCESS') {
        log.ok(`Watch authentication verified for ${clientId}`)
        broadcastToType('UNITY_HOUSE', {
          type: 'OWNER_HOME',
          timestamp: Date.now(),
        })
      }
      break
    }

    // ── Unity registration ──
    case 'REGISTER_UNITY': {
      client.type = 'UNITY_HOUSE'
      clients.set(clientId, client)
      log.ok(`Unity House registered: ${clientId}`)

      // Send current state to Unity
      send(client.ws, {
        type: 'FULL_STATE_UPDATE',
        homeState,
        emergency: emergencyMode,
        timestamp: Date.now(),
      })
      break
    }

    default: {
      log.warn(`Unknown message type: ${msg.type} from ${clientId}`)
    }
  }
}

// ──────────────────────────────
// State Helpers
// ──────────────────────────────
function updateHomeState(msg) {
  const { category, device, action, brightness, color, temperature, mode, fan, recording } = msg

  switch (category) {
    case 'LOCK':
      if (homeState[device]) homeState[device].locked = action === 'LOCK'
      break
    case 'LIGHT':
      if (homeState[device]) {
        homeState[device].on = action === 'ON'
        if (brightness !== undefined) homeState[device].brightness = brightness
        if (color !== undefined) homeState[device].color = color
      }
      break
    case 'THERMOSTAT':
      if (homeState.thermostat) {
        if (temperature !== undefined) homeState.thermostat.temperature = temperature
        if (mode !== undefined) homeState.thermostat.mode = mode
        if (fan !== undefined) homeState.thermostat.fan = fan
      }
      break
    case 'CAMERA':
      if (homeState[device]) {
        homeState[device].active = action === 'ACTIVATE'
        if (recording !== undefined) homeState[device].recording = recording
      }
      break
    case 'ALARM':
      if (homeState.alarm) homeState.alarm.armed = action === 'ARM'
      break
    case 'POWER':
      if (homeState.mainPower) homeState.mainPower.on = action === 'ON'
      break
  }
}

function broadcastStateUpdate(device) {
  if (!homeState[device]) return
  broadcastToAll({
    type: 'DEVICE_UPDATE',
    device,
    state: homeState[device],
    timestamp: Date.now(),
  })
}

function applyScene(scene, fromClientId) {
  const client = clients.get(fromClientId)

  switch (scene) {
    case 'AWAY':
      ['frontDoor','backDoor','garageDoor'].forEach(d => homeState[d].locked = true)
      Object.keys(homeState).filter(k => 'on' in homeState[k]).forEach(k => homeState[k].on = false)
      homeState.camera1.active = true
      homeState.camera2.active = true
      break
    case 'HOME':
      homeState.camera1.active = false
      homeState.camera2.active = false
      homeState.alarm.armed = false
      homeState.livingLight.on = true
      homeState.livingLight.brightness = 70
      break
    case 'SLEEP':
      ['frontDoor','backDoor','garageDoor'].forEach(d => homeState[d].locked = true)
      homeState.bedroomLight.on = true
      homeState.bedroomLight.brightness = 10
      homeState.livingLight.on = false
      homeState.kitchenLight.on = false
      homeState.alarm.armed = true
      break
    case 'SECURE':
      Object.keys(homeState).filter(k => 'locked' in homeState[k]).forEach(k => homeState[k].locked = true)
      homeState.alarm.armed = true
      homeState.camera1.active = true
      homeState.camera2.active = true
      break
    case 'PARTY':
      Object.keys(homeState).filter(k => 'on' in homeState[k]).forEach(k => { homeState[k].on = true; homeState[k].brightness = 100 })
      break
  }

  broadcastToAll({
    type: 'SCENE_ACTIVATED',
    scene,
    homeState,
    timestamp: Date.now(),
  })
}

// ──────────────────────────────
// Broadcast Helpers
// ──────────────────────────────
function send(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

function broadcastToAll(data, excludeId = null) {
  const payload = JSON.stringify(data)
  clients.forEach((client, id) => {
    if (id !== excludeId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload)
    }
  })
}

function broadcastToType(type, data) {
  const payload = JSON.stringify(data)
  clients.forEach((client) => {
    if (client.type === type && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload)
    }
  })
}

// ──────────────────────────────
// Heartbeat
// ──────────────────────────────
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      log.warn('Terminating stale client')
      return ws.terminate()
    }
    ws.isAlive = false
    ws.ping()
  })
}, HEARTBEAT_INTERVAL)

// ──────────────────────────────
// Server ready
// ──────────────────────────────
server.listen(PORT, () => {
  console.log('\n')
  console.log('\x1b[36m╔══════════════════════════════════════╗\x1b[0m')
  console.log('\x1b[36m║    RYLO SECURE HUB — ONLINE          ║\x1b[0m')
  console.log('\x1b[36m╠══════════════════════════════════════╣\x1b[0m')
  console.log(`\x1b[36m║  Port:  ${PORT}                          ║\x1b[0m`)
  console.log(`\x1b[36m║  Watch: ws://localhost:${PORT}           ║\x1b[0m`)
  console.log(`\x1b[36m║  Unity: ws://localhost:${PORT}           ║\x1b[0m`)
  console.log('\x1b[36m╚══════════════════════════════════════╝\x1b[0m')
  console.log('\n')
})

wss.on('error', (err) => {
  log.error('Server error:', err.message)
})

process.on('SIGINT', () => {
  log.warn('Shutting down Rylo Hub...')
  broadcastToAll({ type: 'HUB_SHUTDOWN', timestamp: Date.now() })
  wss.close(() => server.close(() => process.exit(0)))
})
