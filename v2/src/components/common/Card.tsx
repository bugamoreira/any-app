import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  borderColor?: string
  /** Cor de destaque (border-left 4px) + fundo rgba sutil — restaura o visual do monolito */
  tint?: string
  /** Opacidade do fundo tingido (0–1). Default 0.08, como o monolito. */
  tintOpacity?: number
  className?: string
  onClick?: () => void
  elevated?: boolean
  /** mb-4 automático (padrão v1). false quando o pai gerencia o espaçamento (grids com gap). */
  spaced?: boolean
}

// Converte #RRGGBB em rgba(r,g,b,a) para o fundo tingido
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function Card({ children, borderColor, tint, tintOpacity = 0.08, className = '', onClick, elevated, spaced = true }: CardProps) {
  // v1: bg #0A0A0A, border 1px #444, radius 12px, padding 16px
  // tint: border-left 4px solid [cor] + fundo rgba(cor, 0.08) — visual do monolito
  // borderColor: border-left 4px sem fundo (compat legado)
  const accent = tint ?? borderColor
  const tinted = !!tint
  return (
    <div
      className={`rounded-xl ${accent ? 'border-l-4 p-5' : 'border border-border-card p-4 bg-bg-card'} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all' : 'transition-colors'} ${spaced ? 'mb-4' : ''} ${className}`}
      style={accent ? {
        borderLeftColor: accent,
        borderTop: '1px solid #444',
        borderRight: '1px solid #444',
        borderBottom: '1px solid #444',
        background: tinted ? hexToRgba(accent, tintOpacity) : (elevated ? '#111111' : '#0A0A0A'),
      } : undefined}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
