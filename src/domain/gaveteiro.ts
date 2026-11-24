import type { CarpentryConfig } from "../config/carpentry"
import { CARPENTRY } from "../config/carpentry"
import { formatMm, formatNumber, materialName } from "./format"
import type { CutGroup, CutPart, DerivedDimensions, FieldError, GaveteiroInput } from "./types"

function between(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max
}

function chooseSlide(
  requested: number | null,
  maxSlide: number,
  config: CarpentryConfig,
): number | null {
  if (requested != null) return requested
  const fits = config.standardSlideLengthsMm.filter((length) => length <= maxSlide + 0.001)
  if (fits.length === 0) return null
  return Math.max(...fits)
}

export function computeDerived(input: GaveteiroInput, config: CarpentryConfig = CARPENTRY): DerivedDimensions {
  const plinthHeightMm = input.plinthEnabled ? input.plinthHeightMm : 0
  const sideDepthMm = input.depthMm - input.backThicknessMm
  const innerWidthMm = input.widthMm - 2 * input.thicknessMm
  const openingHeightMm = input.heightMm - plinthHeightMm - 2 * input.thicknessMm
  const openingDepthMm = sideDepthMm
  const gapCount = input.drawerCount + 1
  const frontHeightMm =
    input.drawerCount > 0 ? (openingHeightMm - gapCount * input.drawerGapMm) / input.drawerCount : 0
  const frontWidthMm = innerWidthMm - 2 * input.drawerGapMm
  const maxSlideLengthMm = config.insetFrontConsumesDepth
    ? openingDepthMm - input.thicknessMm - config.drawerRearGapMm
    : openingDepthMm - config.drawerRearGapMm
  const chosen = chooseSlide(input.slideLengthMm, maxSlideLengthMm, config)
  const slideLengthMm = chosen ?? 0
  const boxOuterWidthMm = innerWidthMm - 2 * input.slideClearancePerSideMm
  const boxInnerWidthMm = boxOuterWidthMm - 2 * input.thicknessMm
  const boxHeightMm = frontHeightMm - config.drawerBoxHeightReductionMm
  const boxDepthMm = slideLengthMm
  const boxInnerDepthMm = boxDepthMm - 2 * input.thicknessMm
  const rearClearanceMm = openingDepthMm - input.thicknessMm - boxDepthMm
  const nextSlideLengthMm =
    config.standardSlideLengthsMm
      .filter((length) => length > slideLengthMm + 0.001)
      .sort((a, b) => a - b)[0] ?? null
  const backWidthMm = input.widthMm
  const backHeightMm = input.heightMm - plinthHeightMm
  const plinthRailLengthMm = sideDepthMm - config.plinthSetbackMm - 2 * input.thicknessMm

  const openingBottom = plinthHeightMm + input.thicknessMm
  const centersFromBottom: number[] = []
  for (let index = 0; index < input.drawerCount; index += 1) {
    const frontBottom = openingBottom + input.drawerGapMm + index * (frontHeightMm + input.drawerGapMm)
    const boxBottom = frontBottom + (frontHeightMm - boxHeightMm) / 2
    centersFromBottom.push(boxBottom + boxHeightMm / 2)
  }

  const slideLabel = slideLengthMm > 0 ? formatMm(slideLengthMm) : "nenhuma"
  const calculations = [
    `Profundidade da lateral = profundidade externa − traseiro = ${formatMm(input.depthMm)} − ${formatMm(input.backThicknessMm)} = ${formatMm(sideDepthMm)}.`,
    `Largura interna = largura externa − 2 × espessura = ${formatMm(input.widthMm)} − 2 × ${formatMm(input.thicknessMm)} = ${formatMm(innerWidthMm)}.`,
    `Altura do vão = altura externa − roda-pé − 2 × espessura = ${formatMm(input.heightMm)} − ${formatMm(plinthHeightMm)} − 2 × ${formatMm(input.thicknessMm)} = ${formatMm(openingHeightMm)}.`,
    `Altura da frente = (vão − ${gapCount} folgas de ${formatMm(input.drawerGapMm)}) ÷ ${input.drawerCount} = ${formatMm(frontHeightMm)}.`,
    `Largura da frente = largura interna − 2 × folga = ${formatMm(frontWidthMm)}.`,
    `Largura externa da caixa da gaveta = largura interna − 2 × folga da corrediça = ${formatMm(innerWidthMm)} − 2 × ${formatMm(input.slideClearancePerSideMm)} = ${formatMm(boxOuterWidthMm)}.`,
    `Altura da caixa = frente − ${formatMm(config.drawerBoxHeightReductionMm)} = ${formatMm(boxHeightMm)}.`,
    `Corrediça máxima = vão em profundidade − frente − folga traseira = ${formatMm(openingDepthMm)} − ${formatMm(input.thicknessMm)} − ${formatMm(config.drawerRearGapMm)} = ${formatMm(maxSlideLengthMm)}. Escolhida: ${slideLabel}.`,
    `Painel traseiro = largura externa × (altura − roda-pé) = ${formatMm(backWidthMm)} × ${formatMm(backHeightMm)}.`,
  ]

  return {
    plinthHeightMm,
    sideDepthMm,
    innerWidthMm,
    openingHeightMm,
    openingDepthMm,
    frontWidthMm,
    frontHeightMm,
    boxOuterWidthMm,
    boxInnerWidthMm,
    boxHeightMm,
    boxDepthMm,
    boxInnerDepthMm,
    slideLengthMm,
    maxSlideLengthMm,
    rearClearanceMm,
    nextSlideLengthMm,
    backWidthMm,
    backHeightMm,
    plinthRailLengthMm,
    slideCenterFromFloorMm: centersFromBottom.reverse(),
    calculations,
  }
}

