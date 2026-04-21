import { useReducer, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Collapsible } from '../components/common/Collapsible'
import { AlertCard } from '../components/common/AlertCard'
import { Toggle } from '../components/common/Toggle'
import { useWeight } from '../contexts/WeightContext'
import { useToast } from '../contexts/ToastContext'
import { calcVNERi, getVNERiZone, getQuadrant, fmt, lactatoConvert } from '../utils/calculations'
import type { FABItem } from '../types/clinical'

// ==========================================
// TYPES
// ==========================================

type Screen = 'home' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'vneri' | 'gapco2' | 'referências'
  | 'vti-entry' | 'vti-measure' | 'vti-low' | 'vti-grey' | 'vti-distributive' | 'vti-result'

type VtiShockType = 'tamponamento' | 'obstrutivo' | 'cardiogênico' | 'cardiogênico-valvar' | 'hipovolemico' | 'distributivo' | null

interface TecEntry {
  value: number
  time: string
}

interface Intervention {
  text: string
  time: string
}

interface QuadranteData {
  id: string
  label: string
  color: string
  description: string
}

interface ShockState {
  screen: Screen
  tec: number | null
  lactato: number | null
  lactatoUnit: 'mmol' | 'mgdl'
  pp: number | null
  ppMode: 'direto' | 'calculado'
  pas: number | null
  fluidResp: 'sim' | 'nao' | null
  fluidMethod: string | null
  bolusTotal: number
  pad: number | null
  fc: number | null
  doseNE: number | null
  vneri: number | null
  ecoVE: boolean
  ecoVD: boolean
  ecoOutra: boolean
  scvo2: number | null
  gapCO2: number | null
  quadrante: QuadranteData | null
  htaCronica: 'sim' | 'nao' | null
  testePAM: 'sim' | 'nao' | null
  testeDobu: 'sim' | 'nao' | null
  tecHistory: TecEntry[]
  interventions: Intervention[]
  criteria: boolean[]
  tecMode: 'normal' | 'anormal' | null
  // Standalone VNERi inputs
  vneriPadS: number | null
  vneriFcS: number | null
  vneriDoseS: number | null
  vneriPesoS: number | null
  // Standalone GapCO2 inputs
  scvo2S: number | null
  gapCO2S: number | null
  quadranteS: QuadranteData | null
  // VTI module
  vtiValue: number | null
  vtiPericardio: 'sim' | 'nao' | null
  vtiVD: 'sim' | 'nao' | null
  vtiVE: 'sim' | 'nao' | null
  vtiValvar: 'sim' | 'nao' | null
  vtiFluidResp: 'sim' | 'nao' | null
  vtiVentMode: 'espontanea' | 'mecânica' | null
  vtiShockType: VtiShockType
  vtiGreyScvo2: number | null
  vtiGreyLactato: number | null
  vtiGreyGapCO2: number | null
}

type ShockAction =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_TEC'; value: number | null }
  | { type: 'SET_TEC_MODE'; mode: 'normal' | 'anormal' | null }
  | { type: 'SET_LACTATO'; value: number | null }
  | { type: 'SET_LACTATO_UNIT'; unit: 'mmol' | 'mgdl' }
  | { type: 'SET_PP'; value: number | null }
  | { type: 'SET_PP_MODE'; mode: 'direto' | 'calculado' }
  | { type: 'SET_PAS'; value: number | null }
  | { type: 'SET_FLUID_RESP'; value: 'sim' | 'nao' | null }
  | { type: 'SET_FLUID_METHOD'; method: string | null }
  | { type: 'ADD_BOLUS' }
  | { type: 'SET_PAD'; value: number | null }
  | { type: 'SET_FC'; value: number | null }
  | { type: 'SET_DOSE_NE'; value: number | null }
  | { type: 'SET_VNERI'; value: number | null }
  | { type: 'TOGGLE_ECO'; field: 'ecoVE' | 'ecoVD' | 'ecoOutra' }
  | { type: 'SET_SCVO2'; value: number | null }
  | { type: 'SET_GAPCO2'; value: number | null }
  | { type: 'SET_QUADRANTE'; value: QuadranteData | null }
  | { type: 'SET_HTA'; value: 'sim' | 'nao' | null }
  | { type: 'SET_TESTE_PAM'; value: 'sim' | 'nao' | null }
  | { type: 'SET_TESTE_DOBU'; value: 'sim' | 'nao' | null }
  | { type: 'ADD_TEC_REEVAL'; entry: TecEntry }
  | { type: 'ADD_INTERVENTION'; intervention: Intervention }
  | { type: 'TOGGLE_CRITERIA'; index: number }
  | { type: 'SET_VNERI_PAD_S'; value: number | null }
  | { type: 'SET_VNERI_FC_S'; value: number | null }
  | { type: 'SET_VNERI_DOSE_S'; value: number | null }
  | { type: 'SET_VNERI_PESO_S'; value: number | null }
  | { type: 'SET_SCVO2_S'; value: number | null }
  | { type: 'SET_GAPCO2_S'; value: number | null }
  | { type: 'SET_QUADRANTE_S'; value: QuadranteData | null }
  | { type: 'SET_VTI_VALUE'; value: number | null }
  | { type: 'SET_VTI_PERICARDIO'; value: 'sim' | 'nao' | null }
  | { type: 'SET_VTI_VD'; value: 'sim' | 'nao' | null }
  | { type: 'SET_VTI_VE'; value: 'sim' | 'nao' | null }
  | { type: 'SET_VTI_VALVAR'; value: 'sim' | 'nao' | null }
  | { type: 'SET_VTI_FLUID_RESP'; value: 'sim' | 'nao' | null }
  | { type: 'SET_VTI_VENT_MODE'; value: 'espontanea' | 'mecânica' | null }
  | { type: 'SET_VTI_SHOCK_TYPE'; value: VtiShockType }
  | { type: 'SET_VTI_GREY_SCVO2'; value: number | null }
  | { type: 'SET_VTI_GREY_LACTATO'; value: number | null }
  | { type: 'SET_VTI_GREY_GAPCO2'; value: number | null }
  | { type: 'RESET_VTI' }
  | { type: 'RESET' }

const initialState: ShockState = {
  screen: 'home',
  tec: null,
  lactato: null,
  lactatoUnit: 'mmol',
  pp: null,
  ppMode: 'direto',
  pas: null,
  fluidResp: null,
  fluidMethod: null,
  bolusTotal: 0,
  pad: null,
  fc: null,
  doseNE: null,
  vneri: null,
  ecoVE: false,
  ecoVD: false,
  ecoOutra: false,
  scvo2: null,
  gapCO2: null,
  quadrante: null,
  htaCronica: null,
  testePAM: null,
  testeDobu: null,
  tecHistory: [],
  interventions: [],
  criteria: [false, false, false, false],
  tecMode: null,
  vneriPadS: null,
  vneriFcS: null,
  vneriDoseS: null,
  vneriPesoS: null,
  scvo2S: null,
  gapCO2S: null,
  quadranteS: null,
  vtiValue: null,
  vtiPericardio: null,
  vtiVD: null,
  vtiVE: null,
  vtiValvar: null,
  vtiFluidResp: null,
  vtiVentMode: null,
  vtiShockType: null,
  vtiGreyScvo2: null,
  vtiGreyLactato: null,
  vtiGreyGapCO2: null,
}

function shockReducer(state: ShockState, action: ShockAction): ShockState {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.screen }
    case 'SET_TEC': return { ...state, tec: action.value }
    case 'SET_TEC_MODE': return { ...state, tecMode: action.mode }
    case 'SET_LACTATO': return { ...state, lactato: action.value }
    case 'SET_LACTATO_UNIT': return { ...state, lactatoUnit: action.unit }
    case 'SET_PP': return { ...state, pp: action.value }
    case 'SET_PP_MODE': return { ...state, ppMode: action.mode }
    case 'SET_PAS': return { ...state, pas: action.value }
    case 'SET_FLUID_RESP': return { ...state, fluidResp: action.value }
    case 'SET_FLUID_METHOD': return { ...state, fluidMethod: action.method }
    case 'ADD_BOLUS': {
      if (state.bolusTotal >= 1000) return state
      return { ...state, bolusTotal: state.bolusTotal + 500 }
    }
    case 'SET_PAD': return { ...state, pad: action.value }
    case 'SET_FC': return { ...state, fc: action.value }
    case 'SET_DOSE_NE': return { ...state, doseNE: action.value }
    case 'SET_VNERI': return { ...state, vneri: action.value }
    case 'TOGGLE_ECO': return { ...state, [action.field]: !state[action.field] }
    case 'SET_SCVO2': return { ...state, scvo2: action.value }
    case 'SET_GAPCO2': return { ...state, gapCO2: action.value }
    case 'SET_QUADRANTE': return { ...state, quadrante: action.value }
    case 'SET_HTA': return { ...state, htaCronica: action.value }
    case 'SET_TESTE_PAM': return { ...state, testePAM: action.value }
    case 'SET_TESTE_DOBU': return { ...state, testeDobu: action.value }
    case 'ADD_TEC_REEVAL': return { ...state, tecHistory: [...state.tecHistory, action.entry], tec: action.entry.value }
    case 'ADD_INTERVENTION': return { ...state, interventions: [...state.interventions, action.intervention] }
    case 'TOGGLE_CRITERIA': {
      const criteria = [...state.criteria]
      criteria[action.index] = !criteria[action.index]
      return { ...state, criteria }
    }
    case 'SET_VNERI_PAD_S': return { ...state, vneriPadS: action.value }
    case 'SET_VNERI_FC_S': return { ...state, vneriFcS: action.value }
    case 'SET_VNERI_DOSE_S': return { ...state, vneriDoseS: action.value }
    case 'SET_VNERI_PESO_S': return { ...state, vneriPesoS: action.value }
    case 'SET_SCVO2_S': return { ...state, scvo2S: action.value }
    case 'SET_GAPCO2_S': return { ...state, gapCO2S: action.value }
    case 'SET_QUADRANTE_S': return { ...state, quadranteS: action.value }
    case 'SET_VTI_VALUE': return { ...state, vtiValue: action.value }
    case 'SET_VTI_PERICARDIO': return { ...state, vtiPericardio: action.value }
    case 'SET_VTI_VD': return { ...state, vtiVD: action.value }
    case 'SET_VTI_VE': return { ...state, vtiVE: action.value }
    case 'SET_VTI_VALVAR': return { ...state, vtiValvar: action.value }
    case 'SET_VTI_FLUID_RESP': return { ...state, vtiFluidResp: action.value }
    case 'SET_VTI_VENT_MODE': return { ...state, vtiVentMode: action.value }
    case 'SET_VTI_SHOCK_TYPE': return { ...state, vtiShockType: action.value }
    case 'SET_VTI_GREY_SCVO2': return { ...state, vtiGreyScvo2: action.value }
    case 'SET_VTI_GREY_LACTATO': return { ...state, vtiGreyLactato: action.value }
    case 'SET_VTI_GREY_GAPCO2': return { ...state, vtiGreyGapCO2: action.value }
    case 'RESET_VTI': return {
      ...state,
      screen: 'vti-entry' as Screen,
      vtiValue: null, vtiPericardio: null, vtiVD: null, vtiVE: null,
      vtiValvar: null, vtiFluidResp: null, vtiVentMode: null, vtiShockType: null,
      vtiGreyScvo2: null, vtiGreyLactato: null, vtiGreyGapCO2: null,
    }
    case 'RESET': return { ...initialState }
    default: return state
  }
}

// ==========================================
// HELPERS
// ==========================================

function now(): string {
  const d = new Date()
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}

function getVneriCondutaText(vneri: number): string {
  if (vneri < 2.6) {
    return 'Considere associar <strong>vasopressina</strong> (0,01-0,04 UI/min) ou <strong>hidrocortisona</strong> (200 mg/dia). Escalar dose de NE isoladamente pode ser insuficiente (Goury et al. 2025).'
  } else if (vneri < 6.7) {
    return 'Titular noradrenalina conforme PAM alvo. Monitorizar tendência do VNERi. Se VNERi cair apesar de aumento de dose, considere <strong>vasopressina</strong> ou <strong>corticoides</strong> (Goury et al. 2025).'
  } else if (vneri <= 10.8) {
    return 'Zona de menor mortalidade (nadir 6,7). Manter conduta atual. Reavaliar se piora clínica (Goury et al. 2025).'
  } else {
    return 'Mortalidade em ascensão apesar de tônus preservado. Investigar: <strong>hipovolemia</strong>, <strong>disfunção miocárdica</strong>, obstrução. Considere ecocardiograma à beira-leito (Goury et al. 2025).'
  }
}

