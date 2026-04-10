import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react'

interface MetronomeConfig {
  bpm: number
  ventEnabled: boolean
  ventIntervalMs: number
}

interface MetronomeContextType {
  isPlaying: boolean
  config: MetronomeConfig
  start: (config?: Partial<MetronomeConfig>) => void
  stop: () => void
  toggle: (config?: Partial<MetronomeConfig>) => void
}

const defaultConfig: MetronomeConfig = { bpm: 110, ventEnabled: false, ventIntervalMs: 6000 }

const MetronomeContext = createContext<MetronomeContextType | null>(null)

export function MetronomeProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [config, setConfig] = useState<MetronomeConfig>(defaultConfig)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<number | null>(null)
  const ventIntervalRef = useRef<number | null>(null)
  const silentAudioRef = useRef<HTMLAudioElement | null>(null)

  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  function playClick() {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 800
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  }

  function playVentBeep() {
    const ctx = getAudioCtx()
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.value = 1200
    gain1.gain.setValueAtTime(0.6, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start()
    osc1.stop(ctx.currentTime + 0.15)
    setTimeout(() => {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.value = 1500
      gain2.gain.setValueAtTime(0.6, ctx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start()
      osc2.stop(ctx.currentTime + 0.15)
    }, 180)
  }

  function startSilentAudio() {
    if (silentAudioRef.current) return
    try {
      const audio = document.createElement('audio')
      audio.setAttribute('loop', '')
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
      audio.volume = 0.01
      audio.play().catch(() => {})
      silentAudioRef.current = audio
    } catch {}
  }

  function stopSilentAudio() {
    if (silentAudioRef.current) {
      silentAudioRef.current.pause()
      silentAudioRef.current.src = ''
      silentAudioRef.current = null
    }
  }

  const start = useCallback((overrides?: Partial<MetronomeConfig>) => {
    const cfg = { ...config, ...overrides }
    setConfig(cfg)

    // Clear existing
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (ventIntervalRef.current) clearInterval(ventIntervalRef.current)

    // Start silent audio for iOS
    startSilentAudio()

    // Compression clicks
    const msPerBeat = 60000 / cfg.bpm
    intervalRef.current = window.setInterval(playClick, msPerBeat)

    // Ventilation beeps
    if (cfg.ventEnabled) {
      ventIntervalRef.current = window.setInterval(playVentBeep, cfg.ventIntervalMs)
    }

    setIsPlaying(true)
  }, [config])

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (ventIntervalRef.current) { clearInterval(ventIntervalRef.current); ventIntervalRef.current = null }
    stopSilentAudio()
    setIsPlaying(false)
  }, [])

  const toggle = useCallback((overrides?: Partial<MetronomeConfig>) => {
    if (isPlaying) stop()
    else start(overrides)
  }, [isPlaying, start, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (ventIntervalRef.current) clearInterval(ventIntervalRef.current)
      stopSilentAudio()
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [])

  return (
    <MetronomeContext.Provider value={{ isPlaying, config, start, stop, toggle }}>
      {children}
      {/* Banner global quando metronomo ativo */}
      {isPlaying && (
        <div className="fixed top-0 left-0 right-0 z-[9998] bg-accent text-white text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-3">
          <span className="animate-pulse">Metrônomo ativo — {config.bpm} BPM</span>
          <button onClick={stop} className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold border-none cursor-pointer text-white">Parar</button>
        </div>
      )}
    </MetronomeContext.Provider>
  )
}

export function useMetronome() {
  const context = useContext(MetronomeContext)
  if (!context) throw new Error('useMetronome deve ser usado dentro de MetronomeProvider')
  return context
}
