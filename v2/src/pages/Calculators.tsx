import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
import { Collapsible } from '../components/common/Collapsible'
import { useWeight } from '../contexts/WeightContext'
import { CALCULATOR_CATEGORIES, ALL_CALCULATORS } from '../data/calculatorData'
import type { Calculator, ScoreItem, InputField, SelectField } from '../data/calculatorData'

// ==========================================
// Favoritos — localStorage
// ==========================================

const FAV_KEY = 'any-app-calc-favorites'
function loadFavs(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]') } catch { return [] }
}
function saveFavs(ids: string[]) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(ids)) } catch { /* */ }
}

// ==========================================
// Estrela de favorito
// ==========================================

function Star({ on, toggle }: { on: boolean; toggle: () => void }) {
  return (
    <button onClick={e => { e.stopPropagation(); toggle() }} className="p-3 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Favorito">
      <svg width="20" height="20" viewBox="0 0 24 24" fill={on ? '#FFC107' : 'none'} stroke={on ? '#FFC107' : '#555'} strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  )
}

// ==========================================
// Calculadora individual — abre em tela cheia
// ==========================================

function CalcDetail({ calc, onBack, isFav, toggleFav }: {
  calc: Calculator; onBack: () => void; isFav: boolean; toggleFav: () => void
}) {
  const navigate = useNavigate()
  const [selections, setSelections] = useState<Record<string, number>>({})
  const [inputValues, setInputValues] = useState<Record<string, number>>(() => {
    const d: Record<string, number> = {}
    calc.inputs?.forEach(inp => { if (inp.defaultValue !== undefined) d[inp.id] = inp.defaultValue })
    calc.selects?.forEach(sel => { d[sel.id] = Number(sel.options[0].value) })
    return d
  })
  const [showResult, setShowResult] = useState(false)

  const score = useMemo(() => {
    if (calc.type === 'formula' && calc.formula) {
      const all = { ...inputValues, ...selections }
      if (!(calc.inputs?.every(inp => all[inp.id] !== undefined) ?? true)) return null
      return calc.formula(all)
    }
    if (calc.items && calc.items.length > 0) {
      if (!calc.items.every(item => selections[item.id] !== undefined)) return null
      return calc.items.reduce((s, item) => s + (selections[item.id] || 0), 0)
    }
    return null
  }, [selections, inputValues, calc])

  // Auto-show result when all score items are selected (e.g. Fisher)
  useEffect(() => {
    if (score !== null && !showResult) {
      setShowResult(true)
    }
  }, [score]) // eslint-disable-line react-hooks/exhaustive-deps

  const interp = useMemo(() => {
    if (score === null) return null
    return calc.interpret(score, { ...inputValues, ...selections })
  }, [score, calc, inputValues, selections])

  const reset = () => {
    setSelections({})
    setInputValues(() => {
      const d: Record<string, number> = {}
      calc.inputs?.forEach(inp => { if (inp.defaultValue !== undefined) d[inp.id] = inp.defaultValue })
      calc.selects?.forEach(sel => { d[sel.id] = Number(sel.options[0].value) })
      return d
    })
    setShowResult(false)
  }

  return (
    <div className="animate-slide-left">
      {/* Header da calculadora */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} aria-label="Voltar" className="p-2 rounded-xl bg-bg-elevated border border-border-card min-h-[44px] min-w-[44px] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-text-primary truncate">{calc.name}</h2>
          <p className="text-sm text-text-secondary truncate">{calc.description}</p>
        </div>
        <Star on={isFav} toggle={toggleFav} />
      </div>

      {/* Link para ferramenta */}
      {calc.availableIn && (
        <button
          onClick={() => navigate(calc.availableIn!.route)}
          className="w-full mb-4 py-3 bg-info/10 border border-info/30 rounded-xl text-info text-sm font-medium text-center min-h-[48px]"
        >
          Abrir no {calc.availableIn.tool}
        </button>
      )}

      {/* Inputs */}
      {calc.inputs && calc.inputs.length > 0 && (
        <div className="space-y-3 mb-4">
          {calc.inputs.map((inp: InputField) => (
            <div key={inp.id} className="bg-bg-card border border-border-card rounded-xl p-4">
              <label className="text-sm text-text-secondary block mb-2">
                {inp.label} {inp.unit && <span className="text-text-muted">({inp.unit})</span>}
              </label>
              <input
                type="number"
                inputMode={inp.inputMode || 'decimal'}
                min={inp.min} max={inp.max} step={inp.step}
                value={inputValues[inp.id] ?? ''}
                onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n)) setInputValues(p => ({ ...p, [inp.id]: n })) }}
                className="w-full bg-bg-elevated border border-border-card rounded-xl px-4 py-3 text-lg font-semibold text-accent min-h-[52px]"
                placeholder={`${inp.min} - ${inp.max}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Selects */}
      {calc.selects && calc.selects.length > 0 && (
        <div className="space-y-3 mb-4">
          {calc.selects.map((sel: SelectField) => (
            <div key={sel.id} className="bg-bg-card border border-border-card rounded-xl p-4">
              <label className="text-sm text-text-secondary block mb-2">{sel.label}</label>
              <select
                value={inputValues[sel.id] ?? sel.options[0].value}
                onChange={e => setInputValues(p => ({ ...p, [sel.id]: parseFloat(e.target.value) }))}
                className="w-full bg-bg-elevated border border-border-card rounded-xl px-4 py-3 text-sm text-text-primary appearance-none min-h-[48px]"
              >
                {sel.options.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Score items */}
      {calc.items && calc.items.length > 0 && (
        <div className="mb-4">
          {calc.items.map((item: ScoreItem) => (
            <div key={item.id}>
              <div className="font-semibold text-text-primary border-b border-border-card pb-2 mb-3 mt-4">{item.label}</div>
              <div className="space-y-2">
                {item.options.map((opt, oi) => {
                  const sel = selections[item.id] === opt.value
                  return (
                    <button
                      key={oi}
                      onClick={() => setSelections(p => ({ ...p, [item.id]: opt.value }))}
                      className={`w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all min-h-[48px] ${
                        sel
                          ? 'bg-accent/10 text-accent border-2 border-accent font-semibold'
                          : 'bg-bg-card text-text-secondary border border-border-card'
                      } shadow-sm active:scale-[0.98]`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botoes */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setShowResult(true)}
          disabled={score === null}
          className="flex-1 py-3.5 rounded-xl text-base font-bold bg-accent text-white disabled:opacity-30 min-h-[56px]"
        >
          Calcular
        </button>
        <button onClick={reset} className="flex-1 py-3.5 rounded-xl text-sm font-medium bg-bg-elevated text-text-secondary border border-border-card min-h-[56px]">
          Limpar
        </button>
      </div>

      {/* Resultado */}
      {showResult && interp && (
        <div
          className="p-5 rounded-xl border-l-4 mb-6 animate-fade-in"
          style={{ borderLeftColor: interp.color, background: `${interp.color}22` }}
        >
          <div className="text-lg font-bold mb-2" style={{ color: interp.color }}>{interp.label}</div>
          <div className="text-sm text-text-secondary leading-relaxed">{interp.action}</div>
        </div>
      )}

      {/* Info */}
      <div className="bg-bg-card border border-border-card rounded-xl p-4 space-y-0">
        {[
          { t: 'Por que usar', c: calc.why },
          { t: 'Quando usar', c: calc.whenToUse },
        ].map((info, i) => (
          <details key={i} className="group border-b border-border-card last:border-0">
            <summary className="text-[15px] font-semibold text-text-secondary cursor-pointer py-3 list-none flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-90 shrink-0"><polyline points="9 6 15 12 9 18"/></svg>
              {info.t}
            </summary>
            <p className="text-sm text-text-secondary pb-3 pl-6 leading-relaxed">{info.c}</p>
          </details>
        ))}
        <details className="group border-b border-border-card">
          <summary className="text-[15px] font-semibold text-text-secondary cursor-pointer py-3 list-none flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-90 shrink-0"><polyline points="9 6 15 12 9 18"/></svg>
            Dicas e armadilhas
          </summary>
          <ul className="pb-3 pl-6 space-y-1.5">
            {calc.pearlsPitfalls.map((p, i) => (
              <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                <span className="text-accent shrink-0">-</span><span>{p}</span>
              </li>
            ))}
          </ul>
        </details>
        <details className="group">
          <summary className="text-[15px] font-semibold text-text-secondary cursor-pointer py-3 list-none flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-90 shrink-0"><polyline points="9 6 15 12 9 18"/></svg>
            Referência
          </summary>
          <p className="text-sm text-text-muted pb-3 pl-6 leading-relaxed italic">{calc.reference}</p>
        </details>
      </div>
    </div>
  )
}

// ==========================================
// Weight gate
// ==========================================

function WeightGate({ onContinue }: { onContinue: () => void }) {
  const { weight, setWeight } = useWeight()
  const [val, setVal] = useState(weight ? String(weight) : '')

  function submit() {
    const v = parseFloat(val)
    if (!isNaN(v) && v >= 1 && v <= 300) { setWeight(v); onContinue() }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-[400px] mx-auto text-center animate-fade-in">
      <h2 className="text-xl font-bold text-text-primary mb-2">Peso do paciente</h2>
      <p className="text-sm text-text-secondary mb-8">Algumas calculadoras dependem do peso para o cálculo. Informe para continuar.</p>
      <div className="flex items-center gap-3 mb-6">
        <input
          type="number" inputMode="decimal" value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="70" autoFocus
          className="w-32 bg-bg-elevated border-2 border-border-card rounded-xl text-center text-3xl font-bold text-accent py-4 focus:border-accent outline-none"
        />
        <span className="text-lg text-text-secondary font-medium">kg</span>
      </div>
      <button
        onClick={submit}
        disabled={!val || isNaN(parseFloat(val)) || parseFloat(val) < 1}
        className="w-full max-w-[280px] mt-4 py-4 rounded-xl text-base font-semibold bg-accent text-white disabled:opacity-30 min-h-[56px]"
      >
        Acessar calculadoras
      </button>
      {weight && (
        <button onClick={onContinue} className="mt-4 text-sm text-text-muted underline">
          Usar peso anterior ({weight} kg)
        </button>
      )}
    </div>
  )
}

// ==========================================
// Lista de calculadoras (tela principal)
// ==========================================

function CalcList({ onSelect, favorites, toggleFav, search, setSearch }: {
  onSelect: (c: Calculator) => void
  favorites: string[]; toggleFav: (id: string) => void
  search: string; setSearch: (s: string) => void
}) {
  const { weight } = useWeight()

  const favCalcs = useMemo(() =>
    favorites.map(id => ALL_CALCULATORS.find(c => c.id === id)).filter((c): c is Calculator => !!c),
    [favorites]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return CALCULATOR_CATEGORIES
    const q = search.toLowerCase().trim()
    return CALCULATOR_CATEGORIES
      .map(cat => ({
        ...cat,
        calculators: cat.calculators.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.aliases.some(a => a.toLowerCase().includes(q)) ||
          c.description.toLowerCase().includes(q)
        )
      }))
      .filter(cat => cat.calculators.length > 0)
  }, [search])

  const isSearching = search.trim().length > 0
  const resultCount = filtered.reduce((s, c) => s + c.calculators.length, 0)

  function CalcRow({ calc }: { calc: Calculator }) {
    return (
      <button
        onClick={() => onSelect(calc)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-bg-card border border-border-card rounded-xl mb-2 text-left active:bg-bg-hover transition-colors min-h-[60px]"
      >
        <Star on={favorites.includes(calc.id)} toggle={() => toggleFav(calc.id)} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-text-primary truncate">{calc.name}</div>
          <div className="text-xs text-text-muted truncate mt-0.5">{calc.description}</div>
        </div>
        {calc.availableIn && (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-info/15 text-info shrink-0">
            {calc.availableIn.tool}
          </span>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" className="shrink-0"><polyline points="9 6 15 12 9 18"/></svg>
      </button>
    )
  }

  return (
    <>
      {/* Peso atual */}
      <div className="flex items-center justify-between bg-bg-card border border-border-card rounded-xl px-4 py-3 mb-4">
        <span className="text-sm text-text-secondary">
          Peso: <span className="text-accent font-bold text-lg">{weight}</span> <span className="text-text-muted">kg</span>
        </span>
      </div>

      {/* Busca */}
      <div className="mb-4 sticky top-[42px] z-40 bg-bg-primary pb-2 pt-1">
        <div className="relative">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar score ou calculadora..."
            className="w-full bg-bg-elevated border border-border-card rounded-xl pl-[52px] pr-12 py-3.5 text-[15px] text-text-primary placeholder:text-text-muted min-h-[52px]"
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Limpar busca" className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        {isSearching && <div className="text-xs text-text-muted mt-2 ml-1">{resultCount} resultado(s)</div>}
      </div>

      {/* Favoritos */}
      {!isSearching && favCalcs.length > 0 && (
        <Collapsible title="Favoritos" badge={String(favCalcs.length)} badgeColor="#FFC107" defaultOpen={true}>
          {favCalcs.map(c => <CalcRow key={`f-${c.id}`} calc={c} />)}
        </Collapsible>
      )}

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-text-muted">Nenhuma calculadora encontrada</p>
        </div>
      ) : isSearching ? (
        <div>
          {filtered.flatMap(cat => cat.calculators.map(c => <CalcRow key={c.id} calc={c} />))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(cat => (
            <Collapsible key={cat.id} title={cat.name} badge={String(cat.calculators.length)} badgeColor={cat.color}>
              {cat.calculators.map(c => <CalcRow key={c.id} calc={c} />)}
            </Collapsible>
          ))}
        </div>
      )}
    </>
  )
}

// ==========================================
// Pagina principal — 3 telas
// ==========================================

export default function Calculators() {
  const { weight } = useWeight()
  const [gateOk, setGateOk] = useState(weight !== null)
  const [selected, setSelected] = useState<Calculator | null>(null)
  const [search, setSearch] = useState('')
  const [favs, setFavs] = useState<string[]>(loadFavs)
  const navigate = useNavigate()

  useEffect(() => { saveFavs(favs) }, [favs])

  const toggleFav = useCallback((id: string) => {
    setFavs(p => p.includes(id) ? p.filter(f => f !== id) : p.length >= 15 ? p : [...p, id])
  }, [])

  const fabItems = [
    { label: 'Voltar ao Hub', onClick: () => navigate('/') },
    ...(search ? [{ label: 'Limpar busca', onClick: () => setSearch('') }] : []),
    ...(favs.length > 0 ? [{ label: 'Limpar favoritos', onClick: () => setFavs([]) }] : []),
  ]

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="Calculadoras" subtitle={`${ALL_CALCULATORS.length} scores e ferramentas clínicas`} />

      {!gateOk ? (
        <WeightGate onContinue={() => setGateOk(true)} />
      ) : (
        <Container>
          {selected ? (
            <CalcDetail
              calc={selected}
              onBack={() => setSelected(null)}
              isFav={favs.includes(selected.id)}
              toggleFav={() => toggleFav(selected.id)}
            />
          ) : (
            <CalcList
              onSelect={setSelected}
              favorites={favs}
              toggleFav={toggleFav}
              search={search}
              setSearch={setSearch}
            />
          )}
        </Container>
      )}

      <Footer toolName="Calculadoras" version="v1.2.0" updatedAt="Abril 2026" />
      <FABMenu items={fabItems} />
    </div>
  )
}
