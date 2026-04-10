import { useState } from 'react'
import { useWeight } from '../../contexts/WeightContext'
import type { WeightRange } from '../../types/clinical'
import { ADULT_WEIGHT_RANGE } from '../../types/clinical'

interface WeightInputProps {
  range?: WeightRange
  sticky?: boolean
}

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
      // Reverter para o último valor válido
      setLocalValue(weight !== null ? String(weight) : '')
    }
  }

  const numValue = parseFloat(localValue)
  const isOutOfRange = localValue !== '' && !isNaN(numValue) && (numValue < range.min || numValue > range.max)

  return (
    <div className={`bg-bg-card border-b border-border px-5 py-3 z-40 ${sticky ? 'sticky top-[41px]' : ''}`}>
      <div className="max-w-[500px] mx-auto flex items-center gap-3">
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
        />
        <span className="text-sm text-text-secondary">kg</span>
        {isOutOfRange && (
          <span className="text-xs text-danger">({range.min}–{range.max} kg)</span>
        )}
      </div>
    </div>
  )
}
