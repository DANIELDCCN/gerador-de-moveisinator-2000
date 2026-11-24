import { VISION_MESSAGES, VisionError } from "./messages"
import type { GeminiFurnitureReading } from "./types"

/** Modelo gratuito atual com leitura de imagem. O 2.5 Flash deixa de ser opção nova em 1º/12/2026. */
export const GEMINI_MODEL = "gemini-3.5-flash-lite"

export const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const PHOTO_SCHEMA = {
  type: "OBJECT",
  properties: {
    isFurniture: { type: "BOOLEAN" },
    furnitureType: { type: "STRING" },
    drawerCount: { type: "INTEGER" },
    doorCount: { type: "INTEGER" },
    proportionHeight: { type: "NUMBER" },
    proportionWidth: { type: "NUMBER" },
    proportionDepth: { type: "NUMBER" },
    confidence: { type: "NUMBER" },
    notes: { type: "STRING" },
  },
  required: [
    "isFurniture",
    "furnitureType",
    "drawerCount",
    "doorCount",
    "proportionHeight",
    "proportionWidth",
    "proportionDepth",
    "confidence",
    "notes",
  ],
} as const

const PROMPT = [
  "Olhe a foto e descreva só o que dá para ver.",
  "Não invente milímetros e não calcule um projeto.",
  "Se não for um móvel, isFurniture=false.",
  "furnitureType em português curto: gaveteiro, cômoda, armário, estante ou outro.",
  "drawerCount e doorCount são inteiros visíveis. Use 0 se não houver.",
  "proportionHeight, proportionWidth e proportionDepth são a proporção relativa entre altura, largura e profundidade. Não são milímetros. Use números positivos.",
  "confidence vai de 0 a 1.",
  "notes em uma frase, em português.",
].join(" ")

interface GeminiErrorBody {
  error?: { code?: number; message?: string; status?: string }
}

interface GeminiSuccessBody {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> }
  }>
}

export function messageForGeminiFailure(status: number, body: unknown): string {
  const error = isErrorBody(body) ? body.error : undefined
  const blob = `${error?.status ?? ""} ${error?.message ?? ""}`.toLowerCase()
  if (status === 429 || blob.includes("resource_exhausted") || blob.includes("quota")) return VISION_MESSAGES.quota
  if (
    status === 401 ||
    status === 403 ||
    blob.includes("api key") ||
    blob.includes("api_key") ||
    blob.includes("permission")
  ) {
    return VISION_MESSAGES.invalidKey
  }
  if (status === 400 && (blob.includes("image") || blob.includes("mime") || blob.includes("inline"))) {
    return VISION_MESSAGES.badImage
  }
  if (status === 400 && blob.includes("key")) return VISION_MESSAGES.invalidKey
  return VISION_MESSAGES.badResponse
}

export function parseGeminiReading(body: unknown): GeminiFurnitureReading {
  const text = textFromBody(body)
  if (!text) throw new VisionError("bad-response", VISION_MESSAGES.badResponse)
  let parsed: unknown
  try {
    parsed = JSON.parse(stripFence(text))
  } catch {
    throw new VisionError("bad-response", VISION_MESSAGES.badResponse)
  }
  if (!parsed || typeof parsed !== "object") throw new VisionError("bad-response", VISION_MESSAGES.badResponse)
  const record = parsed as Record<string, unknown>
  const proportions = readProportions(record)
  return {
    isFurniture: record.isFurniture === true,
    furnitureType: typeof record.furnitureType === "string" ? record.furnitureType.trim() : "",
    drawerCount: readCount(record.drawerCount),
    doorCount: readCount(record.doorCount),
    proportions,
    confidence: readConfidence(record.confidence),
    notes: typeof record.notes === "string" ? record.notes.trim() : "",
  }
}

export async function readFurniturePhoto(
  request: { apiKey: string; imageBase64: string; mediaType: string },
  fetchImpl: typeof fetch = fetch,
): Promise<GeminiFurnitureReading> {
  const apiKey = request.apiKey.trim()
  if (!apiKey) throw new VisionError("no-key", VISION_MESSAGES.noKey)
  if (!request.imageBase64 || !request.mediaType.startsWith("image/")) {
    throw new VisionError("bad-image", VISION_MESSAGES.badImage)
  }

  let response: Response
  try {
    response = await fetchImpl(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: PROMPT },
              { inlineData: { mimeType: request.mediaType, data: request.imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: PHOTO_SCHEMA,
        },
      }),
    })
  } catch {
    throw new VisionError("network", VISION_MESSAGES.network)
  }

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = messageForGeminiFailure(response.status, body)
    const code = message === VISION_MESSAGES.quota ? "quota" : message === VISION_MESSAGES.invalidKey ? "invalid-key" : message === VISION_MESSAGES.badImage ? "bad-image" : "bad-response"
    throw new VisionError(code, message)
  }

  const reading = parseGeminiReading(body)
  if (!reading.isFurniture) throw new VisionError("not-furniture", VISION_MESSAGES.notFurniture)
  return reading
}

function isErrorBody(body: unknown): body is GeminiErrorBody {
  return Boolean(body && typeof body === "object" && "error" in body)
}

function textFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("candidates" in body)) return null
  const parts = (body as GeminiSuccessBody).candidates?.[0]?.content?.parts ?? []
  const texts = parts.filter((part) => part.text && part.thought !== true).map((part) => part.text ?? "")
  return texts.length ? texts[texts.length - 1] : null
}

function stripFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
}

function readCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  const count = Math.round(value)
  if (count < 0 || count > 30) return null
  return count
}

function readConfidence(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  if (value > 1 && value <= 100) return value / 100
  if (value < 0 || value > 1) return null
  return value
}

function readProportions(record: Record<string, unknown>): GeminiFurnitureReading["proportions"] {
  const height = positive(record.proportionHeight)
  const width = positive(record.proportionWidth)
  const depth = positive(record.proportionDepth)
  if (height == null || width == null || depth == null) return null
  return { height, width, depth }
}

function positive(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null
  return value
}
