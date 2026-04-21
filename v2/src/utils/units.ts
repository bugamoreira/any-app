/**
 * BLOCKER-06: conversao de unidades clinicas.
 * Lactato: 1 mmol/L ≈ 9,01 mg/dL (peso molecular 90,08).
 */

export type LactateUnit = 'mmol/L' | 'mg/dL'

export function convertLactate(value: number, from: LactateUnit, to: LactateUnit): number {
  if (from === to) return value
  if (from === 'mmol/L' && to === 'mg/dL') return value * 9.01
  if (from === 'mg/dL' && to === 'mmol/L') return value / 9.01
  return value
}

export function formatLactate(value: number, unit: LactateUnit, decimals = 1): string {
  return `${value.toFixed(decimals)} ${unit}`
}
