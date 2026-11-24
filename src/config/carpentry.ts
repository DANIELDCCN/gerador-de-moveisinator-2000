/**
 * Valores de referência da marcenaria.
 *
 * O motor só lê este arquivo. Não há medida calculada por modelo de IA.
 * Cada item precisa ser conferido por um marceneiro antes de cortar MDF de verdade.
 * Procure por [CONFIRMAR]. A tela lista os mesmos itens.
 */

export type CornerFastener = "parafuso" | "minifix"
export type FrontStyle = "embutida"

export interface SlideTypeOption {
  id: string
  label: string
}

export interface CarpentryConfig {
  /** Texto curto do sistema construtivo usado pelo motor. */
  constructionSummary: string
  frontStyle: FrontStyle
  cornerFastener: CornerFastener
  slideTypes: readonly SlideTypeOption[]
  standardSlideLengthsMm: readonly number[]
  allowedPanelThicknessMm: readonly number[]
  allowedBackThicknessMm: readonly number[]
  slideClearancePerSideMm: number
  drawerGapMm: number
  minDrawerFrontHeightMm: number
  drawerBoxHeightReductionMm: number
  minDrawerBoxHeightMm: number
  /** O fundo da gaveta usa a mesma chapa fina do painel traseiro. */
  drawerBottomUsesBackThickness: boolean
  /** A lateral da gaveta tem o comprimento comercial da corrediça. */
  drawerSideLengthEqualsSlide: boolean
  plinthSetbackMm: number
  defaultPlinthHeightMm: number
  drawerRearGapMm: number
  /** A frente embutida ocupa espessura dentro do vão, antes da caixa. */
  insetFrontConsumesDepth: boolean
  screwSpacingMm: number
  minScrewsPerJoint: number
  screwsPerDrawerCorner: number
  screwsPerDrawerFront: number
  screwsPerDrawerBottom: number
  /** Quantidade típica que já vem no par; entra na lista como item incluso. */
  screwsPerSlide: number
  screwsPerHandle: number
  washersPerHandle: number
  doubleHandleWidthMm: number
  backScrewSpacingMm: number
  minBackScrews: number
  plinthScrewsPerCorner: number
  minifixPerCorner: number
  dowelsPerCorner: number
  glueGramsPerMeter: number
  glueBottleGrams: number
  edgeBandingWasteFactor: number
  edgeBandWidthUpTo15Mm: number
  edgeBandWidthAbove15Mm: number
  bandSideFrontEdge: boolean
  bandSideTopEdge: boolean
  bandTopFrontEdge: boolean
  bandBottomFrontEdge: boolean
  bandDrawerFrontPerimeter: boolean
  bandDrawerSideTopEdges: boolean
  defaultKerfMm: number
  defaultSheetMarginMm: number
  defaultSheetLengthMm: number
  defaultSheetWidthMm: number
  carcassScrewLabel: string
  drawerScrewLabel: string
  backScrewLabel: string
  handleScrewLabel: string
  minPartMm: number
  minHeightMm: number
  maxHeightMm: number
  minWidthMm: number
  maxWidthMm: number
  minDepthMm: number
  maxDepthMm: number
  minDrawers: number
  maxDrawers: number
  minPlinthMm: number
  maxPlinthMm: number
  maxKerfMm: number
  maxDrawerGapMm: number
  maxSlideClearancePerSideMm: number
  maxSheetMarginMm: number
}

