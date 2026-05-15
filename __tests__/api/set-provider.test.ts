import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

const { auth } = await import("@/auth")

describe("POST /api/set-provider", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { POST } = await import("@/app/api/set-provider/route")
    const req = new Request("http://localhost:3000/api/set-provider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId: "deepinfra", apiKey: "sk-test" }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it("returns 400 for invalid provider ID", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", email: "test@test.com" },
      expires: "",
    } as any)
    const { POST } = await import("@/app/api/set-provider/route")
    const req = new Request("http://localhost:3000/api/set-provider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId: "evil-provider", apiKey: "sk-test" }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })
})
