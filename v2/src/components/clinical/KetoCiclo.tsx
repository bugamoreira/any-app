import { useState } from 'react'
import { Collapsible } from '../common/Collapsible'
import { AlertCard } from '../common/AlertCard'
import { fmt } from '../../utils/formatters'
import { sodioCorrigido, quedaGlicemia, resolvidoCAD, transicaoInsulina, insulinaVelocidade, anionGap, deltaDelta } from '../../utils/ketoCalc'
import type { Rodada } from '../../utils/ketoCalc'
import { Paragrafos, btn, campo, semFonte } from './KetoManejo'
import type { Trilha } from '../../data/ketoData'
import * as K from '../../data/ketoData'

interface Props {
  peso: number | null
  trilha: Trilha
  rodada: number
  anterior: Rodada | null
  valores: Rodada
  setValores: (v: Rodada) => void
  fecharRodada: () => void
}

/**
 * Fase 3 — CICLO de reavaliacao.
 *
 * Nao e um passo: e uma tela reentrante. O Gustavo resumiu assim — "dai pra
 * frente e uma reavaliacao das mesmas variaveis ate ter criterio de resolucao".
 * Por isso a tela repete os mesmos cinco campos, mostra o que mudou desde a
 * rodada anterior, deriva os ajustes e termina no criterio de saida.
 */