export const CARPENTRY: CarpentryConfig = {
  // Laterais inteiras, topo e base entre elas, traseiro pregado por trás, frente embutida.
  // [CONFIRMAR]
  constructionSummary:
    "Laterais inteiras, do piso ao topo. Topo e base entram entre as laterais. O painel traseiro é fino e vai pregado por trás, cobrindo as bordas traseiras. As frentes de gaveta são embutidas no vão. A caixa da gaveta tem laterais no comprimento da corrediça; a frente e a contrafrente entram entre essas laterais; o fundo fica solto por dentro.",

  // Frente embutida: a folga aparece em volta da frente, dentro do vão.
  // [CONFIRMAR]
  frontStyle: "embutida",

  // Cantos da caixa (topo e base nas laterais). Gaveta continua com parafuso.
  // [CONFIRMAR]
  cornerFastener: "parafuso",

  // Tipos oferecidos na tela. A folga numérica é a de slideClearancePerSideMm.
  // [CONFIRMAR]
  slideTypes: [
    { id: "telescopica-lateral", label: "Telescópica lateral" },
    { id: "telescopica-extracao-total", label: "Telescópica de extração total" },
  ],

  // Comprimentos que se encontram para comprar, em mm.
  // [CONFIRMAR]
  standardSlideLengthsMm: [250, 300, 350, 400, 450, 500, 550],

  // Espessuras de MDF da caixa e das frentes.
  // [CONFIRMAR]
  allowedPanelThicknessMm: [15, 18],

  // Espessuras do painel traseiro e do fundo da gaveta.
  // [CONFIRMAR]
  allowedBackThicknessMm: [3, 6],

  // Folga entre a lateral da caixa e a lateral da gaveta, de cada lado.
  // [CONFIRMAR]
  slideClearancePerSideMm: 12.5,

  // Folga em volta das frentes embutidas, inclusive entre uma gaveta e outra.
  // [CONFIRMAR]
  drawerGapMm: 3,

  // Abaixo disso a frente deixa de ser uma gaveta usável.
  // [CONFIRMAR]
  minDrawerFrontHeightMm: 60,

  // A caixa fica mais baixa que a frente para não raspar na gaveta vizinha.
  // [CONFIRMAR]
  drawerBoxHeightReductionMm: 20,

  // Altura mínima da caixa da gaveta.
  // [CONFIRMAR]
  minDrawerBoxHeightMm: 40,

  // Evita uma terceira espessura de chapa neste MVP.
  // [CONFIRMAR]
  drawerBottomUsesBackThickness: true,

  // Corrediça telescópica: o lado da gaveta acompanha o comprimento nominal.
  // [CONFIRMAR]
  drawerSideLengthEqualsSlide: true,

  // Quanto o roda-pé recua em relação à frente, para o pé entrar.
  // [CONFIRMAR]
  plinthSetbackMm: 20,

  // Altura inicial do roda-pé quando a opção está ligada.
  // [CONFIRMAR]
  defaultPlinthHeightMm: 80,

  // Espaço mínimo entre o fundo da caixa da gaveta e o painel traseiro.
  // [CONFIRMAR]
  drawerRearGapMm: 5,

  // A espessura da frente conta dentro da profundidade útil.
  // [CONFIRMAR]
  insetFrontConsumesDepth: true,

  // Distância média entre parafusos numa junta longa da caixa.
  // [CONFIRMAR]
  screwSpacingMm: 150,

  // Mínimo de parafusos mesmo numa junta curta.
  // [CONFIRMAR]
  minScrewsPerJoint: 4,

  // Parafusos em cada canto da caixa da gaveta (lateral contra frente ou contrafrente).
  // [CONFIRMAR]
  screwsPerDrawerCorner: 2,

  // Parafusos que prendem a frente decorativa por dentro da caixa.
  // [CONFIRMAR]
  screwsPerDrawerFront: 4,

  // Parafusos do fundo da gaveta, pelo interior.
  // [CONFIRMAR]
  screwsPerDrawerBottom: 6,

  // Parafusos de fixação da corrediça (metade na caixa, metade na gaveta), em geral inclusos.
  // [CONFIRMAR]
  screwsPerSlide: 8,

  // Parafusos ou porcas do puxador, em geral inclusos com a peça.
  // [CONFIRMAR]
  screwsPerHandle: 2,

  // Arruelas do puxador.
  // [CONFIRMAR]
  washersPerHandle: 2,

  // Largura de frente a partir da qual entram dois puxadores.
  // [CONFIRMAR]
  doubleHandleWidthMm: 700,

  // Espaçamento dos parafusos no perímetro do painel traseiro.
  // [CONFIRMAR]
  backScrewSpacingMm: 120,

  // Mínimo de parafusos do painel traseiro.
  // [CONFIRMAR]
  minBackScrews: 8,

  // Parafusos em cada canto do quadro do roda-pé.
  // [CONFIRMAR]
  plinthScrewsPerCorner: 2,

  // Se o canto da caixa for minifix, quantos conjuntos por canto.
  // [CONFIRMAR]
  minifixPerCorner: 2,

  // Cavilhas que acompanham cada canto com minifix.
  // [CONFIRMAR]
  dowelsPerCorner: 2,

  // Cola PVA branca por metro linear de junta.
  // [CONFIRMAR]
  glueGramsPerMeter: 15,

  // Frasco de referência para arredondar a compra.
  // [CONFIRMAR]
  glueBottleGrams: 250,

  // Sobra de compra da fita de borda. 1,1 = 10%.
  // [CONFIRMAR]
  edgeBandingWasteFactor: 1.1,

  // Largura de fita para chapa de até 15 mm (rolo comum de 19 mm).
  // [CONFIRMAR]
  edgeBandWidthUpTo15Mm: 19,

  // Largura de fita para chapa de 18 mm (rolo comum de 22 mm).
  // [CONFIRMAR]
  edgeBandWidthAbove15Mm: 22,

  // Borda dianteira da lateral, visível na fachada.
  // [CONFIRMAR]
  bandSideFrontEdge: true,

  // Topo da lateral, visível porque o tampo entra entre as laterais.
  // [CONFIRMAR]
  bandSideTopEdge: true,

  // Borda dianteira do tampo.
  // [CONFIRMAR]
  bandTopFrontEdge: true,

  // Borda dianteira da base, visível acima do roda-pé.
  // [CONFIRMAR]
  bandBottomFrontEdge: true,

  // As quatro bordas de cada frente.
  // [CONFIRMAR]
  bandDrawerFrontPerimeter: true,

  // Borda superior da lateral da gaveta, visível com a gaveta aberta.
  // [CONFIRMAR]
  bandDrawerSideTopEdges: true,

  // Largura do dente da serra entre peças no plano de corte.
  // [CONFIRMAR]
  defaultKerfMm: 3,

  // Margem interna da chapa, longe da borda de fábrica.
  // [CONFIRMAR]
  defaultSheetMarginMm: 10,

  // Comprimento da chapa padrão, em mm.
  // [CONFIRMAR]
  defaultSheetLengthMm: 2750,

  // Largura da chapa padrão, em mm.
  // [CONFIRMAR]
  defaultSheetWidthMm: 1850,

  // Parafuso que entra pela face da lateral e morde o topo ou a base.
  // [CONFIRMAR]
  carcassScrewLabel: "4 × 40 mm",

  // Parafuso da caixa da gaveta: atravessa 15 mm e não pode furar a frente.
  // [CONFIRMAR]
  drawerScrewLabel: "3,5 × 25 mm",

  // Parafuso curto do traseiro fino, mordendo a borda de 15 ou 18 mm.
  // [CONFIRMAR]
  backScrewLabel: "3,5 × 16 mm",

  // Parafuso do puxador; o modelo comprado pode trazer outro.
  // [CONFIRMAR]
  handleScrewLabel: "4 × 25 mm",

  // Menor peça que o plano aceita. Abaixo disso a peça não se corta com folga.
  // [CONFIRMAR]
  minPartMm: 40,

  // Limites do formulário. Fora deles o projeto é recusado, não “ajustado”.
  // [CONFIRMAR]
  minHeightMm: 300,
  maxHeightMm: 2400,
  minWidthMm: 250,
  maxWidthMm: 2000,
  minDepthMm: 280,
  maxDepthMm: 900,
  minDrawers: 1,
  maxDrawers: 10,
  minPlinthMm: 40,
  maxPlinthMm: 220,
  maxKerfMm: 8,
  maxDrawerGapMm: 12,
  maxSlideClearancePerSideMm: 30,
  maxSheetMarginMm: 40,
}

