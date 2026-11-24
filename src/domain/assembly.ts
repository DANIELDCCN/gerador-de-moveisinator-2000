import type { CarpentryConfig } from "../config/carpentry"
import { formatMm } from "./format"
import type { AssemblyStep, DerivedDimensions, GaveteiroInput } from "./types"

function drawerNames(count: number): string {
  if (count === 1) return "a gaveta"
  return `as ${count} gavetas`
}

export function buildSteps(
  input: GaveteiroInput,
  derived: DerivedDimensions,
  config: CarpentryConfig,
): AssemblyStep[] {
  const steps: AssemblyStep[] = []
  const slideName = config.slideTypes.find((type) => type.id === input.slideTypeId)?.label ?? "corrediça"

  steps.push({
    id: "check",
    title: "Conferir a lista antes de cortar",
    body: "Separe as peças pelo código da lista. Confira espessura, quantidade e o sentido de cada medida (altura × profundidade, por exemplo). Não corte se algum valor marcado para confirmação ainda não foi visto com um marceneiro.",
    pieces: ["Todas"],
    hardware: [],
  })

  steps.push({
    id: "edge",
    title: "Aplicar a fita de borda",
    body: "Fite a borda da frente e o topo das laterais, a borda da frente do tampo e da base, o contorno das frentes e o topo das laterais da gaveta. Traseiro, fundos e roda-pé ficam sem fita. Apare a sobra com cuidado para não cavar o MDF.",
    pieces: ["L1", "L2", "TP", "BS", "Frentes", "Laterais de gaveta"],
    hardware: ["Fita de borda", "Ferro ou coladeira"],
  })

  if (input.plinthEnabled) {
    steps.push({
      id: "plinth",
      title: "Montar o roda-pé",
      body: `Monte um quadro com a frente, o fundo e os dois travessões. A face do roda-pé frontal fica recuada ${formatMm(config.plinthSetbackMm)} em relação à frente das laterais. A altura do quadro é ${formatMm(derived.plinthHeightMm)}. Cole e parafuse os quatro cantos. Esse quadro entra entre as laterais e sustenta a base.`,
      pieces: ["PF", "PT", "PL1", "PL2"],
      hardware: [`Parafuso ${config.carcassScrewLabel}`, "Cola PVA"],
    })
  }

  steps.push({
    id: "bottom",
    title: "Fixar a base nas laterais",
    body: input.plinthEnabled
      ? `Apoie a base sobre o roda-pé, entre as laterais. A face de baixo da base fica a ${formatMm(derived.plinthHeightMm)} do piso. Parafuse pela face externa da lateral, no canto da base. Esquadreje antes de apertar tudo.`
      : "Encaixe a base entre as laterais, rente ao piso da caixa. Parafuse pela face externa da lateral. Esquadreje antes de apertar tudo.",
    pieces: ["L1", "L2", "BS"],
    hardware:
      config.cornerFastener === "minifix"
        ? ["Minifix", "Cavilha", "Cola PVA"]
        : [`Parafuso ${config.carcassScrewLabel}`, "Cola PVA"],
  })

  steps.push({
    id: "top",
    title: "Fixar o tampo",
    body: "O tampo entra entre as laterais, com a face de cima alinhada ao topo delas. A borda da frente fica alinhada à frente das laterais. Use o mesmo tipo de fixação da base.",
    pieces: ["L1", "L2", "TP"],
    hardware:
      config.cornerFastener === "minifix"
        ? ["Minifix", "Cavilha", "Cola PVA"]
        : [`Parafuso ${config.carcassScrewLabel}`, "Cola PVA"],
  })

  steps.push({
    id: "back",
    title: "Fechar com o painel traseiro",
    body: `Com a caixa esquadrejada, pregue o painel traseiro por trás. Ele cobre as bordas traseiras e completa a profundidade externa de ${formatMm(input.depthMm)}. Use o parafuso curto para não atravessar a borda da lateral. Distribua os parafusos no perímetro.`,
    pieces: ["TR"],
    hardware: [`Parafuso ${config.backScrewLabel}`],
  })

  const heightLines = derived.slideCenterFromFloorMm
    .map((height, index) => `G${index + 1} (de cima): centro da corrediça a ${formatMm(height)} do piso`)
    .join(". ")

  steps.push({
    id: "slide-marks",
    title: "Marcar e fixar as corrediças nas laterais",
    body: `O vão interno tem ${formatMm(derived.openingHeightMm)} de altura para ${input.drawerCount} frentes de ${formatMm(derived.frontHeightMm)}, com folga de ${formatMm(input.drawerGapMm)}. A caixa tem ${formatMm(derived.boxHeightMm)} de altura e fica centrada atrás da frente. Marque o centro de cada ${slideName.toLowerCase()} nas duas laterais, na mesma altura: ${heightLines}. A corrediça é parafusada na face interna da lateral. A folga de ${formatMm(input.slideClearancePerSideMm)} por lado já foi descontada na largura da gaveta.`,
    pieces: ["L1", "L2"],
    hardware: [`${input.drawerCount} pares de corrediça de ${formatMm(derived.slideLengthMm)}`],
  })

  steps.push({
    id: "boxes",
    title: `Montar ${drawerNames(input.drawerCount)}`,
    body: `Cada caixa tem duas laterais de ${formatMm(derived.boxDepthMm)}, uma frente e uma contrafrente de ${formatMm(derived.boxInnerWidthMm)} de largura, todas com ${formatMm(derived.boxHeightMm)} de altura. A frente e a contrafrente entram entre as laterais. Cole e parafuse pelos cantos, pelo lado de fora da lateral.`,
    pieces: ["Laterais de gaveta", "Frentes da caixa", "Contrafrentes"],
    hardware: [`Parafuso ${config.drawerScrewLabel}`, "Cola PVA"],
  })

  steps.push({
    id: "bottoms",
    title: "Fixar os fundos",
    body: `O fundo mede ${formatMm(derived.boxInnerWidthMm)} × ${formatMm(derived.boxInnerDepthMm)} e fica solto por dentro, no fundo da caixa. Parafuse pelo interior, sem fita de borda.`,
    pieces: ["Fundos de gaveta"],
    hardware: [`Parafuso ${config.drawerScrewLabel}`],
  })

  steps.push({
    id: "slide-drawers",
    title: "Parafusar a outra metade da corrediça",
    body: "Com a caixa ainda sem a frente decorativa, fixe a corrediça na lateral da gaveta, alinhada ao centro da altura. Use os parafusos que vieram no par.",
    pieces: ["Laterais de gaveta"],
    hardware: ["Parafusos inclusos na corrediça"],
  })

  steps.push({
    id: "fronts",
    title: "Regular as frentes",
    body: `Encaixe as gavetas. A frente decorativa é embutida: ${formatMm(derived.frontWidthMm)} × ${formatMm(derived.frontHeightMm)}, com ${formatMm(input.drawerGapMm)} de folga nas bordas e entre gavetas. Prenda por dentro, com a gaveta na caixa, e só aperte depois de igualar as folgas. F1 é a gaveta de cima.`,
    pieces: ["F1 a F" + String(input.drawerCount)],
    hardware: [`Parafuso ${config.drawerScrewLabel}`],
  })

  const handlesPerDrawer = derived.frontWidthMm >= config.doubleHandleWidthMm ? 2 : 1
  steps.push({
    id: "handles",
    title: "Colocar os puxadores",
    body:
      handlesPerDrawer === 1
        ? "Um puxador no centro de cada frente. A arruela fica por dentro. Meça as duas laterais a partir das bordas para o furo não sair torto."
        : "Dois puxadores por frente, simétricos. A arruela fica por dentro.",
    pieces: ["Frentes"],
    hardware: ["Puxadores", "Arruelas", `Parafuso ${config.handleScrewLabel}`],
  })

  steps.push({
    id: "finish",
    title: "Provar o movimento",
    body: `Abra e feche cada gaveta. Atrás da caixa devem sobrar cerca de ${formatMm(derived.rearClearanceMm)} até o painel traseiro. Se uma frente raspar, solte os parafusos de dentro e desloque só a frente. Confira o esquadro da caixa antes de encostar o móvel na parede.`,
    pieces: [],
    hardware: [],
  })

  return steps
}
