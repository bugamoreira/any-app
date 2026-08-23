// ==========================================
// TIPOS CLINICOS — ANY App
// ==========================================

/** Configuração de uma droga para calculadora de infusão */
/**
 * Caixa de bolus/ataque que acompanha um modo de dose.
 * As linhas sao pares label/valor, iguais aos info-row do v1.
 */
export interface DrugBolus {
  title: string
  rows: { label: string; value: string }[]
  /** Dose por kg — gera a linha "Este paciente". */
  perKg?: number
  /** Quando a dose de ataque e uma faixa (ex.: propofol 0,5 a 2,5 mg/kg). */
  perKgRange?: [number, number]
  /** Teto absoluto POR BOLUS (ex.: midazolam 20 mg). Nao confundir com dose
   *  cumulativa maxima, que fica no texto da linha "Repetir". */
  capPerBolus?: number
  /** Unidade do calculo por kg. Padrao mg. */
  unit?: string
}

/**
 * Modo de dose por indicacao. Troca a faixa do slider E as faixas de cor —
 * no v1 isso vivia em setMidaMode/setPropofolMode/setCetaMode/setNitroMode
 * junto com as chamadas a setStatus.
 */
export interface DrugMode {
  id: string
  label: string
  doseMin: number
  doseMax: number
  doseStep: number
  doseDefault: number
  cautionThreshold?: number
  criticalThreshold?: number
  /** Texto da faixa exibido ao usuario, com virgula decimal. */
  rangeLabel: string
  bolus?: DrugBolus
}

export interface DrugConfig {
  id: string
  name: string
  aliases: string[]
  category: DrugCategory
  presentation: string
  concentration: number       // mcg/mL ou mg/mL
  concentrationUnit: 'mcg/mL' | 'mg/mL' | 'UI/mL'
  doseUnit: string            // mcg/kg/min, mg/kg/h, UI/min, etc
  resultUnit: string          // mL/h
  doseMin: number
  doseMax: number
  doseStep: number
  doseDefault: number
  cautionThreshold?: number   // acima = amarelo
  criticalThreshold?: number  // acima = vermelho
  factor: number              // 60 para mcg/kg/min, 1 para mg/kg/h
  usesWeight: boolean
  dilutions?: DrugDilution[]
  /** Modos por indicacao. Sem isso, a droga tem faixa unica (as outras onze). */
  modes?: DrugMode[]
}

export interface DrugDilution {
  label: string
  concentration: number
  isDefault?: boolean
}

export type DrugCategory =
  | 'vasopressors'
  | 'sedation'
  | 'neuromuscular'
  | 'vasodilators'
  | 'protocols'

/** Status visual do resultado de dose */
export type DoseStatus = 'therapeutic' | 'caution' | 'critical'

/** Resultado de calculo de dose */
export interface DoseResult {
  dose: number
  mlh: number
  status: DoseStatus
}

/** Step de um pathway */
export interface PathwayStep {
  id: string
  number: number
  title: string
  subtitle?: string
}

/** Item de FAB menu */
export interface FABItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
}

/** Opcao de toggle */
export interface ToggleOption {
  value: string
  label: string
}

/** Item de colapsavel */
export interface CollapsibleItem {
  id: string
  title: string
  badge?: string
  badgeColor?: string
}

/** Tipo de alerta */
export type AlertType = 'success' | 'warning' | 'danger' | 'info'

/** Range de peso */
export interface WeightRange {
  min: number
  max: number
  label: string
}

export const ADULT_WEIGHT_RANGE: WeightRange = { min: 40, max: 200, label: 'Adulto' }
export const PED_WEIGHT_RANGE: WeightRange = { min: 0.5, max: 50, label: 'Pediatrico' }
