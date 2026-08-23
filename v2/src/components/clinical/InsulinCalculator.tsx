import { useState } from 'react'
import { AlertCard } from '../common/AlertCard'
import { statusColors } from '../../utils/formatters'
import type { DoseStatus } from '../../types/clinical'

/**
 * Insulina regular em infusão contínua. Como a heparina, não cabe no
 * `DoseCalculator`: tem duas fases e a conduta vem de tabela por glicemia, não
 * de slider. Existia no v1 e se perdeu na migração.
 *
 * Transcrição de `calcularInsulinaInicio` e `calcularInsulinaAjuste` do v1, sem
 * alterar nenhuma faixa. Diluição: 100 UI (1 frasco 10 mL — 100 UI/mL) + SF 0,9%
 * 100 mL = 1 UI/mL, e por isso UI/h e mL/h são o mesmo número.
 */

interface Faixa {
  id: string
  rotulo: string
  bolusTexto: string
  infusaoTexto: string
  bolus: number
  infusao: number
}

/** Tabela por glicemia — v1, verbatim. */
const TABELA: Faixa[] = [
  { id: 'hipo',    rotulo: '< 70',      bolusTexto: '—', infusaoTexto: 'Corrigir hipo', bolus: 0,  infusao: 0 },
  { id: 'baixa',   rotulo: '70 - 140',  bolusTexto: '—', infusaoTexto: 'Não iniciar',   bolus: 0,  infusao: 0 },
  { id: 'alvo',    rotulo: '141 - 180', bolusTexto: '—', infusaoTexto: '1',             bolus: 0,  infusao: 1 },
  { id: '181-200', rotulo: '181 - 200', bolusTexto: '—', infusaoTexto: '2',             bolus: 0,  infusao: 2 },
  { id: '201-250', rotulo: '201 - 250', bolusTexto: '3', infusaoTexto: '2',             bolus: 3,  infusao: 2 },
  { id: '251-300', rotulo: '251 - 300', bolusTexto: '6', infusaoTexto: '3',             bolus: 6,  infusao: 3 },
  { id: '301-350', rotulo: '301 - 350', bolusTexto: '9', infusaoTexto: '3',             bolus: 9,  infusao: 3 },
  { id: 'sup350',  rotulo: '> 350',     bolusTexto: '10', infusaoTexto: '4',            bolus: 10, infusao: 4 },
]

function faixaDaGlicemia(g: number): Faixa {
  if (g < 70) return TABELA[0]
  if (g <= 140) return TABELA[1]
  if (g <= 180) return TABELA[2]
  if (g <= 200) return TABELA[3]
  if (g <= 250) return TABELA[4]
  if (g <= 300) return TABELA[5]
  if (g <= 350) return TABELA[6]
  return TABELA[7]
}

function statusDaGlicemia(g: number): DoseStatus {
  if (g < 70 || g > 300) return 'critical'
  if (g < 140 || g > 180) return 'caution'
  return 'therapeutic'
}

