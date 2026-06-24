interface BreadcrumbProps {
  /** Rotulos dos passos do pathway, em ordem. */
  steps: string[]
  /** Indice do passo atual (destacado em accent + bold). */
  current: number
  /** Permite voltar tocando num passo ja visitado. */
  onJump?: (index: number) => void
}

/**
 * Trilha de navegacao do pathway — restaura o .breadcrumb do monolito (Seda Path).
 * Mostra onde o medico esta dentro do fluxo clinico. Scroll horizontal em telas estreitas.
 */
export function Breadcrumb({ steps, current, onJump }: BreadcrumbProps) {
  return (
    <nav
      className="flex items-center gap-2 px-4 py-3 bg-bg-card border-b border-border-card text-xs text-text-secondary overflow-x-auto"
      aria-label="Trilha do pathway"
    >
      {steps.map((step, i) => {
        const isActive = i === current
        const isPast = i < current
        const clickable = isPast && !!onJump
        return (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap">
            {i > 0 && <span className="text-text-muted" aria-hidden>›</span>}
            <span
              className={`${isActive ? 'text-accent font-semibold' : ''} ${clickable ? 'cursor-pointer' : ''}`}
              onClick={clickable ? () => onJump!(i) : undefined}
              aria-current={isActive ? 'step' : undefined}
            >
              {step}
            </span>
          </span>
        )
      })}
    </nav>
  )
}