function pushRange(
  errors: FieldError[],
  field: string,
  label: string,
  value: number,
  min: number,
  max: number,
): void {
  if (!Number.isFinite(value)) {
    errors.push({ field, message: `${label} precisa ser um número.` })
    return
  }
  if (!between(value, min, max)) {
    errors.push({
      field,
      message: `${label} precisa ficar entre ${formatNumber(min)} e ${formatNumber(max)} mm. O limite está em src/config/carpentry.ts.`,
    })
  }
}

export function validateInput(input: GaveteiroInput, config: CarpentryConfig = CARPENTRY): FieldError[] {
  const errors: FieldError[] = []
  pushRange(errors, "heightMm", "A altura", input.heightMm, config.minHeightMm, config.maxHeightMm)
  pushRange(errors, "widthMm", "A largura", input.widthMm, config.minWidthMm, config.maxWidthMm)
  pushRange(errors, "depthMm", "A profundidade", input.depthMm, config.minDepthMm, config.maxDepthMm)

  if (!config.allowedPanelThicknessMm.includes(input.thicknessMm)) {
    errors.push({
      field: "thicknessMm",
      message: `A espessura do MDF neste projeto é ${config.allowedPanelThicknessMm.join(" ou ")} mm.`,
    })
  }
  if (!config.allowedBackThicknessMm.includes(input.backThicknessMm)) {
    errors.push({
      field: "backThicknessMm",
      message: `A espessura do painel traseiro neste projeto é ${config.allowedBackThicknessMm.join(" ou ")} mm.`,
    })
  }
  if (!Number.isInteger(input.drawerCount) || input.drawerCount < config.minDrawers || input.drawerCount > config.maxDrawers) {
    errors.push({
      field: "drawerCount",
      message: `O número de gavetas precisa ser inteiro, de ${config.minDrawers} a ${config.maxDrawers}.`,
    })
  }
  if (input.plinthEnabled) {
    pushRange(errors, "plinthHeightMm", "A altura do roda-pé", input.plinthHeightMm, config.minPlinthMm, config.maxPlinthMm)
  }
  if (input.slideLengthMm != null) {
    if (!Number.isFinite(input.slideLengthMm) || input.slideLengthMm < config.minPartMm) {
      errors.push({
        field: "slideLengthMm",
        message: `O comprimento da corrediça precisa ser de pelo menos ${formatMm(config.minPartMm)}.`,
      })
    }
  }
  if (!config.slideTypes.some((type) => type.id === input.slideTypeId)) {
    errors.push({ field: "slideTypeId", message: "Escolha um tipo de corrediça da lista." })
  }
  pushRange(errors, "kerfMm", "O kerf", input.kerfMm, 0, config.maxKerfMm)
  pushRange(errors, "drawerGapMm", "A folga entre frentes", input.drawerGapMm, 0, config.maxDrawerGapMm)
  pushRange(
    errors,
    "slideClearancePerSideMm",
    "A folga da corrediça",
    input.slideClearancePerSideMm,
    0,
    config.maxSlideClearancePerSideMm,
  )
  pushRange(errors, "sheetMarginMm", "A margem da chapa", input.sheetMarginMm, 0, config.maxSheetMarginMm)
  if (
    !Number.isFinite(input.sheetLengthMm) ||
    !Number.isFinite(input.sheetWidthMm) ||
    input.sheetLengthMm < 400 ||
    input.sheetWidthMm < 400
  ) {
    errors.push({
      field: "sheetLengthMm",
      message: "A chapa precisa ter pelo menos 400 mm em cada lado.",
    })
  }

  if (errors.length > 0) return errors

  const derived = computeDerived(input, config)
  if (derived.sideDepthMm < config.minPartMm) {
    errors.push({
      field: "depthMm",
      message: `Depois de descontar o traseiro de ${formatMm(input.backThicknessMm)}, a lateral ficaria com ${formatMm(derived.sideDepthMm)}. Aumente a profundidade.`,
    })
  }
  if (derived.innerWidthMm < config.minPartMm) {
    errors.push({
      field: "widthMm",
      message: `Depois de descontar as duas laterais, a largura interna fica ${formatMm(derived.innerWidthMm)}. Aumente a largura ou use MDF mais fino.`,
    })
  }
  if (derived.openingHeightMm < config.minPartMm) {
    errors.push({
      field: "heightMm",
      message: `O vão interno fica com ${formatMm(derived.openingHeightMm)} de altura. Reduza o roda-pé ou aumente a altura da caixa.`,
    })
  }
  if (derived.frontHeightMm < config.minDrawerFrontHeightMm) {
    errors.push({
      field: "drawerCount",
      message: `Com ${input.drawerCount} gavetas, a frente ficaria com ${formatMm(derived.frontHeightMm)}. O mínimo é ${formatMm(config.minDrawerFrontHeightMm)}. Aumente a altura, reduza as gavetas ou reduza o roda-pé.`,
    })
  }
  if (derived.frontWidthMm < config.minPartMm) {
    errors.push({
      field: "widthMm",
      message: `A frente ficaria com ${formatMm(derived.frontWidthMm)} de largura. Aumente a largura da caixa.`,
    })
  }
  if (derived.boxHeightMm < config.minDrawerBoxHeightMm) {
    errors.push({
      field: "drawerCount",
      message: `A caixa da gaveta ficaria com ${formatMm(derived.boxHeightMm)} de altura, abaixo do mínimo de ${formatMm(config.minDrawerBoxHeightMm)}.`,
    })
  }
  if (input.slideLengthMm == null && derived.slideLengthMm <= 0) {
    errors.push({
      field: "depthMm",
      message: `Nenhuma corrediça comercial cabe. O vão útil é ${formatMm(derived.maxSlideLengthMm)} e a menor da lista tem ${formatMm(Math.min(...config.standardSlideLengthsMm))}. Aumente a profundidade.`,
    })
  }
  if (input.slideLengthMm != null && input.slideLengthMm > derived.maxSlideLengthMm + 0.001) {
    errors.push({
      field: "slideLengthMm",
      message: `A corrediça de ${formatMm(input.slideLengthMm)} não cabe. O máximo aqui é ${formatMm(derived.maxSlideLengthMm)} (profundidade interna, menos a frente e a folga traseira).`,
    })
  }
  if (derived.boxInnerWidthMm < config.minPartMm) {
    errors.push({
      field: "slideClearancePerSideMm",
      message: `Com a folga de corrediça, a gaveta fica com largura interna de ${formatMm(derived.boxInnerWidthMm)}. Reduza a folga ou aumente a largura da caixa.`,
    })
  }
  if (derived.slideLengthMm > 0 && derived.boxInnerDepthMm < config.minPartMm) {
    errors.push({
      field: "slideLengthMm",
      message: `O fundo da gaveta ficaria com ${formatMm(derived.boxInnerDepthMm)} de profundidade. Escolha uma corrediça mais comprida ou uma espessura menor.`,
    })
  }
  if (input.plinthEnabled && derived.plinthRailLengthMm < config.minPartMm) {
    errors.push({
      field: "depthMm",
      message: `O travessão lateral do roda-pé ficaria com ${formatMm(derived.plinthRailLengthMm)}. Aumente a profundidade ou reduza o recuo do roda-pé em carpentry.ts.`,
    })
  }

  const usableLength = input.sheetLengthMm - 2 * input.sheetMarginMm
  const usableWidth = input.sheetWidthMm - 2 * input.sheetMarginMm
  const bulky: Array<[string, number, number]> = [
    ["A lateral", input.heightMm, derived.sideDepthMm],
    ["O painel traseiro", derived.backWidthMm, derived.backHeightMm],
    ["O tampo", derived.innerWidthMm, derived.sideDepthMm],
  ]
  for (const [name, a, b] of bulky) {
    const fits = (a <= usableLength && b <= usableWidth) || (b <= usableLength && a <= usableWidth)
    if (!fits) {
      errors.push({
        field: "sheetLengthMm",
        message: `${name} mede ${formatMm(a)} × ${formatMm(b)} e não cabe na área útil da chapa (${formatMm(usableLength)} × ${formatMm(usableWidth)}).`,
      })
    }
  }

  return errors
}

