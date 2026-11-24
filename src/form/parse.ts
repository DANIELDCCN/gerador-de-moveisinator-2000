import { CARPENTRY } from "../config/carpentry"
import { SAMPLE_INPUT } from "../domain/sample"
import type { FieldError, GaveteiroInput } from "../domain/types"

export interface FormState {
  projectName: string
  heightMm: string
  widthMm: string
  depthMm: string
  thicknessMm: string
  backThicknessMm: string
  drawerCount: string
  plinthEnabled: boolean
  plinthHeightMm: string
  slideLengthMm: string
  slideTypeId: string
  sheetLengthMm: string
  sheetWidthMm: string
  kerfMm: string
  slideClearancePerSideMm: string
  drawerGapMm: string
  sheetMarginMm: string
}

export function sampleForm(): FormState {
  return {
    projectName: SAMPLE_INPUT.projectName,
    heightMm: String(SAMPLE_INPUT.heightMm),
    widthMm: String(SAMPLE_INPUT.widthMm),
    depthMm: String(SAMPLE_INPUT.depthMm),
    thicknessMm: String(SAMPLE_INPUT.thicknessMm),
    backThicknessMm: String(SAMPLE_INPUT.backThicknessMm),
    drawerCount: String(SAMPLE_INPUT.drawerCount),
    plinthEnabled: SAMPLE_INPUT.plinthEnabled,
    plinthHeightMm: String(SAMPLE_INPUT.plinthHeightMm),
    slideLengthMm: "auto",
    slideTypeId: SAMPLE_INPUT.slideTypeId,
    sheetLengthMm: String(SAMPLE_INPUT.sheetLengthMm),
    sheetWidthMm: String(SAMPLE_INPUT.sheetWidthMm),
    kerfMm: String(SAMPLE_INPUT.kerfMm),
    slideClearancePerSideMm: String(SAMPLE_INPUT.slideClearancePerSideMm),
    drawerGapMm: String(SAMPLE_INPUT.drawerGapMm),
    sheetMarginMm: String(SAMPLE_INPUT.sheetMarginMm),
  }
}

function parseNumber(raw: string, field: string, label: string, errors: FieldError[]): number | null {
  const trimmed = raw.trim().replace(/\s/g, "").replace(",", ".")
  if (!trimmed) {
    errors.push({ field, message: `Informe ${label}.` })
    return null
  }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    errors.push({
      field,
      message: `${label} precisa ser um número positivo, em milímetros. Exemplo: 900 ou 12,5.`,
    })
    return null
  }
  return Number(trimmed)
}

export function parseForm(form: FormState): { input: GaveteiroInput | null; errors: FieldError[] } {
  const errors: FieldError[] = []
  const heightMm = parseNumber(form.heightMm, "heightMm", "a altura", errors)
  const widthMm = parseNumber(form.widthMm, "widthMm", "a largura", errors)
  const depthMm = parseNumber(form.depthMm, "depthMm", "a profundidade", errors)
  const thicknessMm = parseNumber(form.thicknessMm, "thicknessMm", "a espessura do MDF", errors)
  const backThicknessMm = parseNumber(form.backThicknessMm, "backThicknessMm", "a espessura do traseiro", errors)
  const drawerCount = parseNumber(form.drawerCount, "drawerCount", "o número de gavetas", errors)
  const plinthHeightMm = form.plinthEnabled
    ? parseNumber(form.plinthHeightMm, "plinthHeightMm", "a altura do roda-pé", errors)
    : CARPENTRY.defaultPlinthHeightMm
  const sheetLengthMm = parseNumber(form.sheetLengthMm, "sheetLengthMm", "o comprimento da chapa", errors)
  const sheetWidthMm = parseNumber(form.sheetWidthMm, "sheetWidthMm", "a largura da chapa", errors)
  const kerfMm = parseNumber(form.kerfMm, "kerfMm", "o kerf", errors)
  const slideClearancePerSideMm = parseNumber(
    form.slideClearancePerSideMm,
    "slideClearancePerSideMm",
    "a folga da corrediça",
    errors,
  )
  const drawerGapMm = parseNumber(form.drawerGapMm, "drawerGapMm", "a folga entre frentes", errors)
  const sheetMarginMm = parseNumber(form.sheetMarginMm, "sheetMarginMm", "a margem da chapa", errors)

  let slideLengthMm: number | null = null
  if (form.slideLengthMm !== "auto") {
    slideLengthMm = parseNumber(form.slideLengthMm, "slideLengthMm", "o comprimento da corrediça", errors)
  }

  if (
    heightMm == null ||
    widthMm == null ||
    depthMm == null ||
    thicknessMm == null ||
    backThicknessMm == null ||
    drawerCount == null ||
    plinthHeightMm == null ||
    sheetLengthMm == null ||
    sheetWidthMm == null ||
    kerfMm == null ||
    slideClearancePerSideMm == null ||
    drawerGapMm == null ||
    sheetMarginMm == null ||
    (form.slideLengthMm !== "auto" && slideLengthMm == null)
  ) {
    return { input: null, errors }
  }

  return {
    input: {
      projectName: form.projectName,
      heightMm,
      widthMm,
      depthMm,
      thicknessMm,
      backThicknessMm,
      drawerCount,
      plinthEnabled: form.plinthEnabled,
      plinthHeightMm,
      slideLengthMm,
      slideTypeId: form.slideTypeId,
      sheetLengthMm,
      sheetWidthMm,
      kerfMm,
      slideClearancePerSideMm,
      drawerGapMm,
      sheetMarginMm,
    },
    errors,
  }
}
