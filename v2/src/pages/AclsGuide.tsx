import { useState, useEffect, useRef, useCallback, useMemo, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import { Disclaimer } from '../components/layout/Disclaimer'
// Header disponível se necessário
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
// Card disponível se necessário
import { Button } from '../components/common/Button'
import { Collapsible } from '../components/common/Collapsible'
import { Modal } from '../components/common/Modal'
import { useToast } from '../contexts/ToastContext'
// fmt disponível se necessário
import type { FABItem } from '../types/clinical'

// ==========================================
// TYPES
// ==========================================

type Screen =
  | 'start'
  | 'ovace'
  | 'rhythm'
  | 'code'
  | 'rosc'
  | 'death'
  | 'report'
  | 'history'

type Rhythm = 'shockable' | 'nonshockable'

type OvaceStep =
  | 'assessment'
  | 'mild'
  | 'severe'
  | 'conscious'
  | 'unconscious'
  | 'expelled'

interface ACLSEvent {
  time: number
  type: 'system' | 'rhythm' | 'cycle' | 'med' | 'shock' | 'etco2' | 'fct' | 'outcome'
  detail: string
}

interface MedCount {
  [name: string]: number
}

interface ACLSState {
  running: boolean
  startTime: number | null
  rhythm: Rhythm | null
  cycleCount: number
  shockCount: number
  events: ACLSEvent[]
  lastEpiTime: number | null
  epiInterval: number
  amio300Given: boolean
  amio150Given: boolean
  advancedAirway: boolean
  metronomeOn: boolean
  ventMetronomeOn: boolean
  outcome: 'rosc' | 'death' | null
  endTime: number | null
  fctTracking: boolean
  pauseStart: number | null
  totalPauseTime: number
  cycleStartTime: number | null
  medCounts: MedCount
}

interface HistoryRecord {
  id: string
  num: number
  date: string
  startTime: string
  endTime: string
  rhythm: string
  outcome: string
  cycles: number
  shocks: number
  duration: number
  report: string
}

type ACLSAction =
  | { type: 'START' }
  | { type: 'SET_RHYTHM'; rhythm: Rhythm }
  | { type: 'INCREMENT_CYCLE' }
  | { type: 'REGISTER_SHOCK' }
  | { type: 'REGISTER_MED'; name: string }
  | { type: 'SET_ADVANCED_AIRWAY'; value: boolean }
  | { type: 'SET_METRONOME'; value: boolean }
  | { type: 'SET_VENT_METRONOME'; value: boolean }
  | { type: 'SET_EPI_INTERVAL'; value: number }
  | { type: 'SET_FCT_TRACKING'; value: boolean }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'ADD_EVENT'; event: ACLSEvent }
  | { type: 'FINISH_ROSC' }
  | { type: 'FINISH_DEATH' }
  | { type: 'RESET' }
  | { type: 'SET_LAST_EPI_TIME'; time: number }

// ==========================================
// CLINICAL CONTENT
// ==========================================

const OVACE_SIGNS = [
  'Tosse fraca ou ausente',
  'Incapaz de falar ou chorar',
  'Cianose',
  'Alteração do estado mental',
  'Apneia',
]

interface HsTs {
  name: string
  action: string
  link?: { label: string; path: string }
}

const HS_CAUSES: HsTs[] = [
  {
    name: 'Hipovolemia',
    action: 'SF 0,9% 500 ml bolus rápido, repetir conforme necessidade. Hemoderivados se trauma ou hemorragia ativa.',
  },
  {
    name: 'Hipóxia',
    action: 'FiO₂ 100%. Considerar IOT. Verificar posição do tubo.',
    link: { label: 'Airway Guide', path: '/airway' },
  },
  {
    name: 'Hidrogênio (acidose)',
    action: 'Bicarbonato de sódio 1 mEq/kg IV. Considerar se PCR prolongada, acidose prévia ou hipercalemia.',
  },
  {
    name: 'Hipo/Hipercalemia',
    action: 'Hipercalemia: Gluconato de cálcio 10% 20 ml IV (2-5 min), Insulina regular 10 UI + Glicose 50% 25 g IV, Bicarbonato 50 mEq IV. Hipocalemia: KCl 20 mEq IV em 1h, Sulfato de magnésio 2 g IV.',
  },
  {
    name: 'Hipotermia',
    action: 'Reaquecimento ativo: SF aquecido 42 °C IV, manta térmica, lavagem peritoneal/pleural se grave (menor que 30 °C). Manter RCP — não declarar óbito até reaquecer.',
  },
]

const TS_CAUSES: HsTs[] = [
  {
    name: 'Tensão (pneumotórax hipertensivo)',
    action: 'Descompressão com agulha no 2° EIC linha hemiclavicular ou 5° EIC linha axilar anterior. Seguida de drenagem torácica.',
  },
  {
    name: 'Tamponamento cardíaco',
    action: 'Pericardiocentese guiada por USG (subxifoide). Volume rápido IV para manter pré-carga. Considerar toracotomia de emergência se trauma.',
  },
  {
    name: 'Toxinas',
    action: 'Identificar agente e administrar antídoto específico. Considerar carvão ativado se ingestão recente.',
    link: { label: 'Tox Path', path: '/tox' },
  },
  {
    name: 'Trombose pulmonar (TEP)',
    action: 'Trombólise: Alteplase 50 mg IV em bolus durante a RCP. Se suspeita forte, considerar trombólise empírica. Manter RCP por pelo menos 60-90 min após trombólise.',
  },
  {
    name: 'Trombose coronaria (IAM)',
    action: 'Cateterismo de emergência (ICP) se disponível. Se não: trombólise com tenecteplase ou alteplase. ECG 12 derivações pós-ROSC.',
  },
]

interface MedConfig {
  name: string
  dose: string
  group: string
}

const MEDICATIONS: MedConfig[] = [
  { name: 'Epinefrina 1 mg IV/IO', dose: 'A cada 3-5 min', group: 'Vasopressor' },
  { name: 'Amiodarona 300 mg IV', dose: '1ª dose (após 3° choque)', group: 'Antiarrítmicos' },
  { name: 'Amiodarona 150 mg IV', dose: '2ª dose', group: 'Antiarrítmicos' },
  { name: 'Lidocaína 100 mg IV', dose: 'Alternativa: 1-1,5 mg/kg', group: 'Antiarrítmicos' },
  { name: 'Sulfato de magnésio 2 g IV', dose: 'Torsades de Pointes', group: 'Eletrólitos e outros' },
  { name: 'Gluconato de cálcio 3 g IV', dose: 'Hipercalemia / bloq. cálcio', group: 'Eletrólitos e outros' },
  { name: 'Bicarbonato de sódio 1 mEq/kg IV', dose: 'Acidose / hipercalemia', group: 'Eletrólitos e outros' },
]

