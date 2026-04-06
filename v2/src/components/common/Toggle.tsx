import type { ToggleOption } from '../../types/clinical'

interface ToggleProps {
  options: ToggleOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Toggle({ options, value, onChange, className = '' }: ToggleProps) {
  return (
    <div className={`flex rounded-lg overflow-hidden border border-border-card ${className}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2.5 px-3 text-sm font-medium cursor-pointer transition-colors border-none min-h-[44px] ${
            value === opt.value
              ? 'bg-accent text-white'
              : 'bg-bg-elevated text-text-secondary'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