export interface ReferenceEntry {
  id: string
  label: string
  value: string
  why: string
}

function mm(value: number): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " mm"
}

/** Lista exibida na tela. O texto de cada item repete a marca [CONFIRMAR]. */
export function referenceCatalog(config: CarpentryConfig = CARPENTRY): ReferenceEntry[] {
  return [
    {
      id: "constructionSummary",
      label: "Sistema construtivo",
      value: "Caixa com laterais inteiras e frente embutida",
      why: config.constructionSummary + " [CONFIRMAR]",
    },
    {
      id: "frontStyle",
      label: "Tipo de frente",
      value: "Embutida no vão",
      why: "A frente fica dentro da caixa, com folga em volta. [CONFIRMAR]",
    },
    {
      id: "cornerFastener",
      label: "Fixação dos cantos da caixa",
      value: config.cornerFastener === "parafuso" ? "Parafuso e cola" : "Minifix e cavilha",
      why: "Vale só para topo e base nas laterais. A gaveta usa parafuso. [CONFIRMAR]",
    },
    {
      id: "slideClearancePerSideMm",
      label: "Folga da corrediça por lado",
      value: mm(config.slideClearancePerSideMm),
      why: "Telescópica lateral pede esse desconto dos dois lados da gaveta. [CONFIRMAR]",
    },
    {
      id: "drawerGapMm",
      label: "Folga entre frentes",
      value: mm(config.drawerGapMm),
      why: "Entra acima, abaixo e entre as frentes embutidas. [CONFIRMAR]",
    },
    {
      id: "minDrawerFrontHeightMm",
      label: "Altura mínima da frente",
      value: mm(config.minDrawerFrontHeightMm),
      why: "O plano recusa a gaveta se a frente ficar menor que isso. [CONFIRMAR]",
    },
    {
      id: "drawerBoxHeightReductionMm",
      label: "Caixa mais baixa que a frente",
      value: mm(config.drawerBoxHeightReductionMm),
      why: "Desconto na altura da caixa para ela não bater na gaveta de cima. [CONFIRMAR]",
    },
    {
      id: "minDrawerBoxHeightMm",
      label: "Altura mínima da caixa da gaveta",
      value: mm(config.minDrawerBoxHeightMm),
      why: "Limite para a caixa ainda receber fundo e corrediça. [CONFIRMAR]",
    },
    {
      id: "drawerBottomUsesBackThickness",
      label: "Fundo da gaveta",
      value: config.drawerBottomUsesBackThickness ? "Mesma chapa do painel traseiro" : "Outra chapa",
      why: "Assim o corte usa só duas espessuras. [CONFIRMAR]",
    },
    {
      id: "drawerSideLengthEqualsSlide",
      label: "Profundidade da gaveta",
      value: "Igual ao comprimento da corrediça",
      why: "A lateral da gaveta é cortada no comprimento nominal da corrediça. [CONFIRMAR]",
    },
    {
      id: "plinthSetbackMm",
      label: "Recuo do roda-pé",
      value: mm(config.plinthSetbackMm),
      why: "Distância da frente da caixa até a face do roda-pé. [CONFIRMAR]",
    },
    {
      id: "defaultPlinthHeightMm",
      label: "Altura inicial do roda-pé",
      value: mm(config.defaultPlinthHeightMm),
      why: "Valor que o formulário oferece ao marcar roda-pé. [CONFIRMAR]",
    },
    {
      id: "drawerRearGapMm",
      label: "Folga mínima atrás da gaveta",
      value: mm(config.drawerRearGapMm),
      why: "Além da espessura da frente, sobra pelo menos isso até o traseiro. [CONFIRMAR]",
    },
    {
      id: "insetFrontConsumesDepth",
      label: "Frente conta na profundidade",
      value: config.insetFrontConsumesDepth ? "Sim" : "Não",
      why: "A espessura da frente é descontada do vão antes de escolher a corrediça. [CONFIRMAR]",
    },
    {
      id: "screwSpacingMm",
      label: "Espaçamento dos parafusos da caixa",
      value: mm(config.screwSpacingMm),
      why: "A conta usa o maior valor entre esse espaçamento e o mínimo por junta. [CONFIRMAR]",
    },
    {
      id: "minScrewsPerJoint",
      label: "Mínimo de parafusos por junta da caixa",
      value: String(config.minScrewsPerJoint),
      why: "Cada junta de topo ou base com a lateral. [CONFIRMAR]",
    },
    {
      id: "screwsPerDrawerCorner",
      label: "Parafusos por canto da gaveta",
      value: String(config.screwsPerDrawerCorner),
      why: "Quatro cantos por gaveta. [CONFIRMAR]",
    },
    {
      id: "screwsPerDrawerFront",
      label: "Parafusos da frente decorativa",
      value: String(config.screwsPerDrawerFront),
      why: "Fixam a frente por dentro da caixa. [CONFIRMAR]",
    },
    {
      id: "screwsPerDrawerBottom",
      label: "Parafusos do fundo da gaveta",
      value: String(config.screwsPerDrawerBottom),
      why: "Fundo solto, aparafusado pelo interior. [CONFIRMAR]",
    },
    {
      id: "screwsPerSlide",
      label: "Parafusos por corrediça",
      value: String(config.screwsPerSlide) + " (inclusos no par)",
      why: "A lista mostra a quantidade, mas não manda comprar de novo. [CONFIRMAR]",
    },
    {
      id: "screwsPerHandle",
      label: "Parafusos por puxador",
      value: String(config.screwsPerHandle),
      why: "Em geral vêm com o puxador. [CONFIRMAR]",
    },
    {
      id: "washersPerHandle",
      label: "Arruelas por puxador",
      value: String(config.washersPerHandle),
      why: "Uma arruela por parafuso de puxador. [CONFIRMAR]",
    },
    {
      id: "doubleHandleWidthMm",
      label: "Largura para dois puxadores",
      value: mm(config.doubleHandleWidthMm),
      why: "Frente mais larga que isso recebe dois puxadores. [CONFIRMAR]",
    },
    {
      id: "backScrewSpacingMm",
      label: "Espaçamento dos parafusos do traseiro",
      value: mm(config.backScrewSpacingMm),
      why: "Distribuídos no perímetro do painel. [CONFIRMAR]",
    },
    {
      id: "minBackScrews",
      label: "Mínimo de parafusos do traseiro",
      value: String(config.minBackScrews),
      why: "Piso da conta, mesmo num painel pequeno. [CONFIRMAR]",
    },
    {
      id: "plinthScrewsPerCorner",
      label: "Parafusos por canto do roda-pé",
      value: String(config.plinthScrewsPerCorner),
      why: "Quadro do roda-pé, quatro cantos. [CONFIRMAR]",
    },
    {
      id: "minifixPerCorner",
      label: "Minifix por canto",
      value: String(config.minifixPerCorner),
      why: "Usado só se a fixação da caixa estiver em minifix. [CONFIRMAR]",
    },
    {
      id: "dowelsPerCorner",
      label: "Cavilhas por canto",
      value: String(config.dowelsPerCorner),
      why: "Acompanham o minifix. [CONFIRMAR]",
    },
    {
      id: "glueGramsPerMeter",
      label: "Cola PVA por metro de junta",
      value: config.glueGramsPerMeter.toLocaleString("pt-BR") + " g",
      why: "Estimativa para comprar frascos, não dosagem de bancada. [CONFIRMAR]",
    },
    {
      id: "glueBottleGrams",
      label: "Frasco de cola",
      value: config.glueBottleGrams.toLocaleString("pt-BR") + " g",
      why: "A compra arredonda para cima neste frasco. [CONFIRMAR]",
    },
    {
      id: "edgeBandingWasteFactor",
      label: "Perda da fita de borda",
      value: config.edgeBandingWasteFactor.toLocaleString("pt-BR"),
      why: "Multiplica o comprimento medido nas peças. [CONFIRMAR]",
    },
    {
      id: "edgeBandWidthUpTo15Mm",
      label: "Fita para MDF de 15 mm",
      value: mm(config.edgeBandWidthUpTo15Mm),
      why: "Largura do rolo, maior que a chapa para aparar. [CONFIRMAR]",
    },
    {
      id: "edgeBandWidthAbove15Mm",
      label: "Fita para MDF de 18 mm",
      value: mm(config.edgeBandWidthAbove15Mm),
      why: "Largura do rolo para a chapa mais grossa. [CONFIRMAR]",
    },
    {
      id: "bandingEdges",
      label: "Quais bordas levam fita",
      value: "Fachada, topo das laterais, perímetro das frentes e topo da gaveta",
      why: "Traseiro, fundos e roda-pé ficam sem fita. [CONFIRMAR]",
    },
    {
      id: "defaultKerfMm",
      label: "Kerf da serra",
      value: mm(config.defaultKerfMm),
      why: "Espaço entre peças no plano de corte. O formulário pode alterar por projeto. [CONFIRMAR]",
    },
    {
      id: "defaultSheetMarginMm",
      label: "Margem da chapa",
      value: mm(config.defaultSheetMarginMm),
      why: "Nenhuma peça encosta na borda de fábrica. [CONFIRMAR]",
    },
    {
      id: "defaultSheet",
      label: "Chapa padrão",
      value: `${mm(config.defaultSheetLengthMm)} × ${mm(config.defaultSheetWidthMm)}`,
      why: "Medida comercial inicial do plano de corte. [CONFIRMAR]",
    },
    {
      id: "carcassScrewLabel",
      label: "Parafuso da caixa",
      value: config.carcassScrewLabel,
      why: "Atravessa a lateral e entra no topo, na base ou no roda-pé. [CONFIRMAR]",
    },
    {
      id: "drawerScrewLabel",
      label: "Parafuso da gaveta",
      value: config.drawerScrewLabel,
      why: "Cantos da caixa da gaveta, fundo e fixação da frente. [CONFIRMAR]",
    },
    {
      id: "backScrewLabel",
      label: "Parafuso do traseiro",
      value: config.backScrewLabel,
      why: "Curto, para não atravessar a borda da lateral. [CONFIRMAR]",
    },
    {
      id: "handleScrewLabel",
      label: "Parafuso do puxador",
      value: config.handleScrewLabel,
      why: "Conferir com o puxador escolhido. [CONFIRMAR]",
    },
    {
      id: "standardSlideLengthsMm",
      label: "Corrediças comerciais",
      value: config.standardSlideLengthsMm.join(", ") + " mm",
      why: "A escolha automática pega a maior que cabe. [CONFIRMAR]",
    },
    {
      id: "limits",
      label: "Limites aceitos no formulário",
      value: `Altura ${config.minHeightMm}–${config.maxHeightMm} mm, largura ${config.minWidthMm}–${config.maxWidthMm} mm, profundidade ${config.minDepthMm}–${config.maxDepthMm} mm, ${config.minDrawers}–${config.maxDrawers} gavetas`,
      why: "Fora disso o plano para e explica o erro. [CONFIRMAR]",
    },
  ]
}
