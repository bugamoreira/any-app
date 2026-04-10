import { useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
import { Collapsible } from '../components/common/Collapsible'
import { ToastContainer } from '../components/common/Toast'
// Toast disponível via contexto
import { fmt } from '../utils/calculations'
// calcHACOR disponível em vmData
import {
  VM_CALCULATORS,
  VM_DESCRIPTIONS,
  VM_REFERENCES,
  VM_FAB_SECTIONS,
  SDRA_TABLE,
  SDRA_NOVIDADES,
  HACOR_VARIABLES,
  HACOR_REF,
  calcPesoIdeal,
  calcRva, interpretRva,
  calcCst, interpretCst,
  calcDP, interpretDP,
  calcPF, interpretPF,
  calcSF, interpretSF,
  calcNewFiO2,
  calcNewFreq,
  calcTobin, interpretTobin,
  calcROX, interpretROX,
  calcTau,
  calcPmus, interpretPmus,
  calcMP, interpretMP,
  calcIA, interpretIA,
  hacorTotal, interpretHACOR,
} from '../data/vmData'
import type { HacorEntry } from '../data/vmData'

// ==========================================
// Componentes internos auxiliares
// ==========================================

type CalcStatus = 'success' | 'warning' | 'danger' | 'info'

const statusBg: Record<CalcStatus, string> = {
  success: 'bg-success/15 border-success text-success',
  warning: 'bg-warning/15 border-warning text-warning',
  danger: 'bg-danger/15 border-danger text-danger',
  info: 'bg-info/15 border-info text-info',
}

function ResultBox({ status, value, detail, visible }: {
  status: CalcStatus
  value: string
  detail: string
  visible: boolean
}) {
  if (!visible) return null
  return (
    <div className={`mt-3 p-3 rounded-lg border text-sm ${statusBg[status]}`}>
      <div className="text-xl font-bold mb-1">{value}</div>
      <div className="text-[13px] opacity-90" dangerouslySetInnerHTML={{ __html: detail }} />
    </div>
  )
}

function CalcInput({ label, id, unit, placeholder, value, onChange, warning }: {
  label: string
  id: string
  unit?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  warning?: string | null
}) {
  return (
    <div className="mb-3">
      <label className="block text-[13px] text-text-secondary mb-1.5">{label}</label>
      <div className="flex gap-2 items-center">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`flex-1 bg-bg-elevated border rounded-lg px-3 py-3 text-base text-text-primary min-h-[44px] outline-none focus:border-accent ${
            warning ? 'border-warning bg-warning/10' : 'border-border-card'
          }`}
        />
        {unit && <span className="text-sm text-text-secondary min-w-[50px]">{unit}</span>}
      </div>
      {warning && (
        <div className="text-xs text-warning mt-1 px-2.5 py-1.5 bg-warning/10 rounded-md">
          {warning}
        </div>
      )}
    </div>
  )
}

function CalcSelect({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="mb-3">
      <label className="block text-[13px] text-text-secondary mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-bg-elevated border border-border-card rounded-lg px-3 py-3 text-base text-text-primary min-h-[44px] outline-none focus:border-accent"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function CalcButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-accent text-white border-none rounded-lg px-5 py-3 text-sm font-semibold min-h-[44px] mt-3 active:bg-accent-hover cursor-pointer"
    >
      {children}
    </button>
  )
}

function ConceptDesc({ text }: { text: string }) {
  return (
    <div className="text-[13px] text-text-secondary mb-3 leading-relaxed p-2.5 bg-bg-card rounded-lg border-l-[3px] border-l-accent">
      {text}
    </div>
  )
}

function InfoBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-info/10 border border-info rounded-lg p-3 mt-3 text-[13px] text-info">
      <strong>{title}</strong>
      <ul className="mt-2 ml-4 list-disc">
        {items.map((item, i) => <li key={i} className="mb-1">{item}</li>)}
      </ul>
    </div>
  )
}

