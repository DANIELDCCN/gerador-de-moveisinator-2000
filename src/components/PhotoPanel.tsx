import { useEffect, useRef, useState } from "react"
import type { FormState } from "../form/parse"
import { readGeminiKey, writeGeminiKey } from "../vision/keyStorage"
import { GEMINI_MODEL } from "../vision/reading"
import { knownFromForm, mergePhotoReading, type MergeResult } from "../vision/merge"
import { VisionError } from "../vision/messages"
import { readFurniturePhoto } from "../vision/reading"

interface Props {
  form: FormState
  onApply: (patch: Partial<FormState>) => void
}

export function PhotoPanel({ form, onApply }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [pending, setPending] = useState<MergeResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    setApiKey(readGeminiKey())
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  function choose(next: File | null) {
    setPending(null)
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
    setPending(null)
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
      setPending(mergePhotoReading(knownFromForm(form), result))
    } catch (error) {
      setPending(null)
      setMessage(error instanceof VisionError ? error.message : "Não foi possível ler a foto.")
    } finally {
      setReading(false)
    }
  }

  const canApply = pending != null && Object.keys(pending.patch).length > 0

  return (
    <section className="panel" aria-labelledby="foto-titulo">
      <form onSubmit={(event) => event.preventDefault()}>
        <h2 id="foto-titulo">Foto do móvel</h2>
        <p>
          A foto só sugere. A conta do projeto continua no navegador, sem a chave. Apague uma medida se quiser que a
          foto a estime. O que estiver digitado não muda.
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
          <p className="hint">Nenhuma foto escolhida. O projeto segue com as medidas digitadas.</p>
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
          <p className="callout" role="alert">
            <span className="badge">Nota</span> {message}
          </p>
        ) : null}
        {pending ? (
          <div className="confirm" role="region" aria-labelledby="confirmar-visao">
            <h3 id="confirmar-visao">Confirme antes de usar</h3>
            <p>Cada linha abaixo é uma estimativa. Nada entra na conta até você confirmar.</p>
            {pending.needsAnchor ? (
              <p>Para transformar a proporção em milímetros, deixe pelo menos uma medida preenchida.</p>
            ) : null}
            <ul className="estimates">
              {pending.lines.map((line) => (
                <li key={line.id}>
                  <span className="badge">estimativa</span>
                  <strong>{line.label}. </strong>
                  {line.text}
                </li>
              ))}
            </ul>
            <div className="actions">
              <button
                type="button"
                className="btn"
                disabled={!canApply}
                onClick={() => {
                  onApply(pending.patch)
                  setPending(null)
                  setMessage("Campos vazios preenchidos com a estimativa. Confira cada número.")
                }}
              >
                {canApply ? "Preencher os campos vazios" : "Nada para preencher"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setPending(null)}>
                Descartar
              </button>
            </div>
          </div>
        ) : null}
      </form>
    </section>
  )
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
