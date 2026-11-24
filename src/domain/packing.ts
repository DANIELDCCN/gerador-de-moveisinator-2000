import type { CutSheet, Placement } from "./types"

export interface PackablePart {
  id: string
  name: string
  aMm: number
  bMm: number
  thicknessMm: number
  material: string
}

export interface PackOptions {
  sheetLengthMm: number
  sheetWidthMm: number
  kerfMm: number
  marginMm: number
}

interface FreeRect {
  x: number
  y: number
  w: number
  h: number
}

interface Candidate {
  x: number
  y: number
  w: number
  h: number
  rotated: boolean
  shortSide: number
  longSide: number
}

const EPS = 0.01

function contains(outer: FreeRect, inner: FreeRect): boolean {
  return (
    inner.x >= outer.x - EPS &&
    inner.y >= outer.y - EPS &&
    inner.x + inner.w <= outer.x + outer.w + EPS &&
    inner.y + inner.h <= outer.y + outer.h + EPS
  )
}

function intersects(a: FreeRect, b: FreeRect): boolean {
  return (
    a.x < b.x + b.w - EPS &&
    a.x + a.w > b.x + EPS &&
    a.y < b.y + b.h - EPS &&
    a.y + a.h > b.y + EPS
  )
}

function prune(rects: FreeRect[]): FreeRect[] {
  const kept: FreeRect[] = []
  for (const rect of rects) {
    if (rect.w < 1 || rect.h < 1) continue
    if (kept.some((other) => contains(other, rect))) continue
    for (let index = kept.length - 1; index >= 0; index -= 1) {
      if (contains(rect, kept[index]!)) kept.splice(index, 1)
    }
    kept.push(rect)
  }
  return kept
}

function splitFree(free: FreeRect[], blocked: FreeRect): FreeRect[] {
  const next: FreeRect[] = []
  for (const rect of free) {
    if (!intersects(rect, blocked)) {
      next.push(rect)
      continue
    }
    if (blocked.x > rect.x + EPS) {
      next.push({ x: rect.x, y: rect.y, w: blocked.x - rect.x, h: rect.h })
    }
    const blockedRight = blocked.x + blocked.w
    const rectRight = rect.x + rect.w
    if (blockedRight < rectRight - EPS) {
      next.push({ x: blockedRight, y: rect.y, w: rectRight - blockedRight, h: rect.h })
    }
    if (blocked.y > rect.y + EPS) {
      next.push({ x: rect.x, y: rect.y, w: rect.w, h: blocked.y - rect.y })
    }
    const blockedBottom = blocked.y + blocked.h
    const rectBottom = rect.y + rect.h
    if (blockedBottom < rectBottom - EPS) {
      next.push({ x: rect.x, y: blockedBottom, w: rect.w, h: rectBottom - blockedBottom })
    }
  }
  return prune(next)
}

function better(candidate: Candidate, best: Candidate): boolean {
  if (candidate.shortSide < best.shortSide - EPS) return true
  if (candidate.shortSide > best.shortSide + EPS) return false
  if (candidate.longSide < best.longSide - EPS) return true
  if (candidate.longSide > best.longSide + EPS) return false
  if (candidate.y < best.y - EPS) return true
  if (candidate.y > best.y + EPS) return false
  if (candidate.x < best.x - EPS) return true
  if (candidate.x > best.x + EPS) return false
  return !candidate.rotated && best.rotated
}

function findSpot(free: FreeRect[], aMm: number, bMm: number): Candidate | null {
  let best: Candidate | null = null
  const orientations =
    Math.abs(aMm - bMm) < EPS
      ? [{ w: aMm, h: bMm, rotated: false }]
      : [
          { w: aMm, h: bMm, rotated: false },
          { w: bMm, h: aMm, rotated: true },
        ]

  for (const rect of free) {
    for (const orientation of orientations) {
      if (orientation.w > rect.w + EPS || orientation.h > rect.h + EPS) continue
      const leftoverW = rect.w - orientation.w
      const leftoverH = rect.h - orientation.h
      const candidate: Candidate = {
        x: rect.x,
        y: rect.y,
        w: orientation.w,
        h: orientation.h,
        rotated: orientation.rotated,
        shortSide: Math.min(leftoverW, leftoverH),
        longSide: Math.max(leftoverW, leftoverH),
      }
      if (!best || better(candidate, best)) best = candidate
    }
  }
  return best
}

interface WorkingSheet {
  free: FreeRect[]
  placements: Placement[]
}

function blankSheet(options: PackOptions): WorkingSheet {
  return {
    free: [
      {
        x: options.marginMm,
        y: options.marginMm,
        w: options.sheetLengthMm - 2 * options.marginMm,
        h: options.sheetWidthMm - 2 * options.marginMm,
      },
    ],
    placements: [],
  }
}

