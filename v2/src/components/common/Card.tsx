import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  borderColor?: string
  className?: string
  onClick?: () => void
  elevated?: boolean
}

export function Card({ children, borderColor, className = '', onClick, elevated }: CardProps) {
  // v1: bg #0A0A0A, border 1px #444, radius 12px, padding 16px
  // With border-left: 4px solid [color], padding 20px
  const bg = elevated ? 'bg-bg-elevated' : 'bg-bg-card'
  return (
    <div
      className={`${bg} rounded-xl ${borderColor ? 'border-l-4 p-5' : 'border border-border-card p-4'} ${onClick ? 'cursor-pointer active:bg-bg-hover active:scale-[0.98] transition-all' : 'transition-colors'} mb-4 ${className}`}
      style={borderColor ? { borderLeftColor: borderColor, borderTop: '1px solid #444', borderRight: '1px solid #444', borderBottom: '1px solid #444' } : undefined}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
