import { useState, useRef, useEffect } from 'react'
import type { FABItem } from '../../types/clinical'

interface FABMenuProps {
  items: FABItem[]
}

/**
 * FABMenu refatorado:
 * - Remove max-w-[500px] do wrapper fixed (sem efeito útil, ancorado no right).
 * - Usa token --z-fab para coordenar com disclaimer/weight/search.
 * - Sombra e ring do botão usam o accent, coerente com o design system.
 * - A11y: aria-label + aria-expanded.
 */
export function FABMenu({ items }: FABMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div
      ref={menuRef}
      className="fixed bottom-5 right-5"
      style={{ zIndex: 'var(--z-fab)' }}
    >
      {open && (
        <div className="absolute bottom-[70px] right-0 bg-bg-elevated border border-border-card rounded-xl shadow-2xl p-2 min-w-[220px] animate-scale-in origin-bottom-right">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick(); setOpen(false) }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left text-[15px] font-medium text-text-primary active:bg-bg-hover transition-colors min-h-[48px] bg-transparent border-0 cursor-pointer"
            >
              {item.icon && <span className="flex-shrink-0 text-text-muted">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full border-0 cursor-pointer flex items-center justify-center transition-all touch-press ${
          open ? 'bg-[#D32F2F]' : 'bg-accent'
        }`}
        style={{ boxShadow: '0 6px 16px rgba(255,82,82,0.35)' }}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}
