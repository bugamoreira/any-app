import { useState, useMemo } from 'react'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
import { Button } from '../components/common/Button'
import { Collapsible } from '../components/common/Collapsible'
import { AlertCard } from '../components/common/AlertCard'
import { ToastContainer } from '../components/common/Toast'
import { useToast } from '../contexts/ToastContext'
import { MapPin, List, Calculator, AlertTriangle, FileText } from 'lucide-react'

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
  { title: 'Pescoço / Clavícula', items: [
    { lesion: 'Fratura de clavícula', blockId: 'plexo-cervical', blockName: 'Plexo cervical' }
  ]},
  { title: 'Membro superior', items: [
    { lesion: 'Ombro, úmero proximal', blockId: 'interescalênico', blockName: 'Interescalênico' },
    { lesion: 'Cotovelo, antebraço', blockId: 'supraclavícular', blockName: 'Supraclavicular' },
    { lesion: 'Antebraço distal, mão', blockId: 'axilar', blockName: 'Axilar' },
    { lesion: 'Mão, dedos', blockId: 'punho', blockName: 'Punho' }
  ]},
  { title: 'Membro inferior', items: [
    { lesion: 'Quadril, fêmur proximal', blockId: 'peng', blockName: 'PENG' },
    { lesion: 'Quadril (alternativa)', blockId: 'fáscia-ilíaca', blockName: 'Fáscia ilíaca' },
    { lesion: 'Coxa anterior, joelho', blockId: 'femoral', blockName: 'Femoral' },
    { lesion: 'Perna distal, tornozelo, pé', blockId: 'ciático-poplíteo', blockName: 'Ciático poplíteo' },
    { lesion: 'Complemento (face medial)', blockId: 'safeno', blockName: 'Safeno' },
    { lesion: 'Pé, dedos', blockId: 'tornozelo', blockName: 'Tornozelo' }
  ]},
  { title: 'Tórax / Costelas', items: [
    { lesion: 'Fraturas costelas (posterior)', blockId: 'esp', blockName: 'ESP' },
    { lesion: 'Fraturas costelas (lateral)', blockId: 'serrátil', blockName: 'Serrátil anterior' },
    { lesion: 'Fratura costela isolada', blockId: 'intercostal', blockName: 'Intercostal' }
  ]}
]

const blocks: BlockData[] = [
  {
    id: 'plexo-cervical', name: 'Plexo cervical superficial', region: 'Pescoço', volume: '5-10 mL', type: 'Sensitivo',
    indications: ['Fratura de clavícula', 'Procedimentos cervicais superficiais', 'Endarterectomia de carótida (complemento)', 'Linfonodectomia cervical', 'Acesso venoso central (jugular)'],
    contraindications: ['Recusa do paciente', 'Infecção no local de punção', 'Alergia a anestésicos locais', 'Coagulopatia grave (relativa)'],
    material: ['Luvas estéreis', 'Clorexidina alcoólica 0,5%', 'Campo estéril', 'Seringa 10 mL', 'Agulha 22-25G x 40mm', 'Anestésico local (5-10 mL)', 'USG linear (opcional)', 'Gel estéril'],
    technique: ['Paciente supino, cabeça virada para lado contralateral', 'Identificar ponto médio da borda posterior do ECM', 'Transdutor transversal neste nível (opcional)', 'Inserir agulha superficialmente, posterior ao ECM', 'Depositar 5-10 mL em leque subcutâneo'],
    tip: { title: 'Ponto de Erb', text: 'Borda posterior do ECM, junção dos terços superior e médio.' },
    anesthetics: [{ drug: 'Lidocaína', conc: '1-2%', vol: '5-10 mL' }, { drug: 'Bupivacaína', conc: '0,25-0,5%', vol: '5-10 mL' }, { drug: 'Ropivacaína', conc: '0,2-0,5%', vol: '5-10 mL' }]
  },
  // TODO: adicionar os outros 13 bloqueios extraindo do HTML atual
]

// BLOCKER-01: bloqueios ainda nao implementados sao marcados como "Em breve"
// para evitar dead-end de UX. Expandir o array `blocks` acima vai habilitar
// automaticamente os itens correspondentes.
const implementedBlockIds = new Set(blocks.map(b => b.id))
const isImplemented = (id: string): boolean => implementedBlockIds.has(id)

