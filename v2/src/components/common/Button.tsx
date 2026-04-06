import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  fullWidth?: boolean
}

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-bg-elevated text-text-primary border border-border-card hover:bg-bg-hover',
  danger: 'bg-danger text-white hover:opacity-90',
  success: 'bg-success text-white hover:opacity-90',
  outline: 'bg-transparent text-text-secondary border border-border-card hover:bg-bg-hover hover:text-text-primary',
}

const sizes = {
  sm: 'px-3 py-2 text-sm min-h-[44px]',
  md: 'px-5 py-3 text-sm min-h-[44px]',
  lg: 'px-6 py-4 text-base min-h-[48px]',
}

export function Button({ variant = 'primary', size = 'md', fullWidth, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-medium cursor-pointer transition-all ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
