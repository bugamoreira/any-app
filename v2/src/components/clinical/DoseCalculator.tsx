import { useState, useCallback, useEffect, useRef } from 'react'
import type { DrugConfig, DrugMode } from '../../types/clinical'
import { useWeight } from '../../contexts/WeightContext'
import { useServerCalc } from '../../hooks/useServerCalc'
import { doseToMlh, mlhToDose, getDoseStatus } from '../../utils/calculations'
import { fmt, fmtConc } from '../../utils/formatters'
import { AlertCard } from '../common/AlertCard'
import { useCustomDilution } from '../../hooks/useCustomDilution'
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

  // Diluicao do servico do usuario
  const { custom, save: saveCustom, clear: clearCustom } = useCustomDilution(drug.id)
  const [dilStep, setDilStep] = useState<'closed' | 'form' | 'confirm'>('closed')
  const [formAmps, setFormAmps] = useState('')
  const [formVol, setFormVol] = useState('')

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

  // Diluicao salva manda na concentracao assim que carrega do storage.
  useEffect(() => {
    if (custom) setConcentration(custom.concentration)
  }, [custom])

  const amp = drug.ampoule
  const nAmps = parseFloat(formAmps.replace(',', '.'))
  const volFinal = parseFloat(formVol.replace(',', '.'))
  const previewConc = amp && nAmps > 0 && volFinal > 0 ? (nAmps * amp.mass) / volFinal : null

  /** Barra erro grosseiro de digitacao sem impedir diluicao legitima. */
  function erroDoFormulario(): string | null {
    if (!amp) return null
    if (!(nAmps > 0)) return 'Informe quantas ampolas.'
    if (!(volFinal > 0)) return 'Informe o volume final em mL.'
    if (amp.volume !== undefined && volFinal < nAmps * amp.volume) {
      return `O volume final não pode ser menor que o volume das ampolas (${fmt(nAmps * amp.volume, 0)} mL).`
    }
    const c = (nAmps * amp.mass) / volFinal
    if (c < drug.concentration * 0.25 || c > drug.concentration * 4) {
      return `Resultado de ${fmtConc(c)} ${drug.concentrationUnit} — o padrão é ${fmtConc(drug.concentration)}. Confira as ampolas e o volume.`
    }
    return null
  }
  const erroDil = dilStep === 'form' ? erroDoFormulario() : null

  /** Preparo por extenso, para conferir contra a bolsa pendurada. */
  function preparoPorExtenso(a: number, v: number): string {
    return `${fmt(a, 0)} ${a === 1 ? 'ampola' : 'ampolas'} de ${amp?.label} em ${fmt(v, 0)} mL`
  }

  function abrirFormulario() {
    setFormAmps(custom ? String(custom.ampoules) : '')
    setFormVol(custom ? String(custom.volume) : '')
    setDilStep('form')
  }

  function confirmarDiluicao() {
    if (!previewConc || erroDoFormulario()) return
    setConcentration(previewConc)
    onConcentrationChange?.(previewConc)
    setDilStep('confirm')
  }

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

      {/* Apresentacao — muda de cara quando a diluicao e do servico do usuario */}
      <div
        className="bg-bg-elevated rounded-xl p-3.5 mb-3 border-l-[3px]"
        style={{ borderLeftColor: custom ? '#FF5252' : '#2196F3' }}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Diluição</div>
          {custom && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-muted text-accent">
              MINHA DILUIÇÃO
            </span>
          )}
        </div>
        <div className="text-sm text-text-secondary">
          {custom ? preparoPorExtenso(custom.ampoules, custom.volume) : drug.presentation}
        </div>
        <div className="text-sm text-accent font-semibold mt-1">
          {fmtConc(concentration)} {drug.concentrationUnit}
        </div>
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

      {/* Diluição do serviço do usuário — o v1 tinha isso só em midazolam e fentanil */}
      {amp && (
        <div className="mb-3">
          {dilStep === 'closed' && (
            <>
              <button
                onClick={abrirFormulario}
                className="w-full bg-transparent border border-dashed border-text-muted rounded-xl py-2 px-3 text-xs text-text-secondary min-h-[40px] cursor-pointer transition-colors active:border-accent active:text-accent"
              >
                {custom ? 'Editar minha diluição' : 'Alterar diluição para meu serviço'}
              </button>
              {custom && (
                <button
                  onClick={() => { clearCustom(); setConcentration(drug.concentration); onConcentrationChange?.(drug.concentration) }}
                  className="w-full bg-transparent border-none py-1.5 text-[11px] text-text-muted cursor-pointer underline"
                >
                  Restaurar padrão do ANY App
                </button>
              )}
            </>
          )}

          {dilStep === 'form' && (
            <div className="bg-bg-elevated rounded-xl p-3.5 border border-border-card">
              <div className="text-[13px] font-semibold text-text-primary mb-3">Diluição do meu serviço</div>

              <label className="block mb-3">
                <span className="text-xs text-text-muted">Ampolas de {amp.label}</span>
                <input
                  type="text" inputMode="decimal" value={formAmps} placeholder="5"
                  onChange={e => setFormAmps(e.target.value)}
                  className="w-full mt-1 bg-bg-hover border border-border-card rounded-lg px-3 py-2.5 text-text-primary text-base outline-none focus:border-accent"
                />
              </label>

              <label className="block mb-3">
                <span className="text-xs text-text-muted">Volume final (mL)</span>
                <input
                  type="text" inputMode="decimal" value={formVol} placeholder="250"
                  onChange={e => setFormVol(e.target.value)}
                  className="w-full mt-1 bg-bg-hover border border-border-card rounded-lg px-3 py-2.5 text-text-primary text-base outline-none focus:border-accent"
                />
              </label>

              {/* Prévia — sempre por extenso, para conferir contra a bolsa */}
              <div className="bg-bg-hover rounded-lg p-3 text-center mb-3">
                {previewConc ? (
                  <>
                    <div className="text-xs text-text-muted">{preparoPorExtenso(nAmps, volFinal)}</div>
                    <div className="text-xl font-bold text-accent mt-0.5">
                      {fmtConc(previewConc)} {drug.concentrationUnit}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-text-muted">Informe as ampolas e o volume final</div>
                )}
              </div>

              {erroDil && <div className="text-xs text-warning mb-3 leading-relaxed">{erroDil}</div>}

              <div className="flex gap-2">
                <button
                  onClick={() => setDilStep('closed')}
                  className="flex-1 min-h-[44px] rounded-xl border border-border-card bg-bg-hover text-text-secondary text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarDiluicao}
                  disabled={!previewConc || !!erroDil}
                  className="flex-1 min-h-[44px] rounded-xl border border-accent bg-accent text-white text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}

          {dilStep === 'confirm' && (
            <div className="bg-bg-elevated rounded-xl p-3.5 border border-accent">
              <div className="text-[13px] text-text-primary mb-3 leading-relaxed">
                Diluição aplicada. Tornar esta a minha diluição padrão neste aparelho?
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDilStep('closed')}
                  className="flex-1 min-h-[44px] rounded-xl border border-border-card bg-bg-hover text-text-secondary text-sm font-medium cursor-pointer"
                >
                  Só desta vez
                </button>
                <button
                  onClick={() => {
                    saveCustom({ ampoules: nAmps, volume: volFinal, concentration: previewConc! })
                    setDilStep('closed')
                  }}
                  className="flex-1 min-h-[44px] rounded-xl border border-accent bg-accent text-white text-sm font-semibold cursor-pointer"
                >
                  Sim, salvar
                </button>
              </div>
            </div>
          )}
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
