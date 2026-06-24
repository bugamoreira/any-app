interface MnemonicProps {
  /** Letras do mnemonico, ex: ['C','R','A','S','H']. */
  letters: string[]
  /** Estado ativo de cada letra (mesmo comprimento de letters). */
  active: boolean[]
  /** Alterna uma letra ao tocar (opcional — sem isto o grid e apenas visual). */
  onToggle?: (index: number) => void
  /** Cor da letra ativa. Default danger (#F44336), como o monolito. */
  activeColor?: string
  /** Mostra contador "n/total" a direita. */
  showCounter?: boolean
}

/**
 * Grade de letras de mnemonico — restaura o .mnemonic-display do monolito (Airway: CRASH, LEMON, ROMAN).
 * Circulos 32px; ativos preenchem em cor. Leitura visual imediata de quantos criterios marcados.
 */
export function Mnemonic({ letters, active, onToggle, activeColor = '#F44336', showCounter }: MnemonicProps) {
  const count = active.filter(Boolean).length
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {letters.map((letter, i) => {
          const on = active[i]
          return (
            <button
              key={i}
              onClick={onToggle ? () => onToggle(i) : undefined}
              disabled={!onToggle}
              className="w-8 h-8 flex items-center justify-center rounded-md text-base font-extrabold transition-all"
              style={on
                ? { background: activeColor, border: `2px solid ${activeColor}`, color: '#fff' }
                : { background: '#111111', border: '2px solid #444444', color: '#888888' }}
              aria-pressed={on}
            >
              {letter}
            </button>
          )
        })}
      </div>
      {showCounter && (
        <span className="text-sm text-text-secondary ml-auto">{count}/{letters.length}</span>
      )}
    </div>
  )
}
