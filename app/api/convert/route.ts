import { NextResponse } from "next/server"
import { auth } from "@/auth"

const BACKEND = process.env.FASTAPI_BACKEND_URL ?? "http://localhost:8000"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const image = formData.get("image") as File | null

  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 })
  }

  try {
    const upstream = new FormData()
    upstream.append("image", image)

    const res = await fetch(`${BACKEND}/convert`, {
      method: "POST",
      body: upstream,
      signal: AbortSignal.timeout(28_000),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Provider error" }))
      return NextResponse.json(body, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Backend request timed out" },
        { status: 504 },
      )
    }
    return NextResponse.json(
      { error: "Backend unreachable" },
      { status: 502 },
    )
  }
}
