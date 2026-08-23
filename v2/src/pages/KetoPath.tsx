import { useState, useMemo } from 'react'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { Collapsible } from '../components/common/Collapsible'
import { AlertCard } from '../components/common/AlertCard'
import { useWeight } from '../contexts/WeightContext'
import { fmt } from '../utils/formatters'
import {
  anionGap, sodioCorrigido, osmolaridadeEfetiva, deficitAguaLivre, gravidadeCAD,
} from '../utils/ketoCalc'
import { KetoManejo, Paragrafos, btn, campo } from '../components/clinical/KetoManejo'
import { KetoMonitor, KetoResolucao } from '../components/clinical/KetoMonitor'
import { KetoPlanilha } from '../components/clinical/KetoPlanilha'
import type { KetoDados, Trilha, Cetonuria, Consciencia } from '../data/ketoData'
import * as K from '../data/ketoData'

export default function KetoPath() {
  const { weight, setWeight } = useWeight()
  const [dados, setDados] = useState<KetoDados>(K.KETO_DADOS_VAZIO)
  const [textos, setTextos] = useState<Record<string, string>>({})
  const [trilha, setTrilha] = useState<Trilha>('cad')
  const [reavaliadoEm, setReavaliadoEm] = useState<string | null>(null)
  const [pesoTxt, setPesoTxt] = useState(weight !== null ? String(weight) : '')

  function setCampo(id: string, valor: string) {
    setTextos(t => ({ ...t, [id]: valor }))
    const n = parseFloat(valor.replace(',', '.'))
    setDados(d => ({ ...d, [id]: isNaN(n) ? null : n }))
  }

  /** Limpa os laboratoriais mantendo o peso, e marca o horario. */
  function reavaliar() {
    setDados(K.KETO_DADOS_VAZIO)
    setTextos({})
    setReavaliadoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
  }

  const naCorr = dados.sodio !== null && dados.glicemia !== null
    ? sodioCorrigido(dados.sodio, dados.glicemia) : null
  const gravidade = useMemo(
    () => gravidadeCAD(dados.phVenoso, dados.bicarbonato, dados.nivelConsciencia),
    [dados.phVenoso, dados.bicarbonato, dados.nivelConsciencia]
  )

  function irPara(id: string) {
    document.getElementById(`keto-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="KetoPath" subtitle="Crises hiperglicêmicas · adultos e adolescentes ≥15 anos" />
      <Container>

        {/* ─────────── Grade de acesso rápido ─────────── */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {K.KETO_SECOES.map(s => (
            <button key={s.id} onClick={() => irPara(s.id)}
              className="px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border-card text-[11px] text-text-secondary cursor-pointer active:bg-bg-hover transition-colors">
              {s.label}
            </button>
          ))}
        </div>

        {/* ─────────── Painel de dados ─────────── */}
        <div className="bg-bg-card border border-border-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-bold text-text-primary">Dados do paciente</span>
            <button onClick={reavaliar}
              className="text-xs px-3 py-1.5 rounded-lg border border-border-card bg-bg-hover text-text-secondary cursor-pointer min-h-[36px]">
              Reavaliar
            </button>
          </div>
          {reavaliadoEm && (
            <p className="text-xs text-info mb-3">Última reavaliação às {reavaliadoEm}</p>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="text-xs text-text-muted">Peso (kg)</span>
              <input type="text" inputMode="decimal" value={pesoTxt} placeholder="70"
                onChange={e => {
                  setPesoTxt(e.target.value)
                  const n = parseFloat(e.target.value.replace(',', '.'))
                  setWeight(!isNaN(n) && n >= 40 && n <= 200 ? n : null)
                }}
                className={campo} />
            </label>
            {K.KETO_CAMPOS.map(c => (
              <label key={c.id} className="block">
                <span className="text-xs text-text-muted">
                  {c.label}{c.unidade && ` (${c.unidade})`}{!c.obrigatorio && ' · opcional'}
                </span>
                <input type="text" inputMode="decimal" value={textos[c.id] ?? ''}
                  onChange={e => setCampo(c.id, e.target.value)} className={campo} />
              </label>
            ))}
          </div>

          <div className="mt-3">
            <span className="text-xs text-text-muted">Cetonúria</span>
            <div className="flex gap-1.5 mt-1">
              {K.CETONURIA_OPCOES.map(o => (
                <button key={o} onClick={() => setDados(d => ({ ...d, cetonuria: d.cetonuria === o ? null : o }))}
                  className={`${btn(dados.cetonuria === o)} px-1`}>{o}</button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <span className="text-xs text-text-muted">Nível de consciência</span>
            <div className="flex gap-1.5 mt-1">
              {K.CONSCIENCIA_OPCOES.map(o => (
                <button key={o.id}
                  onClick={() => setDados(d => ({ ...d, nivelConsciencia: d.nivelConsciencia === o.id ? null : o.id }))}
                  className={`${btn(dados.nivelConsciencia === o.id)} text-xs px-1`}>{o.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ─────────── 1. RECONHECIMENTO ─────────── */}
        <Secao id="reconhecimento" titulo="1. Reconhecimento" />

        <Collapsible title="1.1 Quando suspeitar">
          <Paragrafos textos={K.QUANDO_SUSPEITAR} />
          <AlertCard type="warning" title="Dor abdominal">
            <p className="leading-relaxed">{K.ALERTA_DOR_ABDOMINAL}</p>
          </AlertCard>
        </Collapsible>

        <AlertCard type="danger" title="1.2 CAD euglicêmica">
          <Paragrafos textos={K.CAD_EUGLICEMICA} />
        </AlertCard>

        <Collapsible title="1.3 Critérios diagnósticos — CAD" defaultOpen={false}>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Os três componentes precisam estar presentes. [ADA]
          </p>
          <div className="rounded-xl overflow-hidden border border-border-card mb-3">
            <table className="w-full text-xs">
              <tbody>
                {K.CRITERIOS_CAD.map(c => (
                  <tr key={c.eixo} className="border-t border-border first:border-t-0">
                    <td className="px-3 py-2 text-text-primary font-semibold align-top whitespace-nowrap">{c.eixo}</td>
                    <td className="px-3 py-2 text-text-secondary leading-relaxed">{c.criterio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-muted leading-relaxed italic mb-2">{K.NOTA_CRITERIOS_CAD}</p>
          <p className="text-sm text-text-secondary leading-relaxed">{K.NOTA_GASOMETRIA}</p>
          <p className="text-xs text-text-muted mt-3 leading-relaxed">{K.NOTA_UNIDADES}</p>
        </Collapsible>

        <AlertCard type="warning" title="1.4 Discordância da cetonúria">
          <Paragrafos textos={K.DISCORDANCIA_CETONURIA} />
        </AlertCard>

        <div className="mb-3">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">1.5 Bifurcação</div>
          <div className="flex gap-2 mb-3">
            {([['cad', 'CAD'], ['ehh', 'EHH'], ['misto', 'Misto']] as [Trilha, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setTrilha(id)} className={btn(trilha === id)}>{label}</button>
            ))}
          </div>
          <Paragrafos textos={K.SOBREPOSICAO_CAD_EHH} />
          <Collapsible title="Critérios do EHH — referência">
            <ul className="space-y-1 mb-3">
              {K.CRITERIOS_EHH.map((c, i) => (
                <li key={i} className="text-sm text-text-secondary leading-relaxed">• {c}</li>
              ))}
            </ul>
            <p className="text-sm text-text-secondary leading-relaxed">{K.NOTA_EHH}</p>
          </Collapsible>
        </div>

        <Collapsible title="1.6 Gravidade — CAD" badge={gravidade ?? undefined}
          badgeColor={gravidade === 'grave' ? '#F44336' : gravidade === 'moderada' ? '#FFC107' : '#4CAF50'}>
          <div className="rounded-xl overflow-hidden border border-border-card mb-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-bg-hover text-text-muted">
                  <th className="text-left px-2 py-2 font-semibold" />
                  <th className="text-left px-2 py-2 font-semibold">Leve</th>
                  <th className="text-left px-2 py-2 font-semibold">Moderada</th>
                  <th className="text-left px-2 py-2 font-semibold">Grave</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Glicemia', '≥200 mg/dL', '≥200 mg/dL', '≥200 mg/dL'],
                  ['pH venoso', '>7,25 a <7,30', '7,00–7,25', '<7,00'],
                  ['Bicarbonato', '15–18 mEq/L', '10 a <15 mEq/L', '<10 mEq/L'],
                  ['Consciência', 'alerta', 'alerta ou sonolento', 'estupor ou coma'],
                  ['Cuidado sugerido', 'unidade regular ou observação', 'unidade intermediária', 'UTI'],
                ].map(([rot, ...cols]) => (
                  <tr key={rot} className="border-t border-border">
                    <td className="px-2 py-2 text-text-muted font-semibold align-top">{rot}</td>
                    {cols.map((c, i) => {
                      const nivel = ['leve', 'moderada', 'grave'][i]
                      const ativa = gravidade === nivel
                      return (
                        <td key={i} className={`px-2 py-2 leading-relaxed ${ativa ? 'text-accent font-bold' : 'text-text-secondary'}`}
                          style={ativa ? { background: 'rgba(255,82,82,0.12)' } : undefined}>{c}</td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {gravidade === null && (
            <p className="text-sm text-warning leading-relaxed mb-2">
              Sem pH ou bicarbonato dentro das faixas de acidose, a gravidade não é classificada.
            </p>
          )}
          <p className="text-sm text-text-secondary leading-relaxed">{K.NOTA_GRAVIDADE}</p>
          <p className="text-xs text-text-muted mt-3 leading-relaxed">{K.NOTA_UNIDADES}</p>
        </Collapsible>

        <Collapsible title="1.7 Diagnóstico diferencial">
          <Paragrafos textos={K.DIAGNOSTICO_DIFERENCIAL} />
        </Collapsible>

        {/* ─────────── 2. EXAMES ─────────── */}
        <Secao id="exames" titulo="2. Exames iniciais" />
        <Collapsible title="Painel inicial e avaliação">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Se houver suspeita de CAD ou EHH
          </div>
          <ul className="space-y-1 mb-3">
            {K.PAINEL_INICIAL.map(e => (
              <li key={e} className="text-sm text-text-secondary leading-relaxed">• {e}</li>
            ))}
          </ul>
          <AlertCard type="info" title="Sobre o eletrocardiograma">
            <p className="leading-relaxed">{K.NOTA_ECG}</p>
          </AlertCard>
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-4">
            Avaliação de volemia
          </div>
          <Paragrafos textos={K.AVALIACAO_VOLEMIA} />
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-4">
            Conforme suspeita clínica
          </div>
          <div className="rounded-xl overflow-hidden border border-border-card">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-bg-hover text-text-muted">
                  <th className="text-left px-3 py-2 font-semibold">Exame</th>
                  <th className="text-left px-3 py-2 font-semibold">Quando considerar</th>
                </tr>
              </thead>
              <tbody>
                {K.EXAMES_CONFORME_SUSPEITA.map(e => (
                  <tr key={e.exame} className="border-t border-border">
                    <td className="px-3 py-2 text-text-secondary">{e.exame}</td>
                    <td className="px-3 py-2 text-text-secondary">{e.gatilho}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Collapsible>

        {/* ─────────── 3. CALCULADORAS ─────────── */}
        <Secao id="calculadoras" titulo="3. Calculadoras" />
        <Calculadoras dados={dados} peso={weight} naCorr={naCorr} trilha={trilha} />

        {/* ─────────── 4. MANEJO ─────────── */}
        <Secao id="manejo" titulo="4. Manejo" sufixo={trilha.toUpperCase()} />
        <KetoManejo dados={dados} peso={weight} trilha={trilha} />

        {/* ─────────── 5. MONITORIZAÇÃO ─────────── */}
        <Secao id="monitorizacao" titulo="5. Monitorização e titulação" />
        <KetoMonitor peso={weight} trilha={trilha} />

        {/* ─────────── 6. PLANILHA ─────────── */}
        <Secao id="planilha" titulo="6. Planilha de acompanhamento" />
        <KetoPlanilha />

        {/* ─────────── 7. RESOLUÇÃO ─────────── */}
        <Secao id="resolucao" titulo="7. Resolução e transição" />
        <KetoResolucao peso={weight} trilha={trilha} />

        {/* ─────────── 8. ARMADILHAS ─────────── */}
        <Secao id="armadilhas" titulo="8. Armadilhas" />
        {K.ARMADILHAS.map(a => (
          <Collapsible key={a.titulo} title={a.titulo}>
            <Paragrafos textos={a.textos} />
          </Collapsible>
        ))}

        {/* ─────────── 9. FATOR PRECIPITANTE ─────────── */}
        <Secao id="precipitante" titulo="9. Fator precipitante" />
        <FatorPrecipitante />

        {/* ─────────── 10. DISPOSIÇÃO ─────────── */}
        <Secao id="disposicao" titulo="10. Disposição" />
        <Collapsible title="Nível de cuidado sugerido" badge={gravidade ?? undefined}
          badgeColor={gravidade === 'grave' ? '#F44336' : gravidade === 'moderada' ? '#FFC107' : '#4CAF50'}>
          {gravidade ? (
            <AlertCard type={gravidade === 'grave' ? 'danger' : gravidade === 'moderada' ? 'warning' : 'success'}
              title={`CAD ${gravidade}`}>
              <p className="text-base font-semibold text-text-primary">{K.DISPOSICAO[gravidade]}</p>
            </AlertCard>
          ) : (
            <p className="text-sm text-warning leading-relaxed mb-3">
              Informe pH venoso ou bicarbonato no painel para a gravidade ser calculada.
            </p>
          )}
          <Paragrafos textos={K.DISPOSICAO_TEXTOS} />
        </Collapsible>

        {/* ─────────── 11. REFERÊNCIAS ─────────── */}
        <Secao id="referencias" titulo="11. Referências" />
        <Collapsible title="Fontes consultadas">
          <ol className="space-y-2">
            {K.REFERENCIAS.map((r, i) => (
              <li key={i} className="text-xs text-text-secondary leading-relaxed">
                {i + 1}. {r.texto}{' '}
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-info underline break-all">
                    {r.url}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </Collapsible>

      </Container>
      <Footer toolName="KetoPath" version="v1.0.0" updatedAt="Agosto 2026" />
    </div>
  )
}

function Secao({ id, titulo, sufixo }: { id: string; titulo: string; sufixo?: string }) {
  return (
    <div id={`keto-${id}`} className="flex items-center gap-2 mt-6 mb-3 scroll-mt-[120px]">
      <h2 className="text-[17px] font-bold text-text-primary">{titulo}</h2>
      {sufixo && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-muted text-accent">{sufixo}</span>
      )}
    </div>
  )
}

function Calculadoras({ dados, peso, naCorr, trilha }: {
  dados: KetoDados; peso: number | null; naCorr: number | null; trilha: Trilha
}) {
  const [sexo, setSexo] = useState<'M' | 'F'>('M')
  const [idoso, setIdoso] = useState(false)
  const ehEhh = trilha === 'ehh' || trilha === 'misto'

  const ag = dados.sodio !== null && dados.cloro !== null && dados.bicarbonato !== null
    ? anionGap(dados.sodio, dados.cloro, dados.bicarbonato) : null
  const osm = dados.sodio !== null && dados.glicemia !== null
    ? osmolaridadeEfetiva(dados.sodio, dados.glicemia) : null
  const deficit = ehEhh && peso && naCorr !== null ? deficitAguaLivre(peso, sexo, idoso, naCorr) : null

  return (
    <>
      <Collapsible title="3.1 Ânion-gap" badge={ag !== null ? `${ag} mEq/L` : undefined} badgeColor="#2196F3">
        <p className="text-sm text-text-secondary mb-2">AG = Na − (Cl + HCO₃)</p>
        {ag !== null ? (
          <AlertCard type={ag > 12 ? 'warning' : 'info'} title={`${ag} mEq/L`}>
            <p className="leading-relaxed">
              {ag > 12
                ? 'Ânion-gap acima de 12 mEq/L indica acidose metabólica com ânion-gap elevado, compatível com CAD. [ADA]'
                : 'Ânion-gap dentro da faixa habitual.'}
            </p>
          </AlertCard>
        ) : (
          <p className="text-sm text-warning">Informe sódio, cloro e bicarbonato no painel.</p>
        )}
        <p className="text-xs text-text-muted mt-3 leading-relaxed">{K.NOTA_ANION_GAP}</p>
        <p className="text-xs text-text-muted mt-2 leading-relaxed">{K.NOTA_UNIDADES}</p>
      </Collapsible>

      <Collapsible title="3.2 Sódio corrigido" badge={naCorr !== null ? `${fmt(naCorr, 1)} mEq/L` : undefined} badgeColor="#2196F3">
        <p className="text-sm text-text-secondary mb-2">Na corrigido = Na medido + 2,0 × [(glicemia − 100) / 100]</p>
        {naCorr !== null ? (
          <AlertCard type="info" title={`${fmt(naCorr, 1)} mEq/L`}>
            <p className="leading-relaxed">
              {naCorr < 135 ? K.FASE_B.abaixo135 : K.FASE_B.acima135}
            </p>
          </AlertCard>
        ) : (
          <p className="text-sm text-warning">Informe sódio e glicemia no painel.</p>
        )}
        <p className="text-xs text-text-muted mt-3 leading-relaxed">{K.NOTA_SODIO_CORRIGIDO}</p>
      </Collapsible>

      <Collapsible title="3.3 Osmolaridade efetiva" badge={osm !== null ? `${osm} mOsm/kg` : undefined} badgeColor="#2196F3">
        <p className="text-sm text-text-secondary mb-2">Osm efetiva = (2 × Na) + (glicemia / 18)</p>
        <p className="text-xs text-text-muted mb-2">Usa o sódio medido, não o corrigido.</p>
        {osm !== null ? (
          <div className="bg-bg-hover rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-accent">{osm}</div>
            <div className="text-sm text-text-muted">mOsm/kg</div>
          </div>
        ) : (
          <p className="text-sm text-warning">Informe sódio e glicemia no painel.</p>
        )}
      </Collapsible>

      {ehEhh && (
        <Collapsible title="3.4 Déficit de água livre" badge="EHH" badgeColor="#FF5252">
          <p className="text-sm text-text-secondary mb-1">ACT = peso × fator</p>
          <p className="text-sm text-text-secondary mb-3">Déficit = ACT × [(Na corrigido / 140) − 1]</p>
          <div className="flex gap-2 mb-2">
            {(['M', 'F'] as const).map(s => (
              <button key={s} onClick={() => setSexo(s)} className={btn(sexo === s)}>
                {s === 'M' ? 'Homem' : 'Mulher'}
              </button>
            ))}
          </div>
          <button onClick={() => setIdoso(!idoso)} className={`${btn(idoso)} w-full mb-3`}>
            {idoso ? '✓ ' : ''}Idoso
          </button>
          {deficit !== null ? (
            <div className="bg-bg-hover rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-accent">{fmt(deficit, 1)} L</div>
              <div className="text-sm text-text-muted">déficit estimado</div>
            </div>
          ) : (
            <p className="text-sm text-warning">Informe peso, sódio e glicemia no painel.</p>
          )}
          <p className="text-xs text-text-muted mt-3 leading-relaxed">{K.NOTA_DEFICIT_AGUA}</p>
        </Collapsible>
      )}
    </>
  )
}

function FatorPrecipitante() {
  const [marcados, setMarcados] = useState<Record<string, boolean>>({})
  return (
    <Collapsible title="Checklist de causas">
      <p className="text-sm text-text-secondary leading-relaxed mb-3">{K.FATOR_PRECIPITANTE_INTRO}</p>
      <div className="space-y-2">
        {K.FATORES_PRECIPITANTES.map(f => (
          <div key={f.id}>
            <button onClick={() => setMarcados(m => ({ ...m, [f.id]: !m[f.id] }))}
              className="flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg bg-bg-hover min-h-[44px] cursor-pointer">
              <span className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                marcados[f.id] ? 'bg-success border-success text-black' : 'border-border-card'}`}>
                {marcados[f.id] ? '✓' : ''}
              </span>
              <span className="flex-1">
                <span className={`block text-sm leading-relaxed ${marcados[f.id] ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                  {f.label}
                </span>
                <span className="block text-xs text-text-muted leading-relaxed mt-0.5">{f.nota}</span>
              </span>
            </button>
            {f.id === 'isglt2' && marcados[f.id] && (
              <AlertCard type="warning" title="Inibidor de SGLT2">
                <Paragrafos textos={K.NOTA_ISGLT2} />
              </AlertCard>
            )}
          </div>
        ))}
      </div>
      <AlertCard type="info" title="Rastreio de saúde mental">
        <p className="leading-relaxed">{K.RASTREIO_SAUDE_MENTAL}</p>
      </AlertCard>
    </Collapsible>
  )
}