export function KetoCiclo({ peso, trilha, rodada, anterior, valores, setValores, fecharRodada }: Props) {
  const [mostrarQueda, setMostrarQueda] = useState(false)
  const [tipoSc, setTipoSc] = useState(K.TRANSICAO_SOBREPOSICAO[0].id)
  const [riscoHipo, setRiscoHipo] = useState(false)
  const ehEhh = trilha === 'ehh' || trilha === 'misto'

  const set = (campoId: keyof Rodada, txt: string) => {
    const n = parseFloat(txt.replace(',', '.'))
    setValores({ ...valores, [campoId]: isNaN(n) ? null : n })
  }

  const minutos = anterior ? Math.max(1, Math.round((Date.now() - anterior.em) / 60000)) : 0
  const queda = anterior && anterior.glicemia !== null && valores.glicemia !== null
    ? quedaGlicemia(valores.glicemia, anterior.glicemia, minutos) : null

  const naCorr = valores.sodio !== null && valores.glicemia !== null
    ? sodioCorrigido(valores.sodio, valores.glicemia) : null
  const res = resolvidoCAD(valores.phVenoso, valores.bicarbonato, valores.glicemia)

  // Anion-gap e delta/delta: respondem se o bicarbonato ainda baixo e a CAD
  // que nao resolveu ou a acidose hiperclorêmica do soro infundido.
  const ag = valores.sodio !== null && valores.cloro !== null && valores.bicarbonato !== null
    ? anionGap(valores.sodio, valores.cloro, valores.bicarbonato) : null
  const dd = ag !== null && valores.bicarbonato !== null ? deltaDelta(ag, valores.bicarbonato) : null
  const t = peso ? transicaoInsulina(peso, riscoHipo) : null

  const CAMPOS: { id: keyof Rodada; label: string; unidade: string }[] = [
    { id: 'glicemia',    label: 'Glicemia',    unidade: 'mg/dL' },
    { id: 'potassio',    label: 'Potássio',    unidade: 'mEq/L' },
    { id: 'sodio',       label: 'Sódio',       unidade: 'mEq/L' },
    { id: 'cloro',       label: 'Cloro',       unidade: 'mEq/L' },
    { id: 'phVenoso',    label: 'pH venoso',   unidade: '' },
    { id: 'bicarbonato', label: 'Bicarbonato', unidade: 'mEq/L' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <span className="text-xs font-bold text-accent">REAVALIAÇÃO {rodada}</span>
          {anterior && (
            <span className="text-xs text-text-muted ml-2">
              {minutos < 60 ? `há ${minutos} min` : `há ${fmt(minutos / 60, 1)} h`}
            </span>
          )}
        </div>
        <button onClick={fecharRodada}
          className="text-xs px-3 py-2 rounded-lg border border-accent bg-accent-muted text-accent font-semibold cursor-pointer min-h-[40px]">
          Nova rodada
        </button>
      </div>

      {/* As mesmas variaveis, rodada apos rodada */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {CAMPOS.map(c => (
          <label key={c.id} className="block">
            <span className="text-xs text-text-muted">{c.label}{c.unidade && ` (${c.unidade})`}</span>
            <input type="text" inputMode="decimal"
              value={valores[c.id] === null ? '' : String(valores[c.id])}
              onChange={e => set(c.id, e.target.value)} className={campo} />
            {anterior && anterior[c.id] !== null && valores[c.id] !== null && (
              <span className="text-[11px] text-text-muted">
                anterior {String(anterior[c.id])}
              </span>
            )}
          </label>
        ))}
      </div>

      {/* ─── o que decorre ─── */}
      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">O que decorre</div>

      {queda && !queda.extrapolavel && (
        <AlertCard type="info" title={`Glicemia ${queda.absoluta >= 0 ? 'caiu' : 'subiu'} ${Math.abs(queda.absoluta)} mg/dL`}>
          <p className="leading-relaxed">
            Intervalo de {minutos} min é curto demais para estimar a queda por hora. A titulação usa
            a variação em cerca de 1 hora.
          </p>
        </AlertCard>
      )}

      {queda && queda.extrapolavel && (
        <AlertCard
          type={queda.leitura === 'rapida' ? 'danger' : queda.leitura === 'insuficiente' ? 'warning' : 'success'}
          title={`Glicemia ${queda.porHora >= 0 ? 'caiu' : 'subiu'} ${Math.abs(queda.porHora)} mg/dL por hora`}>
          {queda.leitura === 'adequada' && <p className="leading-relaxed">Dentro da faixa esperada de 50 a 70 mg/dL por hora.</p>}
          {queda.leitura === 'rapida' && <p className="leading-relaxed">{semFonte(K.TETO_QUEDA)}</p>}
          {queda.leitura === 'insuficiente' && (
            <>
              <p className="leading-relaxed">{semFonte(K.QUEDA_INSUFICIENTE_INTRO)}</p>
              <button onClick={() => setMostrarQueda(!mostrarQueda)}
                className="mt-2 text-xs px-3 py-2 rounded-lg border border-warning text-warning bg-transparent cursor-pointer min-h-[40px]">
                {mostrarQueda ? 'Fechar' : 'O que fazer'}
              </button>
              {mostrarQueda && (
                <ol className="space-y-2 mt-3">
                  {K.QUEDA_INSUFICIENTE_PASSOS.map((passo, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed">
                      <span className="font-bold text-warning flex-shrink-0">{i + 1}.</span>
                      <span className="text-text-primary">{semFonte(passo)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </AlertCard>
      )}

      {valores.glicemia !== null && valores.glicemia < 250 && (
        <AlertCard type="info" title="Glicemia abaixo de 250 mg/dL">
          <Paragrafos textos={K.APOS_250} />
          {peso && (
            <p className="leading-relaxed mt-2 font-semibold text-text-primary">
              Insulina a 0,05 U/kg/h = {fmt(insulinaVelocidade(peso, 0.05), 1)} U/h = {fmt(insulinaVelocidade(peso, 0.05), 1)} mL/h
            </p>
          )}
        </AlertCard>
      )}

      {naCorr !== null && (
        <AlertCard type="info" title={`Sódio corrigido ${fmt(naCorr, 1)} mEq/L`}>
          <p className="leading-relaxed">{naCorr < 135 ? K.FASE_B.abaixo135 : K.FASE_B.acima135}</p>
        </AlertCard>
      )}

      {valores.potassio !== null && (() => {
        const k = valores.potassio!
        const faixa = K.POTASSIO_FAIXAS.find(f => f.id === (k < 3.5 ? 'baixo' : k <= 5.0 ? 'alvo' : 'alto'))!
        return (
          <AlertCard type={k < 3.5 ? 'danger' : k > 5.0 ? 'warning' : 'success'} title={`Potássio ${fmt(k, 1)} mEq/L`}>
            <p className="leading-relaxed">{semFonte(faixa.conduta)}</p>
          </AlertCard>
        )
      })()}

      {ehEhh && (
        <AlertCard type="warning" title="EHH — limites de correção">
          <ul className="space-y-1">
            {K.EHH_LIMITES.map((l, i) => (
              <li key={i} className="text-sm text-text-primary leading-relaxed">• {semFonte(l)}</li>
            ))}
          </ul>
        </AlertCard>
      )}

      <Collapsible title="Cadência de exames">
        <div className="rounded-xl overflow-hidden border border-border-card">
          <table className="w-full text-xs">
            <tbody>
              {K.CADENCIA_EXAMES.map(c => (
                <tr key={c.parametro} className="border-t border-border first:border-t-0">
                  <td className="px-3 py-2 text-text-secondary leading-relaxed">{semFonte(c.parametro)}</td>
                  <td className="px-3 py-2 text-text-secondary leading-relaxed">{semFonte(c.frequencia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted leading-relaxed mt-2 italic">{K.NOTA_BHB_INDISPONIVEL}</p>
      </Collapsible>

      {dd && (
        <AlertCard
          type={dd.leitura === 'hiperclorêmica' ? 'info' : dd.leitura === 'alcalose' ? 'warning' : 'success'}
          title={`Ânion-gap ${ag} · razão delta/delta ${fmt(dd.razao, 2)}`}>
          {dd.leitura === 'hiperclorêmica' && (
            <>
              <p className="leading-relaxed">
                Razão abaixo de 1 sugere acidose hiperclorêmica associada — o bicarbonato baixo pode
                ser o volume de salina infundido, não cetoacidose persistente.
              </p>
              <p className="leading-relaxed mt-2 text-text-muted">
                {semFonte(K.NAO_USAR_RESOLUCAO[2])}
              </p>
            </>
          )}
          {dd.leitura === 'ag-puro' && (
            <p className="leading-relaxed">
              Razão entre 1 e 2: acidose com ânion-gap elevado pura, sem distúrbio misto relevante.
            </p>
          )}
          {dd.leitura === 'alcalose' && (
            <p className="leading-relaxed">
              Razão acima de 2 sugere alcalose metabólica associada — vômitos prolongados são a
              causa mais comum nesse contexto.
            </p>
          )}
          <p className="leading-relaxed mt-2 text-xs text-text-muted">
            Delta gap {fmt(dd.deltaGap, 1)} · fórmula em Calculadoras, Delta Gap e Razão Delta/Delta.
          </p>
        </AlertCard>
      )}

      {/* ─── a saida do laco ─── */}
      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-5">
        Critérios de resolução
      </div>
      <div className="rounded-xl border border-border-card overflow-hidden">
        <Criterio ok={res.obrigatorio} rotulo="pH ≥7,3 ou bicarbonato ≥18 mEq/L" peso="obrigatório" />
        <Criterio ok={res.desejavel} rotulo="Glicemia <200 mg/dL" peso="desejável" />
      </div>

      {res.resolvido ? (
        <AlertCard type="success" title="Critério obrigatório atendido">
          <p className="leading-relaxed">Considere iniciar a transição para insulina subcutânea.</p>
        </AlertCard>
      ) : (
        <p className="text-sm text-text-muted leading-relaxed mt-3">
          Enquanto o critério obrigatório não fecha, siga reavaliando as mesmas variáveis.
        </p>
      )}

      <AlertCard type="danger" title="O que NÃO usar como critério de resolução">
        <Paragrafos textos={K.NAO_USAR_RESOLUCAO} />
      </AlertCard>

      {ehEhh && (
        <Collapsible title="Resolução do EHH">
          <p className="text-sm text-text-secondary leading-relaxed mb-3">{semFonte(K.RESOLUCAO_EHH_TEXTO)}</p>
          <ul className="space-y-1">
            {K.RESOLUCAO_EHH_CHECKLIST.map((c, i) => (
              <li key={i} className="text-sm text-text-secondary leading-relaxed">• {c}</li>
            ))}
          </ul>
        </Collapsible>
      )}

      <Collapsible title="Transição para insulina subcutânea" badge={res.resolvido ? 'liberada' : undefined} badgeColor="#4CAF50">
        <Paragrafos textos={K.TRANSICAO_TEXTOS} />
        <div className="flex gap-2 my-3">
          {K.TRANSICAO_SOBREPOSICAO.map(s => (
            <button key={s.id} onClick={() => setTipoSc(s.id)} className={btn(tipoSc === s.id)}>{s.tipo}</button>
          ))}
        </div>
        <AlertCard type="info" title="Manter a infusão EV por">
          <p className="text-lg font-bold text-text-primary">
            {K.TRANSICAO_SOBREPOSICAO.find(s => s.id === tipoSc)!.tempo}
          </p>
          <p className="leading-relaxed mt-2">{semFonte(K.TRANSICAO_NOTA_SOBREPOSICAO)}</p>
        </AlertCard>
        <button onClick={() => setRiscoHipo(!riscoHipo)} className={`${btn(riscoHipo)} w-full my-3`}>
          {riscoHipo ? '✓ ' : ''}Risco de hipoglicemia
        </button>
        {t ? (
          <div className="bg-bg-hover rounded-xl p-3.5 space-y-1.5">
            <div className="flex justify-between gap-3">
              <span className="text-sm text-text-muted">Dose diária total</span>
              <span className="text-sm font-semibold text-text-primary">
                {t.ddtMin === t.ddtMax ? `~${fmt(t.ddtMin, 0)}` : `${fmt(t.ddtMin, 0)}–${fmt(t.ddtMax, 0)}`} U/dia
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-sm text-text-muted">Insulina basal</span>
              <span className="text-sm font-semibold text-text-primary">{fmt(t.basalMin, 1)}–{fmt(t.basalMax, 0)} U</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-warning">Informe o peso para estimar a dose.</p>
        )}
        <p className="text-xs text-text-muted mt-3 leading-relaxed italic">{K.TRANSICAO_NOTA_REPARTICAO}</p>
      </Collapsible>
    </div>
  )
}

function Criterio({ ok, rotulo, peso }: { ok: boolean; rotulo: string; peso: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border-t border-border first:border-t-0">
      <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${
        ok ? 'bg-success border-success text-black' : 'border-border-card'}`}>
        {ok ? '✓' : ''}
      </span>
      <span className={`flex-1 text-sm leading-relaxed ${ok ? 'text-text-primary' : 'text-text-secondary'}`}>{rotulo}</span>
      <span className="text-[11px] text-text-muted flex-shrink-0">{peso}</span>
    </div>
  )
}
