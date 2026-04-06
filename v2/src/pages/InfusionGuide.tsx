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
  const { weight } = useWeight()
  const [search, setSearch] = useState('')
  const [openDrug, setOpenDrug] = useState<string | null>(null)
  const [gateOpen, setGateOpen] = useState(!!weight)

  const filteredDrugs = useMemo(() => {
    if (!search.trim()) return null
    return searchDrug(search)
  }, [search])

  const drugsByCategory = useMemo(() => getDrugsByCategory(), [])

  const categoryOrder: DrugCategory[] = ['vasopressors', 'sedation', 'neuromuscular', 'vasodilators', 'protocols']

  const fabItems = [
    { label: 'Vasopressores', onClick: () => setSearch('') },
    { label: 'Sedacao', onClick: () => setSearch('') },
    { label: 'BNM', onClick: () => setSearch('') },
    { label: 'Vasodilatadores', onClick: () => setSearch('') },
  ]

  // Gate de peso
  if (!gateOpen && !weight) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Disclaimer />
        <Header title="Calculadora de Infusoes" subtitle="Drogas vasoativas e sedacao" />
        <Container>
          <div className="text-center py-8">
            <div className="text-lg font-bold text-text-primary mb-2">Informe o peso do paciente</div>
            <div className="text-sm text-text-secondary mb-6">Necessario para calcular as doses</div>
            <WeightInput sticky={false} />
            <button
              onClick={() => { if (weight) setGateOpen(true) }}
              className={`mt-6 w-full py-4 rounded-xl font-semibold text-base min-h-[48px] transition-colors ${
                weight ? 'bg-accent text-white cursor-pointer' : 'bg-bg-elevated text-text-muted cursor-not-allowed'
              }`}
              disabled={!weight}
            >
              Confirmar peso
            </button>
          </div>
        </Container>
        <Footer toolName="Infusion Guide" version="v2.0.0" />
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="Calculadora de Infusoes" subtitle="Drogas vasoativas e sedacao" />
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
      <Footer toolName="Infusion Guide" version="v2.0.0" />
      <FABMenu items={fabItems} />
      <ToastContainer />
    </div>
  )
}
