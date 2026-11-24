import { CARPENTRY } from "../config/carpentry"
import type { GaveteiroInput } from "./types"

/** Cômoda de exemplo: 900 × 600 × 450 mm, 4 gavetas, MDF 15 mm. */
export const SAMPLE_INPUT: GaveteiroInput = {
  projectName: "Cômoda de 4 gavetas",
  heightMm: 900,
  widthMm: 600,
  depthMm: 450,
  thicknessMm: 15,
  backThicknessMm: 3,
  drawerCount: 4,
  plinthEnabled: true,
  plinthHeightMm: 80,
  slideLengthMm: null,
  slideTypeId: CARPENTRY.slideTypes[0]?.id ?? "telescopica-lateral",
  sheetLengthMm: CARPENTRY.defaultSheetLengthMm,
  sheetWidthMm: CARPENTRY.defaultSheetWidthMm,
  kerfMm: CARPENTRY.defaultKerfMm,
  slideClearancePerSideMm: CARPENTRY.slideClearancePerSideMm,
  drawerGapMm: CARPENTRY.drawerGapMm,
  sheetMarginMm: CARPENTRY.defaultSheetMarginMm,
}
