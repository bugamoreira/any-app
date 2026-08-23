import type { Gravidade, Consciencia } from '../data/ketoData'

/**
 * Calculos do KetoPath. Funcoes puras, sem estado — todas conferidas contra os
 * casos de teste da spec v1.0.0.
 */

/** AG = Na − (Cl + HCO₃). Inteiro. AG >12 sugere acidose com AG elevado. [ADA] */
export function anionGap(na: number, cl: number, hco3: number): number {
  return Math.round(na - (cl + hco3))
}

/**
 * Na corrigido = Na medido + 2,0 × [(glicemia − 100) / 100]. Uma casa decimal.
 * Fator 2,0 de [UTD] — o ADA usa 1,6. A spec adota 2,0 por coerencia com o
 * corte de 135 mEq/L da decisao de tonicidade, que vem da mesma fonte.
 * Abaixo de 100 mg/dL de glicemia, devolve o sodio medido.
 */
export function sodioCorrigido(na: number, glicemia: number): number {
  if (glicemia <= 100) return Math.round(na * 10) / 10
  return Math.round((na + 2.0 * ((glicemia - 100) / 100)) * 10) / 10
}

/** Osm efetiva = (2 × Na) + (glicemia / 18). Usa o sodio MEDIDO, nao o corrigido. */
export function osmolaridadeEfetiva(na: number, glicemia: number): number {
  return Math.round(2 * na + glicemia / 18)
}

/** Agua corporal total. Fator por sexo, reduzido no idoso. */
export function aguaCorporalTotal(peso: number, sexo: 'M' | 'F', idoso: boolean): number {
  const fator = sexo === 'M' ? (idoso ? 0.5 : 0.6) : (idoso ? 0.45 : 0.5)
  return peso * fator
}

/** Deficit = ACT × [(Na corrigido / 140) − 1]. Uma casa decimal. So EHH/misto. */
export function deficitAguaLivre(peso: number, sexo: 'M' | 'F', idoso: boolean, naCorr: number): number {
  const act = aguaCorporalTotal(peso, sexo, idoso)
  return Math.round(act * (naCorr / 140 - 1) * 10) / 10
}

/** Perdas no EHH: 100 a 220 mL/kg. [JBDS] Devolve litros. */
export function deficitVolumeEHH(peso: number): { min: number; max: number } {
  return {
    min: Math.round((peso * 100) / 100) / 10,
    max: Math.round((peso * 220) / 100) / 10,
  }
}

// ── Gravidade da CAD ─────────────────────────────────────────────────────────

const ORDEM: Record<Exclude<Gravidade, null>, number> = { leve: 1, moderada: 2, grave: 3 }

function grauPh(ph: number): Gravidade {
  if (ph < 7.0) return 'grave'
  if (ph <= 7.25) return 'moderada'
  if (ph < 7.3) return 'leve'
  return null // fora da faixa de acidose da CAD
}

function grauBicarbonato(hco3: number): Gravidade {
  if (hco3 < 10) return 'grave'
  if (hco3 < 15) return 'moderada'
  if (hco3 <= 18) return 'leve'
  return null
}

function grauConsciencia(c: Consciencia): Gravidade {
  if (c === 'estupor-coma') return 'grave'
  if (c === 'sonolento') return 'moderada'
  return 'leve'
}

/**
 * Gravidade da CAD — decisao do Gustavo: O EIXO MAIS GRAVE MANDA.
 *
 * Detalhe que a spec nao resolve e vale registrar: o nivel de consciencia
 * sozinho sempre devolveria ao menos 'leve', o que classificaria como CAD leve
 * um paciente alerta e sem acidose nenhuma. Por isso a consciencia so ESCALA a
 * gravidade — se pH e bicarbonato estiverem os dois fora da faixa de acidose,
 * nao ha classificacao. A CAD exige acidose por definicao (criterio A).
 */
