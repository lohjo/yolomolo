import { describe, it, expect } from "vitest"
import { validateSemantics } from "@/lib/validation"

describe("validateSemantics", () => {
  it("returns no errors when counts match", () => {
    const result = {
      findings: [
        {
          id: "1",
          file: "auth.ts",
          line: 10,
          severity: "critical" as const,
          category: "security" as const,
          issue: "Missing auth check",
          suggested_fix: "Add await auth()",
          detected_pattern: "export async function POST",
          confidence: 0.95,
        },
      ],
      summary: {
        critical_count: 1,
        error_count: 0,
        overall_verdict: "block" as const,
      },
      reviewed_files: ["auth.ts"],
    }
    expect(validateSemantics(result)).toEqual([])
  })

  it("detects critical_count mismatch", () => {
    const result = {
      findings: [],
      summary: {
        critical_count: 2,
        error_count: 0,
        overall_verdict: "block" as const,
      },
      reviewed_files: [],
    }
    const errors = validateSemantics(result)
    expect(errors.length).toBe(1)
    expect(errors[0]).toContain("critical_count is 2 but found 0")
  })

  it("detects error_count mismatch", () => {
    const result = {
      findings: [
        {
          id: "1",
          file: "a.ts",
          line: 1,
          severity: "error" as const,
          category: "bug" as const,
          issue: "Bug",
          suggested_fix: "Fix it",
          detected_pattern: "code",
        },
      ],
      summary: {
        critical_count: 0,
        error_count: 5,
        overall_verdict: "request_changes" as const,
      },
      reviewed_files: ["a.ts"],
    }
    const errors = validateSemantics(result)
    expect(errors.some((e) => e.includes("error_count"))).toBe(true)
  })

  it("detects missing required fields", () => {
    const result = {
      findings: [
        {
          id: "",
          file: "a.ts",
          line: 1,
          severity: "warning" as const,
          category: "other" as const,
          issue: "Something",
          suggested_fix: "Do something",
          detected_pattern: "",
        },
      ],
      summary: {
        critical_count: 0,
        error_count: 0,
        overall_verdict: "approve" as const,
      },
      reviewed_files: ["a.ts"],
    }
    const errors = validateSemantics(result)
    expect(errors.some((e) => e.includes("missing required fields"))).toBe(true)
  })
})
