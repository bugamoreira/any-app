import { useState } from 'react'
import { Collapsible } from '../common/Collapsible'
import { AlertCard } from '../common/AlertCard'
import { fmt } from '../../utils/formatters'
import { transicaoInsulina, insulinaVelocidade } from '../../utils/ketoCalc'
import { Paragrafos, btn, campo } from './KetoManejo'
import type { Trilha } from '../../data/ketoData'
import * as K from '../../data/ketoData'

/** Secao 5 — monitorizacao e titulacao. */
export function KetoMonitor({ peso, trilha }: { peso: number | null; trilha: Trilha }) {
  const [mostrarQueda, setMostrarQueda] = useState(false)
  const [velAtualTxt, setVelAtualTxt] = useState('')
  const velAtual = (() => { const v = parseFloat(velAtualTxt.replace(',', '.')); return isNaN(v) ? null : v })()
  const ehEhh = trilha === 'ehh' || trilha === 'misto'

  return (
    <div>
      <Collapsible title="5.1 Cadência de exames">
        <div className="rounded-xl overflow-hidden border border-border-card mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-bg-hover text-text-muted">
                <th className="text-left px-3 py-2 font-semibold">Parâmetro</th>
                <th className="text-left px-3 py-2 font-semibold">Frequência</th>
              </tr>
            </thead>
            <tbody>
              {K.CADENCIA_EXAMES.map(c => (
                <tr key={c.parametro} className="border-t border-border">
                  <td className="px-3 py-2 text-text-secondary leading-relaxed">{c.parametro}</td>
                  <td className="px-3 py-2 text-text-secondary leading-relaxed">{c.frequencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted leading-relaxed mb-3 italic">{K.NOTA_BHB_INDISPONIVEL}</p>
        <Paragrafos textos={K.CADENCIA_TEXTOS} />
        <p className="text-xs text-text-muted mt-3 leading-relaxed">{K.NOTA_UNIDADES}</p>
      </Collapsible>

      <Collapsible title="5.2 Titulação da insulina">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Resposta esperada</div>
        <Paragrafos textos={K.RESPOSTA_ESPERADA} />

        <button onClick={() => setMostrarQueda(!mostrarQueda)} className={`${btn(mostrarQueda)} w-full mt-3`}>
          Queda insuficiente
        </button>

        {mostrarQueda && (
          <AlertCard type="warning" title="Queda insuficiente na primeira hora">
            <p className="leading-relaxed mb-2">{K.QUEDA_INSUFICIENTE_INTRO}</p>
            <ol className="space-y-2">
              {K.QUEDA_INSUFICIENTE_PASSOS.map((passo, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="font-bold text-warning flex-shrink-0">{i + 1}.</span>
                  <span className="text-text-primary">{passo}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 pt-3 border-t border-white/10">
              <label className="block">
                <span className="text-xs text-text-muted">Velocidade atual (U/h)</span>
                <input type="text" inputMode="decimal" value={velAtualTxt}
                  placeholder={peso ? fmt(insulinaVelocidade(peso, 0.1), 1) : '7'}
                  onChange={e => setVelAtualTxt(e.target.value)} className={campo} />
              </label>
              {velAtual !== null && velAtual > 0 && (
                <div className="bg-bg-hover rounded-lg p-3 text-center mt-2">
                  <div className="text-xs text-text-muted">Velocidade dobrada</div>
                  <div className="text-xl font-bold text-accent mt-0.5">
                    {fmt(velAtual * 2, 1)} U/h = {fmt(velAtual * 2, 1)} mL/h
                  </div>
                </div>
              )}
            </div>
          </AlertCard>
        )}

        <AlertCard type="danger" title="Teto de velocidade de queda">
          <p className="leading-relaxed">{K.TETO_QUEDA}</p>
          <p className="leading-relaxed mt-2 text-text-muted text-xs italic">{K.NOTA_TETO_QUEDA}</p>
        </AlertCard>

        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-4">
          Após a glicemia cair abaixo de 250 mg/dL
        </div>
        <Paragrafos textos={K.APOS_250} />

        <div className="rounded-xl overflow-hidden border border-border-card mt-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-bg-hover text-text-muted">
                <th className="text-left px-3 py-2 font-semibold">Fase</th>
                <th className="text-left px-3 py-2 font-semibold">Alvo</th>
              </tr>
            </thead>
            <tbody>
              {K.ALVO_MANUTENCAO.map(a => (
                <tr key={a.fase} className="border-t border-border">
                  <td className="px-3 py-2 text-text-secondary">{a.fase}</td>
                  <td className="px-3 py-2 text-text-secondary">{a.alvo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Collapsible>

      <Collapsible title="5.3 Velocidade de correção">
        {ehEhh ? (
          <AlertCard type="danger" title="EHH — limites de correção">
            <ul className="space-y-1">
              {K.EHH_LIMITES.map((l, i) => (
                <li key={i} className="text-sm text-text-primary leading-relaxed">• {l}</li>
              ))}
            </ul>
          </AlertCard>
        ) : (
          <AlertCard type="warning" title="CAD">
            <p className="leading-relaxed">{K.VELOCIDADE_CORRECAO_CAD}</p>
          </AlertCard>
        )}
      </Collapsible>
    </div>
  )
}

/** Secao 7 — resolucao e transicao. */
export function KetoResolucao({ peso, trilha }: { peso: number | null; trilha: Trilha }) {
  const [checklist, setChecklist] = useState<Record<number, boolean>>({})
  const [riscoHipo, setRiscoHipo] = useState(false)
  const [tipoSc, setTipoSc] = useState(K.TRANSICAO_SOBREPOSICAO[0].id)
  const ehEhh = trilha === 'ehh' || trilha === 'misto'
  const t = peso ? transicaoInsulina(peso, riscoHipo) : null

  return (
    <div>
      <Collapsible title="7.1 Critérios de resolução — CAD">
        <p className="text-sm text-text-secondary leading-relaxed mb-3">{K.RESOLUCAO_CAD_ADA}</p>
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
          Adaptação para este serviço, sem BHB
        </div>
        <div className="rounded-xl overflow-hidden border border-border-card">
          <table className="w-full text-xs">
            <tbody>
              {K.RESOLUCAO_CAD_ADAPTADA.map(c => (
                <tr key={c.criterio} className="border-t border-border first:border-t-0">
                  <td className="px-3 py-2 text-text-secondary leading-relaxed">{c.criterio}</td>
                  <td className="px-3 py-2 text-text-primary font-semibold text-right whitespace-nowrap">{c.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted mt-3 leading-relaxed">{K.NOTA_UNIDADES}</p>
      </Collapsible>

      <AlertCard type="danger" title="7.2 O que NÃO usar como critério de resolução">
        <Paragrafos textos={K.NAO_USAR_RESOLUCAO} />
      </AlertCard>

      {ehEhh && (
        <Collapsible title="7.3 Critérios de resolução — EHH">
          <p className="text-sm text-text-secondary leading-relaxed mb-3">{K.RESOLUCAO_EHH_TEXTO}</p>
          <div className="space-y-2">
            {K.RESOLUCAO_EHH_CHECKLIST.map((item, i) => (
              <button key={i} onClick={() => setChecklist(c => ({ ...c, [i]: !c[i] }))}
                className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg bg-bg-hover min-h-[44px] cursor-pointer">
                <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  checklist[i] ? 'bg-success border-success text-black' : 'border-border-card'}`}>
                  {checklist[i] ? '✓' : ''}
                </span>
                <span className={`text-sm leading-relaxed ${checklist[i] ? 'text-text-primary' : 'text-text-secondary'}`}>{item}</span>
              </button>
            ))}
          </div>
        </Collapsible>
      )}

      <Collapsible title="7.4 Transição para insulina subcutânea">
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
          <p className="leading-relaxed mt-2">{K.TRANSICAO_NOTA_SOBREPOSICAO}</p>
        </AlertCard>

        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-4">
          Dose diária total estimada
        </div>
        <button onClick={() => setRiscoHipo(!riscoHipo)} className={`${btn(riscoHipo)} w-full mb-3`}>
          {riscoHipo ? '✓ ' : ''}Risco de hipoglicemia (insuficiência renal, fragilidade)
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
              <span className="text-sm font-semibold text-text-primary">
                {fmt(t.basalMin, 1)}–{fmt(t.basalMax, 0)} U
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-warning">Informe o peso para estimar a dose.</p>
        )}
        <p className="text-xs text-text-muted mt-3 leading-relaxed italic">{K.TRANSICAO_NOTA_REPARTICAO}</p>

        <div className="mt-4"><Paragrafos textos={K.TRANSICAO_TEXTOS_FINAIS} /></div>
      </Collapsible>
    </div>
  )
}
