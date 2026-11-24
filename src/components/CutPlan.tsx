import { useState } from "react"
import { formatCut, formatNumber, formatPercent } from "../domain/format"
import type { CutSheet } from "../domain/types"

const PATTERNS = ["diag", "horiz", "vert", "dots", "cross", "diag-b"] as const

export function CutPlan({ sheets }: { sheets: CutSheet[] }) {
  const [zoom, setZoom] = useState(100)
  return (
    <div className="cut-plan">
      {sheets.map((sheet) => (
        <article key={sheet.number} className="cut-sheet" aria-labelledby={`chapa-${sheet.number}`}>
          <h3 id={`chapa-${sheet.number}`}>
            Chapa {sheet.number} — {sheet.material}
          </h3>
          <p>
            {formatNumber(sheet.lengthMm)} × {formatNumber(sheet.widthMm)} mm. {sheet.placements.length} peças. Sobra{" "}
            {formatPercent(sheet.wastePercent)}% da chapa, já contando a margem de {formatNumber(sheet.marginMm)} mm. A
            origem do desenho é o canto superior esquerdo: X para a direita, Y para baixo.
          </p>
          <div className="zoom">
            <label htmlFor={`zoom-${sheet.number}`}>Ampliação do desenho</label>
            <input
              id={`zoom-${sheet.number}`}
              type="range"
              min={100}
              max={260}
              step={20}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
            <span>{zoom}%</span>
          </div>
          <div className="zoom-scroll">
            <svg
              viewBox={`0 0 ${sheet.lengthMm} ${sheet.widthMm}`}
              style={{ width: `${zoom}%`, minWidth: "80rem" }}
              aria-hidden="true"
            >
              <SheetPatterns idPrefix={`s${sheet.number}`} />
              <rect
                x={0}
                y={0}
                width={sheet.lengthMm}
                height={sheet.widthMm}
                fill="#fbf7ef"
                stroke="#161616"
                strokeWidth={8}
              />
              {sheet.marginMm > 0 ? (
                <rect
                  x={sheet.marginMm}
                  y={sheet.marginMm}
                  width={sheet.lengthMm - 2 * sheet.marginMm}
                  height={sheet.widthMm - 2 * sheet.marginMm}
                  fill="none"
                  stroke="#161616"
                  strokeWidth={3}
                  strokeDasharray="16 10"
                />
              ) : null}
              {sheet.placements.map((part, index) => {
                const pattern = PATTERNS[index % PATTERNS.length]
                const font = Math.min(48, Math.max(28, Math.min(part.aMm, part.bMm) / 4.5))
                return (
                  <g key={part.id}>
                    <rect
                      x={part.x}
                      y={part.y}
                      width={part.aMm}
                      height={part.bMm}
                      fill={`url(#s${sheet.number}-${pattern})`}
                      stroke="#161616"
                      strokeWidth={4}
                    />
                    {Math.min(part.aMm, part.bMm) > 130 ? (
                      <text
                        x={part.x + part.aMm / 2}
                        y={part.y + part.bMm / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={font}
                        fontWeight={700}
                        fill="#161616"
                      >
                        {part.id}
                      </text>
                    ) : null}
                  </g>
                )
              })}
            </svg>
          </div>
          <p className="hint">Deslize para o lado se o desenho ampliado passar da tela. A tabela abaixo tem os mesmos dados.</p>
          <div className="table-wrap">
            <table>
              <caption>Peças da chapa {sheet.number}, com posição em milímetros</caption>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Peça</th>
                  <th>X</th>
                  <th>Y</th>
                  <th>Corte na chapa</th>
                  <th>Girou</th>
                </tr>
              </thead>
              <tbody>
                {sheet.placements.map((part) => (
                  <tr key={part.id}>
                    <td data-label="Código">{part.id}</td>
                    <td data-label="Peça">{part.name}</td>
                    <td data-label="X">{formatNumber(part.x)}</td>
                    <td data-label="Y">{formatNumber(part.y)}</td>
                    <td data-label="Corte na chapa">{formatCut(part.aMm, part.bMm, part.thicknessMm)}</td>
                    <td data-label="Girou">{part.rotated ? "Sim" : "Não"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  )
}

function SheetPatterns({ idPrefix }: { idPrefix: string }) {
  return (
    <defs>
      <pattern id={`${idPrefix}-diag`} patternUnits="userSpaceOnUse" width="28" height="28">
        <rect width="28" height="28" fill="#fbf7ef" />
        <path d="M-4,28 L28,-4 M-4,14 L14,-4 M14,28 L32,10" stroke="#161616" strokeWidth="2" />
      </pattern>
      <pattern id={`${idPrefix}-horiz`} patternUnits="userSpaceOnUse" width="24" height="24">
        <rect width="24" height="24" fill="#f7f4ec" />
        <path d="M0,12 H24" stroke="#161616" strokeWidth="2" />
      </pattern>
      <pattern id={`${idPrefix}-vert`} patternUnits="userSpaceOnUse" width="24" height="24">
        <rect width="24" height="24" fill="#fbf7ef" />
        <path d="M12,0 V24" stroke="#161616" strokeWidth="2" />
      </pattern>
      <pattern id={`${idPrefix}-dots`} patternUnits="userSpaceOnUse" width="28" height="28">
        <rect width="28" height="28" fill="#f3efe4" />
        <circle cx="8" cy="8" r="2.4" fill="#161616" />
      </pattern>
      <pattern id={`${idPrefix}-cross`} patternUnits="userSpaceOnUse" width="26" height="26">
        <rect width="26" height="26" fill="#fbf7ef" />
        <path d="M13,2 V24 M2,13 H24" stroke="#161616" strokeWidth="2" />
      </pattern>
      <pattern id={`${idPrefix}-diag-b`} patternUnits="userSpaceOnUse" width="28" height="28">
        <rect width="28" height="28" fill="#f7f4ec" />
        <path d="M32,4 L4,32 M18,-2 L-2,18" stroke="#161616" strokeWidth="2" />
      </pattern>
    </defs>
  )
}
