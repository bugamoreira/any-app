import { useState, useCallback, useMemo } from 'react'
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
// Weight e toast disponíveis via contexto global se necessário
import { fmt } from '../utils/calculations'
import type { FABItem } from '../types/clinical'

// ==========================================
// TIPOS
// ==========================================

type View = 'home' | 'pathway' | 'calc' | 'ref'
type PathwayPanel = 'step1' | 'stepUnstable' | 'step2' | 'step3' | 'step4'
type ClassPanel = 'classQ1' | 'classQ2' | 'classQ2h' | 'classQ2b' | 'classQ3' | 'classQ3b' | 'classQ4'
type WellsLevel = 'low' | 'moderate' | 'high'
type TromboStage = 'question' | 'contraindicated' | 'risk' | 'doseHigh' | 'doseStandard'
type TepCategory = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'C3' | 'D' | 'D1' | 'D2' | 'E1' | 'E2'

interface ClassState {
  symptomatic?: boolean
  risk?: 'low' | 'high'
  location?: 'subseg' | 'segPlus'
  hestia?: 'neg' | 'pos'
}

interface ManagementData {
  description: string
  actions: string[]
  destino: string
  anticoag: string
  monitor: string
  advanced: string
  followup?: string
}

// ==========================================
// DADOS CLINICOS
// ==========================================

const WELLS_ITEMS = [
  { label: 'Sinais clinicos de TVP', pts: 3 },
  { label: 'TEP mais provavel que outros diagnosticos', pts: 3 },
  { label: 'FC >100 bpm', pts: 1.5 },
  { label: 'Imobilizacao (>=3 dias) ou cirurgia nas ultimas 4 semanas', pts: 1.5 },
  { label: 'TVP ou TEP previos', pts: 1.5 },
  { label: 'Hemoptise', pts: 1 },
  { label: 'Cancer ativo', pts: 1 },
]

const PERC_ITEMS = [
  'Idade >=50 anos',
  'FC >=100 bpm',
  'SpO2 <95% em ar ambiente',
  'Hemoptise',
  'Uso de estrogenio',
  'Cirurgia ou trauma com hospitalizacao nas ultimas 4 semanas',
  'TVP ou TEP previos',
  'Edema unilateral de membro inferior',
]

const SPESI_ITEMS = [
  'Idade >80 anos',
  'Cancer ativo',
  'Doenca cardiopulmonar cronica',
  'PAS <100 mmHg',
  'FC >=110 bpm',
  'SpO2 <90%',
]

const PESI_ITEMS = [
  { label: 'Sexo masculino', pts: 10 },
  { label: 'Cancer', pts: 30 },
  { label: 'Insuficiencia cardiaca', pts: 10 },
  { label: 'Doenca pulmonar cronica', pts: 10 },
  { label: 'FC >=110 bpm', pts: 20 },
  { label: 'PAS <100 mmHg', pts: 30 },
  { label: 'FR >=30 irpm', pts: 20 },
  { label: 'Temperatura <36C', pts: 20 },
  { label: 'Alteracao do nivel de consciencia', pts: 60 },
  { label: 'SpO2 <90%', pts: 20 },
]

const BOVA_ITEMS = [
  { label: 'PAS 90-100 mmHg', pts: 2 },
  { label: 'Troponina elevada', pts: 2 },
  { label: 'Disfuncao de VD (eco ou TC)', pts: 2 },
  { label: 'FC >=110 bpm', pts: 1 },
]

const HESTIA_ITEMS = [
  'Instabilidade hemodinamica',
  'Necessidade de trombolise ou embolectomia',
  'Sangramento ativo ou alto risco de sangramento',
  'Necessidade de O2 >24h para manter SpO2 >90%',
  'TEP diagnosticado durante anticoagulacao',
  'Dor intensa necessitando analgesia IV >24h',
  'Razao medica ou social para internacao >24h',
  'Clearance de creatinina <30 mL/min',
  'Hepatopatia grave',
  'Gestante',
  'Antecedente de trombocitopenia induzida por heparina',
]

const YEARS_ITEMS = [
  'Sinais clinicos de TVP',
  'Hemoptise',
  'TEP como diagnostico mais provavel',
]

const ECO_ITEMS = [
  'VD/VE >0,9',
  'TAPSE <16 mm',
  'Sinal de McConnell',
  'D-sign (septo achatado)',
  'Trombo em camaras direitas',
  'TAPSE/PASP <0,34',
  'Hipocinesia de VD',
]

function getManagement(cat: TepCategory): ManagementData {
  const data: Record<TepCategory, ManagementData> = {
    A1: {
      description: 'TEP incidental, assintomatico, subsegmentar.',
      actions: [
        'Avaliar necessidade de anticoagulacao (considerar presenca de TVP, contexto clinico)',
        'Considere alta do DE com seguimento ambulatorial',
      ],
      destino: 'Alta do DE',
      anticoag: 'Avaliar caso a caso',
      monitor: 'Ambulatorial',
      advanced: 'Nao indicada',
      followup: 'Retorno em 1-2 semanas. Procure atendimento imediato se: dispneia progressiva, sincope, dor toracica ou hemoptise.',
    },
    A2: {
      description: 'TEP incidental, assintomatico, segmentar ou mais proximal.',
      actions: [
        'Anticoagulacao recomendada',
        'Alta do DE com seguimento ambulatorial',
      ],
      destino: 'Alta do DE',
      anticoag: 'DOAC (preferido)',
      monitor: 'Ambulatorial',
      advanced: 'Nao indicada',
      followup: 'Retorno em 1-2 semanas. Procure atendimento imediato se: dispneia progressiva, sincope, dor toracica ou hemoptise.',
    },
    B1: {
      description: 'TEP sintomatico, baixo risco, subsegmentar.',
      actions: [
        'Avaliar necessidade de anticoagulacao (considerar TVP, contexto)',
        'Se anticoagular: avaliar tratamento ambulatorial (Hestia negativo -> razoavel)',
        'Seguimento ambulatorial em 1-2 semanas',
      ],
      destino: 'Alta / Observacao breve',
      anticoag: 'Avaliar caso a caso',
      monitor: 'Ambulatorial',
      advanced: 'Nao indicada',
      followup: 'Retorno em 1-2 semanas. Procure atendimento imediato se: dispneia progressiva, sincope, dor toracica ou hemoptise.',
    },
    B2: {
      description: 'TEP sintomatico, baixo risco, segmentar ou mais proximal.',
      actions: [
        'Anticoagulacao',
        'Avaliar tratamento ambulatorial (Hestia negativo -> razoavel)',
        'DOAC preferido',
        'Seguimento ambulatorial em 1-2 semanas',
      ],
      destino: 'Alta (se Hestia neg.) / Observacao',
      anticoag: 'DOAC (preferido)',
      monitor: 'Ambulatorial',
      advanced: 'Nao indicada',
      followup: 'Retorno em 1-2 semanas. Procure atendimento imediato se: dispneia progressiva, sincope, dor toracica ou hemoptise.',
    },
    C1: {
      description: 'TEP sintomatico, risco elevado. Sem biomarcadores alterados e sem disfuncao de VD.',
      actions: [
        'Internacao em enfermaria',
        'Anticoagulacao (DOAC preferido)',
        'Monitorizacao padrao',
      ],
      destino: 'Enfermaria',
      anticoag: 'DOAC (preferido)',
      monitor: 'Padrao enfermaria',
      advanced: 'Nao indicada',
    },
    C2: {
      description: 'TEP sintomatico, risco elevado. Biomarcadores elevados OU disfuncao de VD.',
      actions: [
        'Internacao',
        'Anticoagulacao',
        'Monitorizacao proxima',
      ],
      destino: 'Enfermaria / Semi-intensiva',
      anticoag: 'DOAC ou HBPM',
      monitor: 'Monitorizacao proxima',
      advanced: 'Nao indicada (salvo deterioracao)',
    },
    C3: {
      description: 'TEP sintomatico, risco elevado. Biomarcadores elevados E disfuncao de VD.',
      actions: [
        'Internacao em semi/UTI',
        'Anticoagulacao (considere HBPM se possibilidade de escalar terapia)',
        'Monitorizacao intensiva 24-72h (PEITHO: deterioracao media em 1,5 dias)',
        'Se deterioracao -> considere terapias avancadas',
      ],
      destino: 'Semi-intensiva / UTI',
      anticoag: 'HBPM ou DOAC',
      monitor: 'Intensiva 24-72h',
      advanced: 'Considerar se deterioracao',
    },
    D: {
      description: 'Pre-falencia cardiopulmonar. Hipotensao transitoria ou sinais de hipoperfusao (classificado via instabilidade).',
      actions: [
        'UTI',
        'Anticoagulacao parenteral (HBPM ou HNF)',
        'Vasopressores se necessario',
        'Considere terapias avancadas conforme evolucao',
        'Reavaliar e subclassificar em D1 ou D2 quando estabilizado',
      ],
      destino: 'UTI',
      anticoag: 'HBPM ou HNF',
      monitor: 'UTI continua',
      advanced: 'Pode ser considerada',
    },
    D1: {
      description: 'Pre-falencia cardiopulmonar. Hipotensao transitoria/recorrente sem sinais de hipoperfusao.',
      actions: [
        'UTI',
        'Anticoagulacao parenteral (HBPM ou HNF)',
        'Vasopressores se necessario',
        'Terapias avancadas podem ser consideradas',
      ],
      destino: 'UTI',
      anticoag: 'HBPM ou HNF',
      monitor: 'UTI continua',
      advanced: 'Pode ser considerada',
    },
    D2: {
      description: 'Pre-falencia cardiopulmonar. Hipoperfusao ou disfuncao organica sem hipotensao persistente.',
      actions: [
        'UTI',
        'Anticoagulacao parenteral',
        'Vasopressores (norepinefrina 1a escolha)',
        'Terapias avancadas podem ser consideradas',
      ],
      destino: 'UTI',
      anticoag: 'HNF (preferivel)',
      monitor: 'UTI continua',
      advanced: 'Pode ser considerada',
    },
    E1: {
      description: 'Falencia cardiopulmonar. Hipotensao persistente (PAS <90 mmHg por >=15 min).',
      actions: [
        'UTI',
        'Anticoagulacao parenteral (HNF)',
        'Vasopressores + inotropicos',
        'Terapia avancada recomendada (trombolise sistemica, CDL, MT ou embolectomia)',
      ],
      destino: 'UTI',
      anticoag: 'HNF',
      monitor: 'UTI + hemodinamica invasiva',
      advanced: 'Recomendada',
    },
    E2: {
      description: 'Falencia cardiopulmonar. Choque refratario ou parada cardiorrespiratoria.',
      actions: [
        'UTI',
        'Anticoagulacao parenteral (HNF)',
        'Vasopressores + inotropicos',
        'Considere VA-ECMO',
        'Terapia avancada recomendada',
      ],
      destino: 'UTI',
      anticoag: 'HNF',
      monitor: 'UTI + hemodinamica invasiva',
      advanced: 'Recomendada + considere ECMO',
    },
  }
  return data[cat]
}

// ==========================================
// CORES POR CATEGORIA
// ==========================================

const CAT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  A: { border: '#2196F3', bg: 'rgba(33,150,243,0.08)', text: '#2196F3' },
  B: { border: '#4CAF50', bg: 'rgba(76,175,80,0.08)', text: '#4CAF50' },
  C1: { border: '#FFC107', bg: 'rgba(255,193,7,0.08)', text: '#FFC107' },
  C2: { border: '#FF9800', bg: 'rgba(255,152,0,0.08)', text: '#FF9800' },
  C3: { border: '#FF5722', bg: 'rgba(255,87,34,0.08)', text: '#FF5722' },
  D: { border: '#F44336', bg: 'rgba(244,67,54,0.08)', text: '#F44336' },
  E: { border: '#C62828', bg: 'rgba(198,40,40,0.08)', text: '#C62828' },
}

function getCatColor(cat: string) {
  if (cat.startsWith('E')) return CAT_COLORS.E
  if (cat.startsWith('D')) return CAT_COLORS.D
  if (cat === 'C3') return CAT_COLORS.C3
  if (cat === 'C2') return CAT_COLORS.C2
  if (cat === 'C1') return CAT_COLORS.C1
  if (cat.startsWith('B')) return CAT_COLORS.B
  return CAT_COLORS.A
}

// ==========================================
// CHECKLIST COMPONENT
// ==========================================

