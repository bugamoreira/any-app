import type { ReactNode } from 'react'

type ResultStatus = 'normal' | 'warning' | 'danger'

interface ResultBoxProps {
  /** Valor numerico principal (string ou node). */
  value: ReactNode
  /** Unidade (ex: "mL", "mg", "mcg/kg/min"). */
  unit?: string
  /** Rotulo acima do valor (ex: "Dose", "Volume"). */
  label?: string
  /** Cor do valor conforme faixa clinica. Default normal (accent). */
  status?: ResultStatus
}

const statusColor: Record<ResultStatus, string> = {
  normal: '#FF5252',  // accent
  warning: '#FFC107', // warning
  danger: '#F44336',  // danger
}

/**
 * Caixa de resultado numerico em monospace — restaura o .drug-result do monolito (Ped Guide).
 * Numero "impresso" (mono 1.3rem bold), fundo #111, borda 2px. Saltam aos olhos no calculo a beira-leito.
 */
export function ResultBox({ value, unit, label, status = 'normal' }: ResultBoxProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">{label}</span>
      )}
      <div
        className="font-mono text-[1.3rem] font-bold text-center min-w-[90px] px-4 py-2.5 rounded-[10px]"
        style={{ color: statusColor[status], background: '#111111', border: '2px solid #333333' }}
      >
        {value}{unit && <span className="text-[0.8rem] text-text-muted ml-1">{unit}</span>}
      </div>
    </div>
  )
}
