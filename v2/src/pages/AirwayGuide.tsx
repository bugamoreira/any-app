import { useReducer, useCallback, useMemo, useState } from 'react'
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
import { Modal } from '../components/common/Modal'
import { StepperNav } from '../components/clinical/StepperNav'
import { useWeight } from '../contexts/WeightContext'
import { useToast } from '../contexts/ToastContext'
// fmt disponível se necessário
import type { FABItem, PathwayStep } from '../types/clinical'

// ==========================================
// TIPOS
// ==========================================

type Screen = 'home' | 'pathway' | 'checklist' | 'doses'
type Population = 'adulto' | 'idoso' | 'obeso' | 'gestante'
type Sex = 'M' | 'F' | null
type CormackGrade = 'I' | 'II' | 'III' | 'IV' | null
type MembraneMethod = 'palpacao' | 'pocus' | 'nao' | null
type ProcTab = 'ld' | 'vl'

interface CrashState {
  [key: string]: boolean
  C: boolean
  R: boolean
  A: boolean
  S: boolean
  H: boolean
}

interface MedsState {
  fentanil: boolean
  ketamina: boolean
  etomidato: boolean
  propofol: boolean
  rocuronio: boolean
  succinilcolina: boolean
}

interface MedSliders {
  fentanil: number
  ketamina: number
  etomidato: number
  propofol: number
  rocuronio: number
  succinilcolina: number
}

interface AirwayState {
  screen: Screen
  step: number
  indications: [boolean, boolean, boolean]
  crash: CrashState
  shockIndex: number | null
  siFC: number | null
  siPAS: number | null
  vadOption: 'yes' | 'no' | null
  lemon: [boolean, boolean, boolean, boolean, boolean]
  roman: [boolean, boolean, boolean, boolean, boolean]
  localWeight: number | null
  height: number | null
  sex: Sex
  population: Population
  membrane: MembraneMethod
  meds: MedsState
  medSliders: MedSliders
  cormack: CormackGrade
  depth: string
  cuff: string
  intubationSuccess: boolean | null
  rescueMethod: string | null
  showPlanC: boolean
  procTab: ProcTab
  flushRateModal: boolean
}

type AirwayAction =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_STEP'; step: number }
  | { type: 'TOGGLE_INDICATION'; index: number }
  | { type: 'TOGGLE_CRASH'; letter: keyof CrashState }
  | { type: 'SET_SI_FC'; value: number | null }
  | { type: 'SET_SI_PAS'; value: number | null }
  | { type: 'SET_SHOCK_INDEX'; value: number | null }
  | { type: 'SET_VAD_OPTION'; option: 'yes' | 'no' | null }
  | { type: 'TOGGLE_LEMON'; index: number }
  | { type: 'TOGGLE_ROMAN'; index: number }
  | { type: 'SET_LOCAL_WEIGHT'; value: number | null }
  | { type: 'SET_HEIGHT'; value: number | null }
  | { type: 'SET_SEX'; value: Sex }
  | { type: 'SET_POPULATION'; value: Population }
  | { type: 'SET_MEMBRANE'; value: MembraneMethod }
  | { type: 'TOGGLE_MED'; med: keyof MedsState }
  | { type: 'SET_MED_SLIDER'; med: keyof MedSliders; value: number }
  | { type: 'SET_CORMACK'; grade: CormackGrade }
  | { type: 'SET_DEPTH'; value: string }
  | { type: 'SET_CUFF'; value: string }
  | { type: 'SET_INTUBATION_SUCCESS'; value: boolean | null }
  | { type: 'SET_RESCUE_METHOD'; value: string | null }
  | { type: 'SHOW_PLAN_C' }
  | { type: 'SET_PROC_TAB'; tab: ProcTab }
  | { type: 'SET_FLUSH_RATE_MODAL'; open: boolean }
  | { type: 'RESET' }

// ==========================================
// CONSTANTES CLINICAS
// ==========================================

const INDICATION_ITEMS = [
  { title: 'Falha em manter/proteger via aérea', desc: 'Rebaixamento, obstrução, risco de aspiração' },
  { title: 'Falha de ventilação ou oxigenação', desc: 'Hipoxemia refratária, fadiga, hipercapnia' },
  { title: 'Curso clínico antecipado', desc: 'Queimadura VA, angioedema, procedimento' },
] as const

const CRASH_ITEMS = [
  { letter: 'C' as const, title: 'C — Consumo de O2 aumentado', desc: 'Febre, sepse, agitação, trabalho respiratório aumentado', recs: ['Otimizar pré-oxigenação prolongada', 'Oxigenação apneica recomendada', 'Antecipar dessaturação rápida'] },
  { letter: 'R' as const, title: 'R — Falência de VD', desc: 'TEP, HAP, IAM VD, SDRA grave', recs: ['Evitar hipóxia e hipercapnia', 'Vasopressor precoce', 'Considerar ketamina como indutor'] },
  { letter: 'A' as const, title: 'A — Acidose metabólica', desc: 'pH < 7.2, lactato elevado, padrão Kussmaul', recs: ['Corrigir causa base primeiro se possível', 'Minimizar tempo de apneia', 'Manter ventilação-minuto alta pós-IOT'] },
  { letter: 'S' as const, title: 'S — Saturação comprometida', desc: 'SpO₂ < 93% mesmo com O2 suplementar', recs: ['VNI/CNAF durante preparo se tolerado', 'DSI (Delayed Sequence Intubation)', 'Oxigenação apneica 15 L/min'] },
  { letter: 'H' as const, title: 'H — Hipotensão / Hipovolemia', desc: 'PAS < 90, má perfusão, Shock Index > 1.0', recs: ['Ressuscitação volêmica antes se possível', 'Vasopressor preparado/iniciado', 'Reduzir dose de indutor (50%)', 'Push-dose pressor à mão'] },
] as const

const LEMON_ITEMS = [
  { title: 'L — Look externally', desc: 'Impressão geral de VA difícil, trauma facial, barba' },
  { title: 'E — Evaluate 3-3-2', desc: 'Abertura oral < 3 dedos, mento-hioide < 3, tireo-hioide < 2' },
  { title: 'M — Mallampati >= III', desc: 'Visualização limitada de estruturas orofaríngeas' },
  { title: 'O — Obstruction / Obesity', desc: 'Massa, epiglotite, obesidade (IMC > 30)' },
  { title: 'N — Neck mobility', desc: 'Rigidez cervical, colar, artrite, espondilite' },
] as const

const ROMAN_ITEMS = [
  { title: 'R — Radiation / Restriction', desc: 'Radioterapia cervical, complacência pulmonar reduzida' },
  { title: 'O — Obstruction / Obesity / OSA', desc: 'Obstrução de VA, obesidade, apneia do sono' },
  { title: 'M — Mask seal / Male', desc: 'Barba, trauma facial, edentulismo, sexo masculino' },
  { title: 'A — Age > 55 anos', desc: 'Alterações anatômicas relacionadas à idade' },
  { title: 'N — No teeth', desc: 'Edentulismo dificulta selamento da máscara' },
] as const

const CHECKLIST_PACIENTE = [
  { title: 'Acesso venoso funcionante', desc: '' },
  { title: 'Posicionamento otimizado', desc: 'Cabeceira elevada, coxins, posição olfativa' },
  { title: 'Pré-oxigenação', desc: '3-5 min, FiO₂ 100% (BMV / VNI / CNAF) + oxigenação apneica' },
  { title: 'Otimização hemodinâmica', desc: 'Considere vasopressor ou cristaloide antes da indução' },
  { title: 'Membrana cricotireóidea identificada', desc: '' },
  { title: 'Alergias e contraindicações verificadas', desc: '' },
]

const CHECKLIST_EQUIP = [
  { title: 'Laringoscópio testado', desc: 'Videolaringoscópio e/ou lâmina direta' },
  { title: 'TOT com cuff testado (2 tamanhos)', desc: '' },
  { title: 'Bougie + fio-guia', desc: '' },
  { title: 'BMV + circuito + ventilador', desc: '' },
  { title: 'Aspiração montada e testada', desc: '' },
  { title: 'Monitorização completa + capnografia', desc: '' },
  { title: 'DEG disponível e lubrificado', desc: 'Plano B: máscara laríngea' },
  { title: 'Kit de cricotireoidostomia', desc: 'Plano C: bisturi + bougie + TOT 6.0' },
]

const CHECKLIST_EQUIPE = [
  { title: 'Líder / intubador definido', desc: '' },
  { title: 'Médico backup disponível', desc: '' },
  { title: 'Drogas preparadas e checadas', desc: '' },
  { title: 'Planos A / B / C verbalizados', desc: '' },
]

const CHECKLIST_POS = [
  { title: 'Confirmar com capnografia', desc: '' },
  { title: 'Fixação do tubo + pressão do cuff', desc: '' },
  { title: 'Elevar cabeceira + checar ventilação', desc: '' },
  { title: 'Sedação contínua', desc: '' },
  { title: 'Gasometria + Rx tórax', desc: '' },
]