function place(sheet: WorkingSheet, part: PackablePart, spot: Candidate, kerfMm: number): void {
  sheet.placements.push({
    id: part.id,
    name: part.name,
    x: spot.x,
    y: spot.y,
    aMm: spot.w,
    bMm: spot.h,
    rotated: spot.rotated,
    thicknessMm: part.thicknessMm,
  })
  sheet.free = splitFree(sheet.free, {
    x: spot.x,
    y: spot.y,
    w: spot.w + kerfMm,
    h: spot.h + kerfMm,
  })
}

export function packParts(
  parts: PackablePart[],
  options: PackOptions,
): { sheets: CutSheet[]; unplaced: PackablePart[] } {
  const groups = new Map<string, PackablePart[]>()
  for (const part of parts) {
    const key = `${part.thicknessMm}||${part.material}`
    const list = groups.get(key)
    if (list) list.push(part)
    else groups.set(key, [part])
  }

  const keys = [...groups.keys()].sort((a, b) => Number(b.split("||")[0]) - Number(a.split("||")[0]))
  const sheets: CutSheet[] = []
  const unplaced: PackablePart[] = []

  for (const key of keys) {
    const [thicknessText, material] = key.split("||")
    const items = [...(groups.get(key) ?? [])].sort((a, b) => {
      const area = b.aMm * b.bMm - a.aMm * a.bMm
      if (Math.abs(area) > EPS) return area
      return a.id.localeCompare(b.id, "pt-BR")
    })
    const working: WorkingSheet[] = []

    for (const item of items) {
      let placed = false
      for (const sheet of working) {
        const spot = findSpot(sheet.free, item.aMm, item.bMm)
        if (!spot) continue
        place(sheet, item, spot, options.kerfMm)
        placed = true
        break
      }
      if (placed) continue

      const sheet = blankSheet(options)
      const spot = findSpot(sheet.free, item.aMm, item.bMm)
      if (!spot) {
        unplaced.push(item)
        continue
      }
      place(sheet, item, spot, options.kerfMm)
      working.push(sheet)
    }

    for (const sheet of working) {
      const usedAreaMm2 = sheet.placements.reduce((sum, item) => sum + item.aMm * item.bMm, 0)
      const sheetAreaMm2 = options.sheetLengthMm * options.sheetWidthMm
      sheets.push({
        number: sheets.length + 1,
        material: material ?? "",
        thicknessMm: Number(thicknessText),
        lengthMm: options.sheetLengthMm,
        widthMm: options.sheetWidthMm,
        marginMm: options.marginMm,
        kerfMm: options.kerfMm,
        placements: sheet.placements,
        usedAreaMm2,
        sheetAreaMm2,
        wastePercent: sheetAreaMm2 === 0 ? 100 : ((sheetAreaMm2 - usedAreaMm2) / sheetAreaMm2) * 100,
      })
    }
  }

  return { sheets, unplaced }
}

function pairProblem(a: Placement, b: Placement, kerfMm: number): string | null {
  const ax2 = a.x + a.aMm
  const ay2 = a.y + a.bMm
  const bx2 = b.x + b.aMm
  const by2 = b.y + b.bMm
  const overlapX = a.x < bx2 - EPS && b.x < ax2 - EPS
  const overlapY = a.y < by2 - EPS && b.y < ay2 - EPS
  if (overlapX && overlapY) return "sobreposição"
  if (overlapY) {
    const gap = a.x <= b.x ? b.x - ax2 : a.x - bx2
    if (gap < kerfMm - 0.05) return `folga de serra de ${gap.toFixed(2)} mm na horizontal`
  }
  if (overlapX) {
    const gap = a.y <= b.y ? b.y - ay2 : a.y - by2
    if (gap < kerfMm - 0.05) return `folga de serra de ${gap.toFixed(2)} mm na vertical`
  }
  return null
}

/** Conferência geométrica do plano: peça dentro da chapa, sem sobrepor, com kerf. */
export function findPackingProblems(sheets: CutSheet[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const sheet of sheets) {
    const limitX = sheet.lengthMm - sheet.marginMm
    const limitY = sheet.widthMm - sheet.marginMm
    for (const part of sheet.placements) {
      if (seen.has(part.id)) problems.push(`${part.id} aparece em mais de uma chapa`)
      seen.add(part.id)
      if (part.x < sheet.marginMm - EPS || part.y < sheet.marginMm - EPS) {
        problems.push(`${part.id} invade a margem da chapa ${sheet.number}`)
      }
      if (part.x + part.aMm > limitX + EPS || part.y + part.bMm > limitY + EPS) {
        problems.push(`${part.id} sai da área útil da chapa ${sheet.number}`)
      }
      if (part.aMm <= 0 || part.bMm <= 0) problems.push(`${part.id} tem corte sem medida`)
    }
    for (let i = 0; i < sheet.placements.length; i += 1) {
      for (let j = i + 1; j < sheet.placements.length; j += 1) {
        const problem = pairProblem(sheet.placements[i]!, sheet.placements[j]!, sheet.kerfMm)
        if (problem) {
          problems.push(
            `Chapa ${sheet.number}: ${sheet.placements[i]!.id} e ${sheet.placements[j]!.id} — ${problem}`,
          )
        }
      }
    }
  }
  return problems
}
