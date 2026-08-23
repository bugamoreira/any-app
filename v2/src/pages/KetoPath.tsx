import { useState, useMemo, useCallback } from 'react'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
import { Button } from '../components/common/Button'
import { AlertCard } from '../components/common/AlertCard'
import { useWeight } from '../contexts/WeightContext'
import { fmt } from '../utils/formatters'
import { sodioCorrigido, gravidadeCAD } from '../utils/ketoCalc'
import { PassoFluidos, PassoPotassio, PassoInsulina, PassoAdjuvantes, Paragrafos, btn, campo, semFonte } from '../components/clinical/KetoManejo'
import { KetoMonitor, KetoResolucao } from '../components/clinical/KetoMonitor'
import { KetoPlanilha } from '../components/clinical/KetoPlanilha'
import {
  TelaReconhecimento, TelaExames, TelaCalculadoras, TelaArmadilhas, TelaPrecipitante, TelaReferencias,
} from '../components/clinical/KetoConsulta'
import type { FABItem } from '../types/clinical'
import type { KetoDados, Trilha } from '../data/ketoData'
import * as K from '../data/ketoData'

/**
 * KetoPath — maquina de tela, no padrao das outras ferramentas do app
 * (ShockPath tem 15 telas, ToxPath 8, PaliaPath 8).
 *
 * A primeira versao entregava as 11 secoes empilhadas num rolo unico. A propria
 * spec (secao 4) ja pedia "navegacao hibrida: fluxo linear guiado + grade de
 * acesso rapido" — era isso que faltava.
 */
type Screen =
  | 'home'
  | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8'
  | 'reconhecimento' | 'exames' | 'calculadoras' | 'planilha'
  | 'armadilhas' | 'precipitante' | 'referencias'

const PASSOS = [
  { id: 'p1', n: 1, titulo: 'Dados do paciente' },
  { id: 'p2', n: 2, titulo: 'Classificação' },
  { id: 'p3', n: 3, titulo: 'Fluidos' },
  { id: 'p4', n: 4, titulo: 'Potássio' },
  { id: 'p5', n: 5, titulo: 'Insulina' },
  { id: 'p6', n: 6, titulo: 'Adjuvantes' },
  { id: 'p7', n: 7, titulo: 'Monitorização' },
  { id: 'p8', n: 8, titulo: 'Resolução' },
] as const