const ROSC_CHECKLIST = [
  'Via aérea: avaliar/confirmar posicionamento',
  'FiO₂ 100% até SpO₂ confiável, depois alvo 90-98%',
  'PaCO2 alvo 35-45 mmHg',
  'PAM alvo maior ou igual a 65 mmHg',
  'ECG 12 derivações',
  'Considere TC e/ou eco a beira-leito',
  'Segue comandos? Se não: controle de temperatura (32-37,5 °C por pelo menos 36h)',
  'Considere cate se: ST supra persistente, choque cardiogênico, arritmia refratária',
  'Avalie convulsão, solicite EEG se não segue comandos',
  'Evite hipoglicemia (menor que 70) e hiperglicemia (maior que 180)',
]

// ==========================================
// REDUCER
// ==========================================

const INITIAL_STATE: ACLSState = {
  running: false,
  startTime: null,
  rhythm: null,
  cycleCount: 0,
  shockCount: 0,
  events: [],
  lastEpiTime: null,
  epiInterval: 240,
  amio300Given: false,
  amio150Given: false,
  advancedAirway: false,
  metronomeOn: false,
  ventMetronomeOn: false,
  outcome: null,
  endTime: null,
  fctTracking: false,
  pauseStart: null,
  totalPauseTime: 0,
  cycleStartTime: null,
  medCounts: {},
}

function aclsReducer(state: ACLSState, action: ACLSAction): ACLSState {
  switch (action.type) {
    case 'START':
      return {
        ...INITIAL_STATE,
        running: true,
        startTime: Date.now(),
        events: [{ time: 0, type: 'system', detail: 'Código iniciado' }],
      }
    case 'SET_RHYTHM':
      return {
        ...state,
        rhythm: action.rhythm,
        events: [
          ...state.events,
          {
            time: getElapsed(state.startTime),
            type: 'rhythm',
            detail: action.rhythm === 'shockable' ? 'FV/TV sem pulso' : 'AESP/Assistolia',
          },
        ],
        cycleStartTime: Date.now(),
      }
    case 'INCREMENT_CYCLE':
      return {
        ...state,
        cycleCount: state.cycleCount + 1,
        events: [
          ...state.events,
          {
            time: getElapsed(state.startTime),
            type: 'cycle',
            detail: `Ciclo ${state.cycleCount + 1} completo`,
          },
        ],
      }
    case 'REGISTER_SHOCK':
      return {
        ...state,
        shockCount: state.shockCount + 1,
        events: [
          ...state.events,
          {
            time: getElapsed(state.startTime),
            type: 'shock',
            detail: `Choque ${state.shockCount + 1}`,
          },
        ],
      }
    case 'REGISTER_MED': {
      const newCounts = { ...state.medCounts }
      newCounts[action.name] = (newCounts[action.name] || 0) + 1
      const updates: Partial<ACLSState> = { medCounts: newCounts }
      if (action.name.includes('300')) updates.amio300Given = true
      if (action.name.includes('150') && action.name.includes('Amiodarona')) updates.amio150Given = true
      return {
        ...state,
        ...updates,
        events: [
          ...state.events,
          { time: getElapsed(state.startTime), type: 'med', detail: action.name },
        ],
      }
    }
    case 'SET_LAST_EPI_TIME':
      return { ...state, lastEpiTime: action.time }
    case 'SET_ADVANCED_AIRWAY':
      return {
        ...state,
        advancedAirway: action.value,
        events: action.value
          ? [
              ...state.events,
              { time: getElapsed(state.startTime), type: 'system', detail: 'Via aérea avançada confirmada' },
            ]
          : state.events,
      }
    case 'SET_METRONOME':
      return { ...state, metronomeOn: action.value }
    case 'SET_VENT_METRONOME':
      return { ...state, ventMetronomeOn: action.value }
    case 'SET_EPI_INTERVAL':
      return { ...state, epiInterval: action.value }
    case 'SET_FCT_TRACKING':
      return { ...state, fctTracking: action.value }
    case 'TOGGLE_PAUSE': {
      if (!state.pauseStart) {
        return {
          ...state,
          pauseStart: Date.now(),
          events: [
            ...state.events,
            { time: getElapsed(state.startTime), type: 'fct', detail: 'Pausa nas compressões' },
          ],
        }
      } else {
        const pauseDuration = Date.now() - state.pauseStart
        return {
          ...state,
          totalPauseTime: state.totalPauseTime + pauseDuration,
          pauseStart: null,
          events: [
            ...state.events,
            {
              time: getElapsed(state.startTime),
              type: 'fct',
              detail: `Compressões retomadas (pausa: ${Math.round(pauseDuration / 1000)}s)`,
            },
          ],
        }
      }
    }
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.event] }
    case 'FINISH_ROSC':
      return {
        ...state,
        outcome: 'rosc',
        endTime: Date.now(),
        running: false,
        events: [
          ...state.events,
          { time: getElapsed(state.startTime), type: 'outcome', detail: 'RCE obtido' },
        ],
      }
    case 'FINISH_DEATH':
      return {
        ...state,
        outcome: 'death',
        endTime: Date.now(),
        running: false,
        events: [
          ...state.events,
          { time: getElapsed(state.startTime), type: 'outcome', detail: 'Óbito declarado' },
        ],
      }
    case 'RESET':
      return { ...INITIAL_STATE }
    default:
      return state
  }
}

function getElapsed(startTime: number | null): number {
  if (!startTime) return 0
  return Math.floor((Date.now() - startTime) / 1000)
}

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ==========================================
// HOOKS
// ==========================================

/** Hook for metronome audio (110 BPM compressions + ventilation) */
function useMetronome() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const compIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ventIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Silent audio to keep iOS audio session alive
  const silentSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const isPlayingRef = useRef(false)

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioCtxRef.current
  }, [])

  const playTick = useCallback((freq: number, dur: number, type: OscillatorType = 'sine') => {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur)
  }, [getAudioCtx])

  const playVentSound = useCallback(() => {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
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
      const ctx2 = getAudioCtx()
      const osc2 = ctx2.createOscillator()
      const gain2 = ctx2.createGain()
      osc2.type = 'sine'
      osc2.frequency.value = 1500
      gain2.gain.setValueAtTime(0.6, ctx2.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.15)
      osc2.connect(gain2)
      gain2.connect(ctx2.destination)
      osc2.start()
      osc2.stop(ctx2.currentTime + 0.15)
    }, 180)
  }, [getAudioCtx])

  const playAlert = useCallback(() => {
    playTick(600, 0.15, 'square')
    setTimeout(() => playTick(600, 0.15, 'square'), 200)
  }, [playTick])

  const startSilentAudio = useCallback(() => {
    try {
      const ctx = getAudioCtx()
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      const gain = ctx.createGain()
      gain.gain.value = 0.001
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start()
      silentSourceRef.current = source
    } catch (_) {
      // Silent audio not critical
    }
  }, [getAudioCtx])

  const start = useCallback((advancedAirway: boolean) => {
    if (isPlayingRef.current) return
    isPlayingRef.current = true
    startSilentAudio()
    // 110 BPM = 545ms interval
    compIntervalRef.current = setInterval(() => {
      playTick(880, 0.08, 'sine')
    }, 545)
    if (advancedAirway) {
      ventIntervalRef.current = setInterval(() => {
        playVentSound()
      }, 6000)
    }
  }, [playTick, playVentSound, startSilentAudio])

  const stop = useCallback(() => {
    isPlayingRef.current = false
    if (compIntervalRef.current) { clearInterval(compIntervalRef.current); compIntervalRef.current = null }
    if (ventIntervalRef.current) { clearInterval(ventIntervalRef.current); ventIntervalRef.current = null }
    if (silentSourceRef.current) {
      try { silentSourceRef.current.stop() } catch (_) { /* noop */ }
      silentSourceRef.current = null
    }
  }, [])

  const updateVent = useCallback((advancedAirway: boolean) => {
    if (!isPlayingRef.current) return
    if (ventIntervalRef.current) { clearInterval(ventIntervalRef.current); ventIntervalRef.current = null }
    if (advancedAirway) {
      ventIntervalRef.current = setInterval(() => {
        playVentSound()
      }, 6000)
    }
  }, [playVentSound])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (compIntervalRef.current) clearInterval(compIntervalRef.current)
      if (ventIntervalRef.current) clearInterval(ventIntervalRef.current)
      if (silentSourceRef.current) {
        try { silentSourceRef.current.stop() } catch (_) { /* noop */ }
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close() } catch (_) { /* noop */ }
        audioCtxRef.current = null
      }
    }
  }, [])

  // Identidade estavel: sem useMemo, o objeto novo a cada render fazia o effect
  // de cleanup do consumidor disparar a cada re-render e matar os timers.
  return useMemo(
    () => ({ start, stop, updateVent, playAlert, playTick, isPlaying: isPlayingRef }),
    [start, stop, updateVent, playAlert, playTick]
  )
}

