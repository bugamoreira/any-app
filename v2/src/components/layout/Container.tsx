import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

/**
 * Container mobile-first. Footer deixou de ser fixed, então o pb-[100px]
 * (legado do v1) não é mais necessário. Mantemos pb-6 para respiro antes
 * do footer estático.
 */
export function Container({ children, className = '' }: ContainerProps) {
  return (
    <div className={`max-w-[500px] mx-auto px-4 pb-6 ${className}`}>
      {children}
    </div>
  )
}
