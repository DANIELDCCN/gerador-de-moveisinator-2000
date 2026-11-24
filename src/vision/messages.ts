export const VISION_MESSAGES = {
  noKey: "Informe sua chave do Gemini para ler a foto.",
  invalidKey: "A chave do Gemini foi recusada. Confira se ela está correta.",
  quota: "A cota gratuita do Gemini acabou por enquanto. Tente de novo mais tarde.",
  notFurniture: "Essa foto não parece um móvel. Envie a foto de um gaveteiro, armário ou peça parecida.",
  badResponse: "A leitura não veio num formato utilizável. Tente outra foto.",
  network: "Não foi possível falar com o Gemini. Verifique a conexão e tente de novo.",
  badImage: "A foto não pôde ser enviada. Use uma imagem JPG ou PNG.",
} as const

export type VisionErrorCode = "no-key" | "invalid-key" | "quota" | "not-furniture" | "bad-response" | "network" | "bad-image"

export class VisionError extends Error {
  readonly code: VisionErrorCode

  constructor(code: VisionErrorCode, message: string) {
    super(message)
    this.name = "VisionError"
    this.code = code
  }
}
