import { describe, expect, it } from "vitest"
import readingSource from "./reading.ts?raw"
import geminiSource from "./gemini.ts?raw"
import { VISION_MESSAGES } from "./messages"
import {
  mergePhotoReading,
  photoFieldsAfterAnalysis,
  photoFieldsAfterEdit,
  type KnownMeasurements,
} from "./merge"
import { GEMINI_ENDPOINT, messageForGeminiFailure, parseGeminiReading, readFurniturePhoto } from "./reading"
import type { GeminiFurnitureReading } from "./types"

const chest: GeminiFurnitureReading = {
  isFurniture: true,
  furnitureType: "gaveteiro",
  drawerCount: 4,
  doorCount: 0,
  proportions: { height: 2, width: 1, depth: 0.5 },
  confidence: 0.8,
  notes: "Quatro gavetas empilhadas.",
}

function known(partial: {
  heightMm?: number | null
  widthMm?: number | null
  depthMm?: number | null
  drawerCount?: number | null
  occupied?: Partial<KnownMeasurements["occupied"]>
  raw?: Partial<KnownMeasurements["raw"]>
} = {}): KnownMeasurements {
  const heightMm = partial.heightMm ?? null
  const widthMm = partial.widthMm ?? null
  const depthMm = partial.depthMm ?? null
  const drawerCount = partial.drawerCount ?? null
  return {
    heightMm,
    widthMm,
    depthMm,
    drawerCount,
    raw: {
      height: partial.raw?.height ?? (heightMm == null ? "" : String(heightMm)),
      width: partial.raw?.width ?? (widthMm == null ? "" : String(widthMm)),
      depth: partial.raw?.depth ?? (depthMm == null ? "" : String(depthMm)),
      drawers: partial.raw?.drawers ?? (drawerCount == null ? "" : String(drawerCount)),
    },
    occupied: { height: false, width: false, depth: false, drawers: false, ...partial.occupied },
  }
}

describe("junção da foto com o formulário", () => {
  it("substitui o exemplo ou o que foi digitado e lista só o que mudou de valor", () => {
    const result = mergePhotoReading(
      known({
        heightMm: 900,
        widthMm: 600,
        depthMm: 450,
        drawerCount: 4,
        occupied: { height: true, width: true, depth: true, drawers: true },
      }),
      chest,
    )
    // escalas 450, 600 e 900; média 650 → 1300 × 650 × 325
    expect(result.patch).toEqual({ heightMm: "1300", widthMm: "650", depthMm: "325", drawerCount: "4" })
    expect(result.needsAnchor).toBe(false)
    expect(result.changes.filter((change) => change.changed).map((change) => change.field)).toEqual([
      "heightMm",
      "widthMm",
      "depthMm",
    ])
    expect(result.changes.find((change) => change.field === "heightMm")).toMatchObject({
      previous: "900",
      next: "1300",
      changed: true,
    })
    expect(result.changes.find((change) => change.field === "drawerCount")?.changed).toBe(false)
    expect(result.lines.find((line) => line.id === "height")?.applied).toBe(true)
    expect(result.lines.every((line) => line.text.toLowerCase().includes("estimativa"))).toBe(true)
  })

  it("completa largura e profundidade a partir da altura e regrava a âncora", () => {
    const result = mergePhotoReading(known({ heightMm: 1000, occupied: { height: true } }), chest)
    expect(result.patch).toEqual({ heightMm: "1000", widthMm: "500", depthMm: "250", drawerCount: "4" })
    expect(result.needsAnchor).toBe(false)
    expect(result.changes.find((change) => change.field === "heightMm")?.changed).toBe(false)
    expect(result.changes.find((change) => change.field === "widthMm")).toMatchObject({
      previous: "",
      next: "500",
      changed: true,
    })
    expect(result.lines.find((line) => line.id === "width")?.text).toContain("estimativa")
    expect(result.lines.find((line) => line.id === "height")?.applied).toBe(true)
  })

  it("reescreve as medidas usadas na média quando duas proporções discordam", () => {
    const result = mergePhotoReading(
      known({
        heightMm: 1000,
        widthMm: 600,
        occupied: { height: true, width: true },
      }),
      chest,
    )
    // escala da altura = 500, escala da largura = 600, média = 550
    expect(result.patch).toEqual({ heightMm: "1100", widthMm: "550", depthMm: "275", drawerCount: "4" })
    expect(result.changes.find((change) => change.field === "depthMm")).toMatchObject({ previous: "", next: "275" })
  })

  it("não inventa milímetro sem nenhuma medida válida", () => {
    const result = mergePhotoReading(known(), chest)
    expect(result.needsAnchor).toBe(true)
    expect(result.patch.heightMm).toBeUndefined()
    expect(result.patch.widthMm).toBeUndefined()
    expect(result.patch.depthMm).toBeUndefined()
    expect(result.patch.drawerCount).toBe("4")
    expect(result.lines.find((line) => line.id === "height")?.text).toContain("estimativa")
    expect(result.lines.find((line) => line.id === "height")?.applied).toBe(false)
  })

  it("não apaga altura inválida sem escala e substitui gaveta que não é número", () => {
    const result = mergePhotoReading(
      known({
        occupied: { height: true, drawers: true },
        raw: { height: "alto", drawers: "muitas" },
      }),
      chest,
    )
    expect(result.patch.heightMm).toBeUndefined()
    expect(result.patch.drawerCount).toBe("4")
    expect(result.changes.find((change) => change.field === "drawerCount")).toMatchObject({
      previous: "muitas",
      next: "4",
      changed: true,
    })
  })

  it("substitui o número de gavetas digitado", () => {
    const result = mergePhotoReading(
      known({
        heightMm: 1000,
        drawerCount: 2,
        occupied: { height: true, drawers: true },
      }),
      chest,
    )
    expect(result.patch.drawerCount).toBe("4")
    expect(result.changes.find((change) => change.field === "drawerCount")).toMatchObject({
      previous: "2",
      next: "4",
      changed: true,
    })
  })

  it("não preenche gaveta fora do limite do formulário", () => {
    const result = mergePhotoReading(
      known({ drawerCount: 4, occupied: { drawers: true } }),
      { ...chest, drawerCount: 12 },
    )
    expect(result.patch.drawerCount).toBeUndefined()
    expect(result.lines.find((line) => line.id === "drawers")?.applied).toBe(false)
    expect(result.lines.find((line) => line.id === "drawers")?.text).toContain("estimativa")
  })

  it("tira a marca da foto só do campo editado e não reaplica sozinho", () => {
    expect(photoFieldsAfterEdit(["heightMm", "widthMm", "drawerCount"], { heightMm: "800" })).toEqual([
      "widthMm",
      "drawerCount",
    ])
    expect(photoFieldsAfterEdit(["heightMm"], { projectName: "Cômoda" })).toEqual(["heightMm"])
  })

  it("nova análise marca o que ela escreveu e conserva a marca no resto", () => {
    expect(photoFieldsAfterAnalysis(["heightMm", "widthMm"], { drawerCount: "4" })).toEqual([
      "heightMm",
      "widthMm",
      "drawerCount",
    ])
    expect(photoFieldsAfterAnalysis(["heightMm", "drawerCount"], { heightMm: "1300", widthMm: "650" })).toEqual([
      "drawerCount",
      "heightMm",
      "widthMm",
    ])
  })
})

