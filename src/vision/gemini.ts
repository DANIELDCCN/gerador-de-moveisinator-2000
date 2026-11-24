import { readFurniturePhoto } from "./reading"
import type { GeminiFurnitureReading, VisionRequest } from "./types"

export interface FurnitureVisionProvider {
  readonly id: "gemini"
  readonly available: true
  estimate(request: VisionRequest): Promise<GeminiFurnitureReading>
}

/** Leitura ligada. A chave vem da tela e segue no cabeçalho, nunca neste arquivo. */
export const geminiVisionProvider: FurnitureVisionProvider = {
  id: "gemini",
  available: true,
  estimate(request) {
    return readFurniturePhoto(request)
  },
}
