import { useState, useRef, useEffect, type ReactNode } from 'react'

interface CollapsibleProps {
  title: string
  badge?: string
  badgeColor?: string
  children: ReactNode
  defaultOpen?: boolean
  isOpen?: boolean
  onToggle?: () => void
}

export function Collapsible({ title, badge, badgeColor, children, defaultOpen = false, isOpen, onToggle }: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const bodyRef = useRef<HTMLDivElement>(null)
  const open = isOpen !== undefined ? isOpen : internalOpen

  useEffect(() => {
    if (!open || !bodyRef.current) return
    const el = bodyRef.current
    el.style.maxHeight = `${el.scrollHeight}px`
    const observer = new ResizeObserver(() => {
      if (el.scrollHeight > 0) el.style.maxHeight = `${el.scrollHeight}px`
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [open])

  function handleToggle() {
    if (onToggle) onToggle()
    else setInternalOpen(!internalOpen)
  }

  return (
    <div className="mb-3">
      {/* Header — v1: bg #111, border #444, radius 8px, padding 14px, min-h 44px */}
      <button
        onClick={handleToggle}
        className="flex items-center justify-between w-full px-[14px] min-h-[44px] bg-bg-elevated border border-border-card rounded-lg cursor-pointer text-left transition-colors active:bg-bg-hover"
        style={{ marginBottom: open ? '2px' : '0' }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[15px] font-semibold text-text-primary truncate">{title}</span>
          {badge && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: `${badgeColor || '#FF5252'}22`, color: badgeColor || '#FF5252' }}
            >
              {badge}
            </span>
          )}
        </div>
        <svg
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-text-muted transition-transform duration-300 flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {/* Body — v1: bg #0A0A0A, border #444, no border-top, radius bottom 8px, padding 14px */}
      <div
        ref={bodyRef}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'border border-border-card border-t-0 rounded-b-lg' : ''}`}
        style={{ maxHeight: open ? undefined : '0px', background: open ? '#0A0A0A' : 'transparent' }}
      >
        <div className="px-[14px] pb-[14px] pt-[14px]">
          {children}
        </div>
      </div>
    </div>
  )
}
