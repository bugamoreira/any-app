import type { DoseStatus, DoseResult } from '../types/clinical'

// ==========================================
// FORMULAS DE DOSE — Centralizadas e testáveis
// Fonte: Infusion Guide ANY App v2.3.2
// ==========================================

/**
 * Calcula mL/h a partir de dose, peso e concentração
 * Para drogas em mcg/kg/min: factor = 60
 * Para drogas em mg/kg/h ou mcg/kg/h: factor = 1
 */
export function doseToMlh(
  dose: number,
  weight: number,
  concentration: number,
  factor: number,
  usesWeight: boolean
): number {
  if (usesWeight) {
    return (dose * weight * factor) / concentration
  }
  return (dose * factor) / concentration
}

/**
 * Calcula dose a partir de mL/h, peso e concentração (inverso)
 */
export function mlhToDose(
  mlh: number,
  weight: number,
  concentration: number,
  factor: number,
  usesWeight: boolean
): number {
  if (usesWeight) {
    return (mlh * concentration) / (weight * factor)
  }
  return (mlh * concentration) / factor
}

/**
 * Determina status visual da dose
 */
export function getDoseStatus(
  dose: number,
  min: number,
  max: number,
  criticalThreshold?: number | null
): DoseStatus {
  if (dose < min) return 'critical'
  if (dose > max) {
    if (criticalThreshold && dose <= criticalThreshold) return 'caution'
    return 'critical'
  }
  return 'therapeutic'
}

/**
 * Calcula dose completa com status
 */
export function calculateDose(
  doseValue: number,
  weight: number,
  concentration: number,
  factor: number,
  usesWeight: boolean,
  min: number,
  max: number,
  criticalThreshold?: number | null
): DoseResult {
  const mlh = doseToMlh(doseValue, weight, concentration, factor, usesWeight)
  const status = getDoseStatus(doseValue, min, max, criticalThreshold)
  return { dose: doseValue, mlh, status }
}

/**
 * Formata número para exibicao (substitui ponto por virgula)
 */
export function fmt(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined || isNaN(n)) return '--'
  return n.toFixed(decimals).replace('.', ',')
}

// ==========================================
// FORMULAS ESPECIFICAS
// ==========================================

/** VNERi — Vascular Norepinephrine Responsiveness index
 * Goury et al. Ann Intensive Care 2025
 * Formula: PAD / (dose_NE * FC)
 * dose_NE em mcg/kg/min
 */
export function calcVNERi(pad: number, doseNE: number, fc: number): number | null {
  if (!pad || !doseNE || !fc || doseNE === 0 || fc === 0) return null
  return pad / (doseNE * fc)
}

/** Classificação VNERi */
export function getVNERiZone(vneri: number): {
  label: string
  color: string
  mortality: string
  description: string
} {
  if (vneri < 2.6) return {
    label: 'Hiporresponsividade grave',
    color: '#F44336',
    mortality: '~56%',
    description: 'Considere terapia adjuvante (vasopressina, corticoide, azul de metileno)'
  }
  if (vneri < 6.7) return {
    label: 'Resposta parcial',
    color: '#FF9800',
    mortality: '28-40%',
    description: 'Titular noradrenalina. Avaliar resposta a fluidos e perfusao'
  }
  if (vneri < 10.8) return {
    label: 'Resposta adequada',
    color: '#4CAF50',
    mortality: '~28%',
    description: 'Manter conduta atual. Reavaliar periodicamente'
  }
  return {
    label: 'Tonus preservado',
    color: '#2196F3',
    mortality: '~39%',
    description: 'Considere reduzir NE progressivamente. Mortalidade em J (curva ascendente)'
  }
}

/** Gap CO2 / ScvO2 quadrantes
 * Ltaief et al. Critical Care 2021
 */
