import { useEffect, useRef, type ReactNode } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: string
}

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Modal com focus trap (ALTA-09).
 * - Ao abrir: salva foco anterior, move para o 1o elemento focavel dentro.
 * - Tab/Shift-Tab ciclam apenas entre elementos focaveis do modal.
 * - Esc fecha.
 * - Ao fechar: restaura foco anterior.
 */
export function Modal({ open, onClose, title, children, width = '400px' }: ModalProps) {
  const isMobile = useIsMobile()
  const contentRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Body scroll lock + save/restore focus
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = ''
      return
    }
    document.body.style.overflow = 'hidden'
    previousFocusRef.current = document.activeElement as HTMLElement | null

    // Focus primeiro elemento focavel
    const raf = requestAnimationFrame(() => {
      const el = contentRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      el?.focus()
    })

    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus?.()
    }
  }, [open])

  // Focus trap: Tab/Shift-Tab ciclam + Esc fecha
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const content = contentRef.current
      if (!content) return
      const focusables = Array.from(content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(el => !el.hasAttribute('disabled'))
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex ${isMobile ? 'items-end' : 'items-center'} justify-center`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        ref={contentRef}
        className={`relative bg-bg-elevated ${isMobile ? 'rounded-t-2xl w-full max-h-[85vh]' : 'rounded-2xl'} p-6 overflow-y-auto animate-slide-up`}
        style={!isMobile ? { maxWidth: width, width: '90%' } : undefined}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-lg font-bold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-hover text-text-muted border-none cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label="Fechar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