export function gravidadeCAD(
  ph: number | null,
  hco3: number | null,
  consciencia: Consciencia | null
): Gravidade {
  const eixoPh = ph !== null ? grauPh(ph) : null
  const eixoHco3 = hco3 !== null ? grauBicarbonato(hco3) : null
  if (eixoPh === null && eixoHco3 === null) return null

  const eixoConsc = consciencia !== null ? grauConsciencia(consciencia) : null
  const graus = [eixoPh, eixoHco3, eixoConsc].filter((g): g is Exclude<Gravidade, null> => g !== null)
  if (graus.length === 0) return null
  return graus.reduce((pior, g) => (ORDEM[g] > ORDEM[pior] ? g : pior))
}

// ── Preparo de KCl ───────────────────────────────────────────────────────────

export interface PreparoKcl {
  /** Volume de KCl a aspirar, em mL. */
  volumeKcl: number
  /** Volume MINIMO total para respeitar o limite de concentracao da via. */
  volumeMinimo: number
  /** Velocidade resultante para entregar a dose no tempo previsto. */
  velocidadeMlH: number
  /** True quando a concentracao escolhida excede o limite da via. */
  excedeLimite: boolean
  concentracaoResultante: number
}

/**
 * @param mEq            dose desejada
 * @param mEqPorAmpola   13,4 (KCl 10%) ou 25,6 (KCl 19,1%)
 * @param mlPorAmpola    10 nas duas apresentacoes
 * @param maxMEqPorLitro 50 (periferica) ou 100 (central)
 * @param mEqPorHora     velocidade de reposicao
 * @param volumeTotal    volume final escolhido; se omitido, usa o minimo
 */
export function preparoKcl(
  mEq: number,
  mEqPorAmpola: number,
  mlPorAmpola: number,
  maxMEqPorLitro: number,
  mEqPorHora: number,
  volumeTotal?: number
): PreparoKcl {
  const volumeKcl = Math.round((mEq / mEqPorAmpola) * mlPorAmpola * 10) / 10
  const volumeMinimo = Math.round((mEq / maxMEqPorLitro) * 1000)
  const vol = volumeTotal && volumeTotal > 0 ? volumeTotal : volumeMinimo
  const horas = mEqPorHora > 0 ? mEq / mEqPorHora : 0
  const concentracaoResultante = vol > 0 ? Math.round((mEq / vol) * 1000) : 0
  return {
    volumeKcl,
    volumeMinimo,
    velocidadeMlH: horas > 0 ? Math.round((vol / horas) * 10) / 10 : 0,
    excedeLimite: concentracaoResultante > maxMEqPorLitro,
    concentracaoResultante,
  }
}

// ── Insulina ─────────────────────────────────────────────────────────────────

/** Diluicao 1 U/mL: U/h e mL/h sao numericamente identicos. */
export function insulinaVelocidade(peso: number, taxa: number): number {
  return Math.round(peso * taxa * 10) / 10
}

// ── Transicao para insulina subcutanea ───────────────────────────────────────

export interface Transicao {
  ddtMin: number
  ddtMax: number
  basalMin: number
  basalMax: number
}

export function transicaoInsulina(peso: number, riscoHipoglicemia: boolean): Transicao {
  const r = (n: number) => Math.round(n * 10) / 10
  return {
    ddtMin: riscoHipoglicemia ? r(peso * 0.3) : r(peso * 0.5),
    ddtMax: riscoHipoglicemia ? r(peso * 0.3) : r(peso * 0.6),
    basalMin: r(peso * 0.15),
    basalMax: r(peso * 0.3),
  }
}

// ── Ciclo de reavaliacao ─────────────────────────────────────────────────────

/**
 * Uma rodada de reavaliacao. O ciclo guarda a ANTERIOR para calcular a queda
 * por hora — variavel central da titulacao da insulina. Memoria de sessao
 * apenas; a spec proibe historico entre sessoes.
 */
