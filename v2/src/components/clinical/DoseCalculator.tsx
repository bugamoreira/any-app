import { useState, useCallback, useEffect, useRef } from 'react'
import type { DrugConfig } from '../../types/clinical'
import { useWeight } from '../../contexts/WeightContext'
import { useServerCalc } from '../../hooks/useServerCalc'
import { doseToMlh, mlhToDose, getDoseStatus } from '../../utils/calculations'
import { fmt } from '../../utils/formatters'
import { statusColors } from '../../utils/formatters'

interface DoseCalculatorProps {
  drug: DrugConfig
  onConcentrationChange?: (conc: number) => void
}

export function DoseCalculator({ drug, onConcentrationChange }: DoseCalculatorProps) {
  const { weight } = useWeight()
  const [dose, setDose] = useState(drug.doseDefault)
  const [concentration, setConcentration] = useState(drug.concentration)
  const [editingMl, setEditingMl] = useState(false)
  const [editingDose, setEditingDose] = useState(false)
  const [mlValue, setMlValue] = useState('')
  const [doseValue, setDoseValue] = useState('')

  const mlh = weight ? doseToMlh(dose, weight, concentration, drug.factor, drug.usesWeight) : null
  const status = getDoseStatus(dose, drug.doseMin, drug.doseMax, drug.cautionThreshold, drug.criticalThreshold)
  const colors = statusColors[status]

  // Verificacao de consistencia servidor x local (1 chamada por droga, sem impacto no slider).
  // O calculo em tempo real e SEMPRE o local; o servidor so denuncia drift de formula.
  const { calcDose: serverCalcDose } = useServerCalc()
  const consistencyChecked = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!weight || consistencyChecked.current.has(drug.id)) return
    consistencyChecked.current.add(drug.id)
    serverCalcDose(drug.id, drug.doseDefault, weight).then(server => {
      if (!server) return
      const local = doseToMlh(drug.doseDefault, weight, drug.concentration, drug.factor, drug.usesWeight)
      if (local > 0 && Math.abs(server.mlh - local) / local > 0.005) {
        console.error('calc_divergencia_servidor_local', { drugId: drug.id, local, server: server.mlh })
      }
    })
  }, [drug, weight, serverCalcDose])

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
    <div>
      {/* Apresentacao */}
      <div className="bg-bg-elevated rounded-xl p-3.5 mb-3 border-l-[3px] border-info">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Diluição</div>
        <div className="text-sm text-text-secondary">{drug.presentation}</div>
        <div className="text-sm text-accent font-semibold mt-1">{fmt(concentration, 0)} {drug.concentrationUnit}</div>
      </div>

      {/* Diluições alternativas */}
      {drug.dilutions && drug.dilutions.length > 1 && (
        <div className="flex gap-2 mb-3">
          {drug.dilutions.map(d => (
            <button
              key={d.concentration}
              onClick={() => changeDilution(d.concentration)}
              className={`flex-1 py-2 px-2 rounded-xl text-sm font-medium border min-h-[44px] transition-colors ${
                concentration === d.concentration
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-elevated text-text-secondary border-border-card'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {/* Range */}
      <div className="bg-bg-hover rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between">
        <span className="text-sm text-text-muted">Range terapêutico</span>
        <span className="text-sm font-semibold text-text-secondary">
          {fmt(drug.doseMin, 2)} - {fmt(drug.doseMax, 1)} {drug.doseUnit}
        </span>
      </div>

      {/* Slider */}
      <div className="mb-2">
        <div className="text-sm text-text-muted mb-1.5">Dose ({drug.doseUnit})</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDose(Math.max(drug.doseMin, dose - drug.doseStep))}
            className="w-11 h-11 rounded-full border border-border-card bg-bg-elevated text-accent text-xl font-bold flex items-center justify-center cursor-pointer flex-shrink-0"
          >-</button>
          <input
            type="range"
            min={drug.doseMin} max={drug.doseMax} step={drug.doseStep}
            value={Math.min(drug.doseMax, Math.max(drug.doseMin, dose))}
            onChange={handleSliderChange}
            className="flex-1 accent-accent h-2"
          />
          <button
            onClick={() => setDose(Math.min(drug.doseMax, dose + drug.doseStep))}
            className="w-11 h-11 rounded-full border border-border-card bg-bg-elevated text-accent text-xl font-bold flex items-center justify-center cursor-pointer flex-shrink-0"
          >+</button>
        </div>
      </div>

      {/* Peso alert */}
      {!weight && (
        <div className="text-center text-sm text-warning py-4">Informe o peso do paciente</div>
      )}

      {/* Resultado */}
      {weight && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div
            className="rounded-xl p-4 text-center border-2"
            style={{ background: colors.bg, borderColor: colors.border }}
          >
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.text }}>Velocidade</div>
            <input
              type="text"
              inputMode="decimal"
              value={editingMl ? mlValue : (mlh !== null ? fmt(mlh, 1) : '--')}
              onChange={handleMlInput}
              onFocus={() => { setEditingMl(true); setMlValue(mlh !== null ? fmt(mlh, 1) : '') }}
              onBlur={() => setEditingMl(false)}
              className="w-full bg-transparent text-center text-[28px] font-bold border-b border-current outline-none"
              style={{ color: colors.text }}
            />
            <div className="text-sm mt-1" style={{ color: colors.text }}>mL/h</div>
          </div>
          <div
            className="rounded-xl p-4 text-center border-2"
            style={{ background: colors.bg, borderColor: colors.border }}
          >
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.text }}>Dose</div>
            <input
              type="text"
              inputMode="decimal"
              value={editingDose ? doseValue : fmt(dose, 2)}
              onChange={handleDoseInput}
              onFocus={() => { setEditingDose(true); setDoseValue(fmt(dose, 2)) }}
              onBlur={() => setEditingDose(false)}
              className="w-full bg-transparent text-center text-[28px] font-bold border-b border-current outline-none"
              style={{ color: colors.text }}
            />
            <div className="text-sm mt-1" style={{ color: colors.text }}>{drug.doseUnit}</div>
          </div>
        </div>
      )}
    </div>
  )
}
