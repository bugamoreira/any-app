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
import { Modal } from '../components/common/Modal'
import { ToastContainer } from '../components/common/Toast'
// Toast disponível via ToastContainer global

import {
  spictIndicadoresGerais, spictCategorias,
  savedCards,
  redmapSteps, nurseSteps, frasesUteis, frasesEvitar, situacoesAlerta,
  dorLeve, dorModerada, dorIntensa,
  dispneiaFarma, dispneiaNaoFarma,
  náuseaFarma,
  deliriumFarma, deliriumNaoFarma,
  sedaçãoPreReq, sedaçãoProtocolo, sedaçãoAlternativas,
  sinaisMorteIminente, cuidadosFaseFinNaoFarma,
  ecogLevels, ppsLevels,
  ppiOptions, interpretPPI,
  opioidOptions, opioidFactors, opioidEquivalenceTable,
  hipoIndicações, hipoContraindicações,
  volumesPorLocal, dispositivos, hipoProcedimento,
  hipoMedicações, hipoSolucoes,
  compatHeaders, compatRows,
  mythsData,
  referências,
  type MedRow, type TechniqueStep, type MythData,
} from '../data/paliaData'

// ==========================================
// TIPOS
// ==========================================

type Screen = 'home' | 'identificar' | 'decidir' | 'comunicar' | 'manejar' | 'ferramentas' | 'mitos' | 'referências'
type ManejarTab = 'dor' | 'dispneia' | 'náusea' | 'delirium' | 'sedação' | 'final'
type FerramentasTab = 'ecog' | 'pps' | 'ppi' | 'opioides' | 'hipo'
type HipoSubTab = 'indicacoes' | 'técnica' | 'medicações' | 'solucoes' | 'compat' | 'complic'

// ==========================================
// SUB-COMPONENTES
// ==========================================

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-accent text-sm font-medium bg-transparent border-none cursor-pointer mb-4 px-0 min-h-[44px]">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
      Voltar
    </button>
  )
}

function ModuleHeader({ title, subtitle, color }: { title: string; subtitle?: string; color: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
        <span className="w-2 h-6 rounded-full" style={{ background: color }} />
        {title}
      </h2>
      {subtitle && <p className="text-sm text-text-secondary mt-1 ml-4">{subtitle}</p>}
    </div>
  )
}

function MedTable({ headers, rows }: { headers: string[]; rows: MedRow[] }) {
  return (
    <div className="overflow-x-auto my-3 rounded-lg border border-border-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bg-hover">
            {headers.map(h => (
              <th key={h} className="px-3 py-2.5 text-left font-semibold text-text-primary text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border-card">
              <td className="px-3 py-2.5 text-text-primary text-xs">{r.med}</td>
              <td className="px-3 py-2.5 text-text-secondary text-xs">{r.dose}</td>
              {r.obs && <td className="px-3 py-2.5 text-text-muted text-xs">{r.obs}</td>}
              {r.via && <td className="px-3 py-2.5 text-text-muted text-xs">{r.via}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StepsList({ steps }: { steps: TechniqueStep[] }) {
  return (
    <div className="space-y-3 mt-3">
      {steps.map((step, i) => (
        <div key={i} className="relative pl-12 bg-bg-elevated border border-border-card rounded-lg p-4">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-accent text-white rounded-full flex items-center justify-center font-bold text-xs">
            {i + 1}
          </div>
          <h5 className="text-sm font-semibold text-text-primary mb-1">{step.title}</h5>
          <p className="text-xs text-text-secondary">{step.description}</p>
        </div>
      ))}
    </div>
  )
}

function BulletList({ items, color = '#10B981' }: { items: string[]; color?: string }) {
  return (
    <ul className="space-y-2 mt-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
          {item}
        </li>
      ))}
    </ul>
  )
}

function TabBar({ tabs, active, onSelect }: { tabs: { id: string; label: string }[]; active: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex gap-4 border-b-2 border-border-card mb-4 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`px-3 py-3 text-sm whitespace-nowrap relative transition-colors ${
            active === t.id ? 'text-text-primary font-bold' : 'text-text-muted font-medium'
          }`}
        >
          {t.label}
          {active === t.id && (
            <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-accent rounded-t" />
          )}
        </button>
      ))}
    </div>
  )
}

