import type { OcrResult, HealthStatus } from "@/lib/types"

export async function convertImage(file: File): Promise<OcrResult> {
  const form = new FormData()
  form.append("image", file)

  const res = await fetch("/api/convert", { method: "POST", body: form })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Convert failed (${res.status})`)
  }

  return res.json()
}

export async function convertImageStream(
  file: File,
  onPartial: (latex: string) => void,
): Promise<OcrResult> {
  const form = new FormData()
  form.append("image", file)

  const res = await fetch("/api/convert?stream=1", {
    method: "POST",
    body: form,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Convert failed (${res.status})`)
  }

  if (!res.body) {
    return res.json()
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let lastResult: OcrResult = { latex: "", confidence: 0.9, elapsed_ms: 0 }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue
      try {
        const data = JSON.parse(line.slice(6))
        if (data.partial) {
          onPartial(data.latex)
        } else {
          lastResult = {
            latex: data.latex,
            confidence: data.confidence ?? 0.9,
            elapsed_ms: data.elapsed_ms ?? 0,
          }
        }
      } catch {
        // skip malformed SSE lines
      }
    }
  }

  return lastResult
}

export async function enhanceImage(file: File): Promise<OcrResult> {
  const form = new FormData()
  form.append("image", file)

  const res = await fetch("/api/enhance", { method: "POST", body: form })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Enhance failed (${res.status})`)
  }

  return res.json()
}

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch("/api/health")

  if (!res.ok) {
    return {
      status: "error",
      model_loaded: false,
      loading: false,
      error: `Health check failed (${res.status})`,
    }
  }

  return res.json()
}

export async function setProvider(
  providerId: string,
  apiKey: string,
): Promise<void> {
  const res = await fetch("/api/set-provider", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerId, apiKey }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Set provider failed (${res.status})`)
  }
}
