import { useState } from 'react'
import { Collapsible } from '../common/Collapsible'
import { AlertCard } from '../common/AlertCard'
import { fmt } from '../../utils/formatters'
import { anionGap, sodioCorrigido, osmolaridadeEfetiva, deficitAguaLivre } from '../../utils/ketoCalc'
import { Paragrafos, btn, semFonte } from './KetoManejo'
import type { KetoDados, Trilha } from '../../data/ketoData'
import * as K from '../../data/ketoData'

/** Telas de consulta pontual, alcancadas pelo grid da home. */

export function TelaReconhecimento() {
  return (
    <div>
      <Collapsible title="1.1 Quando suspeitar">
        <Paragrafos textos={K.QUANDO_SUSPEITAR} />
        <AlertCard type="warning" title="Dor abdominal">
          <p className="leading-relaxed">{semFonte(K.ALERTA_DOR_ABDOMINAL)}</p>
        </AlertCard>
      </Collapsible>

      {/* 1.2 vem ANTES dos criterios diagnosticos, como a spec exige */}
      <AlertCard type="danger" title="1.2 CAD euglicêmica">
        <Paragrafos textos={K.CAD_EUGLICEMICA} />
      </AlertCard>

      <Collapsible title="1.3 Critérios diagnósticos — CAD">
        <p className="text-sm text-text-secondary leading-relaxed mb-3">
          Os três componentes precisam estar presentes.
        </p>
        <div className="rounded-xl overflow-hidden border border-border-card mb-3">
          <table className="w-full text-xs">
            <tbody>
              {K.CRITERIOS_CAD.map(c => (
                <tr key={c.eixo} className="border-t border-border first:border-t-0">
                  <td className="px-3 py-2 text-text-primary font-semibold align-top whitespace-nowrap">{c.eixo}</td>
                  <td className="px-3 py-2 text-text-secondary leading-relaxed">{semFonte(c.criterio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted leading-relaxed italic mb-2">{semFonte(K.NOTA_CRITERIOS_CAD)}</p>
        <p className="text-sm text-text-secondary leading-relaxed">{semFonte(K.NOTA_GASOMETRIA)}</p>
        <p className="text-xs text-text-muted mt-3 leading-relaxed">{semFonte(K.NOTA_UNIDADES)}</p>
      </Collapsible>

      <AlertCard type="warning" title="1.4 Discordância da cetonúria">
        <Paragrafos textos={K.DISCORDANCIA_CETONURIA} />
      </AlertCard>

      <Collapsible title="Critérios do EHH — referência">
        <ul className="space-y-1 mb-3">
          {K.CRITERIOS_EHH.map((c, i) => (
            <li key={i} className="text-sm text-text-secondary leading-relaxed">• {semFonte(c)}</li>
          ))}
        </ul>
        <p className="text-sm text-text-secondary leading-relaxed">{semFonte(K.NOTA_EHH)}</p>
      </Collapsible>

      <Collapsible title="1.7 Diagnóstico diferencial">
        <Paragrafos textos={K.DIAGNOSTICO_DIFERENCIAL} />
      </Collapsible>
    </div>
  )
}

export function TelaExames() {
  return (
    <div>
      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
        Se houver suspeita de CAD ou EHH
      </div>
      <ul className="space-y-1 mb-3">
        {K.PAINEL_INICIAL.map(e => (
          <li key={e} className="text-sm text-text-secondary leading-relaxed">• {e}</li>
        ))}
      </ul>
      <p className="text-xs text-text-muted leading-relaxed mb-3 italic">{semFonte(K.NOTA_PAINEL_INICIAL)}</p>
      <AlertCard type="info" title="Sobre o eletrocardiograma">
        <p className="leading-relaxed">{semFonte(K.NOTA_ECG)}</p>
      </AlertCard>
      <Collapsible title="Avaliação de volemia">
        <Paragrafos textos={K.AVALIACAO_VOLEMIA} />
      </Collapsible>
      <Collapsible title="Conforme suspeita clínica">
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
    </div>
  )
}

export function TelaCalculadoras({ dados, peso, trilha }: {
  dados: KetoDados; peso: number | null; trilha: Trilha
}) {
  const [sexo, setSexo] = useState<'M' | 'F'>('M')
  const [idoso, setIdoso] = useState(false)
  const ehEhh = trilha === 'ehh' || trilha === 'misto'

  const naCorr = dados.sodio !== null && dados.glicemia !== null
    ? sodioCorrigido(dados.sodio, dados.glicemia) : null
  const ag = dados.sodio !== null && dados.cloro !== null && dados.bicarbonato !== null
    ? anionGap(dados.sodio, dados.cloro, dados.bicarbonato) : null
  const osm = dados.sodio !== null && dados.glicemia !== null
    ? osmolaridadeEfetiva(dados.sodio, dados.glicemia) : null
  const deficit = ehEhh && peso && naCorr !== null ? deficitAguaLivre(peso, sexo, idoso, naCorr) : null

  return (
    <div>
      <Collapsible title="Ânion-gap" badge={ag !== null ? `${ag} mEq/L` : undefined} badgeColor="#2196F3">
        <p className="text-sm text-text-secondary mb-2">AG = Na − (Cl + HCO₃)</p>
        {ag !== null ? (
          <AlertCard type={ag > 12 ? 'warning' : 'info'} title={`${ag} mEq/L`}>
            <p className="leading-relaxed">
              {ag > 12
                ? 'Ânion-gap acima de 12 mEq/L indica acidose metabólica com ânion-gap elevado, compatível com CAD.'
                : 'Ânion-gap dentro da faixa habitual.'}
            </p>
          </AlertCard>
        ) : (
          <p className="text-sm text-warning">Informe sódio, cloro e bicarbonato nos dados do paciente.</p>
        )}
        <p className="text-xs text-text-muted mt-3 leading-relaxed">{semFonte(K.NOTA_ANION_GAP)}</p>
        <p className="text-xs text-text-muted mt-2 leading-relaxed">{semFonte(K.NOTA_UNIDADES)}</p>
      </Collapsible>

      <Collapsible title="Sódio corrigido" badge={naCorr !== null ? `${fmt(naCorr, 1)}` : undefined} badgeColor="#2196F3">
        <p className="text-sm text-text-secondary mb-2">Na corrigido = Na medido + 2,0 × [(glicemia − 100) / 100]</p>
        {naCorr !== null ? (
          <AlertCard type="info" title={`${fmt(naCorr, 1)} mEq/L`}>
            <p className="leading-relaxed">{naCorr < 135 ? K.FASE_B.abaixo135 : K.FASE_B.acima135}</p>
          </AlertCard>
        ) : (
          <p className="text-sm text-warning">Informe sódio e glicemia nos dados do paciente.</p>
        )}
        <p className="text-xs text-text-muted mt-3 leading-relaxed">{semFonte(K.NOTA_SODIO_CORRIGIDO)}</p>
      </Collapsible>

      <Collapsible title="Osmolaridade efetiva" badge={osm !== null ? `${osm}` : undefined} badgeColor="#2196F3">
        <p className="text-sm text-text-secondary mb-2">Osm efetiva = (2 × Na) + (glicemia / 18)</p>
        <p className="text-xs text-text-muted mb-2">Usa o sódio medido, não o corrigido.</p>
        {osm !== null ? (
          <div className="bg-bg-hover rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-accent">{osm}</div>
            <div className="text-sm text-text-muted">mOsm/kg</div>
          </div>
        ) : (
          <p className="text-sm text-warning">Informe sódio e glicemia nos dados do paciente.</p>
        )}
      </Collapsible>

      {ehEhh && (
        <Collapsible title="Déficit de água livre" badge="EHH" badgeColor="#FF5252">
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
            <p className="text-sm text-warning">Informe peso, sódio e glicemia nos dados do paciente.</p>
          )}
          <p className="text-xs text-text-muted mt-3 leading-relaxed">{semFonte(K.NOTA_DEFICIT_AGUA)}</p>
        </Collapsible>
      )}
    </div>
  )
}

export function TelaArmadilhas() {
  return (
    <div>
      {K.ARMADILHAS.map(a => (
        <Collapsible key={a.titulo} title={a.titulo}>
          <Paragrafos textos={a.textos} />
        </Collapsible>
      ))}
    </div>
  )
}

export function TelaPrecipitante() {
  const [marcados, setMarcados] = useState<Record<string, boolean>>({})
  return (
    <div>
      <p className="text-sm text-text-secondary leading-relaxed mb-3">{semFonte(K.FATOR_PRECIPITANTE_INTRO)}</p>
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
                <span className="block text-xs text-text-muted leading-relaxed mt-0.5">{semFonte(f.nota)}</span>
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
        <p className="leading-relaxed">{semFonte(K.RASTREIO_SAUDE_MENTAL)}</p>
      </AlertCard>
    </div>
  )
}

export function TelaReferencias() {
  return (
    <ol className="space-y-3">
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
  )
}
