import { NextResponse } from "next/server"

const BACKEND = process.env.FASTAPI_BACKEND_URL ?? "http://localhost:8000"

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/health`, {
      signal: AbortSignal.timeout(5_000),
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      {
        status: "error",
        model_loaded: false,
        loading: false,
        error: "Backend unreachable",
      },
      { status: 200 },
    )
  }
}
