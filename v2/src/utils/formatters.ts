/** Formata numero com virgula (padrao BR) */
export function fmt(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined || isNaN(n)) return '--'
  return n.toFixed(decimals).replace('.', ',')
}

/** Formata peso com unidade */
export function fmtWeight(w: number | null): string {
  if (!w) return '-- kg'
  return `${fmt(w, 1)} kg`
}

/** Formata dose com unidade */
export function fmtDose(dose: number, unit: string, decimals = 1): string {
  return `${fmt(dose, decimals)} ${unit}`
}

/** Formata mL/h */
export function fmtMlh(mlh: number, decimals = 1): string {
  return `${fmt(mlh, decimals)} mL/h`
}

/** Cores por status de dose */
export const statusColors = {
  therapeutic: { bg: 'rgba(76,175,80,0.15)', border: '#4CAF50', text: '#4CAF50' },
  caution: { bg: 'rgba(255,193,7,0.15)', border: '#FFC107', text: '#FFC107' },
  critical: { bg: 'rgba(244,67,54,0.15)', border: '#F44336', text: '#F44336' },
} as const

/** Classes Tailwind por status */
export const statusClasses = {
  therapeutic: 'border-success text-success',
  caution: 'border-warning text-warning',
  critical: 'border-danger text-danger',
} as const
