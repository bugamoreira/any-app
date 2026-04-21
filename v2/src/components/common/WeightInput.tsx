import { useState } from 'react'
import { useWeight } from '../../contexts/WeightContext'
import type { WeightRange } from '../../types/clinical'
import { ADULT_WEIGHT_RANGE } from '../../types/clinical'

interface WeightInputProps {
  range?: WeightRange
  sticky?: boolean
}

/**
 * WeightInput refatorado:
 * - Sticky coordenado via CSS custom property (top = h-disclaimer).
 *   Antes era sticky top-[41px] (número mágico).
 * - Altura controlada por --h-weight no @theme para que a busca saiba
 *   onde se posicionar.
 * - Visual mais limpo: sem border-bottom (a separação vem do bg).
 */
export function WeightInput({ range = ADULT_WEIGHT_RANGE, sticky = true }: WeightInputProps) {
  const { weight, setWeight } = useWeight()
  const [localValue, setLocalValue] = useState(weight !== null ? String(weight) : '')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setLocalValue(raw)

    if (raw === '') {
      setWeight(null)
      return
    }

    const v = parseFloat(raw)
    if (!isNaN(v) && v >= range.min && v <= range.max) {
      setWeight(v)
    }
  }

  function handleBlur() {
    if (localValue === '') {
      setWeight(null)
      return
    }
    const v = parseFloat(localValue)
    if (isNaN(v) || v < range.min || v > range.max) {
      setLocalValue(weight !== null ? String(weight) : '')
    }
  }

  const numValue = parseFloat(localValue)
  const isOutOfRange =
    localValue !== '' && !isNaN(numValue) && (numValue < range.min || numValue > range.max)

  const stickyStyle = sticky
    ? { top: 'var(--h-disclaimer)', height: 'var(--h-weight)', zIndex: 'var(--z-weight)' as const }
    : { height: 'var(--h-weight)' }

  return (
    <div
      className={`bg-bg-primary/95 backdrop-blur px-5 border-b border-border ${sticky ? 'sticky' : ''}`}
      style={stickyStyle}
    >
      <div className="max-w-[500px] mx-auto flex items-center gap-3 h-full">
        <span className="text-sm font-medium text-text-secondary">Peso:</span>
        <input
          type="number"
          inputMode="decimal"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={String(range.min === 0.5 ? 10 : 70)}
          className={`w-24 bg-transparent border-b-2 text-center text-2xl font-bold outline-none ${
            isOutOfRange ? 'border-danger text-danger' : 'border-border-card focus:border-accent text-accent'
          }`}
          min={range.min}
          max={range.max}
          step="0.1"
          aria-label="Peso do paciente em kg"
        />
        <span className="text-sm text-text-secondary">kg</span>
        {isOutOfRange && (
          <span className="text-xs text-danger ml-auto">({range.min}–{range.max} kg)</span>
        )}
      </div>
    </div>
  )
}
