/**
 * DEBITO-10: Feature flags.
 * Use para desabilitar uma ferramenta sem redeploy de config — no futuro,
 * fetchar de /config.json no boot para ativacao remota.
 */

export const FEATURES = {
  // Ferramentas do Hub — false esconde do grid
  infusion: true,
  airway: true,
  vm: true,
  tep: true,
  seda: true,
  tox: true,
  ped: true,
  palia: true,
  block: true,
  acls: true,
  dengue: true,
  shock: true,
  calculadoras: true,
  keto: true,
  // Features cross-tool
  metronome: true,
  persistentSessions: false, // ALTA-04 — habilitar quando hook usePersistentReducer existir
  unitContext: true,
  pwa: false, // DEBITO-09 — habilitar quando service worker estiver configurado
} as const

export type FeatureKey = keyof typeof FEATURES

export function isEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature] === true
}
