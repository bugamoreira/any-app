/**
 * DEBITO-07: Guidelines ativos por ferramenta.
 * Footer pode consumir e exibir "Baseado em: ...".
 * Ao atualizar uma diretriz, editar esta lista centralizada.
 */

export interface Guideline {
  tool: string
  name: string
  year: number
  url?: string
  description?: string
}

export const GUIDELINES: Guideline[] = [
  { tool: 'ACLS', name: 'AHA 2025 — Guidelines for CPR and ECC', year: 2025, url: 'https://cpr.heart.org' },
  { tool: 'PALS', name: 'AHA 2025 — Pediatric Advanced Life Support', year: 2025 },
  { tool: 'ATLS', name: 'ACS 11th Edition', year: 2025, description: 'Advanced Trauma Life Support' },
  { tool: 'Dengue', name: 'Ministério da Saúde 2024 — Manejo clínico', year: 2024, url: 'https://www.gov.br/saude' },
  { tool: 'Shock', name: 'ANDROMEDA-SHOCK 2', year: 2023 },
  { tool: 'VM', name: 'Global Guidelines on ARDS 2024', year: 2024 },
  { tool: 'Tox', name: "Goldfrank's Toxicologic Emergencies, 11th ed", year: 2019 },
  { tool: 'Airway', name: "Hagberg & Benumof's Airway Management, 5th ed", year: 2022 },
  { tool: 'TEP', name: 'ESC Guidelines on PE, 2019', year: 2019 },
  { tool: 'Palia', name: 'SPICT-BR / ESMO — Cuidados Paliativos', year: 2024 },
  { tool: 'Ped', name: 'Pronto-Socorro Pediatria HC-FMUSP, 4a ed', year: 2023 },
  { tool: 'Seda', name: 'SCCM Sedation & Analgesia Guidelines', year: 2022 },
]

export function getGuidelinesForTool(tool: string): Guideline[] {
  return GUIDELINES.filter(g => g.tool.toLowerCase() === tool.toLowerCase())
}

/** Match por contencao — aceita nomes de exibicao ("Airway Guide" encontra "Airway") */
export function findGuidelinesFor(toolName: string): Guideline[] {
  const t = toolName.toLowerCase()
  return GUIDELINES.filter(g => t.includes(g.tool.toLowerCase()))
}

export function getAllGuidelineNames(): string[] {
  return GUIDELINES.map(g => `${g.name} (${g.year})`)
}
