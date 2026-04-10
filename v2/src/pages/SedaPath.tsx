import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
// Card disponível se necessário
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
  | 'sem-sedação'
  | 'sedação-vo'
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
  sedaçãoPrevia: boolean
  sedaçãoPreviaVO: boolean
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
  contençãoChecks: Record<string, boolean>
  // Local weight inputs for IM calculators
  pesoKetUrg: string
  pesoKetComb: string
  pesoKetofol: string
  // Sedação previa context
  sedaçãoPreviaPc: boolean
}

const INITIAL_STATE: SedaState = {
  screen: 'triagem',
  history: ['triagem'],
  triagem: null,
  via: null,
  protocolo: null,
  sedaçãoPrevia: false,
  sedaçãoPreviaVO: false,
  medUrgente: null,
  medCombativo: null,
  redflags: {},
  materialChecks: {},
  equipeChecks: {},
  posImChecks: {},
  posCombativoChecks: {},
  urgBaixaChecks: {},
  altaChecks: {},
  contençãoChecks: {},
  pesoKetUrg: '',
  pesoKetComb: '',
  pesoKetofol: '',
  sedaçãoPreviaPc: false,
}

// ==========================================
// BREADCRUMB CONFIG
// ==========================================

const BREADCRUMB_LABELS: Record<Screen, string> = {
  triagem: 'Triagem',
  colaborativo: 'Colaborativo',
  'sem-sedação': 'Sem sedação',
  'sedação-vo': 'Sedação VO',
  'pouco-colaborativo': 'Pouco colaborativo',
  'urgencia-alta-pc': 'Urgente',
  'escolha-im-urgente': 'IM urgente',
  'urgencia-baixa': 'Não urgente',
  'nao-colaborativo': 'Combativo',
  'preparo-iv': 'Preparo IV',
  ketofol: 'Ketofol',
  durante: 'Durante',
  pos: 'Pós-sedação',
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
    const doseKgManutenção = sedPrevia ? 0.125 : 0.25
    const doseInducao = peso * doseKgInducao
    const doseManutenção = peso * doseKgManutenção
    const volumeInducao = doseInducao / 5
    const volumeManutenção = doseManutenção / 5
    return { doseInducao, volumeInducao, doseManutenção, volumeManutenção }
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
      yellow: '#FFC107',
      red: '#EF4444',
      blue: '#FF5252',
    }
    return (
      <div
        onClick={onClick}
        className={`bg-bg-card border border-border-card rounded-xl p-5 min-h-[70px] cursor-pointer transition-colors border-l-4 active:border-accent ${
          selected ? 'border-accent bg-[#1A0A0A]' : ''
        } ${className}`}
        style={{ borderLeftColor: borderColors[color] }}
      >
        <h3 className="text-base font-bold text-text-primary mb-1">{title}</h3>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
    )
  }

  function MedOption({
    title,
    dose,
    indicação,
    extra,
    selected,
    onClick,
  }: {
    title: string
    dose: string
    indicação: string
    extra?: string
    selected: boolean
    onClick: () => void
  }) {
    return (
      <div
        onClick={onClick}
        className={`bg-bg-elevated border-2 rounded-xl p-4 mb-3 cursor-pointer transition-colors ${
          selected ? 'border-accent bg-[#1A0A0A]' : 'border-border-card'
        }`}
      >
        <h4 className="text-[15px] font-semibold text-accent mb-1">{title}</h4>
        <div className="text-sm font-medium text-success mb-1">{dose}</div>
        <div className="text-xs text-text-secondary">{indicação}</div>
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
            ← Voltar
          </Button>
        )}
        {onNext && (
          <Button onClick={onNext} disabled={nextDisabled} className="flex-1">
            {nextLabel || 'Próximo'} &#8594;
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
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Avaliação inicial</h2>
        <p className="text-sm text-text-secondary mb-4">Qual a situação atual do paciente?</p>

        <div className="flex flex-col gap-4">
          <OptionCard
            color="green"
            title="Colaborativo"
            description="Aceita orientações, permite acesso venoso e monitorização"
            onClick={() => { set('triagem', 'colaborativo'); goTo('colaborativo') }}
            className="!mb-0"
          />
          <OptionCard
            color="yellow"
            title="Pouco colaborativo"
            description="Agitado, não permite procedimentos, sem risco iminente"
            onClick={() => { set('triagem', 'pouco-colaborativo'); goTo('pouco-colaborativo') }}
            className="!mb-0"
          />
          <OptionCard
            color="red"
            title="Combativo / Agitação grave"
            description="Risco imediato para equipe ou para si"
            onClick={() => { set('triagem', 'nao-colaborativo'); goTo('nao-colaborativo') }}
            className="!mb-0"
          />
        </div>
      </div>
    )
  }

  // ---- 1B. COLABORATIVO ----
  function ScreenColaborativo() {
    return (
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Paciente colaborativo</h2>

        <div className="bg-bg-hover border-2 border-accent rounded-xl p-5 mb-5 text-center">
          <h3 className="text-lg font-bold text-accent mb-2">A sedação é realmente necessária?</h3>
          <p className="text-sm text-text-secondary">Avalie se o paciente consegue tolerar o procedimento sem sedação</p>
        </div>

        <OptionCard
          color="green"
          title="Não — procedimento sem sedação"
          description="Paciente consegue ficar imóvel, tolera o procedimento"
          onClick={() => goTo('sem-sedação')}
        />
        <OptionCard
          color="blue"
          title="Sim — precisa de sedação"
          description="Ansiedade, dificuldade de imobilização, dor não controlada"
          onClick={() => goTo('sedação-vo')}
        />

        <NavButtons onBack={goBack} />
      </div>
    )
  }

  // ---- SEM SEDACAO ----
  function ScreenSemSedação() {
    return (
      <div className="animate-slide-left pt-5">
        <div className="bg-[#0A1A0F] border-2 border-success rounded-xl p-6 text-center mb-4">
          <h3 className="text-lg font-semibold text-emerald-300 mb-2">Procedimento sem sedação</h3>
          <p className="text-sm text-emerald-400">Paciente colaborativo — sedação não necessária</p>
        </div>

        <AlertCard type="info" title="Dica">
          Mantenha comunicação clara com o paciente durante o procedimento. Explique cada etapa.
        </AlertCard>

        <div className="flex gap-3 mt-6">
          <button onClick={goBack} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button onClick={reiniciar} className="flex-1">Novo paciente</Button>
        </div>
      </div>
    )
  }

  // ---- SEDACAO VO ----
  function ScreenSedaçãoVO() {
    return (
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Sedação leve — via oral</h2>

        <div className="bg-[#1A0A0A] border-2 border-accent rounded-xl p-4 mb-3">
          <h4 className="text-[15px] font-semibold text-accent mb-2">Opções de sedação VO</h4>
          <div className="text-base font-semibold text-success mb-2">Midazolam 7,5-15mg VO</div>
          <div className="text-[13px] text-text-secondary">ou Clonazepam 0,5-1mg VO</div>
          <div className="text-[13px] text-text-secondary mt-2">Aguardar 20-30 minutos para efeito</div>
        </div>

        <AlertCard type="info" title="Se dor associada">
          Considere reforço analgésico (dipirona, tramadol, morfina conforme intensidade)
        </AlertCard>

        <Collapsible title="Após 20-30 minutos — avalie a resposta">
          <OptionCard
            color="green"
            title="Suficiente"
            description="Paciente calmo, tolera procedimento"
            onClick={() => goTo('sem-sedação')}
          />
          <OptionCard
            color="yellow"
            title="Insuficiente"
            description="Escalonar para sedação IV (Ketofol)"
            onClick={() => {
              set('sedaçãoPreviaVO', true)
              set('sedaçãoPrevia', true)
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
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Pouco colaborativo</h2>

        <div className="bg-[#0A0A1A] border border-blue-500 rounded-lg p-4 mb-4">
          <h4 className="text-sm text-blue-300 mb-2.5 flex items-center gap-2 font-semibold">Primeiro: desescalonamento verbal</h4>
          <ul className="text-[13px] text-blue-200 pl-5 list-disc space-y-1.5">
            <li>Tom calmo e acolhedor, sem julgamentos</li>
            <li>Reduza estímulos (som, pessoas)</li>
            <li>Perguntas abertas: &quot;Como posso ajudar?&quot;</li>
          </ul>
        </div>

        <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
          <h3 className="text-base font-semibold text-accent mb-3">Paciente já recebeu sedação nas últimas 4h?</h3>
          <Toggle
            options={[{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }]}
            value={state.sedaçãoPreviaPc ? 'sim' : 'nao'}
            onChange={(v) => {
              const com = v === 'sim'
              set('sedaçãoPreviaPc', com)
              set('sedaçãoPrevia', com)
            }}
          />
        </div>

        {!state.sedaçãoPreviaPc && (
          <div>
            <div className="bg-[#1A0A0A] border-2 border-accent rounded-xl p-4 mb-3">
              <h4 className="text-[15px] font-semibold text-accent mb-2">Considere VO primeiro (se aceitar)</h4>
              <div className="text-base font-semibold text-success mb-2">Clonazepam 0,5-1mg VO</div>
              <div className="text-[13px] text-text-secondary">Aguardar 30 minutos. Se aceitar, pode ser suficiente.</div>
            </div>
            <AlertCard type="warning" title="Se falha da VO ou paciente recusa">
              Avalie urgência da intervenção abaixo
            </AlertCard>
          </div>
        )}

        {state.sedaçãoPreviaPc && (
          <AlertCard type="warning" title="Já recebeu sedação e não foi suficiente">
            Avalie urgência da intervenção abaixo
          </AlertCard>
        )}

        <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
          <h3 className="text-base font-semibold text-accent mb-3">Urgência da intervenção</h3>
          <p className="text-[13px] text-text-secondary mb-3">
            O exame/procedimento precisa ser feito <strong>agora</strong>?
          </p>
          <OptionCard
            color="red"
            title="Urgente — preciso agora"
            description="Trauma, suspeita de lesão aguda, TC imediata necessária"
            onClick={() => goTo('urgencia-alta-pc')}
          />
          <OptionCard
            color="yellow"
            title="Não urgente — posso aguardar 20-40 min"
            description="Situação controlada, aguardar efeito do IM"
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
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Urgente — sedação rápida</h2>

        <AlertCard type="danger" title="Preciso de onset rápido">
          Não posso aguardar 20-40 min do Haloperidol IM
        </AlertCard>

        <p className="text-sm text-text-secondary mb-4">Paciente tem acesso venoso?</p>

        <OptionCard
          color="green"
          title="Sim — tem acesso IV"
          description="Usar Ketofol IV (onset 1-2 min)"
          onClick={() => goTo('preparo-iv')}
        />
        <OptionCard
          color="yellow"
          title="Não — sem acesso IV"
          description="Escolher sedação IM de onset rápido"
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
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Sedação IM — onset rápido</h2>

        <AlertCard type="info" title="Sem acesso IV">
          Escolha a medicação conforme indicação e contraindicações
        </AlertCard>

        <MedOption
          title="Ketamina IM"
          dose="5 mg/kg IM"
          indicação="Onset: 3-5 min | Duração: 15-30 min"
          extra="drogas sintéticas (K2, K9), falha de outras medicações, intóxicação alcoólica"
          selected={state.medUrgente === 'ketamina'}
          onClick={() => set('medUrgente', 'ketamina')}
        />

        <MedOption
          title="Midazolam IM"
          dose="7,5 mg IM"
          indicação="Onset: imediato | Meia-vida: 1-2h"
          selected={state.medUrgente === 'midazolam'}
          onClick={() => set('medUrgente', 'midazolam')}
        />

        <AlertCard type="danger" title="Evitar Midazolam se:">
          Intóxicação alcoólica / Risco de rebaixamento respiratório / Gestante
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
          <Collapsible title="Após administração">
            <ChecklistItem id="urg-monitor" label="Monitorização contínua (SpO2, FC)" checked={!!state.posImChecks['urg-monitor']} onChange={() => toggleCheck('posImChecks', 'urg-monitor')} />
            <ChecklistItem id="urg-va" label="Material de via aérea disponível" checked={!!state.posImChecks['urg-va']} onChange={() => toggleCheck('posImChecks', 'urg-va')} />
            <ChecklistItem id="urg-acesso" label="Obter acesso IV assim que possível" checked={!!state.posImChecks['urg-acesso']} onChange={() => toggleCheck('posImChecks', 'urg-acesso')} />
            <ChecklistItem id="urg-aguardar" label="Aguardar onset para procedimento" checked={!!state.posImChecks['urg-aguardar']} onChange={() => toggleCheck('posImChecks', 'urg-aguardar')} />
          </Collapsible>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={goBack} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          {state.medUrgente && (
            <Button onClick={() => goTo('durante')} className="flex-1">Durante sedação &#8594;</Button>
          )}
        </div>
      </div>
    )
  }

  // ---- URGENCIA BAIXA ----
  function ScreenUrgenciaBaixa() {
    return (
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Não urgente — Haloperidol + Prometazina IM</h2>

        <div className="bg-[#1A0A0A] border-2 border-accent rounded-xl p-4 mb-3">
          <h4 className="text-[15px] font-semibold text-accent mb-2">Haloperidol + Prometazina IM</h4>
          <div className="text-base font-semibold text-success mb-2">Haloperidol 5mg + Prometazina 50mg IM</div>
          <div className="text-[13px] text-text-secondary">Onset: 20-40 minutos</div>
          <div className="text-[13px] text-text-secondary">Pode repetir Haloperidol em 30 min (max 40mg/dia)</div>
          <div className="text-[13px] text-text-secondary">Em gestantes: Prometazina max 100mg/dia</div>
        </div>

        <Collapsible title="Checklist enquanto aguarda" defaultOpen>
          <ChecklistItem id="ub-perfusao" label="Verificar perfusão das extremidades (se contido)" checked={!!state.urgBaixaChecks['ub-perfusao']} onChange={() => toggleCheck('urgBaixaChecks', 'ub-perfusao')} />
          <ChecklistItem id="ub-sv" label="Aferir sinais vitais a cada 15-30 min" checked={!!state.urgBaixaChecks['ub-sv']} onChange={() => toggleCheck('urgBaixaChecks', 'ub-sv')} />
          <ChecklistItem id="ub-acesso" label="Obter acesso venoso quando possível" checked={!!state.urgBaixaChecks['ub-acesso']} onChange={() => toggleCheck('urgBaixaChecks', 'ub-acesso')} />
          <ChecklistItem id="ub-material" label="Preparar material para procedimento" checked={!!state.urgBaixaChecks['ub-material']} onChange={() => toggleCheck('urgBaixaChecks', 'ub-material')} />
        </Collapsible>

        <Collapsible title="Após 20-40 minutos — avalie resposta">
          <OptionCard
            color="green"
            title="Sedação adequada"
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
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Combativo / Agitação grave</h2>

        <div className="bg-[#1A0A0A] border-2 border-red-500 rounded-xl p-4 mb-4">
          <h4 className="text-[15px] font-bold text-red-300 mb-2">Risco imediato</h4>
          <ul className="text-sm text-red-300 pl-5 list-disc space-y-1">
            <li>Reunir equipe e definir papéis</li>
            <li>Preparar contenção mecânica</li>
            <li>Abordar em grupo</li>
            <li>Não conter mecanicamente sem contenção química</li>
          </ul>
        </div>

        <p className="text-sm text-text-secondary mb-4">Escolha a contenção química:</p>

        <MedOption
          title="Ketamina IM"
          dose="5 mg/kg IM"
          indicação="Onset: 3-5 min | Duração: 15-30 min"
          extra="drogas sintéticas (K2, K9), intóxicação alcoólica, necessidade de onset rápido"
          selected={state.medCombativo === 'ketamina'}
          onClick={() => set('medCombativo', 'ketamina')}
        />

        <MedOption
          title="Midazolam + Haloperidol + Prometazina IM"
          dose="Midazolam 7,5mg + Haloperidol 5mg + Prometazina 50mg IM"
          indicação="Onset midazolam: imediato | Onset haloperidol + prometazina: 20-40 min | Duração: 4-6h"
          selected={state.medCombativo === 'mida-hf'}
          onClick={() => set('medCombativo', 'mida-hf')}
        />

        <AlertCard type="danger" title="Contraindicação ao Midazolam?">
          Intóxicação alcoólica, risco respiratório, gestante &rarr; <strong>Usar apenas Ketamina IM</strong>
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
            <Collapsible title="Checklist pós-contenção">
              <ChecklistItem id="nc-perfusao" label="Verificar perfusão extremidades 30/30 min" checked={!!state.posCombativoChecks['nc-perfusao']} onChange={() => toggleCheck('posCombativoChecks', 'nc-perfusao')} />
              <ChecklistItem id="nc-sv" label="Sinais vitais a cada 1 hora" checked={!!state.posCombativoChecks['nc-sv']} onChange={() => toggleCheck('posCombativoChecks', 'nc-sv')} />
              <ChecklistItem id="nc-acesso" label="Obter acesso IV quando possível" checked={!!state.posCombativoChecks['nc-acesso']} onChange={() => toggleCheck('posCombativoChecks', 'nc-acesso')} />
              <ChecklistItem id="nc-reavaliar" label="Reavaliar necessidade de contenção mecânica" checked={!!state.posCombativoChecks['nc-reavaliar']} onChange={() => toggleCheck('posCombativoChecks', 'nc-reavaliar')} />
            </Collapsible>

            <Collapsible title="Após estabilização inicial">
              <p className="text-sm mb-3">Precisa de sedação adicional para procedimento?</p>
              <OptionCard
                color="green"
                title="Contenção suficiente"
                description="Paciente estável, monitorar evolução"
                onClick={() => goTo('pos')}
              />
              <OptionCard
                color="yellow"
                title="Preciso de sedação IV adicional"
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
    const sedPrevia = state.sedaçãoPrevia || state.sedaçãoPreviaVO

    return (
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Preparo para sedação IV</h2>

        <div className="bg-[#1A0A0A] border-2 border-red-500 rounded-xl p-4 mb-4">
          <h4 className="text-[15px] font-bold text-red-300 mb-2">Ambiente obrigatório</h4>
          <p className="text-sm text-red-300">Sala de emergência / ambiente crítico, com monitor multiparamétrico e recursos para intervenção de via aérea.</p>
          <p className="text-sm text-red-300 mt-2"><strong>Responsável: Emergencista</strong></p>
        </div>

        {state.sedaçãoPreviaVO && (
          <AlertCard type="warning" title="Paciente já recebeu sedação VO">
            Considere doses reduzidas de Ketofol e titule conforme resposta.
          </AlertCard>
        )}

        {!state.sedaçãoPreviaVO && (
          <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
            <h3 className="text-base font-semibold text-accent mb-3">Paciente recebeu sedação nas últimas 4h?</h3>
            <Toggle
              options={[{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }]}
              value={state.sedaçãoPrevia ? 'sim' : 'nao'}
              onChange={(v) => set('sedaçãoPrevia', v === 'sim')}
            />
            {state.sedaçãoPrevia && (
              <div className="mt-3">
                <AlertCard type="info" title="Considere doses reduzidas de Ketofol">
                  Titular conforme resposta.
                </AlertCard>
              </div>
            )}
          </div>
        )}

        <Collapsible title="Red Flags — clique para expandir">
          <p className="text-[13px] text-text-secondary mb-3">Clique nas condições presentes para ver alertas específicos</p>

          <RedFlagCard id="rf-trauma" title="Trauma + suspeita de intóxicação">
            <strong className="text-red-300">Alto risco de broncoaspiração</strong><br />
            Gastroparesia do trauma, posição supina, colar cervical.<br /><br />
            <strong>Considere IOT programada antes da sedação:</strong>
            <ul className="mt-2 pl-4 list-disc space-y-1">
              <li>Aspirador testado e à mão</li>
              <li>Trendelenburg reverso se possível</li>
              <li>Equipe preparada para via aérea definitiva</li>
            </ul>
          </RedFlagCard>

          <RedFlagCard id="rf-vad" title="Via aérea difícil antecipada">
            <strong>Sinais:</strong> obesidade, Mallampati &#8805;3, pescoço curto, barba cheia, limitação de abertura bucal.<br /><br />
            &rarr; Material de VAD preparado<br />
            &rarr; Videolaringoscópio se disponível<br />
            &rarr; Considere IOT programada antes da sedação<br /><br />
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/airway') }}
              className="text-info text-[13px] underline bg-transparent border-none cursor-pointer p-0"
            >
              Abrir Airway Guide &rarr;
            </button>
          </RedFlagCard>

          <RedFlagCard id="rf-hemo" title="Instabilidade hemodinâmica">
            &rarr; Otimize antes da sedação (volume, vasopressor)<br />
            &rarr; Considere doses reduzidas<br />
            &rarr; Cetamina isolada pode ser mais estável hemodinâmicamente
          </RedFlagCard>

          <RedFlagCard id="rf-jejum" title="Jejum inadequado">
            &rarr; Em emergência, <strong>não atrasar</strong> sedação por jejum<br />
            &rarr; Pondere risco-beneficio<br />
            &rarr; Otimize proteção de via aérea
          </RedFlagCard>
        </Collapsible>

        <Collapsible title="Materiais">
          <ChecklistItem
            id="mat-monitor"
            label="Monitorização (oxímetro, PA, cardioscópio)"
            checked={!!state.materialChecks['mat-monitor']}
            onChange={() => toggleCheck('materialChecks', 'mat-monitor')}
          />
          <ChecklistItem
            id="mat-va"
            label="Via aérea (BVM, cânulas, laringoscópio, TOT)"
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
            label="Acesso venoso calibroso e pérvio"
            checked={!!state.materialChecks['mat-acesso']}
            onChange={() => toggleCheck('materialChecks', 'mat-acesso')}
          />
          <ChecklistItem
            id="mat-carro"
            label="Acesso ao carro de emergência"
            checked={!!state.materialChecks['mat-carro']}
            onChange={() => toggleCheck('materialChecks', 'mat-carro')}
          />
        </Collapsible>

        <Collapsible title="Equipe">
          <ChecklistItem
            id="eq-monitor"
            label="Profissional dedicado à monitorização"
            checked={!!state.equipeChecks['eq-monitor']}
            onChange={() => toggleCheck('equipeChecks', 'eq-monitor')}
          />
          <ChecklistItem
            id="eq-va"
            label="Profissional capaz de manejar via aérea"
            checked={!!state.equipeChecks['eq-va']}
            onChange={() => toggleCheck('equipeChecks', 'eq-va')}
          />
        </Collapsible>

        <div className="flex gap-3 mt-6">
          <button onClick={goBack} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button onClick={() => goTo('ketofol')} className="flex-1">Calcular Ketofol &#8594;</Button>
        </div>
      </div>
    )
  }

  // ---- 4. CALCULADORA KETOFOL ----
  function ScreenKetofol() {
    const sedPrevia = state.sedaçãoPrevia || state.sedaçãoPreviaVO
    const result = calcKetofol(state.pesoKetofol, sedPrevia)

    return (
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Ketofol 1:1</h2>

        <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
          <h3 className="text-base font-semibold text-accent mb-3">Preparo da solução</h3>
          <div className="bg-bg-hover border-2 border-dashed border-accent rounded-lg p-4 font-mono text-sm leading-loose">
            <div className="flex justify-between"><span>Ketamina 50mg/mL</span><span>2 mL (100mg)</span></div>
            <div className="flex justify-between"><span>Propofol 1%</span><span>10 mL (100mg)</span></div>
            <div className="flex justify-between"><span>Água destilada</span><span>8 mL</span></div>
            <div className="flex justify-between border-t-2 border-accent mt-2 pt-2 font-bold"><span>Volume final</span><span>20 mL</span></div>
            <p className="text-center mt-2 text-xs text-text-secondary">
              Concentração: <strong>5mg/mL</strong> de cada componente
            </p>
          </div>
        </div>

        <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-4">
          <h3 className="text-base font-semibold text-accent mb-4">Cálculo de doses</h3>
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
                  Sedação prévia nas últimas 4h. Titular conforme resposta.
                </AlertCard>
              ) : (
                <AlertCard type="info" title="Dose padrão">
                  0,5 mg/kg de cada componente
                </AlertCard>
              )}

              <div className="bg-bg-hover rounded-lg p-4 mt-3 border border-border">
                <h4 className="text-accent font-semibold mb-3">Dose de indução</h4>
                <ResultRow label="Ketamina + Propofol" value={`${fmt(result.doseInducao, 0)} mg de cada`} />
                <ResultRow label="Volume da solução" value={`${fmt(result.volumeInducao, 1)} mL`} highlight />
              </div>

              <div className="bg-bg-hover rounded-lg p-4 mt-3 border border-border">
                <h4 className="text-accent font-semibold mb-3">Manutenção (se necessário)</h4>
                <ResultRow label="Dose" value={`${fmt(result.doseManutenção, 0)} mg de cada`} />
                <ResultRow label="Volume" value={`${fmt(result.volumeManutenção, 1)} mL`} />
                <p className="text-xs text-text-secondary mt-2">Repetir a cada 3-5 min conforme necessidade</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => goTo('preparo-iv')} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button onClick={() => goTo('durante')} className="flex-1">Iniciar sedação &#8594;</Button>
        </div>
      </div>
    )
  }

  // ---- 5. DURANTE A SEDACAO ----
  function ScreenDurante() {
    return (
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Durante a sedação</h2>

        <Collapsible title="Monitorização obrigatória" defaultOpen>
          <ParamCard icon="O2" iconBg="bg-[#0A1A0F] text-success" title="SpO2 contínuo" description="Manter oxímetro visível e com alarme" />
          <ParamCard icon="PA" iconBg="bg-[#0A0A1A] text-info" title="PA e FC" description="Aferir a cada 3-5 minutos" />
          <ParamCard icon="NC" iconBg="bg-[#0F0A1A] text-purple-400" title="Nível de consciência" description="Resposta a estímulos verbais e táteis" />
        </Collapsible>

        <Collapsible title="Intercorrências">
          <AlertCard type="warning" title="Hipotensão">
            Fluidos, considere vasopressor
          </AlertCard>
          <AlertCard type="warning" title="Dessaturação">
            <span>1. Reposicionar VA, chin lift/jaw thrust</span><br />
            <span>2. O2 suplementar (máscara com reservatório)</span><br />
            <span>3. Considere BVM</span><br />
            <strong>4. Se não reverter com medidas não invasivas &rarr; considere IOT</strong>
          </AlertCard>
          <AlertCard type="warning" title="Agitação emergente">
            Dose adicional de ketofol
          </AlertCard>
        </Collapsible>

        <div className="flex gap-3 mt-6">
          <button onClick={goBack} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
          <Button onClick={() => goTo('pos')} className="flex-1">Pós-sedação &#8594;</Button>
        </div>
      </div>
    )
  }

  // ---- 6. POS-SEDACAO ----
  function ScreenPos() {
    return (
      <div className="animate-slide-left pt-5">
        <h2 className="text-xl font-bold text-accent mb-4 pb-3 border-b-2 border-accent">Pós-sedação</h2>

        <Collapsible title="Critérios de alta da sedação" defaultOpen>
          <ChecklistItem id="alta-alerta" label="Alerta e orientado" checked={!!state.altaChecks['alta-alerta']} onChange={() => toggleCheck('altaChecks', 'alta-alerta')} />
          <ChecklistItem id="alta-sv" label="Sinais vitais estáveis" checked={!!state.altaChecks['alta-sv']} onChange={() => toggleCheck('altaChecks', 'alta-sv')} />
          <ChecklistItem id="alta-deambula" label="Deambulando sem apoio (ou baseline)" checked={!!state.altaChecks['alta-deambula']} onChange={() => toggleCheck('altaChecks', 'alta-deambula')} />
          <ChecklistItem id="alta-náusea" label="Sem náusea ou vômito" checked={!!state.altaChecks['alta-náusea']} onChange={() => toggleCheck('altaChecks', 'alta-náusea')} />
        </Collapsible>

        <Collapsible title="Foi necessária contenção mecânica?">
          <p className="text-sm text-text-secondary mb-3">
            Se o paciente foi contido mecanicamente, siga a sequência abaixo para retirada gradual:
          </p>
          <AlertCard type="info" title="Aguardar 15 minutos entre cada liberação.">
            Reavaliar necessidade de retomar contenção a cada etapa.
          </AlertCard>
          <ChecklistItem id="cont-tórax" label="1. Liberar contenção torácica" checked={!!state.contençãoChecks['cont-tórax']} onChange={() => toggleCheck('contençãoChecks', 'cont-tórax')} />
          <ChecklistItem id="cont-mi1" label="2. Liberar um membro inferior — aguardar 15 min" checked={!!state.contençãoChecks['cont-mi1']} onChange={() => toggleCheck('contençãoChecks', 'cont-mi1')} />
          <ChecklistItem id="cont-mi2" label="3. Liberar outro membro inferior — aguardar 15 min" checked={!!state.contençãoChecks['cont-mi2']} onChange={() => toggleCheck('contençãoChecks', 'cont-mi2')} />
          <ChecklistItem id="cont-ms" label="4. Liberar membros superiores por último" checked={!!state.contençãoChecks['cont-ms']} onChange={() => toggleCheck('contençãoChecks', 'cont-ms')} />
        </Collapsible>

        <div className="flex gap-3 mt-6">
          <button onClick={() => goTo('durante')} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-2 px-0 min-h-[44px]">← Voltar</button>
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
      case 'sem-sedação': return <ScreenSemSedação />
      case 'sedação-vo': return <ScreenSedaçãoVO />
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
      <Header title="SedaPath" subtitle="Guia de sedação procedimental" />
      <Breadcrumb />
      <Container className="px-5">
        {renderScreen()}
      </Container>
      <Footer toolName="Seda Path" version="v2.0.0" updatedAt="Abril 2026" />
      <FABMenu items={fabItems} />
    </div>
  )
}
