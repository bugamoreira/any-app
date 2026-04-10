import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  fullWidth?: boolean
  align?: 'left' | 'center'
}

// v1: primary bg #FF5252, secondary bg #111 border #444, radius 8px, padding 16px, font 16px/600, min-h 52px
const variants = {
  primary: 'bg-accent text-white active:bg-accent-hover',
  secondary: 'bg-bg-elevated text-text-primary border border-border-card active:bg-bg-hover',
  danger: 'bg-danger text-white active:opacity-90',
  success: 'bg-success text-white active:opacity-90',
  outline: 'bg-transparent text-accent border border-border-card active:bg-bg-hover',
}

const sizes = {
  sm: 'px-3 py-2 text-sm min-h-[44px]',
  md: 'px-4 py-4 text-[16px] min-h-[52px]',
  lg: 'px-6 py-4 text-base min-h-[52px]',
}

export function Button({ variant = 'primary', size = 'md', fullWidth = true, align = 'center', children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-semibold cursor-pointer transition-all flex items-center gap-2 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${align === 'left' ? 'justify-start' : 'justify-center'} disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
