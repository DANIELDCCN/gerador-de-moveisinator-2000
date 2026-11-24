const STORAGE_KEY = "oficina-clara.gemini-api-key"

export function readGeminiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ""
  } catch {
    return ""
  }
}

export function writeGeminiKey(value: string): void {
  try {
    const trimmed = value.trim()
    if (!trimmed) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, trimmed)
  } catch {
    // Navegador sem localStorage. A chave fica só na memória da aba.
  }
}
