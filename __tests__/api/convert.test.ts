import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

const { auth } = await import("@/auth")

describe("POST /api/convert", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.DEEPINFRA_API_KEY = "test-key"
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { POST } = await import("@/app/api/convert/route")
    const req = {
      formData: vi.fn(),
    } as unknown as Request
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("returns 503 NO_KEY when DEEPINFRA_API_KEY missing", async () => {
    delete process.env.DEEPINFRA_API_KEY
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", email: "test@test.com" },
      expires: "",
    } as never)
    const { POST } = await import("@/app/api/convert/route")
    const req = {
      formData: vi.fn(),
    } as unknown as Request
    const res = await POST(req)
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.code).toBe("NO_KEY")
  })

  it("returns 400 when no image provided", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", email: "test@test.com" },
      expires: "",
    } as never)
    const { POST } = await import("@/app/api/convert/route")
    const form = new FormData()
    const req = {
      formData: vi.fn().mockResolvedValue(form),
    } as unknown as Request
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
