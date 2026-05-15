import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { PROVIDERS } from "@/lib/providers"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { providerId?: string; apiKey?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { providerId, apiKey } = body

  if (!providerId || !apiKey) {
    return NextResponse.json(
      { error: "providerId and apiKey are required" },
      { status: 400 },
    )
  }

  const provider = PROVIDERS.find((p) => p.id === providerId)

  if (!provider) {
    return NextResponse.json(
      { error: "Invalid provider ID" },
      { status: 400 },
    )
  }

  const cookieValue = JSON.stringify({
    id: provider.id,
    server: provider.server,
    model: provider.model,
    apiKey,
  })

  const response = NextResponse.json({ ok: true })

  response.cookies.set("mathscribe-provider", cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })

  return response
}
