import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

export function Container({ children, className = '' }: ContainerProps) {
  // v1: max-width 500px, padding 0 16px 100px
  return (
    <div className={`max-w-[500px] mx-auto px-4 pb-[100px] ${className}`}>
      {children}
    </div>
  )
}