interface DrugDef {
  id: keyof MedsState
  name: string
  presentation: string
  concentration: number
  unit: string
  rateUnit: string
  min: number
  max: number
  step: number
  defaultVal: number
  category: 'simpatolitico' | 'indutor' | 'bnm'
  alert?: string
}

const DRUGS: DrugDef[] = [
  { id: 'fentanil', name: 'Fentanil', presentation: '50 mcg/mL — ampola 2-10 mL | IV lento, 3 min antes', concentration: 50, unit: 'mcg', rateUnit: 'mcg/kg', min: 1, max: 3, step: 0.5, defaultVal: 3, category: 'simpatolitico' },
  { id: 'ketamina', name: 'Cetamina', presentation: '50 mg/mL — ampola 10 mL', concentration: 50, unit: 'mg', rateUnit: 'mg/kg', min: 1, max: 2, step: 0.5, defaultVal: 1.5, category: 'indutor', alert: 'Uso com cautela em emergência hipertensiva. Considere etomidato como alternativa' },
  { id: 'etomidato', name: 'Etomidato', presentation: '2 mg/mL (10 mL)', concentration: 2, unit: 'mg', rateUnit: 'mg/kg', min: 0.2, max: 0.4, step: 0.01, defaultVal: 0.3, category: 'indutor' },
  { id: 'propofol', name: 'Propofol', presentation: '10 mg/mL (20 mL)', concentration: 10, unit: 'mg', rateUnit: 'mg/kg', min: 1, max: 2.5, step: 0.5, defaultVal: 1.5, category: 'indutor' },
  { id: 'rocuronio', name: 'Rocurônio', presentation: '10 mg/mL (5 mL)', concentration: 10, unit: 'mg', rateUnit: 'mg/kg', min: 1.5, max: 2, step: 0.1, defaultVal: 1.5, category: 'bnm' },
  { id: 'succinilcolina', name: 'Succinilcolina', presentation: '10 mg/mL (10 mL)', concentration: 10, unit: 'mg', rateUnit: 'mg/kg', min: 1.5, max: 2, step: 0.1, defaultVal: 1.5, category: 'bnm', alert: 'Contraindicada em hipercalemia, queimaduras extensas (>72h), miopatias, lesão medular crônica, doença do neurônio motor' },
]

const INDUTORES: (keyof MedsState)[] = ['ketamina', 'etomidato', 'propofol']
const BNMS: (keyof MedsState)[] = ['rocuronio', 'succinilcolina']

const PATHWAY_STEPS: PathwayStep[] = [
  { id: 'indicação', number: 1, title: 'Indicação' },
  { id: 'crash', number: 2, title: 'CRASH' },
  { id: 'vad', number: 3, title: 'VAD Anatômica' },
  { id: 'dados', number: 4, title: 'Dados' },
  { id: 'triple', number: 5, title: 'Triple Setup' },
  { id: 'otimização', number: 6, title: 'Otimização' },
  { id: 'preox', number: 7, title: 'Pré-oxigenação' },
  { id: 'meds', number: 8, title: 'Medicações' },
  { id: 'procedimento', number: 9, title: 'Procedimento' },
  { id: 'resultado', number: 10, title: 'Resultado' },
  { id: 'resumo', number: 11, title: 'Resumo' },
]

// ==========================================
// INITIAL STATE + REDUCER
// ==========================================

const initialState: AirwayState = {
  screen: 'home',
  step: 1,
  indications: [false, false, false],
  crash: { C: false, R: false, A: false, S: false, H: false },
  shockIndex: null,
  siFC: null,
  siPAS: null,
  vadOption: null,
  lemon: [false, false, false, false, false],
  roman: [false, false, false, false, false],
  localWeight: null,
  height: null,
  sex: null,
  population: 'adulto',
  membrane: null,
  meds: { fentanil: false, ketamina: false, etomidato: false, propofol: false, rocuronio: false, succinilcolina: false },
  medSliders: { fentanil: 3, ketamina: 1.5, etomidato: 0.3, propofol: 1.5, rocuronio: 1.5, succinilcolina: 1.5 },
  cormack: null,
  depth: '',
  cuff: '',
  intubationSuccess: null,
  rescueMethod: null,
  showPlanC: false,
  procTab: 'ld',
  flushRateModal: false,
}

function airwayReducer(state: AirwayState, action: AirwayAction): AirwayState {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.screen }
    case 'SET_STEP': return { ...state, step: action.step }
    case 'TOGGLE_INDICATION': {
      const newInd = [...state.indications] as [boolean, boolean, boolean]
      newInd[action.index] = !newInd[action.index]
      return { ...state, indications: newInd }
    }
    case 'TOGGLE_CRASH': {
      const newCrash = { ...state.crash, [action.letter]: !state.crash[action.letter] }
      return { ...state, crash: newCrash }
    }
    case 'SET_SI_FC': return { ...state, siFC: action.value }
    case 'SET_SI_PAS': return { ...state, siPAS: action.value }
    case 'SET_SHOCK_INDEX': return { ...state, shockIndex: action.value }
    case 'SET_VAD_OPTION': return { ...state, vadOption: action.option }
    case 'TOGGLE_LEMON': {
      const newL = [...state.lemon] as [boolean, boolean, boolean, boolean, boolean]
      newL[action.index] = !newL[action.index]
      return { ...state, lemon: newL }
    }
    case 'TOGGLE_ROMAN': {
      const newR = [...state.roman] as [boolean, boolean, boolean, boolean, boolean]
      newR[action.index] = !newR[action.index]
      return { ...state, roman: newR }
    }
    case 'SET_LOCAL_WEIGHT': return { ...state, localWeight: action.value }
    case 'SET_HEIGHT': return { ...state, height: action.value }
    case 'SET_SEX': return { ...state, sex: action.value }
    case 'SET_POPULATION': return { ...state, population: action.value }
    case 'SET_MEMBRANE': return { ...state, membrane: action.value }
    case 'TOGGLE_MED': {
      const med = action.med
      const newMeds = { ...state.meds }
      if (INDUTORES.includes(med)) {
        if (!state.meds[med]) INDUTORES.forEach(i => { if (i !== med) newMeds[i] = false })
        newMeds[med] = !state.meds[med]
      } else if (BNMS.includes(med)) {
        if (!state.meds[med]) BNMS.forEach(b => { if (b !== med) newMeds[b] = false })
        newMeds[med] = !state.meds[med]
      } else {
        newMeds[med] = !state.meds[med]
      }
      return { ...state, meds: newMeds }
    }
    case 'SET_MED_SLIDER': return { ...state, medSliders: { ...state.medSliders, [action.med]: action.value } }
    case 'SET_CORMACK': return { ...state, cormack: action.grade }
    case 'SET_DEPTH': return { ...state, depth: action.value }
    case 'SET_CUFF': return { ...state, cuff: action.value }
    case 'SET_INTUBATION_SUCCESS': return { ...state, intubationSuccess: action.value, rescueMethod: action.value === true ? null : state.rescueMethod, showPlanC: false }
    case 'SET_RESCUE_METHOD': return { ...state, rescueMethod: action.value, intubationSuccess: true }
    case 'SHOW_PLAN_C': return { ...state, showPlanC: true }
    case 'SET_PROC_TAB': return { ...state, procTab: action.tab }
    case 'SET_FLUSH_RATE_MODAL': return { ...state, flushRateModal: action.open }
    case 'RESET': return { ...initialState }
    default: return state
  }
}

// ==========================================
// HELPERS
// ==========================================

function calcDose(weight: number, rate: number): number {
  return Math.round(weight * rate)
}

function calcDoseDecimal(weight: number, rate: number): number {
  return Math.round(weight * rate * 10) / 10
}

function calcVolume(dose: number, concentration: number): string {
  return (dose / concentration).toFixed(1)
}

function getTubeSize(sex: Sex): string {
  return sex === 'M' ? '8.5 ou 8.0 mm' : '8.0 ou 7.5 mm'
}

function getDEGSize(weight: number): string {
  if (weight < 50) return '3'
  if (weight < 70) return '4'
  return '5'
}

function getTLSize(height: number): string {
  if (height < 155) return '3'
  if (height < 180) return '4'
  return '5'
}

// ==========================================
// CHECK ITEM COMPONENT
// ==========================================

function CheckItem({ title, desc, checked, variant = 'success', onToggle }: {
  title: string
  desc?: string
  checked: boolean
  variant?: 'success' | 'warning' | 'danger'
  onToggle: () => void
}) {
  const borderColors = { success: 'border-success bg-success/10', warning: 'border-warning bg-warning/10', danger: 'border-danger bg-danger/10' }
  return (
    <button
      onClick={onToggle}
      className={`flex items-start gap-3 w-full p-3.5 rounded-lg mb-2.5 text-left transition-all min-h-[44px] border ${
        checked ? borderColors[variant] : 'bg-bg-elevated border-border-card'
      }`}
    >
      <div className={`w-5.5 h-5.5 border-2 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
        checked ? `border-current` : 'border-border-card'
      }`}>
        {checked && (
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
        )}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{title}</div>
        {desc && <div className="text-xs text-text-secondary mt-0.5">{desc}</div>}
      </div>
    </button>
  )
}