// Inner Collapsible for subsections (nested)
function SubCollapsible({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  const [open, setOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  return (
    <div id={`sub-${id}`} className="bg-[#252525] rounded-lg mb-3 overflow-hidden scroll-mt-[200px]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-3 bg-transparent border-none cursor-pointer text-left"
      >
        <span className="text-sm font-medium text-accent">{title}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        ref={bodyRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '9999px' : '0px' }}
      >
        <div className="px-3 pb-3">{children}</div>
      </div>
    </div>
  )
}

// ==========================================
// Componentes de calculadoras individuais
// ==========================================

function PesoIdealCalc() {
  const [sexo, setSexo] = useState<'M' | 'F'>('M')
  const [altura, setAltura] = useState('')
  const [result, setResult] = useState<{ pbw: number } | null>(null)

  const alturaWarning = useMemo(() => {
    const v = parseFloat(altura)
    if (v && (v < 140 || v > 210)) return 'Altura fora da faixa habitual (140-210 cm)'
    return null
  }, [altura])

  function calc() {
    const h = parseFloat(altura)
    if (!h) { setResult(null); return }
    setResult({ pbw: calcPesoIdeal(sexo, h) })
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.pesoIdeal} />
      <CalcSelect
        label="Sexo"
        value={sexo}
        onChange={v => setSexo(v as 'M' | 'F')}
        options={[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' }]}
      />
      <CalcInput label="Altura (cm)" id="altura" unit="cm" placeholder="Ex: 170" value={altura} onChange={setAltura} warning={alturaWarning} />
      <CalcButton onClick={calc}>Calcular</CalcButton>
      {result && (
        <ResultBox
          status="info"
          value={`Peso ideal: ${fmt(result.pbw)} kg`}
          detail={`VC 4 mL/kg: ${fmt(result.pbw * 4, 0)} mL<br>VC 6 mL/kg: ${fmt(result.pbw * 6, 0)} mL<br>VC 8 mL/kg: ${fmt(result.pbw * 8, 0)} mL`}
          visible
        />
      )}
    </>
  )
}

function RvaCalc() {
  const [ppico, setPpico] = useState('')
  const [ppausa, setPpausa] = useState('')
  const [fluxo, setFluxo] = useState('')
  const [result, setResult] = useState<{ val: number; status: CalcStatus; text: string } | null>(null)

  function calc() {
    const pp = parseFloat(ppico), pa = parseFloat(ppausa), fl = parseFloat(fluxo)
    if (!pp || !pa || !fl) { setResult(null); return }
    const rva = calcRva(pp, pa, fl)
    const i = interpretRva(rva)
    setResult({ val: rva, status: i.status, text: i.text })
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.rva} />
      <CalcInput label="Pressão de pico (cmH₂O)" id="ppico" unit="cmH₂O" placeholder="Ex: 30" value={ppico} onChange={setPpico}
        warning={parseFloat(ppico) && (parseFloat(ppico) < 5 || parseFloat(ppico) > 60) ? 'Valor fora da faixa habitual (5-60 cmH₂O)' : null} />
      <CalcInput label="Pressão de pausa (plato) (cmH₂O)" id="ppausa" unit="cmH₂O" placeholder="Ex: 20" value={ppausa} onChange={setPpausa}
        warning={parseFloat(ppausa) && (parseFloat(ppausa) < 5 || parseFloat(ppausa) > 45) ? 'Valor fora da faixa habitual (5-45 cmH₂O)' : null} />
      <CalcInput label="Fluxo inspiratório (L/min)" id="fluxo" unit="L/min" placeholder="Ex: 60" value={fluxo} onChange={setFluxo}
        warning={parseFloat(fluxo) && (parseFloat(fluxo) < 20 || parseFloat(fluxo) > 100) ? 'Valor fora da faixa habitual (20-100 L/min)' : null} />
      <CalcButton onClick={calc}>Calcular Rva</CalcButton>
      {result && <ResultBox status={result.status} value={`Rva: ${fmt(result.val)} cmH₂O/L/s`} detail={result.text} visible />}
    </>
  )
}

function CstCalc() {
  const [vc, setVc] = useState('')
  const [ppausa, setPpausa] = useState('')
  const [peep, setPeep] = useState('')
  const [result, setResult] = useState<{ val: number; status: CalcStatus; text: string } | null>(null)

  function calc() {
    const v = parseFloat(vc), pp = parseFloat(ppausa), pe = parseFloat(peep)
    if (!v || !pp || isNaN(pe)) { setResult(null); return }
    const cst = calcCst(v, pp, pe)
    const i = interpretCst(cst)
    setResult({ val: cst, status: i.status, text: i.text })
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.cst} />
      <CalcInput label="Volume corrente (mL)" id="vcCst" unit="mL" placeholder="Ex: 400" value={vc} onChange={setVc}
        warning={parseFloat(vc) && (parseFloat(vc) < 200 || parseFloat(vc) > 800) ? 'Valor fora da faixa habitual (200-800 mL)' : null} />
      <CalcInput label="Pressão de pausa (plato) (cmH₂O)" id="ppausaCst" unit="cmH₂O" placeholder="Ex: 20" value={ppausa} onChange={setPpausa}
        warning={parseFloat(ppausa) && (parseFloat(ppausa) < 5 || parseFloat(ppausa) > 45) ? 'Valor fora da faixa habitual' : null} />
      <CalcInput label="PEEP (cmH₂O)" id="peepCst" unit="cmH₂O" placeholder="Ex: 5" value={peep} onChange={setPeep}
        warning={parseFloat(peep) && (parseFloat(peep) < 0 || parseFloat(peep) > 24) ? 'Valor fora da faixa habitual (0-24 cmH₂O)' : null} />
      <CalcButton onClick={calc}>Calcular Cst</CalcButton>
      {result && <ResultBox status={result.status} value={`Cst: ${fmt(result.val)} mL/cmH₂O`} detail={result.text} visible />}
    </>
  )
}

