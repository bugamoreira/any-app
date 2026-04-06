import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
import { Collapsible } from '../components/common/Collapsible'
import { CALCULATOR_CATEGORIES, ALL_CALCULATORS } from '../data/calculatorData'
import type { Calculator, ScoreItem, InputField, SelectField } from '../data/calculatorData'

// ==========================================
// Componente de calculadora individual
// ==========================================

function CalculatorCard({ calc }: { calc: Calculator }) {
  const navigate = useNavigate()
  const [selections, setSelections] = useState<Record<string, number>>({})
  const [inputValues, setInputValues] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {}
    calc.inputs?.forEach(inp => {
      if (inp.defaultValue !== undefined) defaults[inp.id] = inp.defaultValue
    })
    calc.selects?.forEach(sel => {
      defaults[sel.id] = Number(sel.options[0].value)
    })
    return defaults
  })
  const [showResult, setShowResult] = useState(false)

  const handleItemSelect = useCallback((itemId: string, value: number) => {
    setSelections(prev => ({ ...prev, [itemId]: value }))
  }, [])

  const handleInputChange = useCallback((id: string, value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num)) {
      setInputValues(prev => ({ ...prev, [id]: num }))
    }
  }, [])

  const handleSelectChange = useCallback((id: string, value: string) => {
    setInputValues(prev => ({ ...prev, [id]: parseFloat(value) }))
  }, [])

  const score = useMemo(() => {
    if (calc.type === 'formula' && calc.formula) {
      const allValues = { ...inputValues, ...selections }
      // Check required inputs
      const allInputsFilled = calc.inputs?.every(inp => allValues[inp.id] !== undefined) ?? true
      if (!allInputsFilled) return null
      return calc.formula(allValues)
    }
    // Score or classification
    if (calc.items && calc.items.length > 0) {
      const allSelected = calc.items.every(item => selections[item.id] !== undefined)
      if (!allSelected) return null
      return calc.items.reduce((sum, item) => sum + (selections[item.id] || 0), 0)
    }
    return null
  }, [selections, inputValues, calc])

  const interpretation = useMemo(() => {
    if (score === null) return null
    const allValues = { ...inputValues, ...selections }
    return calc.interpret(score, allValues)
  }, [score, calc, inputValues, selections])

  const handleCalculate = () => {
    setShowResult(true)
  }

  const handleReset = () => {
    setSelections({})
    setInputValues(() => {
      const defaults: Record<string, number> = {}
      calc.inputs?.forEach(inp => {
        if (inp.defaultValue !== undefined) defaults[inp.id] = inp.defaultValue
      })
      calc.selects?.forEach(sel => {
        defaults[sel.id] = Number(sel.options[0].value)
      })
      return defaults
    })
    setShowResult(false)
  }

  return (
    <Collapsible
      title={calc.name}
      badge={calc.availableIn ? `Em ${calc.availableIn.tool}` : undefined}
      badgeColor={calc.availableIn ? '#2196F3' : undefined}
    >
      {/* Descricao */}
      <p className="text-xs text-text-secondary mb-3">{calc.description}</p>

      {/* Badge: disponivel em outro tool */}
      {calc.availableIn && (
        <button
          onClick={() => navigate(calc.availableIn!.route)}
          className="w-full mb-3 py-2.5 px-3 bg-info/10 border border-info/30 rounded-lg text-info text-xs font-medium text-center"
        >
          Abrir no {calc.availableIn.tool}
        </button>
      )}

      {/* Inputs numericos */}
      {calc.inputs && calc.inputs.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {calc.inputs.map((inp: InputField) => (
            <div key={inp.id}>
              <label className="text-xs text-text-secondary block mb-1">
                {inp.label} {inp.unit && <span className="text-text-muted">({inp.unit})</span>}
              </label>
              <input
                type="number"
                inputMode={inp.inputMode || 'decimal'}
                min={inp.min}
                max={inp.max}
                step={inp.step}
                value={inputValues[inp.id] ?? ''}
                onChange={e => handleInputChange(inp.id, e.target.value)}
                className="w-full bg-bg-elevated border border-border-card rounded-lg px-3 py-2.5 text-sm text-text-primary"
                placeholder={`${inp.min} - ${inp.max}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Selects */}
      {calc.selects && calc.selects.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {calc.selects.map((sel: SelectField) => (
            <div key={sel.id}>
              <label className="text-xs text-text-secondary block mb-1">{sel.label}</label>
              <select
                value={inputValues[sel.id] ?? sel.options[0].value}
                onChange={e => handleSelectChange(sel.id, e.target.value)}
                className="w-full bg-bg-elevated border border-border-card rounded-lg px-3 py-2.5 text-sm text-text-primary appearance-none"
              >
                {sel.options.map((opt, i) => (
                  <option key={i} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Items (score clickaveis) */}
      {calc.items && calc.items.length > 0 && (
        <div className="space-y-3 mb-3">
          {calc.items.map((item: ScoreItem) => (
            <div key={item.id}>
              <label className="text-xs font-medium text-text-primary block mb-1.5">{item.label}</label>
              <div className="space-y-1">
                {item.options.map((opt, oi) => {
                  const isSelected = selections[item.id] === opt.value
                  return (
                    <button
                      key={oi}
                      onClick={() => handleItemSelect(item.id, opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                        isSelected
                          ? 'bg-accent/20 text-accent border border-accent/40'
                          : 'bg-bg-elevated text-text-secondary border border-border-card'
                      }`}
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

      {/* Botao calcular */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleCalculate}
          disabled={score === null}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors bg-accent text-white disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          Calcular
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-bg-elevated text-text-secondary border border-border-card min-h-[44px]"
        >
          Limpar
        </button>
      </div>

      {/* Resultado */}
      {showResult && interpretation && (
        <div
          className="p-3 rounded-lg border-l-4 mb-3"
          style={{
            borderLeftColor: interpretation.color,
            background: `${interpretation.color}11`
          }}
        >
          <div className="text-sm font-semibold mb-1" style={{ color: interpretation.color }}>
            {interpretation.label}
          </div>
          <div className="text-xs text-text-secondary leading-relaxed">
            {interpretation.action}
          </div>
        </div>
      )}

      {/* Info colapsaveis: Why, When to use, Pearls & Pitfalls */}
      <details className="mb-2 group">
        <summary className="text-xs font-medium text-text-muted cursor-pointer py-1.5 list-none flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-90"><polyline points="9 6 15 12 9 18"/></svg>
          Por que usar
        </summary>
        <p className="text-xs text-text-secondary mt-1 pl-4 leading-relaxed">{calc.why}</p>
      </details>

      <details className="mb-2 group">
        <summary className="text-xs font-medium text-text-muted cursor-pointer py-1.5 list-none flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-90"><polyline points="9 6 15 12 9 18"/></svg>
          Quando usar
        </summary>
        <p className="text-xs text-text-secondary mt-1 pl-4 leading-relaxed">{calc.whenToUse}</p>
      </details>

      <details className="mb-2 group">
        <summary className="text-xs font-medium text-text-muted cursor-pointer py-1.5 list-none flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-90"><polyline points="9 6 15 12 9 18"/></svg>
          Dicas e armadilhas
        </summary>
        <ul className="mt-1 pl-4 space-y-1">
          {calc.pearlsPitfalls.map((p, i) => (
            <li key={i} className="text-xs text-text-secondary leading-relaxed flex gap-1.5">
              <span className="text-text-muted mt-0.5 shrink-0">-</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </details>

      <details className="group">
        <summary className="text-xs font-medium text-text-muted cursor-pointer py-1.5 list-none flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-90"><polyline points="9 6 15 12 9 18"/></svg>
          Referencia
        </summary>
        <p className="text-xs text-text-muted mt-1 pl-4 leading-relaxed italic">{calc.reference}</p>
      </details>
    </Collapsible>
  )
}

// ==========================================
// Pagina principal
// ==========================================

export default function Calculators() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CALCULATOR_CATEGORIES

    const q = search.toLowerCase().trim()
    return CALCULATOR_CATEGORIES
      .map(cat => ({
        ...cat,
        calculators: cat.calculators.filter(calc =>
          calc.name.toLowerCase().includes(q) ||
          calc.aliases.some(a => a.toLowerCase().includes(q)) ||
          calc.category.toLowerCase().includes(q) ||
          calc.description.toLowerCase().includes(q)
        )
      }))
      .filter(cat => cat.calculators.length > 0)
  }, [search])

  const totalCount = useMemo(() => ALL_CALCULATORS.length, [])

  const fabItems = [
    { label: 'Voltar ao Hub', onClick: () => navigate('/') },
    { label: 'Limpar busca', onClick: () => setSearch('') }
  ]

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="Calculadoras" subtitle={`${totalCount} scores e formulas clinicas`} />

      <Container>
        {/* Campo de busca */}
        <div className="mb-4 sticky top-[42px] z-40 bg-bg-primary pb-2 pt-1 -mx-4 px-4">
          <div className="relative">
            <svg
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, alias ou categoria..."
              className="w-full bg-bg-elevated border border-border-card rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted p-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          {search && (
            <div className="text-xs text-text-muted mt-1.5 ml-1">
              {filteredCategories.reduce((sum, c) => sum + c.calculators.length, 0)} resultado(s)
            </div>
          )}
        </div>

        {/* Grid por categorias */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-text-muted">Nenhuma calculadora encontrada para "{search}"</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCategories.map(cat => (
              <div key={cat.id}>
                {/* Header da categoria */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-5 rounded-full" style={{ background: cat.color }} />
                  <h2 className="text-sm font-semibold text-text-primary">{cat.name}</h2>
                  <span className="text-[10px] text-text-muted">({cat.calculators.length})</span>
                </div>

                {/* Cards de calculadoras */}
                <div className="space-y-0">
                  {cat.calculators.map(calc => (
                    <CalculatorCard key={calc.id} calc={calc} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      <Footer toolName="Calculadoras" version="v1.0.0" />
      <FABMenu items={fabItems} />
    </div>
  )
}
