import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

export function Container({ children, className = '' }: ContainerProps) {
  return (
    <div className={`max-w-[500px] mx-auto px-4 pb-24 ${className}`}>
      {children}
    </div>
  )
}