function DPCalc() {
  const [ppausa, setPpausa] = useState('')
  const [peep, setPeep] = useState('')
  const [result, setResult] = useState<{ val: number; status: CalcStatus; text: string } | null>(null)

  function calc() {
    const pp = parseFloat(ppausa), pe = parseFloat(peep)
    if (!pp || isNaN(pe)) { setResult(null); return }
    const dp = calcDP(pp, pe)
    const i = interpretDP(dp)
    setResult({ val: dp, status: i.status, text: i.text })
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.dp} />
      <CalcInput label="Pressão de pausa (plato) (cmH₂O)" id="ppausaDP" unit="cmH₂O" placeholder="Ex: 25" value={ppausa} onChange={setPpausa}
        warning={parseFloat(ppausa) && (parseFloat(ppausa) < 5 || parseFloat(ppausa) > 45) ? 'Valor fora da faixa habitual' : null} />
      <CalcInput label="PEEP (cmH₂O)" id="peepDP" unit="cmH₂O" placeholder="Ex: 10" value={peep} onChange={setPeep}
        warning={parseFloat(peep) && (parseFloat(peep) < 0 || parseFloat(peep) > 24) ? 'Valor fora da faixa habitual' : null} />
      <CalcButton onClick={calc}>Calcular deltaP</CalcButton>
      {result && <ResultBox status={result.status} value={`deltaP: ${fmt(result.val)} cmH₂O`} detail={result.text} visible />}
    </>
  )
}

function PFCalc() {
  const [pao2, setPao2] = useState('')
  const [fio2, setFio2] = useState('')
  const [result, setResult] = useState<{ val: number; status: CalcStatus; text: string } | null>(null)

  function calc() {
    const p = parseFloat(pao2), f = parseFloat(fio2)
    if (!p || !f) { setResult(null); return }
    const pf = calcPF(p, f)
    const i = interpretPF(pf)
    setResult({ val: pf, status: i.status, text: i.text })
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.pf} />
      <CalcInput label="PaO₂ (mmHg)" id="pao2" unit="mmHg" placeholder="Ex: 80" value={pao2} onChange={setPao2}
        warning={parseFloat(pao2) && (parseFloat(pao2) < 30 || parseFloat(pao2) > 500) ? 'Valor fora da faixa habitual (30-500 mmHg)' : null} />
      <CalcInput label="FiO₂ (0.21 a 1.0)" id="fio2PF" placeholder="Ex: 0.4" value={fio2} onChange={setFio2}
        warning={parseFloat(fio2) && (parseFloat(fio2) < 0.21 || parseFloat(fio2) > 1.0) ? 'FiO₂ deve estar entre 0.21 e 1.0' : null} />
      <CalcButton onClick={calc}>Calcular P/F</CalcButton>
      {result && <ResultBox status={result.status} value={`P/F: ${fmt(result.val, 0)}`} detail={result.text} visible />}
    </>
  )
}

function SFCalc() {
  const [spo2, setSpo2] = useState('')
  const [fio2, setFio2] = useState('')
  const [result, setResult] = useState<{ val: number; status: CalcStatus; text: string } | null>(null)

  function calc() {
    const s = parseFloat(spo2), f = parseFloat(fio2)
    if (!s || !f) { setResult(null); return }
    if (s > 97) {
      setResult({ val: 0, status: 'info', text: 'Relação S/F não é confiável com SpO₂ > 97%' })
      return
    }
    const sf = calcSF(s, f)
    const i = interpretSF(sf)
    setResult({ val: sf, status: i.status, text: i.text })
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.sf} />
      <CalcInput label="SpO₂ (%)" id="spo2" unit="%" placeholder="Ex: 92" value={spo2} onChange={setSpo2}
        warning={parseFloat(spo2) && (parseFloat(spo2) < 70 || parseFloat(spo2) > 100) ? 'SpO₂ deve estar entre 70-100%' : null} />
      <CalcInput label="FiO₂ (0.21 a 1.0)" id="fio2SF" placeholder="Ex: 0.4" value={fio2} onChange={setFio2}
        warning={parseFloat(fio2) && (parseFloat(fio2) < 0.21 || parseFloat(fio2) > 1.0) ? 'FiO₂ deve estar entre 0.21 e 1.0' : null} />
      <CalcButton onClick={calc}>Calcular S/F</CalcButton>
      {result && (
        <ResultBox
          status={result.status}
          value={result.val === 0 ? 'SpO₂ > 97%' : `S/F: ${fmt(result.val, 0)}`}
          detail={result.text}
          visible
        />
      )}
    </>
  )
}

function AjusteFiO2Calc() {
  const [pao2Atual, setPao2Atual] = useState('')
  const [fio2Atual, setFio2Atual] = useState('')
  const [pao2Alvo, setPao2Alvo] = useState('')
  const [result, setResult] = useState<number | null>(null)

  function calc() {
    const pa = parseFloat(pao2Atual), fa = parseFloat(fio2Atual), pt = parseFloat(pao2Alvo)
    if (!pa || !fa || !pt) { setResult(null); return }
    setResult(calcNewFiO2(pa, fa, pt))
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.ajusteFio2} />
      <CalcInput label="PaO₂ atual (mmHg)" id="pao2Atual" unit="mmHg" placeholder="Ex: 60" value={pao2Atual} onChange={setPao2Atual} />
      <CalcInput label="FiO₂ atual (0.21 a 1.0)" id="fio2Atual" placeholder="Ex: 0.4" value={fio2Atual} onChange={setFio2Atual} />
      <CalcInput label="PaO₂ alvo (mmHg)" id="pao2Alvo" unit="mmHg" placeholder="Ex: 80" value={pao2Alvo} onChange={setPao2Alvo} />
      <CalcButton onClick={calc}>Calcular nova FiO₂</CalcButton>
      {result !== null && (
        <ResultBox status="info" value={`Nova FiO₂: ${result.toFixed(2)}`} detail={`Equivalente a ${(result * 100).toFixed(0)}%`} visible />
      )}
    </>
  )
}

