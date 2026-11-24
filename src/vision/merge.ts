import type { FormState } from "../form/parse"
import { formatNumber } from "../domain/format"
import type { GeminiFurnitureReading } from "./types"

export const PHOTO_FIELDS = ["heightMm", "widthMm", "depthMm", "drawerCount"] as const
export type PhotoField = (typeof PHOTO_FIELDS)[number]

export interface KnownMeasurements {
  heightMm: number | null
  widthMm: number | null
  depthMm: number | null
  drawerCount: number | null
  /** Texto atual do campo, para listar a troca e para desfazer. */
  raw: {
    height: string
    width: string
    depth: string
    drawers: string
  }
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
  /** true quando a análise escreve este campo no formulário. */
  applied: boolean
}

export interface PhotoChange {
  field: PhotoField
  label: string
  previous: string
  next: string
  /** false quando o número da foto é o mesmo que já estava no campo. */
  changed: boolean
}

export interface MergeResult {
  patch: Partial<Pick<FormState, PhotoField>>
  lines: EstimateLine[]
  changes: PhotoChange[]
  needsAnchor: boolean
}

const DRAWER_MIN = 1
const DRAWER_MAX = 10

const FIELD_LABEL: Record<PhotoField, string> = {
  heightMm: "Altura externa",
  widthMm: "Largura externa",
  depthMm: "Profundidade externa",
  drawerCount: "Número de gavetas",
}

export function knownFromForm(form: Pick<FormState, PhotoField>): KnownMeasurements {
  return {
    heightMm: parseMeasure(form.heightMm),
    widthMm: parseMeasure(form.widthMm),
    depthMm: parseMeasure(form.depthMm),
    drawerCount: parseCount(form.drawerCount),
    raw: {
      height: form.heightMm,
      width: form.widthMm,
      depth: form.depthMm,
      drawers: form.drawerCount,
    },
    occupied: {
      height: form.heightMm.trim() !== "",
      width: form.widthMm.trim() !== "",
      depth: form.depthMm.trim() !== "",
      drawers: form.drawerCount.trim() !== "",
    },
  }
}

/**
 * A leitura bem-sucedida vira a estimativa principal.
 * Ela reescreve os campos que consegue inferir, inclusive exemplo e texto já digitado.
 * A escala em milímetros sai das medidas válidas que já estavam no formulário.
 */
export function mergePhotoReading(known: KnownMeasurements, reading: GeminiFurnitureReading): MergeResult {
  const lines: EstimateLine[] = []
  const changes: PhotoChange[] = []
  const patch: MergeResult["patch"] = {}
  const proportions = reading.proportions
  const scale = proportions ? scaleFromKnown(known, proportions) : null
  const needsAnchor = Boolean(proportions) && scale == null

  lines.push({
    id: "type",
    label: "Tipo de móvel",
    text: `${reading.furnitureType || "não identificado"}. estimativa`,
    applied: false,
  })

  applyDrawers(lines, patch, changes, known, reading.drawerCount)

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
  applyDimension(lines, patch, changes, {
    id: "height",
    field: "heightMm",
    lineLabel: "Altura",
    current: known.heightMm,
    raw: known.raw.height,
    suggestion: suggestions.height,
    hasScale: scale != null,
  })
  applyDimension(lines, patch, changes, {
    id: "width",
    field: "widthMm",
    lineLabel: "Largura",
    current: known.widthMm,
    raw: known.raw.width,
    suggestion: suggestions.width,
    hasScale: scale != null,
  })
  applyDimension(lines, patch, changes, {
    id: "depth",
    field: "depthMm",
    lineLabel: "Profundidade",
    current: known.depthMm,
    raw: known.raw.depth,
    suggestion: suggestions.depth,
    hasScale: scale != null,
  })

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

  return { patch, lines, changes, needsAnchor }
}

/** Campos marcados pela última análise, menos o que a pessoa editou depois. */
export function photoFieldsAfterEdit(fields: readonly PhotoField[], edited: object): PhotoField[] {
  return fields.filter((field) => !Object.prototype.hasOwnProperty.call(edited, field))
}

/** Nova análise marca o que ela escreveu e conserva a marca nos campos que não tocou. */
export function photoFieldsAfterAnalysis(
  fields: readonly PhotoField[],
  patch: Partial<Record<PhotoField, string>>,
): PhotoField[] {
  const written = PHOTO_FIELDS.filter((field) => patch[field] !== undefined)
  const kept = fields.filter((field) => patch[field] === undefined)
  return [...kept, ...written.filter((field) => !kept.includes(field))]
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

function applyDimension(
  lines: EstimateLine[],
  patch: MergeResult["patch"],
  changes: PhotoChange[],
  spec: {
    id: "height" | "width" | "depth"
    field: PhotoField
    lineLabel: string
    current: number | null
    raw: string
    suggestion: number | null
    hasScale: boolean
  },
): void {
  if (spec.suggestion != null) {
    const next = String(spec.suggestion)
    patch[spec.field] = next
    const changed = spec.current == null ? spec.raw.trim() !== next : spec.current !== spec.suggestion
    changes.push({
      field: spec.field,
      label: FIELD_LABEL[spec.field],
      previous: spec.raw.trim(),
      next,
      changed,
    })
    lines.push({
      id: spec.id,
      label: spec.lineLabel,
      text: changed
        ? `${formatNumber(spec.suggestion)} mm. estimativa. Substitui o valor anterior.`
        : `${formatNumber(spec.suggestion)} mm. estimativa. Igual ao valor que já estava no formulário.`,
      applied: true,
    })
    return
  }
  lines.push({
    id: spec.id,
    label: spec.lineLabel,
    text: spec.hasScale
      ? "sem milímetro. estimativa. A proporção desta medida não veio na leitura."
      : "sem milímetro. estimativa. Falta uma medida válida no formulário para transformar a proporção.",
    applied: false,
  })
}

function applyDrawers(
  lines: EstimateLine[],
  patch: MergeResult["patch"],
  changes: PhotoChange[],
  known: KnownMeasurements,
  suggestion: number | null,
): void {
  const inRange = suggestion != null && suggestion >= DRAWER_MIN && suggestion <= DRAWER_MAX
  if (inRange && suggestion != null) {
    const next = String(suggestion)
    patch.drawerCount = next
    const changed = known.drawerCount == null ? known.raw.drawers.trim() !== next : known.drawerCount !== suggestion
    changes.push({
      field: "drawerCount",
      label: FIELD_LABEL.drawerCount,
      previous: known.raw.drawers.trim(),
      next,
      changed,
    })
    lines.push({
      id: "drawers",
      label: "Gavetas",
      text: changed
        ? `${suggestion}. estimativa. Substitui o valor anterior.`
        : `${suggestion}. estimativa. Igual ao valor que já estava no formulário.`,
      applied: true,
    })
    return
  }
  if (suggestion != null && !inRange) {
    lines.push({
      id: "drawers",
      label: "Gavetas",
      text: `${suggestion}. estimativa. Fora do limite de ${DRAWER_MIN} a ${DRAWER_MAX} gavetas, então não entra no formulário.`,
      applied: false,
    })
    return
  }
  lines.push({
    id: "drawers",
    label: "Gavetas",
    text: "não deu para ver. estimativa",
    applied: false,
  })
}

function suggest(scale: number | null, proportion: number | undefined): number | null {
  if (scale == null || proportion == null) return null
  const value = Math.round(scale * proportion)
  return value > 0 ? value : null
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
