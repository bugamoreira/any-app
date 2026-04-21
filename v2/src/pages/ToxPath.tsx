import { useState, useMemo, useCallback } from 'react'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
import { Card } from '../components/common/Card'
import { Collapsible } from '../components/common/Collapsible'
import { AlertCard } from '../components/common/AlertCard'
import { useToast } from '../contexts/ToastContext'
import { useWeight } from '../contexts/WeightContext'

import {
  homeModules,
  toxQuestions, toxindromes,
  antidotes,
  utiCriteria, enfermariaCriteria,
  checklistSections,
  tabelaTabs, tabelaComparacoes,
  ecgTable, ecgTreatmentTable, odoresTable,
  midríaseTable, mioseTable, bombasTable, examesIngestaoTable,
  toxicDrugs,
  type ToxQuestion, type ToxOption, type Toxindrome, type Antidote,
  type DispositionCriterion, type ChecklistSection, type TableRow,
  type ComparisonCard, type ToxicDrug, type VitalClass,
} from '../data/toxData'

// ==========================================
// TIPOS
// ==========================================

type Screen = 'home' | 'toxindromes' | 'descontaminação' | 'disposição' | 'antídotos' | 'checklist' | 'tabelas'

// ==========================================
// SUB-COMPONENTES
// ==========================================

/**
 * BLOCKER-04: dose de carvao ativado calculada a partir do peso do paciente.
 * Formula: 1 g/kg, minimo 25 g (adolescente ~40 kg gera 40 g — OK; pediatrico
 * menor recebe 25 g fixo), maximo 100 g (limita superdose em >100 kg).
 * Referencia: Goldfrank's Toxicologic Emergencies 11th ed, 2019.
 */
function CarvaoAtivadoCalc() {
  const { weight, setWeight } = useWeight()
  const [localInput, setLocalInput] = useState('')

  if (weight == null) {
    return (
      <Card className="!p-4">
        <p className="text-sm font-bold text-text-primary mb-2">Dose de carvão ativado</p>
        <p className="text-xs text-text-secondary mb-3">
          Informe o peso do paciente para calcular a dose (1 g/kg, entre 25 g e 100 g).
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Peso (kg)"
            value={localInput}
            onChange={e => setLocalInput(e.target.value)}
            className="flex-1 bg-bg-elevated border border-border-card rounded-lg px-3 py-2 text-base text-text-primary outline-none focus:border-accent min-h-[44px]"
            aria-label="Peso em kg"
          />
          <button
            onClick={() => {
              const v = parseFloat(localInput)
              if (!isNaN(v) && v > 0 && v <= 300) setWeight(v)
            }}
            className="bg-accent text-white font-semibold rounded-lg px-4 py-2 min-h-[44px] border-0 cursor-pointer active:bg-accent-hover touch-press"
          >
            Calcular
          </button>
        </div>
      </Card>
    )
  }

  const dose = Math.min(100, Math.max(25, Math.round(weight * 1)))
  return (
    <Card className="!p-4">
      <p className="text-sm font-bold text-text-primary mb-1">Dose de carvão ativado</p>
      <p className="text-xs text-text-muted mb-3">Peso atual: {weight} kg</p>
      <div className="bg-bg-elevated rounded-lg p-3 text-center">
        <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">Dose recomendada</div>
        <div className="text-2xl font-bold text-accent">{dose} g</div>
        <div className="text-xs text-text-secondary mt-1">1 g/kg (min 25 g, max 100 g) — via oral ou SNG</div>
      </div>
    </Card>
  )
}

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

function ModuleHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-accent">{title}</h2>
      {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
    </div>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full h-1.5 bg-bg-hover rounded-full mb-5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #FF5252, #FF7272)' }}
      />
    </div>
  )
}

function VitalBadge({ classe }: { classe: VitalClass }) {
  if (classe === 'up') return <span className="text-danger">&#8593;</span>
  if (classe === 'down') return <span className="text-info">&#8595;</span>
  return null
}

// ==========================================
// HOME VIEW
// ==========================================

