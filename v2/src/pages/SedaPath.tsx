import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
// Card disponivel se necessario
import { Button } from '../components/common/Button'
import { Collapsible } from '../components/common/Collapsible'
import { AlertCard } from '../components/common/AlertCard'
import { Toggle } from '../components/common/Toggle'
import { useWeight } from '../contexts/WeightContext'
import { useToast } from '../contexts/ToastContext'
import { fmt } from '../utils/calculations'
import type { FABItem } from '../types/clinical'

// ==========================================
// TYPES
// ==========================================

type Screen =
  | 'triagem'
  | 'colaborativo'
  | 'sem-sedacao'
  | 'sedacao-vo'
  | 'pouco-colaborativo'
  | 'urgencia-alta-pc'
  | 'escolha-im-urgente'
  | 'urgencia-baixa'
  | 'nao-colaborativo'
  | 'preparo-iv'
  | 'ketofol'
  | 'durante'
  | 'pos'

type Triagem = 'colaborativo' | 'pouco-colaborativo' | 'nao-colaborativo' | null
type Via = 'im' | 'iv' | null
type Protocolo = 'ketamina' | 'midazolam' | 'mida-hf' | null

interface SedaState {
  screen: Screen
  history: Screen[]
  triagem: Triagem
  via: Via
  protocolo: Protocolo
  sedacaoPrevia: boolean
  sedacaoPreviaVO: boolean
  // Combativo / urgente IM selection
  medUrgente: Protocolo
  medCombativo: Protocolo
  // Checklist states
  redflags: Record<string, boolean>
  materialChecks: Record<string, boolean>
  equipeChecks: Record<string, boolean>
  posImChecks: Record<string, boolean>
  posCombativoChecks: Record<string, boolean>
  urgBaixaChecks: Record<string, boolean>
  altaChecks: Record<string, boolean>
  contencaoChecks: Record<string, boolean>
  // Local weight inputs for IM calculators
  pesoKetUrg: string
  pesoKetComb: string
  pesoKetofol: string
  // Sedacao previa context
  sedacaoPreviaPc: boolean
}

const INITIAL_STATE: SedaState = {
  screen: 'triagem',
  history: ['triagem'],
  triagem: null,
  via: null,
  protocolo: null,
  sedacaoPrevia: false,
  sedacaoPreviaVO: false,
  medUrgente: null,
  medCombativo: null,
  redflags: {},
  materialChecks: {},
  equipeChecks: {},
  posImChecks: {},
  posCombativoChecks: {},
  urgBaixaChecks: {},
  altaChecks: {},
  contencaoChecks: {},
  pesoKetUrg: '',
  pesoKetComb: '',
  pesoKetofol: '',
  sedacaoPreviaPc: false,
}

// ==========================================
// BREADCRUMB CONFIG
// ==========================================

const BREADCRUMB_LABELS: Record<Screen, string> = {
  triagem: 'Triagem',
  colaborativo: 'Colaborativo',
  'sem-sedacao': 'Sem sedacao',
  'sedacao-vo': 'Sedacao VO',
  'pouco-colaborativo': 'Pouco colaborativo',
  'urgencia-alta-pc': 'Urgente',
  'escolha-im-urgente': 'IM urgente',
  'urgencia-baixa': 'Nao urgente',
  'nao-colaborativo': 'Combativo',
  'preparo-iv': 'Preparo IV',
  ketofol: 'Ketofol',
  durante: 'Durante',
  pos: 'Pos-sedacao',
}

// ==========================================
// COMPONENT
// ==========================================

