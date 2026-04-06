import { useWeight } from '../../contexts/WeightContext'
import type { WeightRange } from '../../types/clinical'
import { ADULT_WEIGHT_RANGE } from '../../types/clinical'

interface WeightInputProps {
  range?: WeightRange
  sticky?: boolean
}

export function WeightInput({ range = ADULT_WEIGHT_RANGE, sticky = true }: WeightInputProps) {
  const { weight, setWeight } = useWeight()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value)
    if (!isNaN(v) && v >= range.min && v <= range.max) {
      setWeight(v)
    } else if (e.target.value === '') {
      setWeight(null)
    }
  }

  const isOutOfRange = weight !== null && (weight < range.min || weight > range.max)

  return (
    <div className={`bg-bg-card border-b border-border px-4 py-3 z-40 ${sticky ? 'sticky top-[33px]' : ''}`}>
      <div className="max-w-[500px] mx-auto flex items-center gap-3">
        <span className="text-sm text-text-secondary">Peso:</span>
        <input
          type="number"
          inputMode="decimal"
          value={weight ?? ''}
          onChange={handleChange}
          placeholder={String(range.min === 0.5 ? 10 : 70)}
          className={`w-20 bg-transparent border-b-2 text-center text-lg font-bold text-accent outline-none ${
            isOutOfRange ? 'border-danger text-danger' : 'border-border-card focus:border-accent'
          }`}
          min={range.min}
          max={range.max}
          step="0.1"
        />
        <span className="text-sm text-text-secondary">kg</span>
        {isOutOfRange && (
          <span className="text-xs text-danger">Fora do range ({range.min}-{range.max} kg)</span>
        )}
      </div>
    </div>
  )
}
