import type { FormState } from "../form/parse"
import { formatNumber } from "../domain/format"
import type { GeminiFurnitureReading } from "./types"

export interface KnownMeasurements {
  heightMm: number | null
  widthMm: number | null
  depthMm: number | null
  drawerCount: number | null
  /** Campo com texto digitado, mesmo que o número não sirva de âncora. */
  occupied: {
    height: boolean
    width: boolean
    depth: boolean
    drawers: boolean
  }
}

export interface EstimateLine {
  id: string
  label: string
  text: string
  /** true só quando a confirmação pode preencher um campo vazio. */
  applied: boolean
}

export interface MergeResult {
  patch: Partial<Pick<FormState, "heightMm" | "widthMm" | "depthMm" | "drawerCount">>
  lines: EstimateLine[]
  needsAnchor: boolean
}

const DRAWER_MIN = 1
const DRAWER_MAX = 10

export function knownFromForm(form: Pick<FormState, "heightMm" | "widthMm" | "depthMm" | "drawerCount">): KnownMeasurements {
  return {
    heightMm: parseMeasure(form.heightMm),
    widthMm: parseMeasure(form.widthMm),
    depthMm: parseMeasure(form.depthMm),
    drawerCount: parseCount(form.drawerCount),
    occupied: {
      height: form.heightMm.trim() !== "",
      width: form.widthMm.trim() !== "",
      depth: form.depthMm.trim() !== "",
      drawers: form.drawerCount.trim() !== "",
    },
  }
}

/** A medida digitada permanece. A foto só completa campo vazio, usando a proporção. */
export function mergePhotoReading(known: KnownMeasurements, reading: GeminiFurnitureReading): MergeResult {
  const lines: EstimateLine[] = []
  const patch: MergeResult["patch"] = {}
  const proportions = reading.proportions
  const scale = proportions ? scaleFromKnown(known, proportions) : null
  const needsAnchor = Boolean(proportions) && scale == null && hasEmptyDimension(known)

  lines.push({
    id: "type",
    label: "Tipo de móvel",
    text: `${reading.furnitureType || "não identificado"}. estimativa`,
    applied: false,
  })

  const drawerSuggestion = reading.drawerCount
  const drawerInRange = drawerSuggestion != null && drawerSuggestion >= DRAWER_MIN && drawerSuggestion <= DRAWER_MAX
  const applyDrawers = !known.occupied.drawers && drawerInRange
  if (applyDrawers && drawerSuggestion != null) patch.drawerCount = String(drawerSuggestion)
  lines.push({
    id: "drawers",
    label: "Gavetas",
    text: drawerLine(known, drawerSuggestion, drawerInRange),
    applied: applyDrawers,
  })

  lines.push({
    id: "doors",
    label: "Portas",
    text: `${reading.doorCount ?? "não deu para ver"}. estimativa. Este gaveteiro não usa portas, então o número só fica registrado aqui.`,
    applied: false,
  })

  lines.push({
    id: "proportions",
    label: "Proporção altura × largura × profundidade",
    text: proportions
      ? `${formatNumber(proportions.height)} × ${formatNumber(proportions.width)} × ${formatNumber(proportions.depth)}. estimativa`
      : "não deu para ver. estimativa",
    applied: false,
  })

  const suggestions = {
    height: suggest(scale, proportions?.height),
    width: suggest(scale, proportions?.width),
    depth: suggest(scale, proportions?.depth),
  }
  pushDimension(lines, patch, "height", "Altura", known.occupied.height, known.heightMm, suggestions.height)
  pushDimension(lines, patch, "width", "Largura", known.occupied.width, known.widthMm, suggestions.width)
  pushDimension(lines, patch, "depth", "Profundidade", known.occupied.depth, known.depthMm, suggestions.depth)

  const confidence = reading.confidence == null ? "não informada" : `${formatNumber(reading.confidence * 100)}%`
  lines.push({
    id: "confidence",
    label: "Confiança",
    text: `${confidence}. estimativa`,
    applied: false,
  })
  if (reading.notes) {
    lines.push({
      id: "notes",
      label: "Observação da foto",
      text: `${reading.notes} estimativa`,
      applied: false,
    })
  }

  return { patch, lines, needsAnchor }
}

export function scaleFromKnown(
  known: KnownMeasurements,
  proportions: { height: number; width: number; depth: number },
): number | null {
  const scales: number[] = []
  if (known.heightMm != null) scales.push(known.heightMm / proportions.height)
  if (known.widthMm != null) scales.push(known.widthMm / proportions.width)
  if (known.depthMm != null) scales.push(known.depthMm / proportions.depth)
  if (!scales.length) return null
  return scales.reduce((sum, value) => sum + value, 0) / scales.length
}

function pushDimension(
  lines: EstimateLine[],
  patch: MergeResult["patch"],
  id: "height" | "width" | "depth",
  label: string,
  occupied: boolean,
  current: number | null,
  suggestion: number | null,
): void {
  const field = id === "height" ? "heightMm" : id === "width" ? "widthMm" : "depthMm"
  if (!occupied && suggestion != null) {
    patch[field] = String(suggestion)
    lines.push({
      id,
      label,
      text: `${formatNumber(suggestion)} mm. estimativa. O campo está vazio e será preenchido se você confirmar.`,
      applied: true,
    })
    return
  }
  if (occupied) {
    const currentText = current == null ? "o que está digitado" : `${formatNumber(current)} mm`
    const guess = suggestion == null ? "" : ` A foto sugere ${formatNumber(suggestion)} mm.`
    lines.push({
      id,
      label,
      text: `${currentText} permanece.${guess} estimativa. Não substitui a medida digitada.`,
      applied: false,
    })
    return
  }
  lines.push({
    id,
    label,
    text: "sem milímetro. estimativa. Falta uma medida digitada para transformar a proporção.",
    applied: false,
  })
}

function drawerLine(known: KnownMeasurements, suggestion: number | null, inRange: boolean): string {
  if (!known.occupied.drawers && inRange && suggestion != null) {
    return `${suggestion}. estimativa. O campo está vazio e será preenchido se você confirmar.`
  }
  if (known.occupied.drawers) {
    const kept = known.drawerCount == null ? "o que está digitado" : String(known.drawerCount)
    const guess = suggestion == null ? "" : ` A foto sugere ${suggestion}.`
    return `${kept} permanece.${guess} estimativa. Não substitui o número digitado.`
  }
  if (suggestion != null && !inRange) {
    return `${suggestion}. estimativa. Fora do limite de ${DRAWER_MIN} a ${DRAWER_MAX} gavetas, então não entra no formulário.`
  }
  return "não deu para ver. estimativa"
}

function suggest(scale: number | null, proportion: number | undefined): number | null {
  if (scale == null || proportion == null) return null
  const value = Math.round(scale * proportion)
  return value > 0 ? value : null
}

function hasEmptyDimension(known: KnownMeasurements): boolean {
  return !known.occupied.height || !known.occupied.width || !known.occupied.depth
}

function parseMeasure(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".")
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null
  const value = Number(trimmed)
  return value > 0 ? value : null
}

function parseCount(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const value = Number(trimmed)
  return value >= 0 ? value : null
}
