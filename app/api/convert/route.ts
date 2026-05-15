import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { OLMOCR_PROMPT } from "@/lib/olmocr-prompt"

const DEEPINFRA_ENDPOINT = "https://api.deepinfra.com/v1/openai/chat/completions"
const DEEPINFRA_MODEL = "allenai/olmOCR-2-7B-1025"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.DEEPINFRA_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server not configured", code: "NO_KEY" },
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
    const mime = image.type || "image/png"

    const payload = {
      model: DEEPINFRA_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: OLMOCR_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${b64}` },
            },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    }

    const start = Date.now()
    const res = await fetch(DEEPINFRA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(85_000),
    })
    const elapsed = Date.now() - start

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: body.error?.message ?? `Upstream returned ${res.status}` },
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
        { error: "Upstream request timed out" },
        { status: 504 },
      )
    }
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 })
  }
}
