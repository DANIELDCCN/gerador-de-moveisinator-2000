import type { CarpentryConfig } from "../config/carpentry"
import { formatMetersFromMm, formatNumber } from "./format"
import { screwsAlong } from "./gaveteiro"
import type { BomLine, CutPart, CutSheet, DerivedDimensions, EdgeBandSummary, GaveteiroInput } from "./types"

export function edgeBandWidthMm(panelThicknessMm: number, config: CarpentryConfig): number {
  return panelThicknessMm <= 15 ? config.edgeBandWidthUpTo15Mm : config.edgeBandWidthAbove15Mm
}

export function summarizeEdgeBand(
  parts: CutPart[],
  panelThicknessMm: number,
  config: CarpentryConfig,
): EdgeBandSummary {
  const rawMm = parts.reduce((sum, part) => sum + part.edgeBandMm, 0)
  const withWasteMm = rawMm * config.edgeBandingWasteFactor
  const purchaseMeters = Math.ceil((withWasteMm / 1000) * 2) / 2
  return {
    rawMm,
    withWasteMm,
    purchaseMeters,
    widthMm: edgeBandWidthMm(panelThicknessMm, config),
  }
}

export function handlesForProject(frontWidthMm: number, drawerCount: number, config: CarpentryConfig): number {
  const perDrawer = frontWidthMm >= config.doubleHandleWidthMm ? 2 : 1
  return drawerCount * perDrawer
}

function glueMeters(input: GaveteiroInput, derived: DerivedDimensions): number {
  let mm = 4 * derived.sideDepthMm
  if (input.plinthEnabled) {
    mm += 4 * derived.plinthHeightMm
    mm += 2 * derived.innerWidthMm
  }
  mm += input.drawerCount * 4 * derived.boxHeightMm
  mm += input.drawerCount * 2 * (derived.boxInnerWidthMm + derived.boxInnerDepthMm)
  return mm / 1000
}

