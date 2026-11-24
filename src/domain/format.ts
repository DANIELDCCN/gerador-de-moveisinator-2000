/** Número em pt-BR, até 3 casas, sem zero à direita desnecessário. */
export function formatNumber(value: number): string {
  const rounded = Math.round(value * 1000) / 1000
  return rounded.toLocaleString("pt-BR", { maximumFractionDigits: 3 })
}

export function formatMm(value: number): string {
  return `${formatNumber(value)} mm`
}

export function formatPercent(value: number): string {
  return (Math.round(value * 10) / 10).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

export function formatMetersFromMm(valueMm: number): string {
  return `${(valueMm / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m`
}

export function formatCut(aMm: number, bMm: number, thicknessMm: number): string {
  return `${formatNumber(aMm)} × ${formatNumber(bMm)} × ${formatNumber(thicknessMm)} mm`
}

export function materialName(thicknessMm: number): string {
  return `MDF ${formatNumber(thicknessMm)} mm`
}
