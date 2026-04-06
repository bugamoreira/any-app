import { useState, useCallback, useMemo } from 'react'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Collapsible } from '../components/common/Collapsible'
import { AlertCard } from '../components/common/AlertCard'
import { WeightInput } from '../components/common/WeightInput'
import { useWeight } from '../contexts/WeightContext'
import { useToast } from '../contexts/ToastContext'
import { calcDengueHydration } from '../utils/calculations'

// ==========================================
// TYPES
// ==========================================

type Screen =
  | 'home' | 'step1' | 'step2' | 'step3' | 'stepGrupo' | 'step5'
  | 'grupos' | 'classificacao'
  | 'grupoA' | 'grupoB' | 'grupoC' | 'grupoD'
  | 'calculadoras' | 'efasd' | 'examediff' | 'altasegura' | 'referencias'

type GrupoLetter = 'A' | 'B' | 'C' | 'D'

const ALARM_LABELS = [
  'Dor abdominal intensa e continua',
  'Vomitos persistentes',
  'Acumulo de liquidos (ascite, derrame pleural ou pericardico)',
  'Hipotensao postural e/ou lipotimia',
  'Hepatomegalia >2 cm abaixo do rebordo costal',
  'Sangramento de mucosas',
  'Letargia e/ou irritabilidade',
  'Hematocrito em ascensao (aumento >=20% do valor basal)',
]

const GRAVITY_LABELS = [
  'Choque (hipotensao, TEC >2s, pulsos finos, extremidades frias)',
  'Hemorragia grave (hematêmese, melena, metrorragia volumosa, SNC)',
  'Disfuncao organica grave (miocardite, encefalite, hepatite grave, IRA)',
]

const RISK_LABELS = [
  'Gestante',
  'Idade superior a 65 anos',
  'Comorbidades (HAS, DM, doenca renal, DPOC, hepatopatia, doenca hematologica)',
  'Risco social (dificil acesso ao servico de saude)',
  'Plaquetopenia <100.000/mm3',
]

const GRUPO_CONFIG: Record<GrupoLetter, { color: string; label: string; rgba: string }> = {
  A: { color: '#4CAF50', label: 'Ambulatorial', rgba: '76,175,80' },
  B: { color: '#FFC107', label: 'Observacao', rgba: '255,193,7' },
  C: { color: '#FF5252', label: 'Internacao', rgba: '255,82,82' },
  D: { color: '#F44336', label: 'UTI / Emergencia', rgba: '244,67,54' },
}

const SCREENS_WITH_WEIGHT: Screen[] = [
  'step2', 'step3', 'stepGrupo', 'step5', 'grupos', 'classificacao',
  'grupoA', 'grupoB', 'grupoC', 'grupoD', 'calculadoras',
]

// ==========================================
// HELPERS
// ==========================================

function fmtInt(n: number | null): string {
  if (n === null || n === undefined || isNaN(n)) return '--'
  return Math.round(n).toLocaleString('pt-BR')
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-text-secondary text-sm font-medium py-2 mb-3 cursor-pointer bg-transparent border-none"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Inicio
    </button>
  )
}

function StepHeader({ step, total, title, subtitle, color }: {
  step: number; total: number; title: string; subtitle?: string; color: string
}) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
      <div
        className="w-8 h-8 min-w-[32px] rounded-full flex items-center justify-center text-white text-sm font-bold"
        style={{ background: color }}
      >
        {step}
      </div>
      <div>
        <div className="text-xl font-bold text-text-primary">{title}</div>
        {subtitle && <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>}
        {!subtitle && <div className="text-xs text-text-muted mt-0.5">Passo {step} de {total}</div>}
      </div>
    </div>
  )
}

function StepNav({ onBack, onNext, backLabel, nextLabel }: {
  onBack?: () => void; onNext?: () => void; backLabel?: string; nextLabel?: string
}) {
  return (
    <div className="flex gap-3 mt-6 pt-4 border-t border-border">
      {onBack && (
        <button
          onClick={onBack}
          className="flex-1 py-3.5 bg-bg-hover border border-border-card rounded-lg text-white text-sm font-medium cursor-pointer min-h-[44px]"
        >
          {backLabel || '<- Voltar'}
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          className="flex-1 py-3.5 bg-accent border-none rounded-lg text-white text-sm font-semibold cursor-pointer min-h-[44px]"
        >
          {nextLabel || 'Proximo ->'}
        </button>
      )}
    </div>
  )
}

function CheckItem({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: () => void
}) {
  return (
    <button
      onClick={onChange}
      className="flex items-start gap-2.5 py-2.5 border-b border-border w-full text-left text-sm cursor-pointer bg-transparent border-x-0 border-t-0"
    >
      <div
        className={`w-5 h-5 min-w-[20px] mt-0.5 rounded-md flex items-center justify-center transition-colors border-2 ${
          checked ? 'bg-danger border-danger' : 'border-border-card'
        }`}
      >
        {checked && <span className="text-white text-xs font-bold">&#10003;</span>}
      </div>
      <span className="text-text-primary">{label}</span>
    </button>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-lg font-bold text-text-primary mb-4 pb-2 border-b border-border">
      {children}
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card border-l-[3px] border-l-info pl-4 pr-4 py-3 rounded-r-lg my-2.5 text-sm text-text-secondary">
      <strong className="text-text-primary block mb-1">{title}</strong>
      {children}
    </div>
  )
}

function CalcResult({ value, unit, secondary }: { value: string; unit: string; secondary?: string }) {
  return (
    <div className="text-center py-3 bg-bg-card rounded-lg mt-2">
      <div className="text-3xl font-bold leading-none text-text-primary">{value}</div>
      <div className="text-sm text-text-secondary ml-1">{unit}</div>
      {secondary && <div className="text-sm text-text-secondary mt-1">{secondary}</div>}
    </div>
  )
}

function CalcCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-3">
      <div className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">{label}</div>
      {children}
    </div>
  )
}

function BulletList({ items, color }: { items: string[]; color?: string }) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className="text-sm py-0.5 pl-3" style={{ color: color || 'var(--text-secondary)' }}>
          - {item}
        </div>
      ))}
    </div>
  )
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: `${color}22`, color }}
    >
      {label}
    </span>
  )
}

function ReclassSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="text-[11px] text-text-muted uppercase tracking-wider mb-2">Reclassificar</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function DenguePath() {
  const { weight } = useWeight()
  const { addToast } = useToast()

  // Navigation
  const [screen, setScreen] = useState<Screen>('home')
  const [trilhaGrupo, setTrilhaGrupo] = useState<GrupoLetter | null>(null)

  // Checklists
  const [alarmes, setAlarmes] = useState<boolean[]>(Array(8).fill(false))
  const [gravidade, setGravidade] = useState<boolean[]>(Array(3).fill(false))
  const [risco, setRisco] = useState<boolean[]>(Array(5).fill(false))

  // Classification result
  const [classResult, setClassResult] = useState<{ grupo: GrupoLetter; desc: string } | null>(null)

  // Classification flow (direct)
  const [classStep2Visible, setClassStep2Visible] = useState(false)
  const [classStep3Visible, setClassStep3Visible] = useState(false)

  // Ht calculator
  const [htBasal, setHtBasal] = useState('')
  const [htAtual, setHtAtual] = useState('')

  // WhatsApp
  const [wppMsg, setWppMsg] = useState('')
  const [wppVisible, setWppVisible] = useState(false)

  // Calculations
  const hydration = useMemo(() => {
    if (!weight || weight < 40 || weight > 200) return null
    return calcDengueHydration(weight)
  }, [weight])

  const showWeight = SCREENS_WITH_WEIGHT.includes(screen)

  const alarmCount = alarmes.filter(Boolean).length

  // Navigation
  const goTo = useCallback((target: Screen) => {
    // Reset alarmes ao reiniciar trilha (novo paciente)
    if (target === 'step1') {
      setAlarmes(Array(8).fill(false))
    }
    // Reset classification flow
    if (target === 'classificacao') {
      setClassStep2Visible(false)
      setClassStep3Visible(false)
    }
    // Reset classification result
    if (target === 'step3') {
      setGravidade(Array(3).fill(false))
      setRisco(Array(5).fill(false))
      setClassResult(null)
    }
    setScreen(target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Toggle alarm with sync
  const toggleAlarm = useCallback((index: number) => {
    setAlarmes(prev => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }, [])

  const toggleGravidade = useCallback((index: number) => {
    setGravidade(prev => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }, [])

  const toggleRisco = useCallback((index: number) => {
    setRisco(prev => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }, [])

  // Classification logic (trilha step 3)
  const classifyNow = useCallback(() => {
    const hasGravidade = gravidade.some(Boolean)
    if (hasGravidade) {
      setClassResult({ grupo: 'D', desc: 'Sinais de gravidade presentes -- considere UTI ou sala de emergencia' })
      return
    }
    if (alarmCount > 0) {
      setClassResult({ grupo: 'C', desc: 'Sinais de alarme presentes -- considere internacao para hidratacao IV e monitorizacao' })
      return
    }
    const hasRisco = risco.some(Boolean)
    if (hasRisco) {
      setClassResult({ grupo: 'B', desc: 'Condicao de risco presente -- considere observacao em unidade de saude com reavaliacao' })
      return
    }
    setClassResult({ grupo: 'A', desc: 'Sem sinais de alarme ou risco -- considere acompanhamento ambulatorial com hidratacao oral' })
  }, [gravidade, alarmCount, risco])

  // Open trilha grupo
  const openTrilhaGrupo = useCallback((g: GrupoLetter) => {
    setTrilhaGrupo(g)
    goTo('stepGrupo')
  }, [goTo])

  // Ht variation
  const htVariation = useMemo(() => {
    const basal = parseFloat(htBasal)
    const atual = parseFloat(htAtual)
    if (!basal || !atual || basal <= 0) return null
    return ((atual - basal) / basal) * 100
  }, [htBasal, htAtual])

  const htInterpretation = useMemo(() => {
    if (htVariation === null) return { text: 'Insira os valores de Ht', color: 'var(--text-muted)' }
    if (htVariation >= 20) return { text: 'Hemoconcentracao significativa (>=20%)', color: '#F44336' }
    if (htVariation >= 10) return { text: 'Elevacao moderada -- monitorizar', color: '#FFC107' }
    if (htVariation > 0) return { text: 'Elevacao discreta', color: '#4CAF50' }
    if (htVariation < -10) return { text: 'Queda significativa -- avaliar hemorragia se piora clinica', color: '#FFC107' }
    return { text: 'Estavel ou em queda discreta', color: '#4CAF50' }
  }, [htVariation])

  // WhatsApp message
  const gerarMsgWhatsApp = useCallback(() => {
    const now = new Date()
    const data = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
    const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const msg = `*ORIENTA\u00C7\u00D5ES DE ALTA \u2014 DENGUE*
_Emitido em ${data} \u00E0s ${hora}_

*Hidrata\u00E7\u00E3o:*
Beber bastante l\u00EDquido ao longo do dia (\u00E1gua, suco, ch\u00E1, \u00E1gua de coco). Pelo menos 2 a 3 litros por dia, incluindo soro de reidrata\u00E7\u00E3o oral.

*Repouso:*
Manter repouso relativo nos primeiros dias.

*Medica\u00E7\u00E3o:*
Usar apenas paracetamol ou dipirona para febre ou dor.
*N\u00C3O usar* ibuprofeno, diclofenaco, AAS (aspirina) ou outros anti-inflamat\u00F3rios.

*Retorno:*
Conforme orienta\u00E7\u00E3o m\u00E9dica para reavalia\u00E7\u00E3o.

---

*PROCURE ATENDIMENTO IMEDIATO SE:*
- Dor abdominal forte e cont\u00EDnua
- V\u00F4mitos que n\u00E3o param
- Sangramento (gengiva, nariz, fezes ou urina escuras)
- Tontura ou desmaio ao levantar
- Pele fria, p\u00E1lida ou suada
- Falta de ar
- Sonol\u00EAncia excessiva ou agita\u00E7\u00E3o

_Dengue Path \u2014 ANY App \u2014 Medicina de Emerg\u00EAncia_
_Ferramenta de apoio \u00E0 decis\u00E3o cl\u00EDnica_`

    setWppMsg(msg)
    setWppVisible(true)
  }, [])

  const copiarMsgWpp = useCallback(() => {
    navigator.clipboard.writeText(wppMsg).then(() => {
      addToast('Mensagem copiada!', 'success')
    }).catch(() => {
      addToast('Erro ao copiar', 'error')
    })
  }, [wppMsg, addToast])

  const compartilharWpp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(wppMsg)}`, '_blank')
  }, [wppMsg])

  // FAB items
  const fabItems = useMemo(() => [
    { label: 'Inicio', onClick: () => goTo('home') },
    { label: 'Trilha', onClick: () => goTo('step1') },
    { label: 'Grupos', onClick: () => goTo('grupos') },
    { label: 'Calculadoras', onClick: () => goTo('calculadoras') },
    { label: 'Exames', onClick: () => goTo('examediff') },
    { label: 'Alta segura', onClick: () => goTo('altasegura') },
  ], [goTo])

  // ==========================================
  // SCREENS
  // ==========================================

  const renderHome = () => (
    <div>
      <AlertCard type="warning" className="mb-4">
        Ferramenta para adultos (&#8805;15 anos)
      </AlertCard>

      {/* Trilha: botao destaque full-width */}
      <Card
        borderColor="#FF5252"
        className="mb-4 text-center cursor-pointer active:opacity-90"
        onClick={() => goTo('step1')}
      >
        <div className="py-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2" className="mx-auto mb-2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <div className="text-base font-semibold text-text-primary">Dengue Path</div>
          <div className="text-xs text-text-muted mt-1">Trilha completa: avaliacao -&gt; classificacao -&gt; manejo -&gt; desfecho</div>
        </div>
      </Card>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { id: 'grupos' as Screen, label: 'Manejo por grupos', desc: 'Grupos A, B, C e D', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
          { id: 'calculadoras' as Screen, label: 'Calculadoras', desc: 'VO, IV, albumina', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/></svg> },
          { id: 'efasd' as Screen, label: 'Protocolo E-FASD', desc: 'POCUS na dengue', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
          { id: 'examediff' as Screen, label: 'Exames e diag. diferenciais', desc: 'Laboratorio e arboviroses', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg> },
          { id: 'classificacao' as Screen, label: 'Classificacao direta', desc: 'Gravidade -> alarme -> risco', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg> },
          { id: 'altasegura' as Screen, label: 'Alta segura', desc: 'Criterios e orientacoes', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
          { id: 'referencias' as Screen, label: 'Referencias', desc: 'Fontes e bibliografia', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => goTo(item.id)}
            className="bg-bg-card border border-border-card rounded-xl p-4 text-center cursor-pointer transition-all min-h-[44px] flex flex-col items-center justify-center gap-1.5 active:bg-bg-hover active:scale-[0.97]"
          >
            {item.icon}
            <div className="text-xs font-semibold text-text-primary leading-tight">{item.label}</div>
            <div className="text-[10px] text-text-muted leading-tight">{item.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )

  // ========== TRILHA STEP 1 ==========
  const renderStep1 = () => (
    <div>
      <StepHeader step={1} total={3} title="Avaliacao inicial e suspeita" color="#4A6FA5" />
      <AlertCard type="info" title="Caso suspeito">
        Febre (geralmente 2-7 dias) + epidemiologia compativel + &#8805;2 dos seguintes: cefaleia, dor retroorbitaria, mialgia, artralgia, prostracao, exantema.
      </AlertCard>
      <p className="text-xs text-text-muted italic mb-3">
        Marque apenas o que se aplica ao paciente. Se nenhum item se aplica, avance normalmente.
      </p>
      <InfoCard title="Prova do laco">
        Insuflar manguito no ponto medio entre PAS e PAD por 5 min. Contar petequias em quadrado 2,5 x 2,5 cm. Positiva: &#8805;20 petequias (adultos). Resultado falso-negativo pode ocorrer em pacientes obesos, em choque ou em uso de anti-hipertensivos.
      </InfoCard>
      <AlertCard type="warning" title="Exames iniciais sugeridos" className="text-xs">
        Hemograma com hematocrito. Se sinais de alarme ou gravidade: funcao renal, hepatica, coagulograma, tipagem.
      </AlertCard>
      <StepNav onBack={() => goTo('home')} onNext={() => goTo('step2')} backLabel="<- Inicio" />
    </div>
  )

  // ========== TRILHA STEP 2 — ALARMES ==========
  const renderStep2 = () => (
    <div>
      <StepHeader step={2} total={3} title="Sinais de alarme" color="#C4972A" />
      <p className="text-xs text-text-muted italic mb-3">
        Marque os sinais presentes. Se nenhum, avance para a classificacao.
      </p>
      <p className="text-sm text-text-secondary mb-3">
        <strong className="text-warning">Qualquer um</strong> presente -&gt; pelo menos Grupo C.
      </p>
      {ALARM_LABELS.map((label, i) => (
        <CheckItem key={i} label={label} checked={alarmes[i]} onChange={() => toggleAlarm(i)} />
      ))}
      {alarmCount > 0 && (
        <div className="mt-3">
          <AlertCard type="danger" title={`${alarmCount} ${alarmCount === 1 ? 'SINAL DE ALARME' : 'SINAIS DE ALARME'}`}>
            Classificar como pelo menos Grupo C.
          </AlertCard>
        </div>
      )}
      <StepNav onBack={() => goTo('step1')} onNext={() => goTo('step3')} />
    </div>
  )

  // ========== TRILHA STEP 3 — CLASSIFICACAO ==========
  const renderStep3 = () => {
    const alarmSummary = alarmes
      .map((checked, i) => (checked ? ALARM_LABELS[i] : null))
      .filter(Boolean)

    return (
      <div>
        <StepHeader step={3} total={3} title="Classificacao" color="#C62828" />
        <p className="text-xs text-text-muted italic mb-4">
          Marque apenas o que se aplica. Se nenhum item se aplica em cada secao, prossiga para classificar.
        </p>

        {/* Gravidade */}
        <div className="mb-5">
          <div className="text-sm font-bold text-danger uppercase tracking-wider mb-2">Sinais de gravidade</div>
          {GRAVITY_LABELS.map((label, i) => (
            <CheckItem key={i} label={label} checked={gravidade[i]} onChange={() => toggleGravidade(i)} />
          ))}
        </div>

        {/* Alarmes (resumo) */}
        <div className="mb-5">
          <div className="text-sm font-bold text-warning uppercase tracking-wider mb-2">Sinais de alarme</div>
          {alarmSummary.length === 0 ? (
            <div className="bg-success/10 border border-success rounded-lg p-3 text-sm text-success">
              Nenhum sinal de alarme identificado no passo anterior
            </div>
          ) : (
            <div className="bg-warning/10 border border-warning rounded-lg p-3">
              <div className="text-sm font-semibold text-warning mb-1">
                {alarmSummary.length} {alarmSummary.length === 1 ? 'sinal de alarme identificado' : 'sinais de alarme identificados'}
              </div>
              {alarmSummary.map((item, i) => (
                <div key={i} className="text-xs text-warning py-0.5">- {item}</div>
              ))}
            </div>
          )}
        </div>

        {/* Risco */}
        <div className="mb-5">
          <div className="text-sm font-bold text-info uppercase tracking-wider mb-2">Condicoes de risco</div>
          {RISK_LABELS.map((label, i) => (
            <CheckItem key={i} label={label} checked={risco[i]} onChange={() => toggleRisco(i)} />
          ))}
        </div>

        {/* Botao classificar */}
        <Button fullWidth onClick={classifyNow} className="py-4 text-base font-semibold">
          Classificar
        </Button>

        {/* Resultado */}
        {classResult && (
          <div
            className="rounded-xl p-5 mt-4 text-center border-2"
            style={{
              background: `rgba(${GRUPO_CONFIG[classResult.grupo].rgba},0.1)`,
              borderColor: GRUPO_CONFIG[classResult.grupo].color,
            }}
          >
            <div className="text-sm font-bold uppercase tracking-wider mb-1" style={{ color: GRUPO_CONFIG[classResult.grupo].color }}>
              Classificacao sugerida
            </div>
            <div className="text-3xl font-bold" style={{ color: GRUPO_CONFIG[classResult.grupo].color }}>
              GRUPO {classResult.grupo}
            </div>
            <div className="text-sm mb-2" style={{ color: GRUPO_CONFIG[classResult.grupo].color }}>
              {GRUPO_CONFIG[classResult.grupo].label}
            </div>
            <div className="text-sm text-text-secondary mt-2">{classResult.desc}</div>
            <Button
              fullWidth
              className="mt-4"
              style={{ background: GRUPO_CONFIG[classResult.grupo].color }}
              onClick={() => openTrilhaGrupo(classResult.grupo)}
            >
              Ver manejo do Grupo {classResult.grupo}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              className="mt-2"
              onClick={() => {
                setGravidade(Array(3).fill(false))
                setRisco(Array(5).fill(false))
                setClassResult(null)
              }}
            >
              Reavaliar classificacao
            </Button>
          </div>
        )}

        <StepNav onBack={() => goTo('step2')} />
      </div>
    )
  }

  // ========== TRILHA STEP 4 — MANEJO POR GRUPO ==========
  const renderStepGrupo = () => {
    const g = trilhaGrupo || 'A'
    const cfg = GRUPO_CONFIG[g]
    const isCD = g === 'C' || g === 'D'

    return (
      <div>
        <StepHeader step={4} total={5} title={`Grupo ${g} -- ${cfg.label}`} subtitle="Passo 4 de 5" color={cfg.color} />

        {g === 'A' && (
          <>
            <AlertCard type="success" title="Conduta">
              Hidratacao oral domiciliar + acompanhamento ambulatorial.
            </AlertCard>
            <CalcCard label="Hidratacao oral: 60 mL/kg/dia">
              <CalcResult
                value={fmtInt(hydration?.voTotal ?? null)}
                unit="mL/dia"
                secondary={`1/3 SRO (${fmtInt(hydration?.voSRO ?? null)} mL) + 2/3 liquidos (${fmtInt(hydration?.voLiquidos ?? null)} mL)`}
              />
            </CalcCard>
            <InfoCard title="Orientacao pratica">
              <p>Considere oferecer agua, suco de frutas, cha, agua de coco. Evitar bebidas com cafeina. Distribuir ao longo do dia (nao forcar grandes volumes de uma vez).</p>
            </InfoCard>
            <InfoCard title="Antiemeticos (se necessario)">
              <p>Metoclopramida 10 mg IV/VO 8/8h (ampola 10 mg/2 mL) ou ondansetrona 4-8 mg IV/VO 8/8h (ampola 4 mg/2 mL). Evitar AINEs e AAS.</p>
            </InfoCard>
            <AlertCard type="warning" title="Orientar retorno imediato se:">
              Dor abdominal intensa, vomitos persistentes, sangramento, tontura ao levantar, pele fria/palida, dispneia, sonolencia ou agitacao.
            </AlertCard>
          </>
        )}

        {g === 'B' && (
          <>
            <AlertCard type="warning" title="Conduta">
              Hidratacao oral supervisionada em unidade de saude por pelo menos 6 horas. Solicitar hemograma com hematocrito.
            </AlertCard>
            <CalcCard label="Hidratacao oral: 60 mL/kg/dia">
              <CalcResult
                value={fmtInt(hydration?.voTotal ?? null)}
                unit="mL/dia"
                secondary={`1/3 SRO (${fmtInt(hydration?.voSRO ?? null)} mL) + 2/3 liquidos (${fmtInt(hydration?.voLiquidos ?? null)} mL)`}
              />
            </CalcCard>
            <InfoCard title="Condicoes de risco">
              <p className="text-xs text-text-secondary leading-relaxed">Gestante, &lt;2 anos ou &gt;65 anos, HAS, DM, DPOC, doenca hematologica, renal cronica, doenca peptica, hepatopatia, doenca autoimune, uso de anticoagulantes, risco social.</p>
            </InfoCard>
            <InfoCard title="Acompanhamento">
              <p>Hemograma com hematocrito antes da hidratacao e apos (em 4-6h). Se Ht estavel e sem sinais de alarme, considere alta com orientacoes. Se Ht subindo, considere reclassificar para Grupo C.</p>
            </InfoCard>
            <AlertCard type="danger" title="Reclassificar para C se:">
              Surgimento de qualquer sinal de alarme ou hematocrito em ascensao (aumento &#8805;20% do valor basal). Referencia: homem ~45%, mulher ~40%. Repetir Ht a cada 2-4h durante expansao.
            </AlertCard>
          </>
        )}

        {g === 'C' && (
          <>
            <AlertCard type="danger" title="Conduta imediata">
              Hidratacao IV: SF 0,9% ou RL -- 10 mL/kg/h por 2 horas. Solicitar hemograma, funcao renal, hepatica, tipagem sanguinea.
            </AlertCard>
            <CalcCard label="Fase de expansao (2h)">
              <div className="flex gap-2">
                <CalcResult value={fmtInt(hydration?.ivHora ?? null)} unit="mL/h" />
                <CalcResult value={fmtInt(hydration?.iv2h ?? null)} unit="mL em 2h" />
              </div>
            </CalcCard>
            <AlertCard type="success" title="Se melhora + Ht queda">
              Manutencao: 25 mL/kg em 6h ({fmtInt(hydration?.ivMan6 ?? null)} mL -&gt; {fmtInt(hydration ? hydration.ivMan6 / 6 : null)} mL/h). Depois 25 mL/kg em 8h.
            </AlertCard>
            <AlertCard type="warning" title="Sem melhora">
              Repetir expansao. Se falhar 2a vez -&gt; manejar como Grupo D.
            </AlertCard>
          </>
        )}

        {g === 'D' && (
          <>
            <AlertCard type="danger" title="Emergencia">
              SF 0,9% -- 20 mL/kg em ate 20 min. Repetir ate 3x. Dois acessos calibrosos. Considere UTI.
            </AlertCard>
            <InfoCard title="Criterios de dengue grave">
              <p className="text-xs text-text-secondary leading-relaxed">Choque (pulso fino, TEC &gt;2s, PA convergente ou hipotensao), hemorragia grave (hematêmese, melena, SNC), disfuncao organica (AST/ALT &gt;1.000, encefalite, miocardite, IRA).</p>
            </InfoCard>
            <CalcCard label="Bolus rapido -- 20 mL/kg">
              <CalcResult value={fmtInt(hydration?.bolus ?? null)} unit="mL por bolus (ate 3x)" />
            </CalcCard>
            <InfoCard title="Refratario a cristaloide">
              <p>Albumina 20%: 0,5-1 g/kg ({fmtInt(hydration?.alb05 ?? null)} a {fmtInt(hydration?.alb1 ?? null)} mL). Se Ht em queda + choque -&gt; hemotransfusao. Se refratario a volume -&gt; noradrenalina.</p>
            </InfoCard>
            <InfoCard title="Metas de ressuscitacao">
              <BulletList items={[
                'PAS >90 mmHg (ou PAM >65 mmHg)',
                'FC <100 bpm',
                'TEC <2s',
                'Diurese >0,5 mL/kg/h',
                'Ht estavel ou em queda',
                'Melhora do nivel de consciencia',
              ]} />
            </InfoCard>
          </>
        )}

        {isCD && (
          <div className="bg-info/10 border border-info rounded-xl p-4 mt-3">
            <p className="text-sm text-info leading-relaxed">
              Paciente em internacao -- sem fluxo de alta neste momento. Use os botoes de reclassificacao conforme evolucao clinica.
            </p>
          </div>
        )}

        <StepNav
          onBack={() => goTo('step3')}
          onNext={!isCD ? () => goTo('step5') : undefined}
        />
      </div>
    )
  }

  // ========== TRILHA STEP 5 — ALTA ==========
  const renderStep5 = () => (
    <div>
      <StepHeader step={5} total={5} title="Criterios de alta e seguimento" color="#4CAF50" />
      <BulletList items={[
        'Ausencia de febre por 24-48h sem antitermicos',
        'Melhora clinica visivel',
        'Hematocrito estavel',
        'Plaquetas em ascensao',
        'Estabilidade hemodinamica por 24h',
        'Hidratacao oral adequada',
        'Diurese >0,5 mL/kg/h',
      ]} />
      <AlertCard type="warning" title="Orientar retorno imediato se:" className="mt-3">
        Dor abdominal intensa, vomitos persistentes, sangramento, tontura ao levantar, pele fria/palida, dispneia, sonolencia ou agitacao.
      </AlertCard>
      <Button variant="outline" fullWidth className="mt-3" onClick={() => goTo('altasegura')}>
        Ver orientacoes completas para alta segura -&gt;
      </Button>
      <StepNav onBack={() => goTo('stepGrupo')} onNext={() => goTo('home')} nextLabel="Inicio" />
    </div>
  )

  // ========== GRUPOS HUB ==========
  const renderGrupos = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Manejo por grupos</SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Acesso direto ao manejo por classificacao</p>
      <div className="grid grid-cols-2 gap-2.5">
        {([
          { g: 'A' as GrupoLetter, color: '#4CAF50', desc: 'Ambulatorial', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M12 2L6 12a6 6 0 1 0 12 0L12 2z"/></svg> },
          { g: 'B' as GrupoLetter, color: '#FFC107', desc: 'Observacao >=6h', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
          { g: 'C' as GrupoLetter, color: '#F44336', desc: 'Internacao + IV', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
          { g: 'D' as GrupoLetter, color: '#F44336', desc: 'UTI / Emergencia', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2"><circle cx="12" cy="12" r="10" fill="#F44336" fillOpacity="0.2"/></svg> },
        ]).map(item => (
          <button
            key={item.g}
            onClick={() => goTo(`grupo${item.g}` as Screen)}
            className="bg-bg-card border rounded-xl p-4 text-center cursor-pointer transition-all min-h-[44px] flex flex-col items-center justify-center gap-1.5 active:bg-bg-hover active:scale-[0.97]"
            style={{ borderColor: item.color }}
          >
            {item.icon}
            <div className="text-xs font-semibold text-text-primary">Grupo {item.g}</div>
            <div className="text-[10px] text-text-muted">{item.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )

  // ========== CLASSIFICACAO DIRETA ==========
  const renderClassificacao = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Classificacao clinica</SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Ministerio da Saude, 6a edicao (2024)</p>

      {/* Sinais de alarme checklist */}
      <Collapsible title="Sinais de alarme" badge="Avaliar" badgeColor="#F44336">
        <p className="text-sm text-text-secondary mb-3">
          Marque os sinais presentes. A presenca de <strong className="text-warning">qualquer um</strong> indica pelo menos Grupo C.
        </p>
        {ALARM_LABELS.map((label, i) => (
          <CheckItem key={i} label={label} checked={alarmes[i]} onChange={() => toggleAlarm(i)} />
        ))}
        {alarmCount > 0 && (
          <div className="mt-3">
            <AlertCard type="danger" title={`${alarmCount} ${alarmCount === 1 ? 'SINAL DE ALARME' : 'SINAIS DE ALARME'}`}>
              Classificar como pelo menos Grupo C. Iniciar hidratacao IV.
            </AlertCard>
          </div>
        )}
      </Collapsible>

      {/* Prova do laco */}
      <Collapsible title="Prova do laco" badge="Tecnica" badgeColor="#2196F3">
        <div className="space-y-3">
          {[
            { n: 1, t: 'Aferir PA', p: 'Insufle o manguito ate o ponto medio entre PAS e PAD.' },
            { n: 2, t: 'Manter por 5 minutos', p: 'Manter o manguito insuflado no ponto medio. Em criancas, considere 3 minutos.' },
            { n: 3, t: 'Contar petequias', p: 'Desenhe um quadrado de 2,5 x 2,5 cm no antebraco e conte as petequias.' },
          ].map(s => (
            <div key={s.n} className="flex gap-3">
              <div className="w-7 h-7 min-w-[28px] rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold mt-0.5">{s.n}</div>
              <div>
                <h4 className="text-sm font-semibold">{s.t}</h4>
                <p className="text-sm text-text-secondary">{s.p}</p>
              </div>
            </div>
          ))}
        </div>
        <AlertCard type="danger" title="Positiva" className="mt-2">
          &#8805; 20 petequias em adultos no quadrado. Considere fragilidade capilar -- nao exclui nem confirma dengue isoladamente.
        </AlertCard>
        <InfoCard title="Atencao">
          <p>A prova do laco pode ser negativa em pacientes obesos, em choque ou uso de anti-hipertensivos. Nao substitui avaliacao clinica e laboratorial.</p>
        </InfoCard>
      </Collapsible>

      {/* Fluxo de classificacao */}
      <Collapsible title="Fluxo de classificacao">
        <AlertCard type="info" title="Passo 1">
          Ha sinais de gravidade? (choque, sangramento grave, disfuncao organica grave)
        </AlertCard>
        <div className="flex gap-2 mt-2">
          <Button variant="danger" size="sm" className="flex-1" onClick={() => goTo('grupoD')}>Sim -&gt; Grupo D</Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => setClassStep2Visible(true)}>Nao -&gt; Proximo</Button>
        </div>

        {classStep2Visible && (
          <div className="mt-4">
            <AlertCard type="warning" title="Passo 2">
              Ha sinais de alarme? (use o checklist acima)
            </AlertCard>
            <div className="flex gap-2 mt-2">
              <Button size="sm" className="flex-1" style={{ background: '#FFC107', color: '#000' }} onClick={() => goTo('grupoC')}>Sim -&gt; Grupo C</Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setClassStep3Visible(true)}>Nao -&gt; Proximo</Button>
            </div>
          </div>
        )}

        {classStep3Visible && (
          <div className="mt-4">
            <AlertCard type="success" title="Passo 3">
              Ha condicao de risco?
              <br />
              <span className="text-xs">Gestante, &lt;2 anos ou &gt;65 anos, comorbidades (HAS, DM, DPOC, doenca hematologica, renal cronica, doenca peptica, hepatopatia), risco social</span>
            </AlertCard>
            <div className="flex gap-2 mt-2">
              <Button variant="secondary" size="sm" className="flex-1 border-warning" onClick={() => goTo('grupoB')}>Sim -&gt; Grupo B</Button>
              <Button variant="success" size="sm" className="flex-1" onClick={() => goTo('grupoA')}>Nao -&gt; Grupo A</Button>
            </div>
          </div>
        )}
      </Collapsible>
    </div>
  )

  // ========== GRUPO A ==========
  const renderGrupoA = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Grupo A <Tag label="Ambulatorial" color="#4CAF50" /></SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Sem sinais de alarme, sem condicoes de risco</p>

      <AlertCard type="success" title="Conduta">Hidratacao oral domiciliar + acompanhamento ambulatorial</AlertCard>

      <Collapsible title="Hidratacao oral">
        <CalcCard label="Volume total: 60 mL/kg/dia">
          <CalcResult
            value={fmtInt(hydration?.voTotal ?? null)}
            unit="mL/dia"
            secondary={`1/3 SRO (${fmtInt(hydration?.voSRO ?? null)} mL) + 2/3 liquidos (${fmtInt(hydration?.voLiquidos ?? null)} mL)`}
          />
        </CalcCard>
        <InfoCard title="Orientacao pratica">
          <p>Considere oferecer agua, suco de frutas, cha, agua de coco. Evitar bebidas com cafeina. O volume diario inclui alimentacao liquida. Distribuir ao longo do dia (nao forcar grandes volumes de uma vez).</p>
        </InfoCard>
      </Collapsible>

      <Collapsible title="Antiemeticos">
        <InfoCard title="Metoclopramida">
          <p>10 mg IV ou VO, a cada 8 horas. Ampola: 10 mg/2 mL.</p>
        </InfoCard>
        <InfoCard title="Ondansetrona">
          <p>4-8 mg IV ou VO, a cada 8 horas. Ampola: 4 mg/2 mL ou 8 mg/4 mL.</p>
        </InfoCard>
        <AlertCard type="info" title="Nota" className="text-xs">
          Considere antiemeticos se vomitos dificultarem a hidratacao oral. Evitar anti-inflamatorios nao esteroidais (AINEs) e acido acetilsalicilico.
        </AlertCard>
      </Collapsible>

      <Collapsible title="Retorno e sinais de alarme" badge="Importante" badgeColor="#FFC107">
        <p className="text-sm text-text-secondary mb-3">
          Orientar o paciente a retornar <strong className="text-warning">imediatamente</strong> se apresentar qualquer um dos seguintes:
        </p>
        <BulletList items={[
          'Dor abdominal intensa e continua',
          'Vomitos persistentes',
          'Sangramento (gengiva, nariz, fezes escuras, urina escura)',
          'Tontura ou desmaio ao levantar',
          'Pele fria, palida ou pegajosa',
          'Dificuldade para respirar',
          'Sonolencia excessiva ou agitacao',
        ]} />
        <Button variant="outline" fullWidth className="mt-3" onClick={() => goTo('altasegura')}>
          Gerar orientacoes para WhatsApp -&gt;
        </Button>
      </Collapsible>

      <Button fullWidth className="mt-3" onClick={() => goTo('altasegura')}>
        Orientacoes de alta completas -&gt;
      </Button>

      <ReclassSection>
        <Button variant="secondary" fullWidth size="sm" className="border-warning" onClick={() => goTo('grupoB')}>
          Identificou condicao de risco -&gt; Grupo B
        </Button>
        <Button fullWidth size="sm" style={{ background: '#FFC107', color: '#000' }} onClick={() => goTo('grupoC')}>
          Evoluiu com sinais de alarme -&gt; Grupo C
        </Button>
      </ReclassSection>
    </div>
  )

  // ========== GRUPO B ==========
  const renderGrupoB = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Grupo B <Tag label="Observacao" color="#FFC107" /></SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Sem sinais de alarme, com condicao de risco</p>

      <AlertCard type="warning" title="Conduta">
        Hidratacao oral supervisionada em unidade de saude por pelo menos 6 horas. Solicitar hemograma com hematocrito.
      </AlertCard>

      <Collapsible title="Condicoes de risco">
        <BulletList items={[
          'Gestante',
          'Idade <2 anos ou >65 anos',
          'Hipertensao arterial ou outras doencas cardiovasculares',
          'Diabetes mellitus',
          'DPOC',
          'Doenca hematologica (anemia falciforme, etc.)',
          'Doenca renal cronica',
          'Doenca acido-peptica',
          'Hepatopatia',
          'Doenca autoimune',
          'Uso de anticoagulantes',
          'Risco social ou comorbidade nao listada',
        ]} />
      </Collapsible>

      <Collapsible title="Hidratacao e monitorizacao">
        <CalcCard label="Hidratacao oral: 60 mL/kg/dia">
          <CalcResult value={fmtInt(hydration?.voTotal ?? null)} unit="mL/dia" secondary="1/3 SRO + 2/3 liquidos" />
        </CalcCard>
        <AlertCard type="info" title="Acompanhamento">
          Hemograma com hematocrito antes da hidratacao e apos (em 4-6h). Se o Ht estiver estavel e sem sinais de alarme, considere alta com orientacoes. Se Ht subindo, considere reclassificar para Grupo C.
        </AlertCard>
      </Collapsible>

      <AlertCard type="danger" title="Reclassificar para Grupo C se:" className="mt-3">
        Surgimento de qualquer sinal de alarme ou hematocrito em ascensao (aumento &#8805;20% do valor basal). Referencia: homem ~45%, mulher ~40%. Repetir Ht a cada 2-4h durante expansao.
      </AlertCard>

      <Button fullWidth className="mt-3" onClick={() => goTo('altasegura')}>
        Orientacoes de alta completas -&gt;
      </Button>

      <ReclassSection>
        <Button variant="success" fullWidth size="sm" onClick={() => goTo('grupoA')}>
          Sem criterios de risco -&gt; Grupo A
        </Button>
        <Button fullWidth size="sm" style={{ background: '#FFC107', color: '#000' }} onClick={() => goTo('grupoC')}>
          Sinais de alarme -&gt; Grupo C
        </Button>
      </ReclassSection>
    </div>
  )

  // ========== GRUPO C ==========
  const renderGrupoC = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Grupo C <Tag label="Internacao" color="#F44336" /></SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Com sinais de alarme -- Iniciar reposicao volemica imediata</p>

      <AlertCard type="danger" title="Conduta imediata">
        Hidratacao IV: 10 mL/kg/h por 2 horas (fase de expansao). Solicitar hemograma, funcao renal, hepatica, tipagem sanguinea.
      </AlertCard>

      <Collapsible title="Fase de expansao (primeiras 2h)">
        <CalcCard label="SF 0,9% ou RL -- 10 mL/kg/h x 2h">
          <div className="flex gap-2">
            <CalcResult value={fmtInt(hydration?.ivHora ?? null)} unit="mL/h" />
            <CalcResult value={fmtInt(hydration?.iv2h ?? null)} unit="mL em 2h" />
          </div>
        </CalcCard>
      </Collapsible>

      <Collapsible title="Reavaliacao apos 2h" badge="Decisao" badgeColor="#FFC107">
        <p className="text-sm text-text-secondary mb-3">Reavaliar clinicamente e repetir hematocrito:</p>
        <AlertCard type="success" title="Melhora clinica + Ht em queda">
          Reduzir para fase de manutencao: 25 mL/kg em 6h. Reavaliar em 6h. Se mantiver melhora, passar para 25 mL/kg em 8h (etapa final).
        </AlertCard>
        <AlertCard type="warning" title="Sem melhora ou Ht em ascensao (aumento >=20% do basal)">
          Repetir fase de expansao (10 mL/kg/h por mais 2h). Repetir Ht a cada 2-4h durante expansao. Se nao houver melhora apos segunda expansao, manejar como Grupo D.
        </AlertCard>
        <CalcCard label="Fase de manutencao">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-[11px] text-text-muted mb-1">25 mL/kg em 6h</div>
              <CalcResult value={fmtInt(hydration?.ivMan6 ?? null)} unit="mL total" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-text-muted mb-1">25 mL/kg em 8h</div>
              <CalcResult value={fmtInt(hydration?.ivMan8 ?? null)} unit="mL total" />
            </div>
          </div>
        </CalcCard>
        <Button variant="danger" fullWidth size="sm" className="mt-3" onClick={() => goTo('grupoD')}>
          Sem resposta -&gt; Grupo D
        </Button>
      </Collapsible>

      <Collapsible title="Monitorizacao durante observacao">
        <InfoCard title="Parametros de monitorizacao">
          <BulletList items={[
            'Sinais vitais a cada 1-2h',
            'Ht de controle a cada 4-6h',
            'Repetir Ht a cada 2-4h durante expansao',
            'Diurese (alvo >0,5 mL/kg/h)',
            'Balanco hidrico a cada 6h',
          ]} />
        </InfoCard>
      </Collapsible>

      <Collapsible title="Reavaliacao seriada">
        <InfoCard title="Apos cada fase de expansao">
          <BulletList items={[
            'Checar PA, FC, TEC, diurese',
            'Se melhora: passar para manutencao',
            'Se piora: reclassificar para Grupo D',
          ]} />
        </InfoCard>
      </Collapsible>

      <Collapsible title="Fase critica (defervescencia)" badge="Atencao" badgeColor="#F44336">
        <AlertCard type="danger" title="Periodo de maior risco">
          Ocorre entre o 3o e 7o dia de doenca. Janela de 24-48h de maior risco de extravasamento plasmatico.
        </AlertCard>
        <InfoCard title="Conduta">
          <p>Considere intensificar monitorizacao quando a febre ceder. A melhora da febre nao significa melhora clinica -- pode indicar o inicio da fase critica.</p>
        </InfoCard>
      </Collapsible>

      <Collapsible title="Criterios para considerar UTI">
        <BulletList items={[
          'Choque refratario a 2 expansoes',
          'Necessidade de vasopressor',
          'Sangramento grave ativo',
          'Disfuncao organica (IRA, SDRA, encefalite)',
          'Rebaixamento do nivel de consciencia',
        ]} />
      </Collapsible>

      <ReclassSection>
        <Button variant="danger" fullWidth size="sm" onClick={() => goTo('grupoD')}>
          Sinais de gravidade -&gt; Grupo D
        </Button>
        <Button variant="secondary" fullWidth size="sm" onClick={() => goTo('grupoB')}>
          Melhora clinica -&gt; Grupo B
        </Button>
      </ReclassSection>
    </div>
  )

  // ========== GRUPO D ==========
  const renderGrupoD = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Grupo D <Tag label="UTI / Emergencia" color="#F44336" /></SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Dengue grave -- Choque, hemorragia grave ou disfuncao organica</p>

      <AlertCard type="danger" title="Emergencia">
        Iniciar reposicao volemica agressiva imediatamente. Acesso venoso calibroso (dois acessos). Considere UTI.
      </AlertCard>

      <Collapsible title="Criterios de dengue grave">
        <BulletList items={[
          'Choque: pulso rapido e fino, TEC >2s, PA convergente (<=20 mmHg) ou hipotensao, extremidades frias',
          'Hemorragia grave: hematêmese, melena volumosa, sangramento do SNC',
          'Disfuncao organica: hepatite (AST/ALT >1.000), encefalite, miocardite, insuficiencia renal aguda',
        ]} />
      </Collapsible>

      <Collapsible title="Fase de expansao rapida" badge="Urgente" badgeColor="#F44336">
        <CalcCard label="SF 0,9% -- 20 mL/kg em ate 20 minutos">
          <CalcResult value={fmtInt(hydration?.bolus ?? null)} unit="mL por bolus" secondary="Pode repetir ate 3 vezes" />
        </CalcCard>
        <AlertCard type="warning" title="Reavaliacao continua">
          Apos cada bolus: PA, FC, TEC, diurese, Ht. Se melhora -&gt; transicao para fase de manutencao do Grupo C (25 mL/kg em 6h).
        </AlertCard>
      </Collapsible>

      <Collapsible title="Refratario a cristaloide" badge="Escalar" badgeColor="#F44336">
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-7 h-7 min-w-[28px] rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold mt-0.5">1</div>
            <div>
              <h4 className="text-sm font-semibold">Albumina 20%</h4>
              <p className="text-sm text-text-secondary">Se Ht em ascensao (aumento &#8805;20% do valor basal) apos 3 expansoes com cristaloide. Considere 0,5-1 g/kg. Repetir Ht a cada 2-4h durante expansao.</p>
            </div>
          </div>
          <CalcCard label="Albumina 20% -- 0,5 a 1 g/kg">
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="text-[11px] text-text-muted mb-1">0,5 g/kg</div>
                <CalcResult value={fmtInt(hydration?.alb05 ?? null)} unit="mL" />
              </div>
              <div className="flex-1">
                <div className="text-[11px] text-text-muted mb-1">1 g/kg</div>
                <CalcResult value={fmtInt(hydration?.alb1 ?? null)} unit="mL" />
              </div>
            </div>
            <div className="text-center text-xs text-text-muted mt-2">Apresentacao: frasco 50 mL (20% = 10 g/frasco)</div>
          </CalcCard>
          <div className="flex gap-3">
            <div className="w-7 h-7 min-w-[28px] rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold mt-0.5">2</div>
            <div>
              <h4 className="text-sm font-semibold">Se Ht em queda + choque persistente</h4>
              <p className="text-sm text-text-secondary">Sugere hemorragia. Considere hemotransfusao (CH) e investigar foco hemorragico.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-7 h-7 min-w-[28px] rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold mt-0.5">3</div>
            <div>
              <h4 className="text-sm font-semibold">Noradrenalina</h4>
              <p className="text-sm text-text-secondary">Se choque refratario a volume (apos reposicao adequada). Considere acesso venoso central.</p>
            </div>
          </div>
        </div>
        <InfoCard title="Metas de ressuscitacao">
          <BulletList items={[
            'PAS >90 mmHg (ou PAM >65 mmHg)',
            'FC <100 bpm',
            'TEC <2s',
            'Diurese >0,5 mL/kg/h',
            'Ht estavel ou em queda',
            'Melhora do nivel de consciencia',
          ]} />
        </InfoCard>
      </Collapsible>

      <Collapsible title="Monitorizacao intensiva" badge="Continua" badgeColor="#F44336">
        <InfoCard title="Parametros de monitorizacao">
          <BulletList items={[
            'Sinais vitais continuos ou a cada 15-30 min',
            'Ht de controle a cada 2h durante expansao',
            'Diurese por sonda vesical (alvo >0,5 mL/kg/h)',
            'Balanco hidrico rigoroso',
            'Considerar acesso venoso central e PAI',
          ]} />
        </InfoCard>
      </Collapsible>

      <Collapsible title="Criterios para UTI">
        <BulletList items={[
          'Choque refratario a 2 expansoes',
          'Necessidade de vasopressor',
          'Sangramento grave ativo',
          'Disfuncao organica (IRA, SDRA, encefalite)',
          'Rebaixamento do nivel de consciencia',
        ]} />
      </Collapsible>

      <Collapsible title="Complicacoes a monitorizar" badge="Atencao" badgeColor="#F44336">
        <BulletList items={[
          'CIVD: monitorar fibrinogenio, D-dimero, TP',
          'Miocardite: ECG, troponina, eco se disponivel',
          'Hepatite grave: AST/ALT >1000',
          'Sindrome hemofagocitica: ferritina, triglicerideos',
        ]} />
      </Collapsible>

      <Collapsible title="Fase critica (defervescencia)">
        <AlertCard type="danger" title="Periodo de maior risco">
          Ocorre entre o 3o e 7o dia de doenca. Janela de 24-48h de maior risco de extravasamento plasmatico.
        </AlertCard>
        <InfoCard title="Conduta">
          <p>Considere intensificar monitorizacao quando a febre ceder. A melhora da febre nao significa melhora clinica -- pode indicar o inicio da fase critica.</p>
        </InfoCard>
      </Collapsible>

      <ReclassSection>
        <Button variant="secondary" fullWidth size="sm" onClick={() => goTo('grupoC')}>
          Estabilizou -&gt; Grupo C
        </Button>
      </ReclassSection>
    </div>
  )

  // ========== CALCULADORAS ==========
  const renderCalculadoras = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Calculadoras</SectionTitle>

      {/* Hidratacao oral */}
      <Collapsible title="Hidratacao oral (Grupo A)" badge="60 mL/kg/dia" badgeColor="#4CAF50">
        <InfoCard title="Indicacao">
          <p>Volume: 60 mL/kg/dia (1/3 com SRO). Distribuir ao longo do dia. Inclui alimentacao liquida.</p>
        </InfoCard>
        <CalcCard label="Volume total diario">
          <CalcResult value={fmtInt(hydration?.voTotal ?? null)} unit="mL/dia" />
          <div className="flex gap-2 mt-2">
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-[11px] text-text-muted">1/3 SRO</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.voSRO ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
            </div>
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-[11px] text-text-muted">2/3 Liquidos</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.voLiquidos ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
            </div>
          </div>
        </CalcCard>
      </Collapsible>

      {/* Hidratacao IV — expansao */}
      <Collapsible title="Hidratacao IV -- expansao (Grupos C/D)" badge="Expansao" badgeColor="#F44336">
        <InfoCard title="Protocolo de expansao">
          <BulletList items={[
            'Fase de expansao: 20 mL/kg em 2h (cristaloide isotonico)',
            'Reavaliacao apos cada fase',
            'Se melhora: manutencao 25 mL/kg em 6h',
            'Se nao melhora: repetir expansao (maximo 3 expansoes)',
          ]} />
        </InfoCard>
        <CalcCard label="Expansao -- 20 mL/kg em 20 min (Grupo D) ou 10 mL/kg/h x 2h (Grupo C)">
          <div className="flex gap-2">
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-[11px] text-text-muted">Bolus 20 mL/kg</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.bolus ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
            </div>
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-[11px] text-text-muted">10 mL/kg/h</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.ivHora ?? null)}</div>
              <div className="text-sm text-text-secondary">mL/h</div>
            </div>
          </div>
          <div className="text-center py-3 bg-bg-card rounded-lg mt-2">
            <div className="text-[11px] text-text-muted">Volume em 2h (Grupo C)</div>
            <div className="text-xl font-bold">{fmtInt(hydration?.iv2h ?? null)}</div>
            <div className="text-sm text-text-secondary">mL</div>
          </div>
        </CalcCard>
      </Collapsible>

      {/* Hidratacao IV — manutencao */}
      <Collapsible title="Hidratacao IV -- manutencao" badge="Manutencao" badgeColor="#FFC107">
        <InfoCard title="Protocolo de manutencao">
          <BulletList items={[
            '25 mL/kg em 6h (primeira fase)',
            'Depois 25 mL/kg em 8h (segunda fase)',
            'Reduzir conforme melhora clinica',
          ]} />
        </InfoCard>
        <CalcCard label="Manutencao -- 25 mL/kg">
          <div className="flex gap-2">
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-[11px] text-text-muted">25 mL/kg em 6h</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.ivMan6 ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
              <div className="text-xs text-text-muted">{hydration ? `${fmtInt(hydration.ivMan6 / 6)} mL/h` : '--'}</div>
            </div>
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-[11px] text-text-muted">25 mL/kg em 8h</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.ivMan8 ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
              <div className="text-xs text-text-muted">{hydration ? `${fmtInt(hydration.ivMan8 / 8)} mL/h` : '--'}</div>
            </div>
          </div>
        </CalcCard>
      </Collapsible>

      {/* Albumina */}
      <Collapsible title="Albumina (reposicao coloidosmotica)" badge="Refratario" badgeColor="#F44336">
        <AlertCard type="danger" title="Atencao" className="text-xs">
          Albumina NAO e hidratacao -- e para choque refratario apos 3 expansoes com cristaloide.
        </AlertCard>
        <InfoCard title="Indicacao e dose">
          <BulletList items={[
            'Dose: 0,5-1 g/kg (albumina 20%)',
            'Indicacao: choque refratario a cristaloide + Ht em queda',
            'Apresentacao: frasco 50 mL (20% = 10 g/frasco)',
          ]} />
        </InfoCard>
        <CalcCard label="Albumina 20% -- 0,5 a 1 g/kg">
          <div className="flex gap-2">
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-[11px] text-text-muted">0,5 g/kg</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.alb05 ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
              <div className="text-xs text-text-muted">{hydration ? `${Math.ceil(hydration.alb05 / 50)} ${Math.ceil(hydration.alb05 / 50) === 1 ? 'frasco' : 'frascos'}` : '--'}</div>
            </div>
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-[11px] text-text-muted">1 g/kg</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.alb1 ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
              <div className="text-xs text-text-muted">{hydration ? `${Math.ceil(hydration.alb1 / 50)} ${Math.ceil(hydration.alb1 / 50) === 1 ? 'frasco' : 'frascos'}` : '--'}</div>
            </div>
          </div>
        </CalcCard>
      </Collapsible>

      {/* Variacao Ht */}
      <Collapsible title="Calculo de variacao do Ht" badge="Monitorizacao" badgeColor="#FFC107">
        <CalcCard label="Variacao do hematocrito (%)">
          <div className="text-xs text-text-muted mb-2">Formula: (Ht atual - Ht basal) / Ht basal x 100</div>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <div className="text-[11px] text-text-muted mb-1">Ht basal (%)</div>
              <input
                type="number"
                inputMode="decimal"
                placeholder="45"
                value={htBasal}
                onChange={e => setHtBasal(e.target.value)}
                className="w-full bg-bg-elevated border border-border rounded-lg text-text-primary p-2 text-base text-center outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-text-muted mb-1">Ht atual (%)</div>
              <input
                type="number"
                inputMode="decimal"
                placeholder="54"
                value={htAtual}
                onChange={e => setHtAtual(e.target.value)}
                className="w-full bg-bg-elevated border border-border rounded-lg text-text-primary p-2 text-base text-center outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="text-center py-3 bg-bg-card rounded-lg">
            <div className="text-3xl font-bold">
              {htVariation !== null ? `${htVariation >= 0 ? '+' : ''}${htVariation.toFixed(1)}%` : '--'}
            </div>
            <div className="text-sm text-text-secondary">% de variacao</div>
            <div className="text-sm mt-1" style={{ color: htInterpretation.color }}>{htInterpretation.text}</div>
          </div>
        </CalcCard>
        <InfoCard title="Classificacao">
          <BulletList items={[
            '<20%: variacao normal',
            '>=20%: hemoconcentracao significativa',
          ]} />
        </InfoCard>
        <InfoCard title="Referencia">
          <p>Homens: ~45% (40-54%). Mulheres: ~40% (36-48%). Ex: Ht basal 40% -&gt; Ht atual &#8805;48% = hemoconcentracao significativa.</p>
        </InfoCard>
      </Collapsible>
    </div>
  )

  // ========== E-FASD ==========
  const renderEfasd = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>POCUS / E-FASD</SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Extended Focused Assessment Sonography in Dengue -- Tambelli et al., JBMEDE 2024</p>

      <AlertCard type="info" title="Objetivo">
        Rastrear sinais de extravasamento plasmatico e gravidade em pacientes com dengue, a beira-leito.
      </AlertCard>

      <Collapsible title="Preparacao">
        <BulletList items={[
          'Transdutor: Curvilinea (2,5-5 MHz). Alternativa: setorial',
          'Preset: Abdominal',
          'Posicao do paciente: Decubito dorsal a 0 graus',
          'Indicador da sonda: Para a direita ou cranial em relacao ao paciente',
          'Posicao Trendelenburg: Opcional -- aumenta sensibilidade no andar superior do abdome',
        ]} />
      </Collapsible>

      <Collapsible title="Janelas 1 e 2 -- Pulmao anterior" badge="Intersticial" badgeColor="#2196F3">
        <InfoCard title="Avaliacao de sindrome intersticial pulmonar">
          <p>Sonda na caixa toracica anterior, linha hemiclavicular, marcador cranial. Visualizar a linha pleural entre duas costelas. Profundidade: 3-5 cm (linha pleural) -&gt; ajustar para 8-12 cm (linhas B). Repetir em ambos os hemitorax.</p>
        </InfoCard>
        <AlertCard type="danger" title="E-FASD positivo">
          &#8805; 3 linhas B entre duas costelas -&gt; possivel extravasamento plasmatico ou sobrecarga volemica.
        </AlertCard>
        <table className="w-full border-collapse my-2 text-sm">
          <thead>
            <tr><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Acuracia do POCUS</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Valor</th></tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border-b border-border">Sensibilidade</td><td className="p-2 border-b border-border text-success">98%</td></tr>
            <tr><td className="p-2">Especificidade</td><td className="p-2 text-success">88%</td></tr>
          </tbody>
        </table>
      </Collapsible>

      <Collapsible title="Janelas 3 e 4 -- QSD (ascite + DP direito)" badge="Morrison" badgeColor="#2196F3">
        <InfoCard title="Janela 3 -- Ascite a direita">
          <p>Sonda com marcador cefalico na linha axilar posterior direita, transicao toracoabdominal. Rotacionar 15-20 graus se costelas atrapalharem. Avaliar: espaco de Morrison, borda caudal do figado, espaco supra-hepatico. Liquido anecoico nesses espacos -&gt; E-FASD positivo.</p>
        </InfoCard>
        <InfoCard title="Janela 4 -- Derrame pleural D">
          <p>Mover a sonda cranialmente. Conteudo anecoico acima do diafragma + sinal da coluna -&gt; derrame pleural confirmado.</p>
        </InfoCard>
        <table className="w-full border-collapse my-2 text-sm">
          <thead>
            <tr><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Achado</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Sens.</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Esp.</th></tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border-b border-border">Ascite (J3)</td><td className="p-2 border-b border-border text-success">90%</td><td className="p-2 border-b border-border text-success">99%</td></tr>
            <tr><td className="p-2">Derrame pleural (J4)</td><td className="p-2 text-success">94%</td><td className="p-2 text-success">97%</td></tr>
          </tbody>
        </table>
      </Collapsible>

      <Collapsible title="Janela 5 -- Vesicula biliar" badge="Gravidade" badgeColor="#FFC107">
        <InfoCard title="Avaliacao da parede da vesicula biliar">
          <p>Sonda na regiao anterior do QSD, abaixo da ultima costela, paralela a linha mediana, marcador cefalico. Movimento pendular suave. Avaliar a parede <strong>anterior</strong> da vesicula.</p>
        </InfoCard>
        <AlertCard type="danger" title="E-FASD positivo">
          Parede &gt;3 mm de espessura e/ou liquido perivesicular -&gt; correlaciona-se com gravidade e extravasamento plasmatico.
        </AlertCard>
        <AlertCard type="warning" title="Atencao">
          Espessamento da vesicula biliar nao exclui necessidade de investigar diagnosticos diferenciais de patologias biliares.
        </AlertCard>
        <table className="w-full border-collapse my-2 text-sm">
          <thead><tr><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Acuracia</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Valor</th></tr></thead>
          <tbody>
            <tr><td className="p-2 border-b border-border">Sensibilidade</td><td className="p-2 border-b border-border text-success">94%</td></tr>
            <tr><td className="p-2">Especificidade</td><td className="p-2 text-success">91%</td></tr>
          </tbody>
        </table>
      </Collapsible>

      <Collapsible title="Janelas 6 e 7 -- QSE (ascite + DP esquerdo)">
        <InfoCard title="Janela 6 -- Ascite a esquerda">
          <p>Sonda com marcador cefalico na linha axilar posterior esquerda (mais posterior que no QSD -- o baco e mais posterior que o figado). Avaliar espaco subdiafragmatico (mais sensivel) e esplenorrenal.</p>
        </InfoCard>
        <InfoCard title="Janela 7 -- Derrame pleural E">
          <p>Mover cranialmente. Conteudo anecoico + sinal da coluna acima do diafragma -&gt; derrame pleural.</p>
        </InfoCard>
        <AlertCard type="info" title="Dica">
          Considere solicitar pausa inspiratoria ao paciente para melhor visualizacao. O ligamento esplenorrenal limita o liquido no espaco entre baco e rim -- o espaco subdiafragmatico e mais sensivel para deteccao.
        </AlertCard>
      </Collapsible>

      <Collapsible title="Janela 8 -- Retrovesical (pelve)">
        <InfoCard title="Avaliacao de ascite pelvica">
          <p>Sonda na linha media suprapubica, marcador cefalico (longitudinal), depois rotacionar 90 graus (transversal). Preferencialmente com bexiga cheia (antes da sonda vesical). Identificar bexiga, utero ou prostata, reto. Liquido anecoico ao redor -&gt; E-FASD positivo.</p>
        </InfoCard>
      </Collapsible>

      <Collapsible title="Janela 9 -- Subcostal (pericardio)">
        <InfoCard title="Avaliacao de derrame pericardico">
          <p>Sonda paralela a pele, regiao subxifoide, feixe de US apontando para o ombro esquerdo. Profundidade: 15-20 cm. Usar o figado como janela acustica. Conteudo anecoico no espaco pericardico -&gt; derrame pericardico.</p>
        </InfoCard>
        <AlertCard type="warning" title="Dificuldades">
          Pode ser dificil em obesos, distensao abdominal, xifoide proeminente ou ascite volumosa. Considere outras janelas cardiacas (paraesternal, apical).
        </AlertCard>
        <table className="w-full border-collapse my-2 text-sm">
          <thead><tr><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Acuracia</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Valor</th></tr></thead>
          <tbody>
            <tr><td className="p-2 border-b border-border">Sensibilidade</td><td className="p-2 border-b border-border text-success">96%</td></tr>
            <tr><td className="p-2">Especificidade</td><td className="p-2 text-success">98%</td></tr>
          </tbody>
        </table>
      </Collapsible>

      <Collapsible title="Resumo -- Tabela de acuracia">
        <table className="w-full border-collapse my-2 text-sm">
          <thead>
            <tr><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Janela</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Achado</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Sens.</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Esp.</th></tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border-b border-border">1-2</td><td className="p-2 border-b border-border">Sindrome intersticial</td><td className="p-2 border-b border-border">98%</td><td className="p-2 border-b border-border">88%</td></tr>
            <tr><td className="p-2 border-b border-border">3, 6, 8</td><td className="p-2 border-b border-border">Ascite</td><td className="p-2 border-b border-border">90%</td><td className="p-2 border-b border-border">99%</td></tr>
            <tr><td className="p-2 border-b border-border">4, 7</td><td className="p-2 border-b border-border">Derrame pleural</td><td className="p-2 border-b border-border">94%</td><td className="p-2 border-b border-border">97%</td></tr>
            <tr><td className="p-2 border-b border-border">5</td><td className="p-2 border-b border-border">Espessamento vesicular</td><td className="p-2 border-b border-border">94%</td><td className="p-2 border-b border-border">91%</td></tr>
            <tr><td className="p-2">9</td><td className="p-2">Derrame pericardico</td><td className="p-2">96%</td><td className="p-2">98%</td></tr>
          </tbody>
        </table>
        <AlertCard type="info" title="Limitacao" className="mt-2">
          O E-FASD nao diagnostica nem classifica gravidade isoladamente. E uma ferramenta de triagem complementar a avaliacao clinica e laboratorial.
        </AlertCard>
      </Collapsible>
    </div>
  )

  // ========== EXAMES E DIFERENCIAIS ==========
  const renderExameDiff = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Exames e diagnosticos diferenciais</SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Laboratorio, monitorizacao e diagnosticos diferenciais</p>

      <div className="text-[11px] text-text-muted uppercase tracking-wider mb-2">Exames laboratoriais</div>

      <Collapsible title="Exames sugeridos na dengue">
        <BulletList items={[
          'Hemograma completo com hematocrito',
          'Coagulograma (TP, TTPa, fibrinogenio)',
          'Funcao renal (ureia, creatinina)',
          'Funcao hepatica (AST, ALT, albumina)',
          'Tipagem sanguinea',
          'Lactato',
          'Gasometria arterial (se grave)',
          'NS1 (ate 5o dia) / IgM (a partir do 6o dia)',
        ]} />
      </Collapsible>

      <Collapsible title="Exames por grupo">
        <table className="w-full border-collapse my-2 text-sm">
          <thead>
            <tr><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Grupo</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Exames sugeridos</th></tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border-b border-border"><Tag label="A" color="#4CAF50" /></td><td className="p-2 border-b border-border">Hemograma (nao obrigatorio). Orientar retorno se sinais de alarme.</td></tr>
            <tr><td className="p-2 border-b border-border"><Tag label="B" color="#FFC107" /></td><td className="p-2 border-b border-border">Hemograma com Ht obrigatorio. Repetir em 4-6h.</td></tr>
            <tr><td className="p-2 border-b border-border"><Tag label="C" color="#F44336" /></td><td className="p-2 border-b border-border">Hemograma seriado (Ht a cada 2h na expansao). Funcao renal, hepatica, coagulograma, tipagem sanguinea.</td></tr>
            <tr><td className="p-2"><Tag label="D" color="#F44336" /></td><td className="p-2">Hemograma seriado, funcao renal e hepatica, coagulograma (TP, TTPa, fibrinogenio), tipagem + reserva, gasometria, lactato. Rx de torax se disponivel.</td></tr>
          </tbody>
        </table>
      </Collapsible>

      <Collapsible title="Interpretacao do hematocrito" badge="Parametro-chave" badgeColor="#FFC107">
        <AlertCard type="warning" title="Ht em ascensao (aumento >=20% do valor basal)">
          Sugere hemoconcentracao por extravasamento plasmatico. Escalar tratamento (maior aporte de volume). Referencia: homem ~45%, mulher ~40%. Ex: Ht basal 40% -&gt; Ht atual &#8805;48% = alarme.
        </AlertCard>
        <AlertCard type="success" title="Ht em queda com melhora clinica">
          Sugere reabsorcao plasmatica. Considere reduzir velocidade de infusao.
        </AlertCard>
        <AlertCard type="danger" title="Ht em queda com piora clinica">
          Sugere hemorragia. Investigar sangramento e considere hemotransfusao.
        </AlertCard>
        <InfoCard title="Valores de referencia">
          <p>Homens: ~45% (referencia: 40-54%). Mulheres: ~40% (referencia: 36-48%). Formula: (Ht atual - Ht basal) / Ht basal x 100. Elevacao &#8805;20% sugere hemoconcentracao significativa. Repetir Ht a cada 2-4h durante expansao (Grupos C/D). Monitorizar a cada 12-24h no Grupo B.</p>
        </InfoCard>
      </Collapsible>

      <Collapsible title="Plaquetas">
        <InfoCard title="Classificacao da plaquetopenia na dengue">
          <BulletList items={[
            'Plaquetopenia: <100.000/mm3 (criterio de risco -- Grupo B)',
            'Plaquetopenia grave: <50.000/mm3 (considere avaliacao de hemostasia)',
            'Plaquetopenia critica: <20.000/mm3 (risco de sangramento espontaneo)',
          ]} />
        </InfoCard>
        <InfoCard title="Conduta">
          <p>Isoladamente, a plaquetopenia nao indica gravidade nem necessidade de transfusao de plaquetas. A decisao de transfundir deve ser individualizada e baseada em sangramento ativo, nao no numero absoluto.</p>
        </InfoCard>
        <AlertCard type="danger" title="Atencao">
          Considere transfusao de plaquetas apenas se sangramento ativo grave com plaquetopenia &lt;50.000/mm3. Evitar transfusao profilatica -- nao ha evidencia de beneficio na dengue.
        </AlertCard>
      </Collapsible>

      <div className="text-[11px] text-text-muted uppercase tracking-wider mt-4 pt-4 border-t border-border mb-2">Diagnosticos diferenciais</div>

      <Collapsible title="Diagnosticos diferenciais principais">
        <BulletList items={[
          'Outras arboviroses (Zika, Chikungunya)',
          'Leptospirose',
          'Meningococcemia',
          'Febre maculosa',
          'Malaria',
          'Hepatites virais',
          'Influenza / COVID-19',
        ]} />
      </Collapsible>

      <Collapsible title="Comparativo entre arboviroses">
        <table className="w-full border-collapse my-2 text-sm">
          <thead>
            <tr><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Achado</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Dengue</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Zika</th><th className="bg-bg-hover text-text-secondary text-[11px] font-semibold uppercase p-2 text-left border-b border-border">Chikungunya</th></tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border-b border-border">Febre</td><td className="p-2 border-b border-border">Alta (&gt;38,5C)</td><td className="p-2 border-b border-border">Baixa ou ausente</td><td className="p-2 border-b border-border">Alta</td></tr>
            <tr><td className="p-2 border-b border-border">Exantema</td><td className="p-2 border-b border-border">Tardio (3-5o dia)</td><td className="p-2 border-b border-border">Precoce (1-2o dia)</td><td className="p-2 border-b border-border">2-5o dia</td></tr>
            <tr><td className="p-2 border-b border-border">Artralgia</td><td className="p-2 border-b border-border">Leve</td><td className="p-2 border-b border-border">Leve</td><td className="p-2 border-b border-border">Intensa (incapacitante)</td></tr>
            <tr><td className="p-2 border-b border-border">Mialgia</td><td className="p-2 border-b border-border">Intensa</td><td className="p-2 border-b border-border">Leve</td><td className="p-2 border-b border-border">Moderada</td></tr>
            <tr><td className="p-2 border-b border-border">Conjuntivite</td><td className="p-2 border-b border-border">Raro</td><td className="p-2 border-b border-border">Frequente</td><td className="p-2 border-b border-border">Raro</td></tr>
            <tr><td className="p-2">Cefaleia</td><td className="p-2">Intensa (retroorbitaria)</td><td className="p-2">Leve</td><td className="p-2">Moderada</td></tr>
          </tbody>
        </table>
      </Collapsible>

      <Collapsible title="Complicacoes da dengue" badge="Atencao" badgeColor="#F44336">
        <BulletList items={[
          'Miocardite: arritmias, disfuncao ventricular, troponina elevada',
          'Encefalite: rebaixamento do nivel de consciencia, convulsoes',
          'Hepatite: AST/ALT >1.000, pode evoluir para insuficiencia hepatica',
          'CIVD: coagulograma alargado, fibrinogenio baixo, sangramento difuso',
          'Rabdomiolise: CPK elevada, IRA',
          'Sindrome hemofagocitica: febre persistente, citopenias, ferritina muito elevada',
        ]} />
      </Collapsible>
    </div>
  )

  // ========== ALTA SEGURA ==========
  const renderAltaSegura = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Orientacoes para alta segura</SectionTitle>

      <Collapsible title="Criterios de alta hospitalar">
        <BulletList items={[
          'Ausencia de febre por 24-48h sem uso de antitermicos',
          'Melhora clinica visivel',
          'Hematocrito estavel (sem hemoconcentracao)',
          'Plaquetas em ascensao (tendencia de melhora)',
          'Estabilidade hemodinamica por 24h',
          'Capacidade de manter hidratacao oral adequada',
          'Diurese adequada (>0,5 mL/kg/h)',
        ]} />
      </Collapsible>

      <Collapsible title="Orientacoes ao paciente">
        <BulletList items={[
          'Manter hidratacao oral abundante (60 mL/kg/dia)',
          'Repouso relativo',
          'Usar apenas paracetamol ou dipirona se febre ou dor (evitar AINEs e AAS)',
          'Retorno para reavaliacao conforme orientacao medica',
        ]} />
        <p className="text-sm text-text-secondary mt-2">
          Retornar <strong className="text-warning">imediatamente</strong> se sinais de alarme
        </p>
        <div className="h-px bg-border my-3" />
        <p className="text-xs text-text-muted mb-3"><strong>Sinais de alarme para retorno imediato:</strong></p>
        <BulletList items={[
          'Dor abdominal intensa e continua',
          'Vomitos persistentes',
          'Sangramento (gengiva, nariz, fezes escuras, urina escura)',
          'Tontura ou desmaio ao levantar',
          'Pele fria, palida ou pegajosa',
          'Dificuldade para respirar',
          'Sonolencia excessiva ou agitacao intensa',
        ]} color="#F44336" />
      </Collapsible>

      <Button fullWidth className="mt-4" onClick={gerarMsgWhatsApp}>
        Gerar orientacoes para WhatsApp
      </Button>

      {wppVisible && (
        <div className="mt-4">
          <div className="bg-bg-card border border-border-card rounded-xl p-4">
            <div className="text-xs text-text-muted mb-2">Mensagem gerada -- toque para copiar</div>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm text-text-secondary leading-relaxed m-0 max-h-[300px] overflow-y-auto pb-2">
              {wppMsg}
            </pre>
            <div className="flex gap-2 mt-3">
              <Button fullWidth size="sm" onClick={copiarMsgWpp}>
                Copiar mensagem
              </Button>
              <Button fullWidth size="sm" onClick={compartilharWpp} style={{ background: '#25D366' }}>
                Enviar no WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ========== REFERENCIAS ==========
  const renderReferencias = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Referencias</SectionTitle>

      <Collapsible title="Fontes bibliograficas">
        <div className="text-xs leading-loose text-text-secondary">
          <p><strong className="text-text-primary">1.</strong> Brasil. Ministerio da Saude. Dengue: diagnostico e manejo clinico -- adulto e crianca. 6a edicao. Brasilia, 2024.</p>
          <p className="mt-2"><strong className="text-text-primary">2.</strong> Associacao Brasileira de Medicina de Emergencia (ABRAMEDE). Recomendacoes para manejo de dengue no departamento de emergencia.</p>
          <p className="mt-2"><strong className="text-text-primary">3.</strong> World Health Organization. Dengue: guidelines for diagnosis, treatment, prevention and control. WHO, 2009 (atualizada 2012).</p>
          <p className="mt-2"><strong className="text-text-primary">4.</strong> Tambelli RA, Silva PS, Schubert DU, et al. Extended Focused Assessment Sonography in Dengue (E-FASD): protocolo de ultrassom point of care para avaliacao de pacientes com dengue. JBMEDE. 2024;4(1):e24005.</p>
          <p className="mt-2"><strong className="text-text-primary">5.</strong> Tejo AM, Hamasaki DT, Menezes LM, Ho YL. Severe dengue in the intensive care unit. J Intensive Med. 2023;4(1):16-33.</p>
        </div>
      </Collapsible>
    </div>
  )

  // ==========================================
  // RENDER
  // ==========================================

  const screenMap: Record<Screen, () => React.ReactElement> = {
    home: renderHome,
    step1: renderStep1,
    step2: renderStep2,
    step3: renderStep3,
    stepGrupo: renderStepGrupo,
    step5: renderStep5,
    grupos: renderGrupos,
    classificacao: renderClassificacao,
    grupoA: renderGrupoA,
    grupoB: renderGrupoB,
    grupoC: renderGrupoC,
    grupoD: renderGrupoD,
    calculadoras: renderCalculadoras,
    efasd: renderEfasd,
    examediff: renderExameDiff,
    altasegura: renderAltaSegura,
    referencias: renderReferencias,
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <Disclaimer />
      <Header title="Dengue Path" subtitle="Manejo de dengue na emergencia" />
      {showWeight && <WeightInput />}
      <Container>
        {screenMap[screen]()}
      </Container>
      <Footer toolName="Dengue Path" version="v2.0.0" />
      <FABMenu items={fabItems} />
    </div>
  )
}