describe("resposta simulada do Gemini", () => {
  it("lê o JSON do modelo e marca a palavra estimativa na junção", () => {
    const reading = parseGeminiReading({
      candidates: [
        {
          content: {
            parts: [
              { thought: true, text: "rascunho interno" },
              { text: JSON.stringify({
                isFurniture: true,
                furnitureType: "cômoda",
                drawerCount: 3,
                doorCount: 1,
                proportionHeight: 3,
                proportionWidth: 2,
                proportionDepth: 1,
                confidence: 70,
                notes: "Parece uma cômoda.",
              }) },
            ],
          },
        },
      ],
    })
    expect(reading.confidence).toBeCloseTo(0.7)
    expect(reading.doorCount).toBe(1)
    const merged = mergePhotoReading(known({ heightMm: 900, occupied: { height: true } }), reading)
    expect(merged.patch.widthMm).toBe("600")
    expect(merged.patch.depthMm).toBe("300")
    expect(merged.lines.every((line) => line.text.toLowerCase().includes("estimativa"))).toBe(true)
  })

  it("recusa foto que não é móvel, chave inválida e cota esgotada", async () => {
    await expect(
      readFurniturePhoto(
        { apiKey: "chave-de-teste", imageBase64: "abc", mediaType: "image/jpeg" },
        async () =>
          jsonResponse({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        isFurniture: false,
                        furnitureType: "outro",
                        drawerCount: 0,
                        doorCount: 0,
                        proportionHeight: 1,
                        proportionWidth: 1,
                        proportionDepth: 1,
                        confidence: 0.2,
                        notes: "É uma xícara.",
                      }),
                    },
                  ],
                },
              },
            ],
          }),
      ),
    ).rejects.toThrow(VISION_MESSAGES.notFurniture)

    expect(messageForGeminiFailure(400, { error: { status: "INVALID_ARGUMENT", message: "API key not valid" } })).toBe(
      VISION_MESSAGES.invalidKey,
    )
    expect(messageForGeminiFailure(429, { error: { status: "RESOURCE_EXHAUSTED", message: "Quota exceeded" } })).toBe(
      VISION_MESSAGES.quota,
    )
    await expect(readFurniturePhoto({ apiKey: "  ", imageBase64: "abc", mediaType: "image/jpeg" }, fetch)).rejects.toThrow(
      VISION_MESSAGES.noKey,
    )
  })

  it("envia a chave só no cabeçalho e não no corpo", async () => {
    let header = ""
    let body = ""
    let url = ""
    await readFurniturePhoto(
      { apiKey: "chave-de-teste", imageBase64: "abc", mediaType: "image/png" },
      async (input, init) => {
        url = String(input)
        header = new Headers(init?.headers).get("x-goog-api-key") ?? ""
        body = String(init?.body ?? "")
        return jsonResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      isFurniture: true,
                      furnitureType: "gaveteiro",
                      drawerCount: 2,
                      doorCount: 0,
                      proportionHeight: 1,
                      proportionWidth: 1,
                      proportionDepth: 1,
                      confidence: 0.5,
                      notes: "ok",
                    }),
                  },
                ],
              },
            },
          ],
        })
      },
    )
    expect(url).toBe(GEMINI_ENDPOINT)
    expect(header).toBe("chave-de-teste")
    expect(body).not.toContain("chave-de-teste")
    expect(readingSource).not.toMatch(/AIza[0-9A-Za-z_-]{10,}/)
    expect(geminiSource).not.toMatch(/AIza[0-9A-Za-z_-]{10,}/)
  })
})

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
}
