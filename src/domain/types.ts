export type PartRole =
  | "side"
  | "top"
  | "bottom"
  | "back"
  | "plinth-front"
  | "plinth-back"
  | "plinth-side"
  | "drawer-front"
  | "drawer-side"
  | "drawer-box-front"
  | "drawer-box-back"
  | "drawer-bottom"

export interface GaveteiroInput {
  projectName: string
  heightMm: number
  widthMm: number
  depthMm: number
  thicknessMm: number
  backThicknessMm: number
  drawerCount: number
  plinthEnabled: boolean
  plinthHeightMm: number
  /** null escolhe a maior corrediça comercial que cabe. */
  slideLengthMm: number | null
  slideTypeId: string
  sheetLengthMm: number
  sheetWidthMm: number
  kerfMm: number
  slideClearancePerSideMm: number
  drawerGapMm: number
  sheetMarginMm: number
}

export interface FieldError {
  field: string
  message: string
}

export interface DerivedDimensions {
  plinthHeightMm: number
  sideDepthMm: number
  innerWidthMm: number
  openingHeightMm: number
  openingDepthMm: number
  frontWidthMm: number
  frontHeightMm: number
  boxOuterWidthMm: number
  boxInnerWidthMm: number
  boxHeightMm: number
  boxDepthMm: number
  boxInnerDepthMm: number
  slideLengthMm: number
  maxSlideLengthMm: number
  rearClearanceMm: number
  nextSlideLengthMm: number | null
  backWidthMm: number
  backHeightMm: number
  plinthRailLengthMm: number
  /** Índice 0 é a gaveta de cima. Altura do centro da caixa, a partir do piso. */
  slideCenterFromFloorMm: number[]
  calculations: string[]
}

export interface CutPart {
  id: string
  name: string
  role: PartRole
  /** Primeira medida de corte, na ordem de axisNote. */
  aMm: number
  /** Segunda medida de corte. */
  bMm: number
  axisNote: string
  thicknessMm: number
  material: string
  edgeBandMm: number
  note: string
}

export interface CutGroup {
  name: string
  role: PartRole
  ids: string[]
  aMm: number
  bMm: number
  axisNote: string
  thicknessMm: number
  material: string
  edgeBandPerPieceMm: number
  note: string
}

export interface Placement {
  id: string
  name: string
  x: number
  y: number
  aMm: number
  bMm: number
  rotated: boolean
  thicknessMm: number
}

export interface CutSheet {
  number: number
  material: string
  thicknessMm: number
  lengthMm: number
  widthMm: number
  marginMm: number
  kerfMm: number
  placements: Placement[]
  usedAreaMm2: number
  sheetAreaMm2: number
  wastePercent: number
}

export interface BomLine {
  id: string
  item: string
  quantityLabel: string
  quantity: number
  unit: string
  detail: string
  /** Preenchido quando o item normalmente já vem com outra compra. */
  includedWith: string | null
}

export interface AssemblyStep {
  id: string
  title: string
  body: string
  pieces: string[]
  hardware: string[]
}

export interface EdgeBandSummary {
  rawMm: number
  withWasteMm: number
  purchaseMeters: number
  widthMm: number
}

export interface FurnitureProject {
  input: GaveteiroInput
  projectName: string
  slideLabel: string
  construction: string
  derived: DerivedDimensions
  parts: CutPart[]
  groups: CutGroup[]
  sheets: CutSheet[]
  edgeBand: EdgeBandSummary
  bom: BomLine[]
  steps: AssemblyStep[]
  warnings: string[]
  calculations: string[]
}

export type GenerateResult =
  | { ok: true; project: FurnitureProject }
  | { ok: false; errors: FieldError[] }
