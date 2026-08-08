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
  | 'grupos' | 'classificação'
  | 'grupoA' | 'grupoB' | 'grupoC' | 'grupoD'
  | 'calculadoras' | 'efasd' | 'examediff' | 'altasegura' | 'referências'

type GrupoLetter = 'A' | 'B' | 'C' | 'D'

const ALARM_LABELS = [
  'Dor abdominal intensa e contínua',
  'Vômitos persistentes',
  'Acúmulo de líquidos (ascite, derrame pleural ou pericárdico)',
  'Hipotensão postural e/ou lipotimia',
  'Hepatomegalia >2 cm abaixo do rebordo costal',
  'Sangramento de mucosas',
  'Letargia e/ou irritabilidade',
  'Hematócrito em ascensão (aumento \u226520% do valor basal)',
]

const GRAVITY_LABELS = [
  'Choque (hipotensão, TEC >2s, pulsos finos, extremidades frias)',
  'Hemorragia grave (hematêmese, melena, metrorragia volumosa, SNC)',
  'Disfunção orgânica grave (miocardite, encefalite, hepatite grave, IRA)',
]

const RISK_LABELS = [
  'Gestante',
  'Idade superior a 65 anos',
  'Comorbidades (HAS, DM, doença renal, DPOC, hepatopatia, doença hematológica)',
  'Risco social (difícil acesso ao serviço de saúde)',
  'Plaquetopenia <100.000/mm³',
]

const GRUPO_CONFIG: Record<GrupoLetter, { color: string; label: string; rgba: string }> = {
  A: { color: '#4CAF50', label: 'Ambulatorial', rgba: '76,175,80' },
  B: { color: '#FFC107', label: 'Observação', rgba: '255,193,7' },
  C: { color: '#FF5252', label: 'Internação', rgba: '255,82,82' },
  D: { color: '#F44336', label: 'UTI / Emergência', rgba: '244,67,54' },
}

