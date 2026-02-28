import { create } from 'zustand'

const fallbackLocalHub = 'ws://localhost:8080'
const envHubUrl = (import.meta.env?.VITE_HUB_URL || '').trim()
const configuredHubUrl = envHubUrl || fallbackLocalHub

export const useWatchStore = create((set, get) => ({
  // Auth state
  isAuthenticated: false,
  isAuthenticating: false,
  authStep: 'pin', // 'pin' | 'biometric' | 'verified'

  // Connection state
  isConnected: false,
  connectionStatus: 'disconnected', // 'disconnected' | 'connecting' | 'connected'
  hubUrl: configuredHubUrl,

  // Screen state
  currentScreen: 'auth', // 'auth' | 'home' | 'locks' | 'lights' | 'thermostat' | 'cameras' | 'emergency' | 'guest' | 'energy'
  previousScreen: null,

  // Home devices state
  devices: {
    frontDoor: { locked: true, label: 'Front Door' },
    garageDoor: { locked: true, label: 'Garage' },
    backDoor: { locked: true, label: 'Back Door' },
    livingLight: { on: false, brightness: 80, color: '#ffffff', label: 'Living Room' },
    bedroomLight: { on: false, brightness: 60, color: '#ffeedd', label: 'Bedroom' },
    kitchenLight: { on: false, brightness: 100, color: '#ffffff', label: 'Kitchen' },
    outsideLight: { on: false, brightness: 100, color: '#ffffff', label: 'Outside' },
    thermostat: { temperature: 22, mode: 'cool', fan: 'auto', label: 'Thermostat' },
    camera1: { active: false, recording: false, label: 'Front Camera' },
    camera2: { active: false, recording: false, label: 'Back Camera' },
    alarm: { armed: false, triggered: false, label: 'Alarm System' },
    mainPower: { on: true, usage: 2.4, label: 'Main Power' },
  },

  // Emergency state
  emergencyActive: false,
  emergencyType: null,

  // Guest access
  guestKeys: [],

  // Notifications
  notifications: [
    { id: 1, title: 'Meeting Reminder', body: 'Dean demo in 15 minutes', app: 'Calendar', time: 'Now', read: false },
    { id: 2, title: 'New Message', body: 'Friend: Unity scene updated', app: 'Messages', time: '2m', read: false },
    { id: 3, title: 'Hydration', body: 'Time to drink water', app: 'Health', time: '20m', read: true },
  ],

  // General watch features
  watchFeatures: {
    doNotDisturb: false,
    notificationsEnabled: true,
    fitness: {
      steps: 6842,
      goal: 10000,
      calories: 412,
      distanceKm: 5.1,
      activeMinutes: 47,
      standHours: 8,
      heartZone: 'Cardio',
    },
    weather: {
      location: 'City Center',
      condition: 'Partly Cloudy',
      temperature: 24,
      feelsLike: 26,
      humidity: 62,
      windKmh: 14,
      high: 29,
      low: 20,
    },
    media: {
      isPlaying: true,
      title: 'Skyline Drive',
      artist: 'Nova Echo',
      source: 'Spotify',
      progress: 118,
      duration: 245,
      volume: 62,
    },
  },

  // Watch UI
  watchTilt: 0,
  screenBrightness: 100,
  batteryLevel: 87,
  heartRate: 72,
  currentTime: new Date(),

  // Actions
  setScreen: (screen) => set((state) => ({
    previousScreen: state.currentScreen,
    currentScreen: screen
  })),

  goBack: () => set((state) => ({
    currentScreen: state.previousScreen || 'home',
    previousScreen: null
  })),

  setAuthenticated: (val) => set({ isAuthenticated: val, currentScreen: val ? 'home' : 'auth' }),

  toggleDevice: (deviceKey) => set((state) => {
    const device = state.devices[deviceKey]
    const updated = { ...state.devices }
    if ('locked' in device) {
      updated[deviceKey] = { ...device, locked: !device.locked }
    } else if ('on' in device) {
      updated[deviceKey] = { ...device, on: !device.on }
    } else if ('active' in device) {
      updated[deviceKey] = { ...device, active: !device.active }
    }
    return { devices: updated }
  }),

  setDeviceValue: (deviceKey, field, value) => set((state) => ({
    devices: {
      ...state.devices,
      [deviceKey]: { ...state.devices[deviceKey], [field]: value }
    }
  })),

  triggerEmergency: (type) => set({
    emergencyActive: true,
    emergencyType: type,
    currentScreen: 'emergency'
  }),

  cancelEmergency: () => set({
    emergencyActive: false,
    emergencyType: null,
    currentScreen: 'home'
  }),

  addGuestKey: (key) => set((state) => ({
    guestKeys: [...state.guestKeys, key]
  })),

  removeGuestKey: (id) => set((state) => ({
    guestKeys: state.guestKeys.filter(k => k.id !== id)
  })),

  addNotification: (notif) => set((state) => ({
    notifications: [{ id: Date.now(), read: false, ...notif }, ...state.notifications].slice(0, 20)
  })),

  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),

  toggleDnd: () => set((state) => ({
    watchFeatures: {
      ...state.watchFeatures,
      doNotDisturb: !state.watchFeatures.doNotDisturb,
    }
  })),

  updateMedia: (patch) => set((state) => ({
    watchFeatures: {
      ...state.watchFeatures,
      media: {
        ...state.watchFeatures.media,
        ...patch,
      }
    }
  })),

  nextTrack: () => set((state) => ({
    watchFeatures: {
      ...state.watchFeatures,
      media: {
        ...state.watchFeatures.media,
        title: state.watchFeatures.media.title === 'Skyline Drive' ? 'Midnight Engine' : 'Skyline Drive',
        artist: state.watchFeatures.media.artist === 'Nova Echo' ? 'Aurora Lane' : 'Nova Echo',
        progress: 0,
        duration: state.watchFeatures.media.title === 'Skyline Drive' ? 221 : 245,
        isPlaying: true,
      }
    }
  })),

  prevTrack: () => set((state) => ({
    watchFeatures: {
      ...state.watchFeatures,
      media: {
        ...state.watchFeatures.media,
        title: state.watchFeatures.media.title === 'Skyline Drive' ? 'Night Runner' : 'Skyline Drive',
        artist: state.watchFeatures.media.artist === 'Nova Echo' ? 'Vector Bloom' : 'Nova Echo',
        progress: 0,
        duration: state.watchFeatures.media.title === 'Skyline Drive' ? 203 : 245,
        isPlaying: true,
      }
    }
  })),

  nudgeFitness: () => set((state) => {
    const nextSteps = state.watchFeatures.fitness.steps + Math.floor(Math.random() * 6)
    const nextDistance = Number((nextSteps / 1340).toFixed(1))
    const nextCalories = Math.round(nextSteps * 0.06)
    return {
      watchFeatures: {
        ...state.watchFeatures,
        fitness: {
          ...state.watchFeatures.fitness,
          steps: nextSteps,
          distanceKm: nextDistance,
          calories: nextCalories,
        }
      }
    }
  }),

  setConnected: (val) => set({
    isConnected: val,
    connectionStatus: val ? 'connected' : 'disconnected'
  }),

  updateTime: () => set({ currentTime: new Date() }),

  setHeartRate: (rate) => set({ heartRate: rate }),

  setScreenBrightness: (value) => set({ screenBrightness: Math.max(20, Math.min(100, Number(value))) }),

  setBattery: (level) => set({ batteryLevel: level }),
}))