function getQuadrantConductText(id: string): string {
  switch (id) {
    case 'lowDC': return 'Considere inotrópico (dobutamina 5-20 mcg/kg/min). Avaliar ecocardiograma para guiar terapia. Checar volemia (Ltaief et al. Critical Care 2021).'
    case 'anemic': return 'Checar hemoglobina (considere transfusão se Hb < 7 g/dL) e SaO2. Otimizar oferta de oxigênio (Ltaief et al. Critical Care 2021).'
    case 'micro': return 'Otimizar perfusão periférica. Considere vasodilatadores se PAM adequada. Avaliar microcirculação (Ltaief et al. Critical Care 2021).'
    case 'cytopathic': return 'Dano mitocondrial provável. Suporte clínico. Considere limitação terapêutica conforme contexto (Ltaief et al. Critical Care 2021).'
    default: return ''
  }
}

// ==========================================
// VNERI BAR COMPONENT
// ==========================================

function VNERiBar({ vneri }: { vneri: number }) {
  const zone = getVNERiZone(vneri)
  const condutaText = getVneriCondutaText(vneri)
  const maxBar = 15
  const pct = Math.min(100, Math.max(0, (vneri / maxBar) * 100))

  return (
    <div>
      <div className="text-center my-4">
        <div className="text-xs text-text-secondary mb-1">VNERi</div>
        <div className="text-4xl font-bold leading-none" style={{ color: zone.color }}>
          {fmt(vneri, 1)}
        </div>
        <div className="text-sm font-semibold mt-1" style={{ color: zone.color }}>
          {zone.label}
        </div>
      </div>

      <div className="text-xs text-text-muted text-center mb-1">
        Mortalidade: <strong className="text-text-primary">{zone.mortality}</strong>
      </div>

      {/* Bar */}
      <div className="relative my-2 mb-7">
        <div className="flex justify-between text-xs text-text-muted mb-1 px-0.5">
          <span className="w-[17%] text-center text-danger">Hipo grave</span>
          <span className="w-[28%] text-center text-warning">Parcial</span>
          <span className="w-[27%] text-center text-success">Adequada</span>
          <span className="w-[28%] text-center text-warning">Preservado</span>
        </div>
        <div
          className="h-6 rounded-xl relative"
          style={{
            background: 'linear-gradient(to right, #F44336 0%, #F44336 17%, #FFC107 17%, #FFC107 45%, #4CAF50 45%, #4CAF50 72%, #FFC107 72%, #FFC107 100%)'
          }}
        >
          <div
            className="absolute -top-1 w-4 h-8 bg-white rounded-lg transition-all duration-300"
            style={{
              left: `calc(${pct}% - 8px)`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
            }}
          />
          <div className="absolute -bottom-[18px] w-full">
            <span className="absolute text-xs text-text-muted" style={{ left: '17%', transform: 'translateX(-50%)' }}>2,6</span>
            <span className="absolute text-xs text-text-muted" style={{ left: '45%', transform: 'translateX(-50%)' }}>6,7</span>
            <span className="absolute text-xs text-text-muted" style={{ left: '72%', transform: 'translateX(-50%)' }}>10,8</span>
          </div>
        </div>
      </div>

      {/* Conduta */}
      <div
        className="mt-7 p-3 rounded-lg text-sm leading-relaxed text-gray-200"
        style={{ background: `${zone.color}18`, borderLeft: `3px solid ${zone.color}` }}
        dangerouslySetInnerHTML={{ __html: condutaText }}
      />
    </div>
  )
}

// ==========================================
// QUADRANT GRID COMPONENT
// ==========================================

interface QuadrantGridProps {
  activeId?: string | null
  pristine?: boolean
}

const QUADRANT_CELLS = [
  { id: 'lowDC', pos: 'tl', color: '#F44336', titleColor: '#FF6B6B', title: 'Baixo débito / estase', text: 'ScvO₂ < 70% + Gap > 6\nConsidere inotrópico' },
  { id: 'anemic', pos: 'tr', color: '#FFC107', titleColor: '#FFD740', title: 'Disóxia anêmica/hipóxica', text: 'ScvO₂ < 70% + Gap ≤ 6\nChecar Hb, SaO₂' },
  { id: 'micro', pos: 'bl', color: '#FFC107', titleColor: '#FFD740', title: 'Microcirculação inadequada', text: 'ScvO₂ ≥ 70% + Gap > 6\nOtimizar perfusão' },
  { id: 'cytopathic', pos: 'br', color: '#666', titleColor: '#A0A0A0', title: 'Hipóxia citopática', text: 'ScvO₂ ≥ 70% + Gap ≤ 6\nSuporte' },
]

