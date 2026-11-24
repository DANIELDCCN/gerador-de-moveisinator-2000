import { jsPDF } from "jspdf"
import { formatCut, formatMetersFromMm, formatMm, formatNumber, formatPercent } from "../domain/format"
import type { CutSheet, FurnitureProject } from "../domain/types"

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 14
const CONTENT = PAGE_W - MARGIN * 2
const BOTTOM = 18

export function pdfFileName(project: FurnitureProject): string {
  const slug = project.projectName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${slug || "gaveteiro"}.pdf`
}

interface Pen {
  doc: jsPDF
  y: number
}

function linesOf(doc: jsPDF, text: string, width: number): string[] {
  return doc.splitTextToSize(text, width) as string[]
}

function blockHeight(doc: jsPDF, text: string, width: number, size: number): number {
  doc.setFontSize(size)
  return linesOf(doc, text, width).length * size * 0.42 + 1.6
}

function newPage(pen: Pen): void {
  pen.doc.addPage()
  pen.y = 16
}

function ensure(pen: Pen, height: number): void {
  if (pen.y + height > PAGE_H - BOTTOM) newPage(pen)
}

function paragraph(pen: Pen, text: string, size: number, style: "normal" | "bold" = "normal"): void {
  const height = blockHeight(pen.doc, text, CONTENT, size)
  ensure(pen, height)
  pen.doc.setFont("helvetica", style)
  pen.doc.setFontSize(size)
  pen.doc.setTextColor(20)
  const leading = size * 0.42
  const lines = linesOf(pen.doc, text, CONTENT)
  pen.doc.text(lines, MARGIN, pen.y)
  pen.y += lines.length * leading + 1.6
}

function gap(pen: Pen, amount = 2): void {
  pen.y += amount
}

function drawTable(pen: Pen, headers: string[], widths: number[], rows: string[][]): void {
  const fontSize = 10.5
  const headerHeight = rowHeight(pen.doc, headers, widths, fontSize, true)
  const paintHeader = () => {
    ensure(pen, headerHeight + 2)
    let x = MARGIN
    pen.doc.setDrawColor(20)
    pen.doc.setLineWidth(0.35)
    pen.doc.line(MARGIN, pen.y - 3.2, MARGIN + CONTENT, pen.y - 3.2)
    pen.doc.setFont("helvetica", "bold")
    pen.doc.setFontSize(fontSize)
    pen.doc.setTextColor(20)
    headers.forEach((header, index) => {
      const cell = linesOf(pen.doc, header, widths[index]! - 3)
      pen.doc.text(cell, x + 1.4, pen.y)
      x += widths[index]!
    })
    pen.y += headerHeight - 1
    pen.doc.setLineWidth(0.55)
    pen.doc.line(MARGIN, pen.y, MARGIN + CONTENT, pen.y)
    pen.y += 4
  }

  paintHeader()
  rows.forEach((row) => {
    const height = rowHeight(pen.doc, row, widths, fontSize, false)
    if (pen.y + height > PAGE_H - BOTTOM) {
      newPage(pen)
      paintHeader()
    }
    let x = MARGIN
    pen.doc.setFont("helvetica", "normal")
    pen.doc.setFontSize(fontSize)
    pen.doc.setTextColor(20)
    row.forEach((cell, index) => {
      const wrapped = linesOf(pen.doc, cell, widths[index]! - 3)
      pen.doc.text(wrapped, x + 1.4, pen.y)
      x += widths[index]!
    })
    pen.y += height
    pen.doc.setLineWidth(0.15)
    pen.doc.setDrawColor(60)
    pen.doc.line(MARGIN, pen.y - 1.5, MARGIN + CONTENT, pen.y - 1.5)
  })
  gap(pen, 3)
}

function rowHeight(doc: jsPDF, cells: string[], widths: number[], fontSize: number, header: boolean): number {
  doc.setFont("helvetica", header ? "bold" : "normal")
  doc.setFontSize(fontSize)
  let maxLines = 1
  cells.forEach((cell, index) => {
    maxLines = Math.max(maxLines, linesOf(doc, cell, widths[index]! - 3).length)
  })
  return maxLines * (fontSize * 0.42) + 3.2
}

function drawSheet(pen: Pen, sheet: CutSheet): void {
  paragraph(
    pen,
    `Chapa ${sheet.number} — ${sheet.material} — ${formatNumber(sheet.lengthMm)} × ${formatNumber(sheet.widthMm)} mm. Aproveitamento ${formatPercent(100 - sheet.wastePercent)}%. Origem no canto superior esquerdo.`,
    12,
    "bold",
  )
  const maxW = CONTENT
  const maxH = 115
  let scale = maxW / sheet.lengthMm
  if (sheet.widthMm * scale > maxH) scale = maxH / sheet.widthMm
  const drawW = sheet.lengthMm * scale
  const drawH = sheet.widthMm * scale
  ensure(pen, drawH + 6)
  const x0 = MARGIN
  const y0 = pen.y
  pen.doc.setDrawColor(20)
  pen.doc.setLineWidth(0.4)
  pen.doc.setLineDashPattern([], 0)
  pen.doc.rect(x0, y0, drawW, drawH)
  if (sheet.marginMm > 0) {
    pen.doc.setLineDashPattern([0.8, 0.8], 0)
    pen.doc.setLineWidth(0.2)
    pen.doc.rect(
      x0 + sheet.marginMm * scale,
      y0 + sheet.marginMm * scale,
      (sheet.lengthMm - 2 * sheet.marginMm) * scale,
      (sheet.widthMm - 2 * sheet.marginMm) * scale,
    )
    pen.doc.setLineDashPattern([], 0)
  }
  pen.doc.setLineWidth(0.2)
  for (const part of sheet.placements) {
    const x = x0 + part.x * scale
    const y = y0 + part.y * scale
    const w = part.aMm * scale
    const h = part.bMm * scale
    pen.doc.rect(x, y, w, h)
    pen.doc.setFontSize(8)
    if (w > 12 && h > 6) pen.doc.text(part.id, x + 1, y + Math.min(4, h - 1))
  }
  pen.y = y0 + drawH + 4
  drawTable(
    pen,
    ["Código", "Peça", "X", "Y", "Corte na chapa"],
    [24, 48, 22, 22, CONTENT - 116],
    sheet.placements.map((part) => [
      part.id,
      `${part.name}${part.rotated ? " (girada)" : ""}`,
      formatNumber(part.x),
      formatNumber(part.y),
      `${formatNumber(part.aMm)} × ${formatNumber(part.bMm)} mm`,
    ]),
  )
}

function stampPages(doc: jsPDF): void {
  const total = doc.getNumberOfPages()
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(40)
    doc.text(
      `Oficina Clara  ·  confirme os valores [CONFIRMAR] antes de cortar  ·  ${page}/${total}`,
      MARGIN,
      PAGE_H - 8,
    )
  }
}

export function buildProjectPdf(project: FurnitureProject, now = new Date()): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true })
  doc.setProperties({
    title: `${project.projectName} — Oficina Clara`,
    subject: "Projeto de gaveteiro em MDF",
    author: "Oficina Clara",
    creator: "Oficina Clara",
  })
  const pen: Pen = { doc, y: 16 }
  const { input, derived } = project
  const when = now.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })

  paragraph(pen, "Oficina Clara", 12, "bold")
  paragraph(pen, project.projectName, 18, "bold")
  paragraph(
    pen,
    `Gaveteiro em MDF. Gerado em ${when}. A conta é determinística: a mesma entrada produz sempre estas peças.`,
    11,
  )
  paragraph(
    pen,
    "Antes de cortar, confirme com um marceneiro os valores marcados com [CONFIRMAR] em src/config/carpentry.ts. Este PDF não substitui um projeto executivo.",
    11,
    "bold",
  )
  gap(pen, 1)
  paragraph(
    pen,
    `Externas: ${formatMm(input.heightMm)} de altura × ${formatMm(input.widthMm)} de largura × ${formatMm(input.depthMm)} de profundidade. MDF ${formatMm(input.thicknessMm)}. Traseiro ${formatMm(input.backThicknessMm)}. ${input.drawerCount} gavetas. ${input.plinthEnabled ? `Roda-pé de ${formatMm(derived.plinthHeightMm)}.` : "Sem roda-pé."} ${project.slideLabel} de ${formatMm(derived.slideLengthMm)}.`,
    12,
  )
  paragraph(pen, project.construction, 11)
  for (const warning of project.warnings) paragraph(pen, warning, 11)
  gap(pen, 1)
  paragraph(pen, "Conta", 14, "bold")
  for (const line of project.calculations) paragraph(pen, line, 11)
  paragraph(
    pen,
    `Folga atrás da gaveta: ${formatMm(derived.rearClearanceMm)}. Centros das corrediças, do piso, começando pela gaveta de cima: ${derived.slideCenterFromFloorMm.map((value) => formatMm(value)).join(", ")}.`,
    11,
  )

  paragraph(pen, "Peças", 14, "bold")
  drawTable(
    pen,
    ["Peça", "Qtd", "Corte", "Fita"],
    [62, 16, 58, CONTENT - 136],
    project.groups.map((group) => [
      `${group.name} (${group.ids.join(", ")}). ${group.axisNote}. ${group.note}`,
      String(group.ids.length),
      formatCut(group.aMm, group.bMm, group.thicknessMm),
      group.edgeBandPerPieceMm > 0 ? formatMetersFromMm(group.edgeBandPerPieceMm) + " cada" : "sem fita",
    ]),
  )

  paragraph(pen, "Plano de corte", 14, "bold")
  paragraph(
    pen,
    `Kerf ${formatMm(input.kerfMm)}. Margem ${formatMm(input.sheetMarginMm)}. A linha tracejada é a margem. Peças de espessuras diferentes não compartilham chapa. O MDF pode girar.`,
    11,
  )
  for (const sheet of project.sheets) drawSheet(pen, sheet)

  paragraph(pen, "Materiais", 14, "bold")
  drawTable(
    pen,
    ["Item", "Qtd", "Detalhe"],
    [62, 28, CONTENT - 90],
    project.bom.map((line) => [
      line.item,
      `${line.quantityLabel} ${line.unit}`,
      line.includedWith ? `${line.detail} Incluso com: ${line.includedWith}.` : line.detail,
    ]),
  )

  paragraph(pen, "Montagem", 14, "bold")
  project.steps.forEach((step, index) => {
    paragraph(pen, `${index + 1}. ${step.title}`, 12, "bold")
    paragraph(pen, step.body, 11)
    if (step.pieces.length > 0) paragraph(pen, `Peças: ${step.pieces.join(", ")}.`, 10.5)
    if (step.hardware.length > 0) paragraph(pen, `Material desta etapa: ${step.hardware.join(", ")}.`, 10.5)
  })

  stampPages(doc)
  return doc
}

export function downloadProjectPdf(project: FurnitureProject): void {
  buildProjectPdf(project).save(pdfFileName(project))
}