function AjusteFreqCalc() {
  const [freqAtual, setFreqAtual] = useState('')
  const [paco2Atual, setPaco2Atual] = useState('')
  const [paco2Alvo, setPaco2Alvo] = useState('')
  const [result, setResult] = useState<number | null>(null)

  function calc() {
    const f = parseFloat(freqAtual), ca = parseFloat(paco2Atual), ct = parseFloat(paco2Alvo)
    if (!f || !ca || !ct) { setResult(null); return }
    setResult(calcNewFreq(f, ca, ct))
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.ajusteFreq} />
      <CalcInput label="Frequência atual (ipm)" id="freqAtual" unit="ipm" placeholder="Ex: 16" value={freqAtual} onChange={setFreqAtual}
        warning={parseFloat(freqAtual) && (parseFloat(freqAtual) < 6 || parseFloat(freqAtual) > 40) ? 'Valor fora da faixa habitual (6-40 ipm)' : null} />
      <CalcInput label="PaCO2 atual (mmHg)" id="paco2Atual" unit="mmHg" placeholder="Ex: 50" value={paco2Atual} onChange={setPaco2Atual}
        warning={parseFloat(paco2Atual) && (parseFloat(paco2Atual) < 15 || parseFloat(paco2Atual) > 120) ? 'Valor fora da faixa habitual (15-120 mmHg)' : null} />
      <CalcInput label="PaCO2 alvo (mmHg)" id="paco2Alvo" unit="mmHg" placeholder="Ex: 40" value={paco2Alvo} onChange={setPaco2Alvo} />
      <CalcButton onClick={calc}>Calcular nova frequência</CalcButton>
      {result !== null && (
        <ResultBox status="info" value={`Nova frequência: ${fmt(result, 0)} ipm`} detail="Ajuste sugerido mantendo VC constante" visible />
      )}
    </>
  )
}

function TobinCalc() {
  const [freq, setFreq] = useState('')
  const [ve, setVe] = useState('')
  const [result, setResult] = useState<{ tobin: number; vcMl: number; status: CalcStatus; text: string } | null>(null)

  function calc() {
    const f = parseFloat(freq), v = parseFloat(ve)
    if (!f || !v) { setResult(null); return }
    const { tobin, vcMl } = calcTobin(f, v)
    const i = interpretTobin(tobin)
    setResult({ tobin, vcMl, status: i.status, text: i.text })
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.tobin} />
      <CalcInput label="Frequência respiratória (ipm)" id="freqTobin" unit="ipm" placeholder="Ex: 20" value={freq} onChange={setFreq}
        warning={parseFloat(freq) && (parseFloat(freq) < 6 || parseFloat(freq) > 40) ? 'Valor fora da faixa habitual' : null} />
      <CalcInput label="Volume minuto (L/min)" id="veTobin" unit="L/min" placeholder="Ex: 8" value={ve} onChange={setVe}
        warning={parseFloat(ve) && (parseFloat(ve) < 2 || parseFloat(ve) > 25) ? 'Valor fora da faixa habitual (2-25 L/min)' : null} />
      <CalcButton onClick={calc}>Calcular Tobin</CalcButton>
      {result && (
        <ResultBox
          status={result.status}
          value={`Tobin (f/VT): ${fmt(result.tobin, 0)} rpm/L`}
          detail={`VC calculado: ${fmt(result.vcMl, 0)} mL<br>${result.text}`}
          visible
        />
      )}
      <InfoBox title="Outros parâmetros de desmame:" items={[
        'PImax: idealmente ≤ -25 cmH₂O (mais negativo = melhor)',
        'P0.1: idealmente < 3.5 cmH₂O (drive ventilatório)',
      ]} />
    </>
  )
}

function ROXCalc() {
  const navigate = useNavigate()
  const [spo2, setSpo2] = useState('')
  const [fio2, setFio2] = useState('')
  const [freq, setFreq] = useState('')
  const [result, setResult] = useState<{ val: number; status: CalcStatus; text: string } | null>(null)

  function calc() {
    const s = parseFloat(spo2), f = parseFloat(fio2), fr = parseFloat(freq)
    if (!s || !f || !fr) { setResult(null); return }
    const rox = calcROX(s, f, fr)
    const i = interpretROX(rox)
    setResult({ val: rox, status: i.status, text: i.text })
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.rox} />
      <CalcInput label="SpO₂ (%)" id="spo2ROX" unit="%" placeholder="Ex: 94" value={spo2} onChange={setSpo2} />
      <CalcInput label="FiO₂ (0.21 a 1.0)" id="fio2ROX" placeholder="Ex: 0.5" value={fio2} onChange={setFio2} />
      <CalcInput label="Frequência respiratória (ipm)" id="freqROX" unit="ipm" placeholder="Ex: 22" value={freq} onChange={setFreq} />
      <CalcButton onClick={calc}>Calcular ROX</CalcButton>
      {result && (
        <div>
          <ResultBox status={result.status} value={`ROX: ${result.val.toFixed(2)}`} detail={result.text} visible />
          {result.val < 3.85 && (
            <button
              onClick={() => navigate('/airway')}
              className="text-info text-xs underline mt-2 inline-block bg-transparent border-none cursor-pointer"
            >
              Abrir Airway Guide
            </button>
          )}
        </div>
      )}
    </>
  )
}

