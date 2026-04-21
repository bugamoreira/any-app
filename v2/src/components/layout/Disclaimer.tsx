// v2 Disclaimer — altura reduzida (32px), mais discreto mas ainda presente.
// Coordena com --h-disclaimer em index.css.
export function Disclaimer() {
  return (
    <div
      className="sticky top-0 flex items-center justify-center gap-2 bg-warning text-black text-center px-4 text-[11px] font-semibold leading-none"
      style={{ height: 'var(--h-disclaimer)', zIndex: 'var(--z-disclaimer)' }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span className="truncate">
        <strong>Apoio em teste</strong> — não substitui o julgamento clínico.
      </span>
    </div>
  )
}
