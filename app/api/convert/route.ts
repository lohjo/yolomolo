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

  const wantStream = new URL(request.url).searchParams.get("stream") === "1"

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
      ...(wantStream ? { stream: true } : {}),
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

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: body.error?.message ?? `Upstream returned ${res.status}` },
        { status: 502 },
      )
    }

    if (wantStream && res.body) {
      const encoder = new TextEncoder()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      const stream = new ReadableStream({
        async start(controller) {
          let fullLatex = ""
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const chunk = decoder.decode(value, { stream: true })
              for (const line of chunk.split("\n")) {
                if (!line.startsWith("data: ") || line === "data: [DONE]")
                  continue
                try {
                  const json = JSON.parse(line.slice(6))
                  const delta = json.choices?.[0]?.delta?.content ?? ""
                  if (delta) {
                    fullLatex += delta
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ latex: fullLatex, partial: true })}\n\n`,
                      ),
                    )
                  }
                } catch {
                  // skip malformed SSE lines
                }
              }
            }
            const elapsed = Date.now() - start
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ latex: fullLatex, partial: false, confidence: 0.9, elapsed_ms: elapsed, model: "olmOCR-2-7B" })}\n\n`,
              ),
            )
          } finally {
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    const data = await res.json()
    const latex = data.choices?.[0]?.message?.content ?? ""
    const elapsed = Date.now() - start

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
