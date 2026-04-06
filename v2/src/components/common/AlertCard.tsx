import type { ReactNode } from 'react'
import type { AlertType } from '../../types/clinical'

interface AlertCardProps {
  type: AlertType
  title?: string
  children: ReactNode
  className?: string
}

const colors: Record<AlertType, { bg: string; border: string; title: string }> = {
  success: { bg: 'rgba(105,240,174,0.08)', border: '#69F0AE', title: '#69F0AE' },
  warning: { bg: 'rgba(255,215,64,0.08)', border: '#FFD740', title: '#FFD740' },
  danger:  { bg: 'rgba(255,82,82,0.08)',   border: '#FF5252', title: '#FF5252' },
  info:    { bg: 'rgba(33,150,243,0.08)',   border: '#2196F3', title: '#2196F3' },
}

export function AlertCard({ type, title, children, className = '' }: AlertCardProps) {
  const c = colors[type]
  return (
    <div
      className={`rounded-lg p-3.5 border-l-3 my-2 ${className}`}
      style={{ background: c.bg, borderLeftColor: c.border }}
    >
      {title && <div className="font-semibold text-sm mb-1" style={{ color: c.title }}>{title}</div>}
      <div className="text-sm text-text-secondary leading-relaxed">{children}</div>
    </div>
  )
}