export default function SedaPath() {
  const navigate = useNavigate()
  const _sedaWeight = useWeight(); void _sedaWeight
  const { addToast } = useToast()
  const [state, setState] = useState<SedaState>(INITIAL_STATE)

  // ---- Navigation ----

  const goTo = useCallback((screen: Screen, direction: 'left' | 'right' = 'left') => {
    setState(prev => ({
      ...prev,
      screen,
      history: [...prev.history, screen],
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const goBack = useCallback(() => {
    setState(prev => {
      const newHistory = [...prev.history]
      newHistory.pop()
      const prevScreen = newHistory[newHistory.length - 1] || 'triagem'
      return { ...prev, screen: prevScreen, history: newHistory }
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const reiniciar = useCallback(() => {
    setState(INITIAL_STATE)
    addToast('Fluxo reiniciado', 'info')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [addToast])

  // ---- Setters ----

  const set = useCallback(<K extends keyof SedaState>(key: K, value: SedaState[K]) => {
    setState(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleCheck = useCallback((group: keyof SedaState, id: string) => {
    setState(prev => {
      const checks = (prev[group] as Record<string, boolean>) || {}
      return { ...prev, [group]: { ...checks, [id]: !checks[id] } }
    })
  }, [])

  const toggleRedflag = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      redflags: { ...prev.redflags, [id]: !prev.redflags[id] },
    }))
  }, [])

  // ---- Calculators ----

  const calcKetaminaIM = (pesoStr: string) => {
    const peso = parseFloat(pesoStr)
    if (!peso || peso <= 0) return null
    const dose = peso * 5
    const volume = dose / 50
    return { dose, volume }
  }

  const calcKetofol = (pesoStr: string, sedPrevia: boolean) => {
    const peso = parseFloat(pesoStr)
    if (!peso || peso <= 0) return null
    const doseKgInducao = sedPrevia ? 0.25 : 0.5
    const doseKgManutencao = sedPrevia ? 0.125 : 0.25
    const doseInducao = peso * doseKgInducao
    const doseManutencao = peso * doseKgManutencao
    const volumeInducao = doseInducao / 5
    const volumeManutencao = doseManutencao / 5
    return { doseInducao, volumeInducao, doseManutencao, volumeManutencao }
  }

  // ---- FAB ----

  const fabItems: FABItem[] = [
    { label: 'Reiniciar Fluxo', onClick: reiniciar },
  ]

  // ---- Breadcrumb ----

  const Breadcrumb = () => {
    const items = state.history.filter((v, i, arr) => arr.indexOf(v) === i)
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-bg-elevated border-b border-border text-xs text-text-secondary overflow-x-auto">
        {items.map((item, i) => (
          <span key={item} className="flex items-center gap-2 whitespace-nowrap">
            {i > 0 && <span className="text-text-muted">/</span>}
            <span className={item === state.screen ? 'text-accent font-semibold' : ''}>
              {BREADCRUMB_LABELS[item]}
            </span>
          </span>
        ))}
      </div>
    )
  }

  // ---- Shared sub-components ----

  function OptionCard({
    color,
    title,
    description,
    onClick,
    selected,
    className = '',
  }: {
    color: 'green' | 'yellow' | 'red' | 'blue'
    title: string
    description: string
    onClick: () => void
    selected?: boolean
    className?: string
  }) {
    const borderColors = {
      green: '#10B981',
      yellow: '#F59E0B',
      red: '#EF4444',
      blue: '#FF5252',
    }
    return (
      <div
        onClick={onClick}
        className={`bg-bg-elevated border-2 rounded-xl p-4 mb-3 cursor-pointer transition-colors border-l-4 active:border-accent ${
          selected ? 'border-accent bg-[#1A0A0A]' : 'border-border'
        } ${className}`}
        style={{ borderLeftColor: borderColors[color] }}
      >
        <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
        <p className="text-[13px] text-text-secondary">{description}</p>
      </div>
    )
  }

  function MedOption({
    title,
    dose,
    indicacao,
    extra,
    selected,
    onClick,
  }: {
    title: string
    dose: string
    indicacao: string
    extra?: string
    selected: boolean
    onClick: () => void
  }) {
    return (
      <div
        onClick={onClick}
        className={`bg-bg-elevated border-2 rounded-xl p-3.5 mb-3 cursor-pointer transition-colors ${
          selected ? 'border-accent bg-[#1A0A0A]' : 'border-border'
        }`}
      >
        <h4 className="text-[15px] font-semibold text-accent mb-1">{title}</h4>
        <div className="text-sm font-medium text-success mb-1">{dose}</div>
        <div className="text-xs text-text-secondary">{indicacao}</div>
        {extra && <div className="text-xs text-text-secondary mt-2"><strong>Preferir se:</strong> {extra}</div>}
      </div>
    )
  }

  function ChecklistItem({
    id,
    label,
    checked,
    onChange,
    extra,
  }: {
    id: string
    label: string
    checked: boolean
    onChange: () => void
    extra?: React.ReactNode
  }) {
    return (
      <div className={`flex items-start gap-3 py-2.5 border-b border-border last:border-b-0 ${checked ? 'opacity-60' : ''}`}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="w-5 h-5 mt-0.5 accent-accent flex-shrink-0"
        />
        <label htmlFor={id} className={`text-sm cursor-pointer flex-1 ${checked ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
          {label}
          {extra}
        </label>
      </div>
    )
  }

  function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
      <div className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className={`font-bold ${highlight ? 'text-success text-[22px]' : 'text-accent text-lg'}`}>{value}</span>
      </div>
    )
  }

  function RedFlagCard({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    const active = state.redflags[id]
    return (
      <div
        className={`rounded-lg p-3 mb-2 border cursor-pointer transition-colors ${
          active ? 'border-red-500 bg-[#1A0A0A]' : 'border-border bg-bg-elevated'
        }`}
        onClick={() => toggleRedflag(id)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-[#1A0A0A] rounded-full flex items-center justify-center text-xs" />
          <span className="text-sm font-medium text-text-primary flex-1">{title}</span>
          <span className="text-text-muted text-sm">{active ? '-' : '+'}</span>
        </div>
        {active && (
          <div className="mt-2.5 p-2.5 bg-[#1A1500] rounded-md text-[13px] text-yellow-300">
            {children}
          </div>
        )}
      </div>
    )
  }

  function NavButtons({ onBack, onNext, nextLabel, nextDisabled }: {
    onBack?: () => void
    onNext?: () => void
    nextLabel?: string
    nextDisabled?: boolean
  }) {
    return (
      <div className="flex gap-3 mt-6">
        {onBack && (
          <Button variant="secondary" onClick={onBack} className="flex-1">
            &#8592; Voltar
          </Button>
        )}
        {onNext && (
          <Button onClick={onNext} disabled={nextDisabled} className="flex-1">
            {nextLabel || 'Proximo'} &#8594;
          </Button>
        )}
      </div>
    )
  }

  function ParamCard({ icon, iconBg, title, description }: {
    icon: string
    iconBg: string
    title: string
    description: string
  }) {
    return (
      <div className="flex items-center gap-3 p-3 bg-bg-elevated border border-border rounded-lg mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${iconBg}`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // SCREENS
  // ==========================================

  // ---- 1. TRIAGEM ----
  function ScreenTriagem() {
    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Avaliacao inicial</h2>
        <p className="text-sm text-text-secondary mb-4">Qual a situacao atual do paciente?</p>

        <OptionCard
          color="green"
          title="Colaborativo"
          description="Aceita orientacoes, permite acesso venoso e monitorizacao"
          onClick={() => { set('triagem', 'colaborativo'); goTo('colaborativo') }}
        />
        <OptionCard
          color="yellow"
          title="Pouco colaborativo"
          description="Agitado, nao permite procedimentos, sem risco iminente"
          onClick={() => { set('triagem', 'pouco-colaborativo'); goTo('pouco-colaborativo') }}
        />
        <OptionCard
          color="red"
          title="Combativo / Agitacao grave"
          description="Risco imediato para equipe ou para si"
          onClick={() => { set('triagem', 'nao-colaborativo'); goTo('nao-colaborativo') }}
        />
      </div>
    )
  }

  // ---- 1B. COLABORATIVO ----
  function ScreenColaborativo() {
    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Paciente colaborativo</h2>

        <div className="bg-bg-hover border-2 border-accent rounded-xl p-5 mb-5 text-center">
          <h3 className="text-lg font-bold text-accent mb-2">A sedacao e realmente necessaria?</h3>
          <p className="text-sm text-text-secondary">Avalie se o paciente consegue tolerar o procedimento sem sedacao</p>
        </div>

        <OptionCard
          color="green"
          title="Nao -- procedimento sem sedacao"
          description="Paciente consegue ficar imovel, tolera o procedimento"
          onClick={() => goTo('sem-sedacao')}
        />
        <OptionCard
          color="blue"
          title="Sim -- precisa de sedacao"
          description="Ansiedade, dificuldade de imobilizacao, dor nao controlada"
          onClick={() => goTo('sedacao-vo')}
        />

        <NavButtons onBack={goBack} />
      </div>
    )
  }

  // ---- SEM SEDACAO ----
  function ScreenSemSedacao() {
    return (
      <div className="animate-slide-left">
        <div className="bg-[#0A1A0F] border-2 border-success rounded-xl p-6 text-center mb-4">
          <h3 className="text-lg font-semibold text-emerald-300 mb-2">Procedimento sem sedacao</h3>
          <p className="text-sm text-emerald-400">Paciente colaborativo -- sedacao nao necessaria</p>
        </div>

        <AlertCard type="info" title="Dica">
          Mantenha comunicacao clara com o paciente durante o procedimento. Explique cada etapa.
        </AlertCard>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={goBack} className="flex-1">&#8592; Voltar</Button>
          <Button onClick={reiniciar} className="flex-1">Novo paciente</Button>
        </div>
      </div>
    )
  }

  // ---- SEDACAO VO ----
  function ScreenSedacaoVO() {
    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Sedacao leve -- via oral</h2>

        <div className="bg-[#1A0A0A] border-2 border-accent rounded-xl p-4 mb-3">
          <h4 className="text-[15px] font-semibold text-accent mb-2">Opcoes de sedacao VO</h4>
          <div className="text-base font-semibold text-success mb-2">Midazolam 7,5-15mg VO</div>
          <div className="text-[13px] text-text-secondary">ou Clonazepam 0,5-1mg VO</div>
          <div className="text-[13px] text-text-secondary mt-2">Aguardar 20-30 minutos para efeito</div>
        </div>

        <AlertCard type="info" title="Se dor associada">
          Considere reforco analgesico (dipirona, tramadol, morfina conforme intensidade)
        </AlertCard>

        <Collapsible title="Apos 20-30 minutos -- avalie a resposta">
          <OptionCard
            color="green"
            title="Suficiente"
            description="Paciente calmo, tolera procedimento"
            onClick={() => goTo('sem-sedacao')}
          />
          <OptionCard
            color="yellow"
            title="Insuficiente"
            description="Escalonar para sedacao IV (Ketofol)"
            onClick={() => {
              set('sedacaoPreviaVO', true)
              set('sedacaoPrevia', true)
              goTo('preparo-iv')
            }}
          />
        </Collapsible>

        <NavButtons onBack={goBack} />
      </div>
    )
  }

  // ---- 2A. POUCO COLABORATIVO ----
  function ScreenPoucoColaborativo() {
    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Pouco colaborativo</h2>

        <div className="bg-[#0A0A1A] border border-blue-500 rounded-lg p-4 mb-4">
          <h4 className="text-sm text-blue-300 mb-2.5 flex items-center gap-2 font-semibold">Primeiro: desescalonamento verbal</h4>
          <ul className="text-[13px] text-blue-200 pl-5 list-disc space-y-1.5">
            <li>Tom calmo e acolhedor, sem julgamentos</li>
            <li>Reduza estimulos (som, pessoas)</li>
            <li>Perguntas abertas: &quot;Como posso ajudar?&quot;</li>
          </ul>
        </div>

        <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
          <h3 className="text-base font-semibold text-accent mb-3">Paciente ja recebeu sedacao nas ultimas 4h?</h3>
          <Toggle
            options={[{ value: 'nao', label: 'Nao' }, { value: 'sim', label: 'Sim' }]}
            value={state.sedacaoPreviaPc ? 'sim' : 'nao'}
            onChange={(v) => {
              const com = v === 'sim'
              set('sedacaoPreviaPc', com)
              set('sedacaoPrevia', com)
            }}
          />
        </div>

        {!state.sedacaoPreviaPc && (
          <div>
            <div className="bg-[#1A0A0A] border-2 border-accent rounded-xl p-4 mb-3">
              <h4 className="text-[15px] font-semibold text-accent mb-2">Considere VO primeiro (se aceitar)</h4>
              <div className="text-base font-semibold text-success mb-2">Clonazepam 0,5-1mg VO</div>
              <div className="text-[13px] text-text-secondary">Aguardar 30 minutos. Se aceitar, pode ser suficiente.</div>
            </div>
            <AlertCard type="warning" title="Se falha da VO ou paciente recusa">
              Avalie urgencia da intervencao abaixo
            </AlertCard>
          </div>
        )}

        {state.sedacaoPreviaPc && (
          <AlertCard type="warning" title="Ja recebeu sedacao e nao foi suficiente">
            Avalie urgencia da intervencao abaixo
          </AlertCard>
        )}

        <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
          <h3 className="text-base font-semibold text-accent mb-3">Urgencia da intervencao</h3>
          <p className="text-[13px] text-text-secondary mb-3">
            O exame/procedimento precisa ser feito <strong>agora</strong>?
          </p>
          <OptionCard
            color="red"
            title="Urgente -- preciso agora"
            description="Trauma, suspeita de lesao aguda, TC imediata necessaria"
            onClick={() => goTo('urgencia-alta-pc')}
          />
          <OptionCard
            color="yellow"
            title="Nao urgente -- posso aguardar 20-40 min"
            description="Situacao controlada, aguardar efeito do IM"
            onClick={() => goTo('urgencia-baixa')}
          />
        </div>

        <NavButtons onBack={goBack} />
      </div>
    )
  }

  // ---- URGENCIA ALTA ----
  function ScreenUrgenciaAlta() {
    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Urgente -- sedacao rapida</h2>

        <AlertCard type="danger" title="Preciso de onset rapido">
          Nao posso aguardar 20-40 min do Haloperidol IM
        </AlertCard>

        <p className="text-sm text-text-secondary mb-4">Paciente tem acesso venoso?</p>

        <OptionCard
          color="green"
          title="Sim -- tem acesso IV"
          description="Usar Ketofol IV (onset 1-2 min)"
          onClick={() => goTo('preparo-iv')}
        />
        <OptionCard
          color="yellow"
          title="Nao -- sem acesso IV"
          description="Escolher sedacao IM de onset rapido"
          onClick={() => goTo('escolha-im-urgente')}
        />

        <NavButtons onBack={goBack} />
      </div>
    )
  }

  // ---- ESCOLHA IM URGENTE ----
  function ScreenEscolhaIMUrgente() {
    const ketResult = calcKetaminaIM(state.pesoKetUrg)

    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Sedacao IM -- onset rapido</h2>

        <AlertCard type="info" title="Sem acesso IV">
          Escolha a medicacao conforme indicacao e contraindicacoes
        </AlertCard>

        <MedOption
          title="Ketamina IM"
          dose="5 mg/kg IM"
          indicacao="Onset: 3-5 min | Duracao: 15-30 min"
          extra="drogas sinteticas (K2, K9), falha de outras medicacoes, intoxicacao alcoolica"
          selected={state.medUrgente === 'ketamina'}
          onClick={() => set('medUrgente', 'ketamina')}
        />

        <MedOption
          title="Midazolam IM"
          dose="7,5 mg IM"
          indicacao="Onset: imediato | Meia-vida: 1-2h"
          selected={state.medUrgente === 'midazolam'}
          onClick={() => set('medUrgente', 'midazolam')}
        />

        <AlertCard type="danger" title="Evitar Midazolam se:">
          Intoxicacao alcoolica / Risco de rebaixamento respiratorio / Gestante
        </AlertCard>

        {state.medUrgente === 'ketamina' && (
          <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
            <h3 className="text-base font-semibold text-accent mb-4">Calculadora Ketamina IM</h3>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Peso do paciente (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ex: 70"
              value={state.pesoKetUrg}
              onChange={(e) => set('pesoKetUrg', e.target.value)}
              className="w-full p-3 border-2 border-border rounded-lg text-base bg-bg-hover text-text-primary focus:border-accent focus:outline-none placeholder:text-text-muted"
            />
            {ketResult && (
              <div className="bg-bg-hover rounded-lg p-4 mt-4 border border-border">
                <ResultRow label="Dose total" value={`${fmt(ketResult.dose, 0)} mg`} />
                <ResultRow label="Volume (50mg/mL)" value={`${fmt(ketResult.volume, 1)} mL`} highlight />
              </div>
            )}
          </div>
        )}

        {state.medUrgente && (
          <Collapsible title="Apos administracao">
            <ChecklistItem id="urg-monitor" label="Monitorizacao continua (SpO2, FC)" checked={!!state.posImChecks['urg-monitor']} onChange={() => toggleCheck('posImChecks', 'urg-monitor')} />
            <ChecklistItem id="urg-va" label="Material de via aerea disponivel" checked={!!state.posImChecks['urg-va']} onChange={() => toggleCheck('posImChecks', 'urg-va')} />
            <ChecklistItem id="urg-acesso" label="Obter acesso IV assim que possivel" checked={!!state.posImChecks['urg-acesso']} onChange={() => toggleCheck('posImChecks', 'urg-acesso')} />
            <ChecklistItem id="urg-aguardar" label="Aguardar onset para procedimento" checked={!!state.posImChecks['urg-aguardar']} onChange={() => toggleCheck('posImChecks', 'urg-aguardar')} />
          </Collapsible>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={goBack} className="flex-1">&#8592; Voltar</Button>
          {state.medUrgente && (
            <Button onClick={() => goTo('durante')} className="flex-1">Durante sedacao &#8594;</Button>
          )}
        </div>
      </div>
    )
  }

  // ---- URGENCIA BAIXA ----
  function ScreenUrgenciaBaixa() {
    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Nao urgente -- Haloperidol + Prometazina IM</h2>

        <div className="bg-[#1A0A0A] border-2 border-accent rounded-xl p-4 mb-3">
          <h4 className="text-[15px] font-semibold text-accent mb-2">Haloperidol + Prometazina IM</h4>
          <div className="text-base font-semibold text-success mb-2">Haloperidol 5mg + Prometazina 50mg IM</div>
          <div className="text-[13px] text-text-secondary">Onset: 20-40 minutos</div>
          <div className="text-[13px] text-text-secondary">Pode repetir Haloperidol em 30 min (max 40mg/dia)</div>
          <div className="text-[13px] text-text-secondary">Em gestantes: Prometazina max 100mg/dia</div>
        </div>

        <Collapsible title="Checklist enquanto aguarda" defaultOpen>
          <ChecklistItem id="ub-perfusao" label="Verificar perfusao das extremidades (se contido)" checked={!!state.urgBaixaChecks['ub-perfusao']} onChange={() => toggleCheck('urgBaixaChecks', 'ub-perfusao')} />
          <ChecklistItem id="ub-sv" label="Aferir sinais vitais a cada 15-30 min" checked={!!state.urgBaixaChecks['ub-sv']} onChange={() => toggleCheck('urgBaixaChecks', 'ub-sv')} />
          <ChecklistItem id="ub-acesso" label="Obter acesso venoso quando possivel" checked={!!state.urgBaixaChecks['ub-acesso']} onChange={() => toggleCheck('urgBaixaChecks', 'ub-acesso')} />
          <ChecklistItem id="ub-material" label="Preparar material para procedimento" checked={!!state.urgBaixaChecks['ub-material']} onChange={() => toggleCheck('urgBaixaChecks', 'ub-material')} />
        </Collapsible>

        <Collapsible title="Apos 20-40 minutos -- avalie resposta">
          <OptionCard
            color="green"
            title="Sedacao adequada"
            description="Pode realizar procedimento"
            onClick={() => goTo('durante')}
          />
          <OptionCard
            color="yellow"
            title="Precisa complementar"
            description="Escalonar para Ketofol IV"
            onClick={() => goTo('preparo-iv')}
          />
        </Collapsible>

        <NavButtons onBack={goBack} />
      </div>
    )
  }

  // ---- 2B. COMBATIVO ----
  function ScreenNaoColaborativo() {
    const ketResult = calcKetaminaIM(state.pesoKetComb)

    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Combativo / Agitacao grave</h2>

        <div className="bg-[#1A0A0A] border-2 border-red-500 rounded-xl p-4 mb-4">
          <h4 className="text-[15px] font-bold text-red-300 mb-2">Risco imediato</h4>
          <ul className="text-sm text-red-300 pl-5 list-disc space-y-1">
            <li>Reunir equipe e definir papeis</li>
            <li>Preparar contencao mecanica</li>
            <li>Abordar em grupo</li>
            <li>Nao conter mecanicamente sem contencao quimica</li>
          </ul>
        </div>

        <p className="text-sm text-text-secondary mb-4">Escolha a contencao quimica:</p>

        <MedOption
          title="Ketamina IM"
          dose="5 mg/kg IM"
          indicacao="Onset: 3-5 min | Duracao: 15-30 min"
          extra="drogas sinteticas (K2, K9), intoxicacao alcoolica, necessidade de onset rapido"
          selected={state.medCombativo === 'ketamina'}
          onClick={() => set('medCombativo', 'ketamina')}
        />

        <MedOption
          title="Midazolam + Haloperidol + Prometazina IM"
          dose="Midazolam 7,5mg + Haloperidol 5mg + Prometazina 50mg IM"
          indicacao="Onset midazolam: imediato | Onset haloperidol + prometazina: 20-40 min | Duracao: 4-6h"
          selected={state.medCombativo === 'mida-hf'}
          onClick={() => set('medCombativo', 'mida-hf')}
        />

        <AlertCard type="danger" title="Contraindicacao ao Midazolam?">
          Intoxicacao alcoolica, risco respiratorio, gestante &rarr; <strong>Usar apenas Ketamina IM</strong>
        </AlertCard>

        {state.medCombativo === 'ketamina' && (
          <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
            <h3 className="text-base font-semibold text-accent mb-4">Calculadora Ketamina IM</h3>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Peso do paciente (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ex: 70"
              value={state.pesoKetComb}
              onChange={(e) => set('pesoKetComb', e.target.value)}
              className="w-full p-3 border-2 border-border rounded-lg text-base bg-bg-hover text-text-primary focus:border-accent focus:outline-none placeholder:text-text-muted"
            />
            {ketResult && (
              <div className="bg-bg-hover rounded-lg p-4 mt-4 border border-border">
                <ResultRow label="Dose total" value={`${fmt(ketResult.dose, 0)} mg`} />
                <ResultRow label="Volume (50mg/mL)" value={`${fmt(ketResult.volume, 1)} mL`} highlight />
              </div>
            )}
          </div>
        )}

        {state.medCombativo && (
          <>
            <Collapsible title="Checklist pos-contencao">
              <ChecklistItem id="nc-perfusao" label="Verificar perfusao extremidades 30/30 min" checked={!!state.posCombativoChecks['nc-perfusao']} onChange={() => toggleCheck('posCombativoChecks', 'nc-perfusao')} />
              <ChecklistItem id="nc-sv" label="Sinais vitais a cada 1 hora" checked={!!state.posCombativoChecks['nc-sv']} onChange={() => toggleCheck('posCombativoChecks', 'nc-sv')} />
              <ChecklistItem id="nc-acesso" label="Obter acesso IV quando possivel" checked={!!state.posCombativoChecks['nc-acesso']} onChange={() => toggleCheck('posCombativoChecks', 'nc-acesso')} />
              <ChecklistItem id="nc-reavaliar" label="Reavaliar necessidade de contencao mecanica" checked={!!state.posCombativoChecks['nc-reavaliar']} onChange={() => toggleCheck('posCombativoChecks', 'nc-reavaliar')} />
            </Collapsible>

            <Collapsible title="Apos estabilizacao inicial">
              <p className="text-sm mb-3">Precisa de sedacao adicional para procedimento?</p>
              <OptionCard
                color="green"
                title="Contencao suficiente"
                description="Paciente estavel, monitorar evolucao"
                onClick={() => goTo('pos')}
              />
              <OptionCard
                color="yellow"
                title="Preciso de sedacao IV adicional"
                description="Escalonar para Ketofol IV"
                onClick={() => goTo('preparo-iv')}
              />
            </Collapsible>
          </>
        )}

        <NavButtons onBack={goBack} />
      </div>
    )
  }

  // ---- 3. PREPARO IV ----
  function ScreenPreparoIV() {
    const sedPrevia = state.sedacaoPrevia || state.sedacaoPreviaVO

    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Preparo para sedacao IV</h2>

        <div className="bg-[#1A0A0A] border-2 border-red-500 rounded-xl p-4 mb-4">
          <h4 className="text-[15px] font-bold text-red-300 mb-2">Ambiente obrigatorio</h4>
          <p className="text-sm text-red-300">Sala de emergencia / ambiente critico, com monitor multiparametrico e recursos para intervencao de via aerea.</p>
          <p className="text-sm text-red-300 mt-2"><strong>Responsavel: Emergencista</strong></p>
        </div>

        {state.sedacaoPreviaVO && (
          <AlertCard type="warning" title="Paciente ja recebeu sedacao VO">
            Considere doses reduzidas de Ketofol e titule conforme resposta.
          </AlertCard>
        )}

        {!state.sedacaoPreviaVO && (
          <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
            <h3 className="text-base font-semibold text-accent mb-3">Paciente recebeu sedacao nas ultimas 4h?</h3>
            <Toggle
              options={[{ value: 'nao', label: 'Nao' }, { value: 'sim', label: 'Sim' }]}
              value={state.sedacaoPrevia ? 'sim' : 'nao'}
              onChange={(v) => set('sedacaoPrevia', v === 'sim')}
            />
            {state.sedacaoPrevia && (
              <div className="mt-3">
                <AlertCard type="info" title="Considere doses reduzidas de Ketofol">
                  Titular conforme resposta.
                </AlertCard>
              </div>
            )}
          </div>
        )}

        <Collapsible title="Red Flags -- clique para expandir">
          <p className="text-[13px] text-text-secondary mb-3">Clique nas condicoes presentes para ver alertas especificos</p>

          <RedFlagCard id="rf-trauma" title="Trauma + suspeita de intoxicacao">
            <strong className="text-red-300">Alto risco de broncoaspiracao</strong><br />
            Gastroparesia do trauma, posicao supina, colar cervical.<br /><br />
            <strong>Considere IOT programada antes da sedacao:</strong>
            <ul className="mt-2 pl-4 list-disc space-y-1">
              <li>Aspirador testado e a mao</li>
              <li>Trendelenburg reverso se possivel</li>
              <li>Equipe preparada para via aerea definitiva</li>
            </ul>
          </RedFlagCard>

          <RedFlagCard id="rf-vad" title="Via aerea dificil antecipada">
            <strong>Sinais:</strong> obesidade, Mallampati &#8805;3, pescoco curto, barba cheia, limitacao de abertura bucal.<br /><br />
            &rarr; Material de VAD preparado<br />
            &rarr; Videolaringoscopio se disponivel<br />
            &rarr; Considere IOT programada antes da sedacao<br /><br />
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/airway') }}
              className="text-info text-[13px] underline bg-transparent border-none cursor-pointer p-0"
            >
              Abrir Airway Guide &rarr;
            </button>
          </RedFlagCard>

          <RedFlagCard id="rf-hemo" title="Instabilidade hemodinamica">
            &rarr; Otimize antes da sedacao (volume, vasopressor)<br />
            &rarr; Considere doses reduzidas<br />
            &rarr; Cetamina isolada pode ser mais estavel hemodinamicamente
          </RedFlagCard>

          <RedFlagCard id="rf-jejum" title="Jejum inadequado">
            &rarr; Em emergencia, <strong>nao atrasar</strong> sedacao por jejum<br />
            &rarr; Pondere risco-beneficio<br />
            &rarr; Otimize protecao de via aerea
          </RedFlagCard>
        </Collapsible>

        <Collapsible title="Materiais">
          <ChecklistItem
            id="mat-monitor"
            label="Monitorizacao (oximetro, PA, cardioscopio)"
            checked={!!state.materialChecks['mat-monitor']}
            onChange={() => toggleCheck('materialChecks', 'mat-monitor')}
          />
          <ChecklistItem
            id="mat-va"
            label="Via aerea (BVM, canulas, laringoscopio, TOT)"
            checked={!!state.materialChecks['mat-va']}
            onChange={() => toggleCheck('materialChecks', 'mat-va')}
            extra={
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/airway') }}
                className="text-info text-[13px] underline bg-transparent border-none cursor-pointer p-0 ml-1"
              >
                Airway Guide &rarr;
              </button>
            }
          />
          <ChecklistItem
            id="mat-asp"
            label="Aspirador funcionando"
            checked={!!state.materialChecks['mat-asp']}
            onChange={() => toggleCheck('materialChecks', 'mat-asp')}
          />
          <ChecklistItem
            id="mat-acesso"
            label="Acesso venoso calibroso e pervio"
            checked={!!state.materialChecks['mat-acesso']}
            onChange={() => toggleCheck('materialChecks', 'mat-acesso')}
          />
          <ChecklistItem
            id="mat-carro"
            label="Acesso ao carro de emergencia"
            checked={!!state.materialChecks['mat-carro']}
            onChange={() => toggleCheck('materialChecks', 'mat-carro')}
          />
        </Collapsible>

        <Collapsible title="Equipe">
          <ChecklistItem
            id="eq-monitor"
            label="Profissional dedicado a monitorizacao"
            checked={!!state.equipeChecks['eq-monitor']}
            onChange={() => toggleCheck('equipeChecks', 'eq-monitor')}
          />
          <ChecklistItem
            id="eq-va"
            label="Profissional capaz de manejar via aerea"
            checked={!!state.equipeChecks['eq-va']}
            onChange={() => toggleCheck('equipeChecks', 'eq-va')}
          />
        </Collapsible>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={goBack} className="flex-1">&#8592; Voltar</Button>
          <Button onClick={() => goTo('ketofol')} className="flex-1">Calcular Ketofol &#8594;</Button>
        </div>
      </div>
    )
  }

  // ---- 4. CALCULADORA KETOFOL ----
  function ScreenKetofol() {
    const sedPrevia = state.sedacaoPrevia || state.sedacaoPreviaVO
    const result = calcKetofol(state.pesoKetofol, sedPrevia)

    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Ketofol 1:1</h2>

        <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
          <h3 className="text-base font-semibold text-accent mb-3">Preparo da solucao</h3>
          <div className="bg-bg-hover border-2 border-dashed border-accent rounded-lg p-4 font-mono text-sm leading-loose">
            <div className="flex justify-between"><span>Ketamina 50mg/mL</span><span>2 mL (100mg)</span></div>
            <div className="flex justify-between"><span>Propofol 1%</span><span>10 mL (100mg)</span></div>
            <div className="flex justify-between"><span>Agua destilada</span><span>8 mL</span></div>
            <div className="flex justify-between border-t-2 border-accent mt-2 pt-2 font-bold"><span>Volume final</span><span>20 mL</span></div>
            <p className="text-center mt-2 text-xs text-text-secondary">
              Concentracao: <strong>5mg/mL</strong> de cada componente
            </p>
          </div>
        </div>

        <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
          <h3 className="text-base font-semibold text-accent mb-4">Calculo de doses</h3>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Peso do paciente (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Ex: 70"
            value={state.pesoKetofol}
            onChange={(e) => set('pesoKetofol', e.target.value)}
            className="w-full p-3 border-2 border-border rounded-lg text-base bg-bg-hover text-text-primary focus:border-accent focus:outline-none placeholder:text-text-muted"
          />

          {result && (
            <div className="mt-4">
              {sedPrevia ? (
                <AlertCard type="warning" title="Considere doses reduzidas (50%)">
                  Sedacao previa nas ultimas 4h. Titular conforme resposta.
                </AlertCard>
              ) : (
                <AlertCard type="info" title="Dose padrao">
                  0,5 mg/kg de cada componente
                </AlertCard>
              )}

              <div className="bg-bg-hover rounded-lg p-4 mt-3 border border-border">
                <h4 className="text-accent font-semibold mb-3">Dose de inducao</h4>
                <ResultRow label="Ketamina + Propofol" value={`${fmt(result.doseInducao, 0)} mg de cada`} />
                <ResultRow label="Volume da solucao" value={`${fmt(result.volumeInducao, 1)} mL`} highlight />
              </div>

              <div className="bg-bg-hover rounded-lg p-4 mt-3 border border-border">
                <h4 className="text-accent font-semibold mb-3">Manutencao (se necessario)</h4>
                <ResultRow label="Dose" value={`${fmt(result.doseManutencao, 0)} mg de cada`} />
                <ResultRow label="Volume" value={`${fmt(result.volumeManutencao, 1)} mL`} />
                <p className="text-xs text-text-secondary mt-2">Repetir a cada 3-5 min conforme necessidade</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={() => goTo('preparo-iv')} className="flex-1">&#8592; Voltar</Button>
          <Button onClick={() => goTo('durante')} className="flex-1">Iniciar sedacao &#8594;</Button>
        </div>
      </div>
    )
  }

  // ---- 5. DURANTE A SEDACAO ----
  function ScreenDurante() {
    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Durante a sedacao</h2>

        <Collapsible title="Monitorizacao obrigatoria" defaultOpen>
          <ParamCard icon="O2" iconBg="bg-[#0A1A0F] text-success" title="SpO2 continuo" description="Manter oximetro visivel e com alarme" />
          <ParamCard icon="PA" iconBg="bg-[#0A0A1A] text-info" title="PA e FC" description="Aferir a cada 3-5 minutos" />
          <ParamCard icon="NC" iconBg="bg-[#0F0A1A] text-purple-400" title="Nivel de consciencia" description="Resposta a estimulos verbais e tateis" />
        </Collapsible>

        <Collapsible title="Intercorrencias">
          <AlertCard type="warning" title="Hipotensao">
            Fluidos, considere vasopressor
          </AlertCard>
          <AlertCard type="warning" title="Dessaturacao">
            <span>1. Reposicionar VA, chin lift/jaw thrust</span><br />
            <span>2. O2 suplementar (mascara com reservatorio)</span><br />
            <span>3. Considere BVM</span><br />
            <strong>4. Se nao reverter com medidas nao invasivas &rarr; considere IOT</strong>
          </AlertCard>
          <AlertCard type="warning" title="Agitacao emergente">
            Dose adicional de ketofol
          </AlertCard>
        </Collapsible>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={goBack} className="flex-1">&#8592; Voltar</Button>
          <Button onClick={() => goTo('pos')} className="flex-1">Pos-sedacao &#8594;</Button>
        </div>
      </div>
    )
  }

  // ---- 6. POS-SEDACAO ----
  function ScreenPos() {
    return (
      <div className="animate-slide-left">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Pos-sedacao</h2>

        <Collapsible title="Criterios de alta da sedacao" defaultOpen>
          <ChecklistItem id="alta-alerta" label="Alerta e orientado" checked={!!state.altaChecks['alta-alerta']} onChange={() => toggleCheck('altaChecks', 'alta-alerta')} />
          <ChecklistItem id="alta-sv" label="Sinais vitais estaveis" checked={!!state.altaChecks['alta-sv']} onChange={() => toggleCheck('altaChecks', 'alta-sv')} />
          <ChecklistItem id="alta-deambula" label="Deambulando sem apoio (ou baseline)" checked={!!state.altaChecks['alta-deambula']} onChange={() => toggleCheck('altaChecks', 'alta-deambula')} />
          <ChecklistItem id="alta-nausea" label="Sem nausea ou vomito" checked={!!state.altaChecks['alta-nausea']} onChange={() => toggleCheck('altaChecks', 'alta-nausea')} />
        </Collapsible>

        <Collapsible title="Foi necessaria contencao mecanica?">
          <p className="text-sm text-text-secondary mb-3">
            Se o paciente foi contido mecanicamente, siga a sequencia abaixo para retirada gradual:
          </p>
          <AlertCard type="info" title="Aguardar 15 minutos entre cada liberacao.">
            Reavaliar necessidade de retomar contencao a cada etapa.
          </AlertCard>
          <ChecklistItem id="cont-torax" label="1. Liberar contencao toracica" checked={!!state.contencaoChecks['cont-torax']} onChange={() => toggleCheck('contencaoChecks', 'cont-torax')} />
          <ChecklistItem id="cont-mi1" label="2. Liberar um membro inferior -- aguardar 15 min" checked={!!state.contencaoChecks['cont-mi1']} onChange={() => toggleCheck('contencaoChecks', 'cont-mi1')} />
          <ChecklistItem id="cont-mi2" label="3. Liberar outro membro inferior -- aguardar 15 min" checked={!!state.contencaoChecks['cont-mi2']} onChange={() => toggleCheck('contencaoChecks', 'cont-mi2')} />
          <ChecklistItem id="cont-ms" label="4. Liberar membros superiores por ultimo" checked={!!state.contencaoChecks['cont-ms']} onChange={() => toggleCheck('contencaoChecks', 'cont-ms')} />
        </Collapsible>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={() => goTo('durante')} className="flex-1">&#8592; Voltar</Button>
          <Button onClick={reiniciar} className="flex-1">Novo paciente</Button>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER SCREEN
  // ==========================================

  function renderScreen() {
    switch (state.screen) {
      case 'triagem': return <ScreenTriagem />
      case 'colaborativo': return <ScreenColaborativo />
      case 'sem-sedacao': return <ScreenSemSedacao />
      case 'sedacao-vo': return <ScreenSedacaoVO />
      case 'pouco-colaborativo': return <ScreenPoucoColaborativo />
      case 'urgencia-alta-pc': return <ScreenUrgenciaAlta />
      case 'escolha-im-urgente': return <ScreenEscolhaIMUrgente />
      case 'urgencia-baixa': return <ScreenUrgenciaBaixa />
      case 'nao-colaborativo': return <ScreenNaoColaborativo />
      case 'preparo-iv': return <ScreenPreparoIV />
      case 'ketofol': return <ScreenKetofol />
      case 'durante': return <ScreenDurante />
      case 'pos': return <ScreenPos />
      default: return <ScreenTriagem />
    }
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Disclaimer />
      <Header title="Seda Path" subtitle="Sedacao procedimental na emergencia" />
      <Breadcrumb />
      <Container>
        {renderScreen()}
      </Container>
      <Footer toolName="Seda Path" version="v2.0.0" />
      <FABMenu items={fabItems} />
    </div>
  )
}