const CARDS: { id: Screen; titulo: string; sub: string; destaque?: boolean; icon: React.ReactNode }[] = [
  {
    id: 'p1', titulo: 'Avaliação guiada', sub: '8 passos', destaque: true,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  },
  {
    id: 'reconhecimento', titulo: 'Reconhecer', sub: 'É CAD? É EHH?',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  },
  {
    id: 'calculadoras', titulo: 'Calculadoras', sub: 'AG · Na · Osm',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="10" y2="11"/><line x1="14" y1="11" x2="16" y2="11"/><line x1="8" y1="16" x2="10" y2="16"/><line x1="14" y1="16" x2="16" y2="16"/></svg>,
  },
  {
    id: 'planilha', titulo: 'Planilha', sub: 'imprimir',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  },
  {
    id: 'exames', titulo: 'Exames', sub: 'painel inicial',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.5L5 18a2 2 0 001.7 3h10.6A2 2 0 0019 18l-5-8.5V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg>,
  },
  {
    id: 'armadilhas', titulo: 'Armadilhas', sub: '7 riscos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  },
  {
    id: 'precipitante', titulo: 'Precipitante', sub: 'checklist',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11H4a1 1 0 00-1 1v7a1 1 0 001 1h5m0-9v9m0-9l6-4v17l-6-4"/><path d="M18 8a4 4 0 010 8"/></svg>,
  },
  {
    id: 'referencias', titulo: 'Referências', sub: '6 fontes',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  },
]

const TITULOS: Record<string, string> = {
  reconhecimento: 'Reconhecimento', exames: 'Exames iniciais', calculadoras: 'Calculadoras',
  planilha: 'Planilha de acompanhamento', armadilhas: 'Armadilhas',
  precipitante: 'Fator precipitante', referencias: 'Referências',
}

export default function KetoPath() {
  const { weight, setWeight } = useWeight()
  const [screen, setScreen] = useState<Screen>('home')
  const [dados, setDados] = useState<KetoDados>(K.KETO_DADOS_VAZIO)
  const [textos, setTextos] = useState<Record<string, string>>({})
  const [trilha, setTrilha] = useState<Trilha>('cad')
  const [reavaliadoEm, setReavaliadoEm] = useState<string | null>(null)
  const [pesoTxt, setPesoTxt] = useState(weight !== null ? String(weight) : '')

  const goTo = useCallback((s: Screen) => {
    setScreen(s)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])

  // Toda ferramenta do app tem FABMenu com 'Início' — e o KetoPath nao tinha.
  const fabItems: FABItem[] = useMemo(() => [
    { label: 'Início', onClick: () => goTo('home') },
    { label: 'Avaliação guiada', onClick: () => goTo('p1') },
    { label: 'Reconhecer', onClick: () => goTo('reconhecimento') },
    { label: 'Calculadoras', onClick: () => goTo('calculadoras') },
    { label: 'Planilha', onClick: () => goTo('planilha') },
    { label: 'Referências', onClick: () => goTo('referencias') },
  ], [goTo])

  function setCampo(id: string, valor: string) {
    setTextos(t => ({ ...t, [id]: valor }))
    const n = parseFloat(valor.replace(',', '.'))
    setDados(d => ({ ...d, [id]: isNaN(n) ? null : n }))
  }

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

  const passoAtual = PASSOS.find(p => p.id === screen)
  const ehPasso = !!passoAtual

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header
        title="KetoPath"
        subtitle={screen === 'home' ? 'Crises hiperglicêmicas · ≥15 anos' : undefined}
      />
      <Container>

        {/* ═══════════════ HOME — grid de 2 colunas, padrão do Hub ═══════════════ */}
        {screen === 'home' && (
          <>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {CARDS.map(c => (
                <button
                  key={c.id}
                  onClick={() => goTo(c.id)}
                  className={`flex flex-col items-center justify-center gap-2 text-center rounded-xl p-4 min-h-[112px] cursor-pointer transition-colors bg-[#1A1A1A] active:bg-bg-hover ${
                    c.destaque ? 'border-2 border-accent' : 'border border-border-card'
                  }`}
                >
                  <span className={`w-7 h-7 ${c.destaque ? 'text-accent' : 'text-accent'}`}>{c.icon}</span>
                  <span className="text-[15px] font-semibold text-text-primary leading-tight">{c.titulo}</span>
                  <span className="text-[11px] text-text-muted leading-tight">{c.sub}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted leading-relaxed mt-5 text-center">
              Cobre CAD, EHH e quadro misto. Não cobre pediatria, gestantes nem doença renal
              terminal em diálise.
            </p>
          </>
        )}

        {/* ═══════════════ PASSOS ═══════════════ */}
        {ehPasso && (
          <>
            {/* Progresso */}
            <div className="flex justify-center gap-[6px] py-3 flex-wrap">
              {PASSOS.map(p => (
                <button key={p.id} onClick={() => goTo(p.id)} aria-label={`Passo ${p.n}: ${p.titulo}`}
                  className="p-[12px] bg-transparent border-none cursor-pointer flex items-center justify-center">
                  <span className={`block w-[10px] h-[10px] rounded-full border transition-all duration-200 ${
                    p.n === passoAtual.n ? 'bg-accent border-accent scale-[1.2]'
                    : p.n < passoAtual.n ? 'bg-success border-success'
                    : 'bg-bg-elevated border-border-card'}`} />
                </button>
              ))}
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-bold text-accent">PASSO {passoAtual.n}</span>
              <span className="text-xs text-text-muted">de 8</span>
            </div>
            <h2 className="text-[20px] font-bold text-text-primary mb-3">{passoAtual.titulo}</h2>

            {/* Faixa de contexto — os laboratoriais entram uma vez e ficam à vista */}
            {screen !== 'p1' && (
              <button onClick={() => goTo('p1')}
                className="flex items-center justify-between gap-2 w-full bg-bg-elevated border border-border-card rounded-lg px-3 py-2 mb-4 cursor-pointer text-left min-h-[44px]">
                <span className="text-[11px] text-text-secondary leading-relaxed">
                  {[
                    weight !== null ? `${fmt(weight, 0)} kg` : null,
                    dados.glicemia !== null ? `Glic ${dados.glicemia}` : null,
                    dados.sodio !== null ? `Na ${dados.sodio}` : null,
                    dados.potassio !== null ? `K ${fmt(dados.potassio, 1)}` : null,
                    dados.phVenoso !== null ? `pH ${fmt(dados.phVenoso, 2)}` : null,
                  ].filter(Boolean).join(' · ') || 'Nenhum dado informado'}
                </span>
                <span className="text-[11px] text-accent font-semibold flex-shrink-0">editar</span>
              </button>
            )}

            {screen === 'p1' && (
              <PassoDados
                dados={dados} textos={textos} pesoTxt={pesoTxt} reavaliadoEm={reavaliadoEm}
                setCampo={setCampo} setDados={setDados} reavaliar={reavaliar}
                setPesoTxt={setPesoTxt} setWeight={setWeight}
              />
            )}
            {screen === 'p2' && (
              <PassoClassificacao dados={dados} trilha={trilha} setTrilha={setTrilha} gravidade={gravidade} />
            )}
            {screen === 'p3' && <PassoFluidos dados={dados} peso={weight} trilha={trilha} />}
            {screen === 'p4' && <PassoPotassio dados={dados} />}
            {screen === 'p5' && <PassoInsulina dados={dados} peso={weight} trilha={trilha} />}
            {screen === 'p6' && <PassoAdjuvantes dados={dados} />}
            {screen === 'p7' && <KetoMonitor peso={weight} trilha={trilha} />}
            {screen === 'p8' && (
              <>
                <KetoResolucao peso={weight} trilha={trilha} />
                {dados.cetonuria !== null && (
                  <AlertCard type="danger" title="Cetonúria não serve como critério de resolução">
                    <p className="leading-relaxed">{semFonte(K.DISCORDANCIA_CETONURIA[3])}</p>
                  </AlertCard>
                )}
              </>
            )}

            {/* Navegação */}
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" fullWidth
                onClick={() => goTo(passoAtual.n === 1 ? 'home' : (`p${passoAtual.n - 1}` as Screen))}>
                {passoAtual.n === 1 ? 'Início' : 'Voltar'}
              </Button>
              {passoAtual.n < 8 && (
                <Button fullWidth onClick={() => goTo(`p${passoAtual.n + 1}` as Screen)}>Próximo</Button>
              )}
              {passoAtual.n === 8 && (
                <Button fullWidth onClick={() => goTo('home')}>Concluir</Button>
              )}
            </div>
          </>
        )}

        {/* ═══════════════ TELAS DE CONSULTA ═══════════════ */}
        {!ehPasso && screen !== 'home' && (
          <>
            <h2 className="text-[20px] font-bold text-text-primary mt-2 mb-3">{TITULOS[screen]}</h2>
            {screen === 'reconhecimento' && <TelaReconhecimento />}
            {screen === 'exames' && <TelaExames />}
            {screen === 'calculadoras' && <TelaCalculadoras dados={dados} peso={weight} trilha={trilha} />}
            {screen === 'planilha' && <KetoPlanilha />}
            {screen === 'armadilhas' && <TelaArmadilhas />}
            {screen === 'precipitante' && <TelaPrecipitante />}
            {screen === 'referencias' && <TelaReferencias />}
            <div className="mt-6">
              <Button variant="secondary" fullWidth onClick={() => goTo('home')}>Início</Button>
            </div>
          </>
        )}

      </Container>
      <Footer toolName="KetoPath" version="v1.0.0" updatedAt="Agosto 2026" />
      <FABMenu items={fabItems} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────── Passo 1 — Dados

function PassoDados({ dados, textos, pesoTxt, reavaliadoEm, setCampo, setDados, reavaliar, setPesoTxt, setWeight }: {
  dados: KetoDados
  textos: Record<string, string>
  pesoTxt: string
  reavaliadoEm: string | null
  setCampo: (id: string, v: string) => void
  setDados: React.Dispatch<React.SetStateAction<KetoDados>>
  reavaliar: () => void
  setPesoTxt: (v: string) => void
  setWeight: (n: number | null) => void
}) {
  return (
    <div>
      {reavaliadoEm && <p className="text-xs text-info mb-3">Última reavaliação às {reavaliadoEm}</p>}

      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="text-xs text-text-muted">Peso (kg)</span>
          <input type="text" inputMode="decimal" value={pesoTxt} placeholder="70"
            onChange={e => {
              setPesoTxt(e.target.value)
              const n = parseFloat(e.target.value.replace(',', '.'))
              setWeight(!isNaN(n) && n >= 40 && n <= 200 ? n : null)
            }} className={campo} />
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

      <div className="mt-4">
        <span className="text-xs text-text-muted">Cetonúria</span>
        <div className="flex gap-1.5 mt-1">
          {K.CETONURIA_OPCOES.map(o => (
            <button key={o} onClick={() => setDados(d => ({ ...d, cetonuria: d.cetonuria === o ? null : o }))}
              className={`${btn(dados.cetonuria === o)} px-1`}>{o}</button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <span className="text-xs text-text-muted">Nível de consciência</span>
        <div className="flex gap-1.5 mt-1">
          {K.CONSCIENCIA_OPCOES.map(o => (
            <button key={o.id}
              onClick={() => setDados(d => ({ ...d, nivelConsciencia: d.nivelConsciencia === o.id ? null : o.id }))}
              className={`${btn(dados.nivelConsciencia === o.id)} text-xs px-1`}>{o.label}</button>
          ))}
        </div>
      </div>

      <button onClick={reavaliar}
        className="w-full mt-5 px-3 py-2.5 rounded-lg border border-border-card bg-bg-hover text-text-secondary text-sm cursor-pointer min-h-[44px]">
        Reavaliar — limpa os laboratoriais e marca o horário
      </button>
    </div>
  )
}

// ────────────────────────────────────────────────── Passo 2 — Classificação

function PassoClassificacao({ dados, trilha, setTrilha, gravidade }: {
  dados: KetoDados
  trilha: Trilha
  setTrilha: (t: Trilha) => void
  gravidade: ReturnType<typeof gravidadeCAD>
}) {
  return (
    <div>
      {/* Alerta condicional: glicemia normal nao descarta CAD. Decisao do Gustavo
          de duplicar aqui o alerta 1.2, que na spec vive so na secao de
          reconhecimento — quem entra direto pela avaliacao nao passaria por ele. */}
      {dados.glicemia !== null && dados.glicemia < 200 && (
        <AlertCard type="danger" title="Glicemia abaixo de 200 — atenção">
          <p className="leading-relaxed">{semFonte(K.CAD_EUGLICEMICA[0])}</p>
          <p className="leading-relaxed mt-2">{semFonte(K.CAD_EUGLICEMICA[1])}</p>
          <p className="leading-relaxed mt-2">{semFonte(K.CAD_EUGLICEMICA[2])}</p>
        </AlertCard>
      )}

      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Trilha</div>
      <div className="flex gap-2 mb-3">
        {([['cad', 'CAD'], ['ehh', 'EHH'], ['misto', 'Misto']] as [Trilha, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTrilha(id)} className={btn(trilha === id)}>{label}</button>
        ))}
      </div>
      <Paragrafos textos={K.SOBREPOSICAO_CAD_EHH} />

      {/* Alerta condicional da cetonuria, pelo mesmo motivo do de cima */}
      {dados.cetonuria !== null && (
        <AlertCard type="warning" title="Cetonúria pode enganar nas duas direções">
          <p className="leading-relaxed">{semFonte(K.DISCORDANCIA_CETONURIA[2])}</p>
          <p className="leading-relaxed mt-2">{semFonte(K.DISCORDANCIA_CETONURIA[3])}</p>
        </AlertCard>
      )}

      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-5">Gravidade</div>
      {gravidade ? (
        <AlertCard type={gravidade === 'grave' ? 'danger' : gravidade === 'moderada' ? 'warning' : 'success'}
          title={`CAD ${gravidade}`}>
          <p className="text-base font-semibold text-text-primary">{K.DISPOSICAO[gravidade]}</p>
        </AlertCard>
      ) : (
        <p className="text-sm text-warning leading-relaxed mb-3">
          Sem pH ou bicarbonato dentro das faixas de acidose, a gravidade não é classificada.
        </p>
      )}

      <div className="rounded-xl overflow-hidden border border-border-card my-3">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-bg-hover text-text-muted">
              <th className="text-left px-2 py-2 font-semibold" />
              <th className="text-left px-2 py-2 font-semibold">Leve</th>
              <th className="text-left px-2 py-2 font-semibold">Moder.</th>
              <th className="text-left px-2 py-2 font-semibold">Grave</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['pH venoso', '>7,25 a <7,30', '7,00–7,25', '<7,00'],
              ['HCO₃', '15–18', '10 a <15', '<10'],
              ['Consciência', 'alerta', 'sonolento', 'estupor'],
              ['Cuidado', 'regular', 'intermediária', 'UTI'],
            ].map(([rot, ...cols]) => (
              <tr key={rot} className="border-t border-border">
                <td className="px-2 py-2 text-text-muted font-semibold align-top">{rot}</td>
                {cols.map((c, i) => {
                  const ativa = gravidade === ['leve', 'moderada', 'grave'][i]
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
      <p className="text-sm text-text-secondary leading-relaxed">{semFonte(K.NOTA_GRAVIDADE)}</p>
      <p className="text-xs text-text-muted mt-3 leading-relaxed">{semFonte(K.NOTA_UNIDADES)}</p>
    </div>
  )
}