export function buildBom(
  input: GaveteiroInput,
  derived: DerivedDimensions,
  parts: CutPart[],
  sheets: CutSheet[],
  config: CarpentryConfig,
): { lines: BomLine[]; edgeBand: EdgeBandSummary } {
  const edgeBand = summarizeEdgeBand(parts, input.thicknessMm, config)
  const lines: BomLine[] = []

  const thicknesses = [...new Set(sheets.map((sheet) => sheet.thicknessMm))].sort((a, b) => b - a)
  for (const thickness of thicknesses) {
    const ofThickness = sheets.filter((sheet) => sheet.thicknessMm === thickness)
    lines.push({
      id: `sheet-${thickness}`,
      item: `Chapa de MDF ${formatNumber(thickness)} mm`,
      quantity: ofThickness.length,
      unit: ofThickness.length === 1 ? "chapa" : "chapas",
      quantityLabel: String(ofThickness.length),
      detail: `${formatNumber(input.sheetLengthMm)} × ${formatNumber(input.sheetWidthMm)} mm. Sem chapa reserva.`,
      includedWith: null,
    })
  }

  if (edgeBand.rawMm > 0) {
    lines.push({
      id: "edge-band",
      item: `Fita de borda ${formatNumber(edgeBand.widthMm)} mm`,
      quantity: edgeBand.purchaseMeters,
      unit: "m",
      quantityLabel: edgeBand.purchaseMeters.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
      detail: `Medido ${formatMetersFromMm(edgeBand.rawMm)}, com perda de ${formatNumber((config.edgeBandingWasteFactor - 1) * 100)}% fica ${formatMetersFromMm(edgeBand.withWasteMm)}. Compra arredondada para ${edgeBand.purchaseMeters.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m.`,
      includedWith: null,
    })
  }

  const cornerJoints = 4
  const carcassScrews =
    config.cornerFastener === "parafuso"
      ? cornerJoints * screwsAlong(derived.sideDepthMm, config.screwSpacingMm, config.minScrewsPerJoint)
      : 0
  const plinthScrews = input.plinthEnabled
    ? 4 * config.plinthScrewsPerCorner +
      2 * screwsAlong(derived.innerWidthMm, config.screwSpacingMm, config.minScrewsPerJoint)
    : 0
  const structuralScrews = carcassScrews + plinthScrews
  if (structuralScrews > 0) {
    lines.push({
      id: "carcass-screws",
      item: `Parafuso ${config.carcassScrewLabel}`,
      quantity: structuralScrews,
      unit: "un",
      quantityLabel: String(structuralScrews),
      detail:
        config.cornerFastener === "parafuso"
          ? "Cantos da caixa (tampo e base nas laterais) e quadro do roda-pé, com cola."
          : "Quadro do roda-pé. Os cantos da caixa usam minifix.",
      includedWith: null,
    })
  }

  if (config.cornerFastener === "minifix") {
    const sets = cornerJoints * config.minifixPerCorner
    lines.push({
      id: "minifix",
      item: "Minifix",
      quantity: sets,
      unit: "conjuntos",
      quantityLabel: String(sets),
      detail: `${config.minifixPerCorner} por canto, em 4 cantos da caixa.`,
      includedWith: null,
    })
    const dowels = cornerJoints * config.dowelsPerCorner
    lines.push({
      id: "dowels",
      item: "Cavilha",
      quantity: dowels,
      unit: "un",
      quantityLabel: String(dowels),
      detail: `${config.dowelsPerCorner} por canto da caixa, junto com o minifix.`,
      includedWith: null,
    })
  }

  const backPerimeter = 2 * (derived.backWidthMm + derived.backHeightMm)
  const backScrews = Math.max(config.minBackScrews, Math.ceil(backPerimeter / config.backScrewSpacingMm))
  lines.push({
    id: "back-screws",
    item: `Parafuso ${config.backScrewLabel}`,
    quantity: backScrews,
    unit: "un",
    quantityLabel: String(backScrews),
    detail: "Painel traseiro pregado por trás, no perímetro.",
    includedWith: null,
  })

  const drawerScrews =
    input.drawerCount *
    (4 * config.screwsPerDrawerCorner + config.screwsPerDrawerBottom + config.screwsPerDrawerFront)
  lines.push({
    id: "drawer-screws",
    item: `Parafuso ${config.drawerScrewLabel}`,
    quantity: drawerScrews,
    unit: "un",
    quantityLabel: String(drawerScrews),
    detail: "Cantos da gaveta, fundo e fixação da frente por dentro.",
    includedWith: null,
  })

  const slideType = config.slideTypes.find((type) => type.id === input.slideTypeId)
  lines.push({
    id: "slides",
    item: `Corrediça ${slideType?.label ?? "telescópica"}, ${formatNumber(derived.slideLengthMm)} mm`,
    quantity: input.drawerCount,
    unit: input.drawerCount === 1 ? "par" : "pares",
    quantityLabel: String(input.drawerCount),
    detail: "Um par por gaveta.",
    includedWith: null,
  })

  const slideScrews = input.drawerCount * 2 * config.screwsPerSlide
  lines.push({
    id: "slide-screws",
    item: "Parafuso de corrediça",
    quantity: slideScrews,
    unit: "un",
    quantityLabel: String(slideScrews),
    detail: "Use os que vierem no par. Esta linha é só conferência.",
    includedWith: "par de corrediças",
  })

  const handles = handlesForProject(derived.frontWidthMm, input.drawerCount, config)
  const perDrawer = input.drawerCount > 0 ? handles / input.drawerCount : 0
  lines.push({
    id: "handles",
    item: "Puxador",
    quantity: handles,
    unit: handles === 1 ? "un" : "un",
    quantityLabel: String(handles),
    detail:
      perDrawer > 1
        ? "Dois por gaveta, porque a frente passou do limite de largura."
        : "Um por gaveta, no centro da frente.",
    includedWith: null,
  })

  lines.push({
    id: "handle-screws",
    item: `Parafuso de puxador ${config.handleScrewLabel}`,
    quantity: handles * config.screwsPerHandle,
    unit: "un",
    quantityLabel: String(handles * config.screwsPerHandle),
    detail: "Conferir com o puxador. Muitos já trazem o parafuso.",
    includedWith: "puxador",
  })

  lines.push({
    id: "washers",
    item: "Arruela de puxador",
    quantity: handles * config.washersPerHandle,
    unit: "un",
    quantityLabel: String(handles * config.washersPerHandle),
    detail: "Uma arruela por parafuso de puxador, do lado de dentro da frente.",
    includedWith: null,
  })

  const meters = glueMeters(input, derived)
  const grams = meters * config.glueGramsPerMeter
  const bottles = Math.max(1, Math.ceil(grams / config.glueBottleGrams))
  lines.push({
    id: "glue",
    item: `Cola PVA branca, frasco de ${formatNumber(config.glueBottleGrams)} g`,
    quantity: bottles,
    unit: bottles === 1 ? "frasco" : "frascos",
    quantityLabel: String(bottles),
    detail: `Estimativa de ${formatNumber(grams)} g em ${formatNumber(meters)} m de junta. Não é dosagem de bancada.`,
    includedWith: null,
  })

  return { lines, edgeBand }
}