export function InsulinCalculator() {
  const [fase, setFase] = useState<'inicio' | 'ajuste'>('inicio')
  const [gInicial, setGInicial] = useState('')
  const [gAtual, setGAtual] = useState('')
  const [gAnterior, setGAnterior] = useState('')
  const [infAtual, setInfAtual] = useState('')

  const num = (t: string) => { const v = parseFloat(t.replace(',', '.')); return isNaN(v) ? null : v }
  const g = fase === 'inicio' ? num(gInicial) : num(gAtual)
  const linha = g !== null ? faixaDaGlicemia(g) : null
  const cores = statusColors[g !== null ? statusDaGlicemia(g) : 'therapeutic']

  // --- Fase Ajuste: variação em relação à glicemia de 1 h antes ---
  const gAnt = num(gAnterior)
  const inf = num(infAtual)
  let varTexto: string | null = null
  let acaoTexto: string | null = null
  let variacao = 0
  if (fase === 'ajuste' && g !== null && gAnt !== null) {
    variacao = gAnt - g
    varTexto = `${variacao >= 0 ? '↓ ' : '↑ '}${Math.abs(variacao)} mg/dL/h`
    if (variacao > 100) acaoTexto = 'Queda rápida → ↓ 50%'
    else if (variacao > 50) acaoTexto = 'Queda moderada → ↓ 1 UI/h'
    else if (variacao >= 0) acaoTexto = 'Queda leve → seguir tabela'
    else acaoTexto = 'Subindo → seguir tabela'
  }

  /** Bolus e infusão sugeridos, já com o ajuste pela velocidade de queda. */
  function sugestao(): { bolus: string; infusao: string } {
    if (g === null || !linha) return { bolus: '--', infusao: '--' }

    if (fase === 'inicio') {
      return {
        bolus: g < 140 ? '—' : String(linha.bolus),
        infusao: g < 70 ? 'Corrigir hipo' : (g <= 140 ? 'Não iniciar' : String(linha.infusao)),
      }
    }

    // Ajuste
    if (g < 70) return { bolus: 'PARAR', infusao: 'G50% 40mL' }
    if (g <= 140) {
      return { bolus: '—', infusao: inf && inf > 0 ? `PARAR ou ↓50% (${Math.floor(inf / 2)})` : 'Não iniciar' }
    }

    let infusao = g <= 180 ? (inf ?? 0) : linha.infusao
    let sufixo = ''
    if (gAnt !== null && inf) {
      if (variacao > 100) { infusao = Math.max(0, Math.floor(inf / 2)); sufixo = ' (↓50%)' }
      else if (variacao > 50) { infusao = Math.max(0, inf - 1); sufixo = ' (↓1)' }
    }
    return { bolus: linha.bolus > 0 ? String(linha.bolus) : '—', infusao: `${infusao}${sufixo}` }
  }
  const s = sugestao()

  const botao = (ativo: boolean) =>
    `flex-1 py-2 px-2 rounded-xl text-sm font-medium border min-h-[44px] transition-colors ${
      ativo ? 'bg-accent text-white border-accent' : 'bg-bg-elevated text-text-secondary border-border-card'
    }`
  const campo = 'w-full mt-1 bg-bg-hover border border-border-card rounded-lg px-3 py-2.5 text-text-primary text-base outline-none focus:border-accent'

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button className={botao(fase === 'inicio')} onClick={() => setFase('inicio')}>Início</button>
        <button className={botao(fase === 'ajuste')} onClick={() => setFase('ajuste')}>Ajuste (glicemia)</button>
      </div>

      <div className="bg-bg-elevated rounded-xl p-3.5 mb-3 border-l-[3px] border-info">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Diluição</div>
        <div className="text-sm text-text-secondary">100 UI (1 frasco 10mL — 100UI/mL) + SF 0,9% 100 mL</div>
        <div className="text-sm text-accent font-semibold mt-1">1 UI/mL</div>
      </div>

      {fase === 'inicio' ? (
        <label className="block mb-3">
          <span className="text-xs text-text-muted">Glicemia inicial (mg/dL)</span>
          <input type="text" inputMode="decimal" value={gInicial} placeholder="250"
            onChange={e => setGInicial(e.target.value)} className={campo} />
        </label>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="text-xs text-text-muted">Glicemia atual</span>
              <input type="text" inputMode="decimal" value={gAtual} placeholder="180"
                onChange={e => setGAtual(e.target.value)} className={campo} />
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">Glicemia anterior (1h)</span>
              <input type="text" inputMode="decimal" value={gAnterior} placeholder="250"
                onChange={e => setGAnterior(e.target.value)} className={campo} />
            </label>
          </div>
          <label className="block mb-3">
            <span className="text-xs text-text-muted">Infusão atual (UI/h)</span>
            <input type="text" inputMode="decimal" value={infAtual} placeholder="2"
              onChange={e => setInfAtual(e.target.value)} className={campo} />
          </label>
          {varTexto && (
            <AlertCard type="info" title="Variação">
              <div className="flex justify-between gap-3 py-0.5">
                <span className="text-text-muted">Queda em 1 h</span>
                <span className="text-text-primary font-medium text-right">{varTexto}</span>
              </div>
              <div className="flex justify-between gap-3 py-0.5">
                <span className="text-text-muted">Leitura</span>
                <span className="text-text-primary font-medium text-right">{acaoTexto}</span>
              </div>
            </AlertCard>
          )}
        </>
      )}

      <div className="rounded-xl overflow-hidden border border-border-card mb-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-hover text-text-muted">
              <th className="text-left px-3 py-2 font-semibold">Glicemia</th>
              <th className="text-left px-3 py-2 font-semibold">Bolus</th>
              <th className="text-left px-3 py-2 font-semibold">Infusão</th>
            </tr>
          </thead>
          <tbody>
            {TABELA.map(l => {
              const ativa = linha?.id === l.id
              const cor = ativa ? 'text-accent font-bold' : 'text-text-secondary'
              return (
                <tr key={l.id} className="border-t border-border" style={ativa ? { background: 'rgba(255,82,82,0.12)' } : undefined}>
                  <td className={`px-3 py-2 ${cor}`}>{l.rotulo}</td>
                  <td className={`px-3 py-2 ${cor}`}>{l.bolusTexto}</td>
                  <td className={`px-3 py-2 ${cor}`}>{l.infusaoTexto}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 text-center border-2" style={{ background: cores.bg, borderColor: cores.border }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: cores.text }}>Bolus</div>
          <div className="text-[24px] font-bold leading-tight" style={{ color: cores.text }}>{s.bolus}</div>
          <div className="text-sm mt-1" style={{ color: cores.text }}>UI</div>
        </div>
        <div className="rounded-xl p-4 text-center border-2" style={{ background: cores.bg, borderColor: cores.border }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: cores.text }}>Infusão</div>
          <div className="text-[24px] font-bold leading-tight" style={{ color: cores.text }}>{s.infusao}</div>
          <div className="text-sm mt-1" style={{ color: cores.text }}>UI/h = mL/h</div>
        </div>
      </div>
    </div>
  )
}