function edgeOfSide(input: GaveteiroInput, derived: DerivedDimensions, config: CarpentryConfig): number {
  return (config.bandSideFrontEdge ? input.heightMm : 0) + (config.bandSideTopEdge ? derived.sideDepthMm : 0)
}

export function buildParts(
  input: GaveteiroInput,
  derived: DerivedDimensions,
  config: CarpentryConfig = CARPENTRY,
): CutPart[] {
  const panel = materialName(input.thicknessMm)
  const thin = materialName(input.backThicknessMm)
  const parts: CutPart[] = []

  for (let index = 1; index <= 2; index += 1) {
    parts.push({
      id: `L${index}`,
      name: "Lateral",
      role: "side",
      aMm: input.heightMm,
      bMm: derived.sideDepthMm,
      axisNote: "altura × profundidade",
      thicknessMm: input.thicknessMm,
      material: panel,
      edgeBandMm: edgeOfSide(input, derived, config),
      note: "Peça inteira, do piso ao topo. A profundidade não inclui o painel traseiro.",
    })
  }

  parts.push({
    id: "TP",
    name: "Tampo",
    role: "top",
    aMm: derived.innerWidthMm,
    bMm: derived.sideDepthMm,
    axisNote: "largura × profundidade",
    thicknessMm: input.thicknessMm,
    material: panel,
    edgeBandMm: config.bandTopFrontEdge ? derived.innerWidthMm : 0,
    note: "Entra entre as laterais, face de cima alinhada ao topo delas.",
  })

  parts.push({
    id: "BS",
    name: "Base",
    role: "bottom",
    aMm: derived.innerWidthMm,
    bMm: derived.sideDepthMm,
    axisNote: "largura × profundidade",
    thicknessMm: input.thicknessMm,
    material: panel,
    edgeBandMm: config.bandBottomFrontEdge ? derived.innerWidthMm : 0,
    note: input.plinthEnabled
      ? "Entra entre as laterais, apoiada no roda-pé."
      : "Entra entre as laterais, no piso da caixa.",
  })

  parts.push({
    id: "TR",
    name: "Painel traseiro",
    role: "back",
    aMm: derived.backWidthMm,
    bMm: derived.backHeightMm,
    axisNote: "largura × altura",
    thicknessMm: input.backThicknessMm,
    material: thin,
    edgeBandMm: 0,
    note: "Pregado por trás, cobrindo as bordas traseiras das laterais, do tampo e da base.",
  })

  if (input.plinthEnabled) {
    parts.push(
      {
        id: "PF",
        name: "Roda-pé frontal",
        role: "plinth-front",
        aMm: derived.innerWidthMm,
        bMm: derived.plinthHeightMm,
        axisNote: "largura × altura",
        thicknessMm: input.thicknessMm,
        material: panel,
        edgeBandMm: 0,
        note: `Recuado ${formatMm(config.plinthSetbackMm)} em relação à frente. Sem fita.`,
      },
      {
        id: "PT",
        name: "Roda-pé traseiro",
        role: "plinth-back",
        aMm: derived.innerWidthMm,
        bMm: derived.plinthHeightMm,
        axisNote: "largura × altura",
        thicknessMm: input.thicknessMm,
        material: panel,
        edgeBandMm: 0,
        note: "Fecha o quadro do roda-pé no fundo da caixa.",
      },
    )
    for (let index = 1; index <= 2; index += 1) {
      parts.push({
        id: `PL${index}`,
        name: "Roda-pé lateral",
        role: "plinth-side",
        aMm: derived.plinthRailLengthMm,
        bMm: derived.plinthHeightMm,
        axisNote: "profundidade × altura",
        thicknessMm: input.thicknessMm,
        material: panel,
        edgeBandMm: 0,
        note: "Travessão entre o roda-pé frontal e o traseiro.",
      })
    }
  }

  const frontBand = config.bandDrawerFrontPerimeter
    ? 2 * (derived.frontWidthMm + derived.frontHeightMm)
    : 0
  for (let number = 1; number <= input.drawerCount; number += 1) {
    parts.push({
      id: `F${number}`,
      name: "Frente de gaveta",
      role: "drawer-front",
      aMm: derived.frontWidthMm,
      bMm: derived.frontHeightMm,
      axisNote: "largura × altura",
      thicknessMm: input.thicknessMm,
      material: panel,
      edgeBandMm: frontBand,
      note: "Embutida no vão. F1 é a de cima.",
    })
  }

  const sideBand = config.bandDrawerSideTopEdges ? derived.boxDepthMm : 0
  for (let number = 1; number <= input.drawerCount; number += 1) {
    parts.push(
      {
        id: `G${number}E`,
        name: "Lateral de gaveta",
        role: "drawer-side",
        aMm: derived.boxDepthMm,
        bMm: derived.boxHeightMm,
        axisNote: "profundidade × altura",
        thicknessMm: input.thicknessMm,
        material: panel,
        edgeBandMm: sideBand,
        note: "Comprimento igual ao da corrediça. Duas por gaveta.",
      },
      {
        id: `G${number}D`,
        name: "Lateral de gaveta",
        role: "drawer-side",
        aMm: derived.boxDepthMm,
        bMm: derived.boxHeightMm,
        axisNote: "profundidade × altura",
        thicknessMm: input.thicknessMm,
        material: panel,
        edgeBandMm: sideBand,
        note: "Comprimento igual ao da corrediça. Duas por gaveta.",
      },
      {
        id: `G${number}CF`,
        name: "Frente da caixa",
        role: "drawer-box-front",
        aMm: derived.boxInnerWidthMm,
        bMm: derived.boxHeightMm,
        axisNote: "largura × altura",
        thicknessMm: input.thicknessMm,
        material: panel,
        edgeBandMm: 0,
        note: "Entra entre as laterais da gaveta. A frente decorativa vai por fora.",
      },
      {
        id: `G${number}CT`,
        name: "Contrafrente",
        role: "drawer-box-back",
        aMm: derived.boxInnerWidthMm,
        bMm: derived.boxHeightMm,
        axisNote: "largura × altura",
        thicknessMm: input.thicknessMm,
        material: panel,
        edgeBandMm: 0,
        note: "Fecha a gaveta atrás, entre as laterais.",
      },
      {
        id: `G${number}FU`,
        name: "Fundo de gaveta",
        role: "drawer-bottom",
        aMm: derived.boxInnerWidthMm,
        bMm: derived.boxInnerDepthMm,
        axisNote: "largura × profundidade",
        thicknessMm: input.backThicknessMm,
        material: thin,
        edgeBandMm: 0,
        note: "Solto por dentro da caixa da gaveta. Sem fita.",
      },
    )
  }

  return parts
}

export function groupParts(parts: CutPart[]): CutGroup[] {
  const groups: CutGroup[] = []
  for (const part of parts) {
    const existing = groups.find(
      (group) =>
        group.role === part.role &&
        group.name === part.name &&
        group.aMm === part.aMm &&
        group.bMm === part.bMm &&
        group.thicknessMm === part.thicknessMm &&
        group.note === part.note,
    )
    if (existing) {
      existing.ids.push(part.id)
      continue
    }
    groups.push({
      name: part.name,
      role: part.role,
      ids: [part.id],
      aMm: part.aMm,
      bMm: part.bMm,
      axisNote: part.axisNote,
      thicknessMm: part.thicknessMm,
      material: part.material,
      edgeBandPerPieceMm: part.edgeBandMm,
      note: part.note,
    })
  }
  return groups
}

export function screwsAlong(lengthMm: number, spacingMm: number, minimum: number): number {
  if (lengthMm <= 0) return 0
  return Math.max(minimum, Math.ceil(lengthMm / spacingMm))
}
