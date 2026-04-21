import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  /** Se fornecido, adiciona uma faixa lateral colorida de 3px à esquerda. */
  borderColor?: string
  className?: string
  onClick?: () => void
  elevated?: boolean
  /**
   * Se verdadeiro (default), aplica mb-3 no Card. Mantido true por
   * backward-compat com 118 usos em 8 páginas. Para novos containers,
   * prefira passar spaced={false} e usar space-y-3/gap no pai.
   */
  spaced?: boolean
}

/**
 * Card refatorado:
 * - Remove hack de inline borderTop/Right/Bottom para simular border-left.
 *   Agora usa border padrão + box-shadow inset para a faixa lateral.
 * - Spacing externo (mb-3) controlado via prop `spaced` (default true).
 * - Padding consistente: p-4 sempre (antes alternava entre p-4 e p-5).
 */
export function Card({
  children,
  borderColor,
  className = '',
  onClick,
  elevated,
  spaced = true,
}: CardProps) {
  const bg = elevated ? 'bg-bg-elevated' : 'bg-bg-card'
  const interactive = onClick
    ? 'cursor-pointer active:bg-bg-hover touch-press'
    : ''
  const margin = spaced ? 'mb-3' : ''

  // Faixa lateral via box-shadow inset — não conflita com a border padrão.
  const accentShadow = borderColor
    ? { boxShadow: `inset 3px 0 0 0 ${borderColor}` }
    : undefined
  const extraPadding = borderColor ? 'pl-5' : ''

  return (
    <div
      className={`${bg} rounded-[--radius-default] border border-border-card p-4 ${extraPadding} ${interactive} ${margin} transition-colors ${className}`}
      style={accentShadow}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