function ChecklistCalc({
  items,
  checked,
  onToggle,
  showPoints = false,
  pointsData,
}: {
  items: string[]
  checked: boolean[]
  onToggle: (i: number) => void
  showPoints?: boolean
  pointsData?: number[]
}) {
  return (
    <div className="space-y-0">
      {items.map((label, i) => (
        <button
          key={i}
          onClick={() => onToggle(i)}
          className="flex items-center w-full py-2.5 border-b border-white/[0.04] last:border-b-0 bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
        >
          <span
            className={`w-[22px] h-[22px] rounded flex-shrink-0 flex items-center justify-center border-2 mr-3 transition-colors text-xs font-bold ${
              checked[i]
                ? 'bg-accent border-accent text-white'
                : 'border-[#444] bg-transparent'
            }`}
          >
            {checked[i] && '\u2713'}
          </span>
          <span className="text-sm text-text-primary flex-1">{label}</span>
          {showPoints && pointsData && (
            <span className="text-xs text-text-secondary ml-2 whitespace-nowrap">
              +{pointsData[i] % 1 === 0 ? pointsData[i] : fmt(pointsData[i], 1)}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ==========================================
// CALC RESULT COMPONENT
// ==========================================

function CalcResult({
  score,
  text,
  color,
}: {
  score?: string | number
  text: string
  color: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'neutral'
}) {
  const colorMap = {
    green: 'bg-success/[0.12] text-success',
    yellow: 'bg-warning/[0.12] text-warning',
    orange: 'bg-[#FF9800]/[0.12] text-[#FF9800]',
    red: 'bg-danger/[0.12] text-danger',
    blue: 'bg-info/[0.12] text-info',
    neutral: 'bg-bg-hover text-text-secondary',
  }
  return (
    <div className={`p-4 rounded-lg text-center mt-3 ${colorMap[color]}`}>
      {score !== undefined && <div className="text-2xl font-bold">{score}</div>}
      <div className="text-sm mt-1">{text}</div>
    </div>
  )
}

// ==========================================
// PROGRESS DOTS
// ==========================================

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 mb-5">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const isDone = step < current
        const isActive = step === current
        return (
          <div
            key={step}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              isActive ? 'bg-accent' : isDone ? 'bg-success' : 'bg-[#333]'
            }`}
          />
        )
      })}
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function TepGuide() {
  const navigate = useNavigate()
  // --- View state ---
  const [view, setView] = useState<View>('home')
  const [panel, setPanel] = useState<PathwayPanel>('step1')
  const [_slideDir, setSlideDir] = useState<'left' | 'right'>('left')
  void _slideDir // suppress unused warning - will use for animations later

  // --- Classification state ---
  const [classPanel, setClassPanel] = useState<ClassPanel>('classQ1')
  const [classState, setClassState] = useState<ClassState>({})
  const [categoryResult, setCategoryResult] = useState<TepCategory | null>(null)
  const [hasModR, setHasModR] = useState(false)

  // --- Step 2 state ---
  const [isPregnant, setIsPregnant] = useState(false)
  const [wellsLevel, setWellsLevel] = useState<WellsLevel | null>(null)
  const [percResult, setPercResult] = useState<'neg' | 'pos' | null>(null)
  const [ddimerResult, setDdimerResult] = useState<'neg' | 'pos' | null>(null)
  const [yearsPregResult, setYearsPregResult] = useState<'neg' | 'pos' | null>(null)

  // --- Trombolise decision tree ---
  const [tromboStage, setTromboStage] = useState<TromboStage>('question')

  // --- Eco modal ---
  const [ecoOpen, setEcoOpen] = useState(false)
  const [ecoChecked, setEcoChecked] = useState<boolean[]>(new Array(ECO_ITEMS.length).fill(false))
  const [ecoConfirmed, setEcoConfirmed] = useState(false)

  // --- Inline calculators (pathway) ---
  const [inlineWellsChecked, setInlineWellsChecked] = useState<boolean[]>(new Array(WELLS_ITEMS.length).fill(false))
  const [inlinePercChecked, setInlinePercChecked] = useState<boolean[]>(new Array(PERC_ITEMS.length).fill(false))
  const [inlineSpesiChecked, setInlineSpesiChecked] = useState<boolean[]>(new Array(SPESI_ITEMS.length).fill(false))
  const [inlinePesiChecked, setInlinePesiChecked] = useState<boolean[]>(new Array(PESI_ITEMS.length).fill(false))
  const [inlinePesiAge, setInlinePesiAge] = useState(65)
  const [inlineHestiaChecked, setInlineHestiaChecked] = useState<boolean[]>(new Array(HESTIA_ITEMS.length).fill(false))
  const [inlineDdimerAge, setInlineDdimerAge] = useState(65)
  const [inlineDdimerValue, setInlineDdimerValue] = useState<string>('')
  const [inlineYearsChecked, setInlineYearsChecked] = useState<boolean[]>(new Array(YEARS_ITEMS.length).fill(false))
  const [inlineYearsDD, setInlineYearsDD] = useState<string>('')
  const [inlineYearsPregChecked, setInlineYearsPregChecked] = useState<boolean[]>(new Array(YEARS_ITEMS.length).fill(false))
  const [inlineYearsPregDD, setInlineYearsPregDD] = useState<string>('')

  // --- Standalone calculators ---
  const [calcWellsChecked, setCalcWellsChecked] = useState<boolean[]>(new Array(WELLS_ITEMS.length).fill(false))
  const [calcPercChecked, setCalcPercChecked] = useState<boolean[]>(new Array(PERC_ITEMS.length).fill(false))
  const [calcSpesiChecked, setCalcSpesiChecked] = useState<boolean[]>(new Array(SPESI_ITEMS.length).fill(false))
  const [calcPesiChecked, setCalcPesiChecked] = useState<boolean[]>(new Array(PESI_ITEMS.length).fill(false))
  const [calcPesiAge, setCalcPesiAge] = useState(65)
  const [calcBovaChecked, setCalcBovaChecked] = useState<boolean[]>(new Array(BOVA_ITEMS.length).fill(false))
  const [calcHestiaChecked, setCalcHestiaChecked] = useState<boolean[]>(new Array(HESTIA_ITEMS.length).fill(false))
  const [calcDdimerAge, setCalcDdimerAge] = useState(65)
  const [calcDdimerValue, setCalcDdimerValue] = useState<string>('')
  const [calcYearsChecked, setCalcYearsChecked] = useState<boolean[]>(new Array(YEARS_ITEMS.length).fill(false))
  const [calcYearsDD, setCalcYearsDD] = useState<string>('')
  const [calcYearsPregChecked, setCalcYearsPregChecked] = useState<boolean[]>(new Array(YEARS_ITEMS.length).fill(false))
  const [calcYearsPregDD, setCalcYearsPregDD] = useState<string>('')

  // --- Computed scores ---
  const inlineWellsScore = useMemo(() =>
    inlineWellsChecked.reduce((s, c, i) => s + (c ? WELLS_ITEMS[i].pts : 0), 0), [inlineWellsChecked])
  const inlinePercCount = useMemo(() => inlinePercChecked.filter(Boolean).length, [inlinePercChecked])
  const inlineSpesiCount = useMemo(() => inlineSpesiChecked.filter(Boolean).length, [inlineSpesiChecked])
  const inlinePesiScore = useMemo(() =>
    inlinePesiAge + inlinePesiChecked.reduce((s, c, i) => s + (c ? PESI_ITEMS[i].pts : 0), 0), [inlinePesiChecked, inlinePesiAge])
  const inlineHestiaCount = useMemo(() => inlineHestiaChecked.filter(Boolean).length, [inlineHestiaChecked])

  const calcWellsScore = useMemo(() =>
    calcWellsChecked.reduce((s, c, i) => s + (c ? WELLS_ITEMS[i].pts : 0), 0), [calcWellsChecked])
  const calcPercCount = useMemo(() => calcPercChecked.filter(Boolean).length, [calcPercChecked])
  const calcSpesiCount = useMemo(() => calcSpesiChecked.filter(Boolean).length, [calcSpesiChecked])
  const calcPesiScore = useMemo(() =>
    calcPesiAge + calcPesiChecked.reduce((s, c, i) => s + (c ? PESI_ITEMS[i].pts : 0), 0), [calcPesiChecked, calcPesiAge])
  const calcBovaScore = useMemo(() =>
    calcBovaChecked.reduce((s, c, i) => s + (c ? BOVA_ITEMS[i].pts : 0), 0), [calcBovaChecked])
  const calcHestiaCount = useMemo(() => calcHestiaChecked.filter(Boolean).length, [calcHestiaChecked])

  const ecoCount = useMemo(() => ecoChecked.filter(Boolean).length, [ecoChecked])

  // --- Navigation helpers ---
  const goToPanel = useCallback((p: PathwayPanel, dir: 'left' | 'right' = 'left') => {
    setSlideDir(dir)
    setPanel(p)
  }, [])

  const showView = useCallback((v: View) => {
    setView(v)
  }, [])

  const resetClassification = useCallback(() => {
    setClassState({})
    setCategoryResult(null)
    setHasModR(false)
    setClassPanel('classQ1')
    setInlineSpesiChecked(new Array(SPESI_ITEMS.length).fill(false))
    setInlinePesiChecked(new Array(PESI_ITEMS.length).fill(false))
    setInlinePesiAge(65)
    setInlineHestiaChecked(new Array(HESTIA_ITEMS.length).fill(false))
  }, [])

  const resetStep2 = useCallback(() => {
    setWellsLevel(null)
    setPercResult(null)
    setDdimerResult(null)
    setYearsPregResult(null)
    setIsPregnant(false)
    setInlineWellsChecked(new Array(WELLS_ITEMS.length).fill(false))
    setInlinePercChecked(new Array(PERC_ITEMS.length).fill(false))
    setInlineDdimerAge(65)
    setInlineDdimerValue('')
    setInlineYearsChecked(new Array(YEARS_ITEMS.length).fill(false))
    setInlineYearsDD('')
    setInlineYearsPregChecked(new Array(YEARS_ITEMS.length).fill(false))
    setInlineYearsPregDD('')
  }, [])

  // --- Classification flow ---
  const classAnswer = useCallback((answer: string) => {
    switch (answer) {
      case 'asymptomatic':
        setClassState(s => ({ ...s, symptomatic: false }))
        setClassPanel('classQ2b')
        break
      case 'symptomatic':
        setClassState(s => ({ ...s, symptomatic: true }))
        setClassPanel('classQ2')
        break
      case 'lowRisk':
        setClassState(s => ({ ...s, risk: 'low' }))
        setClassPanel('classQ2h')
        break
      case 'highRisk':
        setClassState(s => ({ ...s, risk: 'high' }))
        setClassPanel('classQ3')
        break
      case 'subseg': {
        const newState = { ...classState, location: 'subseg' as const }
        setClassState(newState)
        if (!newState.symptomatic) {
          setCategoryResult('A1')
          setClassPanel('classQ4')
        } else if (newState.risk === 'low') {
          setCategoryResult('B1')
          setClassPanel('classQ4')
        } else {
          setClassPanel('classQ3')
        }
        break
      }
      case 'segPlus': {
        const newState = { ...classState, location: 'segPlus' as const }
        setClassState(newState)
        if (!newState.symptomatic) {
          setCategoryResult('A2')
          setClassPanel('classQ4')
        } else if (newState.risk === 'low') {
          setCategoryResult('B2')
          setClassPanel('classQ4')
        } else {
          setClassPanel('classQ3')
        }
        break
      }
      case 'c1':
        setCategoryResult('C1')
        setClassPanel('classQ4')
        break
      case 'c2':
        setCategoryResult('C2')
        setClassPanel('classQ4')
        break
      case 'c3':
        setCategoryResult('C3')
        setClassPanel('classQ3b')
        break
      case 'd1':
        setCategoryResult('D1')
        setClassPanel('classQ4')
        break
      case 'd2':
        setCategoryResult('D2')
        setClassPanel('classQ4')
        break
      case 'noR':
        setHasModR(false)
        showManagement()
        break
      case 'yesR':
        setHasModR(true)
        showManagement()
        break
    }
  }, [classState])

  const showManagement = useCallback(() => {
    goToPanel('step4')
  }, [goToPanel])

  const classifyUnstable = useCallback((cat: TepCategory) => {
    setCategoryResult(cat)
    setHasModR(true)
    goToPanel('step4')
  }, [goToPanel])

  // --- D-dimero helper ---
  function calcDdimerThreshold(age: number) {
    return age >= 50 ? age * 10 : 500
  }

  // --- PESI classification ---
  function classifyPesi(score: number) {
    if (score <= 65) return { cls: 'I', risk: 'Risco muito baixo', color: 'green' as const }
    if (score <= 85) return { cls: 'II', risk: 'Risco baixo', color: 'green' as const }
    if (score <= 105) return { cls: 'III', risk: 'Risco intermediario', color: 'yellow' as const }
    if (score <= 125) return { cls: 'IV', risk: 'Risco alto', color: 'orange' as const }
    return { cls: 'V', risk: 'Risco muito alto', color: 'red' as const }
  }

  // --- Bova classification ---
  function classifyBova(score: number) {
    if (score <= 2) return { text: 'Estagio I -- Baixo risco de complicacoes', color: 'green' as const }
    if (score <= 4) return { text: 'Estagio II -- Risco intermediario', color: 'yellow' as const }
    return { text: 'Estagio III -- Risco elevado de complicacoes', color: 'red' as const }
  }

  // --- FAB menu ---
  const fabItems: FABItem[] = [
    { label: 'Menu', onClick: () => showView('home') },
    { label: 'Pathway', onClick: () => showView('pathway') },
    { label: 'Calculadoras', onClick: () => showView('calc') },
    { label: 'Referencias', onClick: () => showView('ref') },
  ]

  // --- Deep link handler ---
  const scrollToRef = useCallback((refView: View) => {
    setView(refView)
  }, [])

  // ==========================================
  // RENDER: HOME GRID
  // ==========================================

  function renderHome() {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Card
            className="col-span-2 min-h-[140px] flex flex-col items-center justify-center text-center border border-accent/20 hover:border-accent"
            onClick={() => showView('pathway')}
          >
            <svg className="w-12 h-12 stroke-accent fill-none mb-3" viewBox="0 0 48 48" strokeWidth="1.5">
              <circle cx="24" cy="8" r="4" /><line x1="24" y1="12" x2="24" y2="20" />
              <circle cx="24" cy="24" r="4" /><line x1="20.5" y1="26.5" x2="12" y2="34" />
              <line x1="27.5" y1="26.5" x2="36" y2="34" /><circle cx="12" cy="38" r="4" />
              <circle cx="36" cy="38" r="4" />
            </svg>
            <span className="text-[17px] font-semibold">TEP Guide -- Iniciar o atendimento</span>
            <span className="text-xs text-text-secondary mt-1">Pathway de decisao com calculadoras integradas</span>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center min-h-[100px]" onClick={() => showView('calc')}>
            <svg className="w-10 h-10 stroke-accent fill-none mb-3" viewBox="0 0 48 48" strokeWidth="1.5">
              <rect x="10" y="4" width="28" height="40" rx="3" /><line x1="16" y1="14" x2="32" y2="14" />
              <circle cx="18" cy="22" r="2" /><circle cx="30" cy="22" r="2" />
              <circle cx="18" cy="30" r="2" /><circle cx="30" cy="30" r="2" /><circle cx="24" cy="38" r="2" />
            </svg>
            <span className="text-[15px] font-semibold">Calculadoras</span>
            <span className="text-xs text-text-secondary mt-1">Acesso avulso aos scores</span>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center min-h-[100px]" onClick={() => showView('ref')}>
            <svg className="w-10 h-10 stroke-accent fill-none mb-3" viewBox="0 0 48 48" strokeWidth="1.5">
              <path d="M8 6 h28 a4 4 0 0 1 4 4 v28 a4 4 0 0 1 -4 4 H8 Z" />
              <line x1="14" y1="14" x2="32" y2="14" /><line x1="14" y1="20" x2="32" y2="20" />
              <line x1="14" y1="26" x2="28" y2="26" /><line x1="14" y1="32" x2="24" y2="32" />
            </svg>
            <span className="text-[15px] font-semibold">Referencia rapida</span>
            <span className="text-xs text-text-secondary mt-1">Anticoagulacao, eco, contraindicacoes</span>
          </Card>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: PATHWAY
  // ==========================================

  function renderPathway() {
    const currentStep = panel === 'step1' ? 1 : panel === 'stepUnstable' ? 1 : panel === 'step2' ? 2 : panel === 'step3' ? 3 : 4
    return (
      <div>
        <button onClick={() => showView('home')} className="flex items-center gap-1.5 bg-transparent border border-bg-hover text-text-secondary text-xs px-4 py-2 rounded-lg cursor-pointer mb-4 hover:border-accent hover:text-text-primary transition-colors min-h-[44px]">
          &larr; Menu
        </button>
        <div className="text-[11px] font-semibold text-accent uppercase tracking-[2px] mb-4 pl-0.5">Pathway de decisao</div>
        <ProgressDots current={currentStep} total={4} />

        {panel === 'step1' && renderStep1()}
        {panel === 'stepUnstable' && renderStepUnstable()}
        {panel === 'step2' && renderStep2()}
        {panel === 'step3' && renderStep3()}
        {panel === 'step4' && renderStep4()}
      </div>
    )
  }

  // --- STEP 1 ---
  function renderStep1() {
    return (
      <div className="bg-bg-card rounded-xl p-6 animate-slide-left">
        <div className="text-[11px] font-semibold text-accent uppercase tracking-[1px] mb-2">Passo 1 de 4</div>
        <h2 className="text-lg font-semibold mb-3">Estabilidade hemodinamica</h2>
        <p className="text-sm text-text-secondary mb-4">Avaliacao inicial do paciente com suspeita de TEP agudo.</p>
        <Button variant="secondary" fullWidth className="mb-2 text-left" onClick={() => goToPanel('step2')}>
          Paciente hemodinamicamente estavel
        </Button>
        <Button variant="secondary" fullWidth className="text-left" onClick={() => goToPanel('stepUnstable')}>
          Instabilidade hemodinamica (PAS &lt;90, choque, PCR)
        </Button>
      </div>
    )
  }

  // --- STEP UNSTABLE ---
  function renderStepUnstable() {
    return (
      <div className="bg-bg-card rounded-xl p-6 animate-slide-left space-y-3">
        <div className="text-[11px] font-semibold text-accent uppercase tracking-[1px] mb-2">Paciente instavel</div>
        <h2 className="text-lg font-semibold mb-3">Protocolo de instabilidade hemodinamica</h2>

        <AlertCard type="danger">
          <strong>Prioridade:</strong> Reanimacao hemodinamica antes de diagnostico. Inicie suporte imediatamente.
        </AlertCard>

        {/* Acoes imediatas */}
        <div className="bg-bg-hover rounded-lg p-3.5">
          <p className="text-xs font-semibold text-danger uppercase tracking-[1px] mb-2.5">Acoes imediatas</p>
          {[
            'Acesso venoso calibroso (2 acessos perifericos ou central)',
            'Monitorizacao continua (ECG, SpO2, PA invasiva se possivel)',
            'Gasometria arterial + lactato',
            'Troponina, BNP/NT-proBNP',
            'Hemograma, coagulograma, creatinina',
            'Tipagem sanguinea + reserva de hemoderivados',
            'Beta-hCG (mulheres em idade fertil)',
          ].map((item, i) => (
            <div key={i} className="flex items-start py-1.5 text-xs text-text-secondary">
              <span className="mr-2.5 text-text-secondary flex-shrink-0">{'\u25A1'}</span>{item}
            </div>
          ))}
        </div>

        {/* Eco a beira-leito */}
        <div className="bg-bg-hover rounded-lg p-3.5">
          <p className="text-xs font-semibold text-info uppercase tracking-[1px] mb-2.5">Eco a beira-leito -- disfuncao de VD</p>
          <p className="text-xs text-text-secondary mb-2">O eco pode definir a conduta antes da CTPA no paciente instavel.</p>
          <Button variant="secondary" fullWidth size="sm" onClick={() => setEcoOpen(true)} className="mb-2">
            Registrar achados do eco
          </Button>
          {ecoConfirmed && (
            <div className="mt-2 p-2.5 bg-[#1A1A1A] rounded-lg" style={{ borderLeft: `3px solid ${ecoCount >= 3 ? '#F44336' : ecoCount >= 1 ? '#FFC107' : '#4CAF50'}` }}>
              <strong style={{ color: ecoCount >= 3 ? '#F44336' : ecoCount >= 1 ? '#FFC107' : '#4CAF50' }}>
                {ecoCount === 0 ? 'Eco sem sinais de disfuncao de VD' : ecoCount >= 3 ? 'Disfuncao grave de VD' : 'Disfuncao de VD presente'}
              </strong>
              {ecoCount > 0 && (
                <span className="text-xs text-text-secondary"> -- {ecoCount} achados</span>
              )}
            </div>
          )}
          <button onClick={() => scrollToRef('ref')} className="text-xs text-info underline bg-transparent border-none cursor-pointer mt-2">
            Ver referencia completa de eco
          </button>
        </div>

        {/* Eco modal */}
        {ecoOpen && (
          <div className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setEcoOpen(false) }}>
            <div className="bg-bg-elevated rounded-2xl max-w-[420px] w-full max-h-[85vh] overflow-y-auto p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-info">Achados ecocardiograficos</h3>
                <button onClick={() => setEcoOpen(false)} className="bg-transparent border-none text-text-muted text-2xl cursor-pointer">&times;</button>
              </div>
              <ChecklistCalc
                items={ECO_ITEMS}
                checked={ecoChecked}
                onToggle={(i) => {
                  const next = [...ecoChecked]
                  next[i] = !next[i]
                  setEcoChecked(next)
                }}
              />
              <div className="mt-3 p-2.5 rounded-lg bg-[#1A1A1A] text-xs text-text-secondary">
                {ecoCount === 0
                  ? 'Selecione os achados acima'
                  : <>
                      <strong style={{ color: ecoCount >= 3 ? '#F44336' : '#FFC107' }}>
                        {ecoCount >= 3 ? 'Disfuncao grave de VD' : 'Disfuncao de VD presente'}
                      </strong>{' '}
                      ({ecoCount} achados)
                    </>
                }
              </div>
              <Button fullWidth className="mt-3" onClick={() => { setEcoConfirmed(true); setEcoOpen(false) }}>
                Confirmar achados
              </Button>
            </div>
          </div>
        )}

        {/* Suporte hemodinamico */}
        <div className="bg-bg-hover rounded-lg p-3.5">
          <p className="text-xs font-semibold text-warning uppercase tracking-[1px] mb-2.5">Suporte hemodinamico</p>
          <div className="bg-bg-hover rounded p-2.5 mb-2 text-xs">
            <strong className="text-accent">Norepinefrina</strong> -- vasopressor de 1a escolha. Acima de 15 mcg/min, considere segundo agente.
            <br /><button onClick={() => navigate('/infusion?drug=noradrenalina')} className="text-info text-xs underline bg-transparent border-none cursor-pointer mt-1">Calculadora de Noradrenalina &rarr;</button>
          </div>
          <div className="bg-bg-hover rounded p-2.5 mb-2 text-xs">
            <strong className="text-accent">Volume com cautela</strong> -- VD sobrecarregado nao tolera expansao volemica excessiva. Considere 250 mL em bolus e reavalie.
          </div>
          <div className="bg-bg-hover rounded p-2.5 text-xs">
            <strong className="text-accent">Dobutamina</strong> -- considere se baixo debito persistente apesar de vasopressores (ate 10 mcg/kg/min).
            <br /><button onClick={() => navigate('/infusion?drug=dobutamina')} className="text-info text-xs underline bg-transparent border-none cursor-pointer mt-1">Calculadora de Dobutamina &rarr;</button>
          </div>
        </div>

        {/* Alerta IOT */}
        <AlertCard type="danger">
          <strong>Sedacao e IOT:</strong> Podem causar colapso hemodinamico catastrofico em disfuncao de VD. Sedativos reduzem mecanismos compensatorios (taquicardia, aumento de RVS). Evitar salvo indicacao forte. CNAF antes de IOT quando possivel. Equipe preparada com vasopressores.
          <div className="mt-2 flex gap-2 flex-wrap">
            <button onClick={() => navigate('/airway')} className="text-info text-xs underline bg-transparent border-none cursor-pointer">Airway Guide &rarr;</button>
            <button onClick={() => navigate('/seda')} className="text-info text-xs underline bg-transparent border-none cursor-pointer">Seda Path &rarr;</button>
          </div>
        </AlertCard>

        {/* Anticoagulacao empirica */}
        <div className="bg-bg-hover rounded-lg p-3.5">
          <p className="text-xs font-semibold text-accent uppercase tracking-[1px] mb-2.5">Anticoagulacao empirica</p>
          <p className="text-xs text-text-secondary mb-2">Se alta suspeita clinica + disfuncao de VD ao eco &rarr; considere anticoagulacao antes da confirmacao por CTPA.</p>
          <div className="bg-bg-hover rounded p-2.5 text-xs">
            <strong className="text-accent">HNF:</strong> Bolus 80 UI/kg IV + infusao 18 UI/kg/h. Preferida no instavel pela meia-vida curta e reversibilidade.
            <br /><button onClick={() => navigate('/infusion?drug=heparina')} className="text-info text-xs underline bg-transparent border-none cursor-pointer mt-1">Calculadora de Heparina &rarr;</button>
          </div>
          <button onClick={() => scrollToRef('ref')} className="text-xs text-info underline bg-transparent border-none cursor-pointer mt-2">
            Verificar contraindicacoes antes
          </button>
        </div>

        {/* Trombolise */}
        <div className="rounded-lg p-3.5 border-l-[3px]" style={{ background: 'rgba(198,40,40,0.08)', borderLeftColor: '#C62828' }}>
          <p className="text-xs font-semibold uppercase tracking-[1px] mb-2.5" style={{ color: '#C62828' }}>Trombolise sistemica</p>
          <p className="text-xs text-text-secondary mb-3">Em pacientes com hipotensao persistente ou choque e alta suspeita de TEP, trombolise sistemica pode ser considerada mesmo sem confirmacao por CTPA.</p>

          {tromboStage === 'question' && (
            <div>
              <p className="text-sm font-semibold mb-2">O paciente tem contraindicacao absoluta?</p>
              <p className="text-xs text-text-secondary mb-2">AVC hemorragico, cirurgia SNC &lt;3 semanas, sangramento ativo nao compressivel, lesao estrutural SNC</p>
              <div className="flex gap-2 mb-3">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setTromboStage('contraindicated')}>Sim -- Contraindicada</Button>
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setTromboStage('risk')}>Nao</Button>
              </div>
            </div>
          )}

          {tromboStage === 'contraindicated' && (
            <div>
              <AlertCard type="danger">
                <strong>Trombolise contraindicada.</strong> Considere alternativas: CDL (cateter-direcionada), trombectomia cirurgica, ou ECMO.
              </AlertCard>
              <button onClick={() => setTromboStage('question')} className="text-xs text-text-secondary bg-transparent border-none cursor-pointer">&larr; Reavaliar</button>
            </div>
          )}

          {tromboStage === 'risk' && (
            <div>
              <p className="text-sm font-semibold mb-2">Ha risco hemorragico elevado?</p>
              <p className="text-xs text-text-secondary mb-1">Idade &gt;75 anos, peso &lt;60 kg, cirurgia recente (&lt;10 dias), uso de anticoagulante, plaquetas &lt;100.000</p>
              <div className="flex gap-2 mb-3">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setTromboStage('doseHigh')}>Sim -- Risco alto</Button>
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setTromboStage('doseStandard')}>Nao -- Risco padrao</Button>
              </div>
            </div>
          )}

          {tromboStage === 'doseHigh' && (
            <div>
              <AlertCard type="warning"><strong>Dose reduzida recomendada</strong></AlertCard>
              <div className="bg-bg-hover rounded p-2.5 mb-2 text-xs">
                <strong className="text-accent">Alteplase 50 mg IV em 2h</strong><br />
                Considere em: peso &lt;60 kg, idade &gt;75 anos, risco hemorragico elevado.<br />
                Dados de MOPETT trial suportam eficacia com menor risco de sangramento.
              </div>
              <div className="bg-bg-hover rounded p-2.5 text-xs">
                <strong className="text-accent">Pos-trombolise:</strong> Suspender HNF durante infusao. Reiniciar sem bolus quando TTPa &lt;2x o controle.
              </div>
              <button onClick={() => setTromboStage('question')} className="text-xs text-text-secondary bg-transparent border-none cursor-pointer mt-2">&larr; Reavaliar</button>
            </div>
          )}

          {tromboStage === 'doseStandard' && (
            <div>
              <AlertCard type="success"><strong>Dose padrao</strong></AlertCard>
              <div className="bg-bg-hover rounded p-2.5 mb-2 text-xs">
                <strong className="text-accent">Alteplase 100 mg IV em 2h</strong><br />
                Regime padrao: 10 mg em bolus + 90 mg em 2h.<br />
                Se PCR: 50 mg em bolus (pode repetir em 15 min se necessario).
              </div>
              <div className="bg-bg-hover rounded p-2.5 text-xs">
                <strong className="text-accent">Pos-trombolise:</strong> Suspender HNF durante infusao. Reiniciar sem bolus quando TTPa &lt;2x o controle.
              </div>
              <button onClick={() => setTromboStage('question')} className="text-xs text-text-secondary bg-transparent border-none cursor-pointer mt-2">&larr; Reavaliar</button>
            </div>
          )}

          <button onClick={() => scrollToRef('ref')} className="text-xs text-info underline bg-transparent border-none cursor-pointer mt-2">
            Ver lista completa de contraindicacoes
          </button>
        </div>

        <AlertCard type="info">
          <strong>Confirmacao diagnostica:</strong> Considere CTPA quando estabilizado. Se indisponivel ou instabilidade refrataria, considere tratamento empirico baseado em eco + clinica.
        </AlertCard>

        <div className="h-px bg-white/[0.06] my-4" />
        <p className="text-[15px] font-semibold mb-3">Classificar gravidade:</p>
        <Button variant="secondary" fullWidth className="mb-2 text-left" onClick={() => classifyUnstable('E2')}>
          Choque refratario / PCR &rarr; Categoria E2
        </Button>
        <Button variant="secondary" fullWidth className="mb-2 text-left" onClick={() => classifyUnstable('E1')}>
          Hipotensao persistente &rarr; Categoria E1
        </Button>
        <Button variant="secondary" fullWidth className="mb-2 text-left" onClick={() => classifyUnstable('D')}>
          Hipotensao transitoria / sinais de hipoperfusao &rarr; Categoria D
        </Button>
        <button onClick={() => goToPanel('step1', 'right')} className="w-full text-center text-xs text-text-secondary bg-transparent border-none cursor-pointer mt-1 min-h-[44px]">&larr; Voltar</button>
      </div>
    )
  }

  // --- STEP 2: Investigacao diagnostica ---
  function renderStep2() {
    const inlineDdimerThreshold = calcDdimerThreshold(inlineDdimerAge)
    const inlineDdimerVal = parseFloat(inlineDdimerValue)
    const inlineYearsCount = inlineYearsChecked.filter(Boolean).length
    const inlineYearsThreshold = inlineYearsCount >= 1 ? 500 : 1000
    const inlineYearsVal = parseFloat(inlineYearsDD)
    const inlineYearsPregCount = inlineYearsPregChecked.filter(Boolean).length
    const inlineYearsPregThreshold = inlineYearsPregCount >= 1 ? 500 : 1000
    const inlineYearsPregVal = parseFloat(inlineYearsPregDD)

    return (
      <div className="bg-bg-card rounded-xl p-6 animate-slide-left space-y-3">
        <div className="text-[11px] font-semibold text-accent uppercase tracking-[1px] mb-2">Passo 2 de 4</div>
        <h2 className="text-lg font-semibold mb-3">Investigacao diagnostica</h2>

        <AlertCard type="warning">
          <strong>Paciente ja anticoagulado?</strong> D-dimero e algoritmo YEARS nao foram validados em pacientes em anticoagulacao terapeutica. Considere imagem direto se suspeita clinica relevante.
        </AlertCard>

        {/* Toggle gestante */}
        <Toggle
          options={[
            { value: 'not_pregnant', label: 'Nao gestante (Wells)' },
            { value: 'pregnant', label: 'Gestante (YEARS)' },
          ]}
          value={isPregnant ? 'pregnant' : 'not_pregnant'}
          onChange={(v) => {
            setIsPregnant(v === 'pregnant')
            setWellsLevel(null)
            setPercResult(null)
            setDdimerResult(null)
            setYearsPregResult(null)
          }}
          className="mb-4"
        />

        {/* Nao gestante: Wells pathway */}
        {!isPregnant && (
          <>
            <p className="text-[15px] font-semibold mb-3">Probabilidade pre-teste (Wells)</p>
            <div className="flex gap-2 mb-2 flex-wrap">
              <Button variant="secondary" size="sm" className="flex-1 min-w-[80px] text-center" onClick={() => { setWellsLevel('low'); setPercResult(null); setDdimerResult(null) }}>Baixa (&lt;2)</Button>
              <Button variant="secondary" size="sm" className="flex-1 min-w-[80px] text-center" onClick={() => { setWellsLevel('moderate'); setPercResult(null); setDdimerResult(null) }}>Intermediaria (2-6)</Button>
              <Button variant="secondary" size="sm" className="flex-1 min-w-[80px] text-center" onClick={() => { setWellsLevel('high'); setPercResult(null); setDdimerResult(null) }}>Alta (&gt;6)</Button>
            </div>

            <Collapsible title="Calcular Wells">
              <ChecklistCalc
                items={WELLS_ITEMS.map(w => w.label)}
                checked={inlineWellsChecked}
                onToggle={(i) => {
                  const next = [...inlineWellsChecked]; next[i] = !next[i]; setInlineWellsChecked(next)
                  // Auto-set level based on score
                  const score = next.reduce((s, c, idx) => s + (c ? WELLS_ITEMS[idx].pts : 0), 0)
                  if (score < 2) setWellsLevel('low')
                  else if (score <= 6) setWellsLevel('moderate')
                  else setWellsLevel('high')
                  setPercResult(null); setDdimerResult(null)
                }}
                showPoints
                pointsData={WELLS_ITEMS.map(w => w.pts)}
              />
              <CalcResult
                score={inlineWellsScore}
                text={inlineWellsScore < 2 ? 'Baixa probabilidade' : inlineWellsScore <= 6 ? 'Probabilidade intermediaria' : 'Alta probabilidade -- imagem recomendada'}
                color={inlineWellsScore < 2 ? 'green' : inlineWellsScore <= 6 ? 'yellow' : 'red'}
              />
            </Collapsible>

            {/* Wells LOW -> PERC + D-dimer */}
            {wellsLevel === 'low' && (
              <div className="mt-4">
                <AlertCard type="success"><strong>Wells &lt;2 -- Baixa probabilidade.</strong></AlertCard>
                <p className="text-sm font-semibold mt-3 mb-2">PERC (se gestalt &lt;15%):</p>
                <div className="flex gap-2 mb-2">
                  <Button variant="secondary" size="sm" className="flex-1 text-center" onClick={() => setPercResult('neg')}>PERC negativo</Button>
                  <Button variant="secondary" size="sm" className="flex-1 text-center" onClick={() => setPercResult('pos')}>PERC positivo</Button>
                </div>
                <Collapsible title="Calcular PERC">
                  <p className="text-xs text-text-secondary mb-2">Todos os 8 criterios devem ser negativos + gestalt &lt;15% para considerar TEP improvavel.</p>
                  <ChecklistCalc
                    items={PERC_ITEMS}
                    checked={inlinePercChecked}
                    onToggle={(i) => {
                      const next = [...inlinePercChecked]; next[i] = !next[i]; setInlinePercChecked(next)
                      setPercResult(next.filter(Boolean).length === 0 ? 'neg' : 'pos')
                    }}
                  />
                  <CalcResult
                    score={`${inlinePercCount} / 8`}
                    text={inlinePercCount === 0 ? 'PERC negativo' : 'PERC positivo -- prossiga com D-dimero.'}
                    color={inlinePercCount === 0 ? 'green' : 'yellow'}
                  />
                </Collapsible>
                {percResult === 'neg' && (
                  <CalcResult text="TEP improvavel -- considere diagnosticos alternativos. Documente: PERC negativo + gestalt <15%." color="green" />
                )}
                {percResult === 'pos' && (
                  <AlertCard type="warning" className="mt-2">PERC positivo -- prossiga com D-dimero abaixo.</AlertCard>
                )}
              </div>
            )}

            {/* Wells MODERATE */}
            {wellsLevel === 'moderate' && (
              <div className="mt-4">
                <AlertCard type="warning"><strong>Wells 2-6 -- Probabilidade intermediaria.</strong></AlertCard>
              </div>
            )}

            {/* D-dimero (low+perc_pos or moderate) */}
            {((wellsLevel === 'low' && percResult === 'pos') || wellsLevel === 'moderate') && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Resultado do D-dimero:</p>
                <div className="flex gap-2 mb-2">
                  <Button variant="secondary" size="sm" className="flex-1 text-center" onClick={() => setDdimerResult('neg')}>Negativo (abaixo do threshold)</Button>
                  <Button variant="secondary" size="sm" className="flex-1 text-center" onClick={() => setDdimerResult('pos')}>Positivo (acima do threshold)</Button>
                </div>

                <Collapsible title="Calcular D-dimero ajustado por idade">
                  <p className="text-xs text-text-secondary mb-2">Threshold = idade x 10 ug/L (FEU). Abaixo de 50 anos: usar 500 ug/L.</p>
                  <div className="flex gap-3 mb-2">
                    <div className="flex-1">
                      <label className="block text-xs text-text-secondary mb-1.5">Idade (anos)</label>
                      <input type="number" inputMode="decimal" className="w-full p-3 bg-[#2D2D2D] border border-[#333] rounded-lg text-text-primary text-base" value={inlineDdimerAge} onChange={e => setInlineDdimerAge(parseInt(e.target.value) || 50)} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-text-secondary mb-1.5">D-dimero (ug/L FEU)</label>
                      <input type="number" inputMode="decimal" className="w-full p-3 bg-[#2D2D2D] border border-[#333] rounded-lg text-text-primary text-base" placeholder="Ex: 750" value={inlineDdimerValue} onChange={e => {
                        setInlineDdimerValue(e.target.value)
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val)) {
                          setDdimerResult(val < calcDdimerThreshold(inlineDdimerAge) ? 'neg' : 'pos')
                        }
                      }} />
                    </div>
                  </div>
                  {!inlineDdimerValue ? (
                    <CalcResult text={`Threshold: ${inlineDdimerThreshold} ug/L (idade ${inlineDdimerAge})`} color="neutral" />
                  ) : !isNaN(inlineDdimerVal) && inlineDdimerVal < inlineDdimerThreshold ? (
                    <CalcResult score={`${inlineDdimerVal} < ${inlineDdimerThreshold}`} text="D-dimero negativo -- TEP improvavel" color="green" />
                  ) : (
                    <CalcResult score={`${inlineDdimerVal} >= ${inlineDdimerThreshold}`} text="D-dimero positivo -- imagem recomendada" color="red" />
                  )}
                </Collapsible>

                <Collapsible title="Calcular YEARS">
                  <p className="text-xs text-text-secondary mb-2">{'>='}1 criterio YEARS: threshold 500 ug/L. Nenhum criterio: threshold 1000 ug/L.</p>
                  <ChecklistCalc
                    items={YEARS_ITEMS}
                    checked={inlineYearsChecked}
                    onToggle={(i) => { const next = [...inlineYearsChecked]; next[i] = !next[i]; setInlineYearsChecked(next) }}
                  />
                  <div className="mt-2">
                    <label className="block text-xs text-text-secondary mb-1.5">D-dimero (ug/L FEU)</label>
                    <input type="number" inputMode="decimal" className="w-full p-3 bg-[#2D2D2D] border border-[#333] rounded-lg text-text-primary text-base" placeholder="Ex: 750" value={inlineYearsDD} onChange={e => {
                      setInlineYearsDD(e.target.value)
                      const val = parseFloat(e.target.value)
                      const cnt = inlineYearsChecked.filter(Boolean).length
                      const thr = cnt >= 1 ? 500 : 1000
                      if (!isNaN(val)) setDdimerResult(val < thr ? 'neg' : 'pos')
                    }} />
                  </div>
                  {!inlineYearsDD ? (
                    <CalcResult text={`Criterios YEARS: ${inlineYearsCount}/3. Threshold: ${inlineYearsThreshold} ug/L`} color="neutral" />
                  ) : !isNaN(inlineYearsVal) && inlineYearsVal < inlineYearsThreshold ? (
                    <CalcResult score={`${inlineYearsVal} < ${inlineYearsThreshold}`} text="YEARS negativo -- TEP improvavel" color="green" />
                  ) : (
                    <CalcResult score={`${inlineYearsVal} >= ${inlineYearsThreshold}`} text="YEARS positivo -- imagem recomendada" color="red" />
                  )}
                </Collapsible>

                {ddimerResult === 'neg' && (
                  <CalcResult text="D-dimero negativo -- TEP improvavel. Considere diagnosticos alternativos. Se gestalt clinica elevada, considere imagem direta." color="green" />
                )}
                {ddimerResult === 'pos' && (
                  <AlertCard type="info" className="mt-2"><strong>D-dimero positivo -- imagem recomendada.</strong> CTPA (preferida) ou V/Q se contraindicacao a contraste.</AlertCard>
                )}

                <AlertCard type="warning" className="mt-2">
                  <strong>Imagem indisponivel ou com atraso significativo?</strong> Considere anticoagulacao empirica se alta suspeita clinica e baixo risco de sangramento. <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-info/20 text-info">COR 2a</span>
                </AlertCard>
              </div>
            )}

            {/* Wells HIGH */}
            {wellsLevel === 'high' && (
              <div className="mt-4">
                <AlertCard type="danger"><strong>Wells &gt;6 -- Alta probabilidade.</strong> Imagem recomendada sem necessidade de D-dimero.</AlertCard>
                <AlertCard type="info">CTPA (preferida) ou V/Q se contraindicacao a contraste iodado.</AlertCard>
                <AlertCard type="warning">
                  <strong>Imagem indisponivel ou com atraso significativo?</strong> Considere anticoagulacao empirica se baixo risco de sangramento. <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-info/20 text-info">COR 2a</span>
                </AlertCard>
              </div>
            )}
          </>
        )}

        {/* Gestante: YEARS */}
        {isPregnant && (
          <div className="mt-4">
            <AlertCard type="info"><strong>Gestante:</strong> Utilize YEARS adaptado para gestacao (COR 2b). USG de MMII se sintomas -- se positivo, considere tratar sem CTPA.</AlertCard>
            <p className="text-sm font-semibold mt-3 mb-2">Resultado YEARS gestante:</p>
            <div className="flex gap-2 mb-2">
              <Button variant="secondary" size="sm" className="flex-1 text-center" onClick={() => setYearsPregResult('neg')}>TEP improvavel</Button>
              <Button variant="secondary" size="sm" className="flex-1 text-center" onClick={() => setYearsPregResult('pos')}>Imagem necessaria</Button>
            </div>
            <Collapsible title="Calcular YEARS gestantes">
              <p className="text-xs text-text-secondary mb-2">{'>='}1 criterio: threshold 500 ug/L. Nenhum: threshold 1000 ug/L.</p>
              <ChecklistCalc
                items={YEARS_ITEMS}
                checked={inlineYearsPregChecked}
                onToggle={(i) => { const next = [...inlineYearsPregChecked]; next[i] = !next[i]; setInlineYearsPregChecked(next) }}
              />
              <div className="mt-2">
                <label className="block text-xs text-text-secondary mb-1.5">D-dimero (ug/L FEU)</label>
                <input type="number" inputMode="decimal" className="w-full p-3 bg-[#2D2D2D] border border-[#333] rounded-lg text-text-primary text-base" placeholder="Ex: 750" value={inlineYearsPregDD} onChange={e => {
                  setInlineYearsPregDD(e.target.value)
                  const val = parseFloat(e.target.value)
                  const cnt = inlineYearsPregChecked.filter(Boolean).length
                  const thr = cnt >= 1 ? 500 : 1000
                  if (!isNaN(val)) setYearsPregResult(val < thr ? 'neg' : 'pos')
                }} />
              </div>
              {!inlineYearsPregDD ? (
                <CalcResult text={`Criterios: ${inlineYearsPregCount}/3. Threshold: ${inlineYearsPregThreshold} ug/L`} color="neutral" />
              ) : !isNaN(inlineYearsPregVal) && inlineYearsPregVal < inlineYearsPregThreshold ? (
                <CalcResult score={`${inlineYearsPregVal} < ${inlineYearsPregThreshold}`} text="TEP improvavel" color="green" />
              ) : (
                <CalcResult score={`${inlineYearsPregVal} >= ${inlineYearsPregThreshold}`} text="Imagem necessaria" color="red" />
              )}
              <div className="mt-2 p-2.5 rounded-r bg-info/[0.06] border-l-[3px] border-l-info text-xs text-[#82B1FF] leading-relaxed">
                Se sintomas em MMII + USG compressao positiva &rarr; pode tratar com anticoagulacao sem necessidade de CTPA.
              </div>
            </Collapsible>
            {yearsPregResult === 'neg' && (
              <CalcResult text="YEARS gestante negativo -- TEP improvavel. Considere diagnosticos alternativos." color="green" />
            )}
            {yearsPregResult === 'pos' && (
              <AlertCard type="info" className="mt-2"><strong>Imagem necessaria.</strong> CTPA ou V/Q. Se sintomas em MMII, considere USG antes.</AlertCard>
            )}
          </div>
        )}

        <div className="h-px bg-white/[0.06] my-4" />
        <Button fullWidth onClick={() => goToPanel('step3')}>TEP confirmado &rarr; Classificar</Button>
        <button onClick={() => goToPanel('step1', 'right')} className="w-full text-center text-xs text-text-secondary bg-transparent border-none cursor-pointer mt-1 min-h-[44px]">&larr; Voltar</button>
      </div>
    )
  }

  // --- STEP 3: Classificacao AHA/ACC ---
  function renderStep3() {
    return (
      <div className="bg-bg-card rounded-xl p-6 animate-slide-left space-y-3">
        <div className="text-[11px] font-semibold text-accent uppercase tracking-[1px] mb-2">Passo 3 de 4</div>
        <h2 className="text-lg font-semibold mb-3">Classificacao AHA/ACC</h2>
        <p className="text-sm text-text-secondary mb-4">Responda as perguntas para determinar a categoria clinica.</p>

        {/* Q1: Sintomatico? */}
        {classPanel === 'classQ1' && (
          <div>
            <p className="text-[15px] font-semibold mb-3">O paciente e sintomatico?</p>
            <Button variant="secondary" fullWidth className="mb-2 text-left" onClick={() => classAnswer('asymptomatic')}>Nao -- TEP incidental / assintomatico</Button>
            <Button variant="secondary" fullWidth className="text-left" onClick={() => classAnswer('symptomatic')}>Sim -- dispneia, dor toracica, sincope, hemoptise, etc.</Button>
          </div>
        )}

        {/* Q2: sPESI */}
        {classPanel === 'classQ2' && (
          <div>
            <p className="text-[15px] font-semibold mb-3">sPESI -- estratificacao de risco</p>
            <div className="flex gap-2 mb-2">
              <Button variant="secondary" size="sm" className="flex-1 text-center" onClick={() => classAnswer('lowRisk')}>sPESI = 0 (baixo risco)</Button>
              <Button variant="secondary" size="sm" className="flex-1 text-center" onClick={() => classAnswer('highRisk')}>sPESI {'>='}1 (risco elevado)</Button>
            </div>
            <Collapsible title="Calcular sPESI">
              <ChecklistCalc
                items={SPESI_ITEMS}
                checked={inlineSpesiChecked}
                onToggle={(i) => { const next = [...inlineSpesiChecked]; next[i] = !next[i]; setInlineSpesiChecked(next) }}
              />
              <CalcResult
                score={inlineSpesiCount}
                text={inlineSpesiCount === 0 ? 'Baixo risco -- Categoria B' : `Risco elevado (>= 1) -- Categoria C ou superior`}
                color={inlineSpesiCount === 0 ? 'green' : 'red'}
              />
              <div className="text-center mt-2">
                <Button size="sm" onClick={() => classAnswer(inlineSpesiCount === 0 ? 'lowRisk' : 'highRisk')}>
                  Prosseguir como {inlineSpesiCount === 0 ? 'Categoria B' : 'Categoria C+'} &rarr;
                </Button>
              </div>
            </Collapsible>
            <Collapsible title="Alternativa: PESI completo">
              <p className="text-xs text-text-secondary mb-2">Score original com 11 variaveis. Classe I-II = baixo risco. Classe III+ = risco elevado.</p>
              <div className="mb-2">
                <label className="block text-xs text-text-secondary mb-1.5">Idade (anos) -- somada ao score</label>
                <input type="number" inputMode="decimal" className="w-full p-3 bg-[#2D2D2D] border border-[#333] rounded-lg text-text-primary text-base" value={inlinePesiAge} onChange={e => setInlinePesiAge(parseInt(e.target.value) || 65)} />
              </div>
              <ChecklistCalc
                items={PESI_ITEMS.map(p => p.label)}
                checked={inlinePesiChecked}
                onToggle={(i) => { const next = [...inlinePesiChecked]; next[i] = !next[i]; setInlinePesiChecked(next) }}
                showPoints
                pointsData={PESI_ITEMS.map(p => p.pts)}
              />
              {(() => {
                const c = classifyPesi(inlinePesiScore)
                return (
                  <>
                    <CalcResult score={inlinePesiScore} text={`Classe ${c.cls} -- ${c.risk}`} color={c.color} />
                    <div className="text-center mt-2">
                      <Button size="sm" onClick={() => classAnswer(inlinePesiScore <= 85 ? 'lowRisk' : 'highRisk')}>
                        Prosseguir como {inlinePesiScore <= 85 ? 'Categoria B (baixo risco)' : 'Categoria C+ (risco elevado)'} &rarr;
                      </Button>
                    </div>
                  </>
                )
              })()}
            </Collapsible>
          </div>
        )}

        {/* Q2h: Hestia */}
        {classPanel === 'classQ2h' && (
          <div>
            <p className="text-[15px] font-semibold mb-3">Hestia -- elegibilidade para tratamento ambulatorial</p>
            <div className="flex gap-2 mb-2">
              <Button variant="secondary" size="sm" className="flex-1 text-center" onClick={() => { setClassState(s => ({ ...s, hestia: 'neg' })); setClassPanel('classQ2b') }}>Hestia negativo (ambulatorial)</Button>
              <Button variant="secondary" size="sm" className="flex-1 text-center" onClick={() => { setClassState(s => ({ ...s, hestia: 'pos' })); setClassPanel('classQ2b') }}>Hestia positivo (internacao)</Button>
            </div>
            <Collapsible title="Calcular Hestia">
              <p className="text-xs text-text-secondary mb-2">Todos negativos &rarr; ambulatorial. {'>='}1 positivo &rarr; internacao.</p>
              <ChecklistCalc
                items={HESTIA_ITEMS}
                checked={inlineHestiaChecked}
                onToggle={(i) => { const next = [...inlineHestiaChecked]; next[i] = !next[i]; setInlineHestiaChecked(next) }}
              />
              <CalcResult
                score={inlineHestiaCount}
                text={inlineHestiaCount === 0 ? 'Hestia negativo -- ambulatorial' : 'Hestia positivo -- internacao'}
                color={inlineHestiaCount === 0 ? 'green' : 'red'}
              />
              <Button fullWidth className="mt-3" onClick={() => {
                setClassState(s => ({ ...s, hestia: inlineHestiaCount === 0 ? 'neg' : 'pos' }))
                setClassPanel('classQ2b')
              }}>
                Prosseguir -- localizacao do trombo &rarr;
              </Button>
            </Collapsible>
          </div>
        )}

        {/* Q2b: Localizacao */}
        {classPanel === 'classQ2b' && (
          <div>
            <p className="text-[15px] font-semibold mb-3">Localizacao do trombo:</p>
            <Button variant="secondary" fullWidth className="mb-2 text-left" onClick={() => classAnswer('subseg')}>Subsegmentar isolado</Button>
            <Button variant="secondary" fullWidth className="text-left" onClick={() => classAnswer('segPlus')}>Segmentar ou mais proximal</Button>
          </div>
        )}

        {/* Q3: Biomarcadores */}
        {classPanel === 'classQ3' && (
          <div>
            <p className="text-[15px] font-semibold mb-3">Biomarcadores e disfuncao de VD:</p>
            <div className="bg-bg-hover rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-[1px] mb-2">Criterios de disfuncao de VD (eco ou TC)</p>
              <p className="text-xs text-text-secondary mb-1">VD/VE &gt;0,9 (apical 4C) | TAPSE &lt;16 mm | McConnell | D-sign</p>
              <p className="text-xs text-text-secondary opacity-70">Combinacao TAPSE &lt;16 + VD/VE &gt;1 tem melhor desempenho (HR 6,5; VPN 95,6%)</p>
            </div>
            <Button variant="secondary" fullWidth className="mb-2 text-left" onClick={() => classAnswer('c1')}>Nenhum -- troponina/BNP normais, sem disfuncao de VD</Button>
            <Button variant="secondary" fullWidth className="mb-2 text-left" onClick={() => classAnswer('c2')}>Um positivo -- troponina/BNP elevados OU disfuncao de VD</Button>
            <Button variant="secondary" fullWidth className="text-left" onClick={() => classAnswer('c3')}>Ambos -- troponina/BNP elevados E disfuncao de VD</Button>
          </div>
        )}

        {/* Q3b: Pre-falencia */}
        {classPanel === 'classQ3b' && (
          <div>
            <p className="text-[15px] font-semibold mb-3">Avaliacao hemodinamica detalhada:</p>
            <Button variant="secondary" fullWidth className="mb-2 text-left" onClick={() => classAnswer('d1')}>Hipotensao transitoria/recorrente SEM sinais de hipoperfusao</Button>
            <Button variant="secondary" fullWidth className="mb-2 text-left" onClick={() => classAnswer('d2')}>Hipoperfusao ou disfuncao organica (lactato elevado, oliguria, alteracao consciencia)</Button>
            <Button variant="secondary" fullWidth className="text-left" onClick={() => { setCategoryResult('C3'); setClassPanel('classQ4') }}>Sem sinais de pre-falencia &rarr; manter C3</Button>
            <p className="text-xs text-text-secondary mt-2">Nota: se hipotensao persistente &rarr; voltar e classificar como instavel.</p>
          </div>
        )}

        {/* Q4: Modificador R */}
        {classPanel === 'classQ4' && (
          <div>
            <p className="text-[15px] font-semibold mb-3">Modificador respiratorio (R):</p>
            <Button variant="secondary" fullWidth className="mb-2 text-left" onClick={() => classAnswer('noR')}>Sem hipoxemia, taquipneia ou necessidade de O2</Button>
            <Button variant="secondary" fullWidth className="text-left" onClick={() => classAnswer('yesR')}>Com hipoxemia, taquipneia ou necessidade de O2 suplementar</Button>
          </div>
        )}

        <button onClick={() => { resetClassification(); goToPanel('step2', 'right') }} className="w-full text-center text-xs text-text-secondary bg-transparent border-none cursor-pointer mt-4 min-h-[44px]">&larr; Voltar ao diagnostico</button>
      </div>
    )
  }

  // --- STEP 4: Manejo e disposicao ---
  function renderStep4() {
    if (!categoryResult) return null
    const mgmt = getManagement(categoryResult)
    const catLabel = categoryResult + (hasModR ? 'R' : '')
    const catColor = getCatColor(categoryResult)
    const showRedFlags = ['C2', 'C3', 'D', 'D1', 'D2', 'E1', 'E2'].includes(categoryResult)

    return (
      <div className="bg-bg-card rounded-xl p-6 animate-slide-left space-y-3">
        <div className="text-[11px] font-semibold text-accent uppercase tracking-[1px] mb-2">Passo 4 de 4</div>
        <h2 className="text-lg font-semibold mb-3">Manejo por categoria</h2>

        {/* Category card */}
        <div className="rounded-lg p-4 mb-3 border-l-4" style={{ borderLeftColor: catColor.border, background: catColor.bg }}>
          <div className="text-xs font-bold uppercase tracking-[1px] mb-1.5" style={{ color: catColor.text }}>Categoria {catLabel}</div>
          <div className="text-xs text-text-secondary leading-relaxed mb-2.5">{mgmt.description}</div>
          <div className="text-xs text-text-primary leading-relaxed">
            {mgmt.actions.map((a, i) => <div key={i}>&bull; {a}</div>)}
          </div>
        </div>

        {/* Subsegmental alert */}
        {(categoryResult === 'A1' || categoryResult === 'B1') && (
          <AlertCard type="warning">
            <strong>TEP subsegmentar isolado</strong> -- a decisao de anticoagular pode considerar presenca de TVP concomitante, risco de recorrencia e contexto clinico. Considere discussao com equipe assistente.
          </AlertCard>
        )}

        {/* Red flags */}
        {showRedFlags && (
          <div className="rounded-lg p-4 border border-danger/30 bg-danger/[0.06]">
            <h4 className="text-xs font-bold text-danger uppercase tracking-[1px] mb-2">Red flags de deterioracao</h4>
            <ul className="list-none p-0 space-y-0.5">
              {[
                'Queda de PAS <90 mmHg ou MAP <80 mmHg',
                'Taquicardia progressiva refrataria',
                'Dessaturacao / necessidade crescente de O2',
                'Alteracao do nivel de consciencia',
                'Lactato em elevacao',
                'Sinais de hipoperfusao (extremidades frias, TEC alargado, oliguria)',
              ].map((flag, i) => (
                <li key={i} className="text-xs text-[#FF8A80] py-0.5 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[8px] before:w-1.5 before:h-1.5 before:bg-accent before:rounded-full">{flag}</li>
              ))}
            </ul>
            <div className="text-xs text-danger font-semibold mt-2.5">&rarr; Presenca de qualquer sinal: reclassifique e considere escalar terapia.</div>
          </div>
        )}

        {/* Disposition card */}
        <div className="rounded-xl p-6 border-2 bg-black/50" style={{ borderColor: catColor.border }}>
          <h3 className="text-base font-bold uppercase tracking-[1px] mb-3" style={{ color: catColor.text }}>Categoria {catLabel}</h3>
          {[
            { label: 'Destino', value: mgmt.destino },
            { label: 'Anticoagulacao', value: mgmt.anticoag },
            { label: 'Monitorizacao', value: mgmt.monitor },
            { label: 'Terapia avancada', value: mgmt.advanced },
            ...(mgmt.followup ? [{ label: 'Seguimento', value: mgmt.followup }] : []),
          ].map((row, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-white/[0.06] last:border-b-0 text-sm">
              <span className="text-text-secondary font-medium">{row.label}</span>
              <span className="font-semibold text-right max-w-[60%]">{row.value}</span>
            </div>
          ))}
        </div>

        <Button variant="secondary" fullWidth size="sm" onClick={() => scrollToRef('ref')} className="mt-4 text-center">
          Ver esquemas de anticoagulacao
        </Button>
        <Button variant="secondary" fullWidth size="sm" onClick={() => scrollToRef('ref')} className="text-center">
          Ver contraindicacoes
        </Button>
        <button onClick={() => { resetClassification(); resetStep2(); goToPanel('step1', 'right') }} className="w-full text-center text-xs text-text-secondary bg-transparent border-none cursor-pointer mt-4 min-h-[44px]">&#8634; Reiniciar pathway</button>
      </div>
    )
  }

  // ==========================================
  // RENDER: CALCULADORAS STANDALONE
  // ==========================================

  function renderCalc() {
    return (
      <div>
        <button onClick={() => showView('home')} className="flex items-center gap-1.5 bg-transparent border border-bg-hover text-text-secondary text-xs px-4 py-2 rounded-lg cursor-pointer mb-4 hover:border-accent hover:text-text-primary transition-colors min-h-[44px]">
          &larr; Menu
        </button>
        <div className="text-[11px] font-semibold text-accent uppercase tracking-[2px] mb-4 pl-0.5">Calculadoras</div>

        {/* PERC */}
        <Collapsible title="PERC (PE Rule-Out Criteria)">
          <p className="text-xs text-text-secondary mb-2">Aplicavel apenas se gestalt &lt;15%. Todos criterios devem ser negativos para considerar TEP improvavel.</p>
          <ChecklistCalc items={PERC_ITEMS} checked={calcPercChecked} onToggle={(i) => { const n = [...calcPercChecked]; n[i] = !n[i]; setCalcPercChecked(n) }} />
          <CalcResult
            score={`${calcPercCount} / 8`}
            text={calcPercCount === 0 ? 'PERC negativo -- se gestalt <15%, TEP pode ser considerado improvavel' : 'PERC positivo -- nao descarta TEP. Prossiga com D-dimero.'}
            color={calcPercCount === 0 ? 'green' : 'yellow'}
          />
        </Collapsible>

        {/* Wells */}
        <Collapsible title="Wells Score para TEP">
          <ChecklistCalc items={WELLS_ITEMS.map(w => w.label)} checked={calcWellsChecked} onToggle={(i) => { const n = [...calcWellsChecked]; n[i] = !n[i]; setCalcWellsChecked(n) }} showPoints pointsData={WELLS_ITEMS.map(w => w.pts)} />
          <CalcResult
            score={calcWellsScore}
            text={calcWellsScore < 2 ? 'Baixa probabilidade (<2)' : calcWellsScore <= 6 ? 'Probabilidade intermediaria (2-6)' : 'Alta probabilidade (>6) -- imagem recomendada'}
            color={calcWellsScore < 2 ? 'green' : calcWellsScore <= 6 ? 'yellow' : 'red'}
          />
          <div className="text-xs text-text-secondary/70 text-center mt-1.5">Wells modificado: {calcWellsScore > 4 ? 'TEP provavel (>4)' : 'TEP improvavel (<=4)'}</div>
        </Collapsible>

        {/* D-dimero ajustado */}
        <Collapsible title="D-dimero ajustado por idade">
          <p className="text-xs text-text-secondary mb-2">Threshold = idade x 10 ug/L (FEU). Aplicavel para idade {'>='}50 anos; abaixo, usar 500 ug/L.</p>
          <div className="flex gap-3 mb-2">
            <div className="flex-1">
              <label className="block text-xs text-text-secondary mb-1.5">Idade (anos)</label>
              <input type="number" inputMode="decimal" className="w-full p-3 bg-[#2D2D2D] border border-[#333] rounded-lg text-text-primary text-base" value={calcDdimerAge} onChange={e => setCalcDdimerAge(parseInt(e.target.value) || 50)} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-secondary mb-1.5">D-dimero (ug/L FEU)</label>
              <input type="number" inputMode="decimal" className="w-full p-3 bg-[#2D2D2D] border border-[#333] rounded-lg text-text-primary text-base" placeholder="Ex: 750" value={calcDdimerValue} onChange={e => setCalcDdimerValue(e.target.value)} />
            </div>
          </div>
          {(() => {
            const threshold = calcDdimerThreshold(calcDdimerAge)
            const val = parseFloat(calcDdimerValue)
            if (!calcDdimerValue) return <CalcResult text={`Threshold ajustado: ${threshold} ug/L (idade ${calcDdimerAge})`} color="neutral" />
            if (!isNaN(val) && val < threshold) return <CalcResult score={`${val} < ${threshold} ug/L`} text="D-dimero negativo -- TEP improvavel" color="green" />
            return <CalcResult score={`${val} >= ${threshold} ug/L`} text="D-dimero positivo -- imagem recomendada" color="red" />
          })()}
        </Collapsible>

        {/* YEARS */}
        <Collapsible title="Algoritmo YEARS">
          <p className="text-xs text-text-secondary mb-2">Se {'>='}1 criterio YEARS: threshold D-dimero = 500 ug/L. Se nenhum: threshold = 1000 ug/L.</p>
          <ChecklistCalc items={YEARS_ITEMS} checked={calcYearsChecked} onToggle={(i) => { const n = [...calcYearsChecked]; n[i] = !n[i]; setCalcYearsChecked(n) }} />
          <div className="mt-2">
            <label className="block text-xs text-text-secondary mb-1.5">D-dimero (ug/L FEU)</label>
            <input type="number" inputMode="decimal" className="w-full p-3 bg-[#2D2D2D] border border-[#333] rounded-lg text-text-primary text-base" placeholder="Ex: 750" value={calcYearsDD} onChange={e => setCalcYearsDD(e.target.value)} />
          </div>
          {(() => {
            const cnt = calcYearsChecked.filter(Boolean).length
            const thr = cnt >= 1 ? 500 : 1000
            const val = parseFloat(calcYearsDD)
            if (!calcYearsDD) return <CalcResult text={`Criterios YEARS: ${cnt}/3. Threshold: ${thr} ug/L`} color="neutral" />
            if (!isNaN(val) && val < thr) return <CalcResult score={`${val} < ${thr} ug/L`} text="YEARS negativo -- TEP improvavel" color="green" />
            return <CalcResult score={`${val} >= ${thr} ug/L`} text="YEARS positivo -- imagem recomendada" color="red" />
          })()}
        </Collapsible>

        {/* YEARS gestantes */}
        <Collapsible title="YEARS adaptado para gestantes">
          <p className="text-xs text-text-secondary mb-2">Adaptacao para gestacao (COR 2b). D-dimero threshold de 1000 ug/L se sem criterios YEARS.</p>
          <ChecklistCalc items={YEARS_ITEMS} checked={calcYearsPregChecked} onToggle={(i) => { const n = [...calcYearsPregChecked]; n[i] = !n[i]; setCalcYearsPregChecked(n) }} />
          <div className="mt-2">
            <label className="block text-xs text-text-secondary mb-1.5">D-dimero (ug/L FEU)</label>
            <input type="number" inputMode="decimal" className="w-full p-3 bg-[#2D2D2D] border border-[#333] rounded-lg text-text-primary text-base" placeholder="Ex: 750" value={calcYearsPregDD} onChange={e => setCalcYearsPregDD(e.target.value)} />
          </div>
          {(() => {
            const cnt = calcYearsPregChecked.filter(Boolean).length
            const thr = cnt >= 1 ? 500 : 1000
            const val = parseFloat(calcYearsPregDD)
            if (!calcYearsPregDD) return <CalcResult text={`Criterios: ${cnt}/3. Threshold gestante: ${thr} ug/L`} color="neutral" />
            if (!isNaN(val) && val < thr) return <CalcResult score={`${val} < ${thr}`} text="YEARS gestante negativo -- TEP improvavel" color="green" />
            return <CalcResult score={`${val} >= ${thr}`} text="YEARS gestante positivo -- imagem necessaria" color="red" />
          })()}
          <div className="mt-2 p-2.5 rounded-r bg-info/[0.06] border-l-[3px] border-l-info text-xs text-[#82B1FF] leading-relaxed">
            Se sintomas em MMII + USG compressao positiva &rarr; pode tratar com anticoagulacao sem necessidade de CTPA. Essa abordagem evita 65% das CTPAs no 1o trimestre.
          </div>
        </Collapsible>

        {/* sPESI */}
        <Collapsible title="sPESI (simplified PESI)">
          <p className="text-xs text-text-secondary mb-2">0 = baixo risco (Categoria B). {'>='}1 = risco elevado (Categoria C+).</p>
          <ChecklistCalc items={SPESI_ITEMS} checked={calcSpesiChecked} onToggle={(i) => { const n = [...calcSpesiChecked]; n[i] = !n[i]; setCalcSpesiChecked(n) }} />
          <CalcResult
            score={calcSpesiCount}
            text={calcSpesiCount === 0 ? 'Baixo risco -- Categoria B' : 'Risco elevado (>=1) -- Categoria C ou superior'}
            color={calcSpesiCount === 0 ? 'green' : 'red'}
          />
        </Collapsible>

        {/* PESI */}
        <Collapsible title="PESI (Pulmonary Embolism Severity Index)">
          <div className="mb-2">
            <label className="block text-xs text-text-secondary mb-1.5">Idade (anos) -- somada diretamente ao score</label>
            <input type="number" inputMode="decimal" className="w-full p-3 bg-[#2D2D2D] border border-[#333] rounded-lg text-text-primary text-base" value={calcPesiAge} onChange={e => setCalcPesiAge(parseInt(e.target.value) || 65)} />
          </div>
          <ChecklistCalc items={PESI_ITEMS.map(p => p.label)} checked={calcPesiChecked} onToggle={(i) => { const n = [...calcPesiChecked]; n[i] = !n[i]; setCalcPesiChecked(n) }} showPoints pointsData={PESI_ITEMS.map(p => p.pts)} />
          {(() => {
            const c = classifyPesi(calcPesiScore)
            return <CalcResult score={calcPesiScore} text={`Classe ${c.cls} -- ${c.risk}`} color={c.color} />
          })()}
        </Collapsible>

        {/* Bova */}
        <Collapsible title="Bova Score">
          <p className="text-xs text-text-secondary mb-2">Estratificacao de risco em TEP hemodinamicamente estavel.</p>
          <ChecklistCalc items={BOVA_ITEMS.map(b => b.label)} checked={calcBovaChecked} onToggle={(i) => { const n = [...calcBovaChecked]; n[i] = !n[i]; setCalcBovaChecked(n) }} showPoints pointsData={BOVA_ITEMS.map(b => b.pts)} />
          {(() => {
            const c = classifyBova(calcBovaScore)
            return <CalcResult score={calcBovaScore} text={c.text} color={c.color} />
          })()}
        </Collapsible>

        {/* Hestia */}
        <Collapsible title="Hestia Criteria">
          <p className="text-xs text-text-secondary mb-2">Se TODOS negativos &rarr; considere tratamento ambulatorial. Se {'>='}1 positivo &rarr; internacao.</p>
          <ChecklistCalc items={HESTIA_ITEMS} checked={calcHestiaChecked} onToggle={(i) => { const n = [...calcHestiaChecked]; n[i] = !n[i]; setCalcHestiaChecked(n) }} />
          <CalcResult
            score={calcHestiaCount}
            text={calcHestiaCount === 0 ? 'Hestia negativo -- considere tratamento ambulatorial' : 'Hestia positivo -- internacao recomendada'}
            color={calcHestiaCount === 0 ? 'green' : 'red'}
          />
        </Collapsible>
      </div>
    )
  }

  // ==========================================
  // RENDER: REFERENCIA RAPIDA
  // ==========================================

  function renderRef() {
    return (
      <div>
        <button onClick={() => showView('home')} className="flex items-center gap-1.5 bg-transparent border border-bg-hover text-text-secondary text-xs px-4 py-2 rounded-lg cursor-pointer mb-4 hover:border-accent hover:text-text-primary transition-colors min-h-[44px]">
          &larr; Menu
        </button>
        <div className="text-[11px] font-semibold text-accent uppercase tracking-[2px] mb-4 pl-0.5">Referencia rapida</div>

        {/* Lab pre-anticoagulacao */}
        <Collapsible title="Laboratorio pre-anticoagulacao">
          <p className="text-xs text-text-secondary mb-2">Exames recomendados antes de iniciar anticoagulacao e para estratificacao de risco:</p>
          {[
            'Hemograma completo (atencao as plaquetas)',
            'Coagulograma (TAP/INR, TTPa) -- baseline',
            'Creatinina + clearance estimado (ClCr) -- define escolha do anticoagulante',
            'Hepatograma (TGO, TGP) -- hepatopatia contraindica DOACs',
            'Troponina I ou T -- estratificacao (C1 vs C2/C3)',
            'BNP ou NT-proBNP -- estratificacao adicional',
            'Lactato arterial -- marcador de hipoperfusao (identifica Categoria D)',
            'Tipagem sanguinea -- se risco de trombolise/cirurgia',
            'Beta-hCG -- mulheres em idade fertil (muda toda a conduta)',
          ].map((item, i) => (
            <div key={i} className="flex items-start py-1.5 text-xs text-text-secondary">
              <span className="mr-2.5 flex-shrink-0">{'\u25A1'}</span>{item}
            </div>
          ))}
          <div className="mt-2 p-2.5 rounded-r bg-info/[0.06] border-l-[3px] border-l-info text-xs text-[#82B1FF] leading-relaxed">
            Troponina e BNP/NT-proBNP sao necessarios para diferenciar C1, C2 e C3. Solicite precocemente.
          </div>
        </Collapsible>

        {/* Contraindicacoes */}
        <Collapsible title="Contraindicacoes">
          <h4 className="text-sm font-semibold mt-0 mb-2">Anticoagulacao -- contraindicacoes absolutas</h4>
          {['Sangramento ativo maior', 'Plaquetas <25.000/uL', 'Coagulopatia grave nao corrigida'].map((item, i) => (
            <div key={i} className="flex items-start py-1 text-xs text-text-secondary"><span className="mr-2.5 flex-shrink-0">{'\u25A1'}</span>{item}</div>
          ))}
          <h4 className="text-sm font-semibold mt-4 mb-2">Trombolise sistemica -- contraindicacoes absolutas</h4>
          {[
            'AVC hemorragico previo (qualquer tempo)',
            'AVC isquemico <3 meses',
            'Neoplasia intracraniana conhecida',
            'Sangramento ativo (exceto menstruacao)',
            'Cirurgia intracraniana ou espinhal <3 meses',
            'Trauma craniano fechado <3 meses',
            'Diatese hemorragica conhecida',
          ].map((item, i) => (
            <div key={i} className="flex items-start py-1 text-xs text-text-secondary"><span className="mr-2.5 flex-shrink-0">{'\u25A1'}</span>{item}</div>
          ))}
          <h4 className="text-sm font-semibold mt-4 mb-2">Trombolise sistemica -- contraindicacoes relativas</h4>
          {[
            'PAS >180 mmHg',
            'Uso atual de anticoagulante',
            'Gestacao',
            'Puncao vascular nao compressivel',
            'RCP prolongada (>10 minutos)',
            'Cirurgia de grande porte <3 semanas',
            'Sangramento interno recente (2-4 semanas)',
          ].map((item, i) => (
            <div key={i} className="flex items-start py-1 text-xs text-text-secondary"><span className="mr-2.5 flex-shrink-0">{'\u25A1'}</span>{item}</div>
          ))}
        </Collapsible>

        {/* Eco POC */}
        <Collapsible title="Eco a beira-leito -- disfuncao de VD">
          <p className="text-xs text-text-secondary mb-3">Parametros para definir disfuncao de VD na classificacao AHA/ACC. A acuracia aumenta com &gt;1 parametro presente.</p>
          {[
            { name: 'Relacao VD/VE (apical 4 camaras)', threshold: 'Anormal: >0,9', data: 'Sens 66-83% | Esp 75-77% para disfuncao VD. RR 1,61 para morte a curto prazo (Cimini 2023).' },
            { name: 'TAPSE (modo M, anel tricuspide)', threshold: 'Anormal: <16 mm', data: 'HR 3,8 para desfecho adverso. Preditor independente de mortalidade (Cimini 2023).' },
            { name: 'TAPSE + VD/VE combinados', threshold: 'TAPSE <16 mm E VD/VE >1', data: 'HR 6,5 (IC95% 3,2-13,3) para desfecho adverso. VPN 95,6%. Melhor desempenho combinado.' },
            { name: 'Sinal de McConnell', threshold: 'Acinesia de parede livre com contratilidade apical preservada', data: 'Sens 22% | Esp 97% para diagnostico de TEP. OR 8,38 para choque normotensivo em TEP intermediaria (Zhang 2024).' },
            { name: 'D-sign (septo achatado)', threshold: 'Septo interventricular abaulado para VE', data: 'Sens 31% | Esp 98% | LR+ 13,6 (de Wit 2021). Alta especificidade quando presente.' },
            { name: 'TAPSE/PASP', threshold: 'Anormal: <0,34 mm/mmHg', data: 'Sens 97% | Esp 91% para IC baixo. OR 2,63 para choque normotensivo (Yuriditsky 2024). Melhor preditor isolado.' },
          ].map((param, i) => (
            <div key={i} className="bg-bg-hover rounded p-2.5 mb-2">
              <div className="text-xs font-semibold">{param.name}</div>
              <div className="text-xs text-accent mt-0.5">{param.threshold}</div>
              <div className="text-xs text-text-secondary mt-1">{param.data}</div>
            </div>
          ))}
          <div className="mt-2 p-2.5 rounded-r bg-info/[0.06] border-l-[3px] border-l-info text-xs text-[#82B1FF] leading-relaxed">
            <strong>Limitacoes:</strong> Os dados acima sao predominantemente prognosticos (predizem desfechos adversos), nao diagnosticos. A presenca de disfuncao de VD no eco nao confirma TEP, mas estratifica risco em TEP confirmada. Eco a beira-leito nao substitui CTPA para diagnostico.
          </div>
        </Collapsible>

        {/* Anticoagulacao */}
        <Collapsible title="Anticoagulacao -- esquemas e doses">
          <h4 className="text-sm font-semibold mt-0 mb-2">Principios gerais</h4>
          <p className="text-xs text-text-secondary mb-1"><span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-success/20 text-success">COR 1</span> DOAC preferido sobre AVK para anticoagulacao oral.</p>
          <p className="text-xs text-text-secondary mb-3"><span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-success/20 text-success">COR 1</span> HBPM preferida sobre HNF quando parenteral necessario.</p>

          <h4 className="text-sm font-semibold mt-4 mb-2">DOACs -- dose inicial</h4>
          <div className="bg-bg-hover rounded p-2.5 mb-2 text-xs"><strong className="text-accent">Rivaroxabana:</strong> 15 mg VO 2x/dia por 21 dias &rarr; 20 mg 1x/dia</div>
          <div className="bg-bg-hover rounded p-2.5 mb-3 text-xs"><strong className="text-accent">Apixabana:</strong> 10 mg VO 2x/dia por 7 dias &rarr; 5 mg 2x/dia</div>

          <h4 className="text-sm font-semibold mt-4 mb-2">HBPM</h4>
          <div className="bg-bg-hover rounded p-2.5 mb-3 text-xs">
            <strong className="text-accent">Enoxaparina:</strong> 1 mg/kg SC 12/12h<br />
            <span className="text-text-secondary text-[11px]">Ampolas: 40 mg/0,4 mL | 60 mg/0,6 mL | 80 mg/0,8 mL</span>
          </div>

          <h4 className="text-sm font-semibold mt-4 mb-2">HNF</h4>
          <div className="bg-bg-hover rounded p-2.5 mb-3 text-xs">
            <strong className="text-accent">Heparina nao fracionada:</strong> Bolus 80 UI/kg IV + infusao continua 18 UI/kg/h<br />
            <span className="text-text-secondary text-[11px]">Ajustar por TTPa a cada 6h.</span>
            <br /><button onClick={() => navigate('/infusion?drug=heparina')} className="text-info text-xs underline bg-transparent border-none cursor-pointer mt-1">Calculadora de Heparina &rarr;</button>
          </div>

          <h4 className="text-sm font-semibold mt-4 mb-2">Situacoes especiais</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-bg-hover"><th className="text-left p-2 text-text-secondary font-semibold text-[11px] uppercase">Situacao</th><th className="text-left p-2 text-text-secondary font-semibold text-[11px] uppercase">Recomendacao</th></tr></thead>
              <tbody>
                {[
                  ['Gestante', 'HBPM (DOACs e AVK contraindicados)'],
                  ['SAAF trombotica', 'AVK (DOACs inferiores para eventos arteriais) COR 1'],
                  ['DRC grave (ClCr <30)', 'HNF (HBPM com cautela, ajustar dose)'],
                  ['Cancer ativo', 'DOAC ou HBPM (preferidos sobre AVK) COR 1'],
                  ['Obesidade grau III (IMC >40)', 'DOAC razoavel; se HBPM, considere reducao de dose COR 2b'],
                  ['Hepatopatia leve-moderada', 'Apixabana/rivaroxabana com cautela; grave -> HNF'],
                ].map(([sit, rec], i) => (
                  <tr key={i} className="border-b border-white/[0.04]"><td className="p-2 align-top">{sit}</td><td className="p-2 align-top">{rec}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Collapsible>

        {/* Trombolise */}
        <Collapsible title="Trombolise sistemica">
          <h4 className="text-sm font-semibold mt-0 mb-2">Indicacoes por categoria</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-bg-hover"><th className="text-left p-2 text-text-secondary font-semibold text-[11px] uppercase">Categoria</th><th className="text-left p-2 text-text-secondary font-semibold text-[11px] uppercase">Recomendacao</th></tr></thead>
              <tbody>
                {[
                  ['E1-E2', 'COR 2a -- Razoavel se risco de sangramento aceitavel'],
                  ['D1-D2', 'COR 2b -- Pode ser considerada para prevenir deterioracao'],
                  ['C3', 'COR 2b -- Beneficio incerto'],
                  ['A -- C2', 'COR 3: Dano -- Nao recomendada -- risco de sangramento maior e HIC'],
                ].map(([cat, rec], i) => (
                  <tr key={i} className="border-b border-white/[0.04]"><td className="p-2 align-top">{cat}</td><td className="p-2 align-top">{rec}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <h4 className="text-sm font-semibold mt-4 mb-2">Doses</h4>
          <div className="bg-bg-hover rounded p-2.5 mb-2 text-xs"><strong className="text-accent">Alteplase (rt-PA):</strong> 100 mg IV em 2 horas (dose padrao)</div>
          <div className="bg-bg-hover rounded p-2.5 mb-2 text-xs"><strong className="text-accent">Dose reduzida:</strong> 50 mg IV em 2 horas -- pode ser considerada para reduzir risco de sangramento <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-warning/20 text-warning">COR 2b</span></div>
          <div className="mt-2 p-2.5 rounded-r bg-info/[0.06] border-l-[3px] border-l-info text-xs text-[#82B1FF] leading-relaxed">
            Trombolise de resgate pode beneficiar pacientes que deterioram sob anticoagulacao isolada.
          </div>
        </Collapsible>

        {/* Suporte hemodinamico */}
        <Collapsible title="Suporte hemodinamico no DE">
          <div className="bg-bg-hover rounded p-2.5 mb-2 text-xs">
            <strong className="text-accent">Norepinefrina</strong> -- vasopressor de 1a escolha<br />
            Dose: 0,1-0,5 mcg/kg/min (titular). Ate 15 mcg/min: pouco efeito na RVP.<br />
            <span className="text-warning text-[11px]">Acima de 15 mcg/min: pode aumentar RVP &rarr; considere segundo agente (vasopressina, fenilefrina).</span>
            <br /><button onClick={() => navigate('/infusion?drug=noradrenalina')} className="text-info text-xs underline bg-transparent border-none cursor-pointer mt-1">Calculadora de Noradrenalina &rarr;</button>
          </div>
          <div className="bg-bg-hover rounded p-2.5 mb-3 text-xs">
            <strong className="text-accent">Dobutamina</strong> -- inotropico adjunto<br />
            Dose: ate 10 mcg/kg/min. Pode aumentar IC as custas de queda da RVS.<br />
            <span className="text-text-secondary text-[11px]">Considere se baixo debito persistente apesar de vasopressores.</span>
            <br /><button onClick={() => navigate('/infusion?drug=dobutamina')} className="text-info text-xs underline bg-transparent border-none cursor-pointer mt-1">Calculadora de Dobutamina &rarr;</button>
          </div>
          <h4 className="text-sm font-semibold mt-4 mb-2">Suporte respiratorio</h4>
          <p className="text-xs text-text-secondary mb-2">CNAF pode ser considerada antes de IOT para melhorar oxigenacao.</p>
          <AlertCard type="danger">
            <strong>Atencao -- sedacao e IOT:</strong> Podem causar colapso hemodinamico catastrofico em disfuncao de VD. Sedativos e analgesicos reduzem mecanismos compensatorios. Evitar IOT salvo indicacao forte (hipoxemia refrataria, protecao de via aerea). Equipe pronta com vasopressores/inotropicos ou VA-ECMO.
            <div className="mt-2 flex gap-2 flex-wrap">
              <button onClick={() => navigate('/airway')} className="text-info text-xs underline bg-transparent border-none cursor-pointer">Airway Guide &rarr;</button>
              <button onClick={() => navigate('/seda')} className="text-info text-xs underline bg-transparent border-none cursor-pointer">Seda Path &rarr;</button>
            </div>
          </AlertCard>
          <h4 className="text-sm font-semibold mt-4 mb-2">Vasodilatadores pulmonares inalatorios</h4>
          <p className="text-xs text-text-secondary"><span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-warning/20 text-warning">COR 2b</span> Podem ser considerados para reduzir pos-carga de VD em categorias C2-E.</p>
        </Collapsible>

        {/* Filtro VCI */}
        <Collapsible title="Filtro de veia cava inferior">
          <p className="text-xs text-text-secondary mb-2"><span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-info/20 text-info">COR 2a</span> Considere apenas se contraindicacao absoluta a anticoagulacao com TEP agudo e risco de recorrencia.</p>
          <p className="text-xs text-text-secondary mb-2"><span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-danger/20 text-danger">COR 3</span> Nao recomendado rotineiramente em pacientes que podem ser anticoagulados -- sem beneficio de mortalidade e aumento de risco de TVP.</p>
          <div className="mt-2 p-2.5 rounded-r bg-info/[0.06] border-l-[3px] border-l-info text-xs text-[#82B1FF] leading-relaxed">
            Se colocado, retirar assim que possivel (idealmente &lt;54 dias). Apos 90 dias, a retirada torna-se progressivamente mais dificil.
          </div>
        </Collapsible>
      </div>
    )
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Disclaimer />
      <Header title="TEP Guide" subtitle="Tromboembolismo pulmonar agudo -- AHA/ACC 2026" />
      <Container>
        {view === 'home' && renderHome()}
        {view === 'pathway' && renderPathway()}
        {view === 'calc' && renderCalc()}
        {view === 'ref' && renderRef()}
      </Container>
      <Footer toolName="TEP Guide" version="v2.0.0" />
      <FABMenu items={fabItems} />
    </div>
  )
}
