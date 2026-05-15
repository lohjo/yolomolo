import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/auth"
import { OLMOCR_PROMPT } from "@/lib/olmocr-prompt"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cookieStore = await cookies()
  const providerCookie = cookieStore.get("mathscribe-provider")

  if (!providerCookie?.value) {
    return NextResponse.json(
      { error: "No provider configured", code: "NO_PROVIDER" },
      { status: 503 },
    )
  }

  let provider: { id: string; server: string; model: string; apiKey: string }
  try {
    provider = JSON.parse(providerCookie.value)
  } catch {
    return NextResponse.json(
      { error: "Invalid provider config", code: "NO_PROVIDER" },
      { status: 503 },
    )
  }

  const formData = await request.formData()
  const image = formData.get("image") as File | null

  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 })
  }

  try {
    const arrayBuf = await image.arrayBuffer()
    const b64 = Buffer.from(arrayBuf).toString("base64")

    const payload = {
      model: provider.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: OLMOCR_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${b64}` },
            },
          ],
        },
      ],
      max_tokens: 8000,
      temperature: 0.1,
    }

    const start = Date.now()

    const res = await fetch(`${provider.server}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90_000),
    })

    const elapsed = Date.now() - start

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: body.error?.message ?? `Provider returned ${res.status}` },
        { status: 502 },
      )
    }

    const data = await res.json()
    const latex = data.choices?.[0]?.message?.content ?? ""

    return NextResponse.json({
      latex,
      confidence: 0.9,
      elapsed_ms: elapsed,
      model: "olmOCR-2-7B",
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Provider request timed out" },
        { status: 504 },
      )
    }
    return NextResponse.json(
      { error: "Provider unreachable" },
      { status: 502 },
    )
  }
}