function TauCalc() {
  const [rva, setRva] = useState('')
  const [cst, setCst] = useState('')
  const [result, setResult] = useState<number | null>(null)

  function calc() {
    const r = parseFloat(rva), c = parseFloat(cst)
    if (!r || !c) { setResult(null); return }
    setResult(calcTau(r, c))
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.tau} />
      <CalcInput label="Resistência (cmH₂O/L/s)" id="rvaTau" unit="cmH₂O/L/s" placeholder="Ex: 10" value={rva} onChange={setRva} />
      <CalcInput label="Complacência (mL/cmH₂O)" id="cstTau" unit="mL/cmH₂O" placeholder="Ex: 50" value={cst} onChange={setCst} />
      <CalcButton onClick={calc}>Calcular tau</CalcButton>
      {result !== null && (
        <ResultBox
          status="info"
          value={`tau: ${result.toFixed(2)} segundos`}
          detail={`Tempo expiratório recomendado:<br>4tau = ${(4 * result).toFixed(2)} s | 5tau = ${(5 * result).toFixed(2)} s`}
          visible
        />
      )}
    </>
  )
}

function PmusCalc() {
  const [pocc, setPocc] = useState('')
  const [result, setResult] = useState<{ val: number; status: CalcStatus; text: string } | null>(null)

  function calc() {
    const p = parseFloat(pocc)
    if (isNaN(p)) { setResult(null); return }
    const pmus = calcPmus(p)
    const i = interpretPmus(pmus)
    setResult({ val: pmus, status: i.status, text: i.text })
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.pmus} />
      <CalcInput label="deltaPocc (deflexão na oclusão, cmH₂O)" id="pocc" unit="cmH₂O" placeholder="Ex: -10" value={pocc} onChange={setPocc} />
      <CalcButton onClick={calc}>Calcular Pmus</CalcButton>
      {result && <ResultBox status={result.status} value={`Pmus estimada: ${fmt(result.val)} cmH₂O`} detail={result.text} visible />}
    </>
  )
}

function MPCalc() {
  const [vc, setVc] = useState('')
  const [dp, setDp] = useState('')
  const [freq, setFreq] = useState('')
  const [result, setResult] = useState<{ val: number; status: CalcStatus; text: string } | null>(null)

  function calc() {
    const v = parseFloat(vc), d = parseFloat(dp), f = parseFloat(freq)
    if (!v || !d || !f) { setResult(null); return }
    const mp = calcMP(v, d, f)
    const i = interpretMP(mp)
    setResult({ val: mp, status: i.status, text: i.text })
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.mp} />
      <CalcInput label="Volume corrente (mL)" id="vcMP" unit="mL" placeholder="Ex: 400" value={vc} onChange={setVc}
        warning={parseFloat(vc) && (parseFloat(vc) < 200 || parseFloat(vc) > 800) ? 'Valor fora da faixa habitual' : null} />
      <CalcInput label="Driving pressure (cmH₂O)" id="dpMP" unit="cmH₂O" placeholder="Ex: 15" value={dp} onChange={setDp} />
      <CalcInput label="Frequência respiratória (ipm)" id="freqMP" unit="ipm" placeholder="Ex: 20" value={freq} onChange={setFreq} />
      <CalcButton onClick={calc}>Calcular MP</CalcButton>
      {result && <ResultBox status={result.status} value={`MP: ${fmt(result.val)} J/min`} detail={result.text} visible />}
    </>
  )
}

function IACalc() {
  const [eventos, setEventos] = useState('')
  const [freqTotal, setFreqTotal] = useState('')
  const [result, setResult] = useState<{ val: number; status: CalcStatus; text: string } | null>(null)

  function calc() {
    const e = parseFloat(eventos), f = parseFloat(freqTotal)
    if (isNaN(e) || !f) { setResult(null); return }
    const ia = calcIA(e, f)
    const i = interpretIA(ia)
    setResult({ val: ia, status: i.status, text: i.text })
  }

  return (
    <>
      <ConceptDesc text={VM_DESCRIPTIONS.ia} />
      <CalcInput label="Eventos de assincronia" id="eventosIA" placeholder="Ex: 5" value={eventos} onChange={setEventos} />
      <CalcInput label="Frequência total (ciclos ventilador + triggers)" id="freqTotalIA" placeholder="Ex: 20" value={freqTotal} onChange={setFreqTotal} />
      <CalcButton onClick={calc}>Calcular IA</CalcButton>
      {result && <ResultBox status={result.status} value={`IA: ${fmt(result.val)}%`} detail={result.text} visible />}
    </>
  )
}

// ==========================================
// HACOR Score Component
// ==========================================

type HacorScores = Record<string, number | null>

