import { useEffect, useRef, useState } from 'react'
import { useWatchStore } from '../../store/watchStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import AuthScreen from '../screens/AuthScreen'
import HomeScreen from '../screens/HomeScreen'
import LockControl from '../screens/LockControl'
import LightsControl from '../screens/LightsControl'
import ThermostatControl from '../screens/ThermostatControl'
import CameraControl from '../screens/CameraControl'
import EmergencyScreen from '../screens/EmergencyScreen'
import GuestAccess from '../screens/GuestAccess'
import EnergyScreen from '../screens/EnergyScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import FitnessScreen from '../screens/FitnessScreen'
import WeatherScreen from '../screens/WeatherScreen'
import MediaScreen from '../screens/MediaScreen'
import QuickSettingsScreen from '../screens/QuickSettingsScreen'
import StopwatchScreen from '../screens/StopwatchScreen'
import TimerScreen from '../screens/TimerScreen'
import './WatchScreen.css'

const SCREENS = {
  auth: AuthScreen,
  home: HomeScreen,
  locks: LockControl,
  lights: LightsControl,
  thermostat: ThermostatControl,
  cameras: CameraControl,
  emergency: EmergencyScreen,
  guest: GuestAccess,
  energy: EnergyScreen,
  notifications: NotificationsScreen,
  fitness: FitnessScreen,
  weather: WeatherScreen,
  media: MediaScreen,
  quickSettings: QuickSettingsScreen,
  stopwatch: StopwatchScreen,
  timer: TimerScreen,
}

const SWIPE_ORDER = [
  'home',
  'notifications',
  'fitness',
  'weather',
  'media',
  'quickSettings',
  'stopwatch',
  'timer',
  'locks',
  'lights',
  'thermostat',
  'cameras',
  'guest',
  'energy',
]

const APP_DOT_ORDER = [
  'home',
  'notifications',
  'fitness',
  'weather',
  'media',
  'quickSettings',
  'stopwatch',
  'timer',
]

