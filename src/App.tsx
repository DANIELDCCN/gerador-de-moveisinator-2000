import { useMemo, useState } from "react"
import { PhotoPanel } from "./components/PhotoPanel"
import { ProjectForm } from "./components/ProjectForm"
import { ProjectResults } from "./components/ProjectResults"
import { formatMm } from "./domain/format"
import { generateProject } from "./domain/project"
import { parseForm, sampleForm, type FormState } from "./form/parse"

export default function App() {
  const [form, setForm] = useState<FormState>(sampleForm)
  const parsed = useMemo(() => parseForm(form), [form])
  const result = useMemo(() => (parsed.input ? generateProject(parsed.input) : null), [parsed])
  const errors = [...parsed.errors, ...(result && !result.ok ? result.errors : [])]
  const project = result?.ok ? result.project : null
  const slideHint = project
    ? `Nesta medida a corrediça fica em ${formatMm(project.derived.slideLengthMm)}.`
    : null

  return (
    <div className="page">
      <a className="skip" href="#resultado">
        Pular para o resultado
      </a>
      <header className="masthead">
        <p className="eyebrow">Oficina Clara</p>
        <h1>Projeto de gaveteiro em MDF</h1>
        <p className="lede">
          Você informa as medidas. A conta é determinística: a mesma entrada gera sempre as mesmas peças, o mesmo corte
          e a mesma lista de materiais. Nenhum modelo inventa milímetro.
        </p>
        <div className="ticks" aria-hidden="true" />
      </header>
      <aside className="banner" role="note">
        <p>
          <strong>Confirme as folgas com um marceneiro antes de cortar.</strong> Parafusos, folga de corrediça, kerf e
          os demais números marcados com [CONFIRMAR] estão em <code>src/config/carpentry.ts</code>. A lista no fim do
          formulário mostra cada um.
        </p>
      </aside>
      <p className="live" aria-live="polite">
        {project
          ? `Projeto atualizado: ${project.projectName}. ${project.parts.length} peças em ${project.sheets.length} chapas.`
          : errors.length > 0
            ? `O projeto não fecha. ${errors.length} ${errors.length === 1 ? "erro" : "erros"}.`
            : ""}
      </p>
      <main className="layout">
        <div className="stack">
          <PhotoPanel form={form} onApply={(patch) => setForm((current) => ({ ...current, ...patch }))} />
          <ProjectForm
            form={form}
            errors={errors}
            slideHint={slideHint}
            onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
            onSample={() => setForm(sampleForm())}
          />
        </div>
        <div id="resultado">
          {project ? (
            <ProjectResults project={project} />
          ) : (
            <section className="panel">
              <h2>Resultado</h2>
              <p>Corrija os campos marcados com Erro. Assim que as medidas fecharem, as peças aparecem aqui.</p>
            </section>
          )}
        </div>
      </main>
      <footer className="site-footer">
        <p>
          Oficina Clara roda no navegador. As medidas não saem daqui. A foto só vai ao Google se você pedir a leitura com a
          sua chave. Código livre, pronto para GitHub Pages.
        </p>
      </footer>
    </div>
  )
}
