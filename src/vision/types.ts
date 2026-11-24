/**
 * A etapa de visão só sugere medidas. Quem confirma é a pessoa.
 * O motor em src/domain nunca importa este módulo.
 */

export interface VisionEstimate {
  heightMm?: number
  widthMm?: number
  depthMm?: number
  drawerCount?: number
  notes: string
}

export interface VisionRequest {
  imageBase64: string
  mediaType: string
  /**
   * Chave digitada na hora, no navegador. Não gravar em código, arquivo ou
   * localStorage. Um proxy pequeno deve receber a chamada; o app estático
   * não deve embutir segredo.
   */
  apiKey: string
  /** URL do proxy informada pela pessoa. Vazia neste MVP. */
  proxyUrl: string
}

export interface FurnitureVisionProvider {
  readonly id: "gemini"
  /** Ligado só quando a chamada existir de verdade. */
  readonly available: boolean
  estimate(request: VisionRequest): Promise<VisionEstimate>
}