function QuadrantGrid({ activeId, pristine = true }: QuadrantGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 my-4">
      {QUADRANT_CELLS.map(cell => {
        const isActive = activeId === cell.id
        const isIdle = activeId && !isActive

        return (
          <div
            key={cell.id}
            className={`p-3 rounded-lg border border-border-card border-l-4 text-xs leading-relaxed transition-all duration-300 ${
              isActive ? 'scale-[1.02]' : isIdle ? 'opacity-50' : pristine ? 'opacity-85' : 'opacity-50'
            }`}
            style={{
              borderLeftColor: cell.color,
              background: isActive ? `${cell.color}15` : undefined,
            }}
          >
            <div className="font-bold mb-1 text-[13px]" style={{ color: cell.titleColor }}>
              {cell.title}
            </div>
            <div className="text-text-muted text-xs whitespace-pre-line">{cell.text}</div>
          </div>
        )
      })}
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function ShockPath() {
  const [state, dispatch] = useReducer(shockReducer, initialState)
  const { weight, setWeight } = useWeight()
  const { addToast } = useToast()
  const navigate = useNavigate()

  // ==========================================
  // NAVIGATION
  // ==========================================

  const goTo = useCallback((screen: Screen) => {
    dispatch({ type: 'SET_SCREEN', screen })
    window.scrollTo(0, 0)
  }, [])

  const addIntervention = useCallback((text: string) => {
    dispatch({ type: 'ADD_INTERVENTION', intervention: { text, time: now() } })
  }, [])

  const goToInfusion = useCallback((drug: string) => {
    if (weight) {
      localStorage.setItem('anyapp-peso', String(weight))
    }
    navigate(`/infusion${drug ? `?drug=${drug}` : ''}`)
  }, [navigate, weight])

  // ==========================================
  // STEP 1 HANDLERS
  // ==========================================

  const handlePesoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    if (!isNaN(v) && v >= 40 && v <= 200) {
      setWeight(v)
    } else if (e.target.value === '') {
      setWeight(null)
    }
  }, [setWeight])

  const handleLactatoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value)
    if (!raw || raw <= 0) {
      dispatch({ type: 'SET_LACTATO', value: null })
      return
    }
    if (state.lactatoUnit === 'mmol') {
      dispatch({ type: 'SET_LACTATO', value: raw })
    } else {
      dispatch({ type: 'SET_LACTATO', value: raw / 9 })
    }
  }, [state.lactatoUnit])

  const lactatoDisplay = useMemo(() => {
    if (state.lactato === null) return null
    const mmol = state.lactato
    const mgdl = lactatoConvert(mmol, 'mmol')
    if (state.lactatoUnit === 'mmol') {
      return `${fmt(mmol, 1)} mmol/L = ${fmt(mgdl, 1)} mg/dL`
    }
    return `${fmt(mgdl, 1)} mg/dL = ${fmt(mmol, 1)} mmol/L`
  }, [state.lactato, state.lactatoUnit])

  const handleTecToggle = useCallback((mode: 'normal' | 'anormal') => {
    dispatch({ type: 'SET_TEC_MODE', mode })
    dispatch({ type: 'SET_TEC', value: mode === 'normal' ? 3 : 4 })
  }, [])

  const handleTecInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    dispatch({ type: 'SET_TEC_MODE', mode: null })
    if (!v || v < 0) {
      dispatch({ type: 'SET_TEC', value: null })
      return
    }
    dispatch({ type: 'SET_TEC', value: v })
  }, [])

  // ==========================================
  // STEP 2 HANDLERS
  // ==========================================

  const handlePpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    dispatch({ type: 'SET_PP', value: isNaN(v) ? null : v })
  }, [])

  const handlePasChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    dispatch({ type: 'SET_PAS', value: isNaN(v) ? null : v })
  }, [])

  const handlePadCalcChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    dispatch({ type: 'SET_PAD', value: isNaN(v) ? null : v })
  }, [])

  // BLOCKER-08: PP derivado quando em modo calculado — evita closure stale em
  // handlers. A fonte da verdade em modo calculado é state.pas/pad.
  useEffect(() => {
    if (state.ppMode !== 'calculado') return
    if (state.pas != null && state.pad != null) {
      const derivedPp = state.pas - state.pad
      if (state.pp !== derivedPp) dispatch({ type: 'SET_PP', value: derivedPp })
    }
  }, [state.ppMode, state.pas, state.pad, state.pp])

  // ==========================================
  // STEP 3 HANDLERS
  // ==========================================

  const vneriInline = useMemo(() => {
    if (!state.pad || !state.fc || !state.doseNE) return null
    return calcVNERi(state.pad, state.doseNE, state.fc)
  }, [state.pad, state.fc, state.doseNE])

  const adjustDoseNE = useCallback((delta: number) => {
    const current = state.doseNE ?? 0.10
    let v = Math.round((current + delta) * 100) / 100
    if (v < 0.01) v = 0.01
    if (v > 3.0) v = 3.0
    dispatch({ type: 'SET_DOSE_NE', value: v })
  }, [state.doseNE])

  // ==========================================
  // STEP 4 HANDLERS
  // ==========================================

  const interpretarQuadrante = useCallback(() => {
    if (state.scvo2 === null || state.gapCO2 === null) return
    const q = getQuadrant(state.gapCO2, state.scvo2)
    dispatch({ type: 'SET_QUADRANTE', value: q })
  }, [state.scvo2, state.gapCO2])

  const interpretarQuadranteS = useCallback(() => {
    if (state.scvo2S === null || state.gapCO2S === null) return
    const q = getQuadrant(state.gapCO2S, state.scvo2S)
    dispatch({ type: 'SET_QUADRANTE_S', value: q })
  }, [state.scvo2S, state.gapCO2S])

  // ==========================================
  // STEP 5 — PERFIL HEMODINAMICO
  // ==========================================

  const perfil = useMemo(() => {
    const achados: { text: string; color: string }[] = []
    const condutas: string[] = []
    const naoFazer: string[] = []
    const labels: string[] = []

    if (state.tec !== null) {
      achados.push({ text: `TEC: ${fmt(state.tec)} segundos`, color: state.tec > 3 ? '#FF6B6B' : '#66BB6A' })
    }
    if (state.lactato !== null) {
      achados.push({
        text: `Lactato: ${fmt(state.lactato)} mmol/L`,
        color: state.lactato >= 4 ? '#FF6B6B' : state.lactato >= 2 ? '#FFD740' : '#66BB6A'
      })
    }
    if (state.pp !== null) {
      achados.push({ text: `Pressão de pulso: ${fmt(state.pp, 0)} mmHg`, color: state.pp < 40 ? '#FFD740' : '#66BB6A' })
    }
    if (state.bolusTotal > 0) {
      achados.push({ text: `Fluidos administrados: ${state.bolusTotal} mL`, color: '#A0A0A0' })
    }
    if (state.fluidResp !== null) {
      achados.push({ text: `Responsivo a fluidos: ${state.fluidResp === 'sim' ? 'Sim' : 'Não'}`, color: '#A0A0A0' })
    }
    if (state.pad !== null) {
      achados.push({ text: `PAD: ${fmt(state.pad, 0)} mmHg`, color: state.pad < 50 ? '#FFD740' : '#66BB6A' })
      if (state.pad < 50) labels.push('vasoplégico')
    }
    if (vneriInline !== null) {
      const vdata = getVNERiZone(vneriInline)
      achados.push({ text: `VNERi: ${fmt(vneriInline, 1)} (${vdata.label})`, color: vdata.color })
      if (vneriInline < 2.6) labels.push('vasoplégico')
    }
    if (state.ecoVE) {
      achados.push({ text: 'Ecocardiograma: VE hipocinético', color: '#FF6B6B' })
      labels.push('cardiogênico')
    }
    if (state.ecoVD) {
      achados.push({ text: 'Ecocardiograma: VD dilatado', color: '#FFD740' })
      labels.push('obstrutivo')
    }
    if (state.scvo2 !== null) {
      achados.push({ text: `ScvO2: ${fmt(state.scvo2, 0)}%`, color: state.scvo2 < 70 ? '#FFD740' : '#66BB6A' })
    }
    if (state.gapCO2 !== null) {
      achados.push({ text: `Gap CO2: ${fmt(state.gapCO2, 1)} mmHg`, color: state.gapCO2 > 6 ? '#FFD740' : '#66BB6A' })
    }
    if (state.quadrante) {
      achados.push({ text: `Quadrante: ${state.quadrante.label}`, color: state.quadrante.color })
    }

    // Condutas
    if (state.tec !== null && state.tec > 3) {
      condutas.push('Reavaliar TEC a cada 1 hora por 6 horas')
    }
    if (state.pad !== null && state.pad < 50) {
      condutas.push('Titular noradrenalina para PAD ≥ 50 mmHg (Bertrand et al. 2025)')
    }
    if (vneriInline !== null && vneriInline < 2.6) {
      condutas.push('Considere vasopressina 0,01-0,04 UI/min ou hidrocortisona 200 mg/dia (Goury et al. 2025)')
    }
    if (state.ecoVE) {
      condutas.push('Considere dobutamina 5-20 mcg/kg/min para disfunção de VE')
    }
    if (state.quadrante?.id === 'lowDC') {
      condutas.push('Considere inotrópico para baixo débito cardíaco (Ltaief et al. 2021)')
    }
    if (state.quadrante?.id === 'anemic') {
      condutas.push('Checar hemoglobina e SaO2. Considere transfusão se Hb < 7 g/dL')
    }
    if (state.htaCronica === 'sim' && state.testePAM === null) {
      condutas.push('Considere teste de PAM 80-85 mmHg por 1 hora (hipertenso crônico)')
    }
    if (state.testePAM === 'sim') {
      condutas.push('Manter PAM alvo 80-85 mmHg (teste positivo)')
    }
    if (state.testeDobu === 'sim') {
      condutas.push('Manter dobutamina (teste positivo)')
    }
    if (condutas.length === 0) {
      condutas.push('Monitorização clínica. Reavaliar TEC a cada 1 hora.')
    }

    // Nao fazer
    naoFazer.push('Evitar fluidos liberais sem avaliação de responsividade (Hernandez et al. 2025)')
    if (state.fluidResp === 'nao') {
      naoFazer.push('Não administrar mais fluidos em paciente não responsivo a volume')
    }
    if (vneriInline !== null && vneriInline < 2.6) {
      naoFazer.push('Não escalar NE isoladamente em hiporresponsividade grave (Goury et al. 2025)')
    }

    // Profile label
    const uniqueLabels = [...new Set(labels)]
    let profileLabel = 'Choque séptico'
    if (uniqueLabels.length > 1) {
      profileLabel = `Choque misto — ${uniqueLabels.join(' + ')}`
    } else if (uniqueLabels.length === 1) {
      profileLabel = `Choque séptico — componente ${uniqueLabels[0]}`
    }

    return { label: profileLabel, achados, condutas, naoFazer }
  }, [state, vneriInline])

  // Standalone VNERi
  const vneriStandalone = useMemo(() => {
    if (!state.vneriPadS || !state.vneriFcS || !state.vneriDoseS) return null
    return calcVNERi(state.vneriPadS, state.vneriDoseS, state.vneriFcS)
  }, [state.vneriPadS, state.vneriFcS, state.vneriDoseS])

  // ==========================================
  // SAVE STEP HELPERS
  // ==========================================

  const saveStep1 = useCallback(() => {
    addIntervention(`Reconhecimento: TEC ${fmt(state.tec)} s, Lactato ${fmt(state.lactato)} mmol/L`)
  }, [state.tec, state.lactato, addIntervention])

  const saveStep2 = useCallback(() => {
    if (state.pp !== null) {
      addIntervention(`PP: ${fmt(state.pp, 0)} mmHg. Fluidos: ${state.bolusTotal} mL`)
    }
  }, [state.pp, state.bolusTotal, addIntervention])

  const saveStep3 = useCallback(() => {
    if (state.pad !== null) {
      let msg = `Vasopressor: NE ${fmt(state.doseNE, 2)} mcg/kg/min, PAD ${fmt(state.pad, 0)}, FC ${fmt(state.fc, 0)}`
      if (vneriInline !== null) msg += `, VNERi ${fmt(vneriInline, 1)}`
      addIntervention(msg)
    }
  }, [state.pad, state.doseNE, state.fc, vneriInline, addIntervention])

  const saveStep4 = useCallback(() => {
    let msg = 'Perfusão: '
    if (state.scvo2 !== null) msg += `ScvO2 ${fmt(state.scvo2, 0)}%, `
    if (state.gapCO2 !== null) msg += `Gap CO2 ${fmt(state.gapCO2, 1)} mmHg`
    if (state.quadrante) msg += ` (${state.quadrante.label})`
    addIntervention(msg)
  }, [state.scvo2, state.gapCO2, state.quadrante, addIntervention])

  // ==========================================
  // FAB ITEMS
  // ==========================================

  const fabItems: FABItem[] = useMemo(() => [
    { label: 'Início', onClick: () => goTo('home') },
    { label: 'Choque séptico', onClick: () => goTo('step1') },
    { label: 'Classificação VTI', onClick: () => goTo('vti-entry') },
    { label: 'VNERi', onClick: () => goTo('vneri') },
    { label: 'Gap CO2', onClick: () => goTo('gapco2') },
    { label: 'Referências', onClick: () => goTo('referências') },
  ], [goTo])

  // ==========================================
  // SHARED COMPONENTS
  // ==========================================

  const DataBadge = ({ label, value }: { label: string; value: string }) => (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated border border-border-card rounded-full text-xs font-medium">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary font-bold">{value}</span>
    </span>
  )

  const StepHeader = ({ number, title, sub }: { number: number; title: string; sub: string }) => (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
      <div className="w-9 h-9 min-w-[36px] rounded-full bg-accent text-white flex items-center justify-center text-base font-bold">
        {number}
      </div>
      <div className="flex-1">
        <div className="text-lg font-bold">{title}</div>
        <div className="text-xs text-text-muted mt-0.5">{sub}</div>
      </div>
    </div>
  )

  const SectionTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`text-base font-bold mt-5 mb-3 text-text-primary ${className}`}>{children}</div>
  )

  const CriteriaItem = ({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-lg mb-2 text-sm cursor-pointer min-h-[44px] text-left"
    >
      <div className={`w-2.5 h-2.5 min-w-[10px] rounded-full border-2 transition-colors ${checked ? 'bg-success border-success' : 'border-border-card'}`} />
      <span className="text-text-primary">{label}</span>
    </button>
  )

  const ResultCard = ({ color, title, titleColor, children, className = '' }: {
    color: 'green' | 'red' | 'yellow' | 'blue'
    title: string
    titleColor: string
    children: React.ReactNode
    className?: string
  }) => {
    const bgMap = {
      green: 'rgba(76,175,80,0.1)',
      red: 'rgba(244,67,54,0.1)',
      yellow: 'rgba(255,193,7,0.1)',
      blue: 'rgba(33,150,243,0.1)',
    }
    const borderMap = {
      green: 'rgba(76,175,80,0.3)',
      red: 'rgba(244,67,54,0.3)',
      yellow: 'rgba(255,193,7,0.3)',
      blue: 'rgba(33,150,243,0.3)',
    }
    return (
      <div className={`p-4 rounded-xl my-4 ${className}`} style={{ background: bgMap[color], border: `1px solid ${borderMap[color]}` }}>
        <div className="text-sm font-bold mb-1.5" style={{ color: titleColor }}>{title}</div>
        <div className="text-sm leading-relaxed text-text-secondary">{children}</div>
      </div>
    )
  }

  const InfoCard = ({ title, children, borderColor = '#2196F3' }: { title: string; children: React.ReactNode; borderColor?: string }) => (
    <div className="bg-bg-card rounded-r-lg p-3 my-3 text-sm text-text-secondary leading-relaxed" style={{ borderLeft: `3px solid ${borderColor}` }}>
      <strong className="text-text-primary block mb-1">{title}</strong>
      {children}
    </div>
  )

  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="bg-transparent border-none text-text-secondary text-sm py-2 cursor-pointer flex items-center gap-1 mb-3"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
      Início
    </button>
  )

  const StepNav = ({ onBack, onNext, backLabel = 'Voltar', nextLabel = 'Próximo' }: {
    onBack: () => void
    onNext?: () => void
    backLabel?: string
    nextLabel?: string
  }) => (
    <div className="flex gap-3 mt-6 pt-4 border-t border-border">
      <Button variant="secondary" fullWidth onClick={onBack}>{backLabel}</Button>
      {onNext && <Button variant="primary" fullWidth onClick={onNext}>{nextLabel}</Button>}
    </div>
  )

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col pb-24">
      <Disclaimer />
      <Header title="Shock Path" subtitle="Avaliação hemodinâmica no choque" />

      <Container>
        {/* SCREEN: HOME */}
        {state.screen === 'home' && (
          <div className="animate-slide-in">
            <div className="text-center mt-5 mb-2">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>

            <div className="text-center mb-6">
              <div className="text-[22px] font-bold mb-1">Shock Path</div>
              <div className="text-sm text-text-secondary">Avaliação hemodinâmica no choque</div>
            </div>

            {/* Module selector */}
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Selecione o contexto</div>

            {/* Choque séptico card */}
            <button
              onClick={() => goTo('step1')}
              className="w-full bg-bg-card border border-border-card rounded-xl p-4 text-left cursor-pointer transition-all mb-3 active:bg-bg-hover active:scale-[0.98]"
              style={{ borderLeft: '4px solid #FF5252' }}
            >
              <div className="flex items-center gap-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <div className="flex-1">
                  <div className="text-base font-bold text-text-primary">Choque séptico</div>
                  <div className="text-xs text-text-muted mt-0.5">ANDROMEDA-SHOCK 2 — Protocolo CRT-PHR</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </div>
            </button>

            {/* Classificação hemodinâmica card */}
            <button
              onClick={() => goTo('vti-entry')}
              className="w-full bg-bg-card border border-border-card rounded-xl p-4 text-left cursor-pointer transition-all mb-3 active:bg-bg-hover active:scale-[0.98]"
              style={{ borderLeft: '4px solid #2196F3' }}
            >
              <div className="flex items-center gap-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-5" />
                </svg>
                <div className="flex-1">
                  <div className="text-base font-bold text-text-primary">Classificação hemodinâmica</div>
                  <div className="text-xs text-text-muted mt-0.5">VTI-based — Mercadal et al. 2022</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </div>
            </button>

            {/* Shortcuts grid */}
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              {[
                { screen: 'vneri' as Screen, label: 'VNERi', desc: 'Responsividade vascular', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
                { screen: 'gapco2' as Screen, label: 'Gap CO2', desc: 'Quadrante perfusional', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
                { screen: null, label: 'Calculadoras', desc: 'Infusão contínua', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /></svg>, onClick: () => goToInfusion('') },
                { screen: 'referências' as Screen, label: 'Referências', desc: 'Fontes e bibliografia', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick || (() => goTo(item.screen!))}
                  className="bg-bg-card border border-border-card rounded-xl py-4 px-3 text-center cursor-pointer transition-all min-h-[44px] flex flex-col items-center justify-center gap-1.5 active:bg-bg-hover active:scale-[0.97]"
                >
                  {item.icon}
                  <div className="text-[13px] font-semibold text-text-primary leading-tight">{item.label}</div>
                  <div className="text-xs text-text-muted leading-tight">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN: STEP 1 — RECONHECIMENTO */}
        {state.screen === 'step1' && (
          <div className="animate-slide-in">
            <StepHeader number={1} title="Reconhecimento do choque séptico" sub="Passo 1 de 5" />

            <SectionTitle>Critérios de reconhecimento</SectionTitle>
            <p className="text-xs text-text-muted mb-3">Marcação visual — não bloqueia navegação</p>

            {[
              'Infecção suspeita ou confirmada',
              'Lactato ≥ 2 mmol/L (ou ≥ 18 mg/dL)',
              'Noradrenalina necessária para PAM ≥ 65 mmHg',
              'Fluidos ≥ 1000 mL já administrados',
            ].map((label, i) => (
              <CriteriaItem
                key={i}
                checked={state.criteria[i]}
                label={label}
                onToggle={() => dispatch({ type: 'TOGGLE_CRITERIA', index: i })}
              />
            ))}

            <div className="h-px bg-border my-4" />

            {/* Peso */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Peso estimado (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                value={weight ?? ''}
                onChange={handlePesoChange}
                placeholder="70"
                min={40}
                max={200}
                className={`w-full bg-bg-elevated border rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none ${
                  weight && (weight < 40 || weight > 200) ? 'border-danger' : 'border-border-card focus:border-accent'
                }`}
              />
              {weight !== null && (weight < 40 || weight > 200) && (
                <div className="text-xs text-danger mt-1">Fora do range (40-200 kg)</div>
              )}
            </div>

            {/* Lactato */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Lactato</label>
              <div className="flex gap-2 items-stretch">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="2.0"
                  min={0}
                  max={30}
                  step={0.1}
                  onChange={handleLactatoChange}
                  className="flex-1 bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
                <Toggle
                  options={[
                    { value: 'mmol', label: 'mmol/L' },
                    { value: 'mgdl', label: 'mg/dL' },
                  ]}
                  value={state.lactatoUnit}
                  onChange={(v) => dispatch({ type: 'SET_LACTATO_UNIT', unit: v as 'mmol' | 'mgdl' })}
                  className="flex-shrink-0 w-[160px]"
                />
              </div>
              {lactatoDisplay && (
                <div className="text-xs text-text-muted mt-1.5">{lactatoDisplay}</div>
              )}
            </div>

            {/* TEC */}
            <SectionTitle>Tempo de enchimento capilar (TEC)</SectionTitle>
            <p className="text-xs text-text-secondary mb-3">
              Pressione o leito ungueal por 10 segundos, solte e cronometre (Hernandez et al. JAMA 2025)
            </p>

            <Toggle
              options={[
                { value: 'normal', label: 'Normal ≤ 3s' },
                { value: 'anormal', label: 'Anormal > 3s' },
              ]}
              value={state.tecMode ?? ''}
              onChange={(v) => handleTecToggle(v as 'normal' | 'anormal')}
              className="mb-3"
            />

            <p className="text-center text-xs text-text-muted my-2">ou valor preciso</p>

            <div className="mb-4">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Segundos"
                min={0}
                max={20}
                step={0.1}
                onChange={handleTecInput}
                className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
              />
            </div>

            {/* TEC Results */}
            {state.tec !== null && state.tec <= 3 && (
              <ResultCard color="green" title="TEC normal" titleColor="#66BB6A">
                Monitorização periódica recomendada. Reavaliar TEC a cada 1 hora por 6 horas (Hernandez et al. JAMA 2025).
                <div className="mt-3">
                  <TecReavalSection
                    history={state.tecHistory}
                    onSave={(v) => {
                      dispatch({ type: 'ADD_TEC_REEVAL', entry: { value: v, time: now() } })
                      addToast('TEC salvo', 'success')
                    }}
                  />
                </div>
              </ResultCard>
            )}

            {state.tec !== null && state.tec > 3 && (
              <ResultCard color="red" title="Hipoperfusão presente" titleColor="#FF6B6B">
                TEC prolongado indica hipoperfusão tecidual. Considere iniciar ressuscitação guiada por TEC (protocolo CRT-PHR).
                <Button variant="primary" fullWidth className="mt-3" onClick={() => { saveStep1(); goTo('step2') }}>
                  Iniciar Tier 1
                </Button>
              </ResultCard>
            )}

            <StepNav onBack={() => goTo('home')} backLabel="Início" />
          </div>
        )}

        {/* SCREEN: STEP 2 — FLUIDOS */}
        {state.screen === 'step2' && (
          <div className="animate-slide-in">
            <StepHeader number={2} title="Avaliação de fluidos" sub="Passo 2 de 5 — Tier 1" />

            <div className="flex flex-wrap gap-2 mb-4">
              <DataBadge label="TEC" value={state.tec ? `${fmt(state.tec)}s` : '--'} />
              <DataBadge label="Lactato" value={state.lactato ? `${fmt(state.lactato)} mmol/L` : '--'} />
            </div>

            {/* PP */}
            <SectionTitle>Pressão de pulso (PP)</SectionTitle>
            <p className="text-xs text-text-secondary mb-3">
              PP = PAS - PAD. Reflete volume sistólico (Hernandez et al. JAMA 2025).
            </p>

            <Toggle
              options={[
                { value: 'direto', label: 'Valor direto' },
                { value: 'calculado', label: 'Calcular PAS - PAD' },
              ]}
              value={state.ppMode}
              onChange={(v) => dispatch({ type: 'SET_PP_MODE', mode: v as 'direto' | 'calculado' })}
              className="mb-3"
            />

            {state.ppMode === 'direto' && (
              <div className="mb-4">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">PP (mmHg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="40"
                  onChange={handlePpChange}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
            )}

            {state.ppMode === 'calculado' && (
              <div className="flex gap-2.5 mb-4">
                <div className="flex-1">
                  <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">PAS (mmHg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="90"
                    onChange={handlePasChange}
                    className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">PAD (mmHg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="50"
                    onChange={handlePadCalcChange}
                    className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}

            {state.ppMode === 'calculado' && state.pp !== null && (
              <div className="text-center text-sm font-semibold text-text-secondary mb-3">
                PP = {fmt(state.pp, 0)} mmHg
              </div>
            )}

            {/* PP Result — Baixo */}
            {state.pp !== null && state.pp < 40 && (
              <div>
                <ResultCard color="yellow" title="PP < 40 mmHg — baixo volume sistólico provável" titleColor="#FFD740">
                  Avaliar responsividade a fluidos antes de administrar volume (Hernandez et al. JAMA 2025).
                </ResultCard>

                <SectionTitle className="!text-sm">Método de avaliação de responsividade</SectionTitle>
                <div className="flex flex-wrap gap-0 border border-border-card rounded-lg overflow-hidden mb-3">
                  {['leg', 'deltapp', 'pocus', 'challenge'].map((m) => {
                    const labels: Record<string, string> = { leg: 'Elevação de MMII', deltapp: 'Delta PP', pocus: 'POCUS', challenge: 'Fluid challenge' }
                    return (
                      <button
                        key={m}
                        onClick={() => dispatch({ type: 'SET_FLUID_METHOD', method: m })}
                        className={`flex-1 basis-[45%] py-2.5 px-2 text-sm font-medium cursor-pointer transition-colors border-none min-h-[44px] text-center ${
                          state.fluidMethod === m ? 'bg-accent text-white' : 'bg-bg-elevated text-text-secondary'
                        }`}
                      >
                        {labels[m]}
                      </button>
                    )
                  })}
                </div>

                {/* Method info */}
                {state.fluidMethod === 'leg' && (
                  <InfoCard title="Elevação passiva de MMII">
                    Elevar membros inferiores a 45 graus por 60-90 segundos. Considere responsivo se aumento &ge; 10% no volume sistólico ou débito cardíaco.
                  </InfoCard>
                )}
                {state.fluidMethod === 'deltapp' && (
                  <InfoCard title="Delta PP">
                    Em ventilação mecânica com Vt &ge; 8 mL/kg. Considere responsivo se variação de PP &gt; 13%.
                  </InfoCard>
                )}
                {state.fluidMethod === 'pocus' && (
                  <InfoCard title="POCUS">
                    Avalie variação da veia cava inferior com ventilação. Considere responsivo se variação &gt; 18% (ventilação mecânica).
                  </InfoCard>
                )}
                {state.fluidMethod === 'challenge' && (
                  <InfoCard title="Fluid challenge">
                    Administrar 250-500 mL em 10-15 min e avaliar resposta hemodinâmica. Preferir quando outros métodos não estão disponíveis.
                  </InfoCard>
                )}

                {/* Fluid responsiveness */}
                <SectionTitle className="!text-sm !mt-4">Responsivo a fluidos?</SectionTitle>
                <Toggle
                  options={[
                    { value: 'sim', label: 'Sim' },
                    { value: 'nao', label: 'Não' },
                  ]}
                  value={state.fluidResp ?? ''}
                  onChange={(v) => dispatch({ type: 'SET_FLUID_RESP', value: v as 'sim' | 'nao' })}
                  className="mb-3"
                />

                {/* Bolus section */}
                {state.fluidResp === 'sim' && (
                  <div>
                    <ResultCard color="blue" title="Bolus de cristaloide" titleColor="#64B5F6">
                      500 mL de cristaloide balanceado em 30 minutos (Hernandez et al. JAMA 2025). Máximo recomendado neste passo: 1000 mL.
                    </ResultCard>

                    <div className="flex items-center gap-3 p-4 bg-bg-elevated border border-border-card rounded-xl my-3">
                      <div>
                        <div className="text-[28px] font-bold text-accent">{state.bolusTotal} mL</div>
                        <div className="text-xs text-text-secondary">Total administrado</div>
                      </div>
                      <div className="flex-1" />
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={state.bolusTotal >= 1000}
                        onClick={() => {
                          dispatch({ type: 'ADD_BOLUS' })
                          addIntervention(`Bolus cristaloide 500 mL (total: ${state.bolusTotal + 500} mL)`)
                        }}
                      >
                        {state.bolusTotal >= 1000 ? 'Limite' : '+ 500 mL'}
                      </Button>
                    </div>

                    <SectionTitle className="!text-sm">TEC normalizou após fluidos?</SectionTitle>
                    <div className="flex gap-2">
                      <Button variant="success" fullWidth size="sm" onClick={() => { addIntervention('TEC normalizado após fluidos'); goTo('step5') }}>Sim</Button>
                      <Button variant="danger" fullWidth size="sm" onClick={() => {
                        if (state.bolusTotal < 1000) {
                          dispatch({ type: 'ADD_BOLUS' })
                          addIntervention(`Bolus cristaloide 500 mL (total: ${state.bolusTotal + 500} mL)`)
                        } else {
                          goTo('step3')
                        }
                      }}>Não</Button>
                    </div>
                  </div>
                )}

                {/* Nao responsivo */}
                {state.fluidResp === 'nao' && (
                  <div>
                    <ResultCard color="red" title="Não responsivo a volume" titleColor="#FF6B6B">
                      Considere otimizar vasopressor antes de mais fluidos. Prosseguir para avaliação de vasopressor.
                    </ResultCard>
                    <Button variant="primary" fullWidth onClick={() => goTo('step3')}>Vasopressor — Tier 1b</Button>
                  </div>
                )}
              </div>
            )}

            {/* PP Result — Adequado */}
            {state.pp !== null && state.pp >= 40 && (
              <div>
                <ResultCard color="green" title="PP ≥ 40 mmHg — volume sistólico provavelmente adequado" titleColor="#66BB6A">
                  Considere prosseguir para otimização de vasopressor sem bolus adicionais.
                </ResultCard>
                <Button variant="primary" fullWidth onClick={() => goTo('step3')}>Vasopressor — Tier 1b</Button>
              </div>
            )}

            <StepNav
              onBack={() => goTo('step1')}
              onNext={() => { saveStep2(); goTo('step3') }}
              backLabel="Passo 1"
              nextLabel="Passo 3"
            />
          </div>
        )}

        {/* SCREEN: STEP 3 — VASOPRESSOR */}
        {state.screen === 'step3' && (
          <div className="animate-slide-in">
            <StepHeader number={3} title="Vasopressor — titulação" sub="Passo 3 de 5 — Tier 1" />

            <div className="flex flex-wrap gap-2 mb-4">
              <DataBadge label="TEC" value={state.tec ? `${fmt(state.tec)}s` : '--'} />
              <DataBadge label="PP" value={state.pp ? `${fmt(state.pp, 0)} mmHg` : '--'} />
              <DataBadge label="Fluidos" value={`${state.bolusTotal} mL`} />
            </div>

            {/* PAD + FC */}
            <div className="flex gap-2.5 mb-4">
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">PAD (mmHg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="50"
                  value={state.pad ?? ''}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    dispatch({ type: 'SET_PAD', value: isNaN(v) ? null : v })
                  }}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">FC (bpm)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="100"
                  value={state.fc ?? ''}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    dispatch({ type: 'SET_FC', value: isNaN(v) ? null : v })
                  }}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* PAD alert */}
            {state.pad !== null && state.pad < 50 && (
              <AlertCard type="warning" title="Vasopledia provável">
                PAD &lt; 50 mmHg sugere tono vascular reduzido. Titular noradrenalina para PAD &ge; 50 mmHg (Bertrand et al. Ann Intensive Care 2025).
              </AlertCard>
            )}

            {/* Dose NE */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Dose de noradrenalina (mcg/kg/min)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.10"
                min={0.01}
                max={3.0}
                step={0.01}
                value={state.doseNE ?? ''}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  dispatch({ type: 'SET_DOSE_NE', value: isNaN(v) ? null : v })
                }}
                className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => adjustDoseNE(-0.05)}
                  className="w-10 h-10 rounded-full border border-border-card bg-bg-elevated text-accent text-xl font-bold cursor-pointer flex-shrink-0 flex items-center justify-center"
                >-</button>
                <input
                  type="range"
                  min={0.01}
                  max={3.0}
                  step={0.01}
                  value={state.doseNE ?? 0.10}
                  onChange={(e) => dispatch({ type: 'SET_DOSE_NE', value: parseFloat(e.target.value) })}
                  className="flex-1 accent-accent"
                />
                <button
                  onClick={() => adjustDoseNE(0.05)}
                  className="w-10 h-10 rounded-full border border-border-card bg-bg-elevated text-accent text-xl font-bold cursor-pointer flex-shrink-0 flex items-center justify-center"
                >+</button>
              </div>
              <div className="flex justify-between text-xs text-text-muted mt-0.5 px-12">
                <span>0,01</span><span>0,5</span><span>1,0</span><span>2,0</span><span>3,0</span>
              </div>
            </div>

            <div className="text-xs text-text-muted mb-4">
              Peso: <strong className="text-text-primary">{weight ? weight : '--'}</strong> kg
            </div>

            {/* VNERi inline */}
            <SectionTitle>VNERi — Responsividade vascular</SectionTitle>
            <p className="text-xs text-text-secondary mb-1">Fórmula: PAD / (dose NE x FC)</p>
            <p className="text-xs text-text-muted mb-4">Goury et al. Ann Intensive Care 2025</p>

            {vneriInline !== null ? (
              <VNERiBar vneri={vneriInline} />
            ) : (
              <div className="text-center py-4 text-text-muted text-sm">
                Insira PAD, FC e dose de NE para calcular
              </div>
            )}

            {/* Deep links */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => goToInfusion('noradrenalina')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-elevated border border-border-card rounded-full text-xs font-medium text-info cursor-pointer min-h-[44px] active:bg-bg-hover"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /></svg>
                Calculadora NE
              </button>
              <button
                onClick={() => goToInfusion('vasopressina')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-elevated border border-border-card rounded-full text-xs font-medium text-info cursor-pointer min-h-[44px] active:bg-bg-hover"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /></svg>
                Calculadora vasopressina
              </button>
            </div>

            <div className="h-px bg-border my-4" />

            <SectionTitle className="!text-sm">TEC normalizou?</SectionTitle>
            <div className="flex gap-2">
              <Button variant="success" fullWidth size="sm" onClick={() => { saveStep3(); addIntervention('TEC normalizado após vasopressor'); goTo('step5') }}>Sim</Button>
              <Button variant="danger" fullWidth size="sm" onClick={() => { saveStep3(); goTo('step4') }}>Não</Button>
            </div>

            <StepNav
              onBack={() => goTo('step2')}
              onNext={() => { saveStep3(); goTo('step4') }}
              backLabel="Passo 2"
              nextLabel="Passo 4"
            />
          </div>
        )}

        {/* SCREEN: STEP 4 — PERFUSAO */}
        {state.screen === 'step4' && (
          <div className="animate-slide-in">
            <StepHeader number={4} title="Avaliação de perfusão" sub="Passo 4 de 5 — Tier 2" />

            <div className="flex flex-wrap gap-2 mb-4">
              <DataBadge label="PAD" value={state.pad ? `${fmt(state.pad, 0)} mmHg` : '--'} />
              <DataBadge label="FC" value={state.fc ? `${fmt(state.fc, 0)} bpm` : '--'} />
              <DataBadge label="VNERi" value={vneriInline ? fmt(vneriInline, 1) : '--'} />
              <DataBadge label="PP" value={state.pp ? `${fmt(state.pp, 0)} mmHg` : '--'} />
            </div>

            {/* Eco */}
            <SectionTitle>Ecocardiograma à beira-leito</SectionTitle>
            <p className="text-xs text-text-secondary mb-3">Considere avaliação ecocardiográfica quando disponível</p>

            <CriteriaItem checked={state.ecoVE} label="VE hipocinético" onToggle={() => dispatch({ type: 'TOGGLE_ECO', field: 'ecoVE' })} />
            <CriteriaItem checked={state.ecoVD} label="VD dilatado" onToggle={() => dispatch({ type: 'TOGGLE_ECO', field: 'ecoVD' })} />
            <CriteriaItem checked={state.ecoOutra} label="Outra disfunção (valvar, tamponamento)" onToggle={() => dispatch({ type: 'TOGGLE_ECO', field: 'ecoOutra' })} />

            <div className="h-px bg-border my-4" />

            {/* ScvO2 + Gap CO2 */}
            <SectionTitle>Marcadores de perfusão</SectionTitle>
            <p className="text-xs text-text-secondary mb-3">
              ScvO2 e Gap CO2 guiam a interpretação do mecanismo de hipoperfusão (Ltaief et al. Critical Care 2021)
            </p>

            <div className="flex gap-2.5 mb-4">
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">ScvO2 (%)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="65"
                  value={state.scvo2 ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_SCVO2', value: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Gap CO2 (mmHg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="6"
                  value={state.gapCO2 ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_GAPCO2', value: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
            </div>

            <Button variant="primary" fullWidth onClick={interpretarQuadrante}>Interpretar</Button>

            {/* Quadrante result */}
            {state.quadrante && (
              <div className="mt-4">
                <Card borderColor={state.quadrante.color} className="mb-4">
                  <div className="text-base font-bold mb-2" style={{ color: state.quadrante.color }}>{state.quadrante.label}</div>
                  <div className="text-sm text-text-secondary">
                    ScvO2 {state.scvo2}% + Gap CO2 {state.gapCO2} mmHg
                  </div>
                  <div
                    className="mt-3 p-3 rounded-lg text-sm leading-relaxed"
                    style={{ background: `${state.quadrante.color}18`, borderLeft: `3px solid ${state.quadrante.color}` }}
                  >
                    <strong style={{ color: state.quadrante.color }}>Conduta sugerida</strong><br />
                    {getQuadrantConductText(state.quadrante.id)}
                  </div>
                </Card>

                <QuadrantGrid activeId={state.quadrante.id} pristine={false} />
              </div>
            )}

            {!state.quadrante && <QuadrantGrid pristine />}

            <div className="h-px bg-border my-4" />

            {/* Testes adicionais */}
            <Collapsible title="Testes adicionais">
              {/* HTA crônica */}
              <div className="mb-4">
                <div className="text-sm font-semibold mb-2">Hipertensão arterial crônica?</div>
                <Toggle
                  options={[
                    { value: 'sim', label: 'Sim' },
                    { value: 'nao', label: 'Não' },
                  ]}
                  value={state.htaCronica ?? ''}
                  onChange={(v) => dispatch({ type: 'SET_HTA', value: v as 'sim' | 'nao' })}
                />
              </div>

              {state.htaCronica === 'sim' && (
                <div>
                  <InfoCard title="Teste de PAM elevada" borderColor="#FFC107">
                    Titular PAM para 80-85 mmHg por 1 hora. Reavaliar TEC após o período. Indicado em hipertensos crônicos que podem ter autorregulação deslocada (Hernandez et al. JAMA 2025).
                  </InfoCard>
                  <div className="text-sm font-semibold my-2">TEC normalizou com PAM 80-85?</div>
                  <Toggle
                    options={[
                      { value: 'sim', label: 'Sim' },
                      { value: 'nao', label: 'Não' },
                    ]}
                    value={state.testePAM ?? ''}
                    onChange={(v) => {
                      dispatch({ type: 'SET_TESTE_PAM', value: v as 'sim' | 'nao' })
                      addIntervention(v === 'sim' ? 'Teste PAM 80-85: TEC normalizado' : 'Teste PAM 80-85: TEC não normalizado')
                    }}
                  />
                </div>
              )}

              <div className="h-px bg-border my-4" />

              {/* Dobutamina */}
              <div className="mt-4">
                <InfoCard title="Teste de dobutamina" borderColor="#2196F3">
                  Iniciar dobutamina 5 mcg/kg/min por 1 hora. Reavaliar TEC. Considere em pacientes com suspeita de disfunção miocárdica ou baixo débito (Hernandez et al. JAMA 2025).
                </InfoCard>
                <div className="text-sm font-semibold my-2">TEC normalizou com dobutamina?</div>
                <Toggle
                  options={[
                    { value: 'sim', label: 'Sim' },
                    { value: 'nao', label: 'Não' },
                  ]}
                  value={state.testeDobu ?? ''}
                  onChange={(v) => {
                    dispatch({ type: 'SET_TESTE_DOBU', value: v as 'sim' | 'nao' })
                    addIntervention(v === 'sim' ? 'Teste dobutamina 5 mcg/kg/min: TEC normalizado' : 'Teste dobutamina 5 mcg/kg/min: TEC não normalizado')
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => goToInfusion('dobutamina')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-elevated border border-border-card rounded-full text-xs font-medium text-info cursor-pointer min-h-[44px] active:bg-bg-hover"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /></svg>
                    Calculadora dobutamina
                  </button>
                </div>
              </div>
            </Collapsible>

            <StepNav
              onBack={() => goTo('step3')}
              onNext={() => { saveStep4(); goTo('step5') }}
              backLabel="Passo 3"
              nextLabel="Resumo"
            />
          </div>
        )}

        {/* SCREEN: STEP 5 — RESUMO */}
        {state.screen === 'step5' && (
          <div className="animate-slide-in">
            <StepHeader number={5} title="Perfil hemodinâmico" sub="Passo 5 de 5" />

            {/* Profile card */}
            <div className="p-4 rounded-xl border-2 border-accent mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">MECANISMO PREDOMINANTE</div>
              <div className="text-lg font-bold text-accent">{perfil.label}</div>
            </div>

            {/* Achados */}
            <div className="mb-5">
              <div className="text-sm font-bold mb-2.5 pb-1.5 border-b border-border">Achados</div>
              {perfil.achados.length > 0 ? perfil.achados.map((a, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 text-sm text-text-secondary leading-relaxed">
                  <div className="w-1.5 h-1.5 min-w-[6px] rounded-full mt-[7px]" style={{ background: a.color }} />
                  <span>{a.text}</span>
                </div>
              )) : (
                <div className="text-text-muted text-sm">Nenhum dado registrado</div>
              )}
            </div>

            {/* Condutas */}
            <div className="mb-5">
              <div className="text-sm font-bold mb-2.5 pb-1.5 border-b border-border">Condutas sugeridas</div>
              {perfil.condutas.map((c, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 text-sm text-text-secondary leading-relaxed">
                  <span className="font-bold text-accent min-w-[20px]">{i + 1}.</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>

            {/* Nao fazer */}
            {perfil.naoFazer.length > 0 && (
              <AlertCard type="danger" title="Não recomendado">
                {perfil.naoFazer.map((n, i) => (
                  <div key={i} className="mb-1 text-sm">{n}</div>
                ))}
              </AlertCard>
            )}

            {/* Meta */}
            <ResultCard color="green" title="Meta" titleColor="#66BB6A">
              TEC &le; 3 segundos. Reavaliar em 1 hora (Hernandez et al. JAMA 2025).
            </ResultCard>

            {/* Deep links */}
            <div className="flex flex-wrap gap-2">
              {['noradrenalina', 'vasopressina', 'dobutamina'].map(drug => (
                <button
                  key={drug}
                  onClick={() => goToInfusion(drug)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-elevated border border-border-card rounded-full text-xs font-medium text-info cursor-pointer min-h-[44px] active:bg-bg-hover"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /></svg>
                  {drug === 'noradrenalina' ? 'NE' : drug === 'vasopressina' ? 'Vasopressina' : 'Dobutamina'}
                </button>
              ))}
            </div>

            {/* Timeline */}
            <SectionTitle>Linha do tempo</SectionTitle>
            <div className="my-4">
              {state.interventions.length > 0 ? state.interventions.map((item, i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-border text-sm">
                  <div className="text-text-muted min-w-[50px] text-xs font-semibold">{item.time}</div>
                  <div className="text-text-secondary flex-1">{item.text}</div>
                </div>
              )) : (
                <div className="text-center text-text-muted text-sm py-2">Nenhuma intervenção registrada</div>
              )}
            </div>

            {/* Reavaliar TEC */}
            <div className="h-px bg-border my-4" />
            <SectionTitle>Reavaliação de TEC</SectionTitle>
            <TecReavalSection
              history={state.tecHistory}
              onSave={(v) => {
                dispatch({ type: 'ADD_TEC_REEVAL', entry: { value: v, time: now() } })
                addIntervention(`Reavaliação TEC: ${fmt(v, 1)}s`)
                addToast('TEC salvo', 'success')
              }}
            />

            <StepNav
              onBack={() => goTo('step4')}
              onNext={() => dispatch({ type: 'RESET' })}
              backLabel="Passo 4"
              nextLabel="Início"
            />
          </div>
        )}

        {/* SCREEN: VNERi STANDALONE */}
        {state.screen === 'vneri' && (
          <div className="animate-slide-in">
            <BackButton onClick={() => goTo('home')} />

            <div className="text-center mb-5">
              <div className="text-xl font-bold">VNERi</div>
              <div className="text-sm text-text-secondary">Vascular Norepinephrine Responsiveness index</div>
            </div>

            <InfoCard title="O que mede?" borderColor="#64B5F6">
              Avalia a responsividade vascular a noradrenalina no choque séptico. Valores baixos indicam que o vaso não responde bem a NE — considere terapia adjuvante. A curva de mortalidade tem formato J invertido: mortalidade mínima em VNERi ~ 6,7.
              <br />
              <span className="text-xs text-text-muted">Fórmula: PAD / (dose NE x FC)</span>
            </InfoCard>

            <div className="flex gap-2.5 mb-4">
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">PAD (mmHg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="50"
                  value={state.vneriPadS ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_VNERI_PAD_S', value: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">FC (bpm)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="100"
                  value={state.vneriFcS ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_VNERI_FC_S', value: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="flex gap-2.5 mb-4">
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Dose NE (mcg/kg/min)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.10"
                  value={state.vneriDoseS ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_VNERI_DOSE_S', value: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Peso (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="70"
                  value={state.vneriPesoS ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_VNERI_PESO_S', value: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
            </div>

            {vneriStandalone !== null ? (
              <div>
                <VNERiBar vneri={vneriStandalone} />
                <div className="mt-3 text-xs text-text-muted italic">
                  Goury et al. Ann Intensive Care 2025 — Curva J invertida, nadir mortalidade em VNERi 6,7
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-text-muted text-sm">
                Insira PAD, FC e dose de NE para calcular
              </div>
            )}

            <div className="mt-4 text-xs text-text-muted">
              Validado para choque séptico (Goury et al. Ann Intensive Care 2025).
            </div>
          </div>
        )}

        {/* SCREEN: GAP CO2 STANDALONE */}
        {state.screen === 'gapco2' && (
          <div className="animate-slide-in">
            <BackButton onClick={() => goTo('home')} />

            <div className="text-center mb-5">
              <div className="text-xl font-bold">Gap CO2 / ScvO2</div>
              <div className="text-sm text-text-secondary">Quadrante perfusional</div>
            </div>

            <InfoCard title="Interpretação" borderColor="#64B5F6">
              A combinação de ScvO2 e Gap CO2 (diferença entre PCO2 venoso central e arterial) permite identificar o mecanismo predominante de hipoperfusão (Ltaief et al. Critical Care 2021).
            </InfoCard>

            <div className="flex gap-2.5 mb-4">
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">ScvO2 (%)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="65"
                  value={state.scvo2S ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_SCVO2_S', value: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Gap CO2 (mmHg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="6"
                  value={state.gapCO2S ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_GAPCO2_S', value: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
            </div>

            <Button variant="primary" fullWidth onClick={interpretarQuadranteS}>Interpretar</Button>

            <QuadrantGrid activeId={state.quadranteS?.id} pristine={!state.quadranteS} />

            {state.quadranteS && (
              <Card borderColor={state.quadranteS.color} className="mt-4">
                <div className="text-base font-bold mb-2" style={{ color: state.quadranteS.color }}>{state.quadranteS.label}</div>
                <div className="text-sm text-text-secondary">
                  ScvO2 {state.scvo2S}% + Gap CO2 {state.gapCO2S} mmHg
                </div>
                <div
                  className="mt-3 p-3 rounded-lg text-sm leading-relaxed"
                  style={{ background: `${state.quadranteS.color}18`, borderLeft: `3px solid ${state.quadranteS.color}` }}
                >
                  <strong style={{ color: state.quadranteS.color }}>Conduta sugerida</strong><br />
                  {getQuadrantConductText(state.quadranteS.id)}
                </div>
              </Card>
            )}

            <div className="mt-4 text-xs text-text-muted">
              Ltaief et al. Critical Care 2021.
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* VTI MODULE SCREENS                          */}
        {/* ============================================ */}

        {/* SCREEN: VTI-ENTRY — Reconhecimento */}
        {state.screen === 'vti-entry' && (
          <div className="animate-slide-in">
            <BackButton onClick={() => goTo('home')} />

            <div className="text-center mb-5">
              <div className="text-xl font-bold">Classificação hemodinâmica</div>
              <div className="text-sm text-text-secondary">Algoritmo VTI-based — Mercadal et al. 2022</div>
            </div>

            <InfoCard title="Sinais clínicos de choque" borderColor="#F44336">
              <ul className="list-disc pl-4 space-y-1 mt-1">
                <li>Hipotensão (PAS &lt; 90 mmHg ou PAM &lt; 65 mmHg)</li>
                <li>Sinais de hipoperfusão (livedo, oligúria, alteração do sensório)</li>
                <li>Taquicardia</li>
                <li>Lactato elevado (&ge; 2 mmol/L)</li>
              </ul>
            </InfoCard>

            <AlertCard type="info" title="Pré-requisito">
              Ecocardiograma transtorácico disponível à beira-leito. A medida do VTI no LVOT é o ponto de partida deste algoritmo.
            </AlertCard>

            <Button variant="primary" fullWidth size="lg" className="mt-4" onClick={() => goTo('vti-measure')}>
              Iniciar ecocardiografia básica
            </Button>

            <div className="mt-4 text-xs text-text-muted text-center">
              Mercadal J et al. The Ultrasound Journal, 2022
            </div>
          </div>
        )}

        {/* SCREEN: VTI-MEASURE — Medida do LVOT VTI */}
        {state.screen === 'vti-measure' && (
          <div className="animate-slide-in">
            <BackButton onClick={() => goTo('vti-entry')} />

            <div className="text-center mb-5">
              <div className="text-xl font-bold">Medida do LVOT VTI</div>
              <div className="text-sm text-text-secondary">Velocity-Time Integral no trato de saída do VE</div>
            </div>

            <Collapsible title="Como medir o VTI">
              <div className="text-sm text-text-secondary leading-relaxed space-y-2">
                <p><strong className="text-text-primary">1.</strong> Janela apical 5 câmaras</p>
                <p><strong className="text-text-primary">2.</strong> Posicione o volume-amostra do Doppler pulsado no LVOT (anel aórtico)</p>
                <p><strong className="text-text-primary">3.</strong> Alinhe o feixe paralelo ao fluxo (ângulo &lt; 20 graus)</p>
                <p><strong className="text-text-primary">4.</strong> Trace a envoltória do espectro Doppler (integral velocidade-tempo)</p>
                <p><strong className="text-text-primary">5.</strong> Considere a média de 3-5 ciclos cardíacos</p>
              </div>
            </Collapsible>

            <SectionTitle>Valor do VTI (cm)</SectionTitle>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ex: 18"
              min={1}
              max={40}
              step={0.1}
              value={state.vtiValue ?? ''}
              onChange={(e) => dispatch({ type: 'SET_VTI_VALUE', value: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-lg font-semibold text-center outline-none focus:border-accent"
            />

            {state.vtiValue !== null && state.vtiValue > 0 && (
              <div className="mt-4">
                {state.vtiValue < 16 && (
                  <ResultCard color="red" title="VTI < 16 cm — Baixo débito cardíaco" titleColor="#FF6B6B">
                    O débito cardíaco está provavelmente reduzido. Considere investigar a causa da disfunção.
                    <Button variant="primary" fullWidth className="mt-3" onClick={() => {
                      dispatch({ type: 'SET_VTI_PERICARDIO', value: null })
                      dispatch({ type: 'SET_VTI_VD', value: null })
                      dispatch({ type: 'SET_VTI_VE', value: null })
                      dispatch({ type: 'SET_VTI_VALVAR', value: null })
                      dispatch({ type: 'SET_VTI_FLUID_RESP', value: null })
                      dispatch({ type: 'SET_VTI_SHOCK_TYPE', value: null })
                      goTo('vti-low')
                    }}>
                      Investigar causa
                    </Button>
                  </ResultCard>
                )}

                {state.vtiValue >= 16 && state.vtiValue <= 20 && (
                  <ResultCard color="yellow" title="VTI 16-20 cm — Zona cinzenta" titleColor="#FFD740">
                    Débito cardíaco limítrofe. Considere avaliar variáveis de perfusão e congestão para direcionar a abordagem.
                    <Button variant="primary" fullWidth className="mt-3" onClick={() => {
                      dispatch({ type: 'SET_VTI_GREY_SCVO2', value: null })
                      dispatch({ type: 'SET_VTI_GREY_LACTATO', value: null })
                      dispatch({ type: 'SET_VTI_GREY_GAPCO2', value: null })
                      goTo('vti-grey')
                    }}>
                      Avaliar perfusão
                    </Button>
                  </ResultCard>
                )}

                {state.vtiValue > 20 && (
                  <ResultCard color="green" title="VTI > 20 cm — Débito cardíaco adequado" titleColor="#66BB6A">
                    O débito cardíaco está provavelmente preservado. O problema predominante é a resistência vascular periférica.
                    <Button variant="primary" fullWidth className="mt-3" onClick={() => {
                      dispatch({ type: 'SET_VTI_SHOCK_TYPE', value: 'distributivo' })
                      goTo('vti-distributive')
                    }}>
                      Choque distributivo
                    </Button>
                  </ResultCard>
                )}

                {/* VTI reference bar */}
                <div className="mt-4">
                  <div className="text-xs text-text-muted mb-1">Referência do VTI</div>
                  <div className="relative h-6 rounded-xl overflow-hidden" style={{
                    background: 'linear-gradient(to right, #F44336 0%, #F44336 40%, #FFC107 40%, #FFC107 50%, #4CAF50 50%, #4CAF50 100%)'
                  }}>
                    <div
                      className="absolute -top-1 w-3 h-8 bg-white rounded-md transition-all duration-300"
                      style={{
                        left: `calc(${Math.min(100, Math.max(0, (state.vtiValue / 40) * 100))}% - 6px)`,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-muted mt-1 px-0.5">
                    <span>0</span><span>16</span><span>20</span><span>40</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCREEN: VTI-LOW — Baixo débito (VTI < 16) */}
        {state.screen === 'vti-low' && (
          <div className="animate-slide-in">
            <BackButton onClick={() => goTo('vti-measure')} />

            <div className="text-center mb-5">
              <div className="text-xl font-bold">Baixo débito cardíaco</div>
              <div className="text-sm text-text-secondary">VTI &lt; 16 cm — Investigação etiológica</div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <DataBadge label="VTI" value={`${fmt(state.vtiValue, 1)} cm`} />
            </div>

            {/* Question a: Pericárdio */}
            <Card borderColor="#F44336" className="mb-3">
              <div className="text-sm font-bold mb-2">Função pericárdica comprometida?</div>
              <div className="text-xs text-text-muted mb-3">
                Derrame pericárdico moderado a grave, sinais de tamponamento
              </div>
              <Toggle
                options={[
                  { value: 'sim', label: 'Sim' },
                  { value: 'nao', label: 'Não' },
                ]}
                value={state.vtiPericardio ?? ''}
                onChange={(v) => dispatch({ type: 'SET_VTI_PERICARDIO', value: v as 'sim' | 'nao' })}
              />
              {state.vtiPericardio === 'sim' && (
                <div className="mt-3">
                  <ResultCard color="red" title="Tamponamento cardíaco" titleColor="#FF6B6B">
                    <div className="space-y-1.5">
                      <div><strong>Achados ecocardiográficos:</strong></div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Derrame pericárdico moderado-grave</li>
                        <li>Colapso diastólico de AD e/ou VD</li>
                        <li>VCI dilatada sem variação respiratória</li>
                      </ul>
                      <div className="mt-2"><strong>Conduta sugerida:</strong></div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Considere expansão volêmica cautelosa</li>
                        <li>Considere pericardiocentese ou drenagem pericárdica</li>
                        <li>Avaliação cirúrgica conforme etiologia</li>
                      </ul>
                    </div>
                  </ResultCard>
                  <Button variant="primary" fullWidth onClick={() => {
                    dispatch({ type: 'SET_VTI_SHOCK_TYPE', value: 'tamponamento' })
                    goTo('vti-result')
                  }}>
                    Ver resumo
                  </Button>
                </div>
              )}
            </Card>

            {/* Question b: VD */}
            {state.vtiPericardio === 'nao' && (
              <Card borderColor="#FFC107" className="mb-3">
                <div className="text-sm font-bold mb-2">Função do VD comprometida?</div>
                <div className="text-xs text-text-muted mb-3">
                  Dilatação de VD, TAPSE reduzido, septo paradoxal
                </div>
                <Toggle
                  options={[
                    { value: 'sim', label: 'Sim' },
                    { value: 'nao', label: 'Não' },
                  ]}
                  value={state.vtiVD ?? ''}
                  onChange={(v) => dispatch({ type: 'SET_VTI_VD', value: v as 'sim' | 'nao' })}
                />
                {state.vtiVD === 'sim' && (
                  <div className="mt-3">
                    <ResultCard color="yellow" title="Choque obstrutivo" titleColor="#FFD740">
                      <div className="space-y-1.5">
                        <div><strong>Achados ecocardiográficos:</strong></div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Relação área VD/VE &gt; 1</li>
                          <li>TAPSE &lt; 14 mm</li>
                          <li>VCI dilatada sem variação respiratória</li>
                          <li>Movimento paradoxal do septo interventricular</li>
                        </ul>
                        <div className="mt-2"><strong>Causas a considerar:</strong></div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>TEP maciço</li>
                          <li>Pneumotórax hipertensivo</li>
                          <li>Hipertensão pulmonar crônica</li>
                          <li>Cor pulmonale agudo</li>
                        </ul>
                      </div>
                    </ResultCard>
                    <Button variant="primary" fullWidth onClick={() => {
                      dispatch({ type: 'SET_VTI_SHOCK_TYPE', value: 'obstrutivo' })
                      goTo('vti-result')
                    }}>
                      Ver resumo
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Question c: VE */}
            {state.vtiPericardio === 'nao' && state.vtiVD === 'nao' && (
              <Card borderColor="#2196F3" className="mb-3">
                <div className="text-sm font-bold mb-2">Função do VE comprometida?</div>
                <div className="text-xs text-text-muted mb-3">
                  VE dilatado, hipocinesia global, FEVE visualmente reduzida
                </div>
                <Toggle
                  options={[
                    { value: 'sim', label: 'Sim' },
                    { value: 'nao', label: 'Não' },
                  ]}
                  value={state.vtiVE ?? ''}
                  onChange={(v) => dispatch({ type: 'SET_VTI_VE', value: v as 'sim' | 'nao' })}
                />
                {state.vtiVE === 'sim' && (
                  <div className="mt-3">
                    <ResultCard color="blue" title="Choque cardiogênico" titleColor="#64B5F6">
                      <div className="space-y-1.5">
                        <div><strong>Achados ecocardiográficos:</strong></div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>VE dilatado (avaliação visual)</li>
                          <li>FEVE &lt; 40%</li>
                          <li>Hipocinesia difusa ou segmentar</li>
                        </ul>
                        <div className="mt-2"><strong>Causas a considerar:</strong></div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Cardiomiopatia séptica</li>
                          <li>Cardiomiopatia de estresse (Takotsubo)</li>
                          <li>IAM / síndrome coronária aguda</li>
                          <li>Cardiomiopatia prévia descompensada</li>
                          <li>Miocardite aguda</li>
                        </ul>
                        <div className="mt-2"><strong>Conduta sugerida:</strong></div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Considere inotrópico (dobutamina 5-20 mcg/kg/min)</li>
                          <li>Considere vasopressor conforme PAM</li>
                          <li>Avaliação de suporte mecânico circulatório em casos refratários</li>
                        </ul>
                      </div>
                    </ResultCard>
                    <div className="flex flex-wrap gap-2 mt-2 mb-3">
                      <button
                        onClick={() => goToInfusion('dobutamina')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-elevated border border-border-card rounded-full text-xs font-medium text-info cursor-pointer min-h-[44px] active:bg-bg-hover"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /></svg>
                        Calculadora dobutamina
                      </button>
                    </div>
                    <Button variant="primary" fullWidth onClick={() => {
                      dispatch({ type: 'SET_VTI_SHOCK_TYPE', value: 'cardiogênico' })
                      goTo('vti-result')
                    }}>
                      Ver resumo
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Question d: Valvar */}
            {state.vtiPericardio === 'nao' && state.vtiVD === 'nao' && state.vtiVE === 'nao' && (
              <Card borderColor="#8B5CF6" className="mb-3">
                <div className="text-sm font-bold mb-2">Função valvar comprometida?</div>
                <div className="text-xs text-text-muted mb-3">
                  Insuficiência mitral ou aórtica aguda maciça, estenose aórtica ou mitral crítica
                </div>
                <Toggle
                  options={[
                    { value: 'sim', label: 'Sim' },
                    { value: 'nao', label: 'Não' },
                  ]}
                  value={state.vtiValvar ?? ''}
                  onChange={(v) => dispatch({ type: 'SET_VTI_VALVAR', value: v as 'sim' | 'nao' })}
                />
                {state.vtiValvar === 'sim' && (
                  <div className="mt-3">
                    <ResultCard color="yellow" title="Choque cardiogênico valvar" titleColor="#C084FC">
                      <div className="space-y-1.5">
                        <div><strong>Achados ecocardiográficos:</strong></div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>IM ou IA aguda maciça (avaliação 2D e color-flow Doppler)</li>
                          <li>EA ou EM crítica</li>
                        </ul>
                        <div className="mt-2"><strong>Conduta sugerida:</strong></div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Considere inotrópico</li>
                          <li>Considere vasopressor ou vasodilatador conforme perfil</li>
                          <li>Avaliação de BIA (balão intra-aórtico)</li>
                          <li>Avaliação cirúrgica de urgência</li>
                        </ul>
                      </div>
                    </ResultCard>
                    <Button variant="primary" fullWidth onClick={() => {
                      dispatch({ type: 'SET_VTI_SHOCK_TYPE', value: 'cardiogênico-valvar' })
                      goTo('vti-result')
                    }}>
                      Ver resumo
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Question e: Responsividade a fluidos */}
            {state.vtiPericardio === 'nao' && state.vtiVD === 'nao' && state.vtiVE === 'nao' && state.vtiValvar === 'nao' && (
              <Card borderColor="#10B981" className="mb-3">
                <div className="text-sm font-bold mb-2">Responsividade a fluidos?</div>
                <div className="text-xs text-text-muted mb-3">
                  Avalie conforme o modo ventilatório
                </div>

                <Toggle
                  options={[
                    { value: 'espontanea', label: 'Respiração espontânea' },
                    { value: 'mecânica', label: 'Ventilação mecânica' },
                  ]}
                  value={state.vtiVentMode ?? ''}
                  onChange={(v) => dispatch({ type: 'SET_VTI_VENT_MODE', value: v as 'espontanea' | 'mecânica' })}
                  className="mb-3"
                />

                {state.vtiVentMode === 'espontanea' && (
                  <InfoCard title="Passive Leg Raising (PLR)" borderColor="#10B981">
                    Elevar membros inferiores a 45 graus. Considere responsivo se <strong>aumento do VTI &gt; 12%</strong> após a manobra. Alternativa: mini-fluid challenge (100 mL em 1 minuto).
                  </InfoCard>
                )}

                {state.vtiVentMode === 'mecânica' && (
                  <InfoCard title="Variação dinâmica" borderColor="#10B981">
                    Considere responsivo se:
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      <li>Distensibilidade da VCI &gt; 13%</li>
                      <li>Variação do VTI ou pico de velocidade aórtica &gt; 10%</li>
                    </ul>
                    Alternativa: mini-fluid challenge (100 mL em 1 minuto).
                  </InfoCard>
                )}

                {state.vtiVentMode && (
                  <div className="mt-3">
                    <div className="text-sm font-semibold mb-2">Responsivo a fluidos?</div>
                    <Toggle
                      options={[
                        { value: 'sim', label: 'Sim' },
                        { value: 'nao', label: 'Não' },
                      ]}
                      value={state.vtiFluidResp ?? ''}
                      onChange={(v) => dispatch({ type: 'SET_VTI_FLUID_RESP', value: v as 'sim' | 'nao' })}
                    />
                  </div>
                )}

                {state.vtiFluidResp === 'sim' && (
                  <div className="mt-3">
                    <ResultCard color="green" title="Choque hipovolêmico" titleColor="#66BB6A">
                      <div className="space-y-1.5">
                        <div><strong>Conduta sugerida:</strong></div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Considere reposição volêmica com cristaloides balanceados</li>
                          <li>Considere concentrado de hemácias se sangramento ativo</li>
                        </ul>
                        <div className="mt-2"><strong>Causas a considerar:</strong></div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Sangramento (trauma, GI, pós-operatório)</li>
                          <li>Terceiro espaço (TSFR)</li>
                          <li>Perdas GI (vômitos, diarreia)</li>
                          <li>Desidratação grave</li>
                        </ul>
                      </div>
                    </ResultCard>
                    <Button variant="primary" fullWidth onClick={() => {
                      dispatch({ type: 'SET_VTI_SHOCK_TYPE', value: 'hipovolemico' })
                      goTo('vti-result')
                    }}>
                      Ver resumo
                    </Button>
                  </div>
                )}

                {state.vtiFluidResp === 'nao' && (
                  <div className="mt-3">
                    <AlertCard type="warning" title="Não responsivo a fluidos">
                      Baixo débito sem causa estrutural evidente e sem responsividade a volume. Considere reavaliar ecocardiograma com mais detalhes ou avaliação hemodinâmica invasiva.
                    </AlertCard>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* SCREEN: VTI-GREY — Zona cinzenta (VTI 16-20) */}
        {state.screen === 'vti-grey' && (
          <div className="animate-slide-in">
            <BackButton onClick={() => goTo('vti-measure')} />

            <div className="text-center mb-5">
              <div className="text-xl font-bold">Zona cinzenta</div>
              <div className="text-sm text-text-secondary">VTI 16-20 cm — Avaliação de perfusão</div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <DataBadge label="VTI" value={`${fmt(state.vtiValue, 1)} cm`} />
            </div>

            <InfoCard title="Interpretação" borderColor="#FFC107">
              Na zona cinzenta, variáveis de perfusão ajudam a definir se o padrão se assemelha mais a baixo débito ou a choque distributivo.
            </InfoCard>

            <div className="flex gap-2.5 mb-4">
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">ScvO2 (%)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="65"
                  value={state.vtiGreyScvo2 ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_VTI_GREY_SCVO2', value: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">pCO2 gap (mmHg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="6"
                  value={state.vtiGreyGapCO2 ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_VTI_GREY_GAPCO2', value: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">Tendência do lactato</label>
              <Toggle
                options={[
                  { value: 'crescente', label: 'Crescente' },
                  { value: 'estavel', label: 'Estável/Decrescente' },
                ]}
                value={state.vtiGreyLactato !== null ? (state.vtiGreyLactato > 0 ? 'crescente' : 'estavel') : ''}
                onChange={(v) => dispatch({ type: 'SET_VTI_GREY_LACTATO', value: v === 'crescente' ? 1 : 0 })}
              />
            </div>

            {/* Interpretation */}
            {state.vtiGreyScvo2 !== null && state.vtiGreyGapCO2 !== null && state.vtiGreyLactato !== null && (
              <div className="mt-4">
                {(state.vtiGreyScvo2 < 70 && state.vtiGreyLactato > 0 && state.vtiGreyGapCO2 > 6) ? (
                  <div>
                    <ResultCard color="red" title="Padrão compatível com baixo débito" titleColor="#FF6B6B">
                      ScvO2 &lt; 70% + lactato crescente + pCO2 gap &gt; 6 mmHg sugerem inadequação do débito cardíaco. Considere abordar como baixo débito.
                    </ResultCard>
                    <Button variant="primary" fullWidth onClick={() => {
                      dispatch({ type: 'SET_VTI_PERICARDIO', value: null })
                      dispatch({ type: 'SET_VTI_VD', value: null })
                      dispatch({ type: 'SET_VTI_VE', value: null })
                      dispatch({ type: 'SET_VTI_VALVAR', value: null })
                      dispatch({ type: 'SET_VTI_FLUID_RESP', value: null })
                      dispatch({ type: 'SET_VTI_SHOCK_TYPE', value: null })
                      goTo('vti-low')
                    }}>
                      Investigar causa de baixo débito
                    </Button>
                  </div>
                ) : (state.vtiGreyScvo2 >= 70 && state.vtiGreyLactato === 0 && state.vtiGreyGapCO2 <= 6) ? (
                  <div>
                    <ResultCard color="green" title="Padrão compatível com choque distributivo" titleColor="#66BB6A">
                      ScvO2 &ge; 70% + lactato estável/decrescente + pCO2 gap &le; 6 mmHg sugerem que o débito cardíaco é suficiente. Considere tratar como choque distributivo.
                    </ResultCard>
                    <Button variant="primary" fullWidth onClick={() => {
                      dispatch({ type: 'SET_VTI_SHOCK_TYPE', value: 'distributivo' })
                      goTo('vti-distributive')
                    }}>
                      Choque distributivo
                    </Button>
                  </div>
                ) : (
                  <div>
                    <ResultCard color="yellow" title="Padrão misto ou inconclusivo" titleColor="#FFD740">
                      Os marcadores de perfusão não convergem claramente para um perfil. Considere reavaliação clínica e ecocardiográfica mais detalhada.
                    </ResultCard>
                    <div className="flex gap-2 mt-2">
                      <Button variant="secondary" fullWidth onClick={() => {
                        dispatch({ type: 'SET_VTI_PERICARDIO', value: null })
                        dispatch({ type: 'SET_VTI_VD', value: null })
                        dispatch({ type: 'SET_VTI_VE', value: null })
                        dispatch({ type: 'SET_VTI_VALVAR', value: null })
                        dispatch({ type: 'SET_VTI_FLUID_RESP', value: null })
                        dispatch({ type: 'SET_VTI_SHOCK_TYPE', value: null })
                        goTo('vti-low')
                      }}>Baixo débito</Button>
                      <Button variant="primary" fullWidth onClick={() => {
                        dispatch({ type: 'SET_VTI_SHOCK_TYPE', value: 'distributivo' })
                        goTo('vti-distributive')
                      }}>Distributivo</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SCREEN: VTI-DISTRIBUTIVE — Choque distributivo (VTI > 20) */}
        {state.screen === 'vti-distributive' && (
          <div className="animate-slide-in">
            <BackButton onClick={() => goTo('vti-measure')} />

            <div className="text-center mb-5">
              <div className="text-xl font-bold">Choque distributivo</div>
              <div className="text-sm text-text-secondary">Débito cardíaco adequado — RVP reduzida</div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <DataBadge label="VTI" value={`${fmt(state.vtiValue, 1)} cm`} />
            </div>

            <InfoCard title="Interpretação" borderColor="#4CAF50">
              O débito cardíaco está preservado. O mecanismo predominante é a redução da resistência vascular periférica. Considere vasopressores e reavaliação conforme evolução clínica.
            </InfoCard>

            <SectionTitle>Causas a considerar</SectionTitle>
            <div className="space-y-2 mb-4">
              {[
                'Sepse',
                'Anafilaxia',
                'SIRS (pós-CEC, pós-cirurgia de grande porte)',
                'Pancreatite aguda grave',
                'Pós-IAM extenso',
                'Pós-transfusão maciça',
              ].map((causa, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <div className="w-1.5 h-1.5 min-w-[6px] rounded-full bg-warning" />
                  {causa}
                </div>
              ))}
            </div>

            <SectionTitle>Conduta sugerida</SectionTitle>
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="font-bold text-accent min-w-[20px]">1.</span>
                <span>Considere vasopressor (noradrenalina como primeira linha)</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="font-bold text-accent min-w-[20px]">2.</span>
                <span>Reavaliação ecocardiográfica seriada conforme evolução</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="font-bold text-accent min-w-[20px]">3.</span>
                <span>Tratamento da causa base</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => goToInfusion('noradrenalina')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-elevated border border-border-card rounded-full text-xs font-medium text-info cursor-pointer min-h-[44px] active:bg-bg-hover"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /></svg>
                Calculadora NE
              </button>
              <button
                onClick={() => goToInfusion('vasopressina')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-elevated border border-border-card rounded-full text-xs font-medium text-info cursor-pointer min-h-[44px] active:bg-bg-hover"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /></svg>
                Calculadora vasopressina
              </button>
            </div>

            <Button variant="primary" fullWidth onClick={() => goTo('vti-result')}>
              Ver resumo
            </Button>
          </div>
        )}

        {/* SCREEN: VTI-RESULT — Resultado final */}
        {state.screen === 'vti-result' && (
          <div className="animate-slide-in">
            <BackButton onClick={() => goTo('vti-entry')} />

            <div className="text-center mb-5">
              <div className="text-xl font-bold">Resultado da classificação</div>
              <div className="text-sm text-text-secondary">Algoritmo VTI-based</div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <DataBadge label="VTI" value={state.vtiValue ? `${fmt(state.vtiValue, 1)} cm` : '--'} />
            </div>

            {/* Shock type card */}
            {state.vtiShockType === 'tamponamento' && (
              <div className="p-4 rounded-xl border-2 border-danger mb-4">
                <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">CLASSIFICAÇÃO</div>
                <div className="text-lg font-bold text-danger">Tamponamento cardíaco</div>
                <div className="text-sm text-text-secondary mt-2">Choque obstrutivo por comprometimento pericárdico</div>
                <div className="mt-3 space-y-1 text-sm text-text-secondary">
                  <div><strong className="text-text-primary">Achados eco:</strong> Derrame pericárdico, colapso de AD/VD, VCI dilatada</div>
                  <div><strong className="text-text-primary">Conduta:</strong> Considere pericardiocentese, expansão volêmica cautelosa</div>
                </div>
              </div>
            )}

            {state.vtiShockType === 'obstrutivo' && (
              <div className="p-4 rounded-xl border-2 border-warning mb-4">
                <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">CLASSIFICAÇÃO</div>
                <div className="text-lg font-bold text-warning">Choque obstrutivo</div>
                <div className="text-sm text-text-secondary mt-2">Disfunção de VD com comprometimento hemodinâmico</div>
                <div className="mt-3 space-y-1 text-sm text-text-secondary">
                  <div><strong className="text-text-primary">Achados eco:</strong> VD/VE &gt; 1, TAPSE &lt; 14 mm, septo paradoxal</div>
                  <div><strong className="text-text-primary">Causas:</strong> TEP, pneumotórax hipertensivo, PHTN</div>
                </div>
              </div>
            )}

            {state.vtiShockType === 'cardiogênico' && (
              <div className="p-4 rounded-xl border-2 border-info mb-4">
                <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">CLASSIFICAÇÃO</div>
                <div className="text-lg font-bold text-info">Choque cardiogênico</div>
                <div className="text-sm text-text-secondary mt-2">Disfunção sistólica de VE</div>
                <div className="mt-3 space-y-1 text-sm text-text-secondary">
                  <div><strong className="text-text-primary">Achados eco:</strong> VE dilatado, FEVE &lt; 40%</div>
                  <div><strong className="text-text-primary">Conduta:</strong> Considere inotrópico, vasopressor, suporte mecânico</div>
                </div>
              </div>
            )}

            {state.vtiShockType === 'cardiogênico-valvar' && (
              <div className="p-4 rounded-xl border-2 mb-4" style={{ borderColor: '#8B5CF6' }}>
                <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">CLASSIFICAÇÃO</div>
                <div className="text-lg font-bold" style={{ color: '#8B5CF6' }}>Choque cardiogênico valvar</div>
                <div className="text-sm text-text-secondary mt-2">Disfunção valvar aguda grave</div>
                <div className="mt-3 space-y-1 text-sm text-text-secondary">
                  <div><strong className="text-text-primary">Achados eco:</strong> IM/IA maciça ou EA/EM crítica</div>
                  <div><strong className="text-text-primary">Conduta:</strong> Considere inotrópico, BIA, cirurgia</div>
                </div>
              </div>
            )}

            {state.vtiShockType === 'hipovolemico' && (
              <div className="p-4 rounded-xl border-2 border-success mb-4">
                <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">CLASSIFICAÇÃO</div>
                <div className="text-lg font-bold text-success">Choque hipovolêmico</div>
                <div className="text-sm text-text-secondary mt-2">Baixo débito responsivo a volume</div>
                <div className="mt-3 space-y-1 text-sm text-text-secondary">
                  <div><strong className="text-text-primary">Conduta:</strong> Considere reposição volêmica, hemácias se sangramento</div>
                  <div><strong className="text-text-primary">Causas:</strong> Sangramento, perdas GI, terceiro espaço</div>
                </div>
              </div>
            )}

            {state.vtiShockType === 'distributivo' && (
              <div className="p-4 rounded-xl border-2 border-success mb-4">
                <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">CLASSIFICAÇÃO</div>
                <div className="text-lg font-bold text-success">Choque distributivo</div>
                <div className="text-sm text-text-secondary mt-2">Débito cardíaco adequado, RVP reduzida</div>
                <div className="mt-3 space-y-1 text-sm text-text-secondary">
                  <div><strong className="text-text-primary">Conduta:</strong> Considere vasopressor (noradrenalina), tratar causa base</div>
                  <div><strong className="text-text-primary">Causas:</strong> Sepse, anafilaxia, SIRS, pancreatite</div>
                </div>
              </div>
            )}

            {/* Deep links */}
            <SectionTitle>Calculadoras de infusão</SectionTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              {['noradrenalina', 'vasopressina', 'dobutamina'].map(drug => (
                <button
                  key={drug}
                  onClick={() => goToInfusion(drug)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-elevated border border-border-card rounded-full text-xs font-medium text-info cursor-pointer min-h-[44px] active:bg-bg-hover"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /></svg>
                  {drug === 'noradrenalina' ? 'NE' : drug === 'vasopressina' ? 'Vasopressina' : 'Dobutamina'}
                </button>
              ))}
            </div>

            <AlertCard type="info" title="Referência">
              Mercadal J et al. VTI-based algorithm in hemodynamic shock assessment. The Ultrasound Journal. 2022.
            </AlertCard>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <Button variant="secondary" fullWidth onClick={() => dispatch({ type: 'RESET_VTI' })}>Reiniciar VTI</Button>
              <Button variant="primary" fullWidth onClick={() => goTo('home')}>Início</Button>
            </div>
          </div>
        )}

        {/* SCREEN: REFERENCIAS */}
        {state.screen === 'referências' && (
          <div className="animate-slide-in">
            <BackButton onClick={() => goTo('home')} />

            <SectionTitle className="!mt-0">Referências</SectionTitle>

            {[
              {
                author: 'Hernandez G, et al.',
                title: 'Effect of a Resuscitation Strategy Targeting Peripheral Perfusion Status vs Serum Lactate Levels on 28-Day Mortality Among Patients With Septic Shock: The ANDROMEDA-SHOCK 2 Randomized Clinical Trial. JAMA. 2025.',
                note: 'Protocolo CRT-PHR: ressuscitação guiada por TEC',
              },
              {
                author: 'Goury A, et al.',
                title: 'Vascular Norepinephrine Responsiveness index (VNERi) and mortality in septic shock: a J-shaped relationship. Ann Intensive Care. 2025;15:23.',
                note: 'VNERi = PAD / (dose NE x FC). Nadir mortalidade em 6,7.',
              },
              {
                author: 'Bertrand A, et al.',
                title: 'Diastolic arterial pressure monitoring in septic shock: clinical implications. Ann Intensive Care. 2025;15:18.',
                note: 'PAD < 50 mmHg como marcador de vasopledia',
              },
              {
                author: 'Ltaief Z, et al.',
                title: 'Venous-to-arterial carbon dioxide difference and central venous oxygen saturation in the assessment of tissue perfusion in septic shock: a prospective study. Critical Care. 2021;25:266.',
                note: 'Gap CO2 / ScvO2: quadrantes perfusionais',
              },
              {
                author: 'Evans L, et al.',
                title: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Intensive Care Med. 2021;47:1181-1247.',
                note: 'Diretrizes gerais de manejo do choque séptico',
              },
              {
                author: 'Hernandez G, et al.',
                title: 'Effect of a Resuscitation Strategy Targeting Peripheral Perfusion Status vs Serum Lactate Levels on 28-Day Mortality Among Patients With Septic Shock: The ANDROMEDA-SHOCK Randomized Clinical Trial. JAMA. 2019;321(7):654-664.',
                note: 'ANDROMEDA-SHOCK original: TEC vs lactato',
              },
              {
                author: 'Mercadal J, et al.',
                title: 'VTI-based algorithm in hemodynamic shock assessment. The Ultrasound Journal. 2022.',
                note: 'Algoritmo VTI-based para classificação hemodinâmica do choque indiferenciado',
              },
            ].map((ref, i) => (
              <div key={i} className="p-3 bg-bg-card border border-border-card rounded-lg mb-2 text-sm leading-relaxed text-text-secondary">
                <strong className="text-text-primary block mb-0.5">{ref.author}</strong>
                {ref.title}
                <br />
                <span className="text-xs text-text-muted">{ref.note}</span>
              </div>
            ))}
          </div>
        )}
      </Container>

      <Footer toolName="Shock Path" version="v2.0.0" updatedAt="Abril 2026" />
      <FABMenu items={fabItems} />
    </div>
  )
}

// ==========================================
// TEC REAVAL SUB-COMPONENT
// ==========================================

function TecReavalSection({ history, onSave }: { history: TecEntry[]; onSave: (v: number) => void }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.querySelector('input') as HTMLInputElement
    const v = parseFloat(input.value)
    if (!v || v < 0) return
    onSave(v)
    input.value = ''
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
        <input
          type="number"
          inputMode="decimal"
          placeholder="Segundos"
          min={0}
          max={20}
          step={0.1}
          className="flex-1 bg-bg-elevated border border-border-card rounded-lg text-text-primary p-3 text-base font-semibold text-center outline-none focus:border-accent"
        />
        <Button type="submit" variant="primary" size="sm" className="w-20">Salvar</Button>
      </form>

      {history.length > 0 && (
        <div className="mt-3">
          {history.map((entry, i) => {
            const dotColor = entry.value <= 3 ? 'bg-success' : entry.value <= 4.5 ? 'bg-warning' : 'bg-danger'
            return (
              <div key={i} className="flex items-center gap-2 py-1.5 text-sm">
                <div className={`w-2.5 h-2.5 min-w-[10px] rounded-full ${dotColor}`} />
                <span className="text-text-secondary">{entry.time} — {fmt(entry.value, 1)}s</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