/** Hook for Wake Lock API */
function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const request = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch (_) { /* Not supported or denied */ }
  }, [])

  const release = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => { release() }
  }, [release])

  return useMemo(() => ({ request, release }), [request, release])
}

// ==========================================
// COMPONENT
// ==========================================

export default function AclsGuide() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [state, dispatch] = useReducer(aclsReducer, INITIAL_STATE)
  const [screen, setScreen] = useState<Screen>('start')
  const [ovaceStep, setOvaceStep] = useState<OvaceStep>('assessment')
  const [cycleRemaining, setCycleRemaining] = useState(120)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [checkRhythmOpen, setCheckRhythmOpen] = useState(false)
  const [etco2Input, setEtco2Input] = useState('')
  const [roscChecks, setRoscChecks] = useState<Record<number, boolean>>({})
  const [reportText, setReportText] = useState('')
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)

  // Epi timer state
  const [epiElapsed, setEpiElapsed] = useState(0)

  // Refs for intervals
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mainTickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const epiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const metronome = useMetronome()
  const wakeLock = useWakeLock()

  // ==========================================
  // CLEANUP HELPER
  // ==========================================

  const clearAllIntervals = useCallback(() => {
    if (cycleTimerRef.current) { clearInterval(cycleTimerRef.current); cycleTimerRef.current = null }
    if (mainTickRef.current) { clearInterval(mainTickRef.current); mainTickRef.current = null }
    if (epiTimerRef.current) { clearInterval(epiTimerRef.current); epiTimerRef.current = null }
    metronome.stop()
  }, [metronome])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllIntervals()
      wakeLock.release()
    }
  }, [clearAllIntervals, wakeLock])

  // ==========================================
  // BEFOREUNLOAD guard
  // ==========================================

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (stateRef.current.running) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // ==========================================
  // MAIN TICK (total elapsed)
  // ==========================================

  const startMainTick = useCallback(() => {
    if (mainTickRef.current) clearInterval(mainTickRef.current)
    mainTickRef.current = setInterval(() => {
      if (stateRef.current.startTime) {
        setTotalElapsed(getElapsed(stateRef.current.startTime))
      }
    }, 1000)
  }, [])

  // ==========================================
  // EPI TIMER
  // ==========================================

  const startEpiTimer = useCallback(() => {
    if (epiTimerRef.current) clearInterval(epiTimerRef.current)
    epiTimerRef.current = setInterval(() => {
      if (stateRef.current.lastEpiTime && stateRef.current.running) {
        setEpiElapsed(Math.floor((Date.now() - stateRef.current.lastEpiTime) / 1000))
      }
    }, 1000)
  }, [])

  // ==========================================
  // CYCLE TIMER
  // ==========================================

  const startCycleTimer = useCallback(() => {
    setCycleRemaining(120)
    if (cycleTimerRef.current) clearInterval(cycleTimerRef.current)
    cycleTimerRef.current = setInterval(() => {
      setCycleRemaining(prev => {
        if (prev <= 1) {
          if (cycleTimerRef.current) clearInterval(cycleTimerRef.current)
          // Trigger check rhythm
          dispatch({ type: 'INCREMENT_CYCLE' })
          if (navigator.vibrate) navigator.vibrate(500)
          metronome.playAlert()
          setCheckRhythmOpen(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [metronome])

  // ==========================================
  // GUIDE LOGIC
  // ==========================================

  function getGuide(): { text: string; sub: string; type: 'action' | 'info' | 'alert' | 'success' } {
    if (!state.rhythm) return { text: 'RCP de alta qualidade', sub: '', type: 'action' }

    if (state.rhythm === 'shockable') {
      if (state.shockCount >= 2 && !state.amio300Given) {
        return { text: 'Considere amiodarona 300 mg IV', sub: 'Após 3° choque sem sucesso', type: 'alert' }
      }
      if (state.shockCount >= 4 && state.amio300Given && !state.amio150Given) {
        return { text: 'Considere amiodarona 150 mg IV', sub: 'Dose adicional', type: 'alert' }
      }
      return {
        text: 'RCP de alta qualidade + prepare choque',
        sub: `Mantenha epinefrina a cada ${state.epiInterval / 60} min`,
        type: 'action',
      }
    }

    return {
      text: 'RCP de alta qualidade',
      sub: `Mantenha epinefrina a cada ${state.epiInterval / 60} min`,
      type: 'action',
    }
  }

  // ==========================================
  // NUDGE LOGIC
  // ==========================================

  function getNudges(): { id: string; text: string; urgent: boolean }[] {
    const nudges: { id: string; text: string; urgent: boolean }[] = []
    const t = totalElapsed

    // Epi nudge
    if (state.lastEpiTime === null) {
      if (state.rhythm === 'nonshockable' || (state.rhythm === 'shockable' && state.cycleCount >= 1)) {
        nudges.push({ id: 'epi', text: 'Considere epinefrina 1 mg IV/IO', urgent: false })
      }
    } else {
      const sinceLast = (Date.now() - state.lastEpiTime) / 1000
      if (sinceLast >= state.epiInterval) {
        nudges.push({ id: 'epi', text: 'Considere epinefrina 1 mg IV/IO', urgent: true })
      }
    }

    // IV nudge (first cycle only)
    if (state.cycleCount === 0 && t < 180) {
      nudges.push({ id: 'iv', text: 'Priorize acesso IV. IO se IV não viável.', urgent: false })
    }

    // Airway nudge
    if (!state.advancedAirway && state.cycleCount >= 2) {
      nudges.push({ id: 'airway', text: 'Considere via aérea avançada', urgent: false })
    }

    // H&T nudge
    if (state.cycleCount >= 4) {
      nudges.push({ id: 'ht', text: "Revisou causas reversíveis? (H's e T's)", urgent: false })
    }

    // Max 2 visible
    return nudges.slice(0, 2)
  }

  // ==========================================
  // ACTIONS
  // ==========================================

  function handleStartCode() {
    dispatch({ type: 'START' })
    wakeLock.request()
    startMainTick()
    setScreen('rhythm')
  }

  function handleSelectRhythm(r: Rhythm) {
    dispatch({ type: 'SET_RHYTHM', rhythm: r })
    startCycleTimer()
    setScreen('code')
  }

  function handleRhythmCheck(result: 'shockable' | 'nonshockable' | 'rosc' | 'death') {
    const etco2 = etco2Input.trim()
    if (etco2) {
      dispatch({
        type: 'ADD_EVENT',
        event: { time: getElapsed(stateRef.current.startTime), type: 'etco2', detail: `ETCO2: ${etco2} mmHg` },
      })
    }
    setEtco2Input('')
    setCheckRhythmOpen(false)

    if (result === 'rosc') {
      handleFinishROSC()
      return
    }
    if (result === 'death') {
      handleFinishDeath()
      return
    }

    // Change rhythm
    dispatch({
      type: 'ADD_EVENT',
      event: {
        time: getElapsed(stateRef.current.startTime),
        type: 'rhythm',
        detail: result === 'shockable' ? 'Ritmo chocável' : 'Ritmo não chocável',
      },
    })
    // Update rhythm in state without adding a duplicate event
    dispatch({ type: 'SET_RHYTHM', rhythm: result })
    startCycleTimer()
  }

  function handleRegisterMed(name: string) {
    dispatch({ type: 'REGISTER_MED', name })

    if (name.includes('Epinefrina')) {
      dispatch({ type: 'SET_LAST_EPI_TIME', time: Date.now() })
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
      startEpiTimer()
    }
  }

  function handleRegisterShock() {
    dispatch({ type: 'REGISTER_SHOCK' })
    if (navigator.vibrate) navigator.vibrate(200)
  }

  function handleToggleAirway() {
    const newVal = !state.advancedAirway
    dispatch({ type: 'SET_ADVANCED_AIRWAY', value: newVal })
    if (state.metronomeOn) {
      metronome.updateVent(newVal)
    }
  }

  function handleToggleMetronome() {
    const newVal = !state.metronomeOn
    dispatch({ type: 'SET_METRONOME', value: newVal })
    if (newVal) {
      metronome.start(state.advancedAirway)
    } else {
      metronome.stop()
    }
  }

  function handleFinishROSC() {
    clearAllIntervals()
    wakeLock.release()
    dispatch({ type: 'FINISH_ROSC' })
    setRoscChecks({})
    setScreen('rosc')
  }

  function handleFinishDeath() {
    clearAllIntervals()
    wakeLock.release()
    dispatch({ type: 'FINISH_DEATH' })
    setScreen('death')
  }

  function handleConfirmDeath() {
    if (window.confirm('Confirma encerramento por óbito?')) {
      handleFinishDeath()
    }
  }

  function handleResetAndRestart() {
    clearAllIntervals()
    wakeLock.release()
    dispatch({ type: 'RESET' })
    setTotalElapsed(0)
    setCycleRemaining(120)
    setEpiElapsed(0)
    setScreen('start')
  }

  function generateReport(): string {
    const s = stateRef.current
    const lines: string[] = []
    const startDate = s.startTime ? new Date(s.startTime) : new Date()
    const dateStr = `${String(startDate.getDate()).padStart(2, '0')}/${String(startDate.getMonth() + 1).padStart(2, '0')}/${startDate.getFullYear()}`
    const timeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`

    // Load existing records count for numbering
    let records: HistoryRecord[] = []
    try { records = JSON.parse(localStorage.getItem('acls_records') || '[]') } catch (_) { /* noop */ }
    const recordNum = records.length + 1

    const elapsed = getElapsed(s.startTime)

    lines.push('RELATÓRIO DE PCR — ACLS Guide (ANY App)')
    lines.push(`Atendimento #${recordNum}`)
    lines.push(`Data: ${dateStr} | Início: ${timeStr}`)
    lines.push(`Ritmo inicial: ${s.events.find(e => e.type === 'rhythm')?.detail || '---'}`)
    lines.push(`Tempo total: ${formatElapsed(elapsed)}`)
    lines.push(`Ciclos de RCP: ${s.cycleCount}`)
    lines.push(`Choques: ${s.shockCount}`)
    lines.push(`Desfecho: ${s.outcome === 'rosc' ? 'RCE obtido' : 'Óbito'}`)

    if (s.fctTracking && s.totalPauseTime > 0) {
      const pauseSec = Math.round(s.totalPauseTime / 1000)
      const fct = Math.round(((elapsed - pauseSec) / elapsed) * 100)
      lines.push(`FCT: ${fct}% (pausas: ${pauseSec}s)`)
    }

    lines.push('')
    lines.push('LINHA DO TEMPO:')
    s.events.forEach(e => {
      lines.push(`  ${formatElapsed(e.time)} — ${e.detail}`)
    })

    if (s.endTime) {
      const endDate = new Date(s.endTime)
      lines.push(`Fim: ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`)
    }
    lines.push('')
    lines.push('AHA 2025 | ANY App v2.0.0')

    // Save to localStorage
    const endNow = s.endTime ? new Date(s.endTime) : new Date()
    const endTimeStr = `${String(endNow.getHours()).padStart(2, '0')}:${String(endNow.getMinutes()).padStart(2, '0')}`
    const record: HistoryRecord = {
      // BLOCKER-05: crypto.randomUUID evita colisao em cliques rapidos (Date.now
      // pode gerar IDs identicos em ms com baixa resolucao)
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      num: recordNum,
      date: dateStr,
      startTime: timeStr,
      endTime: endTimeStr,
      rhythm: s.events.find(e => e.type === 'rhythm')?.detail || '---',
      outcome: s.outcome === 'rosc' ? 'RCE' : 'Óbito',
      cycles: s.cycleCount,
      shocks: s.shockCount,
      duration: elapsed,
      report: lines.join('\n'),
    }
    records.push(record)
    try { localStorage.setItem('acls_records', JSON.stringify(records)) } catch (_) { /* noop */ }

    return lines.join('\n')
  }

  function handleShowReport() {
    const text = generateReport()
    setReportText(text)
    setScreen('report')
  }

  function handleCopyReport() {
    navigator.clipboard.writeText(reportText).then(() => {
      addToast('Relatório copiado!', 'success')
    })
  }

  function handleShowHistory() {
    try {
      const records: HistoryRecord[] = JSON.parse(localStorage.getItem('acls_records') || '[]')
      setHistoryRecords(records.reverse())
    } catch (_) {
      setHistoryRecords([])
    }
    setScreen('history')
  }

  function handleClearHistory() {
    if (window.confirm('Limpar todo o histórico de atendimentos?')) {
      localStorage.removeItem('acls_records')
      setHistoryRecords([])
    }
  }

  // Logo navigation guard during active CPR
  function handleLogoClick() {
    if (state.running) {
      if (window.confirm('Atendimento em andamento. Deseja encerrar e sair?')) {
        handleResetAndRestart()
        navigate('/')
      }
    } else {
      navigate('/')
    }
  }

  // Mesmo guard para navegacao a partir dos links de referencia (H's/T's)
  function navigateGuarded(path: string) {
    if (state.running && !window.confirm('Atendimento em andamento. Deseja encerrar e sair?')) return
    navigate(path)
  }

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const guide = getGuide()
  const nudges = getNudges()
  const cycleProgress = (cycleRemaining / 120) * 100
  const epiRemaining = state.lastEpiTime ? state.epiInterval - epiElapsed : null
  const epiUrgent = epiRemaining !== null && epiRemaining <= 0
  const epiProgressPct = state.lastEpiTime ? Math.min(100, (epiElapsed / state.epiInterval) * 100) : 0

  const _isCodeScreen = screen === 'code'

  // ==========================================
  // FAB ITEMS
  // ==========================================

  const fabItems: FABItem[] = [
    {
      label: 'Iniciar',
      onClick: () => {
        if (state.running && !window.confirm('Atendimento em andamento. Encerrar e iniciar um novo?')) return
        handleResetAndRestart()
        setScreen('start')
      },
    },
    { label: 'Atendimentos', onClick: handleShowHistory },
  ]

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const _guideCardBg: Record<string, string> = {
    action: 'bg-red-500/10 border-l-accent',
    info: 'bg-blue-500/10 border-l-info',
    alert: 'bg-yellow-500/15 border-l-warning',
    success: 'bg-green-500/10 border-l-success',
  }

  const guideCardBorderColor: Record<string, string> = {
    action: '#FF5252',
    info: '#2196F3',
    alert: '#FFC107',
    success: '#4CAF50',
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-[70px]">
      <Disclaimer />

      {/* ===== SCREEN: START ===== */}
      {screen === 'start' && (
        <Container>
          <div className="text-center py-5 px-4 border-b border-border mb-4">
            <img
              src="/logo.png"
              alt="ANY App"
              className="max-w-[280px] w-full h-auto mx-auto cursor-pointer"
              onClick={handleLogoClick}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <h1 className="text-[22px] font-bold mt-2 tracking-tight">ACLS Guide</h1>
            <p className="text-[13px] text-text-secondary mt-1">Guia de parada cardiorrespiratória</p>
          </div>

          {/* Start button */}
          <button
            onClick={handleStartCode}
            className="w-[200px] h-[200px] rounded-full bg-accent border-none text-white text-2xl font-bold cursor-pointer mx-auto flex items-center justify-center text-center leading-tight transition-transform active:scale-95 mt-4 mb-4"
            style={{ boxShadow: '0 0 40px rgba(255,82,82,0.3)' }}
          >
            Iniciar<br />código
          </button>

          {/* OVACE card */}
          <div
            onClick={() => { setOvaceStep('assessment'); setScreen('ovace') }}
            className="bg-bg-card border-2 border-border-card rounded-xl p-5 mt-5 cursor-pointer text-center transition-colors active:border-accent"
          >
            <div className="text-base font-semibold mb-1">OVACE</div>
            <div className="text-xs text-text-secondary">Obstrução de via aérea por corpo estranho</div>
          </div>

          {/* History card */}
          <div
            onClick={handleShowHistory}
            className="bg-bg-card border-2 border-border-card rounded-xl p-5 mt-3 cursor-pointer text-center transition-colors active:border-accent"
          >
            <div className="text-base font-semibold mb-1">Atendimentos salvos</div>
            <div className="text-xs text-text-secondary">Histórico de códigos anteriores</div>
          </div>

          <Footer toolName="ACLS Guide" version="v2.0.0" updatedAt="Abril 2026" />
        </Container>
      )}

      {/* ===== SCREEN: OVACE ===== */}
      {screen === 'ovace' && (
        <Container>
          <div className="text-center py-5 px-4 border-b border-border mb-4">
            <h1 className="text-[22px] font-bold">OVACE</h1>
            <p className="text-[13px] text-text-secondary mt-1">Obstrução de via aérea por corpo estranho (AHA 2025)</p>
          </div>

          {ovaceStep === 'assessment' && (
            <>
              <div className="rounded-xl p-5 mb-4 border-l-4 bg-yellow-500/15" style={{ borderLeftColor: '#FFC107' }}>
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Avaliação</div>
                <div className="text-lg font-semibold">O paciente apresenta sinais de OVACE grave?</div>
              </div>
              <div className="bg-bg-card rounded-lg p-4 my-3">
                {OVACE_SIGNS.map((sign, i) => (
                  <div key={i} className="text-sm py-1 text-text-secondary before:content-[''] before:inline-block">
                    <span className="text-accent mr-2">{'•'}</span>{sign}
                  </div>
                ))}
              </div>
              <Button fullWidth className="mb-2.5" onClick={() => setOvaceStep('severe')}>
                Sim — OVACE grave
              </Button>
              <Button fullWidth variant="secondary" onClick={() => setOvaceStep('mild')}>
                Não — OVACE leve
              </Button>
            </>
          )}

          {ovaceStep === 'mild' && (
            <>
              <div className="rounded-xl p-5 mb-4 border-l-4 bg-green-500/10" style={{ borderLeftColor: '#4CAF50' }}>
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">OVACE leve</div>
                <div className="text-lg font-semibold">Incentive a tosse</div>
                <div className="text-[13px] text-text-secondary mt-1.5">Continue monitorando sinais de agravamento. Não interfira enquanto a tosse for efetiva.</div>
              </div>
              <Button fullWidth variant="secondary" onClick={() => setOvaceStep('assessment')}>
                ← Voltar
              </Button>
            </>
          )}

          {ovaceStep === 'severe' && (
            <>
              <div className="rounded-xl p-5 mb-4 border-l-4 bg-red-500/10" style={{ borderLeftColor: '#FF5252' }}>
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">OVACE grave</div>
                <div className="text-lg font-semibold">O paciente está consciente?</div>
              </div>
              <Button fullWidth className="mb-2.5" onClick={() => setOvaceStep('conscious')}>
                Sim — Consciente
              </Button>
              <Button fullWidth className="mb-2.5" onClick={() => setOvaceStep('unconscious')}>
                Não — Inconsciente
              </Button>
            </>
          )}

          {ovaceStep === 'conscious' && (
            <>
              <div className="bg-red-500/10 border-l-4 rounded-lg p-4 my-3" style={{ borderLeftColor: '#FF5252' }}>
                <h3 className="text-base font-semibold mb-1">Ciclos repetidos</h3>
                <p className="text-sm text-text-secondary">5 tapas nas costas (golpes) seguidos de 5 compressões abdominais</p>
              </div>
              <div className="rounded-xl p-5 mb-4 border-l-4 bg-blue-500/10" style={{ borderLeftColor: '#2196F3' }}>
                <div className="text-lg font-semibold">Repita até que o objeto seja expelido ou o paciente fique inconsciente</div>
              </div>
              <p className="text-xs text-text-muted italic mt-2">
                Gestante ou obeso: substituir compressões abdominais por compressões torácicas.
              </p>
              <div className="mt-4 space-y-2.5">
                <Button fullWidth variant="success" onClick={() => setOvaceStep('expelled')}>
                  Objeto expelido
                </Button>
                <Button fullWidth onClick={() => setOvaceStep('unconscious')}>
                  Ficou inconsciente
                </Button>
                <Button fullWidth variant="secondary" onClick={() => setOvaceStep('assessment')}>
                  Voltar ao início
                </Button>
              </div>
            </>
          )}

          {ovaceStep === 'unconscious' && (
            <>
              <div className="bg-red-500/10 border-l-4 rounded-lg p-4 my-3" style={{ borderLeftColor: '#FF5252' }}>
                <h3 className="text-base font-semibold mb-1">Iniciar RCP</h3>
                <p className="text-sm text-text-secondary">Inicie compressões torácicas. Antes de cada ventilação, verifique se há objeto visível na boca.</p>
              </div>
              <div className="rounded-xl p-5 mb-4 border-l-4 bg-yellow-500/15" style={{ borderLeftColor: '#FFC107' }}>
                <div className="text-lg font-semibold">Acione o serviço médico de emergência</div>
              </div>
              <div className="mt-4 space-y-2.5">
                <Button fullWidth onClick={() => { setOvaceStep('assessment'); handleStartCode() }}>
                  Iniciar Código de PCR
                </Button>
                <Button fullWidth variant="secondary" onClick={() => setOvaceStep('assessment')}>
                  Voltar ao início
                </Button>
              </div>
            </>
          )}

          {ovaceStep === 'expelled' && (
            <>
              <div className="rounded-xl p-5 mb-4 border-l-4 bg-green-500/10" style={{ borderLeftColor: '#4CAF50' }}>
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Objeto expelido</div>
                <div className="text-lg font-semibold">Continue monitorando o paciente</div>
                <div className="text-[13px] text-text-secondary mt-1.5">Mantenha observação até a chegada do serviço médico de emergência.</div>
              </div>
              <Button fullWidth variant="secondary" onClick={() => setScreen('start')}>
                Voltar ao início
              </Button>
            </>
          )}

          <Footer toolName="ACLS Guide" version="v2.0.0" updatedAt="Abril 2026" />
        </Container>
      )}

      {/* ===== SCREEN: RHYTHM ===== */}
      {screen === 'rhythm' && (
        <Container>
          <div className="text-center py-5 px-4 border-b border-border mb-4">
            <img
              src="/logo.png"
              alt="ANY App"
              className="max-w-[280px] w-full h-auto mx-auto cursor-pointer"
              onClick={handleLogoClick}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <h1 className="text-[22px] font-bold mt-2">Qual o ritmo?</h1>
            <p className="text-[13px] text-text-secondary mt-1">Selecione o ritmo inicial identificado</p>
          </div>

          <div
            onClick={() => handleSelectRhythm('shockable')}
            className="bg-bg-card border-2 border-danger rounded-xl p-5 mb-3 cursor-pointer transition-colors active:border-accent hover:border-accent min-h-[70px] flex flex-col justify-center"
          >
            <div className="text-lg font-semibold">Chocável</div>
            <div className="text-[13px] text-text-secondary mt-1">FV / TV sem pulso</div>
          </div>

          <div
            onClick={() => handleSelectRhythm('nonshockable')}
            className="bg-bg-card border-2 border-info rounded-xl p-5 mb-3 cursor-pointer transition-colors active:border-accent hover:border-accent min-h-[70px] flex flex-col justify-center"
          >
            <div className="text-lg font-semibold">Não chocável</div>
            <div className="text-[13px] text-text-secondary mt-1">AESP / Assistolia</div>
          </div>
        </Container>
      )}

      {/* ===== SCREEN: CODE (main CPR) ===== */}
      {screen === 'code' && (
        <Container className="pb-[140px]">
          {/* Timer area */}
          <div
            className={`bg-bg-card rounded-xl p-5 text-center mb-4 relative overflow-hidden transition-all ${
              cycleRemaining <= 10 ? 'border-2 border-accent' : ''
            }`}
          >
            <div className="text-[13px] text-text-secondary mb-1">
              Ciclo {state.cycleCount + 1} de RCP
            </div>
            <div className="text-[56px] font-bold tabular-nums tracking-tighter leading-none">
              {formatElapsed(cycleRemaining)}
            </div>
            <div className="h-1.5 bg-[#333] rounded-[3px] mt-3 overflow-hidden">
              <div
                className="h-full bg-accent rounded-[3px] transition-[width] duration-1000 ease-linear"
                style={{ width: `${cycleProgress}%` }}
              />
            </div>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-bg-card rounded-lg p-4 text-center">
              <div className="text-xs text-text-secondary uppercase tracking-wider">Ciclos</div>
              <div className="text-[32px] font-bold tabular-nums">{state.cycleCount}</div>
            </div>
            <div className="bg-bg-card rounded-lg p-4 text-center">
              <div className="text-xs text-text-secondary uppercase tracking-wider">Choques</div>
              <div className="text-[32px] font-bold tabular-nums">{state.shockCount}</div>
            </div>
          </div>

          {/* Guide card */}
          <div
            className="rounded-xl p-5 mb-4 border-l-4"
            style={{
              borderLeftColor: guideCardBorderColor[guide.type] || '#FF5252',
              background:
                guide.type === 'action' ? 'rgba(255,82,82,0.1)' :
                guide.type === 'info' ? 'rgba(33,150,243,0.1)' :
                guide.type === 'alert' ? 'rgba(255,193,7,0.15)' :
                'rgba(76,175,80,0.1)',
            }}
          >
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Agora</div>
            <div className="text-lg font-semibold">{guide.text}</div>
            {guide.sub && <div className="text-[13px] text-text-secondary mt-1.5">{guide.sub}</div>}
          </div>

          {/* Nudges */}
          {nudges.map(nudge => (
            <div
              key={nudge.id}
              className={`rounded-lg px-4 py-3 mb-3 text-[13px] flex items-center gap-2.5 ${
                nudge.urgent
                  ? 'bg-red-500/15 border border-red-500/40 text-accent animate-nudge-urgent'
                  : 'bg-yellow-500/12 border border-yellow-500/30 text-warning animate-nudge'
              }`}
            >
              {nudge.text}
            </div>
          ))}

          {/* Shock button (shockable only) */}
          {state.rhythm === 'shockable' && (
            <button
              onClick={handleRegisterShock}
              className="w-full py-4 px-5 bg-red-500/12 border-2 border-accent rounded-xl text-accent text-lg font-bold cursor-pointer flex items-center justify-center gap-2.5 transition-all active:bg-red-500/30 active:scale-[0.97] mb-2 min-h-[48px]"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
              </svg>
              <span>CHOQUE</span>
              {state.shockCount > 0 && (
                <span className="text-sm opacity-70">#{state.shockCount}</span>
              )}
            </button>
          )}

          {/* Medications */}
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2 pl-1 mt-4">Medicações</div>
          <div className="mb-4">
            {(() => {
              let lastGroup = ''
              return MEDICATIONS.map((med, i) => {
                const showGroup = med.group !== lastGroup
                lastGroup = med.group
                const count = state.medCounts[med.name] || 0
                const isRegistered = count > 0
                return (
                  <div key={i}>
                    {showGroup && (
                      <div className="text-xs text-text-muted uppercase tracking-widest py-2 px-1 mt-1">{med.group}</div>
                    )}
                    <button
                      onClick={() => handleRegisterMed(med.name)}
                      className={`w-full text-left bg-bg-card rounded-lg p-3.5 mb-2 flex justify-between items-center cursor-pointer transition-colors active:bg-bg-hover min-h-[48px] ${
                        isRegistered ? 'border border-success bg-green-500/[0.08]' : 'border border-border-card'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[15px] text-text-primary">{med.name}</span>
                        <span className="text-xs text-text-muted">{med.dose}</span>
                      </div>
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 relative ${
                          isRegistered ? 'bg-green-500/25 text-success' : 'bg-red-500/15 text-accent'
                        }`}
                      >
                        {count > 0 && (
                          <span className="absolute -top-2 -right-2 bg-success text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                            {count}
                          </span>
                        )}
                        +
                      </div>
                    </button>

                    {/* Epi timer bar (after Epinefrina button) */}
                    {med.name.includes('Epinefrina') && state.lastEpiTime && (
                      <div
                        className={`rounded-md px-3 py-1.5 -mt-0.5 mb-2 text-xs text-text-secondary relative overflow-hidden bg-bg-card border ${
                          epiUrgent ? 'border-accent text-accent animate-pulse' : 'border-border-card'
                        }`}
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 transition-[width] duration-1000 ease-linear"
                          style={{
                            width: `${epiProgressPct}%`,
                            background: epiUrgent ? 'rgba(255,82,82,0.2)' : 'rgba(255,82,82,0.1)',
                          }}
                        />
                        <span className="relative z-10">
                          {epiUrgent
                            ? 'Epinefrina AGORA'
                            : `Próxima epi em ${formatElapsed(Math.max(0, epiRemaining || 0))}`}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>

          {/* Advanced Airway Toggle */}
          <div className="flex justify-between items-center bg-bg-card rounded-lg p-3.5 mb-2">
            <span className="text-sm">Via aérea avançada</span>
            <div
              onClick={handleToggleAirway}
              className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${
                state.advancedAirway ? 'bg-accent' : 'bg-[#333]'
              }`}
            >
              <div
                className={`w-[22px] h-[22px] bg-white rounded-full absolute top-[3px] transition-[left] ${
                  state.advancedAirway ? 'left-[23px]' : 'left-[3px]'
                }`}
              />
            </div>
          </div>

          {/* H's and T's collapsible */}
          <Collapsible title="Causas reversíveis (H's e T's)">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Hs</div>
            {HS_CAUSES.map((cause, i) => (
              <HTCard key={`h-${i}`} cause={cause} navigate={navigateGuarded} />
            ))}
            <div className="text-xs text-text-muted uppercase tracking-wider mt-4 mb-2">Ts</div>
            {TS_CAUSES.map((cause, i) => (
              <HTCard key={`t-${i}`} cause={cause} navigate={navigateGuarded} />
            ))}
          </Collapsible>

          {/* Settings collapsible */}
          <Collapsible title="Configurações">
            <div className="flex justify-between items-center bg-bg-card rounded-lg p-3.5 mb-2">
              <span className="text-[13px]">Registrar pausas (FCT)</span>
              <div
                onClick={() => dispatch({ type: 'SET_FCT_TRACKING', value: !state.fctTracking })}
                className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${
                  state.fctTracking ? 'bg-accent' : 'bg-[#333]'
                }`}
              >
                <div
                  className={`w-[22px] h-[22px] bg-white rounded-full absolute top-[3px] transition-[left] ${
                    state.fctTracking ? 'left-[23px]' : 'left-[3px]'
                  }`}
                />
              </div>
            </div>
            <div className="flex justify-between items-center bg-bg-card rounded-lg p-3.5 mb-2">
              <span className="text-[13px]">Intervalo epinefrina</span>
              <select
                value={state.epiInterval}
                onChange={(e) => dispatch({ type: 'SET_EPI_INTERVAL', value: parseInt(e.target.value) })}
                className="bg-[#333] text-white border border-border-card rounded-md px-2.5 py-1.5 text-sm"
              >
                <option value={180}>3 min</option>
                <option value={240}>4 min (sugerido)</option>
                <option value={300}>5 min</option>
              </select>
            </div>
          </Collapsible>

          {/* ===== CODE FOOTER BAR ===== */}
          <div className="fixed bottom-0 left-0 right-0 z-[100]">
            <div className="bg-bg-card/95 backdrop-blur-sm border-t border-border-card flex justify-around items-center py-1.5 px-4 max-w-[500px] mx-auto">
              <div className="text-center tabular-nums">
                <div className="text-xl font-bold">{formatElapsed(totalElapsed)}</div>
                <div className="text-xs text-text-secondary uppercase tracking-wider">Total</div>
              </div>
              <div className="text-center tabular-nums">
                <div className="text-xl font-bold">{state.cycleCount || '--'}</div>
                <div className="text-xs text-text-secondary uppercase tracking-wider">Ciclo</div>
              </div>
              {state.fctTracking && (
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all min-h-[48px] ${
                    state.pauseStart
                      ? 'bg-yellow-500/15 border-2 border-warning text-warning animate-pulse'
                      : 'bg-red-500/15 border-2 border-accent text-accent'
                  }`}
                >
                  {state.pauseStart ? 'RETOMAR' : 'Pausa'}
                </button>
              )}
              <button
                onClick={handleToggleMetronome}
                className={`px-4 py-2 rounded-full border text-xs cursor-pointer transition-all min-h-[48px] ${
                  state.metronomeOn
                    ? 'bg-accent text-white border-accent'
                    : 'bg-transparent text-text-secondary border-border-card'
                }`}
              >
                {state.metronomeOn ? 'Metrônomo ON' : 'Metrônomo'}
              </button>
            </div>
          </div>
        </Container>
      )}

      {/* ===== CHECK RHYTHM MODAL ===== */}
      <Modal open={checkRhythmOpen} onClose={() => {}} title="Checar ritmo">
        <p className="text-[13px] text-text-secondary text-center mb-5">
          Pausa menor que 10 segundos. Considere trocar compressor.
        </p>

        <div className="flex gap-2 items-center mb-4 p-3 bg-white/5 rounded-lg">
          <label className="text-[13px] text-text-secondary">ETCO2 (opcional):</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="mmHg"
            value={etco2Input}
            onChange={(e) => setEtco2Input(e.target.value)}
            className="bg-[#333] border border-border-card text-white px-2 py-1.5 rounded-md w-20 text-base text-center"
          />
          <span className="text-xs text-text-muted">mmHg</span>
        </div>

        <div className="space-y-2.5">
          <Button fullWidth onClick={() => handleRhythmCheck('shockable')}>
            Chocável — Choque
          </Button>
          <button
            onClick={() => handleRhythmCheck('nonshockable')}
            className="w-full py-4 rounded-lg text-base font-semibold cursor-pointer transition-opacity active:opacity-80 bg-info text-white border-none min-h-[48px]"
          >
            Não chocável
          </button>
          <Button fullWidth variant="success" onClick={() => handleRhythmCheck('rosc')}>
            RCE (pulso presente)
          </Button>
          <button
            onClick={() => handleRhythmCheck('death')}
            className="w-full py-4 rounded-lg text-base font-semibold cursor-pointer transition-opacity active:opacity-80 bg-[#555] text-white border-none min-h-[48px]"
          >
            Óbito
          </button>
        </div>
      </Modal>

      {/* ===== SCREEN: ROSC ===== */}
      {screen === 'rosc' && (
        <Container>
          <div className="bg-green-500/15 rounded-xl p-5 text-center mb-5">
            <h2 className="text-[22px] font-bold text-success">RCE obtido</h2>
            <div className="text-sm text-text-secondary mt-1">
              Tempo total: {formatElapsed(getElapsed(state.startTime))}
            </div>
          </div>

          <div className="text-xs text-text-muted uppercase tracking-wider mb-2 pl-1">
            Checklist pós-ROSC (AHA 2025)
          </div>

          {ROSC_CHECKLIST.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-white/5 text-sm">
              <div
                onClick={() => setRoscChecks(prev => ({ ...prev, [i]: !prev[i] }))}
                className={`w-[22px] h-[22px] min-w-[22px] border-2 rounded mt-0.5 flex items-center justify-center cursor-pointer transition-all ${
                  roscChecks[i]
                    ? 'bg-success border-success text-white'
                    : 'border-border-card'
                }`}
              >
                {roscChecks[i] && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span>{item}</span>
            </div>
          ))}

          <Button fullWidth className="mt-6" onClick={handleShowReport}>
            Gerar relatório
          </Button>

          <Footer toolName="ACLS Guide" version="v2.0.0" updatedAt="Abril 2026" />
        </Container>
      )}

      {/* ===== SCREEN: DEATH ===== */}
      {screen === 'death' && (
        <Container>
          <div className="bg-white/5 rounded-xl p-5 text-center mb-5">
            <h2 className="text-[22px] font-bold">Fim dos esforços</h2>
            <div className="text-sm text-text-secondary mt-2">
              {state.endTime && (
                <>
                  Horário do óbito: {new Date(state.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  <br />
                  Tempo total de RCP: {formatElapsed(getElapsed(state.startTime))}
                </>
              )}
            </div>
          </div>

          <Button fullWidth onClick={handleShowReport}>
            Gerar relatório
          </Button>

          <Footer toolName="ACLS Guide" version="v2.0.0" updatedAt="Abril 2026" />
        </Container>
      )}

      {/* ===== SCREEN: REPORT ===== */}
      {screen === 'report' && (
        <Container>
          <div className="text-center py-5 px-4 border-b border-border mb-4">
            <h1 className="text-[22px] font-bold">Relatório do código</h1>
          </div>

          <div className="bg-bg-card rounded-xl p-5 font-mono text-xs leading-[1.8] whitespace-pre-wrap text-text-secondary max-h-[400px] overflow-y-auto">
            {reportText}
          </div>

          <Button fullWidth className="mt-3" onClick={handleCopyReport}>
            Copiar relatório
          </Button>

          <Button fullWidth variant="secondary" className="mt-3" onClick={handleResetAndRestart}>
            Iniciar novo código
          </Button>

          <Footer toolName="ACLS Guide" version="v2.0.0" updatedAt="Abril 2026" />
        </Container>
      )}

      {/* ===== SCREEN: HISTORY ===== */}
      {screen === 'history' && (
        <Container>
          <div className="text-center py-5 px-4 border-b border-border mb-4">
            <h1 className="text-[22px] font-bold">Atendimentos salvos</h1>
          </div>

          {historyRecords.length === 0 ? (
            <div className="text-center text-text-secondary py-8">Nenhum atendimento salvo</div>
          ) : (
            historyRecords.map((r) => (
              <div
                key={r.id}
                className="bg-bg-card border border-border-card rounded-xl mb-3 overflow-hidden"
              >
                <div
                  onClick={() => setExpandedHistory(expandedHistory === r.id ? null : r.id)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold">#{r.num}</span>
                    <span className="text-xs text-text-secondary">{r.date} {r.startTime}</span>
                  </div>
                  <div className="text-xs text-text-secondary">
                    <span className={r.outcome === 'RCE' ? 'text-success font-semibold' : 'text-text-muted font-semibold'}>
                      {r.outcome}
                    </span>
                    {' | '}{formatElapsed(r.duration)}{' | '}{r.cycles} ciclos{' | '}{r.shocks} choques
                  </div>
                </div>
                {expandedHistory === r.id && (
                  <div className="px-4 pb-4">
                    <div className="bg-bg-primary rounded-lg p-3 font-mono text-xs leading-[1.8] whitespace-pre-wrap text-text-secondary max-h-[200px] overflow-y-auto">
                      {r.report}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(r.report)
                        addToast('Relatório copiado!', 'success')
                      }}
                      className="w-full mt-2 py-2 bg-bg-hover rounded-lg text-sm text-text-primary border-none cursor-pointer min-h-[48px]"
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          <Button fullWidth variant="secondary" className="mt-4" onClick={() => setScreen('start')}>
            ← Voltar
          </Button>

          <Button fullWidth variant="danger" className="mt-3" onClick={handleClearHistory}>
            Limpar histórico
          </Button>

          <Footer toolName="ACLS Guide" version="v2.0.0" updatedAt="Abril 2026" />
        </Container>
      )}

      {/* FAB only on start/code screens */}
      {(screen === 'start' || screen === 'code') && <FABMenu items={fabItems} />}
    </div>
  )
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface HTCardProps {
  cause: HsTs
  navigate: (path: string) => void
}

function HTCard({ cause, navigate }: HTCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-bg-card rounded-lg mb-2 overflow-hidden border border-border-card">
      <div
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center px-4 py-3.5 cursor-pointer"
      >
        <span className="text-sm font-medium">{cause.name}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <div
        className="overflow-hidden transition-all duration-400 ease-in-out"
        style={{ maxHeight: open ? '400px' : '0px' }}
      >
        <div className="px-4 pb-4 text-[13px] text-text-secondary leading-relaxed">
          <span className="text-accent font-semibold">{cause.action.split('.')[0]}.</span>
          {cause.action.substring(cause.action.indexOf('.') + 1)}
          {cause.link && (
            <>
              {' '}
              <button
                onClick={(e) => { e.stopPropagation(); navigate(cause.link!.path) }}
                className="text-info underline bg-transparent border-none cursor-pointer text-[13px] p-0"
              >
                {cause.link.label}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