export function getQuadrant(gapCO2: number, scvO2: number): {
  id: string
  label: string
  color: string
  description: string
} {
  if (scvO2 < 70 && gapCO2 > 6) return {
    id: 'lowDC',
    label: 'Baixo debito cardíaco / Estase',
    color: '#F44336',
    description: 'Considere inotrópico (dobutamina). Avaliar ecocardiograma.'
  }
  if (scvO2 < 70 && gapCO2 <= 6) return {
    id: 'anemic',
    label: 'Disoxia anemica',
    color: '#FF9800',
    description: 'Considere transfusão se Hb baixa. Avaliar oferta de O2.'
  }
  if (scvO2 >= 70 && gapCO2 > 6) return {
    id: 'micro',
    label: 'Microcirculacao inadequada',
    color: '#FFC107',
    description: 'Considere otimizar perfusao periferica. Avaliar TEC e lactato.'
  }
  return {
    id: 'cytopathic',
    label: 'Hipóxia citopatica',
    color: '#2196F3',
    description: 'Disfunção mitocondrial. Suporte de orgao. Sem intervenção hemodinâmica adicional.'
  }
}

/** Conversao lactato mmol/L <-> mg/dL */
export function lactatoConvert(value: number, from: 'mmol' | 'mgdl'): number {
  if (from === 'mmol') return value * 9
  return value / 9
}

/** Dose de heparina
 * Bolus SCA: 60 UI/kg (max 4000)
 * Bolus TEP: 80 UI/kg
 * Infusao SCA: 12 UI/kg/h (max 1000)
 * Infusao TEP: 18 UI/kg/h
 */
export function calcHeparina(weight: number, indication: 'sca' | 'tep') {
  const bolusRate = indication === 'sca' ? 60 : 80
  const infusionRate = indication === 'sca' ? 12 : 18
  const bolusMax = indication === 'sca' ? 4000 : undefined
  const infusionMax = indication === 'sca' ? 1000 : undefined

  const bolusDose = Math.min(weight * bolusRate, bolusMax ?? Infinity)
  const infusionDose = Math.min(weight * infusionRate, infusionMax ?? Infinity)
  const concentration = 100 // UI/mL (25.000 UI em 250 mL)
  const bolusVolume = bolusDose / concentration
  const infusionMlh = infusionDose / concentration

  return { bolusDose, bolusVolume, infusionDose, infusionMlh }
}

/** Wells Score para TEP */
export function classifyWells(score: number): {
  risk: 'low' | 'moderate' | 'high'
  label: string
  action: string
} {
  if (score < 2) return { risk: 'low', label: 'Baixa probabilidade', action: 'PERC → D-dímero' }
  if (score <= 6) return { risk: 'moderate', label: 'Probabilidade intermediaria', action: 'D-dímero' }
  return { risk: 'high', label: 'Alta probabilidade', action: 'Imagem direta' }
}

/** HACOR Score — Duan et al. Crit Care 2017 */
export function calcHACOR(fc120: boolean, ph: number, gcs: number, pf: number, fr30: boolean): number {
  let score = 0

  // FC >= 120
  if (fc120) score += 1

  // pH
  if (ph >= 7.35) score += 0
  else if (ph >= 7.30) score += 2
  else if (ph >= 7.25) score += 3
  else score += 4

  // GCS
  if (gcs >= 15) score += 0
  else if (gcs >= 13) score += 2
  else if (gcs >= 11) score += 5
  else score += 15

  // PaO2/FiO2
  if (pf > 200) score += 0
  else if (pf >= 175) score += 2
  else if (pf >= 150) score += 3
  else if (pf >= 125) score += 4
  else score += 5

  // FR >= 30
  if (fr30) score += 1

  return score
}

/** Volume de hidratação dengue */
export function calcDengueHydration(weight: number) {
  return {
    voTotal: weight * 60,       // mL/dia
    voSRO: (weight * 60) / 3,   // 1/3 SRO
    voLiquidos: (weight * 60) * 2 / 3, // 2/3 liquidos
    ivHora: weight * 10,        // mL/h (Grupo C)
    iv2h: weight * 10 * 2,      // 2h (Grupo C)
    ivMan6: weight * 25,        // 25 mL/kg em 6h
    ivMan8: weight * 25,        // 25 mL/kg em 8h
    bolus: weight * 20,         // 20 mL/kg (Grupo D)
    alb05: (weight * 0.5) / 0.2, // Albumina 0.5 g/kg (20% = 0.2 g/mL)
    alb1: (weight * 1) / 0.2,    // Albumina 1 g/kg
  }
}
