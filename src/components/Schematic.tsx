import { formatMm, formatNumber } from "../domain/format"
import type { FurnitureProject } from "../domain/types"

interface Props {
  project: FurnitureProject
}

export function Schematic({ project }: Props) {
  const { input, derived } = project
  const height = input.heightMm
  const width = input.widthMm
  const depth = input.depthMm
  const thickness = input.thicknessMm
  const plinth = derived.plinthHeightMm
  const gap = input.drawerGapMm
  const pad = 120

  const fronts = Array.from({ length: input.drawerCount }, (_, fromBottom) => {
    const bottom = plinth + thickness + gap + fromBottom * (derived.frontHeightMm + gap)
    return {
      bottom,
      label: `${input.drawerCount - fromBottom} de cima`,
    }
  })

  const frontLabel = `Fachada do gaveteiro, ${formatMm(width)} por ${formatMm(height)}. ${input.drawerCount} frentes embutidas com folga de ${formatMm(gap)}.`
  const sideLabel = `Corte lateral. Profundidade externa ${formatMm(depth)}, gaveta com ${formatMm(derived.boxDepthMm)} e folga atrás de ${formatMm(derived.rearClearanceMm)}.`

  return (
    <div className="schematic">
      <figure>
        <svg viewBox={`0 0 ${width + pad * 2} ${height + pad * 2}`} role="img" aria-label={frontLabel}>
          <FurnitureFront project={project} pad={pad} fronts={fronts} />
          <DrawingFrame width={width} height={height} pad={pad} />
          <Dimension
            x1={pad}
            y1={pad + height + 36}
            x2={pad + width}
            y2={pad + height + 36}
            label={formatMm(width)}
          />
          <Dimension
            x1={pad - 48}
            y1={pad + height}
            x2={pad - 48}
            y2={pad}
            label={formatMm(height)}
            vertical
          />
        </svg>
        <figcaption>Fachada. A medida de fora está nas cotas; a tabela lista cada peça.</figcaption>
      </figure>
      <figure>
        <svg viewBox={`0 0 ${depth + pad * 2} ${height + pad * 2}`} role="img" aria-label={sideLabel}>
          <FurnitureSide project={project} pad={pad} />
          <DrawingFrame width={depth} height={height} pad={pad} />
          <Dimension
            x1={pad}
            y1={pad + height + 36}
            x2={pad + depth}
            y2={pad + height + 36}
            label={formatMm(depth)}
          />
        </svg>
        <figcaption>
          Corte lateral. Frente à esquerda, painel traseiro à direita. Todas as gavetas têm a mesma profundidade.
        </figcaption>
      </figure>
      <dl className="measures">
        <Measure term="Vão interno" value={`${formatMm(derived.innerWidthMm)} × ${formatMm(derived.openingHeightMm)} × ${formatMm(derived.openingDepthMm)}`} />
        <Measure term="Frente" value={`${formatMm(derived.frontWidthMm)} × ${formatMm(derived.frontHeightMm)}`} />
        <Measure term="Caixa da gaveta" value={`${formatMm(derived.boxOuterWidthMm)} × ${formatMm(derived.boxHeightMm)} × ${formatMm(derived.boxDepthMm)}`} />
        <Measure term="Folga atrás" value={formatMm(derived.rearClearanceMm)} />
      </dl>
      <h3>Centro da corrediça, a partir do piso</h3>
      <ol className="heights">
        {derived.slideCenterFromFloorMm.map((center, index) => (
          <li key={center}>
            Gaveta {index + 1} de cima: <strong>{formatNumber(center)} mm</strong>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Measure({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function DrawingFrame({ width, height, pad }: { width: number; height: number; pad: number }) {
  return <rect x={pad} y={pad} width={width} height={height} className="draw-outer" fill="none" stroke="#161616" strokeWidth={4} />
}

function FurnitureFront({
  project,
  pad,
  fronts,
}: {
  project: FurnitureProject
  pad: number
  fronts: Array<{ bottom: number; label: string }>
}) {
  const { input, derived } = project
  const y = (fromFloor: number, size = 0) => pad + input.heightMm - fromFloor - size
  const thickness = input.thicknessMm
  return (
    <g>
      <HatchDefs prefix="front" />
      <rect x={pad} y={y(input.heightMm)} width={thickness} height={input.heightMm} fill="url(#front-vert)" />
      <rect
        x={pad + input.widthMm - thickness}
        y={y(input.heightMm)}
        width={thickness}
        height={input.heightMm}
        fill="url(#front-vert)"
      />
      <rect x={pad + thickness} y={y(input.heightMm)} width={derived.innerWidthMm} height={thickness} fill="url(#front-horiz)" />
      <rect
        x={pad + thickness}
        y={y(derived.plinthHeightMm + thickness)}
        width={derived.innerWidthMm}
        height={thickness}
        fill="url(#front-horiz)"
      />
      {derived.plinthHeightMm > 0 ? (
        <rect
          x={pad + thickness}
          y={y(derived.plinthHeightMm)}
          width={derived.innerWidthMm}
          height={derived.plinthHeightMm}
          fill="url(#front-dots)"
        />
      ) : null}
      {fronts.map((front) => (
        <g key={front.label}>
          <rect
            x={pad + thickness + input.drawerGapMm}
            y={y(front.bottom, derived.frontHeightMm)}
            width={derived.frontWidthMm}
            height={derived.frontHeightMm}
            fill="url(#front-diag)"
          />
          <text
            x={pad + input.widthMm / 2}
            y={y(front.bottom, derived.frontHeightMm) + derived.frontHeightMm / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="draw-label"
          >
            {front.label}
          </text>
        </g>
      ))}
    </g>
  )
}

function FurnitureSide({ project, pad }: { project: FurnitureProject; pad: number }) {
  const { input, derived } = project
  const y = (fromFloor: number, size = 0) => pad + input.heightMm - fromFloor - size
  const boxHeight = derived.boxHeightMm
  return (
    <g>
      <HatchDefs prefix="side" />
      <rect
        x={pad + derived.sideDepthMm}
        y={y(derived.plinthHeightMm, derived.backHeightMm)}
        width={input.backThicknessMm}
        height={derived.backHeightMm}
        fill="url(#side-dots)"
      />
      <rect x={pad} y={y(input.heightMm)} width={derived.sideDepthMm} height={input.thicknessMm} fill="url(#side-horiz)" />
      <rect
        x={pad}
        y={y(derived.plinthHeightMm + input.thicknessMm)}
        width={derived.sideDepthMm}
        height={input.thicknessMm}
        fill="url(#side-horiz)"
      />
      {derived.slideCenterFromFloorMm.map((center, index) => {
        const boxBottom = center - boxHeight / 2
        const frontBottom = boxBottom - (derived.frontHeightMm - boxHeight) / 2
        return (
          <g key={center}>
            <rect
              x={pad}
              y={y(frontBottom, derived.frontHeightMm)}
              width={input.thicknessMm}
              height={derived.frontHeightMm}
              fill="url(#side-diag)"
            />
            <rect
              x={pad + input.thicknessMm}
              y={y(boxBottom, boxHeight)}
              width={derived.boxDepthMm}
              height={boxHeight}
              fill="none"
              className="draw-box"
            />
            <text
              x={pad + input.thicknessMm + 12}
              y={y(boxBottom, boxHeight) + boxHeight / 2}
              dominantBaseline="middle"
              className="draw-label draw-label-start"
            >
              {index + 1}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function HatchDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      <pattern id={`${prefix}-diag`} patternUnits="userSpaceOnUse" width="14" height="14">
        <rect width="14" height="14" fill="#fbf7ef" />
        <path d="M-2,14 L14,-2 M-2,7 L7,-2 M7,14 L16,5" stroke="#161616" strokeWidth="1.4" />
      </pattern>
      <pattern id={`${prefix}-horiz`} patternUnits="userSpaceOnUse" width="12" height="12">
        <rect width="12" height="12" fill="#fbf7ef" />
        <path d="M0,6 H12" stroke="#161616" strokeWidth="1.4" />
      </pattern>
      <pattern id={`${prefix}-vert`} patternUnits="userSpaceOnUse" width="12" height="12">
        <rect width="12" height="12" fill="#fbf7ef" />
        <path d="M6,0 V12" stroke="#161616" strokeWidth="1.4" />
      </pattern>
      <pattern id={`${prefix}-dots`} patternUnits="userSpaceOnUse" width="14" height="14">
        <rect width="14" height="14" fill="#fbf7ef" />
        <circle cx="4" cy="4" r="1.5" fill="#161616" />
      </pattern>
    </defs>
  )
}

function Dimension({
  x1,
  y1,
  x2,
  y2,
  label,
  vertical = false,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  label: string
  vertical?: boolean
}) {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  return (
    <g className="draw-dim">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <text
        x={vertical ? midX - 8 : midX}
        y={vertical ? midY : midY - 10}
        textAnchor="middle"
        transform={vertical ? `rotate(-90 ${midX - 8} ${midY})` : undefined}
      >
        {label}
      </text>
    </g>
  )
}
