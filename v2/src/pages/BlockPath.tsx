import { useState, useMemo } from 'react'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Collapsible } from '../components/common/Collapsible'
import { AlertCard } from '../components/common/AlertCard'
import { ToastContainer } from '../components/common/Toast'
import { useToast } from '../contexts/ToastContext'

// ==========================================
// DADOS
// ==========================================

interface BlockData {
  id: string
  name: string
  region: string
  volume: string
  type: string
  indications: string[]
  contraindications: string[]
  material: string[]
  technique: string[]
  tip?: { title: string; text: string }
  anesthetics: { drug: string; conc: string; vol: string }[]
}

interface TopoItem {
  lesion: string
  blockId: string
  blockName: string
}

interface TopoCategory {
  title: string
  items: TopoItem[]
}

const topography: TopoCategory[] = [
  { title: 'Pescoco / Clavicula', items: [
    { lesion: 'Fratura de clavicula', blockId: 'plexo-cervical', blockName: 'Plexo cervical' }
  ]},
  { title: 'Membro superior', items: [
    { lesion: 'Ombro, umero proximal', blockId: 'interescalenico', blockName: 'Interescalenico' },
    { lesion: 'Cotovelo, antebraco', blockId: 'supraclavicular', blockName: 'Supraclavicular' },
    { lesion: 'Antebraco distal, mao', blockId: 'axilar', blockName: 'Axilar' },
    { lesion: 'Mao, dedos', blockId: 'punho', blockName: 'Punho' }
  ]},
  { title: 'Membro inferior', items: [
    { lesion: 'Quadril, femur proximal', blockId: 'peng', blockName: 'PENG' },
    { lesion: 'Quadril (alternativa)', blockId: 'fascia-iliaca', blockName: 'Fascia iliaca' },
    { lesion: 'Coxa anterior, joelho', blockId: 'femoral', blockName: 'Femoral' },
    { lesion: 'Perna distal, tornozelo, pe', blockId: 'ciatico-popliteo', blockName: 'Ciatico popliteo' },
    { lesion: 'Complemento (face medial)', blockId: 'safeno', blockName: 'Safeno' },
    { lesion: 'Pe, dedos', blockId: 'tornozelo', blockName: 'Tornozelo' }
  ]},
  { title: 'Torax / Costelas', items: [
    { lesion: 'Fraturas costelas (posterior)', blockId: 'esp', blockName: 'ESP' },
    { lesion: 'Fraturas costelas (lateral)', blockId: 'serratil', blockName: 'Serratil anterior' },
    { lesion: 'Fratura costela isolada', blockId: 'intercostal', blockName: 'Intercostal' }
  ]}
]

const blocks: BlockData[] = [
  {
    id: 'plexo-cervical', name: 'Plexo cervical superficial', region: 'Pescoco', volume: '5-10 mL', type: 'Sensitivo',
    indications: ['Fratura de clavicula', 'Procedimentos cervicais superficiais', 'Endarterectomia de carotida (complemento)', 'Linfonodectomia cervical', 'Acesso venoso central (jugular)'],
    contraindications: ['Recusa do paciente', 'Infeccao no local de puncao', 'Alergia a anestesicos locais', 'Coagulopatia grave (relativa)'],
    material: ['Luvas estereis', 'Clorexidina alcoolica 0,5%', 'Campo esteril', 'Seringa 10 mL', 'Agulha 22-25G x 40mm', 'Anestesico local (5-10 mL)', 'USG linear (opcional)', 'Gel esteril'],
    technique: ['Paciente supino, cabeca virada para lado contralateral', 'Identificar ponto medio da borda posterior do ECM', 'Transdutor transversal neste nivel (opcional)', 'Inserir agulha superficialmente, posterior ao ECM', 'Depositar 5-10 mL em leque subcutaneo'],
    tip: { title: 'Ponto de Erb', text: 'Borda posterior do ECM, juncao dos tercos superior e medio.' },
    anesthetics: [{ drug: 'Lidocaina', conc: '1-2%', vol: '5-10 mL' }, { drug: 'Bupivacaina', conc: '0,25-0,5%', vol: '5-10 mL' }, { drug: 'Ropivacaina', conc: '0,2-0,5%', vol: '5-10 mL' }]
  },
  // TODO: adicionar os outros 13 bloqueios extraindo do HTML atual
]