// Lista simplificada de todos os bloqueios para a tela de lista
const blockList = [
  { region: 'Pescoço', items: [{ id: 'plexo-cervical', name: 'Plexo cervical superficial', volume: '5-10 mL' }] },
  { region: 'Membro superior', items: [
    { id: 'interescalênico', name: 'Interescalênico', volume: '7-15 mL' },
    { id: 'supraclavícular', name: 'Supraclavicular', volume: '20-25 mL' },
    { id: 'axilar', name: 'Axilar', volume: '20 mL' },
    { id: 'punho', name: 'Punho', volume: '9-15 mL' }
  ]},
  { region: 'Membro inferior', items: [
    { id: 'peng', name: 'PENG', volume: '15-20 mL' },
    { id: 'fáscia-ilíaca', name: 'Fáscia ilíaca', volume: '30-40 mL' },
    { id: 'femoral', name: 'Femoral', volume: '15-20 mL' },
    { id: 'safeno', name: 'Safeno', volume: '8-10 mL' },
    { id: 'ciático-poplíteo', name: 'Ciático poplíteo', volume: '15-20 mL' },
    { id: 'tornozelo', name: 'Tornozelo', volume: '15-25 mL' }
  ]},
  { region: 'Tórax', items: [
    { id: 'esp', name: 'ESP (Eretor da espinha)', volume: '20-30 mL' },
    { id: 'serrátil', name: 'Serrátil anterior', volume: '20-30 mL' },
    { id: 'intercostal', name: 'Intercostal', volume: '3-5 mL/nível' }
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
  { name: 'Lidocaína', noEpi: 4.5, withEpi: 7, concentrations: [{ label: '1%', factor: 10 }, { label: '2%', factor: 20 }] },
  { name: 'Bupivacaína', noEpi: 2.5, withEpi: 3, concentrations: [{ label: '0,25%', factor: 2.5 }, { label: '0,5%', factor: 5 }] },
  { name: 'Ropivacaína', noEpi: 3, withEpi: 3.5, concentrations: [{ label: '0,2%', factor: 2 }, { label: '0,5%', factor: 5 }] },
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

  // Evolução state
  const [evoForm, setEvoForm] = useState({
    indicação: '', tipo: '', lado: '', transdutor: '', agulha: '',
    técnica: '', droga: '', volume: '', dose: '', epi: '',
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
      `Indicação: ${f.indicação || '--'}`,
      `Bloqueio: ${f.tipo || '--'} ${f.lado ? `(${f.lado})` : ''}`,
      `Transdutor: ${f.transdutor || '--'}`,
      `Agulha: ${f.agulha || '--'}`,
      `Técnica: ${f.técnica || '--'}`,
      `Anestésico: ${f.droga || '--'}`,
      `Volume: ${f.volume || '--'} mL | Dose: ${f.dose || '--'} mg`,
      `Epinefrina: ${f.epi || '--'}`,
      '',
      'Avaliação pós-bloqueio:',
      f.sensitivo ? '- Bloqueio sensitivo presente' : '- Bloqueio sensitivo ausente',
      f.motor ? '- Bloqueio motor presente' : '',
      f.last ? '- Ausência de sinais de LAST' : '- ATENÇÃO: sinais de LAST',
      '',
      `Intercorrências: ${f.interc === 'Sim' ? f.intercDesc || 'Sim' : 'Nenhuma'}`,
      '',
      `Responsável: ${f.resp || '--'}`,
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
    { label: 'Início', onClick: () => setScreen('home') },
    { label: 'Topografia', onClick: () => setScreen('topography') },
    { label: 'Lista de bloqueios', onClick: () => setScreen('blocklist') },
    { label: 'Calculadora', onClick: () => setScreen('calculator') },
    { label: 'LAST', onClick: () => setScreen('last') },
  ]

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="BlockPath" subtitle="Bloqueios regionais para anestesia local" />
      <Container>

        {/* HOME */}
        {screen === 'home' && (
          <div className="flex flex-col gap-3">
            {[
              { key: 'topography', color: '#10B981', icon: <MapPin size={22} />, title: 'Escolher por topografia', desc: 'Árvore de decisão por local da lesão', emergency: false },
              { key: 'blocklist', color: '#60A5FA', icon: <List size={22} />, title: 'Lista de bloqueios', desc: 'Acesso direto aos 14 bloqueios', emergency: false },
              { key: 'calculator', color: '#8B5CF6', icon: <Calculator size={22} />, title: 'Calculadora de dose', desc: 'Dose máxima de anestésico local', emergency: false },
              { key: 'last', color: '#EF4444', icon: <AlertTriangle size={22} />, title: 'LAST — Toxicidade', desc: 'Protocolo de emergência', emergency: true },
              { key: 'evolution', color: '#F59E0B', icon: <FileText size={22} />, title: 'Modelo de evolução', desc: 'Template copiável para prontuário', emergency: false },
            ].map(btn => (
              <button
                key={btn.key}
                onClick={() => setScreen(btn.key)}
                className="flex items-center gap-4 py-[18px] px-5 border-2 rounded-xl cursor-pointer transition-all min-h-[44px] text-left"
                style={{
                  background: btn.emergency ? 'rgba(244,67,54,0.1)' : '#111',
                  borderColor: btn.emergency ? '#EF4444' : '#333',
                  borderLeftWidth: '4px',
                  borderLeftColor: btn.color,
                }}
              >
                <div
                  className="w-[44px] h-[44px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: `${btn.color}26`, color: btn.color }}
                >
                  {btn.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-semibold text-accent mb-0.5">{btn.title}</div>
                  <div className="text-[13px] text-[#999]">{btn.desc}</div>
                </div>
                <span className="text-[20px] text-[#999] flex-shrink-0">›</span>
              </button>
            ))}
          </div>
        )}

        {/* TOPOGRAPHY */}
        {screen === 'topography' && (
          <div className="px-1">
            <button onClick={() => setScreen('home')} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-5 px-0 min-h-[44px]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>Início</button>
            <div className="bg-bg-elevated border-l-4 border-l-accent rounded-t-xl p-5 mb-0">
              <h2 className="text-xl font-semibold mb-1">Onde está a lesão?</h2>
              <p className="text-sm text-text-secondary">Selecione a topografia para ver as opções de bloqueio</p>
            </div>
            <div className="bg-[#111] border border-[#333] rounded-b-xl p-4">
              {topography.map(cat => (
                <div key={cat.title} className="mb-4 last:mb-0">
                  <div className="bg-bg-hover text-accent rounded-lg px-4 py-3 font-semibold text-[15px] mb-2">{cat.title}</div>
                  {cat.items.map(item => {
                    const ready = isImplemented(item.blockId)
                    return (
                      <button
                        key={item.blockId}
                        onClick={() => ready && setScreen(`block-${item.blockId}`)}
                        disabled={!ready}
                        aria-disabled={!ready}
                        className={`flex items-center justify-between w-full px-4 py-[14px] rounded-lg bg-bg-hover mb-2 border-none text-left transition-colors min-h-[44px] ${
                          ready ? 'cursor-pointer active:bg-[#333]' : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-sm text-text-primary">{item.lesion}</span>
                        <span className="flex items-center gap-2">
                          {!ready && <span className="text-[10px] font-semibold uppercase tracking-wider text-warning bg-warning/10 px-2 py-0.5 rounded-full">Em breve</span>}
                          <span className={`text-[13px] font-semibold ${ready ? 'text-accent' : 'text-text-muted'}`}>{item.blockName}{ready && ' →'}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOCK LIST */}
        {screen === 'blocklist' && (
          <div className="px-1">
            <button onClick={() => setScreen('home')} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-5 px-0 min-h-[44px]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>Início</button>
            <div className="bg-bg-elevated border-l-4 border-l-accent rounded-t-xl p-5 mb-0">
              <h2 className="text-xl font-semibold mb-1">Lista de bloqueios</h2>
              <p className="text-sm text-text-secondary">{implementedBlockIds.size} de 14 disponível{implementedBlockIds.size === 1 ? '' : 's'} — outros em breve</p>
            </div>
            <div className="bg-[#111] border border-[#333] rounded-b-xl p-4">
              {blockList.map(cat => (
                <div key={cat.region} className="mb-5 last:mb-0">
                  <div className="text-[13px] font-semibold text-[#999] uppercase tracking-wide mb-2 pl-1">{cat.region}</div>
                  {cat.items.map(item => {
                    const ready = isImplemented(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => ready && setScreen(`block-${item.id}`)}
                        disabled={!ready}
                        aria-disabled={!ready}
                        className={`flex items-center justify-between w-full px-4 py-[14px] bg-bg-elevated border border-border-card rounded-lg mb-2 text-left transition-all min-h-[44px] ${
                          ready ? 'cursor-pointer hover:border-accent hover:bg-[rgba(16,185,129,0.1)]' : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div>
                          <div className={`text-[15px] font-medium ${ready ? 'text-accent' : 'text-text-muted'}`}>{item.name}</div>
                          <div className="text-xs text-[#999]">{item.volume}</div>
                        </div>
                        {ready ? (
                          <span className="text-[#999] text-[20px]">›</span>
                        ) : (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-warning bg-warning/10 px-2 py-0.5 rounded-full">Em breve</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALCULATOR */}
        {screen === 'calculator' && (
          <div className="px-1">
            <button onClick={() => setScreen('home')} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-5 px-0 min-h-[44px]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>Início</button>
            <div className="bg-bg-elevated border-l-4 border-l-accent rounded-xl p-5 mb-4">
              <h2 className="text-xl font-semibold mb-1">Calculadora de dose máxima</h2>
              <p className="text-sm text-text-secondary">Dose máxima de anestésico local por peso</p>
            </div>

            <div className="bg-bg-elevated border border-border-card rounded-xl p-5 mb-4">
              <div className="mb-5">
                <label className="block text-sm font-medium text-text-primary mb-2">Peso do paciente</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="40" max="150" value={calcWeight}
                    onChange={e => setCalcWeight(Number(e.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="number" inputMode="decimal"
                    value={calcWeight} onChange={e => setCalcWeight(Number(e.target.value))}
                    className="w-20 bg-bg-hover border-2 border-[#333] rounded-lg px-3 py-2.5 text-center text-accent font-semibold text-base"
                    min={40} max={200}
                  />
                  <span className="text-sm text-[#999] font-medium">kg</span>
                </div>
              </div>

              {anesthetics.map(a => (
                <div key={a.name} className="bg-bg-hover rounded-[10px] p-4 mb-3 last:mb-0">
                  <div className="text-sm font-semibold text-accent mb-3">{a.name}</div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-bg-elevated rounded-md p-3 text-center">
                      <div className="text-[11px] text-[#999] mb-0.5">Sem epi ({a.noEpi} mg/kg)</div>
                      <div className="text-base font-bold text-accent">{fmt(calcWeight * a.noEpi, 0)} mg</div>
                    </div>
                    <div className="bg-bg-elevated rounded-md p-3 text-center">
                      <div className="text-[11px] text-[#999] mb-0.5">Com epi ({a.withEpi} mg/kg)</div>
                      <div className="text-base font-bold text-accent">{fmt(calcWeight * a.withEpi, 0)} mg</div>
                    </div>
                  </div>
                  <table className="w-full text-[13px] mt-3">
                    <thead><tr><th className="text-left py-2.5 px-3 bg-bg-hover text-accent font-semibold rounded-tl-md">Conc.</th><th className="text-left py-2.5 px-3 bg-bg-hover text-accent font-semibold">Sem epi</th><th className="text-left py-2.5 px-3 bg-bg-hover text-accent font-semibold rounded-tr-md">Com epi</th></tr></thead>
                    <tbody>
                      {a.concentrations.map(c => (
                        <tr key={c.label} className="border-b border-[#333] last:border-b-0">
                          <td className="py-2.5 px-3 text-text-secondary">{c.label}</td>
                          <td className="py-2.5 px-3 text-text-primary">{fmt(calcWeight * a.noEpi / c.factor)} mL</td>
                          <td className="py-2.5 px-3 text-text-primary">{fmt(calcWeight * a.withEpi / c.factor)} mL</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <AlertCard type="warning" title="Atenção">
              Reduzir 20-30% em idosos, hepatopatas, cardiopatas. Em bloqueios múltiplos, considere dose total.
            </AlertCard>
          </div>
        )}

        {/* LAST PROTOCOL */}
        {screen === 'last' && (
          <div className="px-1">
            <button onClick={() => setScreen('home')} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-5 px-0 min-h-[44px]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>Início</button>

            <div className="bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white rounded-xl p-5 mb-4 text-center">
              <h2 className="text-xl font-bold mb-2">LAST — Intoxicação por AL</h2>
              <p className="text-sm opacity-90">Toxicidade sistêmica por anestésico local</p>
            </div>

            <Collapsible title="Sinais de alerta">
              <AlertCard type="info" title="Neurológicos (precoces)">
                Zumbido, gosto metálico, parestesias periorais, agitação, confusão, convulsões
              </AlertCard>
              <AlertCard type="danger" title="Cardiovasculares (tardios)">
                Hipotensão, bradicardia, arritmias ventriculares, alargamento QRS, PCR
              </AlertCard>
            </Collapsible>

            {[
              { n: 1, t: 'Parar a infusão de AL', d: 'Interromper qualquer administração de anestésico local' },
              { n: 2, t: 'Pedir ajuda', d: 'Acionar equipe de suporte' },
              { n: 3, t: 'Via aérea e O2 100%', d: 'Considere IOT precoce. Evitar hipóxia e acidose' },
              { n: 4, t: 'Tratar convulsões', d: 'Benzodiazepínicos (midazolam 1-2 mg IV)' },
              { n: 5, t: 'ACLS modificado se PCR', d: 'Evitar vasopressina, reduzir epinefrina (<=1 mcg/kg)' },
            ].map(s => (
              <div key={s.n} className="bg-bg-elevated border-2 border-border-card rounded-xl p-4 mb-3">
                <div className="w-8 h-8 rounded-full bg-danger text-white flex items-center justify-center text-base font-bold mb-3">{s.n}</div>
                <h4 className="text-[15px] font-semibold text-accent mb-2">{s.t}</h4>
                <p className="text-sm text-text-primary">{s.d}</p>
              </div>
            ))}

            <div className="bg-[rgba(244,67,54,0.1)] border-2 border-danger rounded-xl p-5 mt-4">
              <div className="text-base font-bold text-danger mb-4">Emulsão lipídica 20%</div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">Peso do paciente</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="40" max="150" value={lipidWeight} onChange={e => setLipidWeight(Number(e.target.value))} className="flex-1" />
                  <input type="number" inputMode="decimal" value={lipidWeight} onChange={e => setLipidWeight(Number(e.target.value))} className="w-20 bg-bg-hover border-2 border-[#333] rounded-lg px-3 py-2.5 text-center text-accent font-semibold text-base" min={40} max={200} />
                  <span className="text-sm text-[#999] font-medium">kg</span>
                </div>
              </div>
              <div className="bg-bg-elevated rounded-lg p-4">
                <div className="flex justify-between py-2.5 border-b border-[#333]"><span className="text-sm text-text-primary">BOLUS (1,5 mL/kg)</span><span className="text-base font-bold text-danger">{fmt(lipidWeight * 1.5, 0)} mL</span></div>
                <div className="flex justify-between py-2.5 border-b border-[#333]"><span className="text-sm text-text-primary">INFUSÃO (0,25 mL/kg/min)</span><span className="text-base font-bold text-danger">{fmt(lipidWeight * 0.25)} mL/min</span></div>
                <div className="flex justify-between py-2.5"><span className="text-sm text-text-primary">DOSE MÁX (12 mL/kg)</span><span className="text-base font-bold text-danger">{fmt(lipidWeight * 12, 0)} mL</span></div>
              </div>
            </div>
          </div>
        )}

        {/* BLOCK DETAIL */}
        {activeBlock && (
          <div className="px-1">
            <button onClick={() => setScreen('home')} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-5 px-0 min-h-[44px]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>Início</button>
            <div className="bg-bg-elevated border-l-4 border-l-accent rounded-xl p-5 mb-4">
              <h2 className="text-[22px] font-bold mb-2">{activeBlock.name}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                <span>{activeBlock.region}</span>
                <span>{activeBlock.volume}</span>
                <span>{activeBlock.type}</span>
              </div>
            </div>

            <Collapsible title="Indicações">
              <ul className="space-y-1">{activeBlock.indications.map((ind, i) => <li key={i} className="text-sm text-text-secondary">- {ind}</li>)}</ul>
              {activeBlock.tip && <AlertCard type="info" title={activeBlock.tip.title}>{activeBlock.tip.text}</AlertCard>}
            </Collapsible>
            <Collapsible title="Contraindicações">
              <ul className="space-y-1">{activeBlock.contraindications.map((c, i) => <li key={i} className="text-sm text-warning">- {c}</li>)}</ul>
            </Collapsible>
            <Collapsible title="Material">
              <ul className="space-y-1">{activeBlock.material.map((m, i) => <li key={i} className="text-sm text-text-secondary flex items-center gap-2"><input type="checkbox" className="accent-accent" /> {m}</li>)}</ul>
            </Collapsible>
            <Collapsible title="Técnica">
              {activeBlock.technique.map((step, i) => (
                <div key={i} className="flex items-start gap-3 my-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <div className="text-sm text-text-secondary">{step}</div>
                </div>
              ))}
            </Collapsible>
            <Collapsible title="Anestésico local">
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
          <div className="px-1">
            <button onClick={() => setScreen('home')} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-5 px-0 min-h-[44px]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>Início</button>
            <div className="bg-bg-elevated border-l-4 border-l-accent rounded-t-xl p-5 mb-0">
              <h2 className="text-xl font-semibold mb-1">Gerar evolução</h2>
              <p className="text-sm text-text-secondary">Preencha os campos para gerar o texto</p>
            </div>

            <div className="bg-bg-elevated border border-border-card rounded-b-xl overflow-hidden">
              <div className="p-5">
            {!showEvoResult ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-accent mb-1.5">Indicação do bloqueio</label>
                  <input className="w-full bg-bg-hover border-2 border-[#333] rounded-lg px-3 py-3 text-[15px] text-text-primary" placeholder="Ex: Fratura de colo femoral D" value={evoForm.indicação} onChange={e => setEvoForm(f => ({...f, indicação: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent mb-1.5">Tipo de bloqueio</label>
                  <select className="w-full bg-bg-hover border-2 border-[#333] rounded-lg px-3 py-3 text-[15px] text-text-primary" value={evoForm.tipo} onChange={e => setEvoForm(f => ({...f, tipo: e.target.value}))}>
                    <option value="">Selecione...</option>
                    {blockList.flatMap(c => c.items).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent mb-1.5">Lateralidade</label>
                  <div className="flex gap-3">
                    {['D', 'E', 'Bilateral'].map(l => (
                      <button key={l} onClick={() => setEvoForm(f => ({...f, lado: l}))} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border min-h-[44px] ${evoForm.lado === l ? 'bg-accent text-white border-accent' : 'bg-bg-hover text-text-secondary border-[#333]'}`}>{l === 'D' ? 'Direito' : l === 'E' ? 'Esquerdo' : 'Bilateral'}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent mb-1.5">Transdutor utilizado</label>
                  <select className="w-full bg-bg-hover border-2 border-[#333] rounded-lg px-3 py-3 text-[15px] text-text-primary" value={evoForm.transdutor} onChange={e => setEvoForm(f => ({...f, transdutor: e.target.value}))}>
                    <option value="">Selecione...</option>
                    <option value="Linear 6-13 MHz">Linear 6-13 MHz</option>
                    <option value="Curvo 2-5 MHz">Curvo 2-5 MHz</option>
                    <option value="Não utilizado">Não utilizado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent mb-1.5">Agulha utilizada</label>
                  <select className="w-full bg-bg-hover border-2 border-[#333] rounded-lg px-3 py-3 text-[15px] text-text-primary" value={evoForm.agulha} onChange={e => setEvoForm(f => ({...f, agulha: e.target.value}))}>
                    <option value="">Selecione...</option>
                    <option value="Ecogênica 50mm">Ecogênica 50mm</option>
                    <option value="Ecogênica 80mm">Ecogênica 80mm</option>
                    <option value="Ecogênica 100mm">Ecogênica 100mm</option>
                    <option value="22G x 40mm">22G x 40mm</option>
                    <option value="25G x 25mm">25G x 25mm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent mb-1.5">Técnica de inserção</label>
                  <div className="flex gap-3">
                    {['Em plano', 'Fora de plano'].map(t => (
                      <button key={t} onClick={() => setEvoForm(f => ({...f, técnica: t}))} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border min-h-[44px] ${evoForm.técnica === t ? 'bg-accent text-white border-accent' : 'bg-bg-hover text-text-secondary border-[#333]'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent mb-1.5">Anestésico local</label>
                  <select className="w-full bg-bg-hover border-2 border-[#333] rounded-lg px-3 py-3 text-[15px] text-text-primary" value={evoForm.droga} onChange={e => setEvoForm(f => ({...f, droga: e.target.value}))}>
                    <option value="">Selecione...</option>
                    <option>Lidocaína 1%</option><option>Lidocaína 2%</option>
                    <option>Bupivacaína 0,25%</option><option>Bupivacaína 0,5%</option>
                    <option>Ropivacaína 0,2%</option><option>Ropivacaína 0,5%</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-accent mb-1.5">Volume (mL)</label>
                    <input type="number" inputMode="decimal" className="w-full bg-bg-hover border-2 border-[#333] rounded-lg px-3 py-3 text-[15px] text-text-primary" placeholder="20" value={evoForm.volume} onChange={e => setEvoForm(f => ({...f, volume: e.target.value}))} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-accent mb-1.5">Dose total (mg)</label>
                    <input type="number" inputMode="decimal" className="w-full bg-bg-hover border-2 border-[#333] rounded-lg px-3 py-3 text-[15px] text-text-primary" placeholder="100" value={evoForm.dose} onChange={e => setEvoForm(f => ({...f, dose: e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent mb-1.5">Epinefrina</label>
                  <div className="flex gap-3">
                    {['Sim', 'Não'].map(e => (
                      <button key={e} onClick={() => setEvoForm(f => ({...f, epi: e}))} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border min-h-[44px] ${evoForm.epi === e ? 'bg-accent text-white border-accent' : 'bg-bg-hover text-text-secondary border-[#333]'}`}>{e}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-accent mb-1.5">Responsável</label>
                    <input className="w-full bg-bg-hover border-2 border-[#333] rounded-lg px-3 py-3 text-[15px] text-text-primary" placeholder="Dr. Nome" value={evoForm.resp} onChange={e => setEvoForm(f => ({...f, resp: e.target.value}))} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-accent mb-1.5">CRM</label>
                    <input className="w-full bg-bg-hover border-2 border-[#333] rounded-lg px-3 py-3 text-[15px] text-text-primary" placeholder="00000-GO" value={evoForm.crm} onChange={e => setEvoForm(f => ({...f, crm: e.target.value}))} />
                  </div>
                </div>
                <Button fullWidth onClick={generateEvolution} className="mt-2">Gerar texto da evolução</Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-base text-accent">Evolução gerada</h4>
                  <button onClick={() => setShowEvoResult(false)} className="px-4 py-2 bg-bg-hover rounded-md text-[13px] text-text-primary cursor-pointer border-none hover:bg-[#333]">Editar</button>
                </div>
                <textarea readOnly value={evoText} className="w-full bg-bg-hover border border-[#333] rounded-lg p-4 text-[13px] text-text-primary font-mono leading-relaxed min-h-[300px] resize-y" />
                <Button fullWidth onClick={copyEvolution} className="mt-4">Copiar texto</Button>
              </div>
            )}
              </div>
            </div>
          </div>
        )}

      </Container>
      <Footer toolName="Block Path" version="v4.0.0" updatedAt="Agosto 2026" />
      <FABMenu items={fabItems} />
      <ToastContainer />
    </div>
  )
}
