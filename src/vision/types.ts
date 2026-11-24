/**
 * A visão propõe a estimativa principal. A pessoa pode editar cada campo e desfazer.
 * O motor em src/domain nunca importa este módulo.
 * Nenhuma chave de API fica neste arquivo.
 */

export interface GeminiFurnitureReading {
  isFurniture: boolean
  furnitureType: string
  drawerCount: number | null
  doorCount: number | null
  /** Números relativos, não milímetros. */
  proportions: { height: number; width: number; depth: number } | null
  /** 0 a 1. */
  confidence: number | null
  notes: string
}

export interface VisionRequest {
  imageBase64: string
  mediaType: string
  /** Chave digitada pela pessoa. Não gravar no repositório. */
  apiKey: string
}
