import type { FurnitureVisionProvider, VisionEstimate } from "./types"

/**
 * Contrato futuro, ainda desligado:
 *
 * POST {proxyUrl}
 *   Authorization: Bearer ${apiKey}   // a chave vem do campo da tela
 *   Content-Type: application/json
 *   {
 *     "model": "gemini-2.5-flash",
 *     "image": { "mediaType": "...", "data": "<base64>" },
 *     "prompt": "Estime altura, largura, profundidade e número de gavetas. Não invente espessura."
 *   }
 *
 * A resposta vira VisionEstimate. A tela mostra os números e só copia para o
 * formulário depois da confirmação. Nenhuma chave fica neste arquivo.
 */
export const geminiVisionProvider: FurnitureVisionProvider = {
  id: "gemini",
  available: false,
  estimate(): Promise<VisionEstimate> {
    return Promise.reject(new Error("Leitura por foto ainda não está disponível nesta versão."))
  },
}