function HacorScoreForm({ label, scores, onSelect }: {
  label: string
  scores: HacorScores
  onSelect: (key: string, value: number) => void
}) {
  return (
    <div>
      {HACOR_VARIABLES.map(v => (
        <div key={v.key}>
          <div className="text-sm font-semibold text-text-primary mt-3">{v.label}</div>
          <div className="flex gap-1.5 flex-wrap mt-2 mb-4">
            {v.options.map(o => (
              <button
                key={`${v.key}-${o.value}`}
                onClick={() => onSelect(v.key, o.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors min-h-[36px] cursor-pointer ${
                  scores[v.key] === o.value
                    ? 'bg-accent text-white border-accent'
                    : 'bg-[#1A1A1A] text-text-secondary border-[#333] active:bg-[#252525]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function HACORSection() {
  const [screen, setScreen] = useState<'home' | 'início' | 'reaval'>('home')
  const [inícioScores, setInícioScores] = useState<HacorScores>({ fc: null, ph: null, gcs: null, pf: null, fr: null })
  const [reavalScores, setReavalScores] = useState<HacorScores>({ fc: null, ph: null, gcs: null, pf: null, fr: null })
  const [history, setHistory] = useState<HacorEntry[]>([])

  const inícioTotal = hacorTotal(inícioScores)
  const reavalTotal = hacorTotal(reavalScores)

  function handleInícioSelect(key: string, value: number) {
    setInícioScores(prev => ({ ...prev, [key]: value }))
  }

  function handleReavalSelect(key: string, value: number) {
    setReavalScores(prev => ({ ...prev, [key]: value }))
  }

  function salvarT0() {
    if (inícioTotal === null) return
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setHistory([{ time: timeStr, score: inícioTotal, label: 'T0' }])
    setReavalScores({ fc: null, ph: null, gcs: null, pf: null, fr: null })
    setScreen('reaval')
  }

  function salvarReaval() {
    if (reavalTotal === null) return
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const idx = history.length
    setHistory(prev => [...prev, { time: timeStr, score: reavalTotal, label: `T${idx}h` }])
    setReavalScores({ fc: null, ph: null, gcs: null, pf: null, fr: null })
  }

  function novaAvaliação() {
    setHistory([])
    setInícioScores({ fc: null, ph: null, gcs: null, pf: null, fr: null })
    setReavalScores({ fc: null, ph: null, gcs: null, pf: null, fr: null })
    setScreen('início')
  }

  return (
    <div>
      <ConceptDesc text={VM_DESCRIPTIONS.hacor} />

      {/* Home */}
      {screen === 'home' && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setScreen('início')}
            className="p-4 bg-[#1A1A1A] border border-[#333] rounded-xl text-left cursor-pointer active:bg-[#2A2A2A] active:border-accent"
          >
            <div className="text-base font-semibold text-text-primary mb-1">Iniciar VNI</div>
            <div className="text-[13px] text-text-secondary">Avaliar risco antes de iniciar</div>
          </button>
          <button
            onClick={() => setScreen('reaval')}
            className="p-4 bg-[#1A1A1A] border border-[#333] rounded-xl text-left cursor-pointer active:bg-[#2A2A2A] active:border-accent"
          >
            <div className="text-base font-semibold text-text-primary mb-1">Reavaliar VNI</div>
            <div className="text-[13px] text-text-secondary">Paciente ja em VNI — verificar resposta</div>
          </button>
        </div>
      )}

      {/* Início */}
      {screen === 'início' && (
        <div>
          <button onClick={() => setScreen('home')} className="text-sm text-accent bg-transparent border-none cursor-pointer mb-3 px-0">Voltar</button>
          <HacorScoreForm label="início" scores={inícioScores} onSelect={handleInícioSelect} />
          {inícioTotal !== null && (
            <>
              <div className={`mt-3 p-4 rounded-xl border text-center ${
                inícioTotal < 5 ? 'border-success bg-success/[0.08]' : 'border-danger bg-danger/[0.08]'
              }`}>
                <div className={`text-[28px] font-bold ${inícioTotal < 5 ? 'text-success' : 'text-danger'}`}>
                  HACOR: {inícioTotal}
                </div>
                <div className="text-sm mt-1.5 leading-relaxed text-text-primary">
                  {inícioTotal < 5 ? (
                    <><strong>Baixo risco de falha</strong><br />VNI com reavaliação padrão</>
                  ) : (
                    <><strong>Alto risco de falha</strong><br />Prepare material de IOT. Reavalie em 1h.</>
                  )}
                </div>
              </div>
              <CalcButton onClick={salvarT0}>Iniciar VNI e registrar T0</CalcButton>
            </>
          )}
          <div className="text-xs text-text-secondary mt-4 italic">{HACOR_REF}</div>
        </div>
      )}

      {/* Reavaliação */}
      {screen === 'reaval' && (
        <div>
          <button onClick={() => setScreen('home')} className="text-sm text-accent bg-transparent border-none cursor-pointer mb-3 px-0">Voltar</button>

          {/* T0 badge */}
          {history.length > 0 && (
            <div className={`mb-4 p-3 rounded-xl border text-sm font-semibold text-center ${
              history[0].score < 5 ? 'border-success text-success' : 'border-danger text-danger'
            }`}>
              T0 ({history[0].time}): HACOR {history[0].score} — {history[0].score < 5 ? 'baixo risco' : 'alto risco'}
            </div>
          )}

          <HacorScoreForm label="reaval" scores={reavalScores} onSelect={handleReavalSelect} />

          {reavalTotal !== null && (
            <>
              <div className={`mt-3 p-4 rounded-xl border text-center ${
                reavalTotal < 5 ? 'border-success bg-success/[0.08]' : 'border-danger bg-danger/[0.08]'
              }`}>
                <div className={`text-[28px] font-bold ${reavalTotal < 5 ? 'text-success' : 'text-danger'}`}>
                  HACOR: {reavalTotal}
                </div>
                <div className="text-sm mt-1.5 leading-relaxed text-text-primary">
                  {reavalTotal < 5 ? (
                    <><strong>Baixo risco de falha</strong><br />Manter VNI com reavaliação padrão</>
                  ) : (
                    <><strong>Alto risco de falha</strong><br />Considere intubação orotraqueal</>
                  )}
                  {history.length > 0 && (
                    <div className="text-xs text-text-secondary mt-2">
                      Anterior: {history[history.length - 1].score} → Atual: {reavalTotal} ({
                        reavalTotal < history[history.length - 1].score ? 'melhora'
                        : reavalTotal > history[history.length - 1].score ? 'piora'
                        : 'estável'
                      })
                    </div>
                  )}
                </div>
              </div>
              <CalcButton onClick={salvarReaval}>Salvar e reavaliar depois</CalcButton>
              <button
                onClick={novaAvaliação}
                className="w-full text-sm text-accent bg-transparent border-none cursor-pointer mt-2 text-center py-2"
              >
                Nova avaliação inicial
              </button>
            </>
          )}

          {/* Timeline */}
          {history.length > 0 && (
            <div className="mt-4">
              <div className="text-[13px] font-semibold text-text-secondary mb-2">Histórico de avaliações</div>
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-[#222]">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${h.score < 5 ? 'bg-success' : 'bg-danger'}`} />
                  <span className="text-[13px] text-text-secondary">{h.label} ({h.time})</span>
                  <span className={`text-[15px] font-bold ${h.score < 5 ? 'text-success' : 'text-danger'}`}>HACOR {h.score}</span>
                  <span className="text-xs text-text-muted"> — {h.score < 5 ? 'baixo risco' : 'alto risco'}</span>
                </div>
              ))}
              {history.length >= 2 && (
                <div className="mt-2 p-2.5 bg-white/[0.04] rounded-lg text-[13px] text-text-secondary">
                  Tendência: <strong className={
                    history[history.length - 1].score < history[0].score ? 'text-success'
                    : history[history.length - 1].score > history[0].score ? 'text-danger'
                    : 'text-warning'
                  }>
                    {history[0].score} → {history[history.length - 1].score} ({
                      history[history.length - 1].score < history[0].score ? 'melhora'
                      : history[history.length - 1].score > history[0].score ? 'piora'
                      : 'estável'
                    })
                  </strong>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-text-secondary mt-4 italic">{HACOR_REF}</div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// Componente principal
// ==========================================

export default function VmGuide() {
  const [search, setSearch] = useState('')
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Busca
  const searchResults = useMemo(() => {
    if (search.trim().length < 2) return []
    const q = search.toLowerCase()
    return VM_CALCULATORS.filter(c =>
      c.name.toLowerCase().includes(q) || c.sectionName.toLowerCase().includes(q)
    )
  }, [search])

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // FAB items
  const fabItems = VM_FAB_SECTIONS.map(s => ({
    label: s.label,
    onClick: () => scrollToSection(s.id),
  }))

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="VM Guide" subtitle="Parâmetros de ventilação mecânica" />

      {/* Busca */}
      <div className="max-w-[500px] mx-auto px-5 pb-4 relative">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 stroke-text-secondary fill-none" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar calculadora..."
            className="w-full bg-bg-card border border-[#333] rounded-xl py-3.5 px-4 pl-14 text-base text-text-primary placeholder:text-text-secondary outline-none focus:border-accent"
            autoComplete="off"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="bg-bg-card rounded-xl mt-2 overflow-hidden border border-[#333] absolute left-4 right-4 z-50 shadow-xl">
            {searchResults.map(r => (
              <button
                key={r.id}
                onClick={() => { setSearch(''); scrollToSection(r.sectionId) }}
                className="w-full text-left px-4 py-3 border-b border-[#333] last:border-b-0 bg-transparent cursor-pointer hover:bg-[#252525] transition-colors"
              >
                <div className="text-sm text-text-primary">{r.name}</div>
                <div className="text-xs text-text-secondary mt-0.5">{r.sectionName}</div>
              </button>
            ))}
          </div>
        )}
        {search.trim().length >= 2 && searchResults.length === 0 && (
          <div className="bg-bg-card rounded-xl mt-2 p-4 text-center text-sm text-text-secondary absolute left-4 right-4 z-50">
            Nenhuma calculadora encontrada
          </div>
        )}
      </div>

      <Container>
        {/* SECAO 1: Peso ideal e volume corrente */}
        <div ref={el => { sectionRefs.current['peso'] = el }}>
          <Collapsible title="Peso ideal e volume corrente">
            <SubCollapsible title="Calculadora de peso ideal" id="pesoideal">
              <PesoIdealCalc />
            </SubCollapsible>
          </Collapsible>
        </div>

        {/* SECAO 2: Mecânica respiratoria */}
        <div ref={el => { sectionRefs.current['mecânica'] = el }}>
          <Collapsible title="Mecânica respiratória">
            <SubCollapsible title="Resistência de vias aéreas (Rva)" id="rva">
              <RvaCalc />
            </SubCollapsible>
            <SubCollapsible title="Complacência estática (Cst)" id="cst">
              <CstCalc />
            </SubCollapsible>
            <SubCollapsible title="Driving pressure (deltaP)" id="dp">
              <DPCalc />
            </SubCollapsible>
          </Collapsible>
        </div>

        {/* SECAO 3: Troca gasosa */}
        <div ref={el => { sectionRefs.current['troca'] = el }}>
          <Collapsible title="Troca gasosa">
            <SubCollapsible title="Relação P/F (PaO₂/FiO₂)" id="pf">
              <PFCalc />
            </SubCollapsible>
            <SubCollapsible title="Relação S/F (SpO₂/FiO₂)" id="sf">
              <SFCalc />
            </SubCollapsible>
            <SubCollapsible title="Ajuste de FiO₂" id="ajustefio2">
              <AjusteFiO2Calc />
            </SubCollapsible>
            <SubCollapsible title="Ajuste de frequência respiratória" id="ajustefreq">
              <AjusteFreqCalc />
            </SubCollapsible>
          </Collapsible>
        </div>

        {/* SECAO 4: Desmame */}
        <div ref={el => { sectionRefs.current['desmame'] = el }}>
          <Collapsible title="Desmame">
            <SubCollapsible title="Índice de respiração rápida e superficial (IRRS/Tobin)" id="tobin">
              <TobinCalc />
            </SubCollapsible>
            <SubCollapsible title="Índice ROX (cateter nasal de alto fluxo)" id="rox">
              <ROXCalc />
            </SubCollapsible>
          </Collapsible>
        </div>

        {/* SECAO 5: Outros parâmetros */}
        <div ref={el => { sectionRefs.current['outros'] = el }}>
          <Collapsible title="Outros parâmetros">
            <SubCollapsible title="Constante de tempo (tau)" id="tau">
              <TauCalc />
            </SubCollapsible>
            <SubCollapsible title="Pressão muscular estimada (Pmus)" id="pmus">
              <PmusCalc />
            </SubCollapsible>
            <SubCollapsible title="Mechanical power (potência mecânica)" id="mp">
              <MPCalc />
            </SubCollapsible>
            <SubCollapsible title="Índice de assincronia" id="ia">
              <IACalc />
            </SubCollapsible>
          </Collapsible>
        </div>

        {/* SECAO 6: SDRA */}
        <div ref={el => { sectionRefs.current['sdra'] = el }}>
          <Collapsible title="Critérios de SDRA (Global 2024)">
            <ConceptDesc text={VM_DESCRIPTIONS.sdra} />
            <table className="w-full border-collapse mt-3 text-[13px]">
              <thead>
                <tr>
                  <th className="text-text-secondary font-medium text-xs text-left py-2.5 px-2 border-b border-[#333]">Gravidade</th>
                  <th className="text-text-secondary font-medium text-xs text-left py-2.5 px-2 border-b border-[#333]">P/F (PEEP ≥5)</th>
                  <th className="text-text-secondary font-medium text-xs text-left py-2.5 px-2 border-b border-[#333]">S/F (SpO₂ ≤97%)</th>
                </tr>
              </thead>
              <tbody>
                {SDRA_TABLE.map(row => (
                  <tr key={row.severity}>
                    <td className={`py-2.5 px-2 border-b border-[#333] font-bold ${row.colorClass}`}>{row.severity}</td>
                    <td className="py-2.5 px-2 border-b border-[#333] text-text-primary">{row.pf}</td>
                    <td className="py-2.5 px-2 border-b border-[#333] text-text-primary">{row.sf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <InfoBox title="Novidades da definição Global 2024:" items={SDRA_NOVIDADES} />
          </Collapsible>
        </div>

        {/* SECAO 7: HACOR Score */}
        <div ref={el => { sectionRefs.current['hacor'] = el }}>
          <Collapsible title="HACOR score (falha de VNI)">
            <HACORSection />
          </Collapsible>
        </div>

        {/* SECAO 8: Referências */}
        <div ref={el => { sectionRefs.current['ref'] = el }}>
          <Collapsible title="Referências">
            <ul className="text-[13px] text-text-secondary leading-relaxed list-none">
              {VM_REFERENCES.map((ref, i) => (
                <li key={i} className="mb-2">{ref}</li>
              ))}
            </ul>
          </Collapsible>
        </div>
      </Container>

      <Footer toolName="VM Guide" version="v2.0.0" updatedAt="Abril 2026" />
      <FABMenu items={fabItems} />
      <ToastContainer />
    </div>
  )
}
