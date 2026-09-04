import { useState, useMemo, useCallback, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { FABMenu } from '../components/layout/FABMenu'
import { Collapsible } from '../components/common/Collapsible'
import { AlertCard } from '../components/common/AlertCard'
import { Modal } from '../components/common/Modal'
import { ToastContainer } from '../components/common/Toast'
import { useToast } from '../contexts/ToastContext'
import { fmt } from '../utils/formatters'

// ==========================================
// TIPOS
// ==========================================

interface BroselowEntry {
  key: string
  name: string
  peso: number
  idadeMeses: number
  altura: number
  tubo: number
  fixacao: number
  lâmina: string
  lma: string
  bougie: string
  sondaAsp: number
  min: number
  max: number
  dotClass: string
  bgClass: string
}

interface BolusCalcResult {
  mg: string
  ml: string
  mlLabel?: string
  unit: string
}

interface BolusDrug {
  id: string
  name: string
  presentation: string
  doseBadge: string
  highlight?: boolean
  instruction: string
  calc: (peso: number, ageY?: number | null, ageM?: number | null) => BolusCalcResult
  /** Depende da idade: o card pede a idade antes de calcular */
  needsAge?: boolean
  prepKey?: string
  /** Ponto da faixa usado no calculo, quando doseBadge exibe um intervalo */
  calcAt?: string
}

/** Formatador pt-BR usado pelas entradas clinicas */
const fN = (x: number, n: number) => x.toFixed(n).replace('.', ',')

interface InfusionDilution {
  drug: number
  diluent: number
  conc: number
  vol: number
  /**
   * NAO E LIDO pelo calculo — `doseParaMlh` usa `conc` e a unidade da droga.
   * Ficou como espelho da coluna "mL/h" do protocolo (CLAUDE.md secao 17), que
   * mistura multiplicador e divisor entre drogas; por isso os valores aqui sao
   * inconsistentes entre si. Campo morto, candidato a remocao.
   */
  formula: number
}

interface InfusionDrug {
  id: string
  name: string
  category: 'vasoativos' | 'sedativos' | 'outros'
  color: string
  unit: string
  range: [number, number]
  step: number
  defaultVal: number
  presentation: string
  warning?: string
  dilutions: {
    small: InfusionDilution
    medium: InfusionDilution
    large: InfusionDilution
  }
}

interface ScenarioConfig {
  /** Titulo, descricao e cor do cartao — fonte unica para a lista e para a tela do cenario */
  title: string
  desc: string
  color: string
  highlight: string[]
  sections: string[]
  scrollTo: string | null
  infusionHighlight: string[]
  /** Blocos de apoio que a tela do cenario mostra antes das drogas */
  checklist?: boolean
  fluids?: boolean
}

type PedView = 'home' | 'pcr' | 'cenarios' | 'cenario' | 'calculadoras'

/** De onde veio o peso em uso. Só 'peso' é aferido; a cor Broselow é estimativa. */
type PesoSource = 'peso' | 'broselow' | null

// ==========================================
// DADOS BROSELOW
// ==========================================

const BROSELOW_DATA: BroselowEntry[] = [
  { key: 'gray', name: 'Cinza', peso: 3, idadeMeses: 1.5, altura: 52, tubo: 3.0, fixacao: 9, lâmina: '0 reta', lma: '1', bougie: '5', sondaAsp: 6, min: 46, max: 59, dotClass: 'bg-gray-500', bgClass: 'bg-gray-500' },
  { key: 'pink', name: 'Rosa', peso: 6, idadeMeses: 4.5, altura: 63, tubo: 3.0, fixacao: 9, lâmina: '1 reta', lma: '1', bougie: '5', sondaAsp: 6, min: 60, max: 66, dotClass: 'bg-pink-500', bgClass: 'bg-pink-500' },
  { key: 'red', name: 'Vermelho', peso: 8, idadeMeses: 7.5, altura: 70, tubo: 3.5, fixacao: 10, lâmina: '1 reta', lma: '1.5', bougie: '6', sondaAsp: 8, min: 67, max: 74, dotClass: 'bg-red-600', bgClass: 'bg-red-600' },
  { key: 'purple', name: 'Roxo', peso: 10, idadeMeses: 10, altura: 79, tubo: 3.5, fixacao: 11, lâmina: '1-2', lma: '1.5', bougie: '6', sondaAsp: 8, min: 75, max: 83, dotClass: 'bg-purple-600', bgClass: 'bg-purple-600' },
  { key: 'yellow', name: 'Amarelo', peso: 12, idadeMeses: 18, altura: 89, tubo: 4.0, fixacao: 12, lâmina: '2', lma: '2', bougie: '10', sondaAsp: 8, min: 84, max: 95, dotClass: 'bg-amber-500', bgClass: 'bg-amber-500' },
  { key: 'white', name: 'Branco', peso: 14, idadeMeses: 30, altura: 101, tubo: 4.5, fixacao: 13, lâmina: '2', lma: '2', bougie: '10', sondaAsp: 10, min: 96, max: 106, dotClass: 'bg-gray-200', bgClass: 'bg-gray-200 text-black' },
  { key: 'blue', name: 'Azul', peso: 18, idadeMeses: 54, altura: 113, tubo: 5.0, fixacao: 15, lâmina: '2', lma: '2.5', bougie: '10', sondaAsp: 10, min: 107, max: 120, dotClass: 'bg-blue-500', bgClass: 'bg-blue-500' },
  { key: 'orange', name: 'Laranja', peso: 24, idadeMeses: 78, altura: 126, tubo: 5.5, fixacao: 16, lâmina: '2-3', lma: '3', bougie: '15', sondaAsp: 12, min: 121, max: 132, dotClass: 'bg-orange-500', bgClass: 'bg-orange-500' },
  { key: 'green', name: 'Verde', peso: 32, idadeMeses: 108, altura: 139, tubo: 6.0, fixacao: 18, lâmina: '3', lma: '3', bougie: '15', sondaAsp: 12, min: 133, max: 145, dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-500' },
]

function formatIdade(meses: number): string {
  if (meses < 12) return `${meses} meses`
  return `${Math.round(meses / 12)} anos`
}

function getColorFromWeight(w: number): BroselowEntry {
  let best = BROSELOW_DATA[0]
  let minDiff = Infinity
  for (const entry of BROSELOW_DATA) {
    const diff = Math.abs(entry.peso - w)
    if (diff < minDiff) {
      minDiff = diff
      best = entry
    }
  }
  return best
}

// ==========================================
// DROGAS EM BOLUS
// ==========================================

const PCR_DRUGS: BolusDrug[] = [
  {
    id: 'epinefrina-iv', name: 'EPINEFRINA IV/IO', presentation: '1 mg/mL (1:1.000)', doseBadge: '0,01 mg/kg', highlight: true,
    instruction: 'Diluição 1:10.000: 1 mL + 9 mL Água Destilada. Concentração: 0,1 mg/mL. A cada 3-5 min.',
    calc: (p) => ({ mg: (p * 0.01).toFixed(2), ml: (p * 0.1).toFixed(1), mlLabel: 'da sol. 1:10.000', unit: 'mg' }),
    prepKey: 'epinefrina',
  },
  {
    id: 'amiodarona', name: 'AMIODARONA', presentation: '50 mg/mL', doseBadge: '5 mg/kg',
    instruction: 'FV/TV sem pulso refratária. Max: 300 mg. Pode repetir até 15 mg/kg.',
    calc: (p) => { const d = Math.min(p * 5, 300); return { mg: d.toFixed(0), ml: (d / 50).toFixed(1), unit: 'mg' } },
  },
  {
    id: 'bicarbonato', name: 'BICARBONATO DE SÓDIO 8,4%', presentation: '1 mEq/mL', doseBadge: '1 mEq/kg',
    instruction: 'PCR prolongada, acidose documentada. Diluir 1:1 com Água Destilada.',
    calc: (p) => { const d=Math.min(p,250); return { mg:fN(d,0), ml:fN(d,0), mlLabel:'+ igual vol. AD', unit:'mEq' }; }},
  {
    id: 'atropina', name: 'ATROPINA', presentation: '0,5 mg/mL', doseBadge: '0,02 mg/kg',
    instruction: 'Bradicardia com pulso. Max: 1 mg.',
    calc: (p) => { const d=Math.min(p*0.02,1); return { mg:fN(d,2), ml:fN(d/0.5,2), unit:'mg' }; }},
  { id: 'calcio', name:'GLUCONATO DE CÁLCIO 10%', presentation:'100 mg/mL', doseBadge:'60-100 mg/kg', calcAt:'60 mg/kg (piso da faixa)',
    instruction:'Hipocalcemia, Hipercalemia. Max: 2000 mg. Infundir lento.',
    calc:p => { const d=Math.min(p*60,2000); return { mg:fN(d,0), ml:fN(d/100,1), unit:'mg' }; } },
  { id: 'cloreto-calcio', name:'CLORETO DE CÁLCIO 10%', presentation:'100 mg/mL', doseBadge:'20 mg/kg',
    instruction:'Diluir em igual volume de AD/SF. Max: 1000 mg. Infundir EV em bolus.',
    calc:p => { const d=Math.min(p*20,1000); return { mg:fN(d,0), ml:fN(d/100,1), unit:'mg' }; } },
  { id: 'lidocaina', name:'LIDOCAÍNA 1%', presentation:'10 mg/mL', doseBadge:'1 mg/kg',
    instruction:'FV/TV sem pulso (alternativa). Max: 100 mg. EV bolus rápido.',
    calc:p => { const d=Math.min(p,100); return { mg:fN(d,0), ml:fN(d/10,1), unit:'mg' }; } },
  { id: 'insulina-hiperk', name:'INSULINA REGULAR (Hipercalemia)', presentation:'100 UI/mL', doseBadge:'0,1 UI/kg',
    instruction:'Hipercalemia. Max: 10 UI. EV bolus rápido, sempre com glicose associada.',
    calc:p => { const d=Math.min(p*0.1,10); return { mg:fN(d,1), ml:'--', mlLabel:'em seringa de insulina, com glicose associada', unit:'UI' }; } },
  { id: 'magnesio-pcr', name:'SULFATO DE MAGNÉSIO 10%', presentation:'100 mg/mL', doseBadge:'50 mg/kg',
    instruction:'Torsades de pointes / hipomagnesemia. Max: 2000 mg. EV bolus na PCR.',
    calc:p => { const d=Math.min(p*50,2000); return { mg:fN(d,0), ml:fN(d/100,1), unit:'mg' }; } },
  { id: 'glicose-g10', name:'GLICOSE 50% → G10%', presentation:'500 mg/mL', doseBadge:'0,5 g/kg',
    instruction:'Hipoglicemia. Max: 40 mL de G50%. Diluir e fazer EV em bolus.',
    calc:p => { const e=p>40?40:p, g=p>37?150:p*4; return { mg:fN(e,0), ml:fN(g,0), mlLabel:'mL de G50% + mL de AD/SF', unit:'mL G50%' }; } },
  { id: 'glicose-g25', name:'GLICOSE 50% → G25%', presentation:'500 mg/mL', doseBadge:'0,5 g/kg',
    instruction:'Hipoglicemia (acesso calibroso). Max: 40 mL de G50%. Diluir 1:1 e fazer EV em bolus.',
    calc:p => { const e=p>40?40:p; return { mg:fN(e,0), ml:fN(e,0), mlLabel:'mL de G50% + mL de AD/SF (1:1)', unit:'mL G50%' }; } }
]

const IOT_DRUGS: BolusDrug[] = [
  {
    id: 'cetamina', name: 'CETAMINA', presentation: '50 mg/mL', doseBadge: '1-2 mg/kg', calcAt: '2 mg/kg (topo da faixa)',
    instruction: 'Indução dissociativa. Mantém VA e drive respiratório. Broncodilatador.',
    calc: (p) => { const d=Math.min(p*2,100); return { mg:fN(d,0), ml:fN(d/50,2), unit:'mg' }; }},
  {
    id: 'midazolam', name: 'MIDAZOLAM', presentation: '5 mg/mL', doseBadge: '0,1-0,4 mg/kg', calcAt: '0,3 mg/kg',
    instruction: 'Sedação. ISR: 0,3 mg/kg. Max: 5 mg. Pode causar hipotensão.',
    calc: (p) => { const d = Math.min(p * 0.3, 5); return { mg: d.toFixed(1), ml: (d / 5).toFixed(2), unit: 'mg' } },
  },
  {
    id: 'fentanil', name: 'FENTANIL', presentation: '50 mcg/mL', doseBadge: '1-2 mcg/kg', calcAt: '2 mcg/kg (topo da faixa)',
    instruction: 'Analgesia. Administrar lento. Max: 100 mcg.',
    calc: (p) => { const d=Math.min(p*2,100); return { mg:fN(d,0), ml:fN(d/50,2), unit:'mcg' }; }},
  {
    id: 'propofol', name: 'PROPOFOL', presentation: '10 mg/mL', doseBadge: '1-2,5 mg/kg', calcAt: '2,5 mg/kg (topo da faixa)',
    instruction: 'Indução. Hipotensão dose-dependente. Evitar em choque.',
    calc: (p) => { const d=Math.min(p*2.5,200); return { mg:fN(d,0), ml:fN(d/10,1), unit:'mg' }; }},
  {
    id: 'etomidato', name: 'ETOMIDATO', presentation: '2 mg/mL', doseBadge: '0,2-0,4 mg/kg', calcAt: '0,3 mg/kg',
    instruction: 'Indução. Estabilidade hemodinâmica. Max: 20 mg. Evitar em sepse.',
    calc: (p) => { const d = Math.min(p * 0.3, 20); return { mg: d.toFixed(1), ml: (d / 2).toFixed(1), unit: 'mg' } },
  },
  {
    id: 'rocuronio', name: 'ROCURONIO', presentation: '10 mg/mL', doseBadge: '0,9-1,2 mg/kg', calcAt: '1 mg/kg',
    instruction: 'Bloqueador neuromuscular. ISR: 1 mg/kg. Reversível com Sugammadex.',
    calc: (p) => { const d=Math.min(p,100); return { mg:fN(d,0), ml:fN(d/10,1), unit:'mg' }; }},
  {
    id: 'succinil', name: 'SUCCINILCOLINA', presentation: '10 mg/mL', doseBadge: '1-2 mg/kg', calcAt: '1,5 mg/kg',
    instruction: 'BNM despolarizante. Contraindicado: hipercalemia, queimados. Max: 100 mg. Ampola de 100 mg reconstituída para 10 mL.',
    calc: (p) => { const d=Math.min(p*1.5,100); return { mg:fN(d,0), ml:fN(d/10,1), unit:'mg' }; }},
  {
    id: 'cisatracurio', name: 'CISATRACURIO', presentation: '2 mg/mL', doseBadge: '0,1-0,15 mg/kg', calcAt: '0,15 mg/kg (topo da faixa)',
    instruction: 'BNM não despolarizante. Metabolismo de Hofmann.',
    calc: (p) => ({ mg: (p * 0.15).toFixed(2), ml: (p * 0.15 / 2).toFixed(2), unit: 'mg' }),
  },
]

const EMERGENCY_DRUGS: BolusDrug[] = [
  {
    id: 'epinefrina-im', name: 'EPINEFRINA IM (Anafilaxia)', presentation: '1 mg/mL - SEM DILUIR', doseBadge: '0,01 mg/kg', highlight: true,
    instruction: 'Via INTRAMUSCULAR - Vasto lateral. Max: 0,3 mg (criança) / 0,5 mg (adolescente). Repetir 5-15 min.',
    calc: (p) => { const d = Math.min(p * 0.01, p < 30 ? 0.3 : 0.5); return { mg: d.toFixed(2), ml: d.toFixed(2), unit: 'mg' } },
  },
  {
    id: 'adenosina', name: 'ADENOSINA', presentation: '3 mg/mL', doseBadge: '0,1 - 0,2 mg/kg',
    instruction: 'TSV com pulso. Bolus RÁPIDO + flush 5-10 mL SF. Max: 6/12 mg.',
    calc: (p) => {
      const d1 = Math.min(p * 0.1, 6), d2 = Math.min(p * 0.2, 12)
      return { mg: `${d1.toFixed(1)} / ${d2.toFixed(1)}`, ml: `${(d1 / 3).toFixed(2)} / ${(d2 / 3).toFixed(2)}`, unit: 'mg' }
    },
  },
  {
    id: 'glicose', name: 'GLICOSE 50%', presentation: '500 mg/mL', doseBadge: '0,5-1 g/kg', calcAt: '0,5 g/kg (piso da faixa)',
    instruction: 'Hipoglicemia. Diluir em crianças pequenas (G10/G25).',
    calc: (p) => ({ mg: (p * 0.5).toFixed(1), ml: Math.min(p, 50).toFixed(0), unit: 'g' }),
  },
  {
    id: 'naloxona', name: 'NALOXONA', presentation: '0,4 mg/mL', doseBadge: '0,1 mg/kg',
    instruction: 'Reversão de opioides. Via: IV, IO, IM, IN. Max: 2 mg.',
    calc: (p) => { const d = Math.min(p * 0.1, 2); return { mg: d.toFixed(2), ml: (d / 0.4).toFixed(1), unit: 'mg' } },
  },
  {
    id: 'tranexamico', name: 'ÁCIDO TRANEXÂMICO', presentation: '50 mg/mL', doseBadge: '15 mg/kg',
    instruction: 'Trauma com hemorragia. Bolus em 10 min. Max: 1000 mg.',
    calc: (p) => { const d = Math.min(p * 15, 1000); return { mg: d.toFixed(0), ml: (d / 50).toFixed(1), unit: 'mg' } },
  },
  {
    id: 'hidrocortisona', name: 'HIDROCORTISONA', presentation: '100 mg/2mL', doseBadge: '2-4 mg/kg', calcAt: '4 mg/kg (topo da faixa)',
    instruction: 'Anafilaxia / Choque / Asma. Max: 200 mg. Infundir em bolus.',
    calc: (p) => { const d = Math.min(p * 4, 200); return { mg: d.toFixed(0), ml: (d / 50).toFixed(1), unit: 'mg' } },
  },
  {
    id: 'difenidramina', name: 'DIFENIDRAMINA', presentation: '50 mg/mL', doseBadge: '1-1,25 mg/kg', calcAt: '1,25 mg/kg (topo da faixa)',
    instruction: 'Anafilaxia (adjuvante). Via: IV lento ou IM. Max: 50 mg.',
    calc: (p) => { const d = Math.min(p * 1.25, 50); return { mg: d.toFixed(0), ml: (d / 50).toFixed(1), unit: 'mg' } },
  },
  { id: 'salbutamol-anaf', name:'SALBUTAMOL MDI', presentation:'100 mcg/jato', doseBadge:'100 mcg/2 kg',
    instruction:'Anafilaxia com broncoespasmo (2ª linha). Max: 10 jatos. Inalar com espaçador.',
    calc:p => { const j=p>20?10:Math.ceil(p/2); return { mg:fN(j,0), ml:'--', mlLabel:'jatos com espaçador', unit:'jatos' }; } },
  { id: 'octreotide-hda', name:'OCTREOTIDE (HDA)', presentation:'0,1 mg/mL', doseBadge:'1-2 mcg/kg',
    instruction:'Hemorragia digestiva alta. Bolus max: 50 mcg. Infusão: 1-2 mcg/kg/h (diluir 100 mcg em 50 mL SF, correr peso/2 a peso mL/h, max 25-50 mcg/h).',
    calc:p => { const d1=Math.min(p,50), d2=Math.min(p*2,50);
      return { mg:fN(d1,0)+' / '+fN(d2,0), ml:fN(d1/100,2)+' / '+fN(d2/100,2), mlLabel:'EV bolus', unit:'mcg' }; } },
  { id: 'omeprazol-hda', name:'OMEPRAZOL (HDA)', presentation:'4 mg/mL (amp. 40 mg + 10 mL diluente)', doseBadge:'1 mg/kg',
    instruction:'Hemorragia digestiva alta. Max: 40 mg. EV em bolus.',
    calc:p => { const d=Math.min(p,40); return { mg:fN(d,0), ml:fN(d/4,1), unit:'mg' }; } }
]

const CONVULSION_DRUGS: BolusDrug[] = [
  {
    id: 'diazepam', name: 'DIAZEPAM', presentation: '5 mg/mL', doseBadge: '0,3 mg/kg',
    instruction: 'Status epilepticus - 1ª linha. EV em bolus, não diluir. Max: 5 mg.',
    calc: (p) => { const d=Math.min(p*0.3,5); return { mg:fN(d,1), ml:fN(d/5,2), unit:'mg' }; }},
  {
    id: 'midazolam-conv', name: 'MIDAZOLAM (Status)', presentation: '5 mg/mL', doseBadge: '0,3 IM · 0,1 EV mg/kg',
    instruction: 'Status epilepticus - Alternativa. IM: 0,3 mg/kg (max 10 mg). EV: 0,1 mg/kg (max 5 mg).',
    calc: (p) => { const im=Math.min(p*0.3,10), ev=Math.min(p*0.1,5);
      return { mg:fN(im,1)+' / '+fN(ev,1), ml:fN(im/5,2)+' / '+fN(ev/5,2), mlLabel:'IM / EV', unit:'mg' }; }},
  {
    id: 'fenitoina', name: 'FENITOINA', presentation: '50 mg/mL', doseBadge: '20 mg/kg',
    instruction: 'Status epilepticus - 2ª linha. Max: 1500 mg. Diluir em SF, infundir em 20 min. Monitorizar ECG.',
    calc: (p) => { const d=Math.min(p*20,1500); return { mg:fN(d,0), ml:fN(d/50,1), unit:'mg' }; }},
  {
    id: 'fenobarbital', name: 'FENOBARBITAL', presentation: '100 mg/mL', doseBadge: '20 mg/kg',
    instruction: 'Status refratário / Neonatal. Max: 1000 mg. Diluir em SF, infundir em 15-20 min. Risco depressão respiratória.',
    calc: (p) => { const d=Math.min(p*20,1000); return { mg:fN(d,0), ml:fN(d/100,1), unit:'mg' }; }},
  {
    id: 'levetiracetam', name: 'LEVETIRACETAM', presentation: '100 mg/mL', doseBadge: '40-60 mg/kg', calcAt: '60 mg/kg (topo da faixa)',
    instruction: 'Status epilepticus - Alternativa 2ª linha. Infundir em 15 min. Max: 3000 mg.',
    calc: (p) => { const d = Math.min(p * 60, 3000); return { mg: d.toFixed(0), ml: (d / 100).toFixed(1), unit: 'mg' } },
  },
]

const NEURO_DRUGS: BolusDrug[] = [
  {
    id: 'manitol', name: 'MANITOL 20%', presentation: '200 mg/mL', doseBadge: '0,25-1 g/kg', calcAt: '0,5 g/kg',
    instruction: 'Hipertensão intracraniana. Infundir em 15-30 min.',
    calc: (p) => ({ mg: (p * 0.5).toFixed(1), ml: (p * 0.5 * 5).toFixed(0), unit: 'g' }),
  },
  {
    id: 'nacl', name: 'NaCl 3% (Salina Hipertônica)', presentation: '0,513 mEq Na/mL', doseBadge: '2-5 mL/kg', calcAt: '3 mL/kg',
    instruction: 'HIC, hiponatremia grave. Infundir em 10-20 min.',
    calc: (p) => ({ mg: (p * 3 * 0.513).toFixed(1), ml: (p * 3).toFixed(0), unit: 'mEq' }),
    prepKey: 'nacl3',
  },
]

const PAIN_DRUGS: BolusDrug[] = [
  { id: 'cetamina-dor', name:'CETAMINA', presentation:'50 mg/mL', doseBadge:'1 EV · 4 IM mg/kg',
    instruction:'Sedação dissociativa para procedimentos. Max: 100 mg EV / 200 mg IM. Bolus lento. Evitar abaixo de 3 meses.',
    calc:p => { const ev=Math.min(p,100), im=Math.min(p*4,200);
      return { mg:fN(ev,0)+' / '+fN(im,0), ml:fN(ev/50,2)+' / '+fN(im/50,2), mlLabel:'EV / IM', unit:'mg' }; } },
  { id: 'fentanil-dor', name:'FENTANIL', presentation:'50 mcg/mL', doseBadge:'1 EV · 1,5 IN mcg/kg',
    instruction:'Analgesia. Max: 100 mcg. EV em bolus lento ou intranasal.',
    calc:p => { const ev=Math.min(p,100), inl=Math.min(p*1.5,100);
      return { mg:fN(ev,0)+' / '+fN(inl,0), ml:fN(ev/50,2)+' / '+fN(inl/50,2), mlLabel:'EV / IN', unit:'mcg' }; } },
  { id: 'midazolam-dor', name:'MIDAZOLAM', presentation:'5 mg/mL', doseBadge:'0,1 EV · 0,4 IN mg/kg',
    instruction:'Ansiólise/sedação leve. Max: 5 mg EV / 10 mg IN. IN: se acima de 1 mL, dividir entre as narinas.',
    calc:p => { const ev=Math.min(p*0.1,5), inl=Math.min(p*0.4,10);
      return { mg:fN(ev,1)+' / '+fN(inl,1), ml:fN(ev/5,2)+' / '+fN(inl/5,2), mlLabel:'EV / IN', unit:'mg' }; } },
  { id: 'morfina-dor', name:'MORFINA', presentation:'10 mg/mL', doseBadge:'0,1 mg/kg',
    instruction:'Analgesia de dor intensa. Max: 5 mg. EV em bolus lento.',
    calc:p => { const d=Math.min(p*0.1,5); return { mg:fN(d,1), ml:fN(d/10,2), unit:'mg' }; } },
  { id: 'propofol-dor', name:'PROPOFOL', presentation:'10 mg/mL', doseBadge:'1 mg/kg',
    instruction:'Sedação para procedimentos curtos. Max: 100 mg. EV lento, considerar doses fracionadas.',
    calc:p => { const d=Math.min(p,100); return { mg:fN(d,0), ml:fN(d/10,1), unit:'mg' }; } }
]

const RESP_DRUGS: BolusDrug[] = [
  { id: 'salbutamol-resp', name:'SALBUTAMOL MDI', presentation:'100 mcg/jato', doseBadge:'100 mcg/2 kg',
    instruction:'Crise asmática. Max: 10 jatos/dose. Inalar com espaçador, repetir conforme resposta.',
    calc:p => { const j=p>20?10:Math.ceil(p/2); return { mg:fN(j,0), ml:'--', mlLabel:'jatos com espaçador', unit:'jatos' }; } },
  { id: 'ipratropio-mdi', name:'IPRATRÓPIO MDI', presentation:'20 mcg/jato', doseBadge:'40-80 mcg',
    instruction:'Crise moderada/grave, associado ao beta-agonista. Max: 80 mcg/dose.',
    calc:() => ({ mg:'2 - 4', ml:'--', mlLabel:'jatos com espaçador, de 20/20 min', unit:'jatos' }) },
  { id: 'ipratropio-gotas', name:'IPRATRÓPIO GOTAS', presentation:'0,25 mg/mL (1 mL = 20 gotas)', doseBadge:'0,25-0,5 mg',
    instruction:'Alternativa ao MDI. Max: 0,5 mg/dose.',
    calc:() => ({ mg:'20 - 40', ml:'--', mlLabel:'gotas em nebulização, de 20/20 min', unit:'gotas' }) },
  { id: 'prednisolona', name:'PREDNISOLONA', presentation:'3 mg/mL', doseBadge:'2 mg/kg',
    instruction:'Corticoide VO de escolha. Max: 40 mg, 1x/dia.',
    calc:p => { const d=Math.min(p*2,40); return { mg:fN(d,0), ml:fN(Math.ceil(d/3),0), mlLabel:'VO 1x/dia', unit:'mg' }; } },
  { id: 'metilprednisolona', name:'METILPREDNISOLONA SUCCINATO', presentation:'--', doseBadge:'1 mg/kg',
    instruction:'Crise grave (EV). Max: 80 mg. Diluir em 20-50 mL de SF e correr EV em 20 min.',
    calc:p => { const d=Math.min(p,80); return { mg:fN(d,0), ml:'--', mlLabel:'em 20-50 mL de SF, EV em 20 min', unit:'mg' }; } },
  { id: 'magnesio10-resp', name:'SULFATO DE MAGNÉSIO 10%', presentation:'100 mg/mL', doseBadge:'50 mg/kg',
    instruction:'Crise grave refratária. Max: 2000 mg. Diluir em SF e correr EV em 20 min.',
    calc:p => { const d=Math.min(p*50,2000); return { mg:fN(d,0), ml:fN(d/100,1), mlLabel:'diluir em '+fN(d/10,0)+' mL de SF', unit:'mg' }; } },
  { id: 'magnesio50-resp', name:'SULFATO DE MAGNÉSIO 50%', presentation:'500 mg/mL', doseBadge:'50 mg/kg',
    instruction:'Crise grave refratária. Max: 2000 mg. Completar com SF e correr EV em 20 min.',
    calc:p => { const d=Math.min(p*50,2000); return { mg:fN(d,0), ml:fN(d/500,1), mlLabel:'completar até '+fN(d/10,0)+' mL de SF', unit:'mg' }; } }
]

const AGE_DRUGS: BolusDrug[] = [
  {
    id: 'loratadina', name: 'LORATADINA', presentation: '1 mg/mL xarope', doseBadge: 'por idade/peso', needsAge: true,
    instruction: 'Anafilaxia (adjuvante, 2ª geração). Max: 10 mg VO. Evitar anti-histamínicos de 1ª geração.',
    calc: (p, ageY) => {
      if (ageY === null || ageY === undefined) return { mg:'--', ml:'--', mlLabel:'Informe a idade', unit:'' };
      if (ageY < 2) return { mg:'--', ml:'--', mlLabel:'Geralmente não recomendado abaixo de 2 anos', unit:'' };
      const d = p <= 30 ? 5 : 10;
      return { mg:fN(d,0), ml:fN(d,0), mlLabel:'VO 1x/dia', unit:'mg' }; }},
  {
    id: 'cetirizina', name: 'CETIRIZINA', presentation: 'VO', doseBadge: 'por idade', needsAge: true,
    instruction: 'Anafilaxia (adjuvante, 2ª geração). Max: 10 mg VO.',
    calc: (p, ageY, ageM) => {
      if (ageM === null || ageM === undefined) return { mg:'--', ml:'--', mlLabel:'Informe a idade', unit:'' };
      if (ageM < 6) return { mg:'--', ml:'--', mlLabel:'Geralmente não recomendado abaixo de 6 meses', unit:'' };
      const d = ageM < 24 ? 2.5 : ageM < 72 ? 5 : 10;
      return { mg:fN(d,1), ml:'--', mlLabel:'VO', unit:'mg' }; }},
]

const TOX_DRUGS: BolusDrug[] = [
  { id: 'atropina-tox', name:'ATROPINA (Organofosforados)', presentation:'0,5 mg/mL', doseBadge:'0,02 mg/kg',
    instruction:'Sindrome colinérgica. Max: 2 mg (dose inicial). EV bolus. Dobrar as doses se necessário.',
    calc:p => { const d=Math.min(p*0.02,2); return { mg:fN(d,2), ml:fN(d/0.5,2), unit:'mg' }; } },
  { id: 'bicarbonato-tox', name:'BICARBONATO DE SÓDIO 8,4%', presentation:'1 mEq/mL', doseBadge:'1 mL/kg',
    instruction:'Cardiotoxicidade por bloqueio de canal de sódio (tricíclicos). Max: 250 mL. Sem diluir ou 1:1 em AD/SF. Salicilatos: 150 mL bic + 850 mL SG 5% em taxa de manutenção.',
    calc:p => { const d=Math.min(p,250); return { mg:fN(d,0), ml:fN(d,0), unit:'mEq' }; } },
  { id: 'emulsao-lipidica', name:'EMULSÃO LIPÍDICA 20%', presentation:'--', doseBadge:'1,5 mL/kg',
    instruction:'Intoxicação por anestésico local / lipofílicos com colapso. Max: 100 mL. EV em bolus.',
    calc:p => { const d=Math.min(p*1.5,100); return { mg:fN(d,1), ml:fN(d,1), unit:'mL' }; } },
  { id: 'glicose10-tox', name:'GLICOSE 10% (Betabloqueador/BCC)', presentation:'SG 10% 500 mL + NaCl 20% 20 mL', doseBadge:'manutenção',
    instruction:'Suporte em intoxicação por betabloqueador/BCC junto com insulina. Max: 90 mL/h. Alternativa: SF 400 mL + SG 50% 100 mL.',
    calc:p => {
      const m = p <= 10 ? p*4 : p <= 20 ? 40 + (p-10)*2 : 60 + (p-20);
      return { mg:fN(Math.min(m,90),0), ml:'--', mlLabel:'mL/h EV', unit:'mL/h' }; } },
  { id: 'glucagon-tox', name:'GLUCAGON (Betabloqueador/BCC)', presentation:'1 mg/mL', doseBadge:'0,05 mg/kg',
    instruction:'Diluir 4 mg (4 mL) em SG 5% 46 mL (0,8 mg/mL). Ataque max: 10 mg. Manutenção: 0,05-0,1 mg/kg/h na mesma diluição.',
    calc:p => { const d=Math.min(p*0.05,10); return { mg:fN(d,2), ml:fN(d/0.8,2), mlLabel:'da solução 0,8 mg/mL', unit:'mg' }; } },
  { id: 'gluconato-tox', name:'GLUCONATO DE CÁLCIO 10%', presentation:'100 mg/mL', doseBadge:'60 mg/kg',
    instruction:'Intoxicação por BCC / hipocalcemia. Max: 2000 mg. Diluir em AD/SF e infundir lento.',
    calc:p => { const d=Math.min(p*60,2000); return { mg:fN(d,0), ml:fN(d/100,1), unit:'mg' }; } },
  { id: 'hidroxicobalamina', name:'HIDROXICOBALAMINA', presentation:'5 g/200 mL', doseBadge:'70 mg/kg',
    instruction:'Intoxicação por cianeto (inalação de fumaça). Max: 5 g. EV.',
    calc:p => { const d=Math.min(p*70,5000); return { mg:fN(d,0), ml:fN(d/25,1), unit:'mg' }; } },
  { id: 'insulina-tox', name:'INSULINA EUGLICÊMICA (Betabloqueador/BCC)', presentation:'100 UI/mL', doseBadge:'1 UI/kg',
    instruction:'Bolus 1 UI/kg + infusão 1 UI/kg/h (diluir 100 UI em 100 mL SF = 1 UI/mL). Monitorizar glicemia e potássio.',
    calc:p => ({ mg:fN(p,0), ml:fN(p,0), mlLabel:'bolus UI / infusão mL/h', unit:'UI' }) },
  { id: 'naloxona-tox', name:'NALOXONA', presentation:'0,4 mg/mL', doseBadge:'0,1 mg/kg',
    instruction:'Intoxicação por opioides. Dose inicial: 0,4-2 mg. Via: IV, IO, IM, IN.',
    calc:p => { const d1=Math.min(p*0.1,0.4), d2=Math.min(p*0.1,2);
      return { mg:fN(d1,2)+' - '+fN(d2,2), ml:fN(d1/0.4,1)+' - '+fN(d2/0.4,1), unit:'mg' }; } },
  { id: 'octreotide-tox', name:'OCTREOTIDE (Sulfonilureias)', presentation:'0,1 mg/mL', doseBadge:'1-2 mcg/kg',
    instruction:'Hipoglicemia refratária por sulfonilureia. Max: 50 mcg. EV bolus.',
    calc:p => { const d1=Math.min(p,50), d2=Math.min(p*2,50);
      return { mg:fN(d1,0)+' / '+fN(d2,0), ml:fN(d1/100,2)+' / '+fN(d2/100,2), unit:'mcg' }; } },
  { id: 'vitamina-k', name:'VITAMINA K', presentation:'10 mg/mL', doseBadge:'0,03 mg/kg',
    instruction:'Intoxicação por cumarínicos. Max: 5 mg. EV lento. Esquema de dose fixa também pode ser usado: 0,5-2-5 mg conforme gravidade.',
    calc:p => { const d=Math.min(p*0.03,5); return { mg:fN(d,2), ml:fN(d/10,2), unit:'mg' }; } },
  { id: 'nac-fase1', name:'N-ACETILCISTEÍNA — Fase 1 (1ª hora)', presentation:'100 mg/mL', doseBadge:'150 mg/kg',
    instruction:'Intoxicação por paracetamol. Max: 15000 mg. Diluir em SF e infundir em 1 h.',
    calc:p => { const d=Math.min(p*150,15000); return { mg:fN(d,0), ml:fN(d/100,1), mlLabel:'diluir em '+fN(d/30,0)+' mL de SF', unit:'mg' }; } },
  { id: 'nac-fase2', name:'N-ACETILCISTEÍNA — Fase 2 (4 h)', presentation:'100 mg/mL', doseBadge:'50 mg/kg',
    instruction:'Max: 5000 mg. Diluir em SF e infundir nas próximas 4 h.',
    calc:p => { const d=Math.min(p*50,5000); return { mg:fN(d,0), ml:fN(d/100,1), mlLabel:'diluir em '+fN(Math.ceil(d/10),0)+' mL de SF', unit:'mg' }; } },
  { id: 'nac-fase3', name:'N-ACETILCISTEÍNA — Fase 3 (16 h)', presentation:'100 mg/mL', doseBadge:'100 mg/kg',
    instruction:'Max: 10000 mg. Diluir em SF e infundir nas próximas 16 h.',
    calc:p => { const d=Math.min(p*100,10000); return { mg:fN(d,0), ml:fN(d/100,1), mlLabel:'diluir em '+fN(d/10,0)+' mL de SF', unit:'mg' }; } },
  { id: 'nac-alternativo', name:'N-ACETILCISTEÍNA — Infusão única (alternativo)', presentation:'15 g + SF 350 mL (30 mg/mL)', doseBadge:'15 mg/kg/h',
    instruction:'Após a dose de ataque da 1ª hora. Max: 1500 mg/h.',
    calc:p => { const d=Math.min(p*15,1500); return { mg:fN(d,0), ml:fN(d/30,1), mlLabel:'mg/h = mL/h da solução 30 mg/mL', unit:'mg/h' }; } }
]

// ==========================================
// INFUSÕES CONTÍNUAS PEDIÁTRICAS
// ==========================================

/** Todas as listas de bolus na ordem em que aparecem, para busca por id. */
const ALL_BOLUS_DRUGS = (): BolusDrug[] => [
  ...PCR_DRUGS, ...IOT_DRUGS, ...EMERGENCY_DRUGS, ...CONVULSION_DRUGS,
  ...NEURO_DRUGS, ...PAIN_DRUGS, ...RESP_DRUGS, ...AGE_DRUGS, ...TOX_DRUGS,
]

function findDrug(id: string): BolusDrug | undefined {
  return ALL_BOLUS_DRUGS().find(d => d.id === id)
}

const INFUSION_DATA: Record<string, InfusionDrug> = {
  dobutamina: {
    id: 'dobutamina', name: 'DOBUTAMINA', category: 'vasoativos', color: '#F97316', unit: 'mcg/kg/min', range: [2.5, 20], step: 0.5, defaultVal: 5,
    presentation: '12,5 mg/mL',
    dilutions: {
      small: { drug: 10, diluent: 60, conc: 1785, vol: 70, formula: 0.033 },
      medium: { drug: 20, diluent: 120, conc: 1785, vol: 140, formula: 0.033 },
      large: { drug: 50, diluent: 200, conc: 2500, vol: 250, formula: 0.025 },
    },
  },
  dopamina: {
    id: 'dopamina', name: 'DOPAMINA', category: 'vasoativos', color: '#EAB308', unit: 'mcg/kg/min', range: [2, 20], step: 1, defaultVal: 5,
    presentation: '5 mg/mL',
    dilutions: {
      small: { drug: 20, diluent: 30, conc: 2000, vol: 50, formula: 0.03 },
      medium: { drug: 40, diluent: 60, conc: 2000, vol: 100, formula: 0.03 },
      large: { drug: 100, diluent: 150, conc: 2000, vol: 250, formula: 0.03 },
    },
  },
  epinefrina_inf: {
    id: 'epinefrina_inf', name: 'EPINEFRINA', category: 'vasoativos', color: '#EF4444', unit: 'mcg/kg/min', range: [0.01, 1], step: 0.01, defaultVal: 0.1,
    presentation: '1 mg/mL',
    dilutions: {
      small: { drug: 1, diluent: 30, conc: 32.3, vol: 31, formula: 2 },
      medium: { drug: 5, diluent: 150, conc: 32.3, vol: 155, formula: 2 },
      large: { drug: 6, diluent: 200, conc: 29.1, vol: 206, formula: 2 },
    },
  },
  norepinefrina: {
    id: 'norepinefrina', name: 'NOREPINEFRINA', category: 'vasoativos', color: '#8B5CF6', unit: 'mcg/kg/min', range: [0.05, 2], step: 0.05, defaultVal: 0.1,
    presentation: '1 mg/mL', warning: 'Diluir em SG 5%',
    dilutions: {
      small: { drug: 4, diluent: 60, conc: 62.5, vol: 64, formula: 1 },
      medium: { drug: 8, diluent: 120, conc: 62.5, vol: 128, formula: 1 },
      large: { drug: 16, diluent: 250, conc: 60, vol: 266, formula: 1 },
    },
  },
  vasopressina: {
    id: 'vasopressina', name: 'VASOPRESSINA', category: 'vasoativos', color: '#D946EF', unit: 'mU/kg/min', range: [0.2, 2], step: 0.1, defaultVal: 0.5,
    presentation: '20 U/mL',
    dilutions: {
      // 2 amp (20 U/mL) + SF 98 mL = 0,4 U/mL em todas as faixas — padrao do
      // servico, identico ao adulto (confirmado por Gustavo, 22/08/2026).
      small: { drug: 2, diluent: 98, conc: 400, vol: 100, formula: 1 },
      medium: { drug: 2, diluent: 98, conc: 400, vol: 100, formula: 1 },
      large: { drug: 2, diluent: 98, conc: 400, vol: 100, formula: 1 },
    },
  },
  // Nitroprussiato — existia no HETRIN e faltava aqui; unico item que o
  // pareamento por id apontou como ausente.
  // conc 600 mcg/mL confere com o protocolo: mL/h = dose x peso x 60 / 600
  // = peso x dose / 10, exatamente a coluna do CLAUDE.md secao 17.
  nitroprussiato: {
    id: 'nitroprussiato', name: 'NITROPRUSSIATO', category: 'vasoativos', color: '#78716C', unit: 'mcg/kg/min', range: [0.5, 10], step: 0.5, defaultVal: 1,
    presentation: '25 mg/mL', warning: 'Diluir em SG 5%. Proteger da luz.',
    dilutions: {
      small: { drug: 1, diluent: 40, conc: 600, vol: 41, formula: 0.1 },
      medium: { drug: 1, diluent: 40, conc: 600, vol: 41, formula: 0.1 },
      large: { drug: 2, diluent: 80, conc: 600, vol: 82, formula: 0.1 },
    },
  },
  milrinona: {
    id: 'milrinona', name: 'MILRINONA', category: 'vasoativos', color: '#10B981', unit: 'mcg/kg/min', range: [0.25, 0.75], step: 0.05, defaultVal: 0.5,
    presentation: '1 mg/mL',
    dilutions: {
      small: { drug: 10, diluent: 40, conc: 200, vol: 50, formula: 0.3 },
      medium: { drug: 20, diluent: 80, conc: 200, vol: 100, formula: 0.3 },
      large: { drug: 30, diluent: 120, conc: 200, vol: 150, formula: 0.3 },
    },
  },
  amiodarona_inf: {
    id: 'amiodarona_inf', name: 'AMIODARONA', category: 'vasoativos', color: '#6366F1', unit: 'mcg/kg/min', range: [5, 15], step: 1, defaultVal: 10,
    presentation: '50 mg/mL', warning: 'Diluir em SG 5%',
    dilutions: {
      small: { drug: 3, diluent: 47, conc: 3000, vol: 50, formula: 0.02 },
      medium: { drug: 6, diluent: 95, conc: 2970, vol: 101, formula: 0.02 },
      large: { drug: 9, diluent: 140, conc: 3020, vol: 149, formula: 0.02 },
    },
  },
  fentanil_inf: {
    id: 'fentanil_inf', name: 'FENTANIL', category: 'sedativos', color: '#F97316', unit: 'mcg/kg/h', range: [0.5, 4], step: 0.5, defaultVal: 1,
    presentation: '50 mcg/mL',
    dilutions: {
      small: { drug: 10, diluent: 40, conc: 10, vol: 50, formula: 10 },
      medium: { drug: 20, diluent: 80, conc: 10, vol: 100, formula: 10 },
      large: { drug: 60, diluent: 90, conc: 20, vol: 150, formula: 20 },
    },
  },
  midazolam_inf: {
    id: 'midazolam_inf', name: 'MIDAZOLAM', category: 'sedativos', color: '#3B82F6', unit: 'mcg/kg/min', range: [1, 18], step: 1, defaultVal: 2,
    presentation: '5 mg/mL',
    dilutions: {
      small: { drug: 10, diluent: 40, conc: 1000, vol: 50, formula: 1 },
      medium: { drug: 20, diluent: 80, conc: 1000, vol: 100, formula: 1 },
      large: { drug: 60, diluent: 90, conc: 2000, vol: 150, formula: 2 },
    },
  },
  cetamina_inf: {
    id: 'cetamina_inf', name: 'CETAMINA', category: 'sedativos', color: '#8B5CF6', unit: 'mcg/kg/min', range: [5, 40], step: 5, defaultVal: 10,
    presentation: '50 mg/mL',
    dilutions: {
      small: { drug: 6, diluent: 54, conc: 5000, vol: 60, formula: 0.012 },
      medium: { drug: 6, diluent: 54, conc: 5000, vol: 60, formula: 0.012 },
      large: { drug: 20, diluent: 180, conc: 5000, vol: 200, formula: 0.012 },
    },
  },
  dexmedetomidina: {
    id: 'dexmedetomidina', name: 'DEXMEDETOMIDINA', category: 'sedativos', color: '#06B6D4', unit: 'mcg/kg/h', range: [0.2, 1.4], step: 0.1, defaultVal: 0.5,
    presentation: '100 mcg/mL',
    dilutions: {
      small: { drug: 2, diluent: 48, conc: 4, vol: 50, formula: 4 },
      medium: { drug: 4, diluent: 96, conc: 4, vol: 100, formula: 4 },
      large: { drug: 8, diluent: 192, conc: 4, vol: 200, formula: 4 },
    },
  },
  morfina: {
    id: 'morfina', name: 'MORFINA', category: 'sedativos', color: '#EC4899', unit: 'mcg/kg/h', range: [10, 40], step: 5, defaultVal: 20,
    presentation: '10 mg/mL',
    dilutions: {
      small: { drug: 1, diluent: 49, conc: 200, vol: 50, formula: 200 },
      medium: { drug: 2, diluent: 98, conc: 200, vol: 100, formula: 200 },
      large: { drug: 4, diluent: 96, conc: 400, vol: 100, formula: 400 },
    },
  },
  propofol_inf: {
    id: 'propofol_inf', name: 'PROPOFOL 1%', category: 'sedativos', color: '#F59E0B', unit: 'mg/kg/h', range: [1, 4], step: 0.5, defaultVal: 2,
    presentation: '10 mg/mL', warning: 'Não usar em crianças para sedação prolongada',
    dilutions: {
      small: { drug: 20, diluent: 20, conc: 5, vol: 40, formula: 5 },
      medium: { drug: 50, diluent: 0, conc: 10, vol: 50, formula: 10 },
      large: { drug: 50, diluent: 0, conc: 10, vol: 50, formula: 10 },
    },
  },
  rocuronio_inf: {
    id: 'rocuronio_inf', name: 'ROCURONIO', category: 'outros', color: '#14B8A6', unit: 'mcg/kg/min', range: [5, 15], step: 1, defaultVal: 10,
    presentation: '10 mg/mL',
    dilutions: {
      small: { drug: 10, diluent: 40, conc: 2000, vol: 50, formula: 0.03 },
      medium: { drug: 20, diluent: 80, conc: 2000, vol: 100, formula: 0.03 },
      large: { drug: 50, diluent: 200, conc: 2000, vol: 250, formula: 0.03 },
    },
  },
  cisatracurio_inf: {
    id: 'cisatracurio_inf', name: 'CISATRACURIO', category: 'outros', color: '#64748B', unit: 'mcg/kg/min', range: [1, 4], step: 0.5, defaultVal: 2,
    presentation: '2 mg/mL',
    dilutions: {
      small: { drug: 10, diluent: 40, conc: 400, vol: 50, formula: 0.15 },
      medium: { drug: 15, diluent: 60, conc: 400, vol: 75, formula: 0.15 },
      large: { drug: 50, diluent: 200, conc: 400, vol: 250, formula: 0.15 },
    },
  },
}

function getWeightCategory(peso: number): 'small' | 'medium' | 'large' {
  if (peso < 15) return 'small'
  if (peso <= 40) return 'medium'
  return 'large'
}

function getWeightCategoryLabel(cat: 'small' | 'medium' | 'large'): string {
  if (cat === 'small') return '< 15 kg'
  if (cat === 'medium') return '15-40 kg'
  return '> 40 kg'
}

function formatConc(conc: number, unit: string): string {
  if (unit.includes('mU/')) {
    if (conc >= 1000) return `${(conc / 1000).toFixed(1)} U/mL`
    return `${conc} mU/mL`
  }
  if (unit.includes('mcg')) {
    if (conc >= 1000) return `${(conc / 1000).toFixed(1)} mg/mL`
    return `${conc} mcg/mL`
  }
  return `${conc} mg/mL`
}

function calcInfusionRate(inf: InfusionDrug, dose: number, peso: number): number {
  const cat = getWeightCategory(peso)
  const dil = inf.dilutions[cat]
  if (inf.unit === 'mcg/kg/min') return (dose * peso * 60) / dil.conc
  if (inf.unit === 'mcg/kg/h') return (dose * peso) / dil.conc
  if (inf.unit === 'mg/kg/h') return (dose * peso) / dil.conc
  if (inf.unit === 'mU/kg/min') return (dose * peso * 60) / dil.conc
  return 0
}

function calcDoseFromRate(inf: InfusionDrug, mlh: number, peso: number): number {
  const cat = getWeightCategory(peso)
  const dil = inf.dilutions[cat]
  if (inf.unit === 'mcg/kg/min') return (mlh * dil.conc) / (peso * 60)
  if (inf.unit === 'mcg/kg/h') return (mlh * dil.conc) / peso
  if (inf.unit === 'mg/kg/h') return (mlh * dil.conc) / peso
  if (inf.unit === 'mU/kg/min') return (mlh * dil.conc) / (peso * 60)
  return 0
}

// ==========================================
// CENARIOS
// ==========================================

const SCENARIO_CONFIGS: Record<string, ScenarioConfig> = {
  anafilaxia: {
    title: 'Anafilaxia', desc: 'Epinefrina IM, corticoide, anti-histamínico', color: '#F44336',
    highlight: ['epinefrina-im', 'hidrocortisona', 'difenidramina'],
    sections: ['emergências'],
    scrollTo: 'epinefrina-im',
    infusionHighlight: [],
  },
  convulsão: {
    title: 'Status Epilepticus', desc: 'Diazepam, midazolam, fenitoína, fenobarbital', color: '#FFC107',
    highlight: ['diazepam', 'midazolam-conv', 'fenitoina', 'fenobarbital', 'levetiracetam'],
    sections: ['convulsão'],
    scrollTo: 'diazepam',
    infusionHighlight: [],
  },
  isr: {
    title: 'IOT / ISR', desc: 'Checklist, cetamina, rocurônio, succinilcolina', color: '#2196F3',
    checklist: true,
    highlight: ['cetamina', 'midazolam', 'fentanil', 'rocuronio'],
    sections: ['iot', 'drogas-iot'],
    scrollTo: 'cetamina',
    infusionHighlight: [],
  },
  choque: {
    title: 'Choque', desc: 'Fluidos, epinefrina, norepinefrina, dobutamina', color: '#FF5252',
    fluids: true,
    highlight: [],
    sections: ['fluidos', 'infusoes'],
    scrollTo: null,
    infusionHighlight: ['epinefrina_inf', 'norepinefrina', 'dobutamina'],
  },
  'choque-cardio': {
    title: 'Choque cardiogênico', desc: 'Dobutamina, milrinona, epinefrina', color: '#8B5CF6',
    highlight: [],
    sections: ['infusoes'],
    scrollTo: null,
    infusionHighlight: ['dobutamina', 'milrinona', 'epinefrina_inf'],
  },
  'pos-pcr': {
    title: 'Pós-PCR / Arritmia', desc: 'Amiodarona, epinefrina, norepinefrina', color: '#F97316',
    highlight: [],
    sections: ['infusoes'],
    scrollTo: null,
    infusionHighlight: ['amiodarona_inf', 'epinefrina_inf', 'norepinefrina'],
  },
  sedação: {
    title: 'Sedação pós-IOT', desc: 'Fentanil, midazolam, dexmedetomidina, cetamina', color: '#10B981',
    highlight: [],
    sections: ['infusoes'],
    scrollTo: null,
    infusionHighlight: ['fentanil_inf', 'midazolam_inf', 'dexmedetomidina', 'cetamina_inf'],
  },
}

// ==========================================
// PREPARATION MODALS
// ==========================================

const PREPARATIONS: Record<string, { title: string; steps: string[] }> = {
  epinefrina: {
    title: 'Epinefrina 1:10.000',
    steps: [
      'Aspirar 1 mL de Epinefrina 1:1.000 (1 mg/mL)',
      'Adicionar 9 mL de Água Destilada',
      'Volume final: 10 mL',
      'Concentração: 0,1 mg/mL (1:10.000)',
      'Dose: 0,1 mL/kg desta solução',
    ],
  },
  nacl3: {
    title: 'NaCl 3% (Salina Hipertônica)',
    steps: [
      'Aspirar 15 mL de NaCl 20%',
      'Adicionar 85 mL de Água Destilada',
      'Volume final: 100 mL de NaCl 3%',
      'Concentração: 0,513 mEq Na/mL',
      'Alt: NaCl 10% 30 mL + AD 70 mL',
    ],
  },
}

// ==========================================
// IOT CHECKLIST
// ==========================================

const IOT_CHECKLIST_ITEMS = [
  { text: 'Monitorização (SpO₂, ECG, ETCO2, PA)', valueKey: null },
  { text: 'Acesso venoso pérvio', valueKey: null },
  { text: 'Pré-oxigenação (FiO₂ 100%, 3 min)', valueKey: null },
  { text: 'Aspirador montado e testado', valueKey: null },
  { text: 'Laringoscópio com luz testada', valueKey: 'lâmina' },
  { text: 'Tubo traqueal + 1 menor', valueKey: 'tubo' },
  { text: 'Cuff testado', valueKey: null },
  { text: 'Bougie / Guia disponível', valueKey: 'bougie' },
  { text: 'Máscara laríngea disponível', valueKey: 'lma' },
  { text: 'Bolsa-válvula-máscara conectada O2', valueKey: null },
  { text: 'Drogas preparadas e identificadas', valueKey: null },
  { text: 'Plano VA difícil definido', valueKey: null },
]

// ==========================================
// 6H e 6T
// ==========================================

const CAUSES_6H = ['Hipóxia', 'Hipovolemia', 'Hidrogênio (Acidose)', 'Hipoglicemia', 'Hipo/Hipercalemia', 'Hipotermia']
const CAUSES_6T = ['Tensão (Pneumotórax)', 'Tamponamento cardíaco', 'Toxinas', 'Trombose pulmonar (TEP)', 'Trombose coronariana', 'Trauma']

// ==========================================
// SUBCOMPONENTES
// ==========================================

function DrugCard({ drug, peso, ageY, highlighted, onPrep }: {
  drug: BolusDrug
  peso: number
  ageY?: number | null
  highlighted: boolean
  onPrep?: (key: string) => void
}) {
  const faltaIdade = !!drug.needsAge && (ageY === null || ageY === undefined)
  const result = peso > 0 && !faltaIdade
    ? drug.calc(peso, ageY ?? null, ageY != null ? ageY * 12 : null)
    : null
  const isHighlight = drug.highlight || highlighted
  // A droga destacada por um cenario e a que o medico veio buscar: abre expandida.
  const [open, setOpen] = useState(isHighlight)
  useEffect(() => { if (isHighlight) setOpen(true) }, [isHighlight])

  return (
    <div className={`rounded-xl border-2 mb-3 overflow-hidden ${isHighlight ? 'border-accent bg-accent/10' : 'border-border-card bg-bg-hover'}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`w-full flex justify-between items-center text-left px-4 py-3 gap-3 border-none cursor-pointer min-h-[44px] ${isHighlight ? 'bg-accent' : 'bg-[#333]'}`}
      >
        <div className="min-w-0">
          <div className={`font-bold text-[0.95rem] ${isHighlight ? 'text-white' : 'text-text-primary'}`}>{drug.name}</div>
          <div className={`text-[0.8rem] mt-0.5 ${isHighlight ? 'text-white/80' : 'text-text-muted'}`}>{drug.presentation}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="font-mono text-[0.75rem] font-semibold px-2.5 py-1.5 bg-bg-elevated text-text-primary rounded-md">{drug.doseBadge}</div>
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${open ? 'rotate-180' : ''} ${isHighlight ? 'text-white' : 'text-text-muted'}`}
          />
        </div>
      </button>
      {/* Body — grid 0fr/1fr anima a altura sem precisar medi-la */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden min-h-0">
      <div className="p-4">
        <div className="text-[0.8rem] text-text-muted leading-relaxed mb-3">{drug.instruction}</div>
        {result && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="text-[0.6rem] font-bold uppercase text-text-muted">Dose</div>
              <div className="font-mono text-xl font-bold text-accent bg-bg-elevated px-4 py-2.5 rounded-lg border-2 border-border-card text-center min-w-[90px]">
                {result.mg} <span className="text-[0.8rem] text-text-muted">{result.unit}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-[0.6rem] font-bold uppercase text-text-muted">Volume</div>
              <div className="font-mono text-xl font-bold text-accent bg-bg-elevated px-4 py-2.5 rounded-lg border-2 border-border-card text-center min-w-[90px]">
                {result.ml} <span className="text-[0.8rem] text-text-muted">mL</span>
              </div>
            </div>
          </div>
        )}
        {result?.mlLabel && (
          <div className="text-center text-[0.75rem] text-text-muted mt-2">{result.mlLabel}</div>
        )}
        {result && drug.calcAt && (
          <div className="text-center text-[0.75rem] text-text-muted mt-2">Calculado a {drug.calcAt}</div>
        )}
        {!result && (
          <div className="text-center text-[0.8rem] text-warning py-2">
            {faltaIdade ? 'Informe a idade em Sinais vitais para calcular' : 'Informe o peso para calcular'}
          </div>
        )}
        {drug.prepKey && onPrep && (
          <button
            onClick={() => onPrep(drug.prepKey!)}
            className="mt-3 px-3.5 py-2.5 bg-bg-hover text-text-primary border-none rounded-lg text-[0.8rem] font-bold cursor-pointer min-h-[44px]"
          >
            Como preparar
          </button>
        )}
      </div>
        </div>
      </div>
    </div>
  )
}

function InfusionCard({ inf, peso, highlighted }: {
  inf: InfusionDrug
  peso: number
  highlighted: boolean
}) {
  const [dose, setDose] = useState(inf.defaultVal)
  const cat = getWeightCategory(peso || 10)
  const dil = inf.dilutions[cat]

  const rate = peso > 0 ? calcInfusionRate(inf, dose, peso) : null
  const outOfRange = dose < inf.range[0] || dose > inf.range[1]

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDose(parseFloat(e.target.value))
  }, [])

  const handleDoseInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value.replace(',', '.'))
    if (!isNaN(v)) setDose(v)
  }, [])

  const handleRateInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const mlh = parseFloat(e.target.value.replace(',', '.'))
    if (!isNaN(mlh) && mlh > 0 && peso > 0) {
      const newDose = calcDoseFromRate(inf, mlh, peso)
      setDose(newDose)
    }
  }, [inf, peso])

  const decimals = inf.step < 0.1 ? 2 : inf.step < 1 ? 1 : 0

  // A infusao destacada por um cenario abre expandida.
  const [open, setOpen] = useState(highlighted)
  useEffect(() => { if (highlighted) setOpen(true) }, [highlighted])

  return (
    <div className={`rounded-xl border-2 mb-3 overflow-hidden transition-all ${highlighted ? 'border-blue-400 shadow-[0_0_0_3px_rgba(66,165,245,0.3)]' : 'border-border-card'}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex justify-between items-center text-left px-4 py-3 text-white gap-2 border-none cursor-pointer min-h-[44px]"
        style={{ background: inf.color }}
      >
        <span className="font-bold text-[0.9rem] min-w-0">{inf.name}</span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[0.8rem] bg-white/20 px-2.5 py-1 rounded-md">
            {inf.range[0]}-{inf.range[1]} {inf.unit}
          </span>
          <ChevronDown size={16} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {/* Body — grid 0fr/1fr anima a altura sem precisar medi-la */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden min-h-0">
      <div className="p-3.5 bg-bg-card">
        {/* Preparo */}
        <div className="bg-bg-elevated border border-border-card rounded-lg p-3 mb-3">
          <div className="text-[0.8rem] font-bold uppercase text-text-muted mb-2">PREPARO</div>
          <div className="text-[0.8rem] leading-relaxed text-text-secondary">
            <span className="text-text-muted">Ampola:</span> {inf.presentation}<br />
            <span className="text-text-muted">Droga:</span> {dil.drug} mL + <span className="text-text-muted">Diluente:</span> {dil.diluent} mL<br />
            <span className="text-text-muted">Volume final:</span> {dil.vol} mL | <span className="text-text-muted">Conc.:</span> {formatConc(dil.conc, inf.unit)}
          </div>
          {inf.warning && (
            <div className="bg-amber-500/15 text-amber-400 text-[0.75rem] px-2.5 py-1.5 rounded-md mt-2 font-semibold">{inf.warning}</div>
          )}
        </div>

        {/* Dose control */}
        <div className="mb-3">
          <div className="text-[0.8rem] font-bold uppercase text-text-muted mb-2">DOSE</div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={inf.range[0]} max={inf.range[1]} step={inf.step}
              value={Math.min(inf.range[1], Math.max(inf.range[0], dose))}
              onChange={handleSlider}
              className="flex-1 h-2 accent-blue-500 rounded-full"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="decimal"
                value={dose.toFixed(decimals)}
                onChange={handleDoseInput}
                step={inf.step}
                className={`font-mono text-base font-bold w-[70px] px-1.5 py-1.5 bg-bg-elevated border-2 rounded-lg text-center text-text-primary outline-none ${outOfRange ? 'border-accent text-accent' : 'border-[#555]'}`}
              />
              <span className="text-[0.8rem] text-text-muted whitespace-nowrap">{inf.unit}</span>
            </div>
          </div>
          {outOfRange && (
            <div className="text-xs text-accent text-center mt-1">Fora do range ({inf.range[0]}-{inf.range[1]})</div>
          )}
        </div>

        {/* Rate result */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl px-6 py-3.5 text-center min-w-[140px]">
            <div className="text-[0.75rem] font-semibold uppercase opacity-90 mb-1">VELOCIDADE</div>
            <input
              type="text"
              inputMode="decimal"
              value={rate !== null ? (rate < 0.1 ? fmt(rate, 2) : fmt(rate, 1)) : ''}
              placeholder={peso > 0 ? '--' : 'Peso?'}
              onChange={handleRateInput}
              className="font-mono text-2xl font-bold bg-transparent border-none text-center w-full text-white outline-none placeholder:text-white/50"
            />
            <div className="text-[0.75rem] opacity-90">mL/h</div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  )
}

function ChecklistItem({ text, value }: { text: string; value?: string }) {
  const [checked, setChecked] = useState(false)

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border-card">
      <div
        onClick={() => setChecked(!checked)}
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 cursor-pointer min-w-[24px] min-h-[24px] transition-colors ${
          checked ? 'bg-success border-success' : 'border-[#555]'
        }`}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" /></svg>
        )}
      </div>
      <span className="flex-1 text-[0.85rem] text-text-primary">{text}</span>
      {value && <span className="font-mono font-bold text-accent text-[0.9rem]">{value}</span>}
    </div>
  )
}

