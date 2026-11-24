import { CARPENTRY, referenceCatalog } from "../config/carpentry"
import type { FieldError } from "../domain/types"
import type { FormState } from "../form/parse"

interface Props {
  form: FormState
  errors: FieldError[]
  slideHint: string | null
  onChange: (patch: Partial<FormState>) => void
  onSample: () => void
}

export function ProjectForm({ form, errors, slideHint, onChange, onSample }: Props) {
  const message = (field: string) => errors.find((error) => error.field === field)?.message
  return (
    <form
      className="panel"
      onSubmit={(event) => event.preventDefault()}
      aria-labelledby="dados-titulo"
    >
      <h2 id="dados-titulo">Dados do gaveteiro</h2>
      <p>Medidas externas, em milímetros. A conta usa exatamente o que está aqui.</p>
      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={onSample}>
          Carregar exemplo 900 × 600 × 450 mm, 4 gavetas
        </button>
      </div>
      {errors.length > 0 ? (
        <div className="callout" role="alert">
          <p>
            <span className="badge">Erro</span> O projeto não fecha. {errors.length === 1 ? "Há 1 correção." : `Há ${errors.length} correções.`}
          </p>
          <ul>
            {errors.map((error) => (
              <li key={`${error.field}-${error.message}`}>
                <a href={`#${error.field}`}>{error.message}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <TextField
        id="projectName"
        label="Nome do projeto"
        value={form.projectName}
        onChange={(projectName) => onChange({ projectName })}
      />
      <NumberField
        id="heightMm"
        label="Altura externa"
        value={form.heightMm}
        suffix="mm"
        hint="Do piso ao topo, incluindo o roda-pé se houver."
        error={message("heightMm")}
        onChange={(heightMm) => onChange({ heightMm })}
      />
      <NumberField
        id="widthMm"
        label="Largura externa"
        value={form.widthMm}
        suffix="mm"
        hint="De uma lateral até a outra, por fora."
        error={message("widthMm")}
        onChange={(widthMm) => onChange({ widthMm })}
      />
      <NumberField
        id="depthMm"
        label="Profundidade externa"
        value={form.depthMm}
        suffix="mm"
        hint="Da frente até o painel traseiro, por fora."
        error={message("depthMm")}
        onChange={(depthMm) => onChange({ depthMm })}
      />

      <fieldset>
        <legend>Espessura do MDF da caixa</legend>
        <div className="choices">
          {CARPENTRY.allowedPanelThicknessMm.map((thickness) => {
            const selected = form.thicknessMm === String(thickness)
            return (
              <label key={thickness} className={selected ? "choice is-on" : "choice"}>
                <input
                  type="radio"
                  name="thicknessMm"
                  value={thickness}
                  checked={selected}
                  onChange={() => onChange({ thicknessMm: String(thickness) })}
                />
                <span>
                  <strong>{thickness} mm</strong>
                  <span className="choice-state">{selected ? "Selecionado" : "Não selecionado"}</span>
                </span>
              </label>
            )
          })}
        </div>
        {message("thicknessMm") ? <FieldError message={message("thicknessMm")!} /> : null}
      </fieldset>

      <fieldset>
        <legend>Espessura do traseiro e do fundo da gaveta</legend>
        <div className="choices">
          {CARPENTRY.allowedBackThicknessMm.map((thickness) => {
            const selected = form.backThicknessMm === String(thickness)
            return (
              <label key={thickness} className={selected ? "choice is-on" : "choice"}>
                <input
                  type="radio"
                  name="backThicknessMm"
                  value={thickness}
                  checked={selected}
                  onChange={() => onChange({ backThicknessMm: String(thickness) })}
                />
                <span>
                  <strong>{thickness} mm</strong>
                  <span className="choice-state">{selected ? "Selecionado" : "Não selecionado"}</span>
                </span>
              </label>
            )
          })}
        </div>
        {message("backThicknessMm") ? <FieldError message={message("backThicknessMm")!} /> : null}
      </fieldset>

      <NumberField
        id="drawerCount"
        label="Número de gavetas"
        value={form.drawerCount}
        suffix="un"
        hint="Frentes iguais, uma em cima da outra."
        error={message("drawerCount")}
        onChange={(drawerCount) => onChange({ drawerCount })}
      />

      <div className={form.plinthEnabled ? "choice is-on checkline" : "choice checkline"}>
        <label>
          <input
            type="checkbox"
            checked={form.plinthEnabled}
            onChange={(event) => onChange({ plinthEnabled: event.target.checked })}
          />
          <span>
            <strong>Com roda-pé</strong>
            <span className="choice-state">{form.plinthEnabled ? "Marcado" : "Desmarcado"}</span>
          </span>
        </label>
      </div>
      <NumberField
        id="plinthHeightMm"
        label="Altura do roda-pé"
        value={form.plinthHeightMm}
        suffix="mm"
        hint={
          form.plinthEnabled
            ? "Entra na altura externa. O recuo do pé está no arquivo de referência."
            : "Não entra nesta conta enquanto o roda-pé estiver desmarcado. O valor fica guardado."
        }
        error={message("plinthHeightMm")}
        onChange={(plinthHeightMm) => onChange({ plinthHeightMm })}
      />

      <div className="field">
        <label htmlFor="slideTypeId">Tipo de corrediça</label>
        <select
          id="slideTypeId"
          value={form.slideTypeId}
          onChange={(event) => onChange({ slideTypeId: event.target.value })}
        >
          {CARPENTRY.slideTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
        {message("slideTypeId") ? <FieldError message={message("slideTypeId")!} /> : null}
      </div>
      <div className="field">
        <label htmlFor="slideLengthMm">Comprimento da corrediça</label>
        <p id="slide-dica" className="hint">
          Automática escolhe a maior medida comercial que cabe.
          {slideHint ? ` ${slideHint}` : ""}
        </p>
        <select
          id="slideLengthMm"
          value={form.slideLengthMm}
          aria-describedby="slide-dica"
          onChange={(event) => onChange({ slideLengthMm: event.target.value })}
        >
          <option value="auto">Automática</option>
          {CARPENTRY.standardSlideLengthsMm.map((length) => (
            <option key={length} value={String(length)}>
              {length} mm
            </option>
          ))}
        </select>
        {message("slideLengthMm") ? <FieldError message={message("slideLengthMm")!} /> : null}
      </div>

      <details>
        <summary>Ajustes de oficina</summary>
        <NumberField
          id="slideClearancePerSideMm"
          label="Folga da corrediça por lado"
          value={form.slideClearancePerSideMm}
          suffix="mm"
          hint={`Valor de referência: ${CARPENTRY.slideClearancePerSideMm} mm.`}
          error={message("slideClearancePerSideMm")}
          onChange={(slideClearancePerSideMm) => onChange({ slideClearancePerSideMm })}
        />
        <NumberField
          id="drawerGapMm"
          label="Folga entre frentes"
          value={form.drawerGapMm}
          suffix="mm"
          hint={`Valor de referência: ${CARPENTRY.drawerGapMm} mm.`}
          error={message("drawerGapMm")}
          onChange={(drawerGapMm) => onChange({ drawerGapMm })}
        />
        <NumberField
          id="kerfMm"
          label="Kerf da serra"
          value={form.kerfMm}
          suffix="mm"
          hint="Espaço entre as peças no plano de corte."
          error={message("kerfMm")}
          onChange={(kerfMm) => onChange({ kerfMm })}
        />
        <NumberField
          id="sheetMarginMm"
          label="Margem da chapa"
          value={form.sheetMarginMm}
          suffix="mm"
          hint="Nenhuma peça encosta na borda de fábrica."
          error={message("sheetMarginMm")}
          onChange={(sheetMarginMm) => onChange({ sheetMarginMm })}
        />
        <NumberField
          id="sheetLengthMm"
          label="Comprimento da chapa"
          value={form.sheetLengthMm}
          suffix="mm"
          error={message("sheetLengthMm")}
          onChange={(sheetLengthMm) => onChange({ sheetLengthMm })}
        />
        <NumberField
          id="sheetWidthMm"
          label="Largura da chapa"
          value={form.sheetWidthMm}
          suffix="mm"
          error={message("sheetWidthMm")}
          onChange={(sheetWidthMm) => onChange({ sheetWidthMm })}
        />
      </details>

      <details>
        <summary>Valores de referência para confirmar ({referenceCatalog().length})</summary>
        <p>
          Cada item abaixo está marcado no código com [CONFIRMAR], em <code>src/config/carpentry.ts</code>. A tela não
          altera o arquivo: para mudar o padrão de um projeto novo, edite lá.
        </p>
        <dl className="ref-list">
          {referenceCatalog().map((entry) => (
            <div key={entry.id}>
              <dt>{entry.label}</dt>
              <dd>
                <strong>{entry.value}</strong>
                <span>{entry.why}</span>
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </form>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} autoComplete="off" onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function NumberField({
  id,
  label,
  value,
  suffix,
  hint,
  error,
  onChange,
}: {
  id: string
  label: string
  value: string
  suffix: string
  hint?: string
  error?: string
  onChange: (value: string) => void
}) {
  const hintId = hint ? `${id}-dica` : undefined
  const errorId = error ? `${id}-erro` : undefined
  const described = [hintId, errorId].filter(Boolean).join(" ") || undefined
  return (
    <div className={error ? "field has-error" : "field"}>
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <p id={hintId} className="hint">
          {hint}
        </p>
      ) : null}
      <div className="control">
        <input
          id={id}
          value={value}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="suffix">{suffix}</span>
      </div>
      {error ? <FieldError id={errorId} message={error} /> : null}
    </div>
  )
}

function FieldError({ message, id }: { message: string; id?: string }) {
  return (
    <p id={id} className="error" role="alert">
      <span className="badge">Erro</span> {message}
    </p>
  )
}