function PillTabs({ tabs, active, onSelect }: { tabs: { id: string; label: string }[]; active: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap mb-4">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`px-3.5 py-2 rounded-full text-xs font-medium transition-colors border ${
            active === t.id
              ? 'bg-accent border-accent text-white'
              : 'bg-bg-hover border-border-card text-text-muted'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ==========================================
// TELAS
// ==========================================

function HomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const modules = [
    { id: 'identificar' as Screen, title: 'Identificar', subtitle: 'SPICT-BR', color: '#10B981', bgColor: 'rgba(16,185,129,0.15)' },
    { id: 'decidir' as Screen, title: 'Decidir', subtitle: 'SAVED', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.15)' },
    { id: 'comunicar' as Screen, title: 'Comunicar', subtitle: 'REDMAP / NURSE', color: '#A78BFA', bgColor: 'rgba(167,139,250,0.15)' },
    { id: 'manejar' as Screen, title: 'Manejar', subtitle: 'Sintomas', color: '#F97316', bgColor: 'rgba(249,115,22,0.15)' },
  ]

  const extras = [
    { id: 'ferramentas' as Screen, title: 'Ferramentas e Escalas', subtitle: 'ECOG, PPS, PPI, Conversão de Opioides, Hipodermóclise', color: '#10B981', bgColor: 'rgba(16,185,129,0.15)' },
    { id: 'mitos' as Screen, title: 'Mitos e Verdades', subtitle: '24 conceitos importantes desmistificados', color: '#EF4444', bgColor: 'rgba(239,68,68,0.15)' },
    { id: 'referências' as Screen, title: 'Referências', subtitle: 'Fontes e literatura consultada', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.15)' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Intro card */}
      <div className="bg-bg-card border border-border-card rounded-xl p-5 text-center mb-6">
        <h2 className="text-lg font-semibold" style={{ color: '#10B981' }}>Cuidados Paliativos no DE</h2>
        <p className="text-sm text-text-secondary mt-2">Ferramentas de apoio à decisão para identificação, comunicação e manejo de pacientes com necessidades paliativas.</p>
      </div>

      {/* Grid de Modulos */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {modules.map(m => (
          <Card
            key={m.id}
            borderColor={m.color}
            onClick={() => onNavigate(m.id)}
            spaced={false}
            className="text-center flex flex-col items-center justify-center min-h-[120px]"
          >
            <div
              className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: m.bgColor, color: m.color }}
            >
              {m.id === 'identificar' && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              )}
              {m.id === 'decidir' && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22V8"/><path d="M21 3l-9 9"/><path d="M3 3l9 9"/>
                </svg>
              )}
              {m.id === 'comunicar' && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              )}
              {m.id === 'manejar' && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/><path d="M12 13v4"/><path d="M10 15h4"/>
                </svg>
              )}
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">{m.title}</h3>
            <p className="text-xs text-text-muted">{m.subtitle}</p>
          </Card>
        ))}
      </div>

      {/* Extras */}
      <div className="flex flex-col gap-3">
        {extras.map(e => (
          <Card
            key={e.id}
            borderColor={e.color}
            onClick={() => onNavigate(e.id)}
            spaced={false}
            className="flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: e.bgColor, color: e.color }}
            >
              {e.id === 'ferramentas' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>
                </svg>
              )}
              {e.id === 'mitos' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
              {e.id === 'referências' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary">{e.title}</h4>
              <p className="text-xs text-text-muted">{e.subtitle}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function IdentificarScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="animate-fade-in">
      <BackButton onClick={onBack} />
      <ModuleHeader title="Identificar" subtitle="SPICT-BR — Ferramenta de Triagem para Cuidados Paliativos" color="#10B981" />

      <AlertCard type="success">
        <strong>Quando usar:</strong> Pacientes com doenças crônicas avançadas ou deterioração clínica progressiva. Se 2 ou mais indicadores positivos, considerar abordagem paliativa.
      </AlertCard>

      <Collapsible title="Indicadores gerais de deterioração">
        <BulletList items={spictIndicadoresGerais} />
      </Collapsible>

      {spictCategorias.map(cat => (
        <Collapsible key={cat.id} title={cat.title}>
          <BulletList items={cat.items} color={cat.iconColor} />
        </Collapsible>
      ))}

      <Card className="mt-4 bg-gradient-to-br from-bg-hover to-bg-elevated border border-border-card">
        <h4 className="text-sm font-semibold text-text-primary mb-2">Pergunta Surpresa</h4>
        <p className="text-sm text-text-secondary">
          "Você ficaria surpreso se este paciente morresse nos próximos 12 meses?"
        </p>
        <p className="text-sm text-text-secondary mt-2">
          Se <strong className="text-text-primary">NÃO</strong> ficaria surpreso, considerar cuidados paliativos.
        </p>
      </Card>
    </div>
  )
}

function DecidirScreen({ onBack }: { onBack: () => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  return (
    <div className="animate-fade-in">
      <BackButton onClick={onBack} />
      <ModuleHeader title="Decidir" subtitle="SAVED — Framework para Decisão sobre Suporte de Vida" color="#3B82F6" />

      <AlertCard type="info">
        <strong>Quando usar:</strong> Paciente crítico/instável com doença avançada para auxiliar na tomada de decisão sobre medidas de suporte vital.
      </AlertCard>

      <div className="space-y-3 mt-4">
        {savedCards.map((card, idx) => (
          <Card
            key={card.letter}
            className="cursor-pointer"
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-[#3B82F6] text-white rounded-lg flex items-center justify-center font-bold text-lg">
                {card.letter}
              </div>
              <h4 className="text-sm font-semibold text-text-primary">{card.title}</h4>
            </div>
            <p className="text-xs text-text-muted ml-12">{card.subtitle}</p>

            {expandedIdx === idx && (
              <div className="mt-3 pt-3 border-t border-border-card animate-fade-in">
                <AlertCard type="success">
                  <strong>{card.content.infoTitle}</strong>
                </AlertCard>
                {card.content.items && <BulletList items={card.content.items} color="#3B82F6" />}
                {card.content.note && (
                  <p className="text-xs text-text-muted mt-3">{card.content.note}</p>
                )}
                {card.content.capacityGrid && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {card.content.capacityGrid.map((c, i) => (
                      <div key={i} className="bg-bg-elevated border border-border-card rounded-lg p-3 text-center">
                        <div className="w-10 h-10 bg-[#3B82F6] text-white rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-lg">
                          {c.letter}
                        </div>
                        <h5 className="text-xs font-semibold text-text-primary mb-1">{c.title}</h5>
                        <p className="text-xs text-text-muted">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
                {card.content.importantNote && (
                  <AlertCard type="warning" className="mt-3">
                    <strong>Importante:</strong> {card.content.importantNote}
                  </AlertCard>
                )}
                {card.content.incapazNote && (
                  <p className="text-xs text-text-muted mt-3">
                    <strong className="text-text-secondary">Se incapaz:</strong> {card.content.incapazNote}
                  </p>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function ComunicarScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="animate-fade-in">
      <BackButton onClick={onBack} />
      <ModuleHeader title="Comunicar" subtitle="Técnicas para conversas difíceis e comunicação de más notícias" color="#A78BFA" />

      <Card className="mb-4 bg-bg-hover border border-border-card">
        <h4 className="text-sm font-semibold text-text-primary mb-1">Frase de Abertura</h4>
        <p className="text-sm text-text-secondary italic">"O que você gostaria de saber sobre sua condição?"</p>
      </Card>

      <Collapsible title="REDMAP — Roteiro de Conversa">
        <StepsList steps={redmapSteps} />
      </Collapsible>

      <Collapsible title="NURSE — Resposta Empática">
        <StepsList steps={nurseSteps} />
      </Collapsible>

      <Collapsible title="Frases Úteis">
        <AlertCard type="success"><strong>Use:</strong></AlertCard>
        <BulletList items={frasesUteis} color="#10B981" />
        <AlertCard type="danger" className="mt-4"><strong>Evite:</strong></AlertCard>
        <BulletList items={frasesEvitar} color="#EF4444" />
      </Collapsible>

      <Collapsible title="Situações de Alerta">
        <BulletList items={situacoesAlerta} color="#F97316" />
      </Collapsible>
    </div>
  )
}

function ManejarScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<ManejarTab>('dor')
  const tabs = [
    { id: 'dor', label: 'Dor' },
    { id: 'dispneia', label: 'Dispneia' },
    { id: 'náusea', label: 'Náusea' },
    { id: 'delirium', label: 'Delirium' },
    { id: 'sedação', label: 'Sedação' },
    { id: 'final', label: 'Fase Final' },
  ]

  return (
    <div className="animate-fade-in">
      <BackButton onClick={onBack} />
      <ModuleHeader title="Manejar Sintomas" subtitle="Controle de sintomas em cuidados paliativos no DE" color="#F97316" />

      <TabBar tabs={tabs} active={tab} onSelect={id => setTab(id as ManejarTab)} />

      {tab === 'dor' && (
        <div>
          <AlertCard type="warning">
            <strong>Princípio:</strong> Opioides são a base do tratamento da dor moderada a grave em cuidados paliativos. Não há dose máxima — titular até alívio ou efeitos adversos intoleráveis.
          </AlertCard>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Escada analgésica (OMS modificada)</h4>
          <Collapsible title="Dor Leve (1-3)" badge="1" badgeColor="#10B981">
            <MedTable headers={['Medicação', 'Dose']} rows={dorLeve} />
          </Collapsible>
          <Collapsible title="Dor Moderada (4-6)" badge="2" badgeColor="#FBBF24">
            <MedTable headers={['Medicação', 'Dose']} rows={dorModerada} />
            <p className="text-xs text-text-muted mt-2">+ Analgésico simples</p>
          </Collapsible>
          <Collapsible title="Dor Intensa (7-10)" badge="3" badgeColor="#EF4444">
            <MedTable headers={['Medicação', 'Dose Inicial']} rows={dorIntensa} />
            <AlertCard type="success" className="mt-2">
              <strong>Dose de resgate:</strong> 10-15% da dose total diária, a cada 1-2h se necessário.
            </AlertCard>
          </Collapsible>
        </div>
      )}

      {tab === 'dispneia' && (
        <div>
          <AlertCard type="info">
            <strong>Lembrar:</strong> Dispneia é subjetiva. Tratar mesmo com SpO2 normal se paciente refere desconforto. Morfina é primeira linha.
          </AlertCard>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Tratamento Farmacológico</h4>
          <MedTable headers={['Medicação', 'Dose', 'Obs']} rows={dispneiaFarma} />
          <AlertCard type="warning" className="mt-3">
            <strong>Efeito teto:</strong> Morfina {'>'}20mg/24h geralmente não traz alívio adicional para dispneia. Considerar midazolam associado.
          </AlertCard>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Medidas não farmacológicas</h4>
          <BulletList items={dispneiaNaoFarma} />
        </div>
      )}

      {tab === 'náusea' && (
        <div>
          <AlertCard type="success">
            <strong>Avaliar causa:</strong> Constipação? Obstrução? Medicamentos? Hipertensão intracraniana? Metabólica?
          </AlertCard>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Tratamento por mecanismo</h4>
          <MedTable headers={['Causa/Medicação', 'Dose', 'Obs']} rows={náuseaFarma.map(r => ({ med: r.obs ? `${r.obs} — ${r.med}` : r.med, dose: r.dose, obs: undefined }))} />
          <AlertCard type="warning" className="mt-3">
            <strong>Obstrução intestinal:</strong> Considerar octreotide 100-300mcg SC 8/8h para reduzir secreções.
          </AlertCard>
        </div>
      )}

      {tab === 'delirium' && (
        <div>
          <AlertCard type="danger">
            <strong>Investigar causas reversíveis:</strong> Dor, retenção urinária, constipação, infecção, medicamentos (opioides, BZD), distúrbios metabólicos, hipóxia.
          </AlertCard>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Tratamento Farmacológico</h4>
          <MedTable headers={['Medicação', 'Dose', 'Via']} rows={deliriumFarma.map(r => ({ med: r.med, dose: r.dose, obs: r.via }))} />
          <AlertCard type="success" className="mt-3">
            <strong>Haloperidol:</strong> Iniciar 1mg SC/EV a cada 2h até controle, depois manter 6/6h ou 8/8h.
          </AlertCard>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Medidas não farmacológicas</h4>
          <BulletList items={deliriumNaoFarma} />
        </div>
      )}

      {tab === 'sedação' && (
        <div>
          <AlertCard type="danger">
            <strong>Indicação:</strong> Sintoma refratário (não responde a tratamento convencional) em paciente com doença terminal, causando sofrimento intolerável.
          </AlertCard>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Pré-requisitos (CFM)</h4>
          <BulletList items={sedaçãoPreReq} color="#EF4444" />
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Protocolo (Midazolam)</h4>
          <MedTable headers={['Etapa', 'Dose']} rows={sedaçãoProtocolo} />
          <AlertCard type="warning" className="mt-3">
            <strong>Alvo RASS:</strong> -3 a -4 (sedação moderada a profunda). Reavaliar a cada 4h. Manter via SC se EV indisponível.
          </AlertCard>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Alternativas</h4>
          <MedTable headers={['Medicação', 'Dose']} rows={sedaçãoAlternativas} />
        </div>
      )}

      {tab === 'final' && (
        <div>
          <AlertCard type="success">
            <strong>Definição:</strong> Paciente cuja morte é inevitável em curto período (dias a semanas), a despeito de todo cuidado médico.
          </AlertCard>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Sinais de Morte Iminente</h4>
          <div className="overflow-x-auto my-3 rounded-lg border border-border-card">
            <table className="w-full text-sm">
              <tbody>
                {sinaisMorteIminente.map((s, i) => (
                  <tr key={i} className="border-t border-border-card first:border-t-0">
                    <td className="px-3 py-2.5 text-text-primary text-xs">{s.sign}</td>
                    <td className="px-3 py-2.5 text-text-muted text-xs text-right">{s.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-muted">Tempo médio até óbito (mediana)</p>

          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Cuidados não farmacológicos</h4>
          <BulletList items={cuidadosFaseFinNaoFarma} />

          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Desprescrição</h4>
          <AlertCard type="success">
            <strong>SUSPENDER:</strong> Estatinas, AAS, hipoglicemiantes, insulina, anti-hipertensivos (avaliar), medicações preventivas.
          </AlertCard>
          <AlertCard type="danger">
            <strong>MANTER:</strong> Analgésicos, antieméticos, antissecretivos, anticonvulsivantes. <strong>Cuidado:</strong> Betabloqueadores e clonidina — reduzir gradualmente (risco de rebote).
          </AlertCard>
        </div>
      )}
    </div>
  )
}

function FerramentasScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<FerramentasTab>('ecog')
  const [hipoSub, setHipoSub] = useState<HipoSubTab>('indicacoes')
  const [selectedEcog, setSelectedEcog] = useState<number | null>(null)
  const [ppiValues, setPpiValues] = useState<Record<string, number>>({ pps: 0, oral: 0, edema: 0, dispneia: 0, delirium: 0 })
  const [opioidFrom, setOpioidFrom] = useState('morfina-vo')
  const [opioidTo, setOpioidTo] = useState('morfina-vo')
  const [opioidDose, setOpioidDose] = useState('')
  const [medSearch, setMedSearch] = useState('')

  const ppiScore = useMemo(() => Object.values(ppiValues).reduce((a, b) => a + b, 0), [ppiValues])
  const ppiResult = useMemo(() => interpretPPI(ppiScore), [ppiScore])

  const opioidResult = useMemo(() => {
    const dose = parseFloat(opioidDose)
    if (!dose || dose <= 0) return null
    const morfinaVOEquiv = dose * opioidFactors[opioidFrom]
    const result = morfinaVOEquiv / opioidFactors[opioidTo]
    const safeResult = result * 0.75
    return safeResult.toFixed(1)
  }, [opioidFrom, opioidTo, opioidDose])

  const filteredMeds = useMemo(() => {
    if (!medSearch.trim()) return hipoMedicações
    const q = medSearch.toLowerCase()
    return hipoMedicações.filter(m => m.name.toLowerCase().includes(q))
  }, [medSearch])

  const tabs = [
    { id: 'ecog', label: 'ECOG' },
    { id: 'pps', label: 'PPS' },
    { id: 'ppi', label: 'PPI' },
    { id: 'opioides', label: 'Opioides' },
    { id: 'hipo', label: 'Hipodermóclise' },
  ]

  const hipoTabs = [
    { id: 'indicacoes', label: 'Indicações' },
    { id: 'técnica', label: 'Técnica' },
    { id: 'medicações', label: 'Medicações' },
    { id: 'solucoes', label: 'Soluções' },
    { id: 'compat', label: 'Compatibilidade' },
    { id: 'complic', label: 'Complicações' },
  ]

  return (
    <div className="animate-fade-in">
      <BackButton onClick={onBack} />
      <ModuleHeader title="Ferramentas e Escalas" color="#10B981" />

      <TabBar tabs={tabs} active={tab} onSelect={id => setTab(id as FerramentasTab)} />

      {/* ECOG */}
      {tab === 'ecog' && (
        <div>
          <AlertCard type="success">
            <strong>ECOG Performance Status:</strong> Avalia capacidade funcional do paciente oncológico.
          </AlertCard>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {ecogLevels.map(e => (
              <button
                key={e.level}
                onClick={() => setSelectedEcog(e.level)}
                className={`text-center p-3 rounded-lg transition-colors border-2 ${
                  selectedEcog === e.level ? 'bg-accent text-white border-accent' : 'bg-bg-hover border-transparent text-text-primary'
                }`}
              >
                <div className="text-lg font-bold">{e.level}</div>
                <div className="text-xs mt-1">{e.label}</div>
              </button>
            ))}
          </div>
          <div className="overflow-x-auto mt-4 rounded-lg border border-border-card">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-bg-hover">
                  <th className="px-2 py-2 text-left font-semibold text-text-primary">ECOG</th>
                  <th className="px-2 py-2 text-left font-semibold text-text-primary">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {ecogLevels.filter(e => e.description).map(e => (
                  <tr key={e.level} className="border-t border-border-card">
                    <td className="px-2 py-2 text-text-primary font-semibold">{e.level}</td>
                    <td className="px-2 py-2 text-text-secondary">{e.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PPS */}
      {tab === 'pps' && (
        <div>
          <AlertCard type="success">
            <strong>Palliative Performance Scale:</strong> Avalia funcionalidade em pacientes paliativos. Escala de 0-100%.
          </AlertCard>
          <div className="overflow-x-auto mt-4 rounded-lg border border-border-card">
            <table className="w-full text-xs" style={{ minWidth: '500px' }}>
              <thead>
                <tr className="bg-bg-hover">
                  <th className="px-1.5 py-2 text-left font-semibold text-text-primary">PPS</th>
                  <th className="px-1.5 py-2 text-left font-semibold text-text-primary">Deambulação</th>
                  <th className="px-1.5 py-2 text-left font-semibold text-text-primary">Atividade</th>
                  <th className="px-1.5 py-2 text-left font-semibold text-text-primary">Autocuidado</th>
                  <th className="px-1.5 py-2 text-left font-semibold text-text-primary">Ingesta</th>
                  <th className="px-1.5 py-2 text-left font-semibold text-text-primary">Consciência</th>
                </tr>
              </thead>
              <tbody>
                {ppsLevels.map(p => (
                  <tr key={p.pps} className="border-t border-border-card">
                    <td className="px-1.5 py-2 text-text-primary font-bold">{p.pps}</td>
                    <td className="px-1.5 py-2 text-text-secondary">{p.deambulacao}</td>
                    <td className="px-1.5 py-2 text-text-secondary">{p.atividade}</td>
                    <td className="px-1.5 py-2 text-text-secondary">{p.autocuidado}</td>
                    <td className="px-1.5 py-2 text-text-secondary">{p.ingesta}</td>
                    <td className="px-1.5 py-2 text-text-secondary">{p.consciência}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PPI */}
      {tab === 'ppi' && (
        <div>
          <AlertCard type="info">
            <strong>Palliative Prognostic Index:</strong> Prediz sobrevida em pacientes oncológicos usando apenas critérios clínicos.
          </AlertCard>
          <div className="bg-bg-hover rounded-xl p-4 mt-4 border-2 border-border-card">
            <h4 className="text-sm font-semibold text-text-primary mb-4">Calculadora PPI</h4>
            {ppiOptions.map(group => (
              <div key={group.name} className="mb-4">
                <label className="text-xs font-medium text-text-primary block mb-2">{group.label}</label>
                {group.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPpiValues(prev => ({ ...prev, [group.name]: opt.value }))}
                    className={`flex items-center w-full px-3 py-2.5 rounded-lg mb-2 transition-colors border-2 ${
                      ppiValues[group.name] === opt.value
                        ? 'border-accent bg-accent/10'
                        : 'border-border-card bg-bg-elevated'
                    }`}
                  >
                    <span className="flex-1 text-xs text-text-primary text-left">{opt.text}</span>
                    <span className="text-xs font-semibold text-accent">{opt.score}</span>
                  </button>
                ))}
              </div>
            ))}
            <div className="bg-bg-elevated rounded-xl p-5 text-center mt-2">
              <div className="text-xs text-text-muted">Score PPI</div>
              <div className="text-4xl font-bold text-accent my-2">{ppiScore.toFixed(1)}</div>
              <div className={`rounded-lg p-3 text-xs font-semibold ${ppiResult.className}`}>
                {ppiResult.text}
              </div>
            </div>
          </div>
          <AlertCard type="success" className="mt-4">
            <strong>Interpretação:</strong><br />
            PPI {'<'}=2: ~155 dias | PPI {'>'}2 a {'<'}=4: ~89 dias | PPI {'>'}4 a {'<'}=6: ~18-21 dias | PPI {'>'}6: ~5 dias
          </AlertCard>
        </div>
      )}

      {/* Opioides */}
      {tab === 'opioides' && (
        <div>
          <AlertCard type="success">
            <strong>Equianalgesia:</strong> Use esta tabela para converter entre opioides. Sempre iniciar com 75% da dose calculada ao trocar.
          </AlertCard>
          <div className="bg-bg-hover rounded-xl p-4 mt-4">
            <h4 className="text-sm font-semibold text-text-primary mb-4">Calculadora de Conversão</h4>
            <div className="mb-3">
              <label className="text-xs font-medium text-text-primary block mb-1">Opioide Atual</label>
              <select
                value={opioidFrom}
                onChange={e => setOpioidFrom(e.target.value)}
                className="w-full p-3 bg-bg-elevated border-2 border-border-card rounded-lg text-sm text-text-primary"
              >
                {opioidOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="text-xs font-medium text-text-primary block mb-1">Dose em 24h</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Ex: 30"
                value={opioidDose}
                onChange={e => setOpioidDose(e.target.value)}
                className="w-full p-3 bg-bg-elevated border-2 border-border-card rounded-lg text-sm text-text-primary"
              />
            </div>
            <div className="mb-4">
              <label className="text-xs font-medium text-text-primary block mb-1">Converter para</label>
              <select
                value={opioidTo}
                onChange={e => setOpioidTo(e.target.value)}
                className="w-full p-3 bg-bg-elevated border-2 border-border-card rounded-lg text-sm text-text-primary"
              >
                {opioidOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="bg-bg-elevated border-2 border-accent rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-accent">
                {opioidResult ? `${opioidResult}` : '-'}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {opioidResult ? 'Dose equivalente em 24h (75% da dose calculada)' : 'Dose equivalente em 24h'}
              </div>
            </div>
          </div>
          <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Tabela de Equivalência (24h)</h4>
          <div className="overflow-x-auto rounded-lg border border-border-card">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-bg-hover">
                  <th className="px-2 py-2 text-left font-semibold text-text-primary">Opioide</th>
                  <th className="px-2 py-2 text-left font-semibold text-text-primary">Dose Equianalgesica</th>
                  <th className="px-2 py-2 text-left font-semibold text-text-primary">Fator</th>
                </tr>
              </thead>
              <tbody>
                {opioidEquivalenceTable.map((r, i) => (
                  <tr key={i} className="border-t border-border-card">
                    <td className="px-2 py-2 text-text-primary">{r.drug}</td>
                    <td className="px-2 py-2 text-text-secondary">{r.dose}</td>
                    <td className="px-2 py-2 text-text-muted">{r.factor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-muted mt-2">*Metadona: conversão não linear. Solicitar avaliação especializada para doses altas.</p>
        </div>
      )}

      {/* Hipodermóclise */}
      {tab === 'hipo' && (
        <div>
          <AlertCard type="success">
            <strong>Hipodermóclise:</strong> Infusão de fluidos no tecido subcutâneo. Alternativa simples, segura, de baixo custo, com reações adversas raras e geralmente reversíveis. Pode ser realizada em domicílio, ILPI, enfermaria e pronto atendimento.
          </AlertCard>

          <PillTabs tabs={hipoTabs} active={hipoSub} onSelect={id => setHipoSub(id as HipoSubTab)} />

          {hipoSub === 'indicacoes' && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Indicações</h4>
              <BulletList items={hipoIndicações} />
              <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Contraindicações</h4>
              <BulletList items={hipoContraindicações} color="#EF4444" />
              <AlertCard type="warning" className="mt-3">
                Evitar regiões irradiadas (radioterapia) e membros com esvaziamento ganglionar ou mastectomia.
              </AlertCard>
            </div>
          )}

          {hipoSub === 'técnica' && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Volume por Local de Punção (24h)</h4>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {volumesPorLocal.map((v, i) => (
                  <div
                    key={i}
                    className={`bg-bg-elevated border border-border-card rounded-lg p-3 text-center ${v.fullWidth ? 'col-span-2' : ''}`}
                  >
                    <div className="text-xs font-semibold text-text-primary mb-1">{v.region}</div>
                    <div className="text-xs font-bold text-accent">{v.volume}</div>
                  </div>
                ))}
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Dispositivos</h4>
              <div className="overflow-x-auto rounded-lg border border-border-card">
                <table className="w-full text-xs">
                  <thead><tr className="bg-bg-hover">
                    <th className="px-2 py-2 text-left font-semibold text-text-primary">Dispositivo</th>
                    <th className="px-2 py-2 text-left font-semibold text-text-primary">Calibre</th>
                    <th className="px-2 py-2 text-left font-semibold text-text-primary">Permanência</th>
                  </tr></thead>
                  <tbody>
                    {dispositivos.map((d, i) => (
                      <tr key={i} className="border-t border-border-card">
                        <td className="px-2 py-2 text-text-primary">{d.device}</td>
                        <td className="px-2 py-2 text-text-secondary">{d.calibre}</td>
                        <td className="px-2 py-2 text-text-muted">{d.permanence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-text-muted mt-2">Cateter não agulhado: menor risco de acidente perfurocortante e reações alérgicas vs. escalpe (níquel).</p>
              <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Procedimento</h4>
              <StepsList steps={hipoProcedimento} />
            </div>
          )}

          {hipoSub === 'medicações' && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Medicações por Via Subcutânea</h4>
              <div className="relative mb-4">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="#888">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar medicamento..."
                  value={medSearch}
                  onChange={e => setMedSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-bg-elevated border border-border-card rounded-xl text-sm text-text-primary placeholder:text-text-muted"
                />
              </div>
              {filteredMeds.length === 0 && (
                <p className="text-center text-sm text-text-muted py-5">Nenhum medicamento encontrado</p>
              )}
              <div className="space-y-2.5">
                {filteredMeds.map((m, i) => (
                  <div key={i} className="bg-bg-elevated border border-border-card rounded-lg p-3">
                    <h5 className="text-sm font-semibold text-accent mb-1.5">{m.name}</h5>
                    <div className="flex justify-between py-1 border-b border-border-card text-xs">
                      <span className="text-text-muted">Dose:</span>
                      <span className="text-text-primary text-right">{m.dose}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-card text-xs">
                      <span className="text-text-muted">Diluição:</span>
                      <span className="text-text-primary text-right">{m.dilution}</span>
                    </div>
                    {m.obs && (
                      <p className="text-xs text-text-muted mt-1.5 pt-1.5 border-t border-border-card">{m.obs}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-3">Fonte: Azevedo et al. / Manual de Cuidados Paliativos na Emergência, USP 2021</p>
            </div>
          )}

          {hipoSub === 'solucoes' && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Soluções por Via Subcutânea</h4>
              <div className="overflow-x-auto rounded-lg border border-border-card">
                <table className="w-full text-xs">
                  <thead><tr className="bg-bg-hover">
                    <th className="px-2 py-2 text-left font-semibold text-text-primary">Solução</th>
                    <th className="px-2 py-2 text-left font-semibold text-text-primary">Dose Max</th>
                    <th className="px-2 py-2 text-left font-semibold text-text-primary">Orientações</th>
                  </tr></thead>
                  <tbody>
                    {hipoSolucoes.map((s, i) => (
                      <tr key={i} className="border-t border-border-card">
                        <td className="px-2 py-2 text-text-primary">{s.solução}</td>
                        <td className="px-2 py-2 text-text-secondary">{s.doseMax}</td>
                        <td className="px-2 py-2 text-text-muted">{s.orientações}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hipoSub === 'compat' && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Compatibilidade de Medicamentos em Mesma Infusão</h4>
              <p className="text-xs text-text-muted mb-2">Deslize horizontalmente para ver a tabela completa</p>
              <div className="overflow-x-auto rounded-lg border border-border-card">
                <table className="text-xs" style={{ minWidth: '700px' }}>
                  <thead>
                    <tr className="bg-bg-hover">
                      <th className="px-1 py-1.5 text-left font-semibold text-text-primary sticky left-0 bg-bg-primary z-10 min-w-[80px]" />
                      {compatHeaders.map(h => (
                        <th key={h} className="px-1 py-1.5 text-center font-semibold text-text-primary min-w-[32px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compatRows.map((row, i) => (
                      <tr key={i} className="border-t border-border-card">
                        <td className={`px-1 py-1.5 font-semibold sticky left-0 bg-bg-primary z-10 ${row.drug === 'Dexametasona' ? 'text-red-500' : 'text-text-primary'}`}>
                          {row.drug}
                        </td>
                        {row.compat.map((c, j) => (
                          <td key={j} className={`px-1 py-1.5 text-center font-bold ${c === 'C' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AlertCard type="danger" className="mt-3">
                <strong>Dexametasona:</strong> incompatível com TODOS os medicamentos — sempre usar sítio exclusivo.
              </AlertCard>
              <p className="text-xs text-text-muted mt-2">C = compatível | I = incompatível. Fonte: Azevedo e Barbosa.</p>
            </div>
          )}

          {hipoSub === 'complic' && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Complicações</h4>
              <div className="space-y-2.5">
                <Card>
                  <h5 className="text-sm font-semibold text-accent mb-1">Relacionadas à técnica e materiais</h5>
                  <p className="text-xs text-text-muted">Punções {'>'} 72h favorecem reações locais (rubor, calor). Escalpe causa mais reações que cateter não agulhado.</p>
                </Card>
                <Card>
                  <h5 className="text-sm font-semibold text-accent mb-1">Relacionadas às medicações</h5>
                  <p className="text-xs text-text-muted">Extremos de pH (ácido {'<'} 2, alcalino {'>'} 11) aumentam risco de reações, podendo causar necrose tecidual.</p>
                </Card>
                <Card>
                  <h5 className="text-sm font-semibold text-accent mb-1">Relacionadas às soluções</h5>
                  <p className="text-xs text-text-muted">Soluções hipo/hipertônicas podem causar dor e rubor pela diferença com tonicidade fisiológica. Preferir soluções isotônicas.</p>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MitosScreen({ onBack }: { onBack: () => void }) {
  const [selectedMyth, setSelectedMyth] = useState<MythData | null>(null)

  const categories: { key: MythData['category']; label: string }[] = [
    { key: 'conceito', label: 'Sobre o Conceito' },
    { key: 'medicações', label: 'Sobre Medicações' },
    { key: 'comunicação', label: 'Sobre Comunicação' },
    { key: 'prognóstico', label: 'Sobre Prognóstico' },
  ]

  return (
    <div className="animate-fade-in">
      <BackButton onClick={onBack} />
      <ModuleHeader title="Mitos e Verdades" color="#EF4444" />
      <p className="text-sm text-text-muted mb-4">Clique em um card para ver a explicação</p>

      {categories.map(cat => {
        const myths = mythsData.filter(m => m.category === cat.key)
        return (
          <div key={cat.key} className="mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3 pl-2 border-l-4 border-accent">{cat.label}</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {myths.map(myth => (
                <button
                  key={myth.id}
                  onClick={() => setSelectedMyth(myth)}
                  className="bg-bg-elevated border-2 border-border-card rounded-xl p-3 text-center min-h-[80px] flex flex-col items-center justify-center active:border-red-500 active:translate-y-[-2px] transition-all"
                >
                  <div className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs mb-1.5">
                    {myth.id}
                  </div>
                  <div className="text-xs text-text-primary leading-tight">{myth.title}</div>
                </button>
              ))}
            </div>
          </div>
        )
      })}

      <Modal open={!!selectedMyth} onClose={() => setSelectedMyth(null)} title={selectedMyth?.title || ''} width="500px">
        {selectedMyth && (
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4 ${
              selectedMyth.isMito ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
            }`}>
              {selectedMyth.isMito ? 'MITO' : 'VERDADE'}
            </div>
            <div className="bg-bg-hover rounded-lg p-4 mb-4 text-base font-semibold text-text-primary">
              {selectedMyth.statement}
            </div>
            <p className="text-sm text-text-secondary text-left leading-relaxed">
              {selectedMyth.explanation}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ReferênciasScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="animate-fade-in">
      <BackButton onClick={onBack} />
      <ModuleHeader title="Referências" color="#3B82F6" />

      {referências.map((cat, i) => (
        <Collapsible key={i} title={cat.title}>
          <BulletList items={cat.items} color={cat.color} />
        </Collapsible>
      ))}
    </div>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function PaliaPath() {
  const [screen, setScreen] = useState<Screen>('home')

  function navigate(s: Screen) {
    setScreen(s)
    window.scrollTo(0, 0)
  }

  const fabItems = [
    { label: 'Início', onClick: () => navigate('home') },
    { label: 'Identificar', onClick: () => navigate('identificar') },
    { label: 'Decidir', onClick: () => navigate('decidir') },
    { label: 'Comunicar', onClick: () => navigate('comunicar') },
    { label: 'Manejar', onClick: () => navigate('manejar') },
    { label: 'Ferramentas', onClick: () => navigate('ferramentas') },
  ]

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="PaliaPath" subtitle="Cuidados Paliativos no DE" />
      <Container className="px-5">
        {screen === 'home' && <HomeScreen onNavigate={navigate} />}
        {screen === 'identificar' && <IdentificarScreen onBack={() => navigate('home')} />}
        {screen === 'decidir' && <DecidirScreen onBack={() => navigate('home')} />}
        {screen === 'comunicar' && <ComunicarScreen onBack={() => navigate('home')} />}
        {screen === 'manejar' && <ManejarScreen onBack={() => navigate('home')} />}
        {screen === 'ferramentas' && <FerramentasScreen onBack={() => navigate('home')} />}
        {screen === 'mitos' && <MitosScreen onBack={() => navigate('home')} />}
        {screen === 'referências' && <ReferênciasScreen onBack={() => navigate('home')} />}
      </Container>
      <Footer toolName="Palia Path" version="v4.0.0" updatedAt="Agosto 2026" />
      <FABMenu items={fabItems} />
      <ToastContainer />
    </div>
  )
}
