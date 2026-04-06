import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  borderColor?: string
  className?: string
  onClick?: () => void
}

export function Card({ children, borderColor, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-bg-card rounded-xl p-4 ${borderColor ? 'border-l-4' : 'border border-border-card'} ${onClick ? 'cursor-pointer active:bg-bg-hover' : ''} transition-colors ${className}`}
      style={borderColor ? { borderLeftColor: borderColor } : undefined}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
