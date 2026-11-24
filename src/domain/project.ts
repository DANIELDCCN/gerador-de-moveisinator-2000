import type { CarpentryConfig } from "../config/carpentry"
import { CARPENTRY } from "../config/carpentry"
import { buildSteps } from "./assembly"
import { buildBom } from "./bom"
import { formatMm, formatNumber } from "./format"
import { buildParts, computeDerived, groupParts, validateInput } from "./gaveteiro"
import { findPackingProblems, packParts } from "./packing"
import type { FurnitureProject, GaveteiroInput, GenerateResult } from "./types"

function unsupported(config: CarpentryConfig): string | null {
  if (config.frontStyle !== "embutida") {
    return "Este MVP só calcula frente embutida. O tipo de frente está em src/config/carpentry.ts."
  }
  if (!config.drawerBottomUsesBackThickness) {
    return "Este MVP corta o fundo da gaveta na mesma chapa do painel traseiro. O ajuste está em src/config/carpentry.ts."
  }
  if (!config.drawerSideLengthEqualsSlide) {
    return "Este MVP corta a lateral da gaveta no comprimento da corrediça. O ajuste está em src/config/carpentry.ts."
  }
  if (!config.insetFrontConsumesDepth) {
    return "Este MVP desconta a espessura da frente da profundidade útil. O ajuste está em src/config/carpentry.ts."
  }
  return null
}

export function generateProject(
  input: GaveteiroInput,
  config: CarpentryConfig = CARPENTRY,
): GenerateResult {
  const blocked = unsupported(config)
  if (blocked) return { ok: false, errors: [{ field: "projectName", message: blocked }] }

  const errors = validateInput(input, config)
  if (errors.length > 0) return { ok: false, errors }

  const derived = computeDerived(input, config)
  const parts = buildParts(input, derived, config)
  const packed = packParts(
    parts.map((part) => ({
      id: part.id,
      name: part.name,
      aMm: part.aMm,
      bMm: part.bMm,
      thicknessMm: part.thicknessMm,
      material: part.material,
    })),
    {
      sheetLengthMm: input.sheetLengthMm,
      sheetWidthMm: input.sheetWidthMm,
      kerfMm: input.kerfMm,
      marginMm: input.sheetMarginMm,
    },
  )

  if (packed.unplaced.length > 0) {
    return {
      ok: false,
      errors: packed.unplaced.map((part) => ({
        field: "sheetLengthMm",
        message: `${part.name} (${part.id}) não coube na chapa de ${formatNumber(input.sheetLengthMm)} × ${formatNumber(input.sheetWidthMm)} mm.`,
      })),
    }
  }

  const problems = findPackingProblems(packed.sheets)
  if (problems.length > 0) {
    return {
      ok: false,
      errors: [
        {
          field: "sheetLengthMm",
          message: `Falha interna no plano de corte: ${problems[0]}`,
        },
      ],
    }
  }

  const placedIds = new Set(packed.sheets.flatMap((sheet) => sheet.placements.map((item) => item.id)))
  if (placedIds.size !== parts.length) {
    return {
      ok: false,
      errors: [{ field: "sheetLengthMm", message: "O plano de corte não posicionou todas as peças." }],
    }
  }

  const { lines, edgeBand } = buildBom(input, derived, parts, packed.sheets, config)
  const warnings = [
    "Antes de cortar, confirme com um marceneiro os valores marcados com [CONFIRMAR]. Eles estão em src/config/carpentry.ts e também na lista no fim do formulário. A conta usa esses números como estão.",
  ]
  if (derived.rearClearanceMm > config.drawerRearGapMm + 20) {
    const next = derived.nextSlideLengthMm
      ? ` A próxima corrediça da lista tem ${formatMm(derived.nextSlideLengthMm)} e não cabe neste vão.`
      : ""
    warnings.push(
      `Atrás da gaveta sobram ${formatMm(derived.rearClearanceMm)}.${next}`,
    )
  }
  if (
    input.slideLengthMm != null &&
    !config.standardSlideLengthsMm.some((length) => Math.abs(length - input.slideLengthMm!) < 0.01)
  ) {
    warnings.push(
      "Esse comprimento de corrediça não está na lista comercial do arquivo de referência. Confira se a peça existe para comprar.",
    )
  }

  const slideLabel = config.slideTypes.find((type) => type.id === input.slideTypeId)?.label ?? "Corrediça"
  const projectName = input.projectName.trim() || "Gaveteiro"

  const project: FurnitureProject = {
    input,
    projectName,
    slideLabel,
    construction: config.constructionSummary,
    derived,
    parts,
    groups: groupParts(parts),
    sheets: packed.sheets,
    edgeBand,
    bom: lines,
    steps: buildSteps(input, derived, config),
    warnings,
    calculations: derived.calculations,
  }

  return { ok: true, project }
}
