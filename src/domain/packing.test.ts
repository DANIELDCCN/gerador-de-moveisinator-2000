import { describe, expect, it } from "vitest"
import { findPackingProblems, packParts, type PackablePart } from "./packing"

function part(id: string, aMm: number, bMm: number, thicknessMm = 15): PackablePart {
  return { id, name: id, aMm, bMm, thicknessMm, material: `MDF ${thicknessMm}` }
}

describe("encaixe nas chapas", () => {
  it("separa peças com o kerf e não deixa sobrepor", () => {
    const result = packParts([part("A", 100, 50), part("B", 100, 50)], {
      sheetLengthMm: 300,
      sheetWidthMm: 100,
      kerfMm: 4,
      marginMm: 0,
    })
    expect(result.unplaced).toEqual([])
    expect(result.sheets).toHaveLength(1)
    expect(findPackingProblems(result.sheets)).toEqual([])
    const [first, second] = result.sheets[0]!.placements
    expect(first).toBeDefined()
    expect(second).toBeDefined()
  })

  it("gira a peça que só cabe deitada", () => {
    const result = packParts([part("R", 500, 100)], {
      sheetLengthMm: 200,
      sheetWidthMm: 600,
      kerfMm: 0,
      marginMm: 0,
    })
    expect(result.unplaced).toEqual([])
    expect(result.sheets[0]?.placements[0]).toMatchObject({
      rotated: true,
      aMm: 100,
      bMm: 500,
    })
    expect(findPackingProblems(result.sheets)).toEqual([])
  })

  it("abre outra chapa quando a primeira enche", () => {
    const result = packParts([part("A", 80, 80), part("B", 80, 80), part("C", 80, 80)], {
      sheetLengthMm: 100,
      sheetWidthMm: 100,
      kerfMm: 0,
      marginMm: 0,
    })
    expect(result.unplaced).toEqual([])
    expect(result.sheets).toHaveLength(3)
    expect(findPackingProblems(result.sheets)).toEqual([])
  })

  it("não mistura espessuras e devolve peça maior que a chapa", () => {
    const result = packParts([part("G", 50, 50, 15), part("F", 40, 40, 3), part("X", 500, 500, 15)], {
      sheetLengthMm: 200,
      sheetWidthMm: 200,
      kerfMm: 3,
      marginMm: 0,
    })
    expect(result.unplaced.map((item) => item.id)).toEqual(["X"])
    expect(result.sheets).toHaveLength(2)
    expect(new Set(result.sheets.map((sheet) => sheet.thicknessMm))).toEqual(new Set([15, 3]))
    expect(findPackingProblems(result.sheets)).toEqual([])
  })
})