// ==========================================
// MNEMONIC DISPLAY
// ==========================================

function MnemonicDisplay({ letters, activeMap }: { letters: string[]; activeMap: Record<string, boolean> | boolean[] }) {
  return (
    <div className="flex gap-1">
      {letters.map((l, i) => {
        const isActive = Array.isArray(activeMap) ? activeMap[i] : activeMap[l]
        return (
          <div
            key={l}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-extrabold border-2 transition-all ${
              isActive ? 'bg-danger border-danger text-white' : 'bg-bg-elevated border-border-card text-text-muted'
            }`}
          >
            {l}
          </div>
        )
      })}
    </div>
  )
}

// ==========================================
// DOSE CARD COMPONENT
// ==========================================

function DoseCard({ drug, weight, selected, sliderValue, onToggle, onSliderChange }: {
  drug: DrugDef
  weight: number
  selected: boolean
  sliderValue: number
  onToggle: () => void
  onSliderChange: (v: number) => void
}) {
  const dose = drug.id === 'etomidato' ? calcDoseDecimal(weight, sliderValue) : calcDose(weight, sliderValue)
  const vol = calcVolume(dose, drug.concentration)
  const displayRate = sliderValue % 1 === 0 ? sliderValue.toString() : (sliderValue < 1 ? sliderValue.toFixed(2) : sliderValue.toFixed(1))

  return (
    <div
      className={`rounded-lg p-3.5 mb-3 cursor-pointer transition-all border-[1.5px] ${
        selected ? 'border-success bg-success/10' : 'border-border-card bg-bg-elevated'
      }`}
      onClick={onToggle}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-[15px]">{drug.name}</div>
          <div className="text-xs text-text-secondary">{drug.presentation}</div>
        </div>
        <div className={`w-6 h-6 border-2 rounded flex items-center justify-center flex-shrink-0 ${
          selected ? 'bg-success border-success' : 'border-border-card'
        }`}>
          {selected && (
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
          )}
        </div>
      </div>

      <div className="my-3" onClick={e => e.stopPropagation()}>
        <div className="text-center text-white font-semibold text-sm mb-1">{displayRate} {drug.rateUnit}</div>
        <div className="flex justify-between text-xs text-text-muted mb-1.5">
          <span>{drug.min} {drug.rateUnit}</span>
          <span>{drug.max} {drug.rateUnit}</span>
        </div>
        <input
          type="range"
          min={drug.min}
          max={drug.max}
          step={drug.step}
          value={sliderValue}
          onChange={e => onSliderChange(parseFloat(e.target.value))}
          className="w-full accent-accent h-1"
        />
      </div>

      <div className="flex gap-4 text-sm">
        <span className="font-bold text-white">{dose} {drug.unit}</span>
        <span className="text-text-secondary">= {vol} mL</span>
      </div>

      {selected && drug.alert && (
        <div className="mt-2 p-2 rounded-lg text-xs text-warning bg-warning/10 leading-relaxed">
          {drug.alert}
        </div>
      )}
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AirwayGuide() {
  const navigate = useNavigate()
  const { weight: globalWeight } = useWeight()
  const { addToast } = useToast()
  const [state, dispatch] = useReducer(airwayReducer, initialState)

  const w = state.localWeight || globalWeight || 70

  // Computed values
  const crashCount = useMemo(() => Object.values(state.crash).filter(Boolean).length, [state.crash])
  const lemonCount = useMemo(() => state.lemon.filter(Boolean).length, [state.lemon])
  const romanCount = useMemo(() => state.roman.filter(Boolean).length, [state.roman])
  const hasIndication = useMemo(() => state.indications.some(Boolean), [state.indications])
  const isVADDifficult = lemonCount >= 2 || romanCount >= 2
  const hasHemoInstability = state.crash.H || (state.shockIndex !== null && state.shockIndex > 1.0)
  const shouldReduceDose = hasHemoInstability || state.population === 'idoso'
  const patientDataValid = (state.localWeight !== null && state.localWeight >= 30 && state.localWeight <= 300) && state.sex !== null

  // Navigation
  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', step })
    window.scrollTo(0, 0)
  }, [])

  const startPathway = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', screen: 'pathway' })
    dispatch({ type: 'SET_STEP', step: 1 })
  }, [])

  const goToInfusion = useCallback((drug?: string) => {
    navigate(drug ? `/infusion?drug=${drug}` : '/infusion')
  }, [navigate])

  // Shock Index calculator
  const siResult = useMemo(() => {
    if (state.siFC && state.siPAS && state.siPAS > 0) {
      const si = state.siFC / state.siPAS
      return { value: si, display: si.toFixed(2) }
    }
    return null
  }, [state.siFC, state.siPAS])

  const siClass = useMemo(() => {
    if (!siResult) return ''
    if (siResult.value > 1.0) return 'bg-danger/20 text-danger'
    if (siResult.value > 0.7) return 'bg-warning/20 text-warning'
    return 'bg-success/20 text-success'
  }, [siResult])

  // FC/PAS alerts
  const fcAlert = useMemo(() => {
    if (!state.siFC) return null
    if (state.siFC > 120) return { text: 'Taquicardia importante', type: 'danger' as const }
    if (state.siFC > 100) return { text: 'Taquicardia', type: 'warning' as const }
    if (state.siFC < 50) return { text: 'Bradicardia importante', type: 'danger' as const }
    if (state.siFC < 60) return { text: 'Bradicardia', type: 'warning' as const }
    return null
  }, [state.siFC])

  const pasAlert = useMemo(() => {
    if (!state.siPAS) return null
    if (state.siPAS < 90) return { text: 'Hipotensão', type: 'danger' as const }
    if (state.siPAS < 100) return { text: 'PAS limitrofe', type: 'warning' as const }
    if (state.siPAS > 180) return { text: 'Hipertensão', type: 'warning' as const }
    return null
  }, [state.siPAS])

  // DEG size
  const degText = useMemo(() => {
    const ml = getDEGSize(w)
    let text = `Mascara laríngea: tamanho ${ml}`
    if (state.height) {
      const tl = getTLSize(state.height)
      text += ` | Tubo laringeo: tamanho ${tl}`
    }
    return text
  }, [w, state.height])

  // Summary generation
  const generateReport = useCallback((): string => {
    const indTexts = ['Falha em manter/proteger VA', 'Falha de ventilação/oxigenação', 'Curso clínico antecipado']
    const indLine = state.indications.map((v, i) => v ? indTexts[i] : null).filter(Boolean).join(', ') || '--'

    const crashLetters = Object.entries(state.crash).filter(([, v]) => v).map(([k]) => k).join('')
    let vadLine = `CRASH: ${crashCount}/5${crashLetters ? ` (${crashLetters})` : ''}`
    if (state.vadOption === 'yes') vadLine += `\nLEMON: ${lemonCount}/5 | ROMAN: ${romanCount}/5`
    else if (state.vadOption === 'no') vadLine += '\nAvaliação anatômica: não realizada'
    if (state.shockIndex) vadLine += `\nShock Index: ${state.shockIndex.toFixed(2)}`

    let patLine = `Peso: ${state.localWeight || '--'} kg`
    if (state.height) patLine += ` | Altura: ${state.height} cm`
    patLine += `\nSexo: ${state.sex === 'M' ? 'Masculino' : 'Feminino'} | População: ${state.population}`

    const medsLines: string[] = []
    if (state.meds.fentanil) { const r = state.medSliders.fentanil; medsLines.push(`Fentanil ${calcDose(w, r)} mcg (${r} mcg/kg)`) }
    if (state.meds.ketamina) { const r = state.medSliders.ketamina; medsLines.push(`Cetamina ${calcDose(w, r)} mg (${r} mg/kg)`) }
    if (state.meds.etomidato) { const r = state.medSliders.etomidato; medsLines.push(`Etomidato ${calcDoseDecimal(w, r)} mg (${r} mg/kg)`) }
    if (state.meds.propofol) { const r = state.medSliders.propofol; medsLines.push(`Propofol ${calcDose(w, r)} mg (${r} mg/kg)`) }
    if (state.meds.rocuronio) { const r = state.medSliders.rocuronio; medsLines.push(`Rocurônio ${calcDose(w, r)} mg (${r} mg/kg)`) }
    if (state.meds.succinilcolina) { const r = state.medSliders.succinilcolina; medsLines.push(`Succinilcolina ${calcDose(w, r)} mg (${r} mg/kg)`) }

    let procLine = `Tubo: ${state.sex ? getTubeSize(state.sex) : '--'}`
    if (state.cormack) procLine += `\nCormack-Lehane: ${state.cormack}`
    if (state.depth) procLine += `\nProfundidade: ${state.depth} cm`
    if (state.cuff) procLine += `\nCuff: ${state.cuff} cmH2O`

    let confLine = 'Capnografia + Ausculta + POCUS (traqueal, pulmonar bilateral)'
    if (state.rescueMethod) confLine = `Resgate: ${state.rescueMethod}\n${confLine}`

    return [
      'RELATÓRIO DE IOT - AirwayGuide',
      new Date().toLocaleString('pt-BR'),
      '',
      `INDICAÇÃO:\n${indLine}`,
      '',
      `AVALIAÇÃO DE VAD:\n${vadLine}`,
      '',
      `PACIENTE:\n${patLine}`,
      '',
      `MEDICAÇÕES:\n${medsLines.join('\n') || 'Nenhuma selecionada'}`,
      '',
      `PROCEDIMENTO:\n${procLine}`,
      '',
      `CONFIRMAÇÃO:\n${confLine}`,
      '',
      '---',
      'Gerado por Airway Guide - ANY App v2.0.0',
    ].join('\n')
  }, [state, w, crashCount, lemonCount, romanCount])

  const copyReport = useCallback(() => {
    const report = generateReport()
    navigator.clipboard.writeText(report).then(() => {
      addToast('Relatório copiado!', 'success')
    })
  }, [generateReport, addToast])

  // FAB items
  const fabItems: FABItem[] = useMemo(() => [
    { label: 'Indicação', onClick: () => { startPathway(); goToStep(1) } },
    { label: 'CRASH', onClick: () => { startPathway(); goToStep(2) } },
    { label: 'Preparo', onClick: () => { startPathway(); goToStep(5) } },
    { label: 'Medicações', onClick: () => { startPathway(); goToStep(8) } },
    { label: 'Laringoscopia', onClick: () => { startPathway(); goToStep(9) } },
    { label: 'Confirmação', onClick: () => { startPathway(); goToStep(10) } },
  ], [startPathway, goToStep])

  // ==========================================
  // RENDER: HOME
  // ==========================================

  function renderHome() {
    return (
      <div>
        <div
          onClick={startPathway}
          style={{ background: '#1A1A1A', border: '1px solid #333', borderLeft: '4px solid #FF5252', borderRadius: '12px', padding: '20px', marginBottom: '12px', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Pathway de intubação</div>
          <div style={{ fontSize: '13px', color: '#888' }}>Guia passo a passo para via aérea</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'checklist' })}
            style={{ background: '#1A1A1A', border: '1px solid #333', borderLeft: '4px solid #2196F3', borderRadius: '12px', padding: '20px', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Checklist de IOT</div>
            <div style={{ fontSize: '13px', color: '#888' }}>Materiais, equipe e planos</div>
          </div>
          <div
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'doses' })}
            style={{ background: '#1A1A1A', border: '1px solid #333', borderLeft: '4px solid #2196F3', borderRadius: '12px', padding: '20px', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Doses de medicações</div>
            <div style={{ fontSize: '13px', color: '#888' }}>Indutores e BNM</div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: CHECKLIST STANDALONE
  // ==========================================

  function renderChecklist() {
    return (
      <div>
        <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-4 px-0 min-h-[44px]">← Voltar</button>
        <h2 className="text-xl font-bold mb-5">Checklist de IOT</h2>

        <Card borderColor="#FF5252" className="mb-4">
          <div className="font-bold text-sm text-accent mb-3">Paciente</div>
          {CHECKLIST_PACIENTE.map((item, i) => (
            <SimpleCheckItem key={i} title={item.title} desc={item.desc} />
          ))}
        </Card>

        <Card borderColor="#2196F3" className="mb-4">
          <div className="font-bold text-sm text-info mb-3">Equipamento</div>
          {CHECKLIST_EQUIP.map((item, i) => (
            <SimpleCheckItem key={i} title={item.title} desc={item.desc} />
          ))}
        </Card>

        <Card borderColor="#4CAF50" className="mb-4">
          <div className="font-bold text-sm text-success mb-3">Equipe</div>
          {CHECKLIST_EQUIPE.map((item, i) => (
            <SimpleCheckItem key={i} title={item.title} desc={item.desc} />
          ))}
        </Card>

        <Card borderColor="#FFC107" className="mb-4">
          <div className="font-bold text-sm text-warning mb-3">Pós-intubação</div>
          {CHECKLIST_POS.map((item, i) => (
            <SimpleCheckItem key={i} title={item.title} desc={item.desc} />
          ))}
        </Card>
      </div>
    )
  }

  // ==========================================
  // RENDER: STANDALONE DOSES
  // ==========================================

  function renderStandaloneDoses() {
    return (
      <div>
        <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-4 px-0 min-h-[44px]">← Voltar</button>
        <h2 className="text-xl font-bold mb-5">Doses de medicações</h2>

        <div className="mb-4">
          <label className="text-sm text-text-secondary block mb-1.5">Peso (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="70"
            min={30}
            max={300}
            value={state.localWeight ?? ''}
            onChange={e => {
              const v = e.target.value === '' ? null : parseFloat(e.target.value)
              dispatch({ type: 'SET_LOCAL_WEIGHT', value: v })
            }}
            className="w-full p-3.5 bg-bg-elevated border border-border-card rounded-lg text-text-primary text-base"
          />
        </div>

        <p className="text-xs text-text-muted mb-3">Toque no card para selecionar. Ajuste a dose com o slider.</p>

        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Bloqueio simpático — simpatólise (opcional)</p>
        {DRUGS.filter(d => d.category === 'simpatolitico').map(drug => (
          <DoseCard
            key={drug.id}
            drug={drug}
            weight={state.localWeight || 70}
            selected={state.meds[drug.id]}
            sliderValue={state.medSliders[drug.id]}
            onToggle={() => dispatch({ type: 'TOGGLE_MED', med: drug.id })}
            onSliderChange={v => dispatch({ type: 'SET_MED_SLIDER', med: drug.id, value: v })}
          />
        ))}

        <p className="text-xs text-text-muted uppercase tracking-wider mt-3 mb-2">Indutores (selecionar 1)</p>
        {DRUGS.filter(d => d.category === 'indutor').map(drug => (
          <DoseCard
            key={drug.id}
            drug={drug}
            weight={state.localWeight || 70}
            selected={state.meds[drug.id]}
            sliderValue={state.medSliders[drug.id]}
            onToggle={() => dispatch({ type: 'TOGGLE_MED', med: drug.id })}
            onSliderChange={v => dispatch({ type: 'SET_MED_SLIDER', med: drug.id, value: v })}
          />
        ))}

        <p className="text-xs text-text-muted uppercase tracking-wider mt-3 mb-2">BNM (selecionar 1)</p>
        {DRUGS.filter(d => d.category === 'bnm').map(drug => (
          <DoseCard
            key={drug.id}
            drug={drug}
            weight={state.localWeight || 70}
            selected={state.meds[drug.id]}
            sliderValue={state.medSliders[drug.id]}
            onToggle={() => dispatch({ type: 'TOGGLE_MED', med: drug.id })}
            onSliderChange={v => dispatch({ type: 'SET_MED_SLIDER', med: drug.id, value: v })}
          />
        ))}
      </div>
    )
  }

  // ==========================================
  // RENDER: PATHWAY STEPS
  // ==========================================

  function renderStep1() {
    return (
      <div>
        <h2 className="text-xl font-bold mb-5">Indicação de IOT</h2>
        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-3">Selecione a(s) indicação(oes)</div>
          {INDICATION_ITEMS.map((item, i) => (
            <CheckItem
              key={i}
              title={item.title}
              desc={item.desc}
              checked={state.indications[i]}
              onToggle={() => dispatch({ type: 'TOGGLE_INDICATION', index: i })}
            />
          ))}
        </Card>

        {hasIndication && (
          <AlertCard type="info" title="PCR ou PCR iminente?">
            Considere intubação sem RSI (sem drogas). Priorizar compressoes.
          </AlertCard>
        )}

        <div className="mt-5">
          <Button fullWidth disabled={!hasIndication} onClick={() => goToStep(2)}>
            Continuar &#8594;
          </Button>
        </div>
      </div>
    )
  }

  function renderStep2() {
    return (
      <div>
        <h2 className="text-xl font-bold mb-5">VAD Fisiológica — CRASH</h2>
        <Card className="mb-4">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border-card">
            <MnemonicDisplay letters={['C', 'R', 'A', 'S', 'H']} activeMap={state.crash} />
            <span className="text-sm text-text-secondary ml-auto">{crashCount}/5</span>
          </div>
          <p className="text-sm text-text-secondary mb-4">O paciente tolera apneia e indução? Avalie fatores de risco:</p>

          {CRASH_ITEMS.map(item => (
            <div key={item.letter}>
              <CheckItem
                title={item.title}
                desc={item.desc}
                checked={state.crash[item.letter]}
                variant="danger"
                onToggle={() => dispatch({ type: 'TOGGLE_CRASH', letter: item.letter })}
              />
              {state.crash[item.letter] && (
                <div className="ml-8 mb-3 p-3 bg-bg-elevated rounded-lg text-xs text-text-secondary leading-relaxed">
                  <strong>Recomendações:</strong>
                  {item.recs.map((r, i) => <div key={i}>- {r}</div>)}
                </div>
              )}
            </div>
          ))}

          {/* Shock Index Calculator */}
          <div className="mt-4 p-3.5 bg-bg-elevated border border-border-card rounded-lg">
            <div className="font-semibold text-sm mb-2.5">Calculadora Shock Index</div>
            <div className="flex gap-2.5 mb-2.5">
              <div className="flex-1">
                <label className="block text-xs text-text-secondary mb-1">FC (bpm)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Ex: 110"
                  value={state.siFC ?? ''}
                  onChange={e => {
                    const v = e.target.value === '' ? null : parseInt(e.target.value)
                    dispatch({ type: 'SET_SI_FC', value: v })
                    if (v && state.siPAS && state.siPAS > 0) {
                      const si = v / state.siPAS
                      dispatch({ type: 'SET_SHOCK_INDEX', value: parseFloat(si.toFixed(2)) })
                      if (si > 1.0 && !state.crash.H) dispatch({ type: 'TOGGLE_CRASH', letter: 'H' })
                    }
                  }}
                  className="w-full p-2.5 bg-bg-card border border-border-card rounded-lg text-text-primary text-base text-center"
                />
                {fcAlert && (
                  <div className={`text-xs mt-1 px-2 py-1 rounded text-center ${
                    fcAlert.type === 'danger' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                  }`}>{fcAlert.text}</div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary mb-1">PAS (mmHg)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Ex: 90"
                  value={state.siPAS ?? ''}
                  onChange={e => {
                    const v = e.target.value === '' ? null : parseInt(e.target.value)
                    dispatch({ type: 'SET_SI_PAS', value: v })
                    if (state.siFC && v && v > 0) {
                      const si = state.siFC / v
                      dispatch({ type: 'SET_SHOCK_INDEX', value: parseFloat(si.toFixed(2)) })
                      if (si > 1.0 && !state.crash.H) dispatch({ type: 'TOGGLE_CRASH', letter: 'H' })
                    }
                  }}
                  className="w-full p-2.5 bg-bg-card border border-border-card rounded-lg text-text-primary text-base text-center"
                />
                {pasAlert && (
                  <div className={`text-xs mt-1 px-2 py-1 rounded text-center ${
                    pasAlert.type === 'danger' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                  }`}>{pasAlert.text}</div>
                )}
              </div>
            </div>
            <div className={`text-center p-2.5 rounded-lg font-bold text-sm ${siResult ? siClass : ''}`}>
              SI = {siResult ? siResult.display : '--'}
            </div>
          </div>
        </Card>

        {crashCount > 0 && (
          <AlertCard type="danger" title="VAD Fisiológica identificada">
            Recomenda-se otimização antes da indução.
          </AlertCard>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={() => goToStep(1)} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button fullWidth onClick={() => goToStep(3)}>Continuar &#8594;</Button>
        </div>
      </div>
    )
  }

  function renderStep3() {
    return (
      <div>
        <h2 className="text-xl font-bold mb-5">VAD Anatômica</h2>

        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-2">Deseja avaliar preditores de VAD?</div>
          <p className="text-sm text-text-secondary mb-4">Avaliação de LEMON e ROMAN</p>
          <div className="flex gap-2">
            <Button
              variant={state.vadOption === 'yes' ? 'primary' : 'secondary'}
              fullWidth
              onClick={() => dispatch({ type: 'SET_VAD_OPTION', option: 'yes' })}
            >
              Sim, avaliar
            </Button>
            <Button
              variant={state.vadOption === 'no' ? 'primary' : 'secondary'}
              fullWidth
              onClick={() => { dispatch({ type: 'SET_VAD_OPTION', option: 'no' }); goToStep(4) }}
            >
              Continuar sem avaliar &#8594;
            </Button>
          </div>
        </Card>

        {state.vadOption === 'yes' && (
          <>
            <Card className="mb-4">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border-card">
                <MnemonicDisplay letters={['L', 'E', 'M', 'O', 'N']} activeMap={state.lemon} />
                <span className="text-sm text-text-secondary ml-auto">{lemonCount}/5</span>
              </div>
              <p className="text-xs text-text-secondary mb-3">Preditores de laringoscopia difícil:</p>
              {LEMON_ITEMS.map((item, i) => (
                <CheckItem
                  key={i}
                  title={item.title}
                  desc={item.desc}
                  checked={state.lemon[i]}
                  variant="warning"
                  onToggle={() => dispatch({ type: 'TOGGLE_LEMON', index: i })}
                />
              ))}
            </Card>

            <Card className="mb-4">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border-card">
                <MnemonicDisplay letters={['R', 'O', 'M', 'A', 'N']} activeMap={state.roman} />
                <span className="text-sm text-text-secondary ml-auto">{romanCount}/5</span>
              </div>
              <p className="text-xs text-text-secondary mb-3">Preditores de VMB difícil:</p>
              {ROMAN_ITEMS.map((item, i) => (
                <CheckItem
                  key={i}
                  title={item.title}
                  desc={item.desc}
                  checked={state.roman[i]}
                  variant="warning"
                  onToggle={() => dispatch({ type: 'TOGGLE_ROMAN', index: i })}
                />
              ))}
            </Card>

            <AlertCard type="warning" title="Resumo VAD Anatômica">
              LEMON: {lemonCount}/5 | ROMAN: {romanCount}/5
            </AlertCard>
          </>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={() => goToStep(2)} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          {state.vadOption === 'yes' && (
            <Button fullWidth onClick={() => goToStep(4)}>Continuar &#8594;</Button>
          )}
        </div>
      </div>
    )
  }

  function renderStep4() {
    return (
      <div>
        <h2 className="text-xl font-bold mb-5">Dados do paciente</h2>

        <Card className="mb-4">
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-text-secondary mb-1.5">Peso (kg) *</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Ex: 70"
                value={state.localWeight ?? ''}
                onChange={e => dispatch({ type: 'SET_LOCAL_WEIGHT', value: e.target.value === '' ? null : parseFloat(e.target.value) })}
                className="w-full p-3.5 bg-bg-elevated border border-border-card rounded-lg text-text-primary text-base"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-text-secondary mb-1.5">Altura (cm) (opcional)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Ex: 170"
                value={state.height ?? ''}
                onChange={e => dispatch({ type: 'SET_HEIGHT', value: e.target.value === '' ? null : parseFloat(e.target.value) })}
                className="w-full p-3.5 bg-bg-elevated border border-border-card rounded-lg text-text-primary text-base"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-text-secondary mb-1.5">Sexo biologico *</label>
            <Toggle
              options={[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' }]}
              value={state.sex || ''}
              onChange={v => dispatch({ type: 'SET_SEX', value: v as Sex })}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-text-secondary mb-1.5">População</label>
            <div className="flex gap-2 flex-wrap">
              {(['adulto', 'idoso', 'obeso', 'gestante'] as Population[]).map(p => (
                <button
                  key={p}
                  onClick={() => dispatch({ type: 'SET_POPULATION', value: p })}
                  className={`flex-1 min-w-[70px] py-3 px-3 rounded-lg text-sm font-medium cursor-pointer transition-colors border min-h-[44px] ${
                    state.population === p ? 'bg-accent border-accent text-white' : 'bg-bg-elevated border-border-card text-text-secondary'
                  }`}
                >
                  {p === 'idoso' ? 'Idoso (>=65)' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {state.sex && state.localWeight && (
            <AlertCard type="info" title="Tubo sugerido">
              {getTubeSize(state.sex)} ({state.sex === 'M' ? 'masculino' : 'feminino'})
            </AlertCard>
          )}
        </Card>

        <div className="flex gap-3 mt-5">
          <button onClick={() => goToStep(3)} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button fullWidth disabled={!patientDataValid} onClick={() => goToStep(5)}>Continuar &#8594;</Button>
        </div>
      </div>
    )
  }

  function renderStep5() {
    return (
      <div>
        <h2 className="text-xl font-bold mb-5">Triple Setup</h2>

        {(crashCount > 0 || isVADDifficult) && (
          <AlertCard type="danger" title="Risco elevado identificado">
            Confirme preparo completo para falha.
          </AlertCard>
        )}

        {isVADDifficult && (
          <AlertCard type="danger" title="Via aérea difícil identificada">
            Considere pedir ajuda precoce{'\n'}
            Limite a 2 tentativas de laringoscopia{'\n'}
            Se falha: Plano B (dispositivo extraglótico) -{'>'} Plano C (cricotireoidostomia){'\n'}
            Mantenha oxigenação entre tentativas
          </AlertCard>
        )}

        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-3">Plano A — Laringoscopia</div>
          <SimpleCheckItem title="Laringoscópio testado" desc="VL e/ou lâmina direta" />
          <SimpleCheckItem title="Tubo traqueal + fio-guia" desc={`Tamanho: ${state.sex ? getTubeSize(state.sex) : '--'}`} />
          <SimpleCheckItem title="Bougie disponível" desc="Disponível e acessivel" />
        </Card>

        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-3">Plano B — DEG</div>
          <SimpleCheckItem title="DEG testado e lubrificado" desc={degText} />
          {!state.height && (
            <div className="mt-3 p-3 bg-bg-elevated rounded-lg">
              <label className="text-xs text-text-secondary">Altura (cm) para calcular tubo laringeo:</label>
              <div className="flex gap-2 mt-1.5">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Ex: 170"
                  className="flex-1 p-2.5 bg-bg-card border border-border-card rounded-lg text-text-primary text-sm"
                  onChange={e => {
                    const h = parseFloat(e.target.value)
                    if (h >= 100 && h <= 250) dispatch({ type: 'SET_HEIGHT', value: h })
                  }}
                />
              </div>
            </div>
          )}
        </Card>

        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-3">Plano C — Crico</div>
          <SimpleCheckItem title="Kit de crico disponível" desc="Bisturi + bougie + tubo 6.0" />

          <div className="mt-3">
            <label className="block text-sm text-text-secondary mb-1.5">Membrana cricotireóidea identificada?</label>
            <div className="flex gap-2">
              {(['palpacao', 'pocus', 'nao'] as MembraneMethod[]).map(m => (
                <button
                  key={m}
                  onClick={() => dispatch({ type: 'SET_MEMBRANE', value: m })}
                  className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium cursor-pointer transition-colors border min-h-[44px] ${
                    state.membrane === m ? 'bg-accent border-accent text-white' : 'bg-bg-elevated border-border-card text-text-secondary'
                  }`}
                >
                  {m === 'palpacao' ? 'Palpação' : m === 'pocus' ? 'POCUS' : 'Não'}
                </button>
              ))}
            </div>
          </div>

          {state.membrane === 'palpacao' && (
            <Collapsible title="Técnica TACA">
              <div className="text-xs text-text-secondary leading-relaxed">
                1. Palpar tireoide (proeminência)<br />
                2. Deslizar inferiormente até cricoide<br />
                3. Membrana = depressão entre elas<br />
                4. Marcar com caneta se possível
              </div>
            </Collapsible>
          )}

          {state.membrane === 'pocus' && (
            <Collapsible title="Técnica POCUS">
              <div className="text-xs text-text-secondary leading-relaxed">
                <strong>Transdutor:</strong> Linear, alta frequência<br />
                <strong>Posição:</strong> Transversal na linha média cervical<br />
                <strong>Técnica:</strong> Identificar tireoide (anecoica em "U"), deslizar caudalmente até cricoide<br />
                <strong>Membrana:</strong> Faixa hiperecoica entre tireoide e cricoide<br />
                <strong>Dica:</strong> Marcar pele sob visualização direta
              </div>
            </Collapsible>
          )}
        </Card>

        <div className="flex gap-3 mt-5">
          <button onClick={() => goToStep(4)} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button fullWidth onClick={() => goToStep(6)}>Continuar &#8594;</Button>
        </div>
      </div>
    )
  }

  function renderStep6() {
    return (
      <div>
        <h2 className="text-xl font-bold mb-5">Otimização</h2>

        {hasHemoInstability && (
          <AlertCard type="danger" title="Instabilidade hemodinâmica">
            Considere vasopressor antes da indução.{' '}
            <button onClick={() => goToInfusion('noradrenalina')} className="text-info underline bg-transparent border-none cursor-pointer text-sm">
              Calculadora de Noradrenalina &#8594;
            </button>
          </AlertCard>
        )}

        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-3">Otimização hemodinâmica</div>
          <SimpleCheckItem title="Acesso venoso calibroso" desc="Jelco 18G ou maior, testar patência" />
          <SimpleCheckItem title="Cristaloide em curso" desc="SF 0,9% ou RL aberto" />
          <SimpleCheckItem title="Vasopressor disponível" desc="Preparado ou em infusão" />
        </Card>

        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-3">Posicionamento</div>
          <p className="text-xs text-text-secondary mb-3">Selecione uma opção:</p>
          <SimpleCheckItem title="Posição olfativa (sniffing)" desc="Coxim occipital ou escapular se obeso" />
          <SimpleCheckItem title="Cabeceira elevada 20-30 graus" desc="Head-up para obeso ou risco de aspiração" />
        </Card>

        <div className="flex gap-3 mt-5">
          <button onClick={() => goToStep(5)} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button fullWidth onClick={() => goToStep(7)}>Continuar &#8594;</Button>
        </div>
      </div>
    )
  }

  function renderStep7() {
    return (
      <div>
        <h2 className="text-xl font-bold mb-5">Pré-oxigenação</h2>

        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-3">Meta: pré-oxigenação por 3 a 5 minutos com FiO2 de 100%</div>
          <SimpleCheckItem title="VNI (CPAP/BiPAP)" desc="FiO2 100%, se tolerar" />
          <SimpleCheckItem
            title={
              <>
                Máscara não reinalante 15 L/min (flush rate){' '}
                <button
                  onClick={e => { e.stopPropagation(); dispatch({ type: 'SET_FLUSH_RATE_MODAL', open: true }) }}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-info/20 text-info text-xs font-bold border-none cursor-pointer"
                >
                  ?
                </button>
              </>
            }
            desc="Flush rate se disponível"
          />
          <SimpleCheckItem title="BVM com reservatório" desc="Vedação adequada, respirações espontâneas" />
        </Card>

        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-3">Oxigenação apneica</div>
          <SimpleCheckItem title="Cateter nasal 15 L/min" desc="Manter durante toda laringoscopia" />
        </Card>

        <div className="flex gap-3 mt-5">
          <button onClick={() => goToStep(6)} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button fullWidth onClick={() => goToStep(8)}>Continuar &#8594;</Button>
        </div>

        <Modal
          open={state.flushRateModal}
          onClose={() => dispatch({ type: 'SET_FLUSH_RATE_MODAL', open: false })}
          title="Flush rate (fluxo máximo)"
        >
          <div className="text-sm text-text-secondary leading-relaxed space-y-3">
            <p>Técnica de abertura total do fluxômetro de O2 (40-60 L/min), além dos 15 L/min convencionais, para maximizar a FiO2 entregue.</p>
            <p><strong>Como fazer:</strong></p>
            <p>1. Conectar O2 ao fluxômetro</p>
            <p>2. Abrir fluxômetro no máximo (flush rate = 40-60 L/min)</p>
            <p>3. Manter reservatório da máscara inflado</p>
            <p>4. Garantir vedação adequada da máscara na face</p>
            <p><strong>Benefício:</strong> FiO2 aumenta de ~60-70% para ~90%.</p>
          </div>
        </Modal>
      </div>
    )
  }

  function renderStep8() {
    return (
      <div>
        <h2 className="text-xl font-bold mb-5">Medicações</h2>

        {shouldReduceDose && (
          <AlertCard type="warning" title="Considere redução de dose">
            Paciente com instabilidade/idoso: considere reduzir a dose do indutor em 30-50%.
          </AlertCard>
        )}

        <Card className="mb-4">
          <p className="text-sm text-text-secondary mb-2">
            Peso: <strong>{w}</strong> kg | População: {state.population.charAt(0).toUpperCase() + state.population.slice(1)}
          </p>
          <p className="text-xs text-text-muted">Toque no card para selecionar. Selecione: 1 indutor + 1 BNM (bloqueio simpatico opcional)</p>
        </Card>

        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-3">Bloqueio simpático — simpatólise (opcional)</div>
          {DRUGS.filter(d => d.category === 'simpatolitico').map(drug => (
            <DoseCard
              key={drug.id}
              drug={drug}
              weight={w}
              selected={state.meds[drug.id]}
              sliderValue={state.medSliders[drug.id]}
              onToggle={() => dispatch({ type: 'TOGGLE_MED', med: drug.id })}
              onSliderChange={v => dispatch({ type: 'SET_MED_SLIDER', med: drug.id, value: v })}
            />
          ))}
        </Card>

        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-3">Indutores (selecione 1)</div>
          {DRUGS.filter(d => d.category === 'indutor').map(drug => (
            <DoseCard
              key={drug.id}
              drug={drug}
              weight={w}
              selected={state.meds[drug.id]}
              sliderValue={state.medSliders[drug.id]}
              onToggle={() => dispatch({ type: 'TOGGLE_MED', med: drug.id })}
              onSliderChange={v => dispatch({ type: 'SET_MED_SLIDER', med: drug.id, value: v })}
            />
          ))}
        </Card>

        <Card className="mb-4">
          <div className="font-bold text-[15px] mb-3">BNM (selecione 1)</div>
          {DRUGS.filter(d => d.category === 'bnm').map(drug => (
            <DoseCard
              key={drug.id}
              drug={drug}
              weight={w}
              selected={state.meds[drug.id]}
              sliderValue={state.medSliders[drug.id]}
              onToggle={() => dispatch({ type: 'TOGGLE_MED', med: drug.id })}
              onSliderChange={v => dispatch({ type: 'SET_MED_SLIDER', med: drug.id, value: v })}
            />
          ))}
        </Card>

        <div className="flex gap-3 mt-5">
          <button onClick={() => goToStep(7)} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button fullWidth onClick={() => goToStep(9)}>Continuar &#8594;</Button>
        </div>
      </div>
    )
  }

  function renderStep9() {
    return (
      <div>
        <h2 className="text-xl font-bold mb-5">Procedimento</h2>

        {isVADDifficult && (
          <AlertCard type="danger" title="Via aérea difícil identificada">
            Considere pedir ajuda precoce. Limite a 2 tentativas de laringoscopia.
            Se falha: Plano B (DEG) -{'>'} Plano C (cricotireoidostomia).
            Mantenha oxigenação entre tentativas.
          </AlertCard>
        )}

        <Card className="mb-4 overflow-hidden p-0">
          <div className="flex border-b border-border-card">
            <button
              onClick={() => dispatch({ type: 'SET_PROC_TAB', tab: 'ld' })}
              className={`flex-1 py-3.5 px-3 text-sm font-semibold border-b-2 transition-all bg-transparent border-x-0 border-t-0 cursor-pointer ${
                state.procTab === 'ld' ? 'border-accent text-white' : 'border-transparent text-text-secondary'
              }`}
            >
              Laringoscopia direta
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_PROC_TAB', tab: 'vl' })}
              className={`flex-1 py-3.5 px-3 text-sm font-semibold border-b-2 transition-all bg-transparent border-x-0 border-t-0 cursor-pointer ${
                state.procTab === 'vl' ? 'border-accent text-white' : 'border-transparent text-text-secondary'
              }`}
            >
              Videolaringoscopia
            </button>
          </div>

          <div className="p-4 text-xs text-text-secondary leading-[1.7]">
            {state.procTab === 'ld' ? (
              <>
                1. Segurar laringoscópio com mão esquerda<br />
                2. Abrir boca com técnica de tesoura (mão direita)<br />
                3. Inserir lâmina pelo lado direito, varrer língua para a esquerda<br />
                4. Avançar até a valécula (base da língua)<br />
                5. Elevar em direção ventral e anterior — nunca alavanca nos dentes<br />
                6. Se visualização inadequada: manobra BURP<br />
                7. Usar bougie ou estilete pré-moldado (fortemente recomendado)<br />
                8. Avançar tubo pelo canto direito da boca<br />
                9. Insuflar cuff
              </>
            ) : (
              <>
                1. Inserir lâmina na linha média sob visão na tela<br />
                2. Avançar até visualizar epiglote<br />
                3. Posicionar ponta na valécula ou sob a epiglote<br />
                4. Usar bougie ou estilete pré-moldado (fortemente recomendado)<br />
                5. Avançar tubo sob visão contínua na tela<br />
                6. Visualizar passagem entre as cordas vocais<br />
                7. Insuflar cuff
              </>
            )}
          </div>
        </Card>

        <Collapsible title="Erros comuns">
          <div className="text-[13px] text-text-secondary leading-[1.8]">
            <strong className="text-danger">Alavanca nos dentes</strong> — levantar, nunca rotacionar a lâmina<br />
            <strong className="text-danger">Lâmina superficial demais</strong> — não chega na valécula, sem visualização<br />
            <strong className="text-danger">Lâmina profunda demais</strong> — passa a epiglote, perde referência<br />
            <strong className="text-danger">Tubo pelo centro da boca</strong> — deve ser pelo canto direito<br />
            <strong className="text-danger">Força excessiva no bougie/tubo</strong> — avançar com movimentos suaves
          </div>
        </Collapsible>

        <Card className="mt-4 mb-4">
          <div className="font-bold text-[15px] mb-3">Registro</div>
          <div className="mb-3">
            <label className="block text-sm text-text-secondary mb-1">Tubo</label>
            <div className="p-2.5 bg-bg-elevated rounded-lg text-sm">
              {state.sex ? getTubeSize(state.sex) : '--'}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm text-text-secondary mb-1">Cormack-Lehane</label>
            <div className="flex gap-2">
              {(['I', 'II', 'III', 'IV'] as CormackGrade[]).map(g => (
                <button
                  key={g}
                  onClick={() => dispatch({ type: 'SET_CORMACK', grade: g })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors border min-h-[44px] ${
                    state.cormack === g ? 'bg-accent border-accent text-white' : 'bg-bg-elevated border-border-card text-text-secondary'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-text-secondary mb-1">Profundidade (cm)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Ex: 22"
                value={state.depth}
                onChange={e => dispatch({ type: 'SET_DEPTH', value: e.target.value })}
                className="w-full p-2.5 bg-bg-elevated border border-border-card rounded-lg text-text-primary text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-text-secondary mb-1">Cuff (cmH2O)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Ex: 25"
                value={state.cuff}
                onChange={e => dispatch({ type: 'SET_CUFF', value: e.target.value })}
                className="w-full p-2.5 bg-bg-elevated border border-border-card rounded-lg text-text-primary text-sm"
              />
            </div>
          </div>
        </Card>

        {(state.cormack === 'III' || state.cormack === 'IV') && (
          <AlertCard type="danger" title="Visualização limitada (Cormack III-IV)">
            - Considere bougie como primeira opção{'\n'}
            - Reposicionar: elevação da cabeça, manipulação laríngea externa (BURP){'\n'}
            - Considere videolaringoscópio se disponível{'\n'}
            - Limite a 2 tentativas antes de acionar Plano B
          </AlertCard>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={() => goToStep(8)} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button fullWidth onClick={() => goToStep(10)}>Continuar &#8594;</Button>
        </div>
      </div>
    )
  }

  function renderStep10() {
    return (
      <div>
        <h2 className="text-xl font-bold mb-5">Resultado e confirmação</h2>

        {/* Question: success? */}
        {state.intubationSuccess === null && (
          <Card className="text-center py-6 mb-4">
            <div className="text-base font-semibold mb-4">Intubou com sucesso?</div>
            <div className="flex gap-3">
              <Button variant="success" fullWidth onClick={() => dispatch({ type: 'SET_INTUBATION_SUCCESS', value: true })}>Sim</Button>
              <Button variant="danger" fullWidth onClick={() => dispatch({ type: 'SET_INTUBATION_SUCCESS', value: false })}>Nao</Button>
            </div>
          </Card>
        )}

        {/* Success: confirmation */}
        {state.intubationSuccess === true && !state.rescueMethod && (
          <>
            <Card className="mb-4">
              <div className="font-bold text-[15px] mb-3">Confirme posicionamento</div>
              <SimpleCheckItem title="Capnografia" desc="EtCO2 com curva adequada (padrão-ouro)" />
              <SimpleCheckItem title="Ausculta bilateral" desc="Murmurio vesicular simetrico, 5 pontos" />
              <SimpleCheckItem title="Expansibilidade torácica" desc="Simetrica bilateralmente" />
            </Card>

            <Card className="mb-4">
              <div className="font-bold text-[15px] mb-3">POCUS confirmatorio</div>
              <SimpleCheckItem
                title="Traqueal (furcula esternal)"
                desc="Linear transversal: 1 sinal hiperecoigenico (tubo) + esofago vazio. Se 'dupla via': intubação esofagica"
              />
              <SimpleCheckItem
                title="Pulmonar bilateral"
                desc="Lung sliding presente bilateralmente (se ausente unilateral: seletiva ou pneumotórax)"
              />
            </Card>

            <Card
              borderColor="#2196F3"
              className="mb-4 cursor-pointer"
              onClick={() => goToInfusion()}
            >
              <div className="font-bold text-sm text-info">Sedação em infusão contínua</div>
              <div className="text-[13px] text-text-secondary">Abrir calculadora de infusoes</div>
              <div className="text-xs text-text-muted mt-1">Fentanil - Propofol - Midazolam - Dexmedetomidina</div>
            </Card>
          </>
        )}

        {/* Success via rescue */}
        {state.intubationSuccess === true && state.rescueMethod && (
          <>
            <AlertCard type="success" title={`Resgate: ${state.rescueMethod}`}>
              Via aérea estabelecida com {state.rescueMethod}.
            </AlertCard>

            <Card className="mb-4">
              <div className="font-bold text-[15px] mb-3">Confirme posicionamento</div>
              <SimpleCheckItem title="Capnografia" desc="EtCO2 com curva adequada (padrão-ouro)" />
              <SimpleCheckItem title="Ausculta bilateral" desc="Murmurio vesicular simetrico, 5 pontos" />
              <SimpleCheckItem title="Expansibilidade torácica" desc="Simetrica bilateralmente" />
            </Card>

            <Card
              borderColor="#2196F3"
              className="mb-4 cursor-pointer"
              onClick={() => goToInfusion()}
            >
              <div className="font-bold text-sm text-info">Sedação em infusão contínua</div>
              <div className="text-[13px] text-text-secondary">Abrir calculadora de infusoes</div>
            </Card>
          </>
        )}

        {/* Failed: rescue pathway */}
        {state.intubationSuccess === false && (
          <>
            <Card borderColor="#FF5252" className="mb-4">
              <div className="font-bold text-sm text-accent mb-2">Plano B — Dispositivo extraglótico</div>
              <div className="text-[13px] text-text-secondary leading-relaxed">
                - Mascara laríngea (ML) ou dispositivo supraglotico de 2a geracao<br />
                - Inserir conforme técnica padrão, insuflar cuff<br />
                - Confirmar ventilação: EtCO2 + ausculta<br />
                - Se ventilação adequada: considere intubação atraves do DEG com fibroscopio
              </div>
              <div className="flex gap-3 mt-3">
                <Button variant="success" size="sm" fullWidth onClick={() => dispatch({ type: 'SET_RESCUE_METHOD', value: 'DEG' })}>
                  Resgatou com DEG
                </Button>
                <Button variant="danger" size="sm" fullWidth onClick={() => dispatch({ type: 'SHOW_PLAN_C' })}>
                  Falhou — Plano C
                </Button>
              </div>
            </Card>

            {state.showPlanC && (
              <Card borderColor="#F44336" className="mb-4">
                <div className="font-bold text-sm text-danger mb-2">Plano C — Cricotireoidostomia</div>
                <div className="text-[13px] text-text-secondary leading-relaxed">
                  <strong>Técnica cirúrgica (bisturi-bougie-tubo):</strong><br />
                  1. Palpar membrana cricotireóidea (entre cartilagens tireoide e cricoide)<br />
                  2. Incisão vertical na pele (3-4 cm) + incisão horizontal na membrana<br />
                  3. Inserir bougie pela incisão, direção caudal<br />
                  4. Deslizar tubo 6.0 sobre o bougie<br />
                  5. Confirmar posição: capnografia + ausculta
                </div>
                <div className="mt-3">
                  <Button variant="success" size="sm" fullWidth onClick={() => dispatch({ type: 'SET_RESCUE_METHOD', value: 'Cricotireoidostomia' })}>
                    Via aérea estabelecida
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}

        <div className="flex gap-3 mt-5">
          <Button variant="secondary" fullWidth onClick={() => { dispatch({ type: 'SET_INTUBATION_SUCCESS', value: null }); goToStep(9) }}>
            ← Voltar
          </Button>
          <Button fullWidth onClick={() => goToStep(11)}>Finalizar →</Button>
        </div>
      </div>
    )
  }

  function renderStep11() {
    const indTexts = ['Falha em manter/proteger VA', 'Falha de ventilação/oxigenação', 'Curso clínico antecipado']
    const indLine = state.indications.map((v, i) => v ? indTexts[i] : null).filter(Boolean).join(', ') || '--'

    const crashLetters = Object.entries(state.crash).filter(([, v]) => v).map(([k]) => k).join('')
    let vadLine = `CRASH: ${crashCount}/5${crashLetters ? ` (${crashLetters})` : ''}`
    if (state.vadOption === 'yes') vadLine += ` | LEMON: ${lemonCount}/5 | ROMAN: ${romanCount}/5`
    else if (state.vadOption === 'no') vadLine += ' | Avaliação anatômica: não realizada'
    if (state.shockIndex) vadLine += ` | SI: ${state.shockIndex.toFixed(2)}`

    let patLine = `Peso: ${state.localWeight || '--'} kg`
    if (state.height) patLine += ` | Altura: ${state.height} cm`
    patLine += ` | Sexo: ${state.sex === 'M' ? 'Masculino' : 'Feminino'} | População: ${state.population}`

    const medsLines: string[] = []
    if (state.meds.fentanil) medsLines.push(`Fentanil ${calcDose(w, state.medSliders.fentanil)} mcg (${state.medSliders.fentanil} mcg/kg)`)
    if (state.meds.ketamina) medsLines.push(`Cetamina ${calcDose(w, state.medSliders.ketamina)} mg (${state.medSliders.ketamina} mg/kg)`)
    if (state.meds.etomidato) medsLines.push(`Etomidato ${calcDoseDecimal(w, state.medSliders.etomidato)} mg (${state.medSliders.etomidato} mg/kg)`)
    if (state.meds.propofol) medsLines.push(`Propofol ${calcDose(w, state.medSliders.propofol)} mg (${state.medSliders.propofol} mg/kg)`)
    if (state.meds.rocuronio) medsLines.push(`Rocurônio ${calcDose(w, state.medSliders.rocuronio)} mg (${state.medSliders.rocuronio} mg/kg)`)
    if (state.meds.succinilcolina) medsLines.push(`Succinilcolina ${calcDose(w, state.medSliders.succinilcolina)} mg (${state.medSliders.succinilcolina} mg/kg)`)

    let procLine = `Tubo: ${state.sex ? getTubeSize(state.sex) : '--'}`
    if (state.cormack) procLine += ` | Cormack-Lehane: ${state.cormack}`
    if (state.depth) procLine += ` | Prof: ${state.depth} cm`
    if (state.cuff) procLine += ` | Cuff: ${state.cuff} cmH2O`

    let confLine = 'Capnografia + Ausculta + POCUS'
    if (state.rescueMethod) confLine = `Resgate: ${state.rescueMethod} | ${confLine}`

    const sections = [
      { title: 'Indicação', content: indLine },
      { title: 'Avaliação de VAD', content: vadLine },
      { title: 'Paciente', content: patLine },
      { title: 'Medicações', content: medsLines.join(' | ') || 'Nenhuma selecionada' },
      { title: 'Procedimento', content: procLine },
      { title: 'Confirmação', content: confLine },
    ]

    return (
      <div>
        <h2 className="text-xl font-bold mb-5">Resumo</h2>

        {sections.map((sec, i) => (
          <div key={i} className="mb-3 p-3.5 bg-bg-card border border-border-card rounded-xl">
            <div className="text-xs font-bold text-accent uppercase tracking-wider mb-1">{sec.title}</div>
            <div className="text-sm text-text-secondary whitespace-pre-wrap">{sec.content}</div>
          </div>
        ))}

        <div className="flex gap-3 mt-5">
          <button onClick={() => goToStep(10)} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button fullWidth onClick={copyReport}>Copiar relatório</Button>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: PATHWAY CONTAINER
  // ==========================================

  function renderPathway() {
    return (
      <div>
        <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-3 px-0 min-h-[44px]">← Voltar</button>

        <StepperNav
          steps={PATHWAY_STEPS}
          currentStep={state.step}
          onNavigate={goToStep}
        />

        {state.step === 1 && renderStep1()}
        {state.step === 2 && renderStep2()}
        {state.step === 3 && renderStep3()}
        {state.step === 4 && renderStep4()}
        {state.step === 5 && renderStep5()}
        {state.step === 6 && renderStep6()}
        {state.step === 7 && renderStep7()}
        {state.step === 8 && renderStep8()}
        {state.step === 9 && renderStep9()}
        {state.step === 10 && renderStep10()}
        {state.step === 11 && renderStep11()}
      </div>
    )
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-[70px]">
      <Disclaimer />
      <Header title="AirwayGuide" subtitle="Guia de Manejo de VA" />
      <Container>
        {state.screen === 'home' && renderHome()}
        {state.screen === 'pathway' && renderPathway()}
        {state.screen === 'checklist' && renderChecklist()}
        {state.screen === 'doses' && renderStandaloneDoses()}
      </Container>
      <Footer toolName="Airway Guide" version="v2.0.0" updatedAt="Abril 2026" />
      <FABMenu items={fabItems} />
    </div>
  )
}

// ==========================================
// SIMPLE CHECK ITEM (local state toggle)
// ==========================================

function SimpleCheckItem({ title, desc }: { title: React.ReactNode; desc?: string }) {
  const [checked, setChecked] = useState(false)
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`flex items-start gap-3 w-full p-3.5 rounded-lg mb-2.5 text-left transition-all min-h-[44px] border ${
        checked ? 'border-success bg-success/10' : 'bg-bg-elevated border-border-card'
      }`}
    >
      <div className={`w-5.5 h-5.5 border-2 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
        checked ? 'border-success' : 'border-border-card'
      }`}>
        {checked && (
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
        )}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{title}</div>
        {desc && <div className="text-xs text-text-secondary mt-0.5">{desc}</div>}
      </div>
    </button>
  )
}