// ==========================================
// SINAIS VITAIS E ESTIMATIVA DE PESO
// ==========================================

const VITAL_COLS = ['< 1 ano', '1-2 anos', '3-5 anos', '6-11 anos', '> 12 anos']

const VITAL_ROWS: { label: string; values: string[] }[] = [
  { label: 'FC (bpm)', values: ['100-190', '80-160', '75-120', '70-110', '60-110'] },
  { label: 'FR (irpm)', values: ['30-60', '20-40', '20-30', '18-25', '12-20'] },
]

/** PAS minima estimada: 70 + (2 x idade). A partir de 10 anos, piso de 90 mmHg. */
function pasMinima(ageY: number): number {
  return ageY > 10 ? 90 : Math.round(70 + 2 * ageY)
}

/** Le um campo cru: devolve o valor so quando esta dentro da faixa, e sinaliza o que ficou fora. */
function naFaixa(raw: string, min: number, max: number): { valor: number | null; invalido: boolean } {
  if (raw.trim() === '') return { valor: null, invalido: false }
  const v = parseFloat(raw.replace(',', '.'))
  if (!isFinite(v) || v < min || v > max) return { valor: null, invalido: true }
  return { valor: v, invalido: false }
}

/** Cor Broselow pelo comprimento: a fita mede e devolve a cor — mesma tabela, um caminho so. */
function corPorComprimento(cm: number): BroselowEntry | null {
  if (!isFinite(cm)) return null
  return BROSELOW_DATA.find(e => cm >= e.min && cm <= e.max) ?? null
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function PedGuide() {
  const _pedToast = useToast(); void _pedToast

  // Entradas cruas: guardam o que foi digitado, mesmo fora da faixa, para o
  // medico continuar vendo o proprio numero enquanto o erro e mostrado.
  const [pesoRaw, setPesoRaw] = useState('')
  const [idadeRaw, setIdadeRaw] = useState('')
  const [alturaRaw, setAlturaRaw] = useState('')
  const [selectedBroselow, setSelectedBroselow] = useState<BroselowEntry | null>(null)
  const [broselowOpen, setBroselowOpen] = useState(false)

  const pesoIn = naFaixa(pesoRaw, 0.5, 50)
  const idadeIn = naFaixa(idadeRaw, 0, 18)
  const alturaIn = naFaixa(alturaRaw, BROSELOW_DATA[0].min, BROSELOW_DATA[BROSELOW_DATA.length - 1].max)

  // Views
  const [view, setView] = useState<PedView>('home')
  const [scenarioKey, setScenarioKey] = useState<string | null>(null)

  // Scenario highlights
  const [highlightedDrugs, setHighlightedDrugs] = useState<string[]>([])
  const [highlightedInfusions, setHighlightedInfusions] = useState<string[]>([])
  const [openSections, setOpenSections] = useState<string[]>([])

  // Modal
  const [prepModal, setPrepModal] = useState<string | null>(null)

  // Infusion search
  const [infusionSearch, setInfusionSearch] = useState('')

  // Idade: campo explicito manda; sem ele, vale a idade da cor Broselow escolhida.
  const idadeEfetiva = useMemo(() => {
    if (idadeIn.valor !== null) return idadeIn.valor
    if (selectedBroselow) return selectedBroselow.idadeMeses / 12
    return null
  }, [idadeIn.valor, selectedBroselow])

  // Peso: so o aferido e a cor Broselow entram nos calculos. Idade e
  // comprimento informam, mas nao definem a dose por conta propria.
  const { peso, source } = useMemo<{ peso: number | null; source: PesoSource }>(() => {
    if (pesoIn.valor !== null) return { peso: pesoIn.valor, source: 'peso' }
    if (selectedBroselow) return { peso: selectedBroselow.peso, source: 'broselow' }
    return { peso: null, source: null }
  }, [pesoIn.valor, selectedBroselow])

  const estimado = source !== null && source !== 'peso'
  const p = peso ?? 0

  // Broselow bidirecional
  const currentBroselow = useMemo(() => {
    if (source === 'broselow' && selectedBroselow) return selectedBroselow
    if (p > 0) return getColorFromWeight(p)
    return null
  }, [p, source, selectedBroselow])

  // Equipamentos
  const equipment = useMemo(() => {
    if (!currentBroselow) return null
    const eq = currentBroselow
    return {
      tubo: eq.tubo.toFixed(1),
      fixacao: String(eq.fixacao),
      lâmina: eq.lâmina,
      lma: eq.lma,
      bougie: eq.bougie,
      sondaAsp: String(eq.sondaAsp),
      checkLamina: `Lâmina ${eq.lâmina}`,
      checkTubo: `${eq.tubo} e ${(eq.tubo - 0.5).toFixed(1)}`,
      checkBougie: `${eq.bougie} Fr`,
      checkLma: `Tam. ${eq.lma}`,
    }
  }, [currentBroselow])

  // Desfibrilação
  const defib = useMemo(() => {
    if (p <= 0) return null
    return {
      first: Math.round(p * 2),
      second: Math.round(p * 4),
      cardio: `${Math.round(p * 0.5)}-${Math.round(p)}`,
      // PALS 2025: iniciar 0,5-1 J/kg; se ineficaz, subir para 2 J/kg
      cardioMax: Math.round(p * 2),
    }
  }, [p])

  // Profundidade RCP
  const cprDepth = useMemo(() => {
    if (p < 10) return '1/3 AP (~4cm)'
    if (p < 30) return '1/3 AP (~5cm)'
    return '5-6 cm'
  }, [p])

  // Transfusão
  const transfusion = useMemo(() => {
    if (p <= 0) return null
    return {
      chad: `${(p * 10).toFixed(0)}-${(p * 15).toFixed(0)}`,
      pfc: `${(p * 10).toFixed(0)}-${(p * 15).toFixed(0)}`,
      plaq: `${(p * 5).toFixed(0)}-${(p * 10).toFixed(0)}`,
      crio: `${(p * 5).toFixed(0)}-${(p * 10).toFixed(0)}`,
      volemia: (p * 80).toFixed(0),
    }
  }, [p])

  // Fluidos
  const fluids = useMemo(() => {
    if (p <= 0) return null
    let m: number
    if (p <= 10) m = p * 4
    else if (p <= 20) m = 40 + (p - 10) * 2
    else m = 60 + (p - 20)
    return {
      bolus: (p * 20).toFixed(0),
      manutenção: m.toFixed(0),
      volemia: (p * 80).toFixed(0),
    }
  }, [p])

  // Weight category for infusions
  const weightCat = useMemo(() => getWeightCategory(p || 10), [p])

  // Filtered infusions
  const filteredInfusions = useMemo(() => {
    const q = infusionSearch.toLowerCase().trim()
    const all = Object.values(INFUSION_DATA)
    if (!q) return all
    return all.filter(inf => inf.name.toLowerCase().includes(q))
  }, [infusionSearch])

  const infusionsByCategory = useMemo(() => {
    const cats: Record<string, InfusionDrug[]> = { vasoativos: [], sedativos: [], outros: [] }
    for (const inf of filteredInfusions) {
      cats[inf.category].push(inf)
    }
    return cats
  }, [filteredInfusions])

  // Handlers
  function handlePesoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPesoRaw(e.target.value)
    if (e.target.value.trim() !== '') setSelectedBroselow(null)
  }

  function handleBroselowSelect(entry: BroselowEntry) {
    setSelectedBroselow(entry)
    setPesoRaw('')
    setBroselowOpen(false)
  }

  // Comprimento dentro do alcance da fita: acende a cor correspondente.
  function handleAlturaChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAlturaRaw(e.target.value)
    const cm = parseFloat(e.target.value.replace(',', '.'))
    const cor = corPorComprimento(cm)
    if (cor) handleBroselowSelect(cor)
  }

  function showView(v: PedView) {
    setView(v)
    setScenarioKey(null)
    setHighlightedDrugs([])
    setHighlightedInfusions([])
    setOpenSections([])
    window.scrollTo(0, 0)
  }

  function loadScenario(key: string) {
    const cfg = SCENARIO_CONFIGS[key]
    if (!cfg) return
    setScenarioKey(key)
    setView('cenario')
    setHighlightedDrugs(cfg.highlight)
    setHighlightedInfusions(cfg.infusionHighlight)
    setOpenSections(cfg.sections)
    window.scrollTo(0, 0)
  }

  /** Do cenario para a lista completa, sem perder o caminho de volta. */
  function verTodasCalculadoras() {
    setView('calculadoras')
    window.scrollTo(0, 0)
  }

  function handleBackFromCalc() {
    // Veio de um cenario: volta para ele, nao para a lista — o medico perderia
    // o contexto que acabou de escolher.
    if (scenarioKey) {
      setView('cenario')
      window.scrollTo(0, 0)
      return
    }
    showView('home')
  }

  function handlePrep(key: string) {
    setPrepModal(key)
  }

  const fabItems = [
    { label: 'Home', onClick: () => showView('home') },
    { label: 'PCR', onClick: () => showView('pcr') },
    { label: 'Cenários', onClick: () => showView('cenarios') },
    { label: 'Calculadoras', onClick: () => showView('calculadoras') },
  ]

  // Helper: is section forced open by scenario?
  function isSectionOpen(sectionKey: string): boolean {
    return openSections.includes(sectionKey)
  }

  // Blocos usados tanto pela tela de Calculadoras quanto pela tela de cenario
  function renderChecklist() {
    return (
      <div className="bg-bg-hover rounded-xl p-4">
        {IOT_CHECKLIST_ITEMS.map((item, i) => {
          let value: string | undefined
          if (item.valueKey && equipment) {
            if (item.valueKey === 'lâmina') value = equipment.checkLamina
            else if (item.valueKey === 'tubo') value = equipment.checkTubo
            else if (item.valueKey === 'bougie') value = equipment.checkBougie
            else if (item.valueKey === 'lma') value = equipment.checkLma
          }
          return <ChecklistItem key={i} text={item.text} value={value} />
        })}
      </div>
    )
  }

  function renderFluids() {
    if (!fluids) return <div className="text-center text-[0.8rem] text-warning py-4">Informe o peso para calcular</div>
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-bg-hover rounded-xl p-4 text-center border-2 border-border-card">
          <div className="text-[0.75rem] font-bold uppercase text-text-muted mb-2">Bolus Cristaloide</div>
          <div className="font-mono text-2xl font-bold text-text-primary">{fluids.bolus}</div>
          <div className="text-[0.75rem] text-text-muted mt-1">mL (20 mL/kg)</div>
        </div>
        <div className="bg-bg-hover rounded-xl p-4 text-center border-2 border-border-card">
          <div className="text-[0.75rem] font-bold uppercase text-text-muted mb-2">Manutenção/hora</div>
          <div className="font-mono text-2xl font-bold text-text-primary">{fluids.manutenção}</div>
          <div className="text-[0.75rem] text-text-muted mt-1">mL/h (Holliday-Segar)</div>
        </div>
        <div className="bg-bg-hover rounded-xl p-4 text-center border-2 border-border-card">
          <div className="text-[0.75rem] font-bold uppercase text-text-muted mb-2">Volemia Estimada</div>
          <div className="font-mono text-2xl font-bold text-text-primary">{fluids.volemia}</div>
          <div className="text-[0.75rem] text-text-muted mt-1">mL (80 mL/kg)</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="PedGuide" subtitle="Calculadora pediátrica" />

      {/* INPUT SECTION */}
      <div className="bg-bg-elevated px-4 py-5 border-b-4 border-accent">
        <div className="max-w-[500px] mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {/* Peso */}
            <div className={`rounded-xl p-3.5 border-2 transition-all ${
              pesoIn.invalido ? 'border-danger bg-danger/10'
                : source === 'peso' ? 'border-accent bg-accent/15'
                : 'border-border-card bg-bg-hover'
            }`}>
              <div className="flex items-center justify-between mb-2 gap-1.5">
                <span className="text-[0.75rem] font-bold uppercase text-text-muted">Peso</span>
                {source === 'peso' && (
                  <span className="text-[0.5rem] font-bold px-1.5 py-0.5 rounded bg-accent text-white">FONTE</span>
                )}
                {estimado && (
                  <span className="text-[0.5rem] font-bold px-1.5 py-0.5 rounded bg-border-card text-text-secondary">ESTIMADO</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  inputMode="decimal"
                  value={pesoRaw !== '' ? pesoRaw : (estimado && peso !== null ? peso : '')}
                  onChange={handlePesoChange}
                  placeholder="--"
                  min={0.5} max={50} step={0.1}
                  aria-invalid={pesoIn.invalido}
                  className={`min-w-0 flex-1 font-mono text-[1.4rem] font-bold bg-transparent border-none outline-none w-full ${pesoIn.invalido ? 'text-danger' : 'text-text-primary'}`}
                />
                <span className="text-[0.85rem] font-semibold text-text-muted">kg</span>
              </div>
              <div className={`text-[0.65rem] mt-1 ${pesoIn.invalido ? 'text-danger font-bold' : 'text-text-muted'}`}>
                {estimado && !pesoIn.invalido ? 'estimado pela cor Broselow' : '0,5 a 50 kg'}
              </div>
            </div>

            {/* Broselow */}
            <div className={`rounded-xl p-3.5 border-2 transition-all relative ${source === 'broselow' ? 'border-accent bg-accent/15' : 'border-border-card bg-bg-hover'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.75rem] font-bold uppercase text-text-muted">Cor Broselow</span>
                {source === 'broselow' && (
                  <span className="text-[0.5rem] font-bold px-1.5 py-0.5 rounded bg-accent text-white">FONTE</span>
                )}
              </div>
              <div
                onClick={() => setBroselowOpen(!broselowOpen)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer min-h-[44px] ${currentBroselow ? currentBroselow.bgClass : 'bg-gray-500'} text-white`}
              >
                {currentBroselow && (
                  <>
                    <div className={`w-6 h-6 rounded-md border-2 border-white/30 ${currentBroselow.dotClass}`} />
                    <span className="font-mono text-base font-bold">{currentBroselow.name} ({currentBroselow.peso}kg)</span>
                  </>
                )}
                {!currentBroselow && <span className="font-mono text-base font-bold">Selecione</span>}
              </div>

              {/* Dropdown */}
              {broselowOpen && (
                <div className="absolute top-full left-0 right-0 bg-bg-hover rounded-xl shadow-2xl z-[100] overflow-hidden mt-1 max-h-[300px] overflow-y-auto border border-border-card">
                  {BROSELOW_DATA.map(entry => (
                    <div
                      key={entry.key}
                      onClick={() => handleBroselowSelect(entry)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border-card hover:bg-[#333] active:bg-[#333]"
                    >
                      <div className={`w-8 h-8 rounded-lg ${entry.dotClass}`} />
                      <div>
                        <div className="font-bold text-[0.9rem] text-text-primary">{entry.name}</div>
                        <div className="text-[0.8rem] text-text-muted">{entry.peso} kg - {formatIdade(entry.idadeMeses)} - {entry.min}-{entry.max} cm</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {broselowOpen && <div className="fixed inset-0 z-40" onClick={() => setBroselowOpen(false)} />}

      <Container>
        {/* HOME VIEW */}
        {view === 'home' && (
          <div className="pt-5">
            <div
              onClick={() => showView('pcr')}
              className="bg-bg-hover border border-border-card rounded-xl p-5 mb-3 cursor-pointer active:bg-[#252525] border-l-4 border-l-danger transition-colors"
            >
              <div className="text-lg font-semibold text-text-primary">PCR Pediátrica</div>
              <div className="text-[0.8rem] text-text-muted mt-1">Guia rápido de parada cardiorrespiratória</div>
            </div>
            <div
              onClick={() => showView('cenarios')}
              className="bg-bg-hover border border-border-card rounded-xl p-5 mb-3 cursor-pointer active:bg-[#252525] border-l-4 border-l-accent transition-colors"
            >
              <div className="text-lg font-semibold text-text-primary">Cenários</div>
              <div className="text-[0.8rem] text-text-muted mt-1">Anafilaxia, status, choque, IOT, sedação</div>
            </div>
            <div
              onClick={() => showView('calculadoras')}
              className="bg-bg-hover border border-border-card rounded-xl p-5 mb-3 cursor-pointer active:bg-[#252525] border-l-4 border-l-info transition-colors"
            >
              <div className="text-lg font-semibold text-text-primary">Calculadoras</div>
              <div className="text-[0.8rem] text-text-muted mt-1">Infusões, doses por peso, equipamentos</div>
            </div>
          </div>
        )}

        {/* PCR VIEW */}
        {view === 'pcr' && (
          <div className="pt-5">
            <button onClick={() => showView('home')} className="bg-transparent border border-border-card text-text-muted px-4 py-2 rounded-lg text-sm cursor-pointer mb-4 active:bg-bg-hover min-h-[44px]">
              ← Voltar
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-4">PCR Pediátrica</h2>

            {/* CPR Parameters */}
            <div className="bg-bg-elevated rounded-2xl p-6 mb-5">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="text-[0.8rem] font-bold uppercase text-text-muted">Parâmetros de RCP pediátrica</div>
                <div className="text-[0.75rem] font-bold text-text-muted">Compressão:Ventilação — 15:2</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl p-4 text-center border-2" style={{ background: 'rgba(244,67,54,0.1)', borderColor: 'rgba(244,67,54,0.3)' }}>
                  <div className="text-[11px] font-bold uppercase text-[#888] mb-1.5" style={{ letterSpacing: '1.5px' }}>FREQUÊNCIA</div>
                  <div className="font-mono text-[28px] font-extrabold text-accent">100-120/min</div>
                </div>
                <div className="rounded-xl p-4 text-center border-2" style={{ background: 'rgba(33,150,243,0.1)', borderColor: 'rgba(33,150,243,0.3)' }}>
                  <div className="text-[11px] font-bold uppercase text-[#888] mb-1.5" style={{ letterSpacing: '1.5px' }}>RELAÇÃO C:V</div>
                  <div className="font-mono text-[28px] font-extrabold text-accent">15:2</div>
                </div>
                <div className="rounded-xl p-4 text-center border-2" style={{ background: 'rgba(76,175,80,0.1)', borderColor: 'rgba(76,175,80,0.3)' }}>
                  <div className="text-[11px] font-bold uppercase text-[#888] mb-1.5" style={{ letterSpacing: '1.5px' }}>PROFUNDIDADE</div>
                  <div className="font-mono text-[28px] font-extrabold text-accent">{cprDepth}</div>
                </div>
                <div className="rounded-xl p-4 text-center border-2" style={{ background: 'rgba(171,71,188,0.1)', borderColor: 'rgba(171,71,188,0.3)' }}>
                  <div className="text-[11px] font-bold uppercase text-[#888] mb-1.5" style={{ letterSpacing: '1.5px' }}>COM TOT</div>
                  <div className="font-mono text-[28px] font-extrabold text-accent">1 a cada 2-3s</div>
                </div>
              </div>
            </div>

            {/* Defibrillation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="bg-gradient-to-br from-accent to-red-800 text-white rounded-xl p-5 text-center">
                <div className="text-[0.75rem] font-bold uppercase opacity-80 mb-2">1ª Desfibrilação (2 J/kg)</div>
                <div className="font-mono text-3xl font-bold">{defib?.first ?? '--'}</div>
                <div className="text-base opacity-80">Joules</div>
              </div>
              <div className="bg-gradient-to-br from-accent to-red-800 text-white rounded-xl p-5 text-center">
                <div className="text-[0.75rem] font-bold uppercase opacity-80 mb-2">2ª Desfibrilação (4 J/kg)</div>
                <div className="font-mono text-3xl font-bold">{defib?.second ?? '--'}</div>
                <div className="text-base opacity-80">Joules</div>
              </div>
              <div className="bg-bg-hover text-white rounded-xl p-5 text-center">
                <div className="text-[0.75rem] font-bold uppercase opacity-80 mb-2">Cardioversão (0,5-1 J/kg)</div>
                <div className="font-mono text-3xl font-bold">{defib?.cardio ?? '--'}</div>
                <div className="text-base opacity-80">Joules</div>
                <div className="text-[0.75rem] opacity-70 mt-1">refratária: 2 J/kg ({defib?.cardioMax ?? '--'} J)</div>
              </div>
            </div>

            {/* PCR Drugs */}
            <Collapsible title="Drogas de parada cardiorrespiratória" badge="PCR" badgeColor="#F44336">
              {PCR_DRUGS.map(drug => (
                <DrugCard key={drug.id} drug={drug} peso={p} ageY={idadeEfetiva} highlighted={highlightedDrugs.includes(drug.id)} onPrep={handlePrep} />
              ))}
            </Collapsible>

            {/* 6H 6T */}
            <Collapsible title="Causas reversíveis (6H e 6T)" badge="H/T" badgeColor="#FFC107">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-bg-hover rounded-xl p-4">
                  <div className="text-[0.75rem] font-extrabold uppercase text-danger mb-3">6 H</div>
                  <ul className="list-none">
                    {CAUSES_6H.map((cause, i) => (
                      <li key={i} className="text-[0.85rem] py-2 border-b border-border-card flex items-center gap-2 text-text-primary">
                        <span className="font-mono font-bold text-text-muted">H</span> {cause}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-bg-hover rounded-xl p-4">
                  <div className="text-[0.75rem] font-extrabold uppercase text-purple-400 mb-3">6 T</div>
                  <ul className="list-none">
                    {CAUSES_6T.map((cause, i) => (
                      <li key={i} className="text-[0.85rem] py-2 border-b border-border-card flex items-center gap-2 text-text-primary">
                        <span className="font-mono font-bold text-text-muted">T</span> {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Collapsible>

            {/* Equipamentos */}
            <Collapsible title="Via aérea e equipamentos" badge="VA" badgeColor="#2196F3">
              {equipment ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Tubo Traqueal', value: equipment.tubo, unit: 'mm (com cuff)' },
                    { label: 'Fixação', value: equipment.fixacao, unit: 'cm (gengiva)' },
                    { label: 'Lâmina', value: equipment.lâmina },
                    { label: 'Máscara Laríngea', value: equipment.lma },
                    { label: 'Sonda Aspiração', value: equipment.sondaAsp, unit: 'French' },
                    { label: 'Bougie', value: equipment.bougie, unit: 'French' },
                  ].map(item => (
                    <div key={item.label} className="bg-bg-hover rounded-xl p-4 text-center border-2 border-border-card">
                      <div className="text-[0.75rem] font-bold uppercase text-text-muted mb-2">{item.label}</div>
                      <div className="font-mono text-2xl font-bold text-text-primary">{item.value}</div>
                      {item.unit && <div className="text-[0.75rem] text-text-muted mt-1">{item.unit}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[0.8rem] text-warning py-4">Informe o peso para ver equipamentos</div>
              )}
            </Collapsible>
          </div>
        )}

        {/* CENARIOS VIEW */}
        {view === 'cenarios' && (
          <div className="pt-5">
            <button onClick={() => showView('home')} className="bg-transparent border border-border-card text-text-muted px-4 py-2 rounded-lg text-sm cursor-pointer mb-4 active:bg-bg-hover min-h-[44px]">
              ← Voltar
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-4">Cenários</h2>

            {Object.entries(SCENARIO_CONFIGS).map(([key, s]) => (
              <div
                key={key}
                onClick={() => loadScenario(key)}
                className="bg-bg-hover border border-border-card rounded-xl p-4 mb-2.5 cursor-pointer active:border-accent transition-colors border-l-4"
                style={{ borderLeftColor: s.color }}
              >
                <div className="text-base font-semibold text-text-primary">{s.title}</div>
                <div className="text-xs text-text-muted mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* TELA DE UM CENARIO — so o que aquele cenario pede */}
        {view === 'cenario' && scenarioKey && SCENARIO_CONFIGS[scenarioKey] && (() => {
          const cfg = SCENARIO_CONFIGS[scenarioKey]
          const drogas = cfg.highlight.map(findDrug).filter((d): d is BolusDrug => !!d)
          const infusoes = cfg.infusionHighlight
            .map(id => INFUSION_DATA[id])
            .filter((i): i is InfusionDrug => !!i)
          return (
            <div className="pt-5 animate-[slide-left_0.3s_ease]">
              <button
                onClick={() => showView('cenarios')}
                className="bg-transparent border border-border-card text-text-muted px-4 py-2 rounded-lg text-sm cursor-pointer mb-4 active:bg-bg-hover min-h-[44px]"
              >
                ← Voltar aos cenários
              </button>
              <h2 className="text-xl font-bold mb-1" style={{ color: cfg.color }}>{cfg.title}</h2>
              <p className="text-xs text-text-muted mb-5">{cfg.desc}</p>

              {cfg.checklist && (
                <div className="mb-5">
                  <div className="text-[0.75rem] font-bold uppercase text-text-muted mb-2">Checklist de intubação</div>
                  {renderChecklist()}
                </div>
              )}

              {cfg.fluids && (
                <div className="mb-5">
                  <div className="text-[0.75rem] font-bold uppercase text-text-muted mb-2">Fluidos e volumes</div>
                  {renderFluids()}
                </div>
              )}

              {drogas.length > 0 && (
                <div className="mb-5">
                  <div className="text-[0.75rem] font-bold uppercase text-text-muted mb-2">Medicações</div>
                  {drogas.map(drug => (
                    <DrugCard key={drug.id} drug={drug} peso={p} ageY={idadeEfetiva} highlighted onPrep={handlePrep} />
                  ))}
                </div>
              )}

              {infusoes.length > 0 && (
                <div className="mb-5">
                  <div className="text-[0.75rem] font-bold uppercase text-text-muted mb-2">Infusões contínuas</div>
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl text-[0.85rem] text-center mb-3 font-medium">
                    Faixa: <strong>{getWeightCategoryLabel(weightCat)}</strong>
                  </div>
                  {infusoes.map(inf => (
                    <InfusionCard key={inf.id} inf={inf} peso={p} highlighted />
                  ))}
                </div>
              )}

              <button
                onClick={verTodasCalculadoras}
                className="w-full bg-transparent border border-border-card text-text-muted px-4 py-3 rounded-lg text-sm cursor-pointer min-h-[44px] active:bg-bg-hover"
              >
                Ver todas as calculadoras
              </button>
            </div>
          )
        })()}

        {/* CALCULADORAS VIEW */}
        {view === 'calculadoras' && (
          <div className="pt-5">
            <button onClick={handleBackFromCalc} className="bg-transparent border border-border-card text-text-muted px-4 py-2 rounded-lg text-sm cursor-pointer mb-4 active:bg-bg-hover min-h-[44px]">
              ← {scenarioKey ? `Voltar a ${SCENARIO_CONFIGS[scenarioKey]?.title ?? 'cenário'}` : 'Voltar'}
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-4">Calculadoras</h2>

            {/* IOT Checklist */}
            <Collapsible title="Checklist de intubação orotraqueal" badge="IOT" badgeColor="#4CAF50" defaultOpen={isSectionOpen('iot')}>
              {renderChecklist()}
            </Collapsible>

            {/* IOT Drugs */}
            <Collapsible title="Drogas de intubação (ISR)" badge="ISR" badgeColor="#8B5CF6" defaultOpen={isSectionOpen('drogas-iot')}>
              {IOT_DRUGS.map(drug => (
                <DrugCard key={drug.id} drug={drug} peso={p} ageY={idadeEfetiva} highlighted={highlightedDrugs.includes(drug.id)} onPrep={handlePrep} />
              ))}
            </Collapsible>

            {/* Emergency Drugs */}
            <Collapsible title="Outras drogas de emergência" badge="SOS" badgeColor="#F44336" defaultOpen={isSectionOpen('emergências')}>
              {EMERGENCY_DRUGS.map(drug => (
                <DrugCard key={drug.id} drug={drug} peso={p} ageY={idadeEfetiva} highlighted={highlightedDrugs.includes(drug.id)} onPrep={handlePrep} />
              ))}
            </Collapsible>

            {/* Convulsion Drugs */}
            <Collapsible title="Anticonvulsivantes" badge="SE" badgeColor="#FFC107" defaultOpen={isSectionOpen('convulsão')}>
              {CONVULSION_DRUGS.map(drug => (
                <DrugCard key={drug.id} drug={drug} peso={p} ageY={idadeEfetiva} highlighted={highlightedDrugs.includes(drug.id)} onPrep={handlePrep} />
              ))}
            </Collapsible>

            {/* Neuro Drugs */}
            <Collapsible title="Neuroproteção e Osmoterapia" badge="HIC" badgeColor="#2196F3" defaultOpen={isSectionOpen('neuro')}>
              {NEURO_DRUGS.map(drug => (
                <DrugCard key={drug.id} drug={drug} peso={p} ageY={idadeEfetiva} highlighted={highlightedDrugs.includes(drug.id)} onPrep={handlePrep} />
              ))}
            </Collapsible>

            <Collapsible title="Dor e sedação para procedimentos" badge="DOR" badgeColor="#C15C82">
              {PAIN_DRUGS.map(drug => (
                <DrugCard key={drug.id} drug={drug} peso={p} ageY={idadeEfetiva} highlighted={highlightedDrugs.includes(drug.id)} onPrep={handlePrep} />
              ))}
            </Collapsible>

            <Collapsible title="Crise asmática e broncoespasmo" badge="RESP" badgeColor="#2196F3">
              {RESP_DRUGS.map(drug => (
                <DrugCard key={drug.id} drug={drug} peso={p} ageY={idadeEfetiva} highlighted={highlightedDrugs.includes(drug.id)} onPrep={handlePrep} />
              ))}
            </Collapsible>

            <Collapsible title="Toxicologia e antídotos" badge="TOX" badgeColor="#4CAF50">
              {TOX_DRUGS.map(drug => (
                <DrugCard key={drug.id} drug={drug} peso={p} ageY={idadeEfetiva} highlighted={highlightedDrugs.includes(drug.id)} onPrep={handlePrep} />
              ))}
            </Collapsible>

            <Collapsible title="Anti-histamínicos por idade" badge="IDADE" badgeColor="#8B5CF6">
              {AGE_DRUGS.map(drug => (
                <DrugCard key={drug.id} drug={drug} peso={p} ageY={idadeEfetiva} highlighted={highlightedDrugs.includes(drug.id)} onPrep={handlePrep} />
              ))}
            </Collapsible>

            <Collapsible title="Sinais vitais por idade" badge="SV" badgeColor="#2196F3">
              <div className="flex items-center gap-3 mb-3">
                <label htmlFor="ped-idade" className="text-[0.8rem] text-text-muted">Idade (anos)</label>
                <input
                  id="ped-idade"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={18}
                  step={0.5}
                  value={idadeRaw}
                  onChange={e => setIdadeRaw(e.target.value)}
                  placeholder="--"
                  aria-invalid={idadeIn.invalido}
                  className={`w-[110px] bg-bg-elevated border-2 rounded-lg text-base px-3 py-2.5 min-h-[44px] outline-none ${idadeIn.invalido ? 'border-danger text-danger' : 'border-border-card text-text-primary focus:border-accent'}`}
                />
                {idadeIn.invalido && <span className="text-[0.75rem] font-bold text-danger">0 a 18 anos</span>}
                {!idadeIn.invalido && idadeRaw === '' && idadeEfetiva !== null && (
                  <span className="text-[0.7rem] text-text-muted">estimada pela cor Broselow</span>
                )}
              </div>
              <div className={`rounded-lg border-l-4 p-3 mb-3 text-[0.85rem] ${idadeEfetiva !== null ? 'border-accent bg-bg-elevated text-text-primary' : 'border-border-card bg-bg-elevated text-text-muted'}`}>
                {idadeEfetiva !== null
                  ? <>PAS mínima estimada: <strong className="font-mono">{pasMinima(idadeEfetiva)} mmHg</strong></>
                  : 'Informe a idade para estimar a PAS mínima'}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[0.8rem]">
                  <thead>
                    <tr>
                      <th className="border border-border-card bg-bg-elevated text-text-muted font-semibold p-2 text-left">Parâmetro</th>
                      {VITAL_COLS.map(c => (
                        <th key={c} className="border border-border-card bg-bg-elevated text-text-muted font-semibold p-2">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {VITAL_ROWS.map(r => (
                      <tr key={r.label}>
                        <td className="border border-border-card p-2 text-text-muted">{r.label}</td>
                        {r.values.map((v, i) => (
                          <td key={i} className="border border-border-card p-2 text-center font-mono text-text-primary">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[0.75rem] text-text-muted mt-2">PAS mínima = 70 + (2 x idade). A partir de 10 anos, considera-se 90 mmHg como piso.</p>
            </Collapsible>

            <Collapsible title="Cor Broselow pelo comprimento" badge="CM" badgeColor="#2196F3">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <label htmlFor="ped-altura" className="text-[0.8rem] text-text-muted">Comprimento (cm)</label>
                <input
                  id="ped-altura"
                  type="number"
                  inputMode="decimal"
                  min={BROSELOW_DATA[0].min}
                  max={BROSELOW_DATA[BROSELOW_DATA.length - 1].max}
                  step={1}
                  placeholder="--"
                  value={alturaRaw}
                  onChange={handleAlturaChange}
                  aria-invalid={alturaIn.invalido}
                  className={`w-[110px] bg-bg-elevated border-2 rounded-lg text-base px-3 py-2.5 min-h-[44px] outline-none ${alturaIn.invalido ? 'border-danger text-danger' : 'border-border-card text-text-primary focus:border-accent'}`}
                />
                {alturaIn.invalido && (
                  <span className="text-[0.75rem] font-bold text-danger">
                    {BROSELOW_DATA[0].min} a {BROSELOW_DATA[BROSELOW_DATA.length - 1].max} cm
                  </span>
                )}
                {!alturaIn.invalido && alturaIn.valor !== null && selectedBroselow && (
                  <span className="flex items-center gap-1.5 text-[0.8rem] text-text-primary">
                    <span className={`w-4 h-4 rounded ${selectedBroselow.dotClass}`} />
                    {selectedBroselow.name} ({selectedBroselow.peso} kg)
                  </span>
                )}
              </div>
              <p className="text-[0.75rem] text-text-muted">
                O comprimento seleciona a cor Broselow, e o peso vem da cor — o mesmo que
                a fita faz. Acima de {BROSELOW_DATA[BROSELOW_DATA.length - 1].max} cm a fita
                não alcança: pese a criança. Sempre que houver balança, prefira o peso aferido.
              </p>
            </Collapsible>

            {/* Transfusion */}
            <Collapsible title="Transfusão e Hemocomponentes" badge="TX" badgeColor="#F44336">
              {transfusion ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Concentrado de Hemácias', dose: '10-15 mL/kg', value: transfusion.chad, blood: true },
                      { name: 'Plasma Fresco', dose: '10-15 mL/kg', value: transfusion.pfc, blood: false },
                      { name: 'Plaquetas', dose: '5-10 mL/kg', value: transfusion.plaq, blood: false },
                      { name: 'Crioprecipitado', dose: '5-10 mL/kg', value: transfusion.crio, blood: false },
                    ].map(item => (
                      <div key={item.name} className={`rounded-xl p-4 border-2 ${item.blood ? 'border-accent bg-accent/10' : 'border-border-card bg-bg-hover'}`}>
                        <div className="font-bold text-[0.85rem] text-text-primary mb-1">{item.name}</div>
                        <div className="text-[0.75rem] text-text-muted mb-3">{item.dose}</div>
                        <div className="font-mono text-2xl font-bold text-accent">{item.value} mL</div>
                      </div>
                    ))}
                  </div>
                  <AlertCard type="warning" title="Protocolo de Transfusão Maciça Pediátrica" className="mt-4">
                    <div className="text-[0.8rem]">
                      Quando ativar: perda {'>'} 40 mL/kg ou {'>'} 50% volemia<br />
                      <strong className="text-text-primary">Proporção alvo:</strong> CH:PFC:Plaq = 1:1:1<br />
                      Volemia estimada (80 mL/kg): <strong className="text-text-primary">{transfusion.volemia} mL</strong>
                    </div>
                  </AlertCard>
                </>
              ) : (
                <div className="text-center text-[0.8rem] text-warning py-4">Informe o peso para calcular</div>
              )}
            </Collapsible>

            {/* Fluids */}
            <Collapsible title="Fluidos e Volumes" badge="IV" badgeColor="#4CAF50" defaultOpen={isSectionOpen('fluidos')}>
              {renderFluids()}
            </Collapsible>

            {/* Infusions */}
            <Collapsible title="Infusões contínuas" badge={getWeightCategoryLabel(weightCat)} badgeColor="#8B5CF6" defaultOpen={isSectionOpen('infusoes')}>
              <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl text-[0.85rem] text-center mb-4 font-medium">
                Faixa: <strong>{getWeightCategoryLabel(weightCat)}</strong>
              </div>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  value={infusionSearch}
                  onChange={e => setInfusionSearch(e.target.value)}
                  placeholder="Buscar medicamento..."
                  className="w-full px-4 py-3 bg-bg-hover border-2 border-border-card rounded-xl text-[0.9rem] text-text-primary outline-none focus:border-blue-500 placeholder:text-text-muted"
                />
              </div>

              {/* Vasoativos */}
              {infusionsByCategory.vasoativos.length > 0 && (
                <div className="mb-5">
                  <div className="font-bold text-[0.9rem] text-text-muted mb-3 pb-2 border-b-2 border-border-card">Vasoativos</div>
                  {infusionsByCategory.vasoativos.map(inf => (
                    <InfusionCard key={inf.id} inf={inf} peso={p} highlighted={highlightedInfusions.includes(inf.id)} />
                  ))}
                </div>
              )}

              {/* Sedativos */}
              {infusionsByCategory.sedativos.length > 0 && (
                <div className="mb-5">
                  <div className="font-bold text-[0.9rem] text-text-muted mb-3 pb-2 border-b-2 border-border-card">Sedativos e Analgesia</div>
                  {infusionsByCategory.sedativos.map(inf => (
                    <InfusionCard key={inf.id} inf={inf} peso={p} highlighted={highlightedInfusions.includes(inf.id)} />
                  ))}
                </div>
              )}

              {/* Outros */}
              {infusionsByCategory.outros.length > 0 && (
                <div className="mb-5">
                  <div className="font-bold text-[0.9rem] text-text-muted mb-3 pb-2 border-b-2 border-border-card">Outros</div>
                  {infusionsByCategory.outros.map(inf => (
                    <InfusionCard key={inf.id} inf={inf} peso={p} highlighted={highlightedInfusions.includes(inf.id)} />
                  ))}
                </div>
              )}
            </Collapsible>
          </div>
        )}
      </Container>

      {/* Preparation Modal */}
      <Modal
        open={!!prepModal}
        onClose={() => setPrepModal(null)}
        title={prepModal ? `Preparação: ${PREPARATIONS[prepModal]?.title ?? ''}` : ''}
      >
        {prepModal && PREPARATIONS[prepModal] && (
          <div>
            {PREPARATIONS[prepModal].steps.map((step, i) => (
              <div key={i} className="flex gap-3 mb-4 pb-4 border-b border-border-card last:border-b-0">
                <div className="w-7 h-7 bg-accent text-white rounded-full flex items-center justify-center text-[0.8rem] font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="text-[0.9rem] leading-relaxed text-text-primary">{step}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Footer toolName="Ped Guide" version="v4.0.0" updatedAt="Agosto 2026" />
      <FABMenu items={fabItems} />
      <ToastContainer />
    </div>
  )
}