function HomeView({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <>
      <Header title="Tox Path" subtitle="Manejo de intoxicações agudas" />

      {/* Banner CIATox */}
      <a
        href="tel:08007226001"
        className="flex items-center gap-3 rounded-xl p-4 mb-6 text-white no-underline"
        style={{ background: 'linear-gradient(135deg, #FF5252 0%, #FF7272 100%)' }}
      >
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold mb-0.5">Disque-Intóxicação</h3>
          <p className="text-xs opacity-90">Plantão 24h — Toque para ligar</p>
        </div>
        <div className="bg-[#1A1A1A] text-text-primary border border-accent px-3 py-2.5 rounded-lg font-bold text-sm flex items-center gap-1.5 whitespace-nowrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          0800 722 6001
        </div>
      </a>

      {/* Modulos */}
      <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Ferramentas</p>
      <div className="flex flex-col gap-4 mb-6">
        {homeModules.map(m => (
          <Card key={m.id} borderColor={m.borderColor} onClick={() => onNavigate(m.id as Screen)} className="flex items-center gap-4 min-h-[72px]">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${m.borderColor}20` }}>
              {m.id === 'toxindromes' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={m.borderColor} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9 9h.01M15 9h.01M8 14s1.5 2 4 2 4-2 4-2"/></svg>}
              {m.id === 'descontaminação' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={m.borderColor} strokeWidth="2" strokeLinecap="round"><path d="M12 2v6M12 18v4M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg>}
              {m.id === 'disposição' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={m.borderColor} strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
              {m.id === 'antídotos' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={m.borderColor} strokeWidth="2" strokeLinecap="round"><path d="M10 2v6.5c0 1-1.5 2.5-1.5 4.5 0 3 2 5 3.5 5s3.5-2 3.5-5c0-2-1.5-3.5-1.5-4.5V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg>}
              {m.id === 'checklist' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={m.borderColor} strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><rect x="3" y="4" width="16" height="16" rx="2"/></svg>}
              {m.id === 'tabelas' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={m.borderColor} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-text-primary mb-0.5">{m.title}</h3>
              <p className="text-[13px] text-text-secondary">{m.subtitle}</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-text-muted flex-shrink-0">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
            </svg>
          </Card>
        ))}
      </div>

      {/* Outros contatos */}
      <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Outros contatos</p>
      <a href="tel:08006464350" className="block no-underline">
        <Card className="flex items-center gap-3 !p-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF5252">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">0800 646 4350</h3>
            <p className="text-xs text-text-secondary">CIATox Goiás</p>
          </div>
        </Card>
      </a>
    </>
  )
}

// ==========================================
// TOXINDROMES VIEW
// ==========================================

function ToxindromesView({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  const [answers, setAnswers] = useState<{ questionId: number; value: string }[]>([])
  const [resultKey, setResultKey] = useState<string | null>(null)

  const currentQuestionId = answers.length === 0 ? 1 : null
  const progress = Math.min((answers.length / 5) * 100, resultKey ? 100 : 95)

  const question = useMemo(() => {
    if (resultKey) return null
    // Find current question: last answer's next, or first
    if (answers.length === 0) return toxQuestions.find(q => q.id === 1)!
    const lastAnswer = answers[answers.length - 1]
    const lastQ = toxQuestions.find(q => q.id === lastAnswer.questionId)
    const opt = lastQ?.options.find(o => o.value === lastAnswer.value)
    if (opt?.next) return toxQuestions.find(q => q.id === opt.next)!
    return null
  }, [answers, resultKey])

  function handleAnswer(opt: ToxOption) {
    const qId = question!.id
    const newAnswers = [...answers, { questionId: qId, value: opt.value }]
    setAnswers(newAnswers)
    if (opt.result) {
      setResultKey(opt.result)
    }
  }

  function goBackQuestion() {
    if (answers.length > 0) {
      setAnswers(prev => prev.slice(0, -1))
      setResultKey(null)
    }
  }

  function restart() {
    setAnswers([])
    setResultKey(null)
  }

  const result: Toxindrome | null = resultKey ? toxindromes[resultKey] : null

  return (
    <>
      <BackButton onClick={onBack} />
      <ModuleHeader title="Identificar toxindrome" subtitle="Responda as perguntas sobre os achados" />
      <ProgressBar percent={progress} />

      {/* Question */}
      {question && !resultKey && (
        <div className="animate-fade-in">
          {answers.length > 0 && (
            <button onClick={goBackQuestion} className="flex items-center gap-1.5 text-text-secondary text-sm mb-3 bg-bg-elevated px-3 py-2 rounded-lg border-none cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
              Pergunta anterior
            </button>
          )}
          <Card className="!p-5 !border-2 !border-border-card">
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Pergunta {answers.length + 1}</p>
            <h2 className="text-lg font-bold text-text-primary mb-2">{question.text}</h2>
            <p className="text-sm text-text-secondary mb-5">{question.hint}</p>
            <div className="flex flex-col gap-2.5">
              {question.options.map((opt, i) => {
                const btnColor = opt.text.toLowerCase().includes('sim') || opt.text.toLowerCase().includes('agitado') || opt.text.toLowerCase().includes('midri')
                  ? 'border-accent text-accent bg-accent/10 active:bg-accent active:text-white'
                  : opt.text.toLowerCase().includes('nao') || opt.text.toLowerCase().includes('rebaixado') || opt.text.toLowerCase().includes('miose') || opt.text.toLowerCase().includes('seca')
                    ? 'border-info text-info bg-info/10 active:bg-info active:text-white'
                    : 'border-warning text-warning bg-warning/10 active:bg-warning active:text-white'
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-semibold border-2 cursor-pointer text-center transition-all min-h-[48px] ${btnColor}`}
                  >
                    {opt.text}
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fade-in">
          <div className="rounded-2xl overflow-hidden shadow-lg mb-4">
            <div className="p-5 text-white text-center" style={{ background: `linear-gradient(135deg, ${result.gradientFrom}, ${result.gradientTo})` }}>
              <p className="text-[13px] font-semibold opacity-90 uppercase tracking-wider mb-1">Possível toxíndrome</p>
              <h3 className="text-2xl font-extrabold">{result.nome}</h3>
            </div>
            <div className="p-5 bg-bg-primary">
              {/* Sinais */}
              <div className="mb-5">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Sinais esperados</p>
                <div className="flex flex-wrap gap-2">
                  {result.sinais.map((s, i) => (
                    <span key={i} className="bg-bg-elevated px-3 py-1.5 rounded-md text-[13px] text-text-primary">{s}</span>
                  ))}
                </div>
              </div>

              {/* Vitais */}
              <div className="mb-5">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Padrão de sinais vitais</p>
                <div className="border border-border-card rounded-lg overflow-hidden">
                  {Object.entries(result.vitais).map(([key, v]) => {
                    const labels: Record<string, string> = { consciência: 'Consciência', fc: 'FC', pa: 'PA', fr: 'FR', temp: 'Temperatura', pupilas: 'Pupilas', pele: 'Pele' }
                    const colorCls = v.classe === 'up' ? 'text-danger' : v.classe === 'down' ? 'text-info' : 'text-success'
                    return (
                      <div key={key} className="flex justify-between items-center px-3 py-2 border-b border-border-card last:border-0">
                        <span className="text-sm text-text-secondary">{labels[key]}</span>
                        <span className={`text-sm font-semibold ${colorCls}`}>
                          <VitalBadge classe={v.classe} /> {v.valor}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Agentes */}
              <div className="mb-5">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Agentes possíveis</p>
                <p className="text-sm text-text-primary leading-relaxed">{result.agentes}</p>
              </div>

              {/* Antidoto */}
              <div className="mb-5">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Recomendações terapêuticas</p>
                <p className="text-sm text-text-primary font-bold">{result.antídoto}</p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5 mt-5">
                <button onClick={() => onNavigate('antídotos')} className="w-full py-3.5 bg-accent text-white rounded-xl font-semibold text-[15px] border-none cursor-pointer min-h-[48px]">
                  Ver antídotos e doses
                </button>
                <button onClick={() => onNavigate('disposição')} className="w-full py-3.5 bg-transparent text-accent border-2 border-accent rounded-xl font-semibold text-[15px] cursor-pointer min-h-[48px]">
                  Critérios de disposição
                </button>
                <a href="tel:08007226001" className="w-full py-3.5 text-white rounded-xl font-semibold text-[15px] text-center no-underline flex items-center justify-center gap-2 min-h-[48px]" style={{ background: 'linear-gradient(135deg, #FF5252, #FF7272)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  Disque-Intóxicação
                </a>
              </div>
            </div>
          </div>
          <button onClick={restart} className="w-full text-text-secondary text-sm underline bg-transparent border-none cursor-pointer py-3">
            Recomeçar avaliação
          </button>
        </div>
      )}
    </>
  )
}

// ==========================================
// DESCONTAMINACAO VIEW
// ==========================================

function DescontaminaçãoView({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0)
  const [deconAnswers, setDeconAnswers] = useState<Record<number, string>>({})
  const [resultType, setResultType] = useState<string | null>(null)
  const [resultMotivo, setResultMotivo] = useState('')
  const [resultConsideracoes, setResultConsideracoes] = useState('')

  const progress = resultType ? 100 : (step / 5) * 100

  function answer(stepNum: number, ans: string) {
    const newAnswers = { ...deconAnswers, [stepNum]: ans }
    setDeconAnswers(newAnswers)

    switch (stepNum) {
      case 1:
        if (ans === 'caustico') showResult('caustico')
        else if (ans === 'incerto') showResult('incerto')
        else setStep(2)
        break
      case 2:
        if (ans === 'mais_2h') showResult('naoIndicado', 'Tempo superior a 2 horas desde a ingestão', 'Após 2 horas, a maior parte da absorção já ocorreu. O benefício da descontaminação é improvável.')
        else { setStep(3); if (ans === 'desconhecido') newAnswers['tempo_incerto' as unknown as number] = 'true' }
        break
      case 3:
        if (ans === 'nao_adsorvida') showResult('naoIndicado', 'Substância não é efetivamente adsorvida pelo carvão', 'Álcoois, metais (ferro, lítio) e solventes não são bem adsorvidos.')
        else if (ans === 'incerto_subst') showResult('incerto')
        else setStep(4)
        break
      case 4:
        if (ans === 'rebaixado') showResult('protegerVA')
        else setStep(5)
        break
      case 5:
        if (ans === 'com_ci') showResult('naoIndicado', 'Presença de contraindicação relativa', 'Avalie o risco-benefício individual.')
        else showResult('indicado')
        break
    }
  }

  function showResult(type: string, motivo = '', consideracoes = '') {
    setResultType(type)
    setResultMotivo(motivo)
    setResultConsideracoes(consideracoes)
  }

  function restart() {
    setStep(0)
    setDeconAnswers({})
    setResultType(null)
    setResultMotivo('')
    setResultConsideracoes('')
  }

  const stepContent: Record<number, { question: string; hint: string; options: { text: string; value: string }[] }> = {
    1: {
      question: 'A substância ingerida é cáustica, hidrocarboneto ou tem risco de aspiração?',
      hint: 'Álcalis fortes, ácidos, produtos de limpeza, derivados de petróleo',
      options: [
        { text: 'Sim, substância cáustica', value: 'caustico' },
        { text: 'Nao', value: 'nao' },
        { text: 'Não sei / Incerto', value: 'incerto' },
      ],
    },
    2: {
      question: 'Quanto tempo desde a ingestão?',
      hint: 'O tempo é fator crítico na decisão de descontaminação',
      options: [
        { text: 'Menos de 1 hora', value: 'menos_1h' },
        { text: '1-2 horas', value: '1_2h' },
        { text: 'Mais de 2 horas', value: 'mais_2h' },
        { text: 'Desconhecido', value: 'desconhecido' },
      ],
    },
    3: {
      question: 'A substância é adsorvida pelo carvão ativado?',
      hint: 'Carvão não adsorve: metais (ferro, lítio), álcoois, solventes',
      options: [
        { text: 'Sim, é adsorvida', value: 'adsorvida' },
        { text: 'Não é adsorvida', value: 'nao_adsorvida' },
        { text: 'Não sei', value: 'incerto_subst' },
      ],
    },
    4: {
      question: 'O paciente está consciente e com via aérea protegida?',
      hint: 'Avaliar Glasgow, reflexo de deglutição, risco de aspiração',
      options: [
        { text: 'Consciente e via aérea ok', value: 'consciente' },
        { text: 'Rebaixado / VA não protegida', value: 'rebaixado' },
      ],
    },
    5: {
      question: 'Há outras contraindicações?',
      hint: 'Cirurgia abdominal recente, perfuração intestinal, obstrução',
      options: [
        { text: 'Sem contraindicações', value: 'sem_ci' },
        { text: 'Com contraindicação', value: 'com_ci' },
      ],
    },
  }

  return (
    <>
      <BackButton onClick={onBack} />
      <ModuleHeader title="Descontaminação GI" subtitle="Avaliação guiada passo a passo" />
      <ProgressBar percent={progress} />

      {/* Intro */}
      {step === 0 && !resultType && (
        <Card className="!p-5 !border-2 !border-border-card animate-fade-in">
          <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Avaliação de descontaminação GI</p>
          <h2 className="text-lg font-bold text-text-primary mb-2">Quando considerar descontaminação gastrointestinal?</h2>
          <p className="text-sm text-text-secondary mb-4">Este fluxo auxilia na decisão sobre carvão ativado ou lavagem gástrica em intoxicações agudas.</p>
          <AlertCard type="info" title="Princípio geral">A descontaminação GI apresenta benefício limitado na maioria dos casos. A decisão deve considerar tempo, substância e estado clínico do paciente.</AlertCard>
          <AlertCard type="warning">Este fluxo é um auxílio à decisão. A conduta final deve ser individualizada e, em caso de dúvida, recomenda-se contato com o Disque-Intóxicação (0800 722 6001).</AlertCard>
          <button onClick={() => setStep(1)} className="w-full mt-4 py-3.5 bg-accent text-white rounded-xl font-semibold text-[15px] border-none cursor-pointer min-h-[48px]">
            Iniciar avaliação
          </button>
        </Card>
      )}

      {/* Steps */}
      {step > 0 && step <= 5 && !resultType && (
        <Card className="!p-5 !border-2 !border-border-card animate-fade-in">
          <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Passo {step} de 5</p>
          <h2 className="text-lg font-bold text-text-primary mb-2">{stepContent[step].question}</h2>
          <p className="text-sm text-text-secondary mb-5">{stepContent[step].hint}</p>
          <div className="flex flex-col gap-2.5">
            {stepContent[step].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answer(step, opt.value)}
                className="w-full py-3.5 px-4 rounded-xl text-[15px] font-semibold border-2 border-border-card text-text-primary bg-bg-primary cursor-pointer text-left transition-all min-h-[48px] active:border-accent active:bg-accent/5"
              >
                {opt.text}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Results */}
      {resultType && (
        <div className="animate-fade-in">
          {resultType === 'caustico' && (
            <AlertCard type="danger" title="CONTRAINDICAÇÃO ABSOLUTA">
              Substâncias cáusticas e hidrocarbonetos apresentam risco de perfuração e aspiração. Descontaminação GI está contraindicada.
            </AlertCard>
          )}
          {resultType === 'incerto' && (
            <AlertCard type="warning" title="Recomenda-se contatar o CIATox">
              Na dúvida sobre a substância ingerida, entre em contato com o Disque-Intóxicação para orientação específica.
            </AlertCard>
          )}
          {resultType === 'naoIndicado' && (
            <AlertCard type="warning" title={resultMotivo}>
              {resultConsideracoes}
            </AlertCard>
          )}
          {resultType === 'protegerVA' && (
            <AlertCard type="danger" title="Via aérea não protegida">
              Considere intubação orotraqueal antes da descontaminação. Carvão ativado em paciente rebaixado sem IOT apresenta risco de aspiração.
            </AlertCard>
          )}
          {resultType === 'indicado' && (
            <div>
              <div className="rounded-xl p-4 mb-4" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                <p className="text-white font-bold text-base">Carvão ativado pode ser considerado</p>
                <p className="text-white/90 text-sm mt-1">
                  {deconAnswers[2] === '1_2h' || deconAnswers['tempo_incerto' as unknown as number]
                    ? 'Benefício possível, porém reduzido — avalie individualmente'
                    : 'Todos os critérios de elegibilidade foram atendidos'}
                </p>
              </div>
              <CarvaoAtivadoCalc />
              <Card className="!p-4 mt-3">
                <p className="text-xs text-text-muted">Diluir em água ou SNG. Dose única na maioria dos casos.</p>
              </Card>
            </div>
          )}

          <div className="flex flex-col gap-2.5 mt-4">
            <a href="tel:08007226001" className="w-full py-3.5 text-white rounded-xl font-semibold text-[15px] text-center no-underline flex items-center justify-center gap-2 min-h-[48px]" style={{ background: 'linear-gradient(135deg, #FF5252, #FF7272)' }}>
              Disque-Intóxicação: 0800 722 6001
            </a>
            <button onClick={restart} className="w-full text-text-secondary text-sm underline bg-transparent border-none cursor-pointer py-3">
              Recomeçar avaliação
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ==========================================
// DISPOSICAO VIEW
// ==========================================

function DisposiçãoView({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  const [utiChecked, setUtiChecked] = useState<boolean[]>(new Array(utiCriteria.length).fill(false))
  const [enfChecked, setEnfChecked] = useState<boolean[]>(new Array(enfermariaCriteria.length).fill(false))

  const utiCount = utiChecked.filter(Boolean).length
  const enfCount = enfChecked.filter(Boolean).length
  const totalCount = utiCount + enfCount

  const disposition = utiCount > 0 ? 'UTI' : enfCount > 0 ? 'ENFERMARIA' : 'OBSERVAÇÃO / POSSÍVEL ALTA'
  const dispositionColor = utiCount > 0 ? '#EF4444' : enfCount > 0 ? '#F59E0B' : '#10B981'

  function resetCriteria() {
    setUtiChecked(new Array(utiCriteria.length).fill(false))
    setEnfChecked(new Array(enfermariaCriteria.length).fill(false))
  }

  function CriterionItem({ item, checked, onToggle }: { item: DispositionCriterion; checked: boolean; onToggle: () => void }) {
    return (
      <Collapsible title={item.text}>
        <div className="flex items-start gap-3 -mt-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle() }}
            className={`w-6 h-6 min-w-[24px] mt-0.5 rounded-md flex items-center justify-center transition-colors border-2 cursor-pointer ${checked ? 'bg-accent border-accent' : 'bg-transparent border-border-card'}`}
          >
            {checked && <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>}
          </button>
          <div>
            <p className="text-sm text-text-secondary">{item.detail}</p>
            <p className="text-xs text-text-muted mt-1">Ex: {item.example}</p>
          </div>
        </div>
      </Collapsible>
    )
  }

  return (
    <>
      <BackButton onClick={onBack} />
      <ModuleHeader title="Critérios de disposição" subtitle="Marque os critérios presentes" />

      <AlertCard type="info">
        Marque todos os critérios que o paciente apresenta. A recomendação de destino será atualizada automaticamente.
      </AlertCard>

      {/* UTI */}
      <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 mt-5">Critérios para UTI</p>
      <p className="text-[13px] text-text-secondary mb-3">Qualquer um destes indica necessidade de terapia intensiva</p>
      <div className="space-y-2">
        {utiCriteria.map((c, i) => (
          <CriterionItem key={i} item={c} checked={utiChecked[i]} onToggle={() => setUtiChecked(prev => { const n = [...prev]; n[i] = !n[i]; return n })} />
        ))}
      </div>

      {/* Enfermaria */}
      <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 mt-5">Critérios para enfermaria</p>
      <p className="text-[13px] text-text-secondary mb-3">Toxicidade moderada ou necessidade de monitorização</p>
      <div className="space-y-2">
        {enfermariaCriteria.map((c, i) => (
          <CriterionItem key={i} item={c} checked={enfChecked[i]} onToggle={() => setEnfChecked(prev => { const n = [...prev]; n[i] = !n[i]; return n })} />
        ))}
      </div>

      {/* Obs boxes */}
      <AlertCard type="warning" title="Observação no DE (4-6 horas)" className="mt-4">
        Se nenhum critério acima estiver presente, considere observação na emergência por 4-6 horas antes da alta, especialmente se: ingestão recente, formulações de liberação prolongada, ingestão intencional, história não confiável.
      </AlertCard>

      <AlertCard type="success" title="Critérios que podem favorecer alta" className="mt-2">
        Assintomático após observação, sinais vitais estáveis, ECG sem alterações, exames normais, avaliação psiquiátrica realizada (se ingestão intencional).
      </AlertCard>

      {/* Alerta bombas-relógio */}
      <div className="bg-danger/10 border-2 border-danger rounded-xl p-4 mt-4 text-center">
        <p className="text-sm font-bold text-danger mb-2">LEMBRETE IMPORTANTE</p>
        <p className="text-[13px] text-text-primary mb-3">Considere verificar se não há ingestão de substância com toxicidade tardia</p>
        <button onClick={() => onNavigate('tabelas')} className="bg-danger text-white px-5 py-2.5 rounded-lg font-semibold text-sm border-none cursor-pointer">
          Ver Bombas-relógio tóxicas
        </button>
      </div>

      <button onClick={resetCriteria} className="w-full text-text-secondary text-sm underline bg-transparent border-none cursor-pointer py-3 mt-2">
        Limpar todas as marcações
      </button>

      {/* Result bar */}
      <div className="fixed bottom-[52px] left-0 right-0 bg-bg-elevated border-t border-border p-3 z-40 text-center">
        <div className="text-sm font-bold" style={{ color: dispositionColor }}>CONSIDERE {disposition}</div>
        <p className="text-xs text-text-muted">{totalCount} critério{totalCount !== 1 ? 's' : ''} marcado{totalCount !== 1 ? 's' : ''}</p>
      </div>
    </>
  )
}

// ==========================================
// ANTIDOTOS VIEW
// ==========================================

function AntidotosView({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState('')
  const [nacPeso, setNacPeso] = useState('')
  const [nacTempo, setNacTempo] = useState('')
  const [nacNivel, setNacNivel] = useState('')
  const [atropinaAtaque, setAtropinaAtaque] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return antidotes
    const q = search.toLowerCase()
    return antidotes.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.indication.toLowerCase().includes(q) ||
      a.searchTerms.toLowerCase().includes(q)
    )
  }, [search])

  const disponíveis = filtered.filter(a => a.available)
  const indisponíveis = filtered.filter(a => !a.available)

  // Nomograma Rumack-Matthew
  const nomogramaResult = useMemo(() => {
    const t = parseFloat(nacTempo)
    const n = parseFloat(nacNivel)
    if (!t || !n || t < 4 || t > 24) return null
    const linha = 150 * Math.exp(-0.173 * (t - 4))
    return { acima: n >= linha, nível: n, linha: linha.toFixed(1), tempo: t }
  }, [nacTempo, nacNivel])

  // NAC calculator
  const nacResult = useMemo(() => {
    const p = parseFloat(nacPeso)
    if (!p || p < 20 || p > 250) return null
    return {
      etapa1: `${(150 * p / 1000).toFixed(1)} g (${150 * p} mg) em 200 mL SF`,
      etapa2: `${(50 * p / 1000).toFixed(1)} g (${50 * p} mg) em 500 mL SF`,
      etapa3: `${(100 * p / 1000).toFixed(1)} g (${100 * p} mg) em 1000 mL SF`,
      total: `Dose total: ${(300 * p / 1000).toFixed(1)} g em 21 horas`,
    }
  }, [nacPeso])

  // Atropina calculator
  const atropinaResult = useMemo(() => {
    const d = parseFloat(atropinaAtaque)
    if (!d || d <= 0) return null
    const infHora = d * 0.20
    const ampolas = Math.ceil(infHora / 0.25)
    return {
      dose: `${infHora.toFixed(2)} mg/hora`,
      ampolas: `Aprox. ${ampolas} ampolas/hora (0,25 mg/amp)`,
    }
  }, [atropinaAtaque])

  return (
    <>
      <BackButton onClick={onBack} />
      <ModuleHeader title="Guia de antídotos" />

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar antídoto ou indicação..."
          className="w-full bg-bg-elevated border border-border-card rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-text-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Disponível</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger" /> Não disponível</span>
      </div>

      {/* Disponíveis */}
      {disponíveis.length > 0 && (
        <>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Disponíveis</p>
          <div className="space-y-2 mb-4">
            {disponíveis.map(a => (
              <Collapsible key={a.id} title={a.name} badge={a.indication} badgeColor="#10B981">
                {a.sections.map((s, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-xs font-bold text-text-secondary uppercase mb-1">{s.title}</p>
                    {s.lines.map((l, j) => <p key={j} className="text-sm text-text-primary">{l}</p>)}
                  </div>
                ))}
                {a.warnings?.map((w, i) => <AlertCard key={i} type="danger">{w}</AlertCard>)}
                {a.infos?.map((info, i) => <AlertCard key={i} type="info">{info}</AlertCard>)}

                {/* Calculators */}
                {a.hasCalculator === 'nomograma' || a.id === 'nac' ? (
                  <div className="bg-bg-elevated rounded-xl p-4 mt-3 space-y-3">
                    <p className="text-xs font-bold text-accent uppercase">Nomograma de Rumack-Matthew</p>
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">Tempo desde a ingestão (horas):</label>
                      <input type="number" inputMode="decimal" min={4} max={24} value={nacTempo} onChange={e => setNacTempo(e.target.value)} placeholder="4 a 24 horas"
                        className="w-full bg-bg-primary border border-border-card rounded-lg px-3 py-2.5 text-sm text-text-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">Nível sérico de paracetamol (ug/mL):</label>
                      <input type="number" inputMode="decimal" value={nacNivel} onChange={e => setNacNivel(e.target.value)} placeholder="Ex: 150"
                        className="w-full bg-bg-primary border border-border-card rounded-lg px-3 py-2.5 text-sm text-text-primary" />
                    </div>
                    {nomogramaResult && (
                      <AlertCard type={nomogramaResult.acima ? 'danger' : 'success'} title={nomogramaResult.acima ? 'ACIMA DA LINHA DE TRATAMENTO' : 'ABAIXO DA LINHA DE TRATAMENTO'}>
                        Nível atual: {nomogramaResult.nível} ug/mL | Linha em {nomogramaResult.tempo}h: {nomogramaResult.linha} ug/mL.
                        {nomogramaResult.acima ? ' INICIAR NAC IMEDIATAMENTE.' : ' NAC não indicado pelo nomograma.'}
                      </AlertCard>
                    )}
                    <p className="text-xs text-text-muted">* Válido apenas para ingestões agudas únicas.</p>

                    <p className="text-xs font-bold text-accent uppercase mt-4">Calculadora de doses NAC</p>
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">Peso do paciente (kg):</label>
                      <input type="number" inputMode="decimal" min={20} max={250} value={nacPeso} onChange={e => setNacPeso(e.target.value)} placeholder="Ex: 70"
                        className="w-full bg-bg-primary border border-border-card rounded-lg px-3 py-2.5 text-sm text-text-primary" />
                    </div>
                    {nacResult && (
                      <div className="bg-bg-primary rounded-lg p-3 space-y-2">
                        <div className="border-l-4 border-accent pl-3">
                          <p className="text-xs font-semibold text-text-secondary">1a ETAPA (1 hora)</p>
                          <p className="text-base font-bold text-accent">{nacResult.etapa1}</p>
                        </div>
                        <div className="border-l-4 border-warning pl-3">
                          <p className="text-xs font-semibold text-text-secondary">2a ETAPA (4 horas)</p>
                          <p className="text-base font-bold text-warning">{nacResult.etapa2}</p>
                        </div>
                        <div className="border-l-4 border-accent pl-3">
                          <p className="text-xs font-semibold text-text-secondary">3a ETAPA (16 horas)</p>
                          <p className="text-base font-bold text-accent">{nacResult.etapa3}</p>
                        </div>
                        <p className="text-sm text-text-secondary pt-2 border-t border-border-card">{nacResult.total}</p>
                      </div>
                    )}
                  </div>
                ) : null}

                {a.hasCalculator === 'atropina' && (
                  <div className="bg-bg-elevated rounded-xl p-4 mt-3 space-y-3">
                    <p className="text-xs font-bold text-accent uppercase">Calculadora de infusão contínua</p>
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">Dose de ataque efetiva (mg):</label>
                      <input type="number" inputMode="decimal" value={atropinaAtaque} onChange={e => setAtropinaAtaque(e.target.value)} placeholder="Ex: 8"
                        className="w-full bg-bg-primary border border-border-card rounded-lg px-3 py-2.5 text-sm text-text-primary" />
                    </div>
                    {atropinaResult && (
                      <div className="bg-bg-primary rounded-lg p-3 border-l-4 border-accent">
                        <p className="text-sm font-semibold text-accent mb-1">Infusão contínua (20%/hora):</p>
                        <p className="text-xl font-bold text-text-primary">{atropinaResult.dose}</p>
                        <p className="text-[13px] text-text-secondary mt-1">{atropinaResult.ampolas}</p>
                      </div>
                    )}
                  </div>
                )}
              </Collapsible>
            ))}
          </div>
        </>
      )}

      {/* Indisponíveis */}
      {indisponíveis.length > 0 && (
        <>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Não disponíveis</p>
          <div className="space-y-2 mb-4">
            {indisponíveis.map(a => (
              <Collapsible key={a.id} title={a.name} badge="Indisponível" badgeColor="#EF4444">
                {a.sections.map((s, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-xs font-bold text-text-secondary uppercase mb-1">{s.title}</p>
                    {s.lines.map((l, j) => <p key={j} className="text-sm text-text-primary">{l}</p>)}
                  </div>
                ))}
              </Collapsible>
            ))}
          </div>
        </>
      )}

      {/* CIATox */}
      <div className="rounded-xl p-4 text-center mt-4" style={{ background: 'linear-gradient(135deg, #FF5252, #FF7272)' }}>
        <p className="text-white font-bold text-sm mb-1">Dúvidas sobre doses ou indicações?</p>
        <p className="text-white/90 text-xs mb-3">Plantão 24 horas para profissionais de saúde</p>
        <a href="tel:08007226001" className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg font-semibold text-sm no-underline">
          Disque-Intóxicação: 0800 722 6001
        </a>
      </div>
    </>
  )
}

// ==========================================
// CHECKLIST VIEW
// ==========================================

function ChecklistView({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  const [checked, setChecked] = useState<Record<string, boolean[]>>(() => {
    const init: Record<string, boolean[]> = {}
    checklistSections.forEach(s => { init[s.id] = new Array(s.items.length).fill(false) })
    return init
  })

  const totalItems = checklistSections.reduce((acc, s) => acc + s.items.length, 0)
  const checkedCount = Object.values(checked).flat().filter(Boolean).length

  function toggleItem(sectionId: string, idx: number) {
    setChecked(prev => {
      const arr = [...prev[sectionId]]
      arr[idx] = !arr[idx]
      return { ...prev, [sectionId]: arr }
    })
  }

  function resetCriteria() {
    const init: Record<string, boolean[]> = {}
    checklistSections.forEach(s => { init[s.id] = new Array(s.items.length).fill(false) })
    setChecked(init)
  }

  return (
    <>
      <BackButton onClick={onBack} />
      <ModuleHeader title="Checklist de avaliação" subtitle="Exame físico direcionado para intoxicações" />

      {/* Progress circle */}
      <div className="flex items-center justify-between bg-bg-card border border-border-card rounded-xl p-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Itens avaliados</h3>
          <p className="text-lg font-bold text-text-secondary">{checkedCount} / {totalItems}</p>
        </div>
        <div className="relative w-[60px] h-[60px]">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="25" fill="none" stroke="#1A1A1A" strokeWidth="5" />
            <circle
              cx="30" cy="30" r="25" fill="none" stroke="#FF5252" strokeWidth="5"
              strokeDasharray="157" strokeDashoffset={157 - (checkedCount / totalItems) * 157}
              strokeLinecap="round"
              transform="rotate(-90 30 30)"
              className="transition-all duration-300"
            />
          </svg>
        </div>
      </div>

      {/* Sections — all start CLOSED (defaultOpen=false) */}
      {checklistSections.map(section => {
        const sectionChecked = checked[section.id].filter(Boolean).length
        return (
          <Collapsible
            key={section.id}
            title={`${section.letter}. ${section.title}`}
            badge={`${sectionChecked}/${section.items.length}`}
            badgeColor={section.color}
          >
            <div className="space-y-1">
              {section.items.map((item, i) => {
                const isChecked = checked[section.id][i]
                return (
                  <button
                    key={i}
                    onClick={() => toggleItem(section.id, i)}
                    className="flex items-start gap-3 w-full py-2.5 border-b border-border text-left bg-transparent border-x-0 border-t-0 cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 min-w-[20px] mt-0.5 rounded-md flex items-center justify-center transition-colors border-2 ${isChecked ? 'bg-accent border-accent' : 'border-border-card'}`}
                    >
                      {isChecked && <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>}
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${isChecked ? 'text-text-muted line-through' : 'text-text-primary'}`}>{item.label}</span>
                      <span className="block text-xs text-text-muted">{item.hint}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </Collapsible>
        )
      })}

      {/* Actions */}
      <div className="flex flex-col gap-2.5 mt-4 mb-4">
        <button onClick={() => onNavigate('toxindromes')} className="w-full py-3.5 bg-accent text-white rounded-xl font-semibold text-[15px] border-none cursor-pointer min-h-[48px]">
          Identificar toxindrome
        </button>
        <button onClick={resetCriteria} className="w-full py-3.5 bg-transparent text-accent border-2 border-accent rounded-xl font-semibold text-[15px] cursor-pointer min-h-[48px]">
          Limpar
        </button>
      </div>
    </>
  )
}

// ==========================================
// TABELAS VIEW
// ==========================================

function TabelasView({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('toxindromes')
  const [drugSearch, setDrugSearch] = useState('')
  const [selectedDrug, setSelectedDrug] = useState<ToxicDrug | null>(null)
  const [patientWeight, setPatientWeight] = useState('')
  const [amountIngested, setAmountIngested] = useState('')

  const drugResults = useMemo(() => {
    if (drugSearch.length < 2) return []
    const q = drugSearch.toLowerCase()
    return toxicDrugs.filter(d =>
      d.nome.toLowerCase().includes(q) || d.alias?.some(a => a.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [drugSearch])

  const doseCalc = useMemo(() => {
    if (!selectedDrug) return null
    const w = parseFloat(patientWeight)
    const a = parseFloat(amountIngested)
    if (!w || !a || w <= 0 || a < 0) return null
    const doseIngested = a / w
    const ratio = doseIngested / selectedDrug.dose
    return { doseIngested, ratio, unit: selectedDrug.unidade }
  }, [selectedDrug, patientWeight, amountIngested])

  function DataTable({ headers, rows }: { headers: [string, string]; rows: TableRow[] }) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-hover">
              <th className="px-3 py-2.5 text-left font-semibold text-text-secondary text-xs">{headers[0]}</th>
              <th className="px-3 py-2.5 text-left font-semibold text-text-secondary text-xs">{headers[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const colorCls = r.highlight === 'danger' ? 'text-danger' : r.highlight === 'warning' ? 'text-warning' : r.highlight === 'success' ? 'text-success' : r.highlight === 'accent' ? 'text-accent' : ''
              return (
                <tr key={i} className="border-t border-border-card">
                  <td className={`px-3 py-2.5 text-xs font-medium ${colorCls || 'text-text-primary'}`}>{r.col1}</td>
                  <td className="px-3 py-2.5 text-xs text-text-secondary">{r.col2}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  function ComparisonCards({ cards }: { cards: ComparisonCard[] }) {
    return (
      <div className="space-y-2">
        {cards.map((c, i) => (
          <Collapsible key={i} title={c.title}>
            <div className="space-y-1">
              {c.rows.map((r, j) => (
                <div key={j} className="flex justify-between items-start py-1.5 border-b border-border-card last:border-0 gap-2">
                  <span className="text-xs text-text-secondary flex-shrink-0 w-24">{r.label}</span>
                  <span className="text-xs text-text-primary text-right">{r.value}</span>
                </div>
              ))}
            </div>
          </Collapsible>
        ))}
      </div>
    )
  }

  return (
    <>
      <BackButton onClick={onBack} />
      <ModuleHeader title="Tabelas de consulta" subtitle="Referência rápida para intoxicações" />

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-4 pb-1">
        {tabelaTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap border cursor-pointer transition-colors ${
              activeTab === t.id ? 'bg-accent border-accent text-white' : 'bg-bg-primary border-border-card text-text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Toxindromes */}
      {activeTab === 'toxindromes' && (
        <>
          <ComparisonCards cards={tabelaComparacoes} />
          <AlertCard type="info" className="mt-3">
            <strong>Dica:</strong> Simpaticomiméticos vs. anticolinérgicos — checar pele! Úmida = simpaticomiméticos, Seca = anticolinérgicos
          </AlertCard>
        </>
      )}

      {/* Doses Toxicas */}
      {activeTab === 'doses' && (
        <>
          <div className="relative mb-4">
            <input
              type="text"
              value={drugSearch}
              onChange={e => { setDrugSearch(e.target.value); setSelectedDrug(null) }}
              placeholder="Buscar medicamento..."
              className="w-full bg-bg-elevated border border-border-card rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
            {drugResults.length > 0 && !selectedDrug && (
              <div className="absolute top-full left-0 right-0 bg-bg-elevated border border-border-card rounded-lg mt-1 shadow-xl z-10 max-h-[300px] overflow-y-auto">
                {drugResults.map((d, i) => (
                  <button key={i} onClick={() => { setSelectedDrug(d); setDrugSearch(d.nome) }}
                    className="flex justify-between items-center w-full px-4 py-3 text-left bg-transparent border-none border-b border-border-card cursor-pointer active:bg-bg-hover">
                    <span className="text-sm text-text-primary">{d.nome}</span>
                    <span className="text-xs text-text-muted">{d.dose} {d.unidade}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedDrug && (
            <Card className="mb-4">
              <div className="rounded-lg p-3 -mx-1 -mt-1 mb-3" style={{ background: 'linear-gradient(135deg, #FF5252, #FF7272)' }}>
                <h3 className="text-base font-bold text-white">{selectedDrug.nome}</h3>
                {selectedDrug.retardada && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full mt-1 inline-block">Lib. retardada</span>}
              </div>
              <div className="flex justify-between py-2 border-b border-border-card">
                <span className="text-sm text-text-secondary">Dose tóxica</span>
                <span className="text-sm font-bold text-accent">{selectedDrug.dose} {selectedDrug.unidade}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-text-secondary">Meia-vida</span>
                <span className="text-sm font-bold text-accent">{selectedDrug.meiaVida}</span>
              </div>

              {/* Calculator */}
              <div className="mt-3 pt-3 border-t border-border-card">
                <h4 className="text-sm font-semibold text-text-primary mb-3">Calcular dose ingerida</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Peso (kg)</label>
                    <input type="number" inputMode="decimal" value={patientWeight} onChange={e => setPatientWeight(e.target.value)} placeholder="70"
                      className="w-full bg-bg-elevated border border-border-card rounded-lg px-3 py-2.5 text-sm text-text-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Quantidade ({selectedDrug.unidade.split('/')[0]})</label>
                    <input type="number" inputMode="decimal" value={amountIngested} onChange={e => setAmountIngested(e.target.value)} placeholder="0"
                      className="w-full bg-bg-elevated border border-border-card rounded-lg px-3 py-2.5 text-sm text-text-primary" />
                  </div>
                </div>
                {doseCalc && (
                  <div className="mt-3 rounded-lg p-3 bg-bg-elevated">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-text-secondary">Dose ingerida</span>
                      <span className="text-sm font-bold text-text-primary">{doseCalc.doseIngested.toFixed(2)} {doseCalc.unit}</span>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${doseCalc.ratio < 0.5 ? 'bg-success/10' : doseCalc.ratio < 1 ? 'bg-warning/10' : 'bg-danger/10'}`}>
                      <p className={`text-sm font-bold ${doseCalc.ratio < 0.5 ? 'text-success' : doseCalc.ratio < 1 ? 'text-warning' : 'text-danger'}`}>
                        {doseCalc.ratio < 0.5 ? 'ABAIXO DA DOSE TÓXICA' : doseCalc.ratio < 1 ? 'PRÓXIMO DA DOSE TÓXICA' : `ACIMA DA DOSE TÓXICA (${doseCalc.ratio.toFixed(1)}x)`}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">{(doseCalc.ratio * 100).toFixed(0)}% da dose tóxica</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {!selectedDrug && !drugSearch && (
            <div className="text-center py-8 text-text-muted">
              <p className="text-sm">Digite o nome do medicamento para consultar a dose tóxica</p>
              <p className="text-xs mt-1">Base com <strong>200+</strong> medicamentos</p>
            </div>
          )}
          <p className="text-xs text-text-muted text-center mt-2">Fonte: ToxBase</p>
        </>
      )}

      {/* ECG */}
      {activeTab === 'ecg' && (
        <>
          <p className="text-xs font-bold text-text-secondary mb-2">Alterações de ECG por agente</p>
          <DataTable headers={['Achado ECG', 'Agentes']} rows={ecgTable} />
          <AlertCard type="danger" className="mt-3">
            <strong>Atenção:</strong> QRS {'>'} 100 ms + história de ingestão = considerar bicarbonato de sódio empírico!
          </AlertCard>
          <p className="text-xs font-bold text-text-secondary mb-2 mt-4">Tratamento por alteração de ECG</p>
          <DataTable headers={['Alteração', 'Tratamento']} rows={ecgTreatmentTable} />
        </>
      )}

      {/* Odores */}
      {activeTab === 'odores' && (
        <>
          <DataTable headers={['Odor', 'Agentes']} rows={odoresTable} />
          <AlertCard type="danger" className="mt-3">
            <strong>Alerta:</strong> Odor de alho + síndrome colinérgica = ORGANOFOSFORADO até prova em contrário!
          </AlertCard>
        </>
      )}

      {/* Pupilas */}
      {activeTab === 'pupilas' && (
        <>
          <p className="text-xs font-bold text-text-secondary mb-2">Midríase (pupilas dilatadas)</p>
          <DataTable headers={['Categoria', 'Agentes']} rows={midríaseTable} />
          <p className="text-xs font-bold text-text-secondary mb-2 mt-4">Miose (pupilas contraídas)</p>
          <DataTable headers={['Categoria', 'Agentes']} rows={mioseTable} />
          <AlertCard type="info" className="mt-3">
            <strong>Macete:</strong> Miose + depressão respiratória = OPIOIDE (dar naloxona!)
          </AlertCard>
        </>
      )}

      {/* Bombas-relógio */}
      {activeTab === 'bombas' && (
        <>
          <p className="text-xs font-bold text-text-secondary mb-2">"Bombas-relógio" tóxicas</p>
          <DataTable headers={['Agente', 'Toxicidade tardia']} rows={bombasTable} />
          <AlertCard type="danger" className="mt-3">
            <strong>Regra:</strong> Paciente assintomático com ingestão de "bomba-relógio" = INTERNAR e monitorar!
          </AlertCard>
          <p className="text-xs font-bold text-text-secondary mb-2 mt-4">Exames obrigatórios em ingestão intencional</p>
          <DataTable headers={['Exame', 'Justificativa']} rows={examesIngestaoTable} />
        </>
      )}
    </>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function ToxPath() {
  const [screen, setScreen] = useState<Screen>('home')
  const _toxToast = useToast(); void _toxToast

  const navigate = useCallback((s: Screen) => {
    setScreen(s)
    window.scrollTo(0, 0)
  }, [])

  const fabItems = [
    { label: 'Início', onClick: () => navigate('home') },
    { label: 'Toxindromes', onClick: () => navigate('toxindromes') },
    { label: 'Descontaminação', onClick: () => navigate('descontaminação') },
    { label: 'Disposição', onClick: () => navigate('disposição') },
    { label: 'Antidotos', onClick: () => navigate('antídotos') },
    { label: 'Checklist', onClick: () => navigate('checklist') },
    { label: 'Tabelas', onClick: () => navigate('tabelas') },
  ]

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Container className={screen === 'disposição' ? 'pb-36' : ''}>
        {screen === 'home' && <HomeView onNavigate={navigate} />}
        {screen === 'toxindromes' && <ToxindromesView onBack={() => navigate('home')} onNavigate={navigate} />}
        {screen === 'descontaminação' && <DescontaminaçãoView onBack={() => navigate('home')} />}
        {screen === 'disposição' && <DisposiçãoView onBack={() => navigate('home')} onNavigate={navigate} />}
        {screen === 'antídotos' && <AntidotosView onBack={() => navigate('home')} />}
        {screen === 'checklist' && <ChecklistView onBack={() => navigate('home')} onNavigate={navigate} />}
        {screen === 'tabelas' && <TabelasView onBack={() => navigate('home')} />}
      </Container>
      <Footer toolName="Tox Path" version="v2.0.0" updatedAt="Abril 2026" />
      <FABMenu items={fabItems} />
    </div>
  )
}
