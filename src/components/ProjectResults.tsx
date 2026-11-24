import { lazy, Suspense } from "react"
import { formatCut, formatMetersFromMm, formatMm, formatNumber } from "../domain/format"
import type { FurnitureProject } from "../domain/types"
import { CutPlan } from "./CutPlan"
import { Schematic } from "./Schematic"

const Viewer3D = lazy(() => import("./Viewer3D").then((module) => ({ default: module.Viewer3D })))

export function ProjectResults({ project }: { project: FurnitureProject }) {
  const { input, derived } = project
  const sheetCount = project.sheets.length
  return (
    <div className="results">
      <div className="result-head">
        <div>
          <h2>{project.projectName}</h2>
          <p>
            {formatMm(input.heightMm)} × {formatMm(input.widthMm)} × {formatMm(input.depthMm)}. {input.drawerCount}{" "}
            {input.drawerCount === 1 ? "gaveta" : "gavetas"}. {project.slideLabel} de {formatMm(derived.slideLengthMm)}.
          </p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => {
            void import("../export/pdf").then((module) => module.downloadProjectPdf(project))
          }}
        >
          Baixar PDF do projeto
        </button>
      </div>

      {project.warnings.map((warning) => (
        <p key={warning} className="callout">
          <span className="badge">Atenção</span> {warning}
        </p>
      ))}

      <nav className="local-nav" aria-label="Seções do projeto">
        <a href="#resumo">Resumo</a>
        <a href="#desenho">Desenho</a>
        <a href="#pecas">Peças</a>
        <a href="#corte">Corte</a>
        <a href="#materiais">Materiais</a>
        <a href="#montagem">Montagem</a>
        <a href="#vista">Vista 3D</a>
      </nav>

      <section id="resumo" className="section" aria-labelledby="resumo-titulo">
        <h2 id="resumo-titulo">Resumo</h2>
        <div className="stats">
          <Stat label="Peças" value={String(project.parts.length)} note="cada código é uma peça" />
          <Stat label="Chapas" value={String(sheetCount)} note={sheetSummary(project)} />
          <Stat
            label="Fita de borda"
            value={`${formatNumber(project.edgeBand.purchaseMeters)} m`}
            note={`rolo de ${formatNumber(project.edgeBand.widthMm)} mm`}
          />
          <Stat label="Pares de corrediça" value={String(input.drawerCount)} note={formatMm(derived.slideLengthMm)} />
        </div>
        <p>{project.construction}</p>
        <details>
          <summary>Conta, passo a passo</summary>
          <ol className="calc">
            {project.calculations.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </details>
      </section>

      <section id="desenho" className="section" aria-labelledby="desenho-titulo">
        <h2 id="desenho-titulo">Desenho</h2>
        <Schematic project={project} />
      </section>

      <section id="pecas" className="section" aria-labelledby="pecas-titulo">
        <h2 id="pecas-titulo">Peças</h2>
        <div className="table-wrap">
          <table>
            <caption>Lista de corte. Medida A e medida B seguem a coluna “o que é”.</caption>
            <thead>
              <tr>
                <th>Códigos</th>
                <th>Peça</th>
                <th>Qtd</th>
                <th>Corte</th>
                <th>O que é</th>
                <th>Fita por peça</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {project.groups.map((group) => (
                <tr key={group.ids.join("-")}>
                  <td data-label="Códigos">{group.ids.join(", ")}</td>
                  <td data-label="Peça">{group.name}</td>
                  <td data-label="Qtd">{group.ids.length}</td>
                  <td data-label="Corte">{formatCut(group.aMm, group.bMm, group.thicknessMm)}</td>
                  <td data-label="O que é">{group.axisNote}</td>
                  <td data-label="Fita por peça">
                    {group.edgeBandPerPieceMm > 0 ? formatMetersFromMm(group.edgeBandPerPieceMm) : "Sem fita"}
                  </td>
                  <td data-label="Observação">{group.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="corte" className="section" aria-labelledby="corte-titulo">
        <h2 id="corte-titulo">Plano de corte</h2>
        <p>
          Chapas de {formatMm(input.sheetLengthMm)} × {formatMm(input.sheetWidthMm)}. Kerf de {formatMm(input.kerfMm)}.
          Peças de espessuras diferentes não vão na mesma chapa. No MDF a peça pode girar.
        </p>
        <CutPlan sheets={project.sheets} />
      </section>

      <section id="materiais" className="section" aria-labelledby="materiais-titulo">
        <h2 id="materiais-titulo">Materiais</h2>
        <div className="table-wrap">
          <table>
            <caption>Lista de compra. Itens inclusos em outro produto estão escritos, não só marcados.</caption>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantidade</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {project.bom.map((line) => (
                <tr key={line.id}>
                  <td data-label="Item">{line.item}</td>
                  <td data-label="Quantidade">
                    {line.quantityLabel} {line.unit}
                  </td>
                  <td data-label="Detalhe">
                    {line.detail}
                    {line.includedWith ? ` Incluso com: ${line.includedWith}.` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="montagem" className="section" aria-labelledby="montagem-titulo">
        <h2 id="montagem-titulo">Montagem</h2>
        <ol className="steps">
          {project.steps.map((step, index) => (
            <li key={step.id}>
              <span className="step-no">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                {step.pieces.length > 0 ? (
                  <p>
                    <strong>Peças: </strong>
                    {step.pieces.join(", ")}
                  </p>
                ) : null}
                {step.hardware.length > 0 ? (
                  <p>
                    <strong>Nesta etapa: </strong>
                    {step.hardware.join(", ")}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="vista" className="section" aria-labelledby="vista-titulo">
        <h2 id="vista-titulo">Vista 3D</h2>
        <p>
          As peças se separam pelo contorno e pelo padrão da legenda. A cor não carrega informação: tudo está em cinza.
        </p>
        <Suspense fallback={<p>Abrindo a vista 3D.</p>}>
          <Viewer3D project={project} />
        </Suspense>
      </section>
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="stat">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-note">{note}</p>
    </article>
  )
}

function sheetSummary(project: FurnitureProject): string {
  const counts = new Map<string, number>()
  for (const sheet of project.sheets) {
    counts.set(sheet.material, (counts.get(sheet.material) ?? 0) + 1)
  }
  return [...counts.entries()].map(([material, count]) => `${count} de ${material}`).join(", ")
}