export default function WatchUI() {
  const { currentScreen, updateTime, setHeartRate, nudgeFitness, updateMedia, setScreen } = useWatchStore()
  const { send } = useWebSocket()
  const pointerStartRef = useRef(null)
  const wrapperRef = useRef(null)
  const scrollTargetRef = useRef(null)
  const lastHapticRef = useRef(0)
  const [swipeTransition, setSwipeTransition] = useState('')
  const [scrollState, setScrollState] = useState({ visible: false, progress: 0 })

  const triggerHaptic = (ms = 8) => {
    const now = Date.now()
    if (now - lastHapticRef.current < 50) return
    lastHapticRef.current = now
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms)
    }
  }

  const triggerSwipeTransition = (dir) => {
    setSwipeTransition('')
    requestAnimationFrame(() => setSwipeTransition(dir))
    setTimeout(() => setSwipeTransition(''), 200)
  }

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => updateTime(), 1000)
    return () => clearInterval(interval)
  }, [])

  // Simulate heart rate fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate(68 + Math.floor(Math.random() * 12))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Background activity simulation: steps
  useEffect(() => {
    const interval = setInterval(() => {
      nudgeFitness()
    }, 5000)
    return () => clearInterval(interval)
  }, [nudgeFitness])

  useEffect(() => {
    const interval = setInterval(() => {
      const { watchFeatures } = useWatchStore.getState()
      if (!watchFeatures.media.isPlaying) return
      const nextProgress = watchFeatures.media.progress + 1
      if (nextProgress >= watchFeatures.media.duration) {
        useWatchStore.getState().nextTrack()
        return
      }
      updateMedia({ progress: nextProgress })
    }, 1000)
    return () => clearInterval(interval)
  }, [updateMedia])

  useEffect(() => {
    const root = wrapperRef.current
    if (!root) return

    const onPress = (event) => {
      if (event.target?.closest?.('button,.home-tile,.thermo-btn,.pin-key,.back-btn,.rylo-toggle,.color-chip')) {
        triggerHaptic(6)
      }
    }

    root.addEventListener('pointerdown', onPress, true)
    return () => root.removeEventListener('pointerdown', onPress, true)
  }, [])

  useEffect(() => {
    const root = wrapperRef.current
    if (!root) return

    const updateScrollState = (target) => {
      if (!target) {
        setScrollState({ visible: false, progress: 0 })
        return
      }
      const maxScroll = target.scrollHeight - target.clientHeight
      if (maxScroll <= 8) {
        setScrollState({ visible: false, progress: 0 })
        return
      }
      setScrollState({
        visible: true,
        progress: Math.min(1, Math.max(0, target.scrollTop / maxScroll)),
      })
    }

    const bindScroll = () => {
      const target = root.querySelector('.screen-content, .screen-scroll')

      if (scrollTargetRef.current && scrollTargetRef.current !== target) {
        scrollTargetRef.current.removeEventListener('scroll', onScroll)
      }

      scrollTargetRef.current = target
      if (target) {
        target.addEventListener('scroll', onScroll, { passive: true })
      }

      updateScrollState(target)
    }

    const onScroll = () => {
      updateScrollState(scrollTargetRef.current)
    }

    const raf = requestAnimationFrame(bindScroll)

    return () => {
      cancelAnimationFrame(raf)
      if (scrollTargetRef.current) {
        scrollTargetRef.current.removeEventListener('scroll', onScroll)
      }
    }
  }, [currentScreen])

  const ScreenComponent = SCREENS[currentScreen] || HomeScreen

  const onPointerDown = (event) => {
    if (currentScreen === 'auth' || currentScreen === 'emergency') return
    const target = event.target
    if (target?.closest?.('button,input,textarea,[data-no-swipe="true"]')) return
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      t: Date.now(),
    }
  }

  const onPointerUp = (event) => {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start) return
    if (currentScreen === 'auth' || currentScreen === 'emergency') return

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const dt = Date.now() - start.t

    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2 || dt > 650) return

    const currentIdx = SWIPE_ORDER.indexOf(currentScreen)
    if (currentIdx === -1) return

    if (dx < 0 && currentIdx < SWIPE_ORDER.length - 1) {
      triggerHaptic(10)
      triggerSwipeTransition('left')
      setScreen(SWIPE_ORDER[currentIdx + 1])
      return
    }

    if (dx > 0 && currentIdx > 0) {
      triggerHaptic(10)
      triggerSwipeTransition('right')
      setScreen(SWIPE_ORDER[currentIdx - 1])
    }
  }

  const onWheel = (event) => {
    const root = wrapperRef.current
    if (!root) return
    const target = root.querySelector('.screen-content, .screen-scroll')
    if (!target) return

    event.preventDefault()
    event.stopPropagation()
    target.scrollTop += event.deltaY
  }

  const dotIndex = APP_DOT_ORDER.indexOf(currentScreen)
  const showAppDots = dotIndex !== -1
  const showOverlay = currentScreen !== 'auth' && currentScreen !== 'emergency'

  const jumpToDotScreen = (screen) => {
    if (screen === currentScreen) return
    const current = APP_DOT_ORDER.indexOf(currentScreen)
    const next = APP_DOT_ORDER.indexOf(screen)
    triggerHaptic(10)
    triggerSwipeTransition(next > current ? 'left' : 'right')
    setScreen(screen)
  }

  return (
    <div
      className="watch-ui-root"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      <div ref={wrapperRef} className={`watch-ui-screen-wrapper ${swipeTransition ? `screen-swipe-${swipeTransition}` : ''}`}>
        <ScreenComponent send={send} />
      </div>

      {showOverlay && scrollState.visible ? (
        <div className="crown-scroll-track" aria-hidden>
          <div className="crown-scroll-thumb" style={{ transform: `translateY(${scrollState.progress * 78}px)` }} />
        </div>
      ) : null}

      {showOverlay && showAppDots ? (
        <div className="watch-ui-page-dots" aria-hidden>
          {APP_DOT_ORDER.map((screen) => (
            <button
              key={screen}
              className={`watch-ui-page-dot ${screen === currentScreen ? 'active' : ''}`}
              onClick={() => jumpToDotScreen(screen)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
