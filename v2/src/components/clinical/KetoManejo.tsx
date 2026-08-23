import { useState } from 'react'
import { Collapsible } from '../common/Collapsible'
import { AlertCard } from '../common/AlertCard'
import { fmt } from '../../utils/formatters'
import { sodioCorrigido, deficitVolumeEHH, preparoKcl, insulinaVelocidade } from '../../utils/ketoCalc'
import type { KetoDados, Trilha } from '../../data/ketoData'
import * as K from '../../data/ketoData'

interface Props {
  dados: KetoDados
  peso: number | null
  trilha: Trilha
}

const btn = (ativo: boolean) =>
  `flex-1 py-2 px-2 rounded-xl text-sm font-medium border min-h-[44px] transition-colors ${
    ativo ? 'bg-accent text-white border-accent' : 'bg-bg-elevated text-text-secondary border-border-card'
  }`

const campo =
  'w-full mt-1 bg-bg-hover border border-border-card rounded-lg px-3 py-2.5 text-text-primary text-base outline-none focus:border-accent'

function Paragrafos({ textos }: { textos: string[] }) {
  return (
    <>
      {textos.map((t, i) => (
        <p key={i} className="text-sm text-text-secondary leading-relaxed mb-2 last:mb-0">{t}</p>
      ))}
    </>
  )
}

