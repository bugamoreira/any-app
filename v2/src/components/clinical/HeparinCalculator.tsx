import { useState } from 'react'
import { useWeight } from '../../contexts/WeightContext'
import { AlertCard } from '../common/AlertCard'
import { fmt } from '../../utils/formatters'
import { statusColors } from '../../utils/formatters'
import type { DoseStatus } from '../../types/clinical'

/**
 * Heparina não fabrica em `DoseCalculator`: tem duas fases (Início e Ajuste),
 * dois modos de indicação e um nomograma por TTPa. Existia no v1 e se perdeu na
 * migração para o React.
 *
 * Tudo abaixo é transcrição do v1 (`setHepMode`, `calcularHeparinaInicio` e
 * `calcularAjusteHep`), sem alterar nenhuma faixa.
 * Diluição: 25.000 UI (1 frasco 5 mL — 5.000 UI/mL) + SF 0,9% qsp 250 mL = 100 UI/mL.
 */

const CONC = 100 // UI/mL

const MODOS = {
  sca: {
    label: 'SCA',
    bolusTitulo: 'Bolus inicial (SCA)',
    bolusTexto: '60 UI/kg (máx 4.000 UI)',
    bolusPorKg: 60,
    bolusTeto: 4000,
    infusaoTexto: '12 UI/kg/h (máx 1.000 UI/h)',
    infusaoPorKg: 12,
    infusaoTeto: 1000,
  },
  tep: {
    label: 'TEP/TEV',
    bolusTitulo: 'Bolus inicial (TEP/TEV)',
    bolusTexto: '80 UI/kg',
    bolusPorKg: 80,
    bolusTeto: null as number | null,
    infusaoTexto: '18 UI/kg/h',
    infusaoPorKg: 18,
    infusaoTeto: null as number | null,
  },
} as const

type ModoId = keyof typeof MODOS

/** Nomograma de ajuste por TTPa/R — v1, verbatim. */
const NOMOGRAMA = [
  { id: 'sub12',  faixa: '< 1,2',     bolus: '80 UI/kg', acao: '↑ 4 UI/kg/h',  bolusPorKg: 80, ajuste: 4 },
  { id: '12-15',  faixa: '1,2 - 1,5', bolus: '40 UI/kg', acao: '↑ 2 UI/kg/h',  bolusPorKg: 40, ajuste: 2 },
  { id: 'alvo',   faixa: '1,5 - 2,5', bolus: '—',        acao: 'Manter',        bolusPorKg: 0,  ajuste: 0 },
  { id: '25-30',  faixa: '2,5 - 3,0', bolus: '—',        acao: '↓ 2 UI/kg/h',  bolusPorKg: 0,  ajuste: -2 },
  { id: 'sup30',  faixa: '> 3,0',     bolus: 'Parar 1h', acao: '↓ 3 UI/kg/h',  bolusPorKg: 0,  ajuste: -3 },
]

function faixaDoTtpa(t: number) {
  if (t < 1.2) return NOMOGRAMA[0]
  if (t < 1.5) return NOMOGRAMA[1]
  if (t <= 2.5) return NOMOGRAMA[2]
  if (t <= 3.0) return NOMOGRAMA[3]
  return NOMOGRAMA[4]
}

