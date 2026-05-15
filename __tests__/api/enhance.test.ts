import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}))

const { auth } = await import("@/auth")
const { cookies } = await import("next/headers")

describe("POST /api/enhance", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { POST } = await import("@/app/api/enhance/route")
    const req = new Request("http://localhost:3000/api/enhance", {
      method: "POST",
      body: new FormData(),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it("returns 503 when no provider configured", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", email: "test@test.com" },
      expires: "",
    } as any)
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any)
    const { POST } = await import("@/app/api/enhance/route")
    const form = new FormData()
    form.append("image", new Blob(["test"], { type: "image/png" }), "test.png")
    const req = new Request("http://localhost:3000/api/enhance", {
      method: "POST",
      body: form,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.code).toBe("NO_PROVIDER")
  })
})
