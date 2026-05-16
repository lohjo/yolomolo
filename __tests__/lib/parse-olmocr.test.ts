import { describe, it, expect } from "vitest"
import { parseOlmOcrResponse } from "@/lib/parse-olmocr"

describe("parseOlmOcrResponse", () => {
  it("splits standard metadata from equation", () => {
    const raw = `---
primary_language: en
is_rotation_valid: true
rotation_correction: 0
is_table: false
is_diagram: false
---
\\frac{x^2}{y}`

    const result = parseOlmOcrResponse(raw)
    expect(result.equation).toBe("\\frac{x^2}{y}")
    expect(result.metadata).toEqual({
      primary_language: "en",
      is_rotation_valid: true,
      rotation_correction: 0,
      is_table: false,
      is_diagram: false,
    })
    expect(result.rawMetadata).toContain("primary_language: en")
  })

  it("returns full string as equation when no metadata", () => {
    const raw = "\\frac{a}{b} + c"
    const result = parseOlmOcrResponse(raw)
    expect(result.equation).toBe("\\frac{a}{b} + c")
    expect(result.metadata).toBeNull()
    expect(result.rawMetadata).toBe("")
  })

  it("handles empty equation after metadata", () => {
    const raw = `---
primary_language: en
---
`
    const result = parseOlmOcrResponse(raw)
    expect(result.equation).toBe("")
    expect(result.metadata).toEqual({ primary_language: "en" })
  })

  it("handles multiline equation after metadata", () => {
    const raw = `---
primary_language: en
---
\\begin{align}
  x &= y + z \\\\
  a &= b
\\end{align}`

    const result = parseOlmOcrResponse(raw)
    expect(result.equation).toContain("\\begin{align}")
    expect(result.equation).toContain("\\end{align}")
  })

  it("handles incomplete frontmatter (no closing ---) as plain equation", () => {
    const raw = `---
primary_language: en
\\frac{x}{y}`

    const result = parseOlmOcrResponse(raw)
    expect(result.metadata).toBeNull()
    expect(result.equation).toBe(raw.trim())
  })

  it("trims whitespace from equation", () => {
    const raw = `---
primary_language: en
---

  \\frac{x}{y}
`
    const result = parseOlmOcrResponse(raw)
    expect(result.equation).toBe("\\frac{x}{y}")
  })

  it("parses boolean and numeric values correctly", () => {
    const raw = `---
is_table: true
rotation_correction: 90
label: some text
---
equation`

    const result = parseOlmOcrResponse(raw)
    expect(result.metadata?.is_table).toBe(true)
    expect(result.metadata?.rotation_correction).toBe(90)
    expect(result.metadata?.label).toBe("some text")
  })
})