// Lista simplificada de todos os bloqueios para a tela de lista
const blockList = [
  { region: 'Pescoco', items: [{ id: 'plexo-cervical', name: 'Plexo cervical superficial', volume: '5-10 mL' }] },
  { region: 'Membro superior', items: [
    { id: 'interescalenico', name: 'Interescalenico', volume: '7-15 mL' },
    { id: 'supraclavicular', name: 'Supraclavicular', volume: '20-25 mL' },
    { id: 'axilar', name: 'Axilar', volume: '20 mL' },
    { id: 'punho', name: 'Punho', volume: '9-15 mL' }
  ]},
  { region: 'Membro inferior', items: [
    { id: 'peng', name: 'PENG', volume: '15-20 mL' },
    { id: 'fascia-iliaca', name: 'Fascia iliaca', volume: '30-40 mL' },
    { id: 'femoral', name: 'Femoral', volume: '15-20 mL' },
    { id: 'safeno', name: 'Safeno', volume: '8-10 mL' },
    { id: 'ciatico-popliteo', name: 'Ciatico popliteo', volume: '15-20 mL' },
    { id: 'tornozelo', name: 'Tornozelo', volume: '15-25 mL' }
  ]},
  { region: 'Torax', items: [
    { id: 'esp', name: 'ESP (Eretor da espinha)', volume: '20-30 mL' },
    { id: 'serratil', name: 'Serratil anterior', volume: '20-30 mL' },
    { id: 'intercostal', name: 'Intercostal', volume: '3-5 mL/nivel' }
  ]}
]

// ==========================================
// CALCULADORA
// ==========================================

interface AnestheticCalc {
  name: string
  noEpi: number    // mg/kg sem epinefrina
  withEpi: number  // mg/kg com epinefrina
  concentrations: { label: string; factor: number }[] // factor = mg/mL
}

const anesthetics: AnestheticCalc[] = [
  { name: 'Lidocaina', noEpi: 4.5, withEpi: 7, concentrations: [{ label: '1%', factor: 10 }, { label: '2%', factor: 20 }] },
  { name: 'Bupivacaina', noEpi: 2.5, withEpi: 3, concentrations: [{ label: '0,25%', factor: 2.5 }, { label: '0,5%', factor: 5 }] },
  { name: 'Ropivacaina', noEpi: 3, withEpi: 3.5, concentrations: [{ label: '0,2%', factor: 2 }, { label: '0,5%', factor: 5 }] },
]

// ==========================================
// SCREENS
// ==========================================

type Screen = 'home' | 'topography' | 'blocklist' | 'calculator' | 'last' | 'evolution' | string