export interface Rodada {
  glicemia: number | null
  potassio: number | null
  sodio: number | null
  /** Necessario para o anion-gap e, por consequencia, para o delta/delta. */
  cloro: number | null
  phVenoso: number | null
  bicarbonato: number | null
  /** Momento em que a rodada foi fechada, para o intervalo real. */
  em: number
}

export type LeituraQueda = 'insuficiente' | 'adequada' | 'rapida'

export interface Queda {
  /** mg/dL por hora. Positivo = caindo. So confiavel se `extrapolavel`. */
  porHora: number
  /** Variacao absoluta entre as duas rodadas, sem normalizar. */
  absoluta: number
  horas: number
  leitura: LeituraQueda
  /**
   * False quando o intervalo e curto demais para extrapolar por hora. Dividir
   * 80 mg/dL por 1 minuto daria 4800 mg/dL/h — matematicamente certo,
   * clinicamente absurdo, e dispara alarme falso de teto. Acontece de verdade
   * quando o medico reabre uma rodada para corrigir um valor.
   */
  extrapolavel: boolean
}

/**
 * Queda da glicemia entre duas rodadas, normalizada por hora.
 *
 * Faixas [UTD]: abaixo de 50 mg/dL/h e insuficiente e manda investigar o
 * acesso e dobrar a infusao; acima de 90 e rapida demais e esbarra no teto de
 * 90-120 mg/dL/h, que vale para CAD e EHH.
 */
const MINUTOS_MINIMOS = 15

export function quedaGlicemia(atual: number, anterior: number, minutos: number): Queda | null {
  if (minutos <= 0) return null
  const horas = minutos / 60
  const absoluta = anterior - atual
  const porHora = absoluta / horas
  const extrapolavel = minutos >= MINUTOS_MINIMOS
  const leitura: LeituraQueda = !extrapolavel ? 'adequada'
    : porHora < 50 ? 'insuficiente' : porHora > 90 ? 'rapida' : 'adequada'
  return { porHora: Math.round(porHora), absoluta: Math.round(absoluta), horas, leitura, extrapolavel }
}

/** Resolucao da CAD, adaptada ao servico que nao dispoe de BHB. */
export function resolvidoCAD(ph: number | null, hco3: number | null, glicemia: number | null) {
  const obrigatorio = (ph !== null && ph >= 7.3) || (hco3 !== null && hco3 >= 18)
  const desejavel = glicemia !== null && glicemia < 200
  return { obrigatorio, desejavel, resolvido: obrigatorio }
}


// ── Delta/delta ──────────────────────────────────────────────────────────────

export type LeituraDelta = 'hiperclorêmica' | 'ag-puro' | 'alcalose'

export interface DeltaDelta {
  deltaGap: number
  razao: number
  leitura: LeituraDelta
}

/**
 * Delta gap e razao delta/delta. Mesma formula da calculadora do app
 * (Emmett M, Narins RG. Medicine 1977) — AG normal 12, HCO3 normal 24.
 *
 * Por que isso importa no KetoPath: depois de litros de salina 0,9%, instala-se
 * acidose hiperclorêmica. O bicarbonato segue baixo mesmo com o anion-gap ja
 * normalizado, e quem le isso como "CAD persistente" mantem a bomba de insulina
 * e ATRASA a transicao para subcutanea — a armadilha que a propria spec nomeia.
 * A razao abaixo de 1 responde que o bicarbonato baixo e o soro, nao a CAD.
 */
export function deltaDelta(ag: number, hco3: number): DeltaDelta | null {
  const dAG = ag - 12
  const dHCO3 = 24 - hco3
  if (dHCO3 <= 0) return null // bicarbonato normal ou alto: nao se aplica
  const razao = Math.round((dAG / dHCO3) * 100) / 100
  return {
    deltaGap: Math.round(((ag - 12) - (24 - hco3)) * 10) / 10,
    razao,
    leitura: razao < 1 ? 'hiperclorêmica' : razao <= 2 ? 'ag-puro' : 'alcalose',
  }
}
