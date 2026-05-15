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
