import { useState, useCallback, useEffect } from 'react'
import type { DrugConfig } from '../../types/clinical'
import { useWeight } from '../../contexts/WeightContext'
import { doseToMlh, mlhToDose, getDoseStatus } from '../../utils/calculations'
import { fmt } from '../../utils/formatters'
import { statusColors } from '../../utils/formatters'

interface DoseCalculatorProps {
  drug: DrugConfig
  onConcentrationChange?: (conc: number) => void
}

/**
 * DoseCalculator refatorado:
 * - "Diluição" deixa de ter border-left azul (não é um AlertCard).
 *   Agora é um bloco de metadados com hierarquia tipográfica.
 * - Diluições alternativas como segmented control (pill único, não botões separados).
 * - Range terapêutico inline com o label, sem card cinza extra.
 * - Grid de resultado com border 1px (antes 2px gritante).
 * - Padding interno simétrico.
 * - A11y: aria-label em sliders e inputs.
 */
export function DoseCalculator({ drug, onConcentrationChange }: DoseCalculatorProps) {
  const { weight } = useWeight()
  const [dose, setDose] = useState(drug.doseDefault)
  const [concentration, setConcentration] = useState(drug.concentration)
  const [editingMl, setEditingMl] = useState(false)
  const [editingDose, setEditingDose] = useState(false)
  const [mlValue, setMlValue] = useState('')
  const [doseValue, setDoseValue] = useState('')

  const mlh = weight ? doseToMlh(dose, weight, concentration, drug.factor, drug.usesWeight) : null
  const status = getDoseStatus(dose, drug.doseMin, drug.doseMax, drug.criticalThreshold)
  const colors = statusColors[status]

  useEffect(() => {
    if (!editingDose) setDoseValue(fmt(dose, 2))
  }, [dose, editingDose])

  useEffect(() => {
    if (!editingMl && mlh !== null) setMlValue(fmt(mlh, 1))
  }, [mlh, editingMl])

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDose(parseFloat(e.target.value))
  }, [])

  const handleMlInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setMlValue(raw)
    const v = parseFloat(raw.replace(',', '.'))
    if (!isNaN(v) && v >= 0 && weight) {
      const newDose = mlhToDose(v, weight, concentration, drug.factor, drug.usesWeight)
      setDose(newDose)
    }
  }, [weight, concentration, drug])

  const handleDoseInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setDoseValue(raw)
    const v = parseFloat(raw.replace(',', '.'))
    if (!isNaN(v) && v >= 0) {
      setDose(v)
    }
  }, [])

  function changeDilution(conc: number) {
    setConcentration(conc)
    onConcentrationChange?.(conc)
  }

  return (
    <div className="space-y-3">
      {/* Apresentação / diluição */}
      <div className="bg-bg-elevated rounded-xl p-4 border border-border-card">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Diluição</span>
          <span className="text-[13px] text-accent font-semibold">
            {fmt(concentration, 0)} {drug.concentrationUnit}
          </span>
        </div>
        <div className="text-[13px] text-text-secondary leading-snug">{drug.presentation}</div>
      </div>

      {/* Diluições alternativas — segmented control */}
      {drug.dilutions && drug.dilutions.length > 1 && (
        <div className="flex bg-bg-elevated border border-border-card rounded-xl p-1 gap-1">
          {drug.dilutions.map(d => (
            <button
              key={d.concentration}
              onClick={() => changeDilution(d.concentration)}
              className={`flex-1 py-2 px-2 rounded-lg text-[13px] font-medium min-h-[40px] transition-colors border-0 cursor-pointer ${
                concentration === d.concentration
                  ? 'bg-accent text-white'
                  : 'bg-transparent text-text-secondary active:bg-bg-hover'
              }`}
              aria-pressed={concentration === d.concentration}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {/* Slider + range inline */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[13px] text-text-secondary">Dose ({drug.doseUnit})</span>
          <span className="text-[11px] text-text-muted">
            {fmt(drug.doseMin, 2)}–{fmt(drug.doseMax, 1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDose(Math.max(drug.doseMin, dose - drug.doseStep))}
            className="w-10 h-10 rounded-full border border-border-card bg-bg-elevated text-accent text-lg font-bold flex items-center justify-center cursor-pointer flex-shrink-0 active:bg-bg-hover touch-press"
            aria-label="Diminuir dose"
          >−</button>
          <input
            type="range"
            min={drug.doseMin} max={drug.doseMax} step={drug.doseStep}
            value={Math.min(drug.doseMax, Math.max(drug.doseMin, dose))}
            onChange={handleSliderChange}
            className="flex-1 accent-accent h-2"
            aria-label="Dose"
          />
          <button
            onClick={() => setDose(Math.min(drug.doseMax, dose + drug.doseStep))}
            className="w-10 h-10 rounded-full border border-border-card bg-bg-elevated text-accent text-lg font-bold flex items-center justify-center cursor-pointer flex-shrink-0 active:bg-bg-hover touch-press"
            aria-label="Aumentar dose"
          >+</button>
        </div>
      </div>

      {/* Peso alert */}
      {!weight && (
        <div className="text-center text-sm text-warning py-4">Informe o peso do paciente</div>
      )}

      {/* Resultado */}
      {weight && (
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-xl p-4 text-center border"
            style={{ background: colors.bg, borderColor: colors.border }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.text }}>Velocidade</div>
            <input
              type="text"
              inputMode="decimal"
              value={editingMl ? mlValue : (mlh !== null ? fmt(mlh, 1) : '--')}
              onChange={handleMlInput}
              onFocus={() => { setEditingMl(true); setMlValue(mlh !== null ? fmt(mlh, 1) : '') }}
              onBlur={() => setEditingMl(false)}
              className="w-full bg-transparent text-center text-[26px] font-bold border-b border-current outline-none"
              style={{ color: colors.text }}
              aria-label="Velocidade em mL/h"
            />
            <div className="text-[11px] mt-1 opacity-80" style={{ color: colors.text }}>mL/h</div>
          </div>
          <div
            className="rounded-xl p-4 text-center border"
            style={{ background: colors.bg, borderColor: colors.border }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.text }}>Dose</div>
            <input
              type="text"
              inputMode="decimal"
              value={editingDose ? doseValue : fmt(dose, 2)}
              onChange={handleDoseInput}
              onFocus={() => { setEditingDose(true); setDoseValue(fmt(dose, 2)) }}
              onBlur={() => setEditingDose(false)}
              className="w-full bg-transparent text-center text-[26px] font-bold border-b border-current outline-none"
              style={{ color: colors.text }}
              aria-label={`Dose em ${drug.doseUnit}`}
            />
            <div className="text-[11px] mt-1 opacity-80" style={{ color: colors.text }}>{drug.doseUnit}</div>
          </div>
        </div>
      )}
    </div>
  )
}