const SCREENS_WITH_WEIGHT: Screen[] = [
  'step2', 'step3', 'stepGrupo', 'step5', 'grupos', 'classificação',
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
      Início
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
          {backLabel || '\u2190 Voltar'}
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          className="flex-1 py-3.5 bg-accent border-none rounded-lg text-white text-sm font-semibold cursor-pointer min-h-[44px]"
        >
          {nextLabel || 'Próximo →'}
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
      <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Reclassificar</div>
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
    if (target === 'classificação') {
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
      setClassResult({ grupo: 'D', desc: 'Sinais de gravidade presentes — considere UTI ou sala de emergência' })
      return
    }
    if (alarmCount > 0) {
      setClassResult({ grupo: 'C', desc: 'Sinais de alarme presentes — considere internação para hidratação IV e monitorização' })
      return
    }
    const hasRisco = risco.some(Boolean)
    if (hasRisco) {
      setClassResult({ grupo: 'B', desc: 'Condição de risco presente — considere observação em unidade de saúde com reavaliação' })
      return
    }
    setClassResult({ grupo: 'A', desc: 'Sem sinais de alarme ou risco — considere acompanhamento ambulatorial com hidratação oral' })
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
    if (htVariation >= 20) return { text: 'Hemoconcentração significativa (≥20%)', color: '#F44336' }
    if (htVariation >= 10) return { text: 'Elevação moderada — monitorizar', color: '#FFC107' }
    if (htVariation > 0) return { text: 'Elevação discreta', color: '#4CAF50' }
    if (htVariation < -10) return { text: 'Queda significativa — avaliar hemorragia se piora clínica', color: '#FFC107' }
    return { text: 'Estável ou em queda discreta', color: '#4CAF50' }
  }, [htVariation])

  // WhatsApp message
  const gerarMsgWhatsApp = useCallback(() => {
    const now = new Date()
    const data = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
    const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const msg = `*ORIENTAÇÕES DE ALTA — DENGUE*
_Emitido em ${data} às ${hora}_

*Hidratação:*
Beber bastante líquido ao longo do dia (água, suco, chá, água de coco). Pelo menos 2 a 3 litros por dia, incluindo soro de reidratação oral.

*Repouso:*
Manter repouso relativo nos primeiros dias.

*Medicação:*
Usar apenas paracetamol ou dipirona para febre ou dor.
*NÃO usar* ibuprofeno, diclofenaco, AAS (aspirina) ou outros anti-inflamatórios.

*Retorno:*
Conforme orientação médica para reavaliação.

---

*PROCURE ATENDIMENTO IMEDIATO SE:*
- Dor abdominal forte e contínua
- Vômitos que não param
- Sangramento (gengiva, nariz, fezes ou urina escuras)
- Tontura ou desmaio ao levantar
- Pele fria, pálida ou suada
- Falta de ar
- Sonolência excessiva ou agitação

_Dengue Path — ANY App — Medicina de Emergência_
_Ferramenta de apoio à decisão clínica_`

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
    { label: 'Início', onClick: () => goTo('home') },
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
        <div className="py-4">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2" className="mx-auto mb-3">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <div className="text-lg font-bold text-text-primary">Dengue Path</div>
          <div className="text-sm text-text-muted mt-1">Trilha completa: avaliação → classificação → manejo → desfecho</div>
        </div>
      </Card>

      {/* Grid 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { id: 'grupos' as Screen, label: 'Manejo por grupos', desc: 'Grupos A, B, C e D', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
          { id: 'calculadoras' as Screen, label: 'Calculadoras', desc: 'VO, IV, albumina', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/></svg> },
          { id: 'efasd' as Screen, label: 'Protocolo E-FASD', desc: 'POCUS na dengue', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
          { id: 'examediff' as Screen, label: 'Exames e diag. diferenciais', desc: 'Laboratório e arboviroses', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg> },
          { id: 'classificação' as Screen, label: 'Classificação direta', desc: 'Gravidade → alarme → risco', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg> },
          { id: 'altasegura' as Screen, label: 'Alta segura', desc: 'Critérios e orientações', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
          { id: 'referências' as Screen, label: 'Referências', desc: 'Fontes e bibliografia', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
        ].map(item => (
          <Card
            key={item.id}
            onClick={() => goTo(item.id)}
            spaced={false}
            className="text-center flex flex-col items-center justify-center gap-1.5 min-h-[100px]"
          >
            {item.icon}
            <div className="text-[12px] font-semibold text-text-primary leading-tight">{item.label}</div>
            <div className="text-[10px] text-text-muted leading-tight">{item.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  )

  // ========== TRILHA STEP 1 ==========
  const renderStep1 = () => (
    <div>
      <StepHeader step={1} total={3} title="Avaliação inicial e suspeita" color="#4A6FA5" />
      <AlertCard type="info" title="Caso suspeito">
        Febre (geralmente 2-7 dias) + epidemiologia compatível + &#8805;2 dos seguintes: cefaleia, dor retroorbitária, mialgia, artralgia, prostração, exantema.
      </AlertCard>
      <p className="text-xs text-text-muted italic mb-3">
        Marque apenas o que se aplica ao paciente. Se nenhum item se aplica, avance normalmente.
      </p>
      <InfoCard title="Prova do laço">
        Insuflar manguito no ponto médio entre PAS e PAD por 5 min. Contar petequias em quadrado 2,5 x 2,5 cm. Positiva: &#8805;20 petequias (adultos). Resultado falso-negativo pode ocorrer em pacientes obesos, em choque ou em uso de anti-hipertensivos.
      </InfoCard>
      <AlertCard type="warning" title="Exames iniciais sugeridos" className="text-xs">
        Hemograma com hematócrito. Se sinais de alarme ou gravidade: função renal, hepática, coagulograma, tipagem.
      </AlertCard>
      <StepNav onBack={() => goTo('home')} onNext={() => goTo('step2')} backLabel="← Início" />
    </div>
  )

  // ========== TRILHA STEP 2 — ALARMES ==========
  const renderStep2 = () => (
    <div>
      <StepHeader step={2} total={3} title="Sinais de alarme" color="#C4972A" />
      <p className="text-xs text-text-muted italic mb-3">
        Marque os sinais presentes. Se nenhum, avance para a classificação.
      </p>
      <p className="text-sm text-text-secondary mb-3">
        <strong className="text-warning">Qualquer um</strong> presente → pelo menos Grupo C.
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

  // ========== TRILHA STEP 3 — CLASSIFICAÇÃO ==========
  const renderStep3 = () => {
    const alarmSummary = alarmes
      .map((checked, i) => (checked ? ALARM_LABELS[i] : null))
      .filter(Boolean)

    return (
      <div>
        <StepHeader step={3} total={3} title="Classificação" color="#C62828" />
        <p className="text-xs text-text-muted italic mb-4">
          Marque apenas o que se aplica. Se nenhum item se aplica em cada seção, prossiga para classificar.
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
          <div className="text-sm font-bold text-info uppercase tracking-wider mb-2">Condições de risco</div>
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
              Classificação sugerida
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
              Reavaliar classificação
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
        <StepHeader step={4} total={5} title={`Grupo ${g} — ${cfg.label}`} subtitle="Passo 4 de 5" color={cfg.color} />

        {g === 'A' && (
          <>
            <AlertCard type="success" title="Conduta">
              Hidratação oral domiciliar + acompanhamento ambulatorial.
            </AlertCard>
            <CalcCard label="Hidratação oral: 60 mL/kg/dia">
              <CalcResult
                value={fmtInt(hydration?.voTotal ?? null)}
                unit="mL/dia"
                secondary={`1/3 SRO (${fmtInt(hydration?.voSRO ?? null)} mL) + 2/3 líquidos (${fmtInt(hydration?.voLiquidos ?? null)} mL)`}
              />
            </CalcCard>
            <InfoCard title="Orientação prática">
              <p>Considere oferecer água, suco de frutas, chá, água de coco. Evitar bebidas com cafeína. Distribuir ao longo do dia (não forçar grandes volumes de uma vez).</p>
            </InfoCard>
            <InfoCard title="Antieméticos (se necessário)">
              <p>Metoclopramida 10 mg IV/VO 8/8h (ampola 10 mg/2 mL) ou ondansetrona 4-8 mg IV/VO 8/8h (ampola 4 mg/2 mL). Evitar AINEs e AAS.</p>
            </InfoCard>
            <AlertCard type="warning" title="Orientar retorno imediato se:">
              Dor abdominal intensa, vômitos persistentes, sangramento, tontura ao levantar, pele fria/pálida, dispneia, sonolência ou agitação.
            </AlertCard>
          </>
        )}

        {g === 'B' && (
          <>
            <AlertCard type="warning" title="Conduta">
              Hidratação oral supervisionada em unidade de saúde por pelo menos 6 horas. Solicitar hemograma com hematócrito.
            </AlertCard>
            <CalcCard label="Hidratação oral: 60 mL/kg/dia">
              <CalcResult
                value={fmtInt(hydration?.voTotal ?? null)}
                unit="mL/dia"
                secondary={`1/3 SRO (${fmtInt(hydration?.voSRO ?? null)} mL) + 2/3 líquidos (${fmtInt(hydration?.voLiquidos ?? null)} mL)`}
              />
            </CalcCard>
            <InfoCard title="Condições de risco">
              <p className="text-xs text-text-secondary leading-relaxed">Gestante, &lt;2 anos ou &gt;65 anos, HAS, DM, DPOC, doença hematológica, renal crônica, doença péptica, hepatopatia, doença autoimune, uso de anticoagulantes, risco social.</p>
            </InfoCard>
            <InfoCard title="Acompanhamento">
              <p>Hemograma com hematócrito antes da hidratação e após (em 4-6h). Se Ht estável e sem sinais de alarme, considere alta com orientações. Se Ht subindo, considere reclassificar para Grupo C.</p>
            </InfoCard>
            <AlertCard type="danger" title="Reclassificar para C se:">
              Surgimento de qualquer sinal de alarme ou hematócrito em ascensão (aumento &#8805;20% do valor basal). Referência: homem ~45%, mulher ~40%. Repetir Ht a cada 2-4h durante expansão.
            </AlertCard>
          </>
        )}

        {g === 'C' && (
          <>
            <AlertCard type="danger" title="Conduta imediata">
              Hidratação IV: SF 0,9% ou RL — 10 mL/kg/h por 2 horas. Solicitar hemograma, função renal, hepática, tipagem sanguínea.
            </AlertCard>
            <CalcCard label="Fase de expansão (2h)">
              <div className="flex gap-2">
                <CalcResult value={fmtInt(hydration?.ivHora ?? null)} unit="mL/h" />
                <CalcResult value={fmtInt(hydration?.iv2h ?? null)} unit="mL em 2h" />
              </div>
            </CalcCard>
            <AlertCard type="success" title="Se melhora + Ht queda">
              Manutenção: 25 mL/kg em 6h ({fmtInt(hydration?.ivMan6 ?? null)} mL → {fmtInt(hydration ? hydration.ivMan6 / 6 : null)} mL/h). Depois 25 mL/kg em 8h.
            </AlertCard>
            <AlertCard type="warning" title="Sem melhora">
              Repetir expansão. Se falhar 2a vez → manejar como Grupo D.
            </AlertCard>
          </>
        )}

        {g === 'D' && (
          <>
            <AlertCard type="danger" title="Emergência">
              SF 0,9% — 20 mL/kg em até 20 min. Repetir até 3x. Dois acessos calibrosos. Considere UTI.
            </AlertCard>
            <InfoCard title="Critérios de dengue grave">
              <p className="text-xs text-text-secondary leading-relaxed">Choque (pulso fino, TEC &gt;2s, PA convergente ou hipotensão), hemorragia grave (hematêmese, melena, SNC), disfunção orgânica (AST/ALT &gt;1.000, encefalite, miocardite, IRA).</p>
            </InfoCard>
            <CalcCard label="Bolus rápido — 20 mL/kg">
              <CalcResult value={fmtInt(hydration?.bolus ?? null)} unit="mL por bolus (ate 3x)" />
            </CalcCard>
            <InfoCard title="Refratário a cristaloide">
              <p>Albumina 20%: 0,5-1 g/kg ({fmtInt(hydration?.alb05 ?? null)} a {fmtInt(hydration?.alb1 ?? null)} mL). Se Ht em queda + choque → hemotransfusão. Se refratário a volume → noradrenalina.</p>
            </InfoCard>
            <InfoCard title="Metas de ressuscitação">
              <BulletList items={[
                'PAS >90 mmHg (ou PAM >65 mmHg)',
                'FC <100 bpm',
                'TEC <2s',
                'Diurese >0,5 mL/kg/h',
                'Ht estável ou em queda',
                'Melhora do nível de consciência',
              ]} />
            </InfoCard>
          </>
        )}

        {isCD && (
          <div className="bg-info/10 border border-info rounded-xl p-4 mt-3">
            <p className="text-sm text-info leading-relaxed">
              Paciente em internação — sem fluxo de alta neste momento. Use os botões de reclassificação conforme evolução clínica.
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
      <StepHeader step={5} total={5} title="Critérios de alta e seguimento" color="#4CAF50" />
      <BulletList items={[
        'Ausência de febre por 24-48h sem antitérmicos',
        'Melhora clínica visível',
        'Hematócrito estável',
        'Plaquetas em ascensão',
        'Estabilidade hemodinâmica por 24h',
        'Hidratação oral adequada',
        'Diurese >0,5 mL/kg/h',
      ]} />
      <AlertCard type="warning" title="Orientar retorno imediato se:" className="mt-3">
        Dor abdominal intensa, vômitos persistentes, sangramento, tontura ao levantar, pele fria/pálida, dispneia, sonolência ou agitação.
      </AlertCard>
      <Button variant="outline" fullWidth className="mt-3" onClick={() => goTo('altasegura')}>
        Ver orientações completas para alta segura →
      </Button>
      <StepNav onBack={() => goTo('stepGrupo')} onNext={() => goTo('home')} nextLabel="Início" />
    </div>
  )

  // ========== GRUPOS HUB ==========
  const renderGrupos = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Manejo por grupos</SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Acesso direto ao manejo por classificação</p>
      <div className="grid grid-cols-2 gap-2.5">
        {([
          { g: 'A' as GrupoLetter, color: '#4CAF50', desc: 'Ambulatorial', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M12 2L6 12a6 6 0 1 0 12 0L12 2z"/></svg> },
          { g: 'B' as GrupoLetter, color: '#FFC107', desc: 'Observação ≥6h', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
          { g: 'C' as GrupoLetter, color: '#F44336', desc: 'Internação + IV', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
          { g: 'D' as GrupoLetter, color: '#F44336', desc: 'UTI / Emergência', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2"><circle cx="12" cy="12" r="10" fill="#F44336" fillOpacity="0.2"/></svg> },
        ]).map(item => (
          <button
            key={item.g}
            onClick={() => goTo(`grupo${item.g}` as Screen)}
            className="bg-bg-card border rounded-xl p-4 text-center cursor-pointer transition-all min-h-[44px] flex flex-col items-center justify-center gap-1.5 active:bg-bg-hover active:scale-[0.97]"
            style={{ borderColor: item.color }}
          >
            {item.icon}
            <div className="text-xs font-semibold text-text-primary">Grupo {item.g}</div>
            <div className="text-xs text-text-muted">{item.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )

  // ========== CLASSIFICAÇÃO DIRETA ==========
  const renderClassificação = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Classificação clínica</SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Ministério da Saúde, 6a edição (2024)</p>

      {/* Sinais de alarme checklist */}
      <Collapsible title="Sinais de alarme" badge="Avaliar" badgeColor="#F44336">
        <p className="text-sm text-text-secondary mb-3">
          Marque os sinais presentes. A presença de <strong className="text-warning">qualquer um</strong> indica pelo menos Grupo C.
        </p>
        {ALARM_LABELS.map((label, i) => (
          <CheckItem key={i} label={label} checked={alarmes[i]} onChange={() => toggleAlarm(i)} />
        ))}
        {alarmCount > 0 && (
          <div className="mt-3">
            <AlertCard type="danger" title={`${alarmCount} ${alarmCount === 1 ? 'SINAL DE ALARME' : 'SINAIS DE ALARME'}`}>
              Classificar como pelo menos Grupo C. Iniciar hidratação IV.
            </AlertCard>
          </div>
        )}
      </Collapsible>

      {/* Prova do laço */}
      <Collapsible title="Prova do laço" badge="Técnica" badgeColor="#2196F3">
        <div className="space-y-3">
          {[
            { n: 1, t: 'Aferir PA', p: 'Insufle o manguito até o ponto médio entre PAS e PAD.' },
            { n: 2, t: 'Manter por 5 minutos', p: 'Manter o manguito insuflado no ponto médio. Em crianças, considere 3 minutos.' },
            { n: 3, t: 'Contar petequias', p: 'Desenhe um quadrado de 2,5 x 2,5 cm no antebraço e conte as petequias.' },
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
          &#8805; 20 petéquias em adultos no quadrado. Considere fragilidade capilar — não exclui nem confirma dengue isoladamente.
        </AlertCard>
        <InfoCard title="Atenção">
          <p>A prova do laço pode ser negativa em pacientes obesos, em choque ou uso de anti-hipertensivos. Não substitui avaliação clínica e laboratorial.</p>
        </InfoCard>
      </Collapsible>

      {/* Fluxo de classificação */}
      <Collapsible title="Fluxo de classificação">
        <AlertCard type="info" title="Passo 1">
          Há sinais de gravidade? (choque, sangramento grave, disfunção orgânica grave)
        </AlertCard>
        <div className="flex gap-2 mt-2">
          <Button variant="danger" size="sm" className="flex-1" onClick={() => goTo('grupoD')}>Sim → Grupo D</Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => setClassStep2Visible(true)}>Não → Próximo</Button>
        </div>

        {classStep2Visible && (
          <div className="mt-4">
            <AlertCard type="warning" title="Passo 2">
              Há sinais de alarme? (use o checklist acima)
            </AlertCard>
            <div className="flex gap-2 mt-2">
              <Button size="sm" className="flex-1" style={{ background: '#FFC107', color: '#000' }} onClick={() => goTo('grupoC')}>Sim → Grupo C</Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setClassStep3Visible(true)}>Não → Próximo</Button>
            </div>
          </div>
        )}

        {classStep3Visible && (
          <div className="mt-4">
            <AlertCard type="success" title="Passo 3">
              Há condição de risco?
              <br />
              <span className="text-xs">Gestante, &lt;2 anos ou &gt;65 anos, comorbidades (HAS, DM, DPOC, doença hematológica, renal crônica, doença péptica, hepatopatia), risco social</span>
            </AlertCard>
            <div className="flex gap-2 mt-2">
              <Button variant="secondary" size="sm" className="flex-1 border-warning" onClick={() => goTo('grupoB')}>Sim → Grupo B</Button>
              <Button variant="success" size="sm" className="flex-1" onClick={() => goTo('grupoA')}>Não → Grupo A</Button>
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
      <p className="text-sm text-text-secondary mb-4">Sem sinais de alarme, sem condições de risco</p>

      <AlertCard type="success" title="Conduta">Hidratação oral domiciliar + acompanhamento ambulatorial</AlertCard>

      <Collapsible title="Hidratação oral">
        <CalcCard label="Volume total: 60 mL/kg/dia">
          <CalcResult
            value={fmtInt(hydration?.voTotal ?? null)}
            unit="mL/dia"
            secondary={`1/3 SRO (${fmtInt(hydration?.voSRO ?? null)} mL) + 2/3 líquidos (${fmtInt(hydration?.voLiquidos ?? null)} mL)`}
          />
        </CalcCard>
        <InfoCard title="Orientação prática">
          <p>Considere oferecer água, suco de frutas, chá, água de coco. Evitar bebidas com cafeína. O volume diário inclui alimentação líquida. Distribuir ao longo do dia (não forçar grandes volumes de uma vez).</p>
        </InfoCard>
      </Collapsible>

      <Collapsible title="Antieméticos">
        <InfoCard title="Metoclopramida">
          <p>10 mg IV ou VO, a cada 8 horas. Ampola: 10 mg/2 mL.</p>
        </InfoCard>
        <InfoCard title="Ondansetrona">
          <p>4-8 mg IV ou VO, a cada 8 horas. Ampola: 4 mg/2 mL ou 8 mg/4 mL.</p>
        </InfoCard>
        <AlertCard type="info" title="Nota" className="text-xs">
          Considere antieméticos se vômitos dificultarem a hidratação oral. Evitar anti-inflamatórios não esteroidais (AINEs) e ácido acetilsalicílico.
        </AlertCard>
      </Collapsible>

      <Collapsible title="Retorno e sinais de alarme" badge="Importante" badgeColor="#FFC107">
        <p className="text-sm text-text-secondary mb-3">
          Orientar o paciente a retornar <strong className="text-warning">imediatamente</strong> se apresentar qualquer um dos seguintes:
        </p>
        <BulletList items={[
          'Dor abdominal intensa e contínua',
          'Vômitos persistentes',
          'Sangramento (gengiva, nariz, fezes escuras, urina escura)',
          'Tontura ou desmaio ao levantar',
          'Pele fria, pálida ou pegajosa',
          'Dificuldade para respirar',
          'Sonolência excessiva ou agitação',
        ]} />
        <Button variant="outline" fullWidth className="mt-3" onClick={() => goTo('altasegura')}>
          Gerar orientações para WhatsApp →
        </Button>
      </Collapsible>

      <Button fullWidth className="mt-3" onClick={() => goTo('altasegura')}>
        Orientações de alta completas →
      </Button>

      <ReclassSection>
        <Button variant="secondary" fullWidth size="sm" className="border-warning" onClick={() => goTo('grupoB')}>
          Identificou condição de risco → Grupo B
        </Button>
        <Button fullWidth size="sm" style={{ background: '#FFC107', color: '#000' }} onClick={() => goTo('grupoC')}>
          Evoluiu com sinais de alarme → Grupo C
        </Button>
      </ReclassSection>
    </div>
  )

  // ========== GRUPO B ==========
  const renderGrupoB = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Grupo B <Tag label="Observação" color="#FFC107" /></SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Sem sinais de alarme, com condição de risco</p>

      <AlertCard type="warning" title="Conduta">
        Hidratação oral supervisionada em unidade de saúde por pelo menos 6 horas. Solicitar hemograma com hematócrito.
      </AlertCard>

      <Collapsible title="Condições de risco">
        <BulletList items={[
          'Gestante',
          'Idade <2 anos ou >65 anos',
          'Hipertensão arterial ou outras doenças cardiovasculares',
          'Diabetes mellitus',
          'DPOC',
          'Doença hematológica (anemia falciforme, etc.)',
          'Doença renal crônica',
          'Doença ácido-péptica',
          'Hepatopatia',
          'Doença autoimune',
          'Uso de anticoagulantes',
          'Risco social ou comorbidade não listada',
        ]} />
      </Collapsible>

      <Collapsible title="Hidratação e monitorização">
        <CalcCard label="Hidratação oral: 60 mL/kg/dia">
          <CalcResult value={fmtInt(hydration?.voTotal ?? null)} unit="mL/dia" secondary="1/3 SRO + 2/3 líquidos" />
        </CalcCard>
        <AlertCard type="info" title="Acompanhamento">
          Hemograma com hematócrito antes da hidratação e após (em 4-6h). Se o Ht estiver estável e sem sinais de alarme, considere alta com orientações. Se Ht subindo, considere reclassificar para Grupo C.
        </AlertCard>
      </Collapsible>

      <AlertCard type="danger" title="Reclassificar para Grupo C se:" className="mt-3">
        Surgimento de qualquer sinal de alarme ou hematócrito em ascensão (aumento &#8805;20% do valor basal). Referência: homem ~45%, mulher ~40%. Repetir Ht a cada 2-4h durante expansão.
      </AlertCard>

      <Button fullWidth className="mt-3" onClick={() => goTo('altasegura')}>
        Orientações de alta completas →
      </Button>

      <ReclassSection>
        <Button variant="success" fullWidth size="sm" onClick={() => goTo('grupoA')}>
          Sem critérios de risco → Grupo A
        </Button>
        <Button fullWidth size="sm" style={{ background: '#FFC107', color: '#000' }} onClick={() => goTo('grupoC')}>
          Sinais de alarme → Grupo C
        </Button>
      </ReclassSection>
    </div>
  )

  // ========== GRUPO C ==========
  const renderGrupoC = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Grupo C <Tag label="Internação" color="#F44336" /></SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Com sinais de alarme — iniciar reposição volêmica imediata</p>

      <AlertCard type="danger" title="Conduta imediata">
        Hidratação IV: 10 mL/kg/h por 2 horas (fase de expansão). Solicitar hemograma, função renal, hepática, tipagem sanguínea.
      </AlertCard>

      <Collapsible title="Fase de expansão (primeiras 2h)">
        <CalcCard label="SF 0,9% ou RL — 10 mL/kg/h x 2h">
          <div className="flex gap-2">
            <CalcResult value={fmtInt(hydration?.ivHora ?? null)} unit="mL/h" />
            <CalcResult value={fmtInt(hydration?.iv2h ?? null)} unit="mL em 2h" />
          </div>
        </CalcCard>
      </Collapsible>

      <Collapsible title="Reavaliação após 2h" badge="Decisão" badgeColor="#FFC107">
        <p className="text-sm text-text-secondary mb-3">Reavaliar clinicamente e repetir hematócrito:</p>
        <AlertCard type="success" title="Melhora clínica + Ht em queda">
          Reduzir para fase de manutenção: 25 mL/kg em 6h. Reavaliar em 6h. Se mantiver melhora, passar para 25 mL/kg em 8h (etapa final).
        </AlertCard>
        <AlertCard type="warning" title="Sem melhora ou Ht em ascensão (aumento ≥20% do basal)">
          Repetir fase de expansão (10 mL/kg/h por mais 2h). Repetir Ht a cada 2-4h durante expansão. Se não houver melhora após segunda expansão, manejar como Grupo D.
        </AlertCard>
        <CalcCard label="Fase de manutenção">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-xs text-text-muted mb-1">25 mL/kg em 6h</div>
              <CalcResult value={fmtInt(hydration?.ivMan6 ?? null)} unit="mL total" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-text-muted mb-1">25 mL/kg em 8h</div>
              <CalcResult value={fmtInt(hydration?.ivMan8 ?? null)} unit="mL total" />
            </div>
          </div>
        </CalcCard>
        <Button variant="danger" fullWidth size="sm" className="mt-3" onClick={() => goTo('grupoD')}>
          Sem resposta → Grupo D
        </Button>
      </Collapsible>

      <Collapsible title="Monitorização durante observação">
        <InfoCard title="Parâmetros de monitorização">
          <BulletList items={[
            'Sinais vitais a cada 1-2h',
            'Ht de controle a cada 4-6h',
            'Repetir Ht a cada 2-4h durante expansão',
            'Diurese (alvo >0,5 mL/kg/h)',
            'Balanço hídrico a cada 6h',
          ]} />
        </InfoCard>
      </Collapsible>

      <Collapsible title="Reavaliação seriada">
        <InfoCard title="Após cada fase de expansão">
          <BulletList items={[
            'Checar PA, FC, TEC, diurese',
            'Se melhora: passar para manutenção',
            'Se piora: reclassificar para Grupo D',
          ]} />
        </InfoCard>
      </Collapsible>

      <Collapsible title="Fase crítica (defervescência)" badge="Atenção" badgeColor="#F44336">
        <AlertCard type="danger" title="Período de maior risco">
          Ocorre entre o 3o e 7o dia de doença. Janela de 24-48h de maior risco de extravasamento plasmático.
        </AlertCard>
        <InfoCard title="Conduta">
          <p>Considere intensificar monitorização quando a febre ceder. A melhora da febre não significa melhora clínica — pode indicar o início da fase crítica.</p>
        </InfoCard>
      </Collapsible>

      <Collapsible title="Critérios para considerar UTI">
        <BulletList items={[
          'Choque refratário a 2 expansões',
          'Necessidade de vasopressor',
          'Sangramento grave ativo',
          'Disfunção orgânica (IRA, SDRA, encefalite)',
          'Rebaixamento do nível de consciência',
        ]} />
      </Collapsible>

      <ReclassSection>
        <Button variant="danger" fullWidth size="sm" onClick={() => goTo('grupoD')}>
          Sinais de gravidade → Grupo D
        </Button>
        <Button variant="secondary" fullWidth size="sm" onClick={() => goTo('grupoB')}>
          Melhora clínica → Grupo B
        </Button>
      </ReclassSection>
    </div>
  )

  // ========== GRUPO D ==========
  const renderGrupoD = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Grupo D <Tag label="UTI / Emergência" color="#F44336" /></SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Dengue grave — choque, hemorragia grave ou disfunção orgânica</p>

      <AlertCard type="danger" title="Emergência">
        Iniciar reposição volêmica agressiva imediatamente. Acesso venoso calibroso (dois acessos). Considere UTI.
      </AlertCard>

      <Collapsible title="Critérios de dengue grave">
        <BulletList items={[
          'Choque: pulso rápido e fino, TEC >2s, PA convergente (≤20 mmHg) ou hipotensão, extremidades frias',
          'Hemorragia grave: hematêmese, melena volumosa, sangramento do SNC',
          'Disfunção orgânica: hepatite (AST/ALT >1.000), encefalite, miocardite, insuficiência renal aguda',
        ]} />
      </Collapsible>

      <Collapsible title="Fase de expansão rápida" badge="Urgente" badgeColor="#F44336">
        <CalcCard label="SF 0,9% — 20 mL/kg em até 20 minutos">
          <CalcResult value={fmtInt(hydration?.bolus ?? null)} unit="mL por bolus" secondary="Pode repetir até 3 vezes" />
        </CalcCard>
        <AlertCard type="warning" title="Reavaliação contínua">
          Após cada bolus: PA, FC, TEC, diurese, Ht. Se melhora → transição para fase de manutenção do Grupo C (25 mL/kg em 6h).
        </AlertCard>
      </Collapsible>

      <Collapsible title="Refratário a cristaloide" badge="Escalar" badgeColor="#F44336">
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-7 h-7 min-w-[28px] rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold mt-0.5">1</div>
            <div>
              <h4 className="text-sm font-semibold">Albumina 20%</h4>
              <p className="text-sm text-text-secondary">Se Ht em ascensão (aumento &#8805;20% do valor basal) após 3 expansões com cristaloide. Considere 0,5-1 g/kg. Repetir Ht a cada 2-4h durante expansão.</p>
            </div>
          </div>
          <CalcCard label="Albumina 20% — 0,5 a 1 g/kg">
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="text-xs text-text-muted mb-1">0,5 g/kg</div>
                <CalcResult value={fmtInt(hydration?.alb05 ?? null)} unit="mL" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-text-muted mb-1">1 g/kg</div>
                <CalcResult value={fmtInt(hydration?.alb1 ?? null)} unit="mL" />
              </div>
            </div>
            <div className="text-center text-xs text-text-muted mt-2">Apresentação: frasco 50 mL (20% = 10 g/frasco)</div>
          </CalcCard>
          <div className="flex gap-3">
            <div className="w-7 h-7 min-w-[28px] rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold mt-0.5">2</div>
            <div>
              <h4 className="text-sm font-semibold">Se Ht em queda + choque persistente</h4>
              <p className="text-sm text-text-secondary">Sugere hemorragia. Considere hemotransfusão (CH) e investigar foco hemorrágico.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-7 h-7 min-w-[28px] rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold mt-0.5">3</div>
            <div>
              <h4 className="text-sm font-semibold">Noradrenalina</h4>
              <p className="text-sm text-text-secondary">Se choque refratário a volume (apos reposição adequada). Considere acesso venoso central.</p>
            </div>
          </div>
        </div>
        <InfoCard title="Metas de ressuscitação">
          <BulletList items={[
            'PAS >90 mmHg (ou PAM >65 mmHg)',
            'FC <100 bpm',
            'TEC <2s',
            'Diurese >0,5 mL/kg/h',
            'Ht estável ou em queda',
            'Melhora do nível de consciência',
          ]} />
        </InfoCard>
      </Collapsible>

      <Collapsible title="Monitorização intensiva" badge="Contínua" badgeColor="#F44336">
        <InfoCard title="Parâmetros de monitorização">
          <BulletList items={[
            'Sinais vitais contínuos ou a cada 15-30 min',
            'Ht de controle a cada 2h durante expansão',
            'Diurese por sonda vesical (alvo >0,5 mL/kg/h)',
            'Balanço hídrico rigoroso',
            'Considerar acesso venoso central e PAI',
          ]} />
        </InfoCard>
      </Collapsible>

      <Collapsible title="Critérios para UTI">
        <BulletList items={[
          'Choque refratário a 2 expansões',
          'Necessidade de vasopressor',
          'Sangramento grave ativo',
          'Disfunção orgânica (IRA, SDRA, encefalite)',
          'Rebaixamento do nível de consciência',
        ]} />
      </Collapsible>

      <Collapsible title="Complicações a monitorizar" badge="Atenção" badgeColor="#F44336">
        <BulletList items={[
          'CIVD: monitorar fibrinogênio, D-dímero, TP',
          'Miocardite: ECG, troponina, eco se disponível',
          'Hepatite grave: AST/ALT >1000',
          'Síndrome hemofagocítica: ferritina, triglicerídeos',
        ]} />
      </Collapsible>

      <Collapsible title="Fase crítica (defervescência)">
        <AlertCard type="danger" title="Período de maior risco">
          Ocorre entre o 3o e 7o dia de doença. Janela de 24-48h de maior risco de extravasamento plasmático.
        </AlertCard>
        <InfoCard title="Conduta">
          <p>Considere intensificar monitorização quando a febre ceder. A melhora da febre não significa melhora clínica — pode indicar o início da fase crítica.</p>
        </InfoCard>
      </Collapsible>

      <ReclassSection>
        <Button variant="secondary" fullWidth size="sm" onClick={() => goTo('grupoC')}>
          Estabilizou → Grupo C
        </Button>
      </ReclassSection>
    </div>
  )

  // ========== CALCULADORAS ==========
  const renderCalculadoras = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Calculadoras</SectionTitle>

      {/* Hidratação oral */}
      <Collapsible title="Hidratação oral (Grupo A)" badge="60 mL/kg/dia" badgeColor="#4CAF50">
        <InfoCard title="Indicação">
          <p>Volume: 60 mL/kg/dia (1/3 com SRO). Distribuir ao longo do dia. Inclui alimentação líquida.</p>
        </InfoCard>
        <CalcCard label="Volume total diário">
          <CalcResult value={fmtInt(hydration?.voTotal ?? null)} unit="mL/dia" />
          <div className="flex gap-2 mt-2">
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-xs text-text-muted">1/3 SRO</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.voSRO ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
            </div>
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-xs text-text-muted">2/3 Liquidos</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.voLiquidos ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
            </div>
          </div>
        </CalcCard>
      </Collapsible>

      {/* Hidratação IV — expansão */}
      <Collapsible title="Hidratação IV — expansão (Grupos C/D)" badge="Expansão" badgeColor="#F44336">
        <InfoCard title="Protocolo de expansão">
          <BulletList items={[
            'Fase de expansão: 20 mL/kg em 2h (cristaloide isotônico)',
            'Reavaliação após cada fase',
            'Se melhora: manutenção 25 mL/kg em 6h',
            'Se não melhora: repetir expansão (máximo 3 expansões)',
          ]} />
        </InfoCard>
        <CalcCard label="Expansão — 20 mL/kg em 20 min (Grupo D) ou 10 mL/kg/h x 2h (Grupo C)">
          <div className="flex gap-2">
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-xs text-text-muted">Bolus 20 mL/kg</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.bolus ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
            </div>
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-xs text-text-muted">10 mL/kg/h</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.ivHora ?? null)}</div>
              <div className="text-sm text-text-secondary">mL/h</div>
            </div>
          </div>
          <div className="text-center py-3 bg-bg-card rounded-lg mt-2">
            <div className="text-xs text-text-muted">Volume em 2h (Grupo C)</div>
            <div className="text-xl font-bold">{fmtInt(hydration?.iv2h ?? null)}</div>
            <div className="text-sm text-text-secondary">mL</div>
          </div>
        </CalcCard>
      </Collapsible>

      {/* Hidratação IV — manutenção */}
      <Collapsible title="Hidratação IV — manutenção" badge="Manutenção" badgeColor="#FFC107">
        <InfoCard title="Protocolo de manutenção">
          <BulletList items={[
            '25 mL/kg em 6h (primeira fase)',
            'Depois 25 mL/kg em 8h (segunda fase)',
            'Reduzir conforme melhora clínica',
          ]} />
        </InfoCard>
        <CalcCard label="Manutenção — 25 mL/kg">
          <div className="flex gap-2">
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-xs text-text-muted">25 mL/kg em 6h</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.ivMan6 ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
              <div className="text-xs text-text-muted">{hydration ? `${fmtInt(hydration.ivMan6 / 6)} mL/h` : '--'}</div>
            </div>
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-xs text-text-muted">25 mL/kg em 8h</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.ivMan8 ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
              <div className="text-xs text-text-muted">{hydration ? `${fmtInt(hydration.ivMan8 / 8)} mL/h` : '--'}</div>
            </div>
          </div>
        </CalcCard>
      </Collapsible>

      {/* Albumina */}
      <Collapsible title="Albumina (reposição coloidosmótica)" badge="Refratário" badgeColor="#F44336">
        <AlertCard type="danger" title="Atenção" className="text-xs">
          Albumina NÃO é hidratação — é para choque refratário após 3 expansões com cristaloide.
        </AlertCard>
        <InfoCard title="Indicação e dose">
          <BulletList items={[
            'Dose: 0,5-1 g/kg (albumina 20%)',
            'Indicação: choque refratário a cristaloide + Ht em queda',
            'Apresentação: frasco 50 mL (20% = 10 g/frasco)',
          ]} />
        </InfoCard>
        <CalcCard label="Albumina 20% — 0,5 a 1 g/kg">
          <div className="flex gap-2">
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-xs text-text-muted">0,5 g/kg</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.alb05 ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
              <div className="text-xs text-text-muted">{hydration ? `${Math.ceil(hydration.alb05 / 50)} ${Math.ceil(hydration.alb05 / 50) === 1 ? 'frasco' : 'frascos'}` : '--'}</div>
            </div>
            <div className="flex-1 text-center py-3 bg-bg-card rounded-lg">
              <div className="text-xs text-text-muted">1 g/kg</div>
              <div className="text-xl font-bold">{fmtInt(hydration?.alb1 ?? null)}</div>
              <div className="text-sm text-text-secondary">mL</div>
              <div className="text-xs text-text-muted">{hydration ? `${Math.ceil(hydration.alb1 / 50)} ${Math.ceil(hydration.alb1 / 50) === 1 ? 'frasco' : 'frascos'}` : '--'}</div>
            </div>
          </div>
        </CalcCard>
      </Collapsible>

      {/* Variação Ht */}
      <Collapsible title="Cálculo de variação do Ht" badge="Monitorização" badgeColor="#FFC107">
        <CalcCard label="Variação do hematócrito (%)">
          <div className="text-xs text-text-muted mb-2">Formula: (Ht atual - Ht basal) / Ht basal x 100</div>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <div className="text-xs text-text-muted mb-1">Ht basal (%)</div>
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
              <div className="text-xs text-text-muted mb-1">Ht atual (%)</div>
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
            <div className="text-sm text-text-secondary">% de variação</div>
            <div className="text-sm mt-1" style={{ color: htInterpretation.color }}>{htInterpretation.text}</div>
          </div>
        </CalcCard>
        <InfoCard title="Classificação">
          <BulletList items={[
            '<20%: variação normal',
            '≥20%: hemoconcentração significativa',
          ]} />
        </InfoCard>
        <InfoCard title="Referência">
          <p>Homens: ~45% (40-54%). Mulheres: ~40% (36-48%). Ex: Ht basal 40% → Ht atual &#8805;48% = hemoconcentração significativa.</p>
        </InfoCard>
      </Collapsible>
    </div>
  )

  // ========== E-FASD ==========
  const renderEfasd = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>POCUS / E-FASD</SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Extended Focused Assessment Sonography in Dengue — Tambelli et al., JBMEDE 2024</p>

      <AlertCard type="info" title="Objetivo">
        Rastrear sinais de extravasamento plasmático e gravidade em pacientes com dengue, à beira-leito.
      </AlertCard>

      <Collapsible title="Preparação">
        <BulletList items={[
          'Transdutor: Curvilínea (2,5-5 MHz). Alternativa: setorial',
          'Preset: Abdominal',
          'Posição do paciente: Decúbito dorsal a 0 graus',
          'Indicador da sonda: Para a direita ou cranial em relação ao paciente',
          'Posição Trendelenburg: Opcional — aumenta sensibilidade no andar superior do abdome',
        ]} />
      </Collapsible>

      <Collapsible title="Janelas 1 e 2 — Pulmão anterior" badge="Intersticial" badgeColor="#2196F3">
        <InfoCard title="Avaliação de síndrome intersticial pulmonar">
          <p>Sonda na caixa torácica anterior, linha hemiclavicular, marcador cranial. Visualizar a linha pleural entre duas costelas. Profundidade: 3-5 cm (linha pleural) → ajustar para 8-12 cm (linhas B). Repetir em ambos os hemitórax.</p>
        </InfoCard>
        <AlertCard type="danger" title="E-FASD positivo">
          &#8805; 3 linhas B entre duas costelas → possível extravasamento plasmático ou sobrecarga volêmica.
        </AlertCard>
        <table className="w-full border-collapse my-2 text-sm">
          <thead>
            <tr><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Acurácia do POCUS</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Valor</th></tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border-b border-border">Sensibilidade</td><td className="p-2 border-b border-border text-success">98%</td></tr>
            <tr><td className="p-2">Especificidade</td><td className="p-2 text-success">88%</td></tr>
          </tbody>
        </table>
      </Collapsible>

      <Collapsible title="Janelas 3 e 4 — QSD (ascite + DP direito)" badge="Morrison" badgeColor="#2196F3">
        <InfoCard title="Janela 3 — Ascite à direita">
          <p>Sonda com marcador cefálico na linha axilar posterior direita, transição toracoabdominal. Rotacionar 15-20 graus se costelas atrapalharem. Avaliar: espaço de Morrison, borda caudal do fígado, espaço supra-hepático. Líquido anecoico nesses espaços → E-FASD positivo.</p>
        </InfoCard>
        <InfoCard title="Janela 4 — Derrame pleural D">
          <p>Mover a sonda cranialmente. Conteúdo anecoico acima do diafragma + sinal da coluna → derrame pleural confirmado.</p>
        </InfoCard>
        <table className="w-full border-collapse my-2 text-sm">
          <thead>
            <tr><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Achado</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Sens.</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Esp.</th></tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border-b border-border">Ascite (J3)</td><td className="p-2 border-b border-border text-success">90%</td><td className="p-2 border-b border-border text-success">99%</td></tr>
            <tr><td className="p-2">Derrame pleural (J4)</td><td className="p-2 text-success">94%</td><td className="p-2 text-success">97%</td></tr>
          </tbody>
        </table>
      </Collapsible>

      <Collapsible title="Janela 5 — Vesícula biliar" badge="Gravidade" badgeColor="#FFC107">
        <InfoCard title="Avaliação da parede da vesícula biliar">
          <p>Sonda na região anterior do QSD, abaixo da última costela, paralela à linha mediana, marcador cefálico. Movimento pendular suave. Avaliar a parede <strong>anterior</strong> da vesícula.</p>
        </InfoCard>
        <AlertCard type="danger" title="E-FASD positivo">
          Parede &gt;3 mm de espessura e/ou líquido perivesicular → correlaciona-se com gravidade e extravasamento plasmático.
        </AlertCard>
        <AlertCard type="warning" title="Atenção">
          Espessamento da vesícula biliar não exclui necessidade de investigar diagnósticos diferenciais de patologias biliares.
        </AlertCard>
        <table className="w-full border-collapse my-2 text-sm">
          <thead><tr><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Acurácia</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Valor</th></tr></thead>
          <tbody>
            <tr><td className="p-2 border-b border-border">Sensibilidade</td><td className="p-2 border-b border-border text-success">94%</td></tr>
            <tr><td className="p-2">Especificidade</td><td className="p-2 text-success">91%</td></tr>
          </tbody>
        </table>
      </Collapsible>

      <Collapsible title="Janelas 6 e 7 — QSE (ascite + DP esquerdo)">
        <InfoCard title="Janela 6 — Ascite à esquerda">
          <p>Sonda com marcador cefálico na linha axilar posterior esquerda (mais posterior que no QSD — o baço é mais posterior que o fígado). Avaliar espaço subdiafragmático (mais sensível) e esplenorrenal.</p>
        </InfoCard>
        <InfoCard title="Janela 7 — Derrame pleural E">
          <p>Mover cranialmente. Conteúdo anecoico + sinal da coluna acima do diafragma → derrame pleural.</p>
        </InfoCard>
        <AlertCard type="info" title="Dica">
          Considere solicitar pausa inspiratória ao paciente para melhor visualização. O ligamento esplenorrenal limita o líquido no espaço entre baço e rim — o espaço subdiafragmático é mais sensível para detecção.
        </AlertCard>
      </Collapsible>

      <Collapsible title="Janela 8 — Retrovesical (pelve)">
        <InfoCard title="Avaliação de ascite pélvica">
          <p>Sonda na linha média suprapúbica, marcador cefálico (longitudinal), depois rotacionar 90 graus (transversal). Preferencialmente com bexiga cheia (antes da sonda vesical). Identificar bexiga, útero ou próstata, reto. Líquido anecoico ao redor → E-FASD positivo.</p>
        </InfoCard>
      </Collapsible>

      <Collapsible title="Janela 9 — Subcostal (pericárdio)">
        <InfoCard title="Avaliação de derrame pericárdico">
          <p>Sonda paralela à pele, região subxifoide, feixe de US apontando para o ombro esquerdo. Profundidade: 15-20 cm. Usar o fígado como janela acústica. Conteúdo anecoico no espaço pericárdico → derrame pericárdico.</p>
        </InfoCard>
        <AlertCard type="warning" title="Dificuldades">
          Pode ser difícil em obesos, distensão abdominal, xifoide proeminente ou ascite volumosa. Considere outras janelas cardíacas (paraesternal, apical).
        </AlertCard>
        <table className="w-full border-collapse my-2 text-sm">
          <thead><tr><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Acurácia</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Valor</th></tr></thead>
          <tbody>
            <tr><td className="p-2 border-b border-border">Sensibilidade</td><td className="p-2 border-b border-border text-success">96%</td></tr>
            <tr><td className="p-2">Especificidade</td><td className="p-2 text-success">98%</td></tr>
          </tbody>
        </table>
      </Collapsible>

      <Collapsible title="Resumo — Tabela de acurácia">
        <table className="w-full border-collapse my-2 text-sm">
          <thead>
            <tr><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Janela</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Achado</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Sens.</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Esp.</th></tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border-b border-border">1-2</td><td className="p-2 border-b border-border">Síndrome intersticial</td><td className="p-2 border-b border-border">98%</td><td className="p-2 border-b border-border">88%</td></tr>
            <tr><td className="p-2 border-b border-border">3, 6, 8</td><td className="p-2 border-b border-border">Ascite</td><td className="p-2 border-b border-border">90%</td><td className="p-2 border-b border-border">99%</td></tr>
            <tr><td className="p-2 border-b border-border">4, 7</td><td className="p-2 border-b border-border">Derrame pleural</td><td className="p-2 border-b border-border">94%</td><td className="p-2 border-b border-border">97%</td></tr>
            <tr><td className="p-2 border-b border-border">5</td><td className="p-2 border-b border-border">Espessamento vesicular</td><td className="p-2 border-b border-border">94%</td><td className="p-2 border-b border-border">91%</td></tr>
            <tr><td className="p-2">9</td><td className="p-2">Derrame pericárdico</td><td className="p-2">96%</td><td className="p-2">98%</td></tr>
          </tbody>
        </table>
        <AlertCard type="info" title="Limitação" className="mt-2">
          O E-FASD não diagnostica nem classifica gravidade isoladamente. É uma ferramenta de triagem complementar à avaliação clínica e laboratorial.
        </AlertCard>
      </Collapsible>
    </div>
  )

  // ========== EXAMES E DIFERENCIAIS ==========
  const renderExameDiff = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Exames e diagnósticos diferenciais</SectionTitle>
      <p className="text-sm text-text-secondary mb-4">Laboratório, monitorização e diagnósticos diferenciais</p>

      <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Exames laboratoriais</div>

      <Collapsible title="Exames sugeridos na dengue">
        <BulletList items={[
          'Hemograma completo com hematócrito',
          'Coagulograma (TP, TTPa, fibrinogênio)',
          'Função renal (ureia, creatinina)',
          'Função hepática (AST, ALT, albumina)',
          'Tipagem sanguínea',
          'Lactato',
          'Gasometria arterial (se grave)',
          'NS1 (até 5o dia) / IgM (a partir do 6o dia)',
        ]} />
      </Collapsible>

      <Collapsible title="Exames por grupo">
        <table className="w-full border-collapse my-2 text-sm">
          <thead>
            <tr><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Grupo</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Exames sugeridos</th></tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border-b border-border"><Tag label="A" color="#4CAF50" /></td><td className="p-2 border-b border-border">Hemograma (não obrigatório). Orientar retorno se sinais de alarme.</td></tr>
            <tr><td className="p-2 border-b border-border"><Tag label="B" color="#FFC107" /></td><td className="p-2 border-b border-border">Hemograma com Ht obrigatório. Repetir em 4-6h.</td></tr>
            <tr><td className="p-2 border-b border-border"><Tag label="C" color="#F44336" /></td><td className="p-2 border-b border-border">Hemograma seriado (Ht a cada 2h na expansão). Função renal, hepática, coagulograma, tipagem sanguínea.</td></tr>
            <tr><td className="p-2"><Tag label="D" color="#F44336" /></td><td className="p-2">Hemograma seriado, função renal e hepática, coagulograma (TP, TTPa, fibrinogênio), tipagem + reserva, gasometria, lactato. Rx de tórax se disponível.</td></tr>
          </tbody>
        </table>
      </Collapsible>

      <Collapsible title="Interpretação do hematócrito" badge="Parâmetro-chave" badgeColor="#FFC107">
        <AlertCard type="warning" title="Ht em ascensão (aumento ≥20% do valor basal)">
          Sugere hemoconcentração por extravasamento plasmático. Escalar tratamento (maior aporte de volume). Referência: homem ~45%, mulher ~40%. Ex: Ht basal 40% → Ht atual &#8805;48% = alarme.
        </AlertCard>
        <AlertCard type="success" title="Ht em queda com melhora clínica">
          Sugere reabsorção plasmática. Considere reduzir velocidade de infusão.
        </AlertCard>
        <AlertCard type="danger" title="Ht em queda com piora clínica">
          Sugere hemorragia. Investigar sangramento e considere hemotransfusão.
        </AlertCard>
        <InfoCard title="Valores de referência">
          <p>Homens: ~45% (referência: 40-54%). Mulheres: ~40% (referência: 36-48%). Fórmula: (Ht atual - Ht basal) / Ht basal x 100. Elevação &#8805;20% sugere hemoconcentração significativa. Repetir Ht a cada 2-4h durante expansão (Grupos C/D). Monitorizar a cada 12-24h no Grupo B.</p>
        </InfoCard>
      </Collapsible>

      <Collapsible title="Plaquetas">
        <InfoCard title="Classificação da plaquetopenia na dengue">
          <BulletList items={[
            'Plaquetopenia: <100.000/mm3 (critério de risco — Grupo B)',
            'Plaquetopenia grave: <50.000/mm3 (considere avaliação de hemostasia)',
            'Plaquetopenia crítica: <20.000/mm3 (risco de sangramento espontâneo)',
          ]} />
        </InfoCard>
        <InfoCard title="Conduta">
          <p>Isoladamente, a plaquetopenia não indica gravidade nem necessidade de transfusão de plaquetas. A decisão de transfundir deve ser individualizada e baseada em sangramento ativo, não no número absoluto.</p>
        </InfoCard>
        <AlertCard type="danger" title="Atenção">
          Considere transfusão de plaquetas apenas se sangramento ativo grave com plaquetopenia &lt;50.000/mm3. Evitar transfusão profilática — não há evidência de benefício na dengue.
        </AlertCard>
      </Collapsible>

      <div className="text-xs text-text-muted uppercase tracking-wider mt-4 pt-4 border-t border-border mb-2">Diagnósticos diferenciais</div>

      <Collapsible title="Diagnósticos diferenciais principais">
        <BulletList items={[
          'Outras arboviroses (Zika, Chikungunya)',
          'Leptospirose',
          'Meningococcemia',
          'Febre maculosa',
          'Malária',
          'Hepatites virais',
          'Influenza / COVID-19',
        ]} />
      </Collapsible>

      <Collapsible title="Comparativo entre arboviroses">
        <table className="w-full border-collapse my-2 text-sm">
          <thead>
            <tr><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Achado</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Dengue</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Zika</th><th className="bg-bg-hover text-text-secondary text-xs font-semibold uppercase p-2 text-left border-b border-border">Chikungunya</th></tr>
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

      <Collapsible title="Complicações da dengue" badge="Atenção" badgeColor="#F44336">
        <BulletList items={[
          'Miocardite: arritmias, disfunção ventricular, troponina elevada',
          'Encefalite: rebaixamento do nível de consciência, convulsões',
          'Hepatite: AST/ALT >1.000, pode evoluir para insuficiência hepática',
          'CIVD: coagulograma alargado, fibrinogênio baixo, sangramento difuso',
          'Rabdomiólise: CPK elevada, IRA',
          'Síndrome hemofagocítica: febre persistente, citopenias, ferritina muito elevada',
        ]} />
      </Collapsible>
    </div>
  )

  // ========== ALTA SEGURA ==========
  const renderAltaSegura = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Orientações para alta segura</SectionTitle>

      <Collapsible title="Critérios de alta hospitalar">
        <BulletList items={[
          'Ausência de febre por 24-48h sem uso de antitérmicos',
          'Melhora clínica visível',
          'Hematócrito estável (sem hemoconcentração)',
          'Plaquetas em ascensão (tendência de melhora)',
          'Estabilidade hemodinâmica por 24h',
          'Capacidade de manter hidratação oral adequada',
          'Diurese adequada (>0,5 mL/kg/h)',
        ]} />
      </Collapsible>

      <Collapsible title="Orientações ao paciente">
        <BulletList items={[
          'Manter hidratação oral abundante (60 mL/kg/dia)',
          'Repouso relativo',
          'Usar apenas paracetamol ou dipirona se febre ou dor (evitar AINEs e AAS)',
          'Retorno para reavaliação conforme orientação médica',
        ]} />
        <p className="text-sm text-text-secondary mt-2">
          Retornar <strong className="text-warning">imediatamente</strong> se sinais de alarme
        </p>
        <div className="h-px bg-border my-3" />
        <p className="text-xs text-text-muted mb-3"><strong>Sinais de alarme para retorno imediato:</strong></p>
        <BulletList items={[
          'Dor abdominal intensa e contínua',
          'Vômitos persistentes',
          'Sangramento (gengiva, nariz, fezes escuras, urina escura)',
          'Tontura ou desmaio ao levantar',
          'Pele fria, pálida ou pegajosa',
          'Dificuldade para respirar',
          'Sonolência excessiva ou agitação intensa',
        ]} color="#F44336" />
      </Collapsible>

      <Button fullWidth className="mt-4" onClick={gerarMsgWhatsApp}>
        Gerar orientações para WhatsApp
      </Button>

      {wppVisible && (
        <div className="mt-4">
          <div className="bg-bg-card border border-border-card rounded-xl p-4">
            <div className="text-xs text-text-muted mb-2">Mensagem gerada — toque para copiar</div>
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
  const renderReferências = () => (
    <div>
      <BackButton onClick={() => goTo('home')} />
      <SectionTitle>Referências</SectionTitle>

      <Collapsible title="Fontes bibliográficas">
        <div className="text-xs leading-loose text-text-secondary">
          <p><strong className="text-text-primary">1.</strong> Brasil. Ministério da Saúde. Dengue: diagnóstico e manejo clínico — adulto e criança. 6a edição. Brasília, 2024.</p>
          <p className="mt-2"><strong className="text-text-primary">2.</strong> Associação Brasileira de Medicina de Emergência (ABRAMEDE). Recomendações para manejo de dengue no departamento de emergência.</p>
          <p className="mt-2"><strong className="text-text-primary">3.</strong> World Health Organization. Dengue: guidelines for diagnosis, treatment, prevention and control. WHO, 2009 (atualizada 2012).</p>
          <p className="mt-2"><strong className="text-text-primary">4.</strong> Tambelli RA, Silva PS, Schubert DU, et al. Extended Focused Assessment Sonography in Dengue (E-FASD): protocolo de ultrassom point of care para avaliação de pacientes com dengue. JBMEDE. 2024;4(1):e24005.</p>
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
    classificação: renderClassificação,
    grupoA: renderGrupoA,
    grupoB: renderGrupoB,
    grupoC: renderGrupoC,
    grupoD: renderGrupoD,
    calculadoras: renderCalculadoras,
    efasd: renderEfasd,
    examediff: renderExameDiff,
    altasegura: renderAltaSegura,
    referências: renderReferências,
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <Disclaimer />
      <Header title="Dengue Path" subtitle="Manejo de dengue na emergência" />
      {showWeight && <WeightInput />}
      <Container>
        {screenMap[screen]()}
      </Container>
      <Footer toolName="Dengue Path" version="v4.0.0" updatedAt="Agosto 2026" />
      <FABMenu items={fabItems} />
    </div>
  )
}