/** Passo 3 — Fluidos. */
export function PassoFluidos({ dados, peso, trilha }: Props) {
  const [estadoVolemico, setEstadoVolemico] = useState<string | null>(null)
  const ehEhh = trilha === 'ehh' || trilha === 'misto'
  const naCorr =
    dados.sodio !== null && dados.glicemia !== null ? sodioCorrigido(dados.sodio, dados.glicemia) : null

  return (
    <div>
      <Paragrafos textos={K.FLUIDO_INICIAL} />
      <p className="text-sm text-info leading-relaxed mb-3">{K.PREFERENCIA_FLUIDO}</p>

      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-4">
        Fase A — estado volêmico
      </div>
      <div className="flex flex-col gap-2 mb-3">
        {K.ESTADOS_VOLEMICOS.map(e => (
          <button
            key={e.id}
            onClick={() => setEstadoVolemico(estadoVolemico === e.id ? null : e.id)}
            className={`${btn(estadoVolemico === e.id)} text-left`}
          >
            {e.label}
          </button>
        ))}
      </div>
      {estadoVolemico && (() => {
        const e = K.ESTADOS_VOLEMICOS.find(x => x.id === estadoVolemico)!
        return (
          <AlertCard type="info" title={e.label}>
            <p className="leading-relaxed">{e.conduta}</p>
            {e.extra && <p className="leading-relaxed mt-2 text-warning">{e.extra}</p>}
          </AlertCard>
        )
      })()}

      <AlertCard type="warning" title="Populações de risco">
        <p className="leading-relaxed">{K.ALERTA_SOBRECARGA}</p>
      </AlertCard>

      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-4">
        Reavaliação após a expansão
      </div>
      <Paragrafos textos={K.REAVALIACAO_EXPANSAO} />

      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-4">
        Fase B — manutenção pelo sódio corrigido
      </div>
      {naCorr !== null ? (
        <AlertCard type={naCorr < 135 ? 'info' : 'success'} title={`Sódio corrigido: ${fmt(naCorr, 1)} mEq/L`}>
          <p className="leading-relaxed font-medium text-text-primary">
            {naCorr < 135 ? K.FASE_B.abaixo135 : K.FASE_B.acima135}
          </p>
        </AlertCard>
      ) : (
        <p className="text-sm text-warning">Informe sódio e glicemia no painel para ver a conduta da fase B.</p>
      )}

      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-4">
        Gatilho da dextrose
      </div>
      <Paragrafos textos={K.GATILHO_DEXTROSE} />
      <p className="text-xs text-text-muted leading-relaxed mt-2 italic">{K.NOTA_VEICULO_DEXTROSE}</p>

      {ehEhh && (
        <>
          <AlertCard type="danger" title="EHH — velocidades de correção">
            <Paragrafos textos={K.EHH_VELOCIDADES} />
            <ul className="mt-2 space-y-1">
              {K.EHH_LIMITES.map((l, i) => (
                <li key={i} className="text-sm text-text-primary leading-relaxed">• {l}</li>
              ))}
            </ul>
          </AlertCard>
          <AlertCard type="warning" title="Elevação inicial do sódio">
            <p className="leading-relaxed">{K.EHH_ALERTA_SODIO}</p>
          </AlertCard>
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-4">
            EHH — estimativa do déficit de volume
          </div>
          <Paragrafos textos={K.EHH_DEFICIT_VOLUME} />
          {peso ? (() => {
            const d = deficitVolumeEHH(peso)
            return (
              <div className="bg-bg-hover rounded-xl p-3 text-center mt-2">
                <div className="text-xs text-text-muted">Para {fmt(peso, 0)} kg</div>
                <div className="text-xl font-bold text-accent mt-0.5">
                  {fmt(d.min, 1)} a {fmt(d.max, 1)} L
                </div>
              </div>
            )
          })() : (
            <p className="text-sm text-warning mt-2">Informe o peso para estimar o déficit.</p>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────── 4.2 Potássio

/** Passo 4 — Potássio. Precede a insulina e a destrava. */
export function PassoPotassio({ dados }: { dados: KetoDados }) {
  const k = dados.potassio
  const faixaAtiva = k === null ? null : k < 3.5 ? 'baixo' : k <= 5.0 ? 'alvo' : 'alto'

  return (
    <div>
      <Collapsible title="Por que o potássio vem antes">
        <Paragrafos textos={K.POTASSIO_INTRO} />
      </Collapsible>

      <AlertCard type="warning" title="Antes de repor — função renal">
        <p className="leading-relaxed">{K.GATE_FUNCAO_RENAL}</p>
      </AlertCard>

      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-4">
        Conduta por faixa
      </div>
      <div className="rounded-xl overflow-hidden border border-border-card mb-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-hover text-text-muted">
              <th className="text-left px-3 py-2 font-semibold w-[30%]">Potássio</th>
              <th className="text-left px-3 py-2 font-semibold">Conduta</th>
            </tr>
          </thead>
          <tbody>
            {K.POTASSIO_FAIXAS.map(f => {
              const ativa = faixaAtiva === f.id
              const cor = ativa ? 'text-accent font-bold' : 'text-text-secondary'
              return (
                <tr key={f.id} className="border-t border-border" style={ativa ? { background: 'rgba(255,82,82,0.12)' } : undefined}>
                  <td className={`px-3 py-2 align-top ${cor}`}>{f.faixa}</td>
                  <td className={`px-3 py-2 leading-relaxed ${cor}`}>{f.conduta}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {faixaAtiva === 'baixo' && (
        <AlertCard type="danger" title="Potássio abaixo de 3,5 mEq/L">
          <Paragrafos textos={K.POTASSIO_ALERTA_BAIXO} />
        </AlertCard>
      )}

      <Collapsible title="Monitorização do potássio">
        <Paragrafos textos={K.POTASSIO_MONITORIZACAO} />
      </Collapsible>

      <Collapsible title="Preparo e administração">
        <div className="rounded-xl overflow-hidden border border-border-card mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-bg-hover text-text-muted">
                <th className="text-left px-3 py-2 font-semibold">Apresentação</th>
                <th className="text-left px-3 py-2 font-semibold">Conteúdo por ampola de 10 mL</th>
              </tr>
            </thead>
            <tbody>
              {K.KCL_APRESENTACOES.map(a => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-3 py-2 text-text-secondary">{a.label}</td>
                  <td className="px-3 py-2 text-text-secondary">{a.descricao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl overflow-hidden border border-border-card mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-bg-hover text-text-muted">
                <th className="text-left px-3 py-2 font-semibold">Via</th>
                <th className="text-left px-3 py-2 font-semibold">Concentração máxima</th>
              </tr>
            </thead>
            <tbody>
              {K.KCL_VIAS.map(v => (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-3 py-2 text-text-secondary">{v.label}</td>
                  <td className="px-3 py-2 text-text-secondary">{v.maxMEqPorLitro} mEq/L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paragrafos textos={K.KCL_VELOCIDADE} />
        <p className="text-sm text-info leading-relaxed mt-2">{K.KCL_MONITORIZACAO}</p>
      </Collapsible>

      <CalculadoraKcl />

      <p className="text-xs text-text-muted mt-3 leading-relaxed">{K.NOTA_UNIDADES}</p>
    </div>
  )
}

function CalculadoraKcl() {
  const [apresId, setApresId] = useState(K.KCL_APRESENTACOES[0].id)
  const [viaId, setViaId] = useState(K.KCL_VIAS[0].id)
  const [doseTxt, setDoseTxt] = useState('')
  const [velTxt, setVelTxt] = useState('10')
  const [volTxt, setVolTxt] = useState('')

  const apres = K.KCL_APRESENTACOES.find(a => a.id === apresId)!
  const via = K.KCL_VIAS.find(v => v.id === viaId)!
  const num = (t: string) => { const v = parseFloat(t.replace(',', '.')); return isNaN(v) ? null : v }
  const dose = num(doseTxt), vel = num(velTxt), vol = num(volTxt)

  const r = dose && dose > 0 ? preparoKcl(dose, apres.mEqPorAmpola, apres.mlPorAmpola, via.maxMEqPorLitro, vel ?? 0, vol ?? undefined) : null
  const alertaOsmotico = vel !== null && vel > 20

  return (
    <Collapsible title="Calculadora de preparo">
      <div className="flex gap-2 mb-3">
        {K.KCL_APRESENTACOES.map(a => (
          <button key={a.id} onClick={() => setApresId(a.id)} className={btn(apresId === a.id)}>{a.label}</button>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        {K.KCL_VIAS.map(v => (
          <button key={v.id} onClick={() => setViaId(v.id)} className={btn(viaId === v.id)}>{v.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="block">
          <span className="text-xs text-text-muted">Dose desejada (mEq)</span>
          <input type="text" inputMode="decimal" value={doseTxt} placeholder="20" onChange={e => setDoseTxt(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="text-xs text-text-muted">Velocidade (mEq/h)</span>
          <input type="text" inputMode="decimal" value={velTxt} placeholder="10" onChange={e => setVelTxt(e.target.value)} className={campo} />
        </label>
      </div>
      <label className="block mb-3">
        <span className="text-xs text-text-muted">Volume final (mL) — deixe vazio para usar o mínimo</span>
        <input type="text" inputMode="decimal" value={volTxt} placeholder={r ? String(r.volumeMinimo) : '400'} onChange={e => setVolTxt(e.target.value)} className={campo} />
      </label>

      {r && (
        <div className="bg-bg-hover rounded-xl p-3.5 space-y-1.5">
          <Linha rotulo="Aspirar de KCl" valor={`${fmt(r.volumeKcl, 1)} mL`} />
          <Linha rotulo={`Volume mínimo (${via.maxMEqPorLitro} mEq/L)`} valor={`${r.volumeMinimo} mL`} />
          <Linha rotulo="Concentração resultante" valor={`${r.concentracaoResultante} mEq/L`} destaque={r.excedeLimite} />
          <Linha rotulo="Velocidade de infusão" valor={`${fmt(r.velocidadeMlH, 1)} mL/h`} />
        </div>
      )}

      {r?.excedeLimite && (
        <AlertCard type="danger" title="Concentração acima do limite da via">
          <p className="leading-relaxed">
            {r.concentracaoResultante} mEq/L excede o máximo de {via.maxMEqPorLitro} mEq/L para {via.label.toLowerCase()}.
            Considere aumentar o volume final para pelo menos {r.volumeMinimo} mL ou usar outra via.
          </p>
        </AlertCard>
      )}

      {alertaOsmotico && (
        <AlertCard type="warning" title="Efeito osmótico do potássio">
          <Paragrafos textos={K.KCL_EFEITO_OSMOTICO} />
        </AlertCard>
      )}
    </Collapsible>
  )
}

// ─────────────────────────────────────────────────────────── 4.3 Insulina

/**
 * A secao fica TRAVADA ate o potassio ser informado, e mostra bloqueio ativo
 * quando K <3,5. E o gate central da ferramenta: iniciar insulina com potassio
 * baixo pode causar arritmia com risco de vida.
 */
/** Passo 5 — Insulina. TRAVADA até o potássio ser informado. */
export function PassoInsulina({ dados, peso, trilha }: { dados: KetoDados; peso: number | null; trilha: Trilha }) {
  const [taxa, setTaxa] = useState(0.1)
  const k = dados.potassio
  const travada = k === null
  const bloqueioAtivo = k !== null && k < 3.5

  if (travada) {
    return (
      <AlertCard type="warning" title="Seção travada">
        <p className="leading-relaxed">{K.INSULINA_GATE_VAZIO}</p>
        <p className="leading-relaxed mt-2 text-text-muted">
          Volte ao passo 4 e informe o potássio. Iniciar insulina sem conhecer o potássio pode
          levar a arritmia com risco de vida.
        </p>
      </AlertCard>
    )
  }

  const velocidade = peso ? insulinaVelocidade(peso, taxa) : null

  return (
    <div>
      {bloqueioAtivo && (
        <AlertCard type="danger" title="Insulina bloqueada">
          <p className="leading-relaxed">{K.INSULINA_BLOQUEIO_ATIVO}</p>
        </AlertCard>
      )}

      <p className="text-sm text-text-secondary leading-relaxed mb-3">{K.INSULINA_PREPARO}</p>

      <AlertCard type="warning" title="Purga do equipo">
        <Paragrafos textos={K.INSULINA_PURGA} />
        <p className="leading-relaxed mt-2 font-semibold text-text-primary">{K.INSULINA_PURGA_NOTA}</p>
      </AlertCard>

      <Collapsible title="Dose por trilha e referências">
      <div className="rounded-xl overflow-hidden border border-border-card mb-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-hover text-text-muted">
              <th className="text-left px-3 py-2 font-semibold">Situação</th>
              <th className="text-left px-3 py-2 font-semibold">Velocidade</th>
            </tr>
          </thead>
          <tbody>
            {K.INSULINA_DOSES.map(d => (
              <tr key={d.situacao} className="border-t border-border">
                <td className="px-3 py-2 text-text-secondary">{d.situacao}</td>
                <td className="px-3 py-2 text-text-secondary">{d.velocidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paragrafos textos={K.INSULINA_TEXTOS} />
      {(trilha === 'ehh' || trilha === 'misto') && (
        <div className="mt-3"><Paragrafos textos={K.INSULINA_TEXTO_EHH} /></div>
      )}
      <p className="text-sm text-text-secondary leading-relaxed mt-3">{K.INSULINA_APOS_REDUCAO}</p>
      </Collapsible>

      <AlertCard type="warning" title="Enquanto a bomba estiver ativa">
        <Paragrafos textos={K.INSULINA_BOMBA_ATIVA} />
      </AlertCard>

      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-4">
        Calculadora de velocidade
      </div>
      <div className="flex gap-2 mb-3">
        {[0.1, 0.05].map(t => (
          <button key={t} onClick={() => setTaxa(t)} className={btn(taxa === t)}>
            {fmt(t, 2)} U/kg/h
          </button>
        ))}
      </div>
      {velocidade !== null ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 text-center border-2 border-success" style={{ background: 'rgba(76,175,80,0.08)' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1 text-success">Insulina</div>
            <div className="text-[28px] font-bold text-success">{fmt(velocidade, 1)}</div>
            <div className="text-sm mt-1 text-success">U/h</div>
          </div>
          <div className="rounded-xl p-4 text-center border-2 border-success" style={{ background: 'rgba(76,175,80,0.08)' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1 text-success">Velocidade</div>
            <div className="text-[28px] font-bold text-success">{fmt(velocidade, 1)}</div>
            <div className="text-sm mt-1 text-success">mL/h</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-warning">Informe o peso para calcular a velocidade.</p>
      )}

      <Collapsible title="Insulina basal durante a infusão">
        <Paragrafos textos={K.INSULINA_BASAL} />
      </Collapsible>

      <p className="text-xs text-text-muted mt-3 leading-relaxed">{K.NOTA_UNIDADES}</p>
    </div>
  )
}

/** Passo 6 — Adjuvantes: bicarbonato e fosfato. */
export function PassoAdjuvantes({ dados }: { dados: KetoDados }) {
  const phBaixo = dados.phVenoso !== null && dados.phVenoso < 7.0
  return (
    <div>
      <Collapsible title="Bicarbonato" badge={phBaixo ? 'pH <7,0' : undefined} badgeColor="#F44336">
        {phBaixo ? (
          <>
            <AlertCard type="warning" title="pH abaixo de 7,0">
              <Paragrafos textos={K.BICARBONATO_PH_BAIXO} />
              {dados.potassio !== null && dados.potassio < 5.0 && (
                <p className="leading-relaxed mt-2 font-semibold text-warning">{K.BICARBONATO_LINHA_KCL}</p>
              )}
            </AlertCard>
            <p className="text-xs text-text-muted mt-3 leading-relaxed">{K.NOTA_UNIDADES}</p>
          </>
        ) : (
          <>
            <Paragrafos textos={K.BICARBONATO_PH_ALTO} />
            <p className="text-xs text-text-muted mt-3 leading-relaxed">{K.NOTA_UNIDADES}</p>
          </>
        )}
      </Collapsible>
      <Collapsible title="Fosfato">
        <Paragrafos textos={K.FOSFATO} />
      </Collapsible>
    </div>
  )
}

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-sm text-text-muted">{rotulo}</span>
      <span className={`text-sm font-semibold text-right ${destaque ? 'text-danger' : 'text-text-primary'}`}>{valor}</span>
    </div>
  )
}

export { Paragrafos, btn, campo }
