import { useState, useMemo } from 'react'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
import { Collapsible } from '../components/common/Collapsible'
import { WeightInput } from '../components/common/WeightInput'
import { ToastContainer } from '../components/common/Toast'
import { DoseCalculator } from '../components/clinical/DoseCalculator'
import { useWeight } from '../contexts/WeightContext'
import { getDrugsByCategory, searchDrug, categoryLabels } from '../data/drugConfigs'
import type { DrugCategory } from '../types/clinical'

export default function InfusionGuide() {
  const { weight, setWeight } = useWeight()
  const [search, setSearch] = useState('')
  const [openDrug, setOpenDrug] = useState<string | null>(null)
  const [gateWeight, setGateWeight] = useState('')
  const [gateError, setGateError] = useState('')
  const savedWeight = typeof window !== 'undefined' ? localStorage.getItem('anyapp-peso') : null

  const filteredDrugs = useMemo(() => {
    if (!search.trim()) return null
    return searchDrug(search)
  }, [search])

  const drugsByCategory = useMemo(() => getDrugsByCategory(), [])

  const categoryOrder: DrugCategory[] = ['vasopressors', 'sedation', 'neuromuscular', 'vasodilators', 'protocols']

  const fabItems = [
    { label: 'Vasopressores', onClick: () => setSearch('') },
    { label: 'Sedação', onClick: () => setSearch('') },
    { label: 'BNM', onClick: () => setSearch('') },
    { label: 'Vasodilatadores', onClick: () => setSearch('') },
  ]

  function handleConfirmWeight() {
    const val = parseFloat(gateWeight)
    if (isNaN(val) || val < 40 || val > 200) {
      setGateError('Peso deve ser entre 40 e 200 kg')
      return
    }
    setGateError('')
    setWeight(val)
  }

  // Gate de peso
  if (!weight) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Disclaimer />
        <Header title="Calculadora de Infusões" subtitle="Drogas vasoativas e sedação" />
        <Container>
          <div className="bg-bg-card border border-border-card rounded-xl p-6 max-w-[400px] mx-auto mt-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-text-primary">Peso do paciente</span>
              <span className="text-accent text-sm font-semibold">Obrigatório</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                inputMode="decimal"
                value={gateWeight}
                onChange={e => { setGateWeight(e.target.value); setGateError('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleConfirmWeight() }}
                placeholder="70"
                className="flex-1 bg-bg-elevated border border-border-card rounded-xl py-4 text-center text-3xl font-bold text-accent placeholder:text-text-muted/40 outline-none focus:border-accent transition-colors"
              />
              <span className="text-lg font-semibold text-text-secondary">kg</span>
            </div>
            <p className="text-sm text-text-muted text-center mt-2">Adultos: 40-200 kg</p>
            {gateError && <p className="text-sm text-danger text-center mt-2">{gateError}</p>}
            <button
              onClick={handleConfirmWeight}
              className="mt-4 w-full bg-accent text-white rounded-xl py-4 text-base font-semibold min-h-[56px] cursor-pointer active:opacity-80 transition-opacity"
            >
              Confirmar peso
            </button>
            {savedWeight && (
              <button
                onClick={() => {
                  const val = parseFloat(savedWeight)
                  if (!isNaN(val) && val >= 40 && val <= 200) setWeight(val)
                }}
                className="mt-3 w-full border border-border-card text-text-secondary rounded-xl py-3 text-sm font-medium min-h-[44px] cursor-pointer active:opacity-80 transition-opacity bg-transparent"
              >
                Recuperar ultimo peso ({savedWeight} kg)
              </button>
            )}
          </div>
        </Container>
        <Footer toolName="Infusion Guide" version="v2.0.0" updatedAt="Abril 2026" />
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="Calculadora de Infusões" subtitle="Drogas vasoativas e sedação" />
      <WeightInput />
      <Container>
        {/* Busca */}
        <div className="sticky top-[66px] z-30 bg-bg-primary pb-2 pt-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar droga..."
            className="w-full bg-bg-elevated border border-border-card rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted"
            autoComplete="off"
          />
        </div>

        {/* Resultados da busca */}
        {filteredDrugs ? (
          <div>
            {filteredDrugs.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-sm">Nenhuma droga encontrada</div>
            ) : (
              filteredDrugs.map(drug => (
                <div key={drug.id} className="mb-3">
                  <button
                    onClick={() => setOpenDrug(openDrug === drug.id ? null : drug.id)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-bg-card border border-border-card rounded-xl text-left cursor-pointer min-h-[44px]"
                  >
                    <span className="font-semibold text-sm text-text-primary">{drug.name}</span>
                    <span className={`text-text-muted transition-transform ${openDrug === drug.id ? 'rotate-90' : ''}`}>›</span>
                  </button>
                  {openDrug === drug.id && (
                    <div className="mt-2 px-2">
                      <DoseCalculator drug={drug} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Categorias */
          <div>
            {categoryOrder.map(cat => {
              const drugs = drugsByCategory[cat]
              if (!drugs || drugs.length === 0) return null
              return (
                <Collapsible key={cat} title={categoryLabels[cat]} badge={`${drugs.length}`} badgeColor="#FF5252">
                  {drugs.map(drug => (
                    <div key={drug.id} className="mb-3">
                      <button
                        onClick={() => setOpenDrug(openDrug === drug.id ? null : drug.id)}
                        className="flex items-center justify-between w-full px-3 py-3 bg-bg-hover rounded-lg text-left cursor-pointer min-h-[44px] transition-colors"
                      >
                        <span className="font-medium text-sm text-text-primary">{drug.name}</span>
                        <span className={`text-text-muted transition-transform ${openDrug === drug.id ? 'rotate-90' : ''}`}>›</span>
                      </button>
                      {openDrug === drug.id && (
                        <div className="mt-2">
                          <DoseCalculator drug={drug} />
                        </div>
                      )}
                    </div>
                  ))}
                </Collapsible>
              )
            })}
          </div>
        )}
      </Container>
      <Footer toolName="Infusion Guide" version="v2.0.0" updatedAt="Abril 2026" />
      <FABMenu items={fabItems} />
      <ToastContainer />
    </div>
  )
}
