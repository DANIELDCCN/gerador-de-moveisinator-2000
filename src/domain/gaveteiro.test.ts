import { describe, expect, it } from "vitest"
import carpentrySource from "../config/carpentry.ts?raw"
import { CARPENTRY } from "../config/carpentry"
import { referenceCatalog } from "../config/carpentry"
import { parseForm, sampleForm } from "../form/parse"
import { formPatchFromEstimate } from "../vision/apply"
import { generateProject } from "./project"
import { findPackingProblems } from "./packing"
import { SAMPLE_INPUT } from "./sample"

function projectOf(input = SAMPLE_INPUT, config = CARPENTRY) {
  const result = generateProject(input, config)
  if (!result.ok) {
    throw new Error(result.errors.map((error) => error.message).join(" "))
  }
  return result.project
}

describe("gaveteiro 900 × 600 × 450, 4 gavetas, MDF 15", () => {
  const project = projectOf()

  it("desconta espessura, folga e corrediça", () => {
    expect(project.derived.sideDepthMm).toBe(447)
    expect(project.derived.innerWidthMm).toBe(570)
    expect(project.derived.openingHeightMm).toBe(790)
    expect(project.derived.frontWidthMm).toBe(564)
    expect(project.derived.frontHeightMm).toBeCloseTo(193.75, 5)
    expect(project.derived.boxOuterWidthMm).toBe(545)
    expect(project.derived.boxInnerWidthMm).toBe(515)
    expect(project.derived.boxHeightMm).toBeCloseTo(173.75, 5)
    expect(project.derived.slideLengthMm).toBe(400)
    expect(project.derived.maxSlideLengthMm).toBe(427)
    expect(project.derived.boxInnerDepthMm).toBe(370)
    expect(project.derived.backWidthMm).toBe(600)
    expect(project.derived.backHeightMm).toBe(820)
    expect(project.derived.plinthRailLengthMm).toBe(397)
    expect(project.derived.slideCenterFromFloorMm[0]).toBeCloseTo(785.125, 3)
  })

  it("gera peças positivas que cabem no móvel", () => {
    expect(project.parts.length).toBe(33)
    const envelope = Math.max(SAMPLE_INPUT.heightMm, SAMPLE_INPUT.widthMm, SAMPLE_INPUT.depthMm)
    for (const part of project.parts) {
      expect(part.aMm).toBeGreaterThan(0)
      expect(part.bMm).toBeGreaterThan(0)
      expect(part.thicknessMm).toBeGreaterThan(0)
      expect(part.aMm).toBeLessThanOrEqual(envelope + 0.01)
      expect(part.bMm).toBeLessThanOrEqual(envelope + 0.01)
    }
    const side = project.parts.find((part) => part.id === "L1")
    expect(side).toMatchObject({ aMm: 900, bMm: 447, thicknessMm: 15 })
    const fronts = project.parts.filter((part) => part.role === "drawer-front")
    expect(fronts).toHaveLength(4)
    expect(fronts.every((part) => part.aMm < SAMPLE_INPUT.widthMm && part.bMm < SAMPLE_INPUT.heightMm)).toBe(true)
  })

  it("fecha a conta da fita e da lista de materiais", () => {
    const raw = project.parts.reduce((sum, part) => sum + part.edgeBandMm, 0)
    expect(raw).toBeCloseTo(13096, 2)
    expect(project.edgeBand.rawMm).toBeCloseTo(raw, 5)
    expect(project.edgeBand.purchaseMeters).toBeGreaterThan(raw / 1000)
    const slides = project.bom.find((line) => line.id === "slides")
    expect(slides).toMatchObject({ quantity: 4, unit: "pares" })
    const handles = project.bom.find((line) => line.id === "handles")
    expect(handles?.quantity).toBe(4)
    const washers = project.bom.find((line) => line.id === "washers")
    expect(washers?.quantity).toBe(8)
    const glue = project.bom.find((line) => line.id === "glue")
    expect(glue?.quantity).toBeGreaterThanOrEqual(1)
    expect(project.steps.length).toBeGreaterThanOrEqual(8)
    expect(project.calculations.some((line) => line.includes("447"))).toBe(true)
  })

  it("encaixa as peças sem sobreposição e com poucas chapas", () => {
    expect(findPackingProblems(project.sheets)).toEqual([])
    const placed = project.sheets.reduce((sum, sheet) => sum + sheet.placements.length, 0)
    expect(placed).toBe(project.parts.length)
    const thick = project.sheets.filter((sheet) => sheet.thicknessMm === 15)
    const thin = project.sheets.filter((sheet) => sheet.thicknessMm === 3)
    expect(thick.length).toBeGreaterThanOrEqual(1)
    expect(thick.length).toBeLessThanOrEqual(3)
    expect(thin.length).toBe(1)
    for (const sheet of project.sheets) {
      const thicknesses = new Set(sheet.placements.map((part) => part.thicknessMm))
      expect(thicknesses.size).toBe(1)
    }
  })
})

describe("validação", () => {
  it("recusa corrediça maior que o vão", () => {
    const result = generateProject({ ...SAMPLE_INPUT, slideLengthMm: 550 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.some((error) => error.field === "slideLengthMm")).toBe(true)
  })

  it("recusa gavetas demais para a altura", () => {
    const result = generateProject({
      ...SAMPLE_INPUT,
      heightMm: 350,
      drawerCount: 4,
    })
    expect(result.ok).toBe(false)
  })

  it("aceita 18 mm sem roda-pé", () => {
    const result = generateProject({
      ...SAMPLE_INPUT,
      heightMm: 800,
      widthMm: 500,
      depthMm: 400,
      thicknessMm: 18,
      backThicknessMm: 6,
      drawerCount: 3,
      plinthEnabled: false,
    })
    expect(result.ok).toBe(true)
  })

  it("troca a lista para minifix quando o arquivo pede", () => {
    const project = projectOf(SAMPLE_INPUT, { ...CARPENTRY, cornerFastener: "minifix" })
    expect(project.bom.some((line) => line.id === "minifix")).toBe(true)
    expect(project.bom.some((line) => line.id === "dowels")).toBe(true)
  })
})

describe("formulário e referências", () => {
  it("o exemplo da tela é o mesmo da conta", () => {
    const parsed = parseForm(sampleForm())
    expect(parsed.errors).toEqual([])
    expect(parsed.input).toEqual(SAMPLE_INPUT)
  })

  it("marca os valores de referência para confirmação", () => {
    const markers = carpentrySource.match(/\[CONFIRMAR\]/g) ?? []
    expect(markers.length).toBeGreaterThanOrEqual(40)
    for (const entry of referenceCatalog()) {
      expect(entry.why).toContain("[CONFIRMAR]")
    }
  })

  it("a visão só preenche o que estimou", () => {
    expect(formPatchFromEstimate({ notes: "só um palpite", drawerCount: 3 })).toEqual({
      drawerCount: "3",
    })
    expect(formPatchFromEstimate({ notes: "vazio" })).toEqual({})
  })
})
