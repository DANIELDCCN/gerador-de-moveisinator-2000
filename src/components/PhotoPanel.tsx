import { useEffect, useRef, useState } from "react"
import { formPatchFromEstimate } from "../vision/apply"
import { geminiVisionProvider } from "../vision/gemini"
import type { VisionEstimate } from "../vision/types"
import type { FormState } from "../form/parse"

interface Props {
  onApply: (patch: Partial<FormState>) => void
}

export function PhotoPanel({ onApply }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)
  const [proxyUrl, setProxyUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [pending, setPending] = useState<VisionEstimate | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
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

  async function estimate() {
    if (!file) return
    if (!geminiVisionProvider.available) {
      setMessage("Em breve. A leitura da foto está desligada nesta versão e nenhum arquivo é enviado.")
      return
    }
    try {
      const imageBase64 = await fileToBase64(file)
      const result = await geminiVisionProvider.estimate({
        imageBase64,
        mediaType: file.type || "image/jpeg",
        apiKey,
        proxyUrl,
      })
      setPending(result)
      setMessage(null)
    } catch (error) {
      setPending(null)
      setMessage(error instanceof Error ? error.message : "Não foi possível ler a foto.")
    }
  }

  return (
    <section className="panel" aria-labelledby="foto-titulo">
      <form onSubmit={(event) => event.preventDefault()}>
      <h2 id="foto-titulo">Foto do móvel</h2>
      <p>
        Em breve, uma leitura da foto pode sugerir altura, largura, profundidade e quantidade de gavetas. A visão não
        calcula o projeto: você confirma os números e o motor é que faz a conta.
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
          <figcaption>{file?.name}. A foto fica só nesta aba.</figcaption>
        </figure>
      ) : (
        <p className="hint">Nenhuma foto escolhida. O projeto segue com as medidas digitadas.</p>
      )}
      <fieldset className="future">
        <legend>Preparação da leitura automática</legend>
        <div className="field">
          <label htmlFor="proxy">Endereço do proxy</label>
          <p id="proxy-dica" className="hint">
            Quando a etapa existir, a chave vai para um proxy seu. Não deixe chave nenhuma no código.
          </p>
          <input
            id="proxy"
            value={proxyUrl}
            autoComplete="off"
            aria-describedby="proxy-dica"
            onChange={(event) => setProxyUrl(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="api-key">Chave de API</label>
          <p id="chave-dica" className="hint">
            Fica só na memória desta aba. Não é salva e não é enviada enquanto a leitura estiver desligada.
          </p>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            autoComplete="off"
            aria-describedby="chave-dica"
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>
        <button type="button" className="btn btn-secondary" disabled={!file} onClick={() => void estimate()}>
          Estimar medidas pela foto
        </button>
        <p id="visao-nota" className="hint">
          Estado: {geminiVisionProvider.available ? "ligada" : "desligada, em breve"}.
        </p>
      </fieldset>
      {message ? (
        <p className="callout" role="status">
          <span className="badge">Nota</span> {message}
        </p>
      ) : null}
      {pending ? (
        <div className="confirm" role="region" aria-labelledby="confirmar-visao">
          <h3 id="confirmar-visao">Confirme antes de usar</h3>
          <p>Isto é sugestão da foto. Nada entra na conta até você aceitar.</p>
          <ul>
            {pending.heightMm != null ? <li>Altura: {pending.heightMm} mm</li> : null}
            {pending.widthMm != null ? <li>Largura: {pending.widthMm} mm</li> : null}
            {pending.depthMm != null ? <li>Profundidade: {pending.depthMm} mm</li> : null}
            {pending.drawerCount != null ? <li>Gavetas: {pending.drawerCount}</li> : null}
            <li>{pending.notes}</li>
          </ul>
          <div className="actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                onApply(formPatchFromEstimate(pending))
                setPending(null)
                setMessage("Sugestões copiadas para o formulário. Confira cada campo.")
              }}
            >
              Usar estas sugestões
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
