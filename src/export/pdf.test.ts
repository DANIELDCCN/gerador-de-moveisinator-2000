import { describe, expect, it } from "vitest"
import { generateProject } from "../domain/project"
import { SAMPLE_INPUT } from "../domain/sample"
import { buildProjectPdf, pdfFileName } from "./pdf"

describe("PDF", () => {
  it("gera um arquivo do exemplo", () => {
    const result = generateProject(SAMPLE_INPUT)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const doc = buildProjectPdf(result.project, new Date("2026-01-15T12:00:00Z"))
    const buffer = doc.output("arraybuffer")
    expect(buffer.byteLength).toBeGreaterThan(4_000)
    expect(pdfFileName(result.project)).toBe("comoda-de-4-gavetas.pdf")
  })
})