export function HeparinCalculator() {
  const { weight } = useWeight()
  const [fase, setFase] = useState<'inicio' | 'ajuste'>('inicio')
  const [modoId, setModoId] = useState<ModoId>('sca')
  const [ttpaTxt, setTtpaTxt] = useState('')
  const [doseAtualTxt, setDoseAtualTxt] = useState('')

  const modo = MODOS[modoId]
  const ttpa = parseFloat(ttpaTxt.replace(',', '.'))
  const doseAtual = parseFloat(doseAtualTxt.replace(',', '.'))

  // --- Fase Início ---
  const bolusInicial = weight
    ? (modo.bolusTeto !== null ? Math.min(modo.bolusPorKg * weight, modo.bolusTeto) : modo.bolusPorKg * weight)
    : null
  const uiHInicial = weight
    ? (modo.infusaoTeto !== null ? Math.min(modo.infusaoPorKg * weight, modo.infusaoTeto) : modo.infusaoPorKg * weight)
    : null

  // --- Fase Ajuste ---
  const linha = !isNaN(ttpa) && ttpa > 0 ? faixaDoTtpa(ttpa) : null
  const bolusAdicional = linha && weight ? linha.bolusPorKg * weight : 0
  const novaDose = linha && weight
    ? Math.max(0, (!isNaN(doseAtual) ? doseAtual : modo.infusaoPorKg) + linha.ajuste)
    : null
  const uiHAjuste = novaDose !== null && weight ? novaDose * weight : null

  // Cor do resultado segue o TTPa, nao a velocidade (v1)
  let status: DoseStatus = 'therapeutic'
  if (linha) {
    if (ttpa < 1.5 || ttpa > 2.5) status = 'caution'
    if (ttpa < 1.2 || ttpa > 3.0) status = 'critical'
  }
  const cores = statusColors[status]

  const mlh = fase === 'inicio' ? (uiHInicial !== null ? uiHInicial / CONC : null)
                                : (uiHAjuste !== null ? uiHAjuste / CONC : null)
  const uiH = fase === 'inicio' ? uiHInicial : uiHAjuste

  const botao = (ativo: boolean) =>
    `flex-1 py-2 px-2 rounded-xl text-sm font-medium border min-h-[44px] transition-colors ${
      ativo ? 'bg-accent text-white border-accent' : 'bg-bg-elevated text-text-secondary border-border-card'
    }`

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button className={botao(fase === 'inicio')} onClick={() => setFase('inicio')}>Início</button>
        <button className={botao(fase === 'ajuste')} onClick={() => setFase('ajuste')}>Ajuste (TTPa)</button>
      </div>
      <div className="flex gap-2 mb-3">
        {(Object.keys(MODOS) as ModoId[]).map(id => (
          <button key={id} className={botao(modoId === id)} onClick={() => setModoId(id)}>
            {MODOS[id].label}
          </button>
        ))}
      </div>

      <div className="bg-bg-elevated rounded-xl p-3.5 mb-3 border-l-[3px] border-info">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Diluição</div>
        <div className="text-sm text-text-secondary">25.000 UI (1 frasco 5mL — 5.000UI/mL) + SF 0,9% qsp 250 mL</div>
        <div className="text-sm text-accent font-semibold mt-1">100 UI/mL</div>
      </div>

      {fase === 'inicio' ? (
        <AlertCard type="warning" title={modo.bolusTitulo}>
          <div className="flex justify-between gap-3 py-0.5">
            <span className="text-text-muted">Dose bolus</span>
            <span className="text-text-primary font-medium text-right">{modo.bolusTexto}</span>
          </div>
          {weight && (
            <div className="flex justify-between gap-3 py-0.5">
              <span className="text-text-muted">Este paciente</span>
              <span className="font-bold text-right" style={{ color: '#FFD740' }}>{fmt(bolusInicial, 0)} UI</span>
            </div>
          )}
          <div className="flex justify-between gap-3 py-0.5">
            <span className="text-text-muted">Infusão inicial</span>
            <span className="text-text-primary font-medium text-right">{modo.infusaoTexto}</span>
          </div>
        </AlertCard>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="text-xs text-text-muted">TTPa/R atual</span>
              <input
                type="text" inputMode="decimal" value={ttpaTxt} placeholder="1,5"
                onChange={e => setTtpaTxt(e.target.value)}
                className="w-full mt-1 bg-bg-hover border border-border-card rounded-lg px-3 py-2.5 text-text-primary text-base outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">Dose atual (UI/kg/h)</span>
              <input
                type="text" inputMode="decimal" value={doseAtualTxt} placeholder={String(modo.infusaoPorKg)}
                onChange={e => setDoseAtualTxt(e.target.value)}
                className="w-full mt-1 bg-bg-hover border border-border-card rounded-lg px-3 py-2.5 text-text-primary text-base outline-none focus:border-accent"
              />
            </label>
          </div>

          <div className="rounded-xl overflow-hidden border border-border-card mb-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-bg-hover text-text-muted">
                  <th className="text-left px-3 py-2 font-semibold">TTPa/R</th>
                  <th className="text-left px-3 py-2 font-semibold">Bolus</th>
                  <th className="text-left px-3 py-2 font-semibold">Ajuste</th>
                </tr>
              </thead>
              <tbody>
                {NOMOGRAMA.map(l => (
                  <tr
                    key={l.id}
                    className="border-t border-border"
                    style={linha?.id === l.id ? { background: 'rgba(255,82,82,0.12)' } : undefined}
                  >
                    <td className={`px-3 py-2 ${linha?.id === l.id ? 'text-accent font-bold' : 'text-text-secondary'}`}>{l.faixa}</td>
                    <td className={`px-3 py-2 ${linha?.id === l.id ? 'text-accent font-bold' : 'text-text-secondary'}`}>{l.bolus}</td>
                    <td className={`px-3 py-2 ${linha?.id === l.id ? 'text-accent font-bold' : 'text-text-secondary'}`}>{l.acao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {linha && (
            <AlertCard type={linha.id === 'sup30' ? 'danger' : 'info'} title={linha.id === 'sup30' ? 'TTPa > 3,0' : 'Ajuste'}>
              {linha.id === 'sup30' && (
                <div className="flex justify-between gap-3 py-0.5">
                  <span className="text-text-muted">Ação</span>
                  <span className="text-text-primary font-medium text-right">Parar infusão por 1 hora</span>
                </div>
              )}
              <div className="flex justify-between gap-3 py-0.5">
                <span className="text-text-muted">Bolus adicional</span>
                <span className="text-text-primary font-medium text-right">
                  {bolusAdicional > 0 ? `${fmt(bolusAdicional, 0)} UI (${fmt(bolusAdicional / CONC)} mL)` : '—'}
                </span>
              </div>
              <div className="flex justify-between gap-3 py-0.5">
                <span className="text-text-muted">Nova dose</span>
                <span className="text-text-primary font-medium text-right">{fmt(novaDose)} UI/kg/h</span>
              </div>
            </AlertCard>
          )}
        </>
      )}

      {!weight ? (
        <div className="text-center text-sm text-warning py-4">Informe o peso do paciente</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="rounded-xl p-4 text-center border-2" style={{ background: cores.bg, borderColor: cores.border }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: cores.text }}>Velocidade</div>
            <div className="text-[28px] font-bold" style={{ color: cores.text }}>{mlh !== null ? fmt(mlh) : '--'}</div>
            <div className="text-sm mt-1" style={{ color: cores.text }}>mL/h</div>
          </div>
          <div className="rounded-xl p-4 text-center border-2" style={{ background: cores.bg, borderColor: cores.border }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: cores.text }}>Dose</div>
            <div className="text-[28px] font-bold" style={{ color: cores.text }}>{uiH !== null ? fmt(uiH, 0) : '--'}</div>
            <div className="text-sm mt-1" style={{ color: cores.text }}>UI/h</div>
          </div>
        </div>
      )}
    </div>
  )
}
