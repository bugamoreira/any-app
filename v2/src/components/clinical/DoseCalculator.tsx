import { useState, useCallback, useEffect, useRef } from 'react'
import type { DrugConfig, DrugMode } from '../../types/clinical'
import { useWeight } from '../../contexts/WeightContext'
import { useServerCalc } from '../../hooks/useServerCalc'
import { doseToMlh, mlhToDose, getDoseStatus } from '../../utils/calculations'
import { fmt } from '../../utils/formatters'
import { AlertCard } from '../common/AlertCard'
import { statusColors } from '../../utils/formatters'

interface DoseCalculatorProps {
  drug: DrugConfig
  onConcentrationChange?: (conc: number) => void
}

export function DoseCalculator({ drug, onConcentrationChange }: DoseCalculatorProps) {
  const { weight } = useWeight()
  const [modeId, setModeId] = useState(drug.modes?.[0]?.id ?? null)
  const [dose, setDose] = useState(drug.modes?.[0]?.doseDefault ?? drug.doseDefault)
  const [concentration, setConcentration] = useState(drug.concentration)
  const [editingMl, setEditingMl] = useState(false)
  const [editingDose, setEditingDose] = useState(false)
  const [mlValue, setMlValue] = useState('')
  const [doseValue, setDoseValue] = useState('')

  // O modo ativo manda na faixa do slider E nas faixas de cor. Sem modos,
  // tudo cai nos valores da propria droga — as outras onze nao mudam em nada.
  const mode = drug.modes?.find(m => m.id === modeId) ?? drug.modes?.[0] ?? null
  const doseMin = mode?.doseMin ?? drug.doseMin
  const doseMax = mode?.doseMax ?? drug.doseMax
  const doseStep = mode?.doseStep ?? drug.doseStep
  const caution = mode?.cautionThreshold ?? drug.cautionThreshold
  const critical = mode?.criticalThreshold ?? drug.criticalThreshold
  const rangeLabel = mode?.rangeLabel ?? `${fmt(drug.doseMin, 2)} - ${fmt(drug.doseMax, 1)} ${drug.doseUnit}`

  const mlh = weight ? doseToMlh(dose, weight, concentration, drug.factor, drug.usesWeight) : null
  const status = getDoseStatus(dose, doseMin, doseMax, caution, critical)
  const colors = statusColors[status]

  function changeMode(m: DrugMode) {
    setModeId(m.id)
    setDose(m.doseDefault)
  }

  /** "Este paciente" da caixa de bolus, respeitando o teto por bolus. */
  function bolusParaPaciente(): string | null {
    const b = mode?.bolus
    if (!b || !weight) return null
    const u = b.unit ?? 'mg'
    const cap = (v: number) => (b.capPerBolus !== undefined ? Math.min(v, b.capPerBolus) : v)
    if (b.perKg !== undefined) return `${fmt(cap(b.perKg * weight), 0)} ${u}`
    if (b.perKgRange) {
      const [lo, hi] = b.perKgRange
      return `${fmt(cap(lo * weight), 0)} - ${fmt(cap(hi * weight), 0)} ${u}`
    }
    return null
  }

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
      {/* Modos por indicacao — so nas drogas que tem (v1: mode-btn) */}
      {drug.modes && drug.modes.length > 1 && (
        <div className="flex gap-2 mb-3">
          {drug.modes.map(m => (
            <button
              key={m.id}
              onClick={() => changeMode(m)}
              className={`flex-1 py-2 px-2 rounded-xl text-sm font-medium border min-h-[44px] transition-colors ${
                mode?.id === m.id
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-elevated text-text-secondary border-border-card'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

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
        <span className="text-sm font-semibold text-text-secondary">{rangeLabel}</span>
      </div>

      {/* Slider */}
      <div className="mb-2">
        <div className="text-sm text-text-muted mb-1.5">Dose ({drug.doseUnit})</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDose(Math.max(doseMin, Number((dose - doseStep).toFixed(4))))}
            className="w-11 h-11 rounded-full border border-border-card bg-bg-elevated text-accent text-xl font-bold flex items-center justify-center cursor-pointer flex-shrink-0"
          >-</button>
          <input
            type="range"
            min={doseMin} max={doseMax} step={doseStep}
            value={Math.min(doseMax, Math.max(doseMin, dose))}
            onChange={handleSliderChange}
            className="flex-1 accent-accent h-2"
          />
          <button
            onClick={() => setDose(Math.min(doseMax, Number((dose + doseStep).toFixed(4))))}
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

      {/* Bolus de ataque do modo ativo (v1: info-box warning que aparecia com .show) */}
      {mode?.bolus && (
        <AlertCard type="warning" title={mode.bolus.title} className="mt-3">
          {mode.bolus.rows.map(r => (
            <div key={r.label} className="flex justify-between gap-3 py-0.5">
              <span className="text-text-muted">{r.label}</span>
              <span className="text-text-primary font-medium text-right">{r.value}</span>
            </div>
          ))}
          {bolusParaPaciente() && (
            <div className="flex justify-between gap-3 py-0.5 mt-1 pt-1.5 border-t border-white/10">
              <span className="text-text-muted">Este paciente</span>
              <span className="font-bold text-right" style={{ color: '#FFD740' }}>{bolusParaPaciente()}</span>
            </div>
          )}
        </AlertCard>
      )}
    </div>
  )
}
