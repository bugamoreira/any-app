import { useState, useRef, type ReactNode } from 'react'

interface CollapsibleProps {
  title: string
  badge?: string
  badgeColor?: string
  children: ReactNode
  defaultOpen?: boolean
}

export function Collapsible({ title, badge, badgeColor, children, defaultOpen = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyRef = useRef<HTMLDivElement>(null)

  return (
    <div className="bg-bg-card border border-border-card rounded-xl mb-2.5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3.5 bg-transparent border-none cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{title}</span>
          {badge && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${badgeColor || '#FF5252'}22`, color: badgeColor || '#FF5252' }}
            >
              {badge}
            </span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        ref={bodyRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? bodyRef.current?.scrollHeight ? `${bodyRef.current.scrollHeight}px` : '2000px' : '0px'
        }}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  )
}
