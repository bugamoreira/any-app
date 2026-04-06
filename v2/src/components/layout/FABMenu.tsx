import { useState, useRef, useEffect } from 'react'
import type { FABItem } from '../../types/clinical'

interface FABMenuProps {
  items: FABItem[]
}

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
    <div ref={menuRef} className="fixed bottom-5 right-5 z-[1000]">
      {open && (
        <div className="absolute bottom-[70px] right-0 bg-bg-elevated border border-border-card rounded-xl shadow-2xl p-2 min-w-[200px] animate-fade-in">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick(); setOpen(false) }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-left text-sm font-medium text-text-primary active:bg-bg-hover transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full border-none cursor-pointer shadow-lg flex items-center justify-center transition-colors ${
          open ? 'bg-red-800' : 'bg-accent'
        }`}
        style={{ boxShadow: '0 4px 12px rgba(255,82,82,0.4)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>
    </div>
  )
}
