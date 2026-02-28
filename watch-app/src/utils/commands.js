// Rylo Command Protocol v1.0
// All commands sent over WebSocket to the Hub → Unity House

export const Commands = {
  // Door/Lock commands
  LOCK_DOOR: (doorId, locked) => ({
    type: 'CONTROL',
    category: 'LOCK',
    device: doorId,
    action: locked ? 'LOCK' : 'UNLOCK',
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),

  // Light commands
  SET_LIGHT: (lightId, on, brightness = 100, color = '#ffffff') => ({
    type: 'CONTROL',
    category: 'LIGHT',
    device: lightId,
    action: on ? 'ON' : 'OFF',
    brightness,
    color,
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),

  // Thermostat commands
  SET_THERMOSTAT: (temperature, mode = 'cool', fan = 'auto') => ({
    type: 'CONTROL',
    category: 'THERMOSTAT',
    device: 'thermostat',
    temperature,
    mode,
    fan,
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),

  // Camera commands
  SET_CAMERA: (cameraId, active, recording = false) => ({
    type: 'CONTROL',
    category: 'CAMERA',
    device: cameraId,
    action: active ? 'ACTIVATE' : 'DEACTIVATE',
    recording,
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),

  // Alarm commands
  SET_ALARM: (armed) => ({
    type: 'CONTROL',
    category: 'ALARM',
    device: 'alarm',
    action: armed ? 'ARM' : 'DISARM',
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),

  // Emergency commands
  EMERGENCY_TRIGGER: (type, location = null) => ({
    type: 'EMERGENCY',
    emergencyType: type, // 'PANIC' | 'FIRE' | 'MEDICAL' | 'INTRUDER'
    location,
    actions: {
      lockAllDoors: true,
      activateAllCameras: true,
      activateAlarm: true,
      notifyContacts: true,
      callServices: true,
      recordAudio: true,
      turnOnAllLights: true
    },
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),

  EMERGENCY_CANCEL: () => ({
    type: 'EMERGENCY_CANCEL',
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),

  // Guest key commands
  GENERATE_GUEST_KEY: (duration = 3600, permissions = ['frontDoor']) => ({
    type: 'CONTROL',
    category: 'GUEST_KEY',
    action: 'GENERATE',
    duration,
    permissions,
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),

  REVOKE_GUEST_KEY: (keyId) => ({
    type: 'CONTROL',
    category: 'GUEST_KEY',
    action: 'REVOKE',
    keyId,
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),

  // Scene commands
  ACTIVATE_SCENE: (sceneName) => ({
    type: 'SCENE',
    scene: sceneName, // 'AWAY' | 'HOME' | 'SLEEP' | 'PARTY' | 'SECURE'
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),

  // Power commands
  SET_MAIN_POWER: (on) => ({
    type: 'CONTROL',
    category: 'POWER',
    device: 'mainPower',
    action: on ? 'ON' : 'OFF',
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),

  // Auth event
  AUTH_SUCCESS: (biometricHash) => ({
    type: 'AUTH',
    action: 'SUCCESS',
    biometricHash,
    timestamp: Date.now(),
    source: 'RYLO_WATCH'
  }),
}

export const SCENE_CONFIGS = {
  AWAY: 'Away Mode — All locked, cameras active',
  HOME: 'Home Mode — Secure but relaxed',
  SLEEP: 'Sleep Mode — Doors locked, dim lights',
  PARTY: 'Party Mode — Lights on, music vibes',
  SECURE: 'Lockdown — Maximum security'
}
