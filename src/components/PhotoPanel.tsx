import { useEffect, useRef, useState } from "react"
import type { FormState } from "../form/parse"
import { readGeminiKey, writeGeminiKey } from "../vision/keyStorage"
import { PHOTO_FIELDS, knownFromForm, mergePhotoReading, type MergeResult, type PhotoChange, type PhotoField } from "../vision/merge"
import { VisionError } from "../vision/messages"
import { GEMINI_MODEL, readFurniturePhoto } from "../vision/reading"

interface Props {
  form: FormState
  photoFields: readonly PhotoField[]
  resetSignal: number
  onApply: (patch: Partial<FormState>) => void
  onUndo: (patch: Partial<FormState>, photoFields: readonly PhotoField[]) => void
}

interface UndoState {
  previous: Partial<FormState>
  tags: readonly PhotoField[]
}

export function PhotoPanel({ form, photoFields, resetSignal, onApply, onUndo }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [report, setReport] = useState<MergeResult | null>(null)
  const [undo, setUndo] = useState<UndoState | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    setApiKey(readGeminiKey())
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  useEffect(() => {
    setReport(null)
    setUndo(null)
  }, [resetSignal])

  function choose(next: File | null) {
    setMessage(null)
    setFile(next)
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    const url = next ? URL.createObjectURL(next) : null
    previewRef.current = url
    setPreview(url)
  }

  function changeKey(value: string) {
    setApiKey(value)
    writeGeminiKey(value)
  }

  function removeKey() {
    setApiKey("")
    writeGeminiKey("")
    setMessage("Chave removida deste navegador.")
  }

  async function estimate() {
    if (!file) return
    if (!apiKey.trim()) {
      setMessage("Informe sua chave do Gemini para ler a foto.")
      return
    }
    setReading(true)
    setMessage(null)
    try {
      const imageBase64 = await fileToBase64(file)
      const result = await readFurniturePhoto({
        imageBase64,
        mediaType: file.type || "image/jpeg",
        apiKey,
      })
      const merged = mergePhotoReading(knownFromForm(form), result)
      setReport(merged)
      if (Object.keys(merged.patch).length > 0) {
        const previous: Partial<FormState> = {}
        for (const field of PHOTO_FIELDS) {
          if (merged.patch[field] !== undefined) previous[field] = form[field]
        }
        onApply(merged.patch)
        setUndo({ previous, tags: photoFields })
      }
    } catch (error) {
      setMessage(error instanceof VisionError ? error.message : "Não foi possível ler a foto.")
    } finally {
      setReading(false)
    }
  }

  function undoAnalysis() {
    if (!undo) return
    onUndo(undo.previous, undo.tags)
    setUndo(null)
    setReport(null)
    setMessage("Análise da foto desfeita. Voltaram os valores de antes.")
  }

  const wroteThisReading = report != null && Object.keys(report.patch).length > 0
  const changed = wroteThisReading ? report.changes.filter((change) => change.changed) : []

  return (
    <section className="panel" aria-labelledby="foto-titulo">
      <form onSubmit={(event) => event.preventDefault()}>
        <h2 id="foto-titulo">Foto do móvel</h2>
        <p>
          Uma leitura bem-sucedida vira a estimativa principal: ela entra direto nos campos que consegue inferir e
          substitui o exemplo ou o que você tinha digitado. O projeto recalcula na hora. Cada campo continua editável.
          O que você alterar depois fica, até analisar outra foto.
        </p>
        <div className="field file-field">
          <label htmlFor="foto" className="btn btn-secondary">
            Escolher uma imagem
          </label>
          <input
            id="foto"
            className="visually-hidden"
            type="file"
            accept="image/*"
            onChange={(event) => choose(event.target.files?.[0] ?? null)}
          />
        </div>
        {preview ? (
          <figure className="photo-preview">
            <img src={preview} alt={file ? `Prévia da foto ${file.name}` : "Prévia da foto"} />
            <figcaption>{file?.name}. A foto fica só nesta aba, até você pedir a leitura.</figcaption>
          </figure>
        ) : (
          <p className="hint">Nenhuma foto escolhida. O projeto segue com as medidas do formulário.</p>
        )}
        <fieldset>
          <legend>Sua chave do Gemini</legend>
          <div className="field">
            <label htmlFor="api-key">Sua chave do Gemini</label>
            <p id="chave-dica" className="hint">
              A chave fica só neste navegador e só é enviada ao Google para ler a foto. Ela não entra no projeto nem em
              outro servidor. O modelo é {GEMINI_MODEL}.
            </p>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="chave-dica"
              onChange={(event) => changeKey(event.target.value)}
            />
          </div>
          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={removeKey}>
              Remover chave
            </button>
            <button type="button" className="btn" disabled={!file || reading} onClick={() => void estimate()}>
              {reading ? "Lendo a foto…" : "Estimar pela foto"}
            </button>
          </div>
        </fieldset>
        {message ? (
          <p className="callout" role="status">
            <span className="badge">Nota</span> {message}
          </p>
        ) : null}
        {report ? (
          <div className="confirm" role="region" aria-live="polite" aria-labelledby="resultado-visao">
            <h3 id="resultado-visao">Estimativa da foto</h3>
            {wroteThisReading ? (
              <p>
                Esta análise já está no formulário e o projeto foi recalculado. Campos marcados com{" "}
                <span className="badge photo-tag">da foto</span> vieram dela. Edite o que quiser: essa edição não é
                reescrita, a menos que você analise uma foto de novo.
              </p>
            ) : (
              <p>Esta leitura não alterou o formulário.</p>
            )}
            {report.needsAnchor ? (
              <p>
                Sem uma medida válida em milímetros, a proporção não vira tamanho. Carregue o exemplo ou informe uma
                medida e analise de novo.
              </p>
            ) : null}
            {changed.length > 0 ? (
              <>
                <h4>O que mudou</h4>
                <ul className="estimates">
                  {changed.map((change) => (
                    <li key={change.field}>
                      <span className="badge">mudou</span>
                      {describeChange(change)}
                    </li>
                  ))}
                </ul>
              </>
            ) : wroteThisReading ? (
              <p>Nenhum número mudou. A foto confirmou o que já estava no formulário.</p>
            ) : null}
            <ul className="estimates">
              {report.lines.map((line) => (
                <li key={line.id}>
                  <span className="badge">estimativa</span>
                  <strong>{line.label}. </strong>
                  {line.text}
                </li>
              ))}
            </ul>
            {undo ? (
              <div className="actions">
                <button type="button" className="btn" onClick={undoAnalysis}>
                  Desfazer análise da foto
                </button>
              </div>
            ) : null}
            {undo ? (
              <p className="hint">
                Desfazer devolve os valores de antes da última análise que entrou no formulário, mesmo que você tenha
                editado algum campo depois.
              </p>
            ) : null}
          </div>
        ) : null}
      </form>
    </section>
  )
}

function describeChange(change: PhotoChange): string {
  const unit = change.field === "drawerCount" ? "" : " mm"
  const before = change.previous ? `${change.previous}${unit}` : "vazio"
  return `${change.label}: ${before} passou a ${change.next}${unit}.`
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ""
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}
