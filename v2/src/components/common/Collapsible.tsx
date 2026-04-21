import { useState, useRef, useEffect, useId, type ReactNode } from 'react'

interface CollapsibleProps {
  title: string
  badge?: string
  badgeColor?: string
  children: ReactNode
  defaultOpen?: boolean
  isOpen?: boolean
  onToggle?: () => void
}

/**
 * Collapsible refatorado:
 * - Header e body agora são UM container com uma ÚNICA border.
 *   Antes: header tinha border, body tinha border sem border-top — criava
 *   uma "costura" horizontal feia quando aberto.
 * - Divisor entre header e body usa border-t sutil no body quando aberto.
 * - Padding simétrico (px-4 py-3 no header, p-4 no body).
 * - A11y: aria-expanded + aria-controls + id no body.
 */
export function Collapsible({
  title,
  badge,
  badgeColor,
  children,
  defaultOpen = false,
  isOpen,
  onToggle,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const bodyRef = useRef<HTMLDivElement>(null)
  const open = isOpen !== undefined ? isOpen : internalOpen
  const bodyId = useId()

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
    <div className="mb-3 bg-bg-elevated border border-border-card rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="flex items-center justify-between w-full px-4 py-3 min-h-[48px] bg-transparent border-0 cursor-pointer text-left transition-colors active:bg-bg-hover"
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[15px] font-semibold text-text-primary truncate">{title}</span>
          {badge && (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 leading-none"
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
      <div
        id={bodyId}
        ref={bodyRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? undefined : '0px' }}
      >
        <div className="p-4 border-t border-border-card bg-bg-card">
          {children}
        </div>
      </div>
    </div>
  )
}