export default function BlockPath() {
  const [screen, setScreen] = useState<Screen>('home')
  const [calcWeight, setCalcWeight] = useState(70)
  const [lipidWeight, setLipidWeight] = useState(70)
  const { addToast } = useToast()

  // Evolucao state
  const [evoForm, setEvoForm] = useState({
    indicacao: '', tipo: '', lado: '', transdutor: '', agulha: '',
    tecnica: '', droga: '', volume: '', dose: '', epi: '',
    interc: 'Nenhuma', intercDesc: '', sensitivo: true, motor: false,
    last: true, resp: '', crm: ''
  })
  const [evoText, setEvoText] = useState('')
  const [showEvoResult, setShowEvoResult] = useState(false)

  const activeBlock = useMemo(() => {
    if (screen.startsWith('block-')) {
      return blocks.find(b => b.id === screen.replace('block-', ''))
    }
    return null
  }, [screen])

  function fmt(n: number, d = 1) { return n.toFixed(d).replace('.', ',') }

  function generateEvolution() {
    const f = evoForm
    const lines = [
      'BLOQUEIO REGIONAL GUIADO POR ULTRASSOM',
      '',
      `Indicacao: ${f.indicacao || '--'}`,
      `Bloqueio: ${f.tipo || '--'} ${f.lado ? `(${f.lado})` : ''}`,
      `Transdutor: ${f.transdutor || '--'}`,
      `Agulha: ${f.agulha || '--'}`,
      `Tecnica: ${f.tecnica || '--'}`,
      `Anestesico: ${f.droga || '--'}`,
      `Volume: ${f.volume || '--'} mL | Dose: ${f.dose || '--'} mg`,
      `Epinefrina: ${f.epi || '--'}`,
      '',
      'Avaliacao pos-bloqueio:',
      f.sensitivo ? '- Bloqueio sensitivo presente' : '- Bloqueio sensitivo ausente',
      f.motor ? '- Bloqueio motor presente' : '',
      f.last ? '- Ausencia de sinais de LAST' : '- ATENCAO: sinais de LAST',
      '',
      `Intercorrencias: ${f.interc === 'Sim' ? f.intercDesc || 'Sim' : 'Nenhuma'}`,
      '',
      `Responsavel: ${f.resp || '--'}`,
      `CRM: ${f.crm || '--'}`,
    ].filter(Boolean).join('\n')

    setEvoText(lines)
    setShowEvoResult(true)
  }

  async function copyEvolution() {
    try {
      await navigator.clipboard.writeText(evoText)
      addToast('Texto copiado', 'success')
    } catch {
      addToast('Erro ao copiar', 'error')
    }
  }

  const fabItems = [
    { label: 'Inicio', onClick: () => setScreen('home') },
    { label: 'Topografia', onClick: () => setScreen('topography') },
    { label: 'Lista de bloqueios', onClick: () => setScreen('blocklist') },
    { label: 'Calculadora', onClick: () => setScreen('calculator') },
    { label: 'LAST', onClick: () => setScreen('last') },
  ]

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="Block Path" subtitle="Bloqueios regionais no DE" />
      <Container>

        {/* HOME */}
        {screen === 'home' && (
          <div className="flex flex-col gap-3">
            <Card borderColor="#10B981" onClick={() => setScreen('topography')}>
              <div className="font-semibold text-sm">Escolher por topografia</div>
              <div className="text-xs text-text-muted mt-1">Arvore de decisao por local da lesao</div>
            </Card>
            <Card borderColor="#60A5FA" onClick={() => setScreen('blocklist')}>
              <div className="font-semibold text-sm">Lista de bloqueios</div>
              <div className="text-xs text-text-muted mt-1">Acesso direto aos 14 bloqueios</div>
            </Card>
            <Card borderColor="#8B5CF6" onClick={() => setScreen('calculator')}>
              <div className="font-semibold text-sm">Calculadora de dose</div>
              <div className="text-xs text-text-muted mt-1">Dose maxima de anestesico local</div>
            </Card>
            <Card borderColor="#EF4444" onClick={() => setScreen('last')}>
              <div className="font-semibold text-sm">LAST — Toxicidade</div>
              <div className="text-xs text-text-muted mt-1">Protocolo de emergencia</div>
            </Card>
            <Card borderColor="#F59E0B" onClick={() => setScreen('evolution')}>
              <div className="font-semibold text-sm">Modelo de evolucao</div>
              <div className="text-xs text-text-muted mt-1">Template copiavel para prontuario</div>
            </Card>
          </div>
        )}

        {/* TOPOGRAPHY */}
        {screen === 'topography' && (
          <div>
            <Button variant="outline" size="sm" onClick={() => setScreen('home')} className="mb-4">← Voltar</Button>
            <h2 className="text-lg font-bold mb-2">Onde esta a lesao?</h2>
            <p className="text-sm text-text-secondary mb-4">Selecione a topografia para ver as opcoes de bloqueio</p>
            <div className="bg-bg-elevated border border-border-card rounded-xl p-4">
              {topography.map(cat => (
                <div key={cat.title} className="mb-4 last:mb-0">
                  <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{cat.title}</div>
                  {cat.items.map(item => (
                    <button
                      key={item.blockId}
                      onClick={() => setScreen(`block-${item.blockId}`)}
                      className="flex items-center justify-between w-full px-3 py-3 rounded-lg bg-transparent border-none text-left cursor-pointer active:bg-bg-hover transition-colors min-h-[44px]"
                    >
                      <span className="text-sm text-text-primary">{item.lesion}</span>
                      <span className="text-xs text-info font-medium">{item.blockName} →</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOCK LIST */}
        {screen === 'blocklist' && (
          <div>
            <Button variant="outline" size="sm" onClick={() => setScreen('home')} className="mb-4">← Voltar</Button>
            <h2 className="text-lg font-bold mb-2">Lista de bloqueios</h2>
            <p className="text-sm text-text-secondary mb-4">14 bloqueios disponiveis</p>
            <div className="bg-bg-elevated border border-border-card rounded-xl p-4">
              {blockList.map(cat => (
                <div key={cat.region} className="mb-4 last:mb-0">
                  <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{cat.region}</div>
                  {cat.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setScreen(`block-${item.id}`)}
                      className="flex items-center justify-between w-full px-3 py-3 rounded-lg bg-transparent border-none text-left cursor-pointer active:bg-bg-hover transition-colors min-h-[44px]"
                    >
                      <div>
                        <div className="text-sm font-medium text-text-primary">{item.name}</div>
                        <div className="text-xs text-text-muted">{item.volume}</div>
                      </div>
                      <span className="text-text-muted">›</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALCULATOR */}
        {screen === 'calculator' && (
          <div>
            <Button variant="outline" size="sm" onClick={() => setScreen('home')} className="mb-4">← Voltar</Button>
            <h2 className="text-lg font-bold mb-2">Calculadora de dose maxima</h2>
            <p className="text-sm text-text-secondary mb-4">Dose maxima de anestesico local por peso</p>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-text-secondary">Peso:</span>
              <input
                type="range" min="40" max="150" value={calcWeight}
                onChange={e => setCalcWeight(Number(e.target.value))}
                className="flex-1"
              />
              <input
                type="number" inputMode="decimal"
                value={calcWeight} onChange={e => setCalcWeight(Number(e.target.value))}
                className="w-16 bg-bg-elevated border border-border-card rounded-lg px-2 py-2 text-center text-accent font-bold text-lg"
                min={40} max={200}
              />
              <span className="text-sm text-text-secondary">kg</span>
            </div>

            {anesthetics.map(a => (
              <Card key={a.name} className="mb-3">
                <div className="font-semibold text-sm text-accent mb-3">{a.name}</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-bg-hover rounded-lg p-3 text-center">
                    <div className="text-xs text-text-muted mb-1">Sem epi ({a.noEpi} mg/kg)</div>
                    <div className="text-lg font-bold text-success">{fmt(calcWeight * a.noEpi, 0)} mg</div>
                  </div>
                  <div className="bg-bg-hover rounded-lg p-3 text-center">
                    <div className="text-xs text-text-muted mb-1">Com epi ({a.withEpi} mg/kg)</div>
                    <div className="text-lg font-bold text-success">{fmt(calcWeight * a.withEpi, 0)} mg</div>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead><tr className="text-text-muted"><th className="text-left py-1">Conc.</th><th className="text-right py-1">Sem epi</th><th className="text-right py-1">Com epi</th></tr></thead>
                  <tbody>
                    {a.concentrations.map(c => (
                      <tr key={c.label} className="border-t border-border">
                        <td className="py-1.5 text-text-secondary">{c.label}</td>
                        <td className="text-right text-text-primary">{fmt(calcWeight * a.noEpi / c.factor)} mL</td>
                        <td className="text-right text-text-primary">{fmt(calcWeight * a.withEpi / c.factor)} mL</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ))}

            <AlertCard type="warning" title="Atencao">
              Reduzir 20-30% em idosos, hepatopatas, cardiopatas. Em bloqueios multiplos, considere dose total.
            </AlertCard>
          </div>
        )}

        {/* LAST PROTOCOL */}
        {screen === 'last' && (
          <div>
            <Button variant="outline" size="sm" onClick={() => setScreen('home')} className="mb-4">← Voltar</Button>
            <AlertCard type="danger" title="LAST — Intoxicacao por AL">
              Toxicidade sistemica por anestesico local
            </AlertCard>

            <Collapsible title="Sinais de alerta">
              <AlertCard type="info" title="Neurologicos (precoces)">
                Zumbido, gosto metalico, parestesias periorais, agitacao, confusao, convulsoes
              </AlertCard>
              <AlertCard type="danger" title="Cardiovasculares (tardios)">
                Hipotensao, bradicardia, arritmias ventriculares, alargamento QRS, PCR
              </AlertCard>
            </Collapsible>

            {[
              { n: 1, t: 'Parar a infusao de AL', d: 'Interromper qualquer administracao de anestesico local' },
              { n: 2, t: 'Pedir ajuda', d: 'Acionar equipe de suporte' },
              { n: 3, t: 'Via aerea e O2 100%', d: 'Considere IOT precoce. Evitar hipoxia e acidose' },
              { n: 4, t: 'Tratar convulsoes', d: 'Benzodiazepinicos (midazolam 1-2 mg IV)' },
              { n: 5, t: 'ACLS modificado se PCR', d: 'Evitar vasopressina, reduzir epinefrina (<=1 mcg/kg)' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3 my-3">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{s.n}</div>
                <div>
                  <div className="font-semibold text-sm">{s.t}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{s.d}</div>
                </div>
              </div>
            ))}

            <Card className="mt-4">
              <div className="font-semibold text-sm text-accent mb-3">Emulsao lipidica 20%</div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-text-secondary">Peso:</span>
                <input type="range" min="40" max="150" value={lipidWeight} onChange={e => setLipidWeight(Number(e.target.value))} className="flex-1" />
                <input type="number" inputMode="decimal" value={lipidWeight} onChange={e => setLipidWeight(Number(e.target.value))} className="w-16 bg-bg-elevated border border-border-card rounded-lg px-2 py-2 text-center text-accent font-bold" min={40} max={200} />
                <span className="text-sm text-text-secondary">kg</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-text-secondary">BOLUS (1,5 mL/kg)</span><span className="font-bold text-success">{fmt(lipidWeight * 1.5, 0)} mL</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-secondary">INFUSAO (0,25 mL/kg/min)</span><span className="font-bold text-warning">{fmt(lipidWeight * 0.25)} mL/min</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-secondary">DOSE MAX (12 mL/kg)</span><span className="font-bold text-danger">{fmt(lipidWeight * 12, 0)} mL</span></div>
              </div>
            </Card>
          </div>
        )}

        {/* BLOCK DETAIL */}
        {activeBlock && (
          <div>
            <Button variant="outline" size="sm" onClick={() => setScreen('home')} className="mb-4">← Voltar</Button>
            <h2 className="text-lg font-bold">{activeBlock.name}</h2>
            <div className="flex gap-2 mt-1 mb-4">
              <span className="text-xs bg-bg-hover px-2 py-1 rounded">{activeBlock.region}</span>
              <span className="text-xs bg-bg-hover px-2 py-1 rounded">{activeBlock.volume}</span>
              <span className="text-xs bg-bg-hover px-2 py-1 rounded">{activeBlock.type}</span>
            </div>

            <Collapsible title="Indicacoes">
              <ul className="space-y-1">{activeBlock.indications.map((ind, i) => <li key={i} className="text-sm text-text-secondary">- {ind}</li>)}</ul>
              {activeBlock.tip && <AlertCard type="info" title={activeBlock.tip.title}>{activeBlock.tip.text}</AlertCard>}
            </Collapsible>
            <Collapsible title="Contraindicacoes">
              <ul className="space-y-1">{activeBlock.contraindications.map((c, i) => <li key={i} className="text-sm text-warning">- {c}</li>)}</ul>
            </Collapsible>
            <Collapsible title="Material">
              <ul className="space-y-1">{activeBlock.material.map((m, i) => <li key={i} className="text-sm text-text-secondary flex items-center gap-2"><input type="checkbox" className="accent-accent" /> {m}</li>)}</ul>
            </Collapsible>
            <Collapsible title="Tecnica">
              {activeBlock.technique.map((step, i) => (
                <div key={i} className="flex items-start gap-3 my-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <div className="text-sm text-text-secondary">{step}</div>
                </div>
              ))}
            </Collapsible>
            <Collapsible title="Anestesico local">
              <table className="w-full text-xs">
                <thead><tr className="text-text-muted"><th className="text-left py-1">Droga</th><th className="text-left py-1">Conc.</th><th className="text-left py-1">Volume</th></tr></thead>
                <tbody>
                  {activeBlock.anesthetics.map((a, i) => (
                    <tr key={i} className="border-t border-border"><td className="py-1.5">{a.drug}</td><td>{a.conc}</td><td>{a.vol}</td></tr>
                  ))}
                </tbody>
              </table>
            </Collapsible>
          </div>
        )}

        {/* EVOLUTION */}
        {screen === 'evolution' && (
          <div>
            <Button variant="outline" size="sm" onClick={() => setScreen('home')} className="mb-4">← Voltar</Button>
            <h2 className="text-lg font-bold mb-2">Gerar evolucao</h2>
            <p className="text-sm text-text-secondary mb-4">Preencha os campos para gerar o texto</p>

            {!showEvoResult ? (
              <div className="space-y-3">
                <input className="w-full bg-bg-elevated border border-border-card rounded-lg px-3 py-3 text-sm text-text-primary" placeholder="Indicacao (ex: Fratura de colo femoral D)" value={evoForm.indicacao} onChange={e => setEvoForm(f => ({...f, indicacao: e.target.value}))} />
                <select className="w-full bg-bg-elevated border border-border-card rounded-lg px-3 py-3 text-sm text-text-primary" value={evoForm.tipo} onChange={e => setEvoForm(f => ({...f, tipo: e.target.value}))}>
                  <option value="">Tipo de bloqueio...</option>
                  {blockList.flatMap(c => c.items).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
                <div className="flex gap-2">
                  {['D', 'E', 'Bilateral'].map(l => (
                    <button key={l} onClick={() => setEvoForm(f => ({...f, lado: l}))} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border min-h-[44px] ${evoForm.lado === l ? 'bg-accent text-white border-accent' : 'bg-bg-elevated text-text-secondary border-border-card'}`}>{l === 'D' ? 'Direito' : l === 'E' ? 'Esquerdo' : 'Bilateral'}</button>
                  ))}
                </div>
                <select className="w-full bg-bg-elevated border border-border-card rounded-lg px-3 py-3 text-sm text-text-primary" value={evoForm.transdutor} onChange={e => setEvoForm(f => ({...f, transdutor: e.target.value}))}>
                  <option value="">Transdutor...</option>
                  <option value="Linear 6-13 MHz">Linear 6-13 MHz</option>
                  <option value="Curvo 2-5 MHz">Curvo 2-5 MHz</option>
                  <option value="Nao utilizado">Nao utilizado</option>
                </select>
                <select className="w-full bg-bg-elevated border border-border-card rounded-lg px-3 py-3 text-sm text-text-primary" value={evoForm.droga} onChange={e => setEvoForm(f => ({...f, droga: e.target.value}))}>
                  <option value="">Anestesico local...</option>
                  <option>Lidocaina 1%</option><option>Lidocaina 2%</option>
                  <option>Bupivacaina 0,25%</option><option>Bupivacaina 0,5%</option>
                  <option>Ropivacaina 0,2%</option><option>Ropivacaina 0,5%</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" inputMode="decimal" className="bg-bg-elevated border border-border-card rounded-lg px-3 py-3 text-sm text-text-primary" placeholder="Volume (mL)" value={evoForm.volume} onChange={e => setEvoForm(f => ({...f, volume: e.target.value}))} />
                  <input type="number" inputMode="decimal" className="bg-bg-elevated border border-border-card rounded-lg px-3 py-3 text-sm text-text-primary" placeholder="Dose (mg)" value={evoForm.dose} onChange={e => setEvoForm(f => ({...f, dose: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className="bg-bg-elevated border border-border-card rounded-lg px-3 py-3 text-sm text-text-primary" placeholder="Responsavel" value={evoForm.resp} onChange={e => setEvoForm(f => ({...f, resp: e.target.value}))} />
                  <input className="bg-bg-elevated border border-border-card rounded-lg px-3 py-3 text-sm text-text-primary" placeholder="CRM" value={evoForm.crm} onChange={e => setEvoForm(f => ({...f, crm: e.target.value}))} />
                </div>
                <Button fullWidth onClick={generateEvolution}>Gerar evolucao</Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Evolucao gerada</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowEvoResult(false)}>Editar</Button>
                </div>
                <textarea readOnly value={evoText} className="w-full bg-bg-elevated border border-border-card rounded-lg p-3 text-xs text-text-primary font-mono min-h-[300px] resize-none" />
                <Button fullWidth onClick={copyEvolution} className="mt-3">Copiar texto</Button>
              </div>
            )}
          </div>
        )}

      </Container>
      <Footer toolName="Block Path" version="v2.0.0" />
      <FABMenu items={fabItems} />
      <ToastContainer />
    </div>
  )
}
