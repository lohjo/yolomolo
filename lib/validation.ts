interface ReviewFinding {
  id: string
  file: string
  line: number
  severity: "critical" | "error" | "warning" | "info"
  category: "security" | "bug" | "performance" | "other"
  issue: string
  suggested_fix: string
  detected_pattern: string
  confidence?: number
}

interface ReviewResult {
  findings: ReviewFinding[]
  summary: {
    critical_count: number
    error_count: number
    overall_verdict: "approve" | "request_changes" | "block"
  }
  reviewed_files: string[]
}

export function validateSemantics(result: ReviewResult): string[] {
  const errors: string[] = []

  const actualCritical = result.findings.filter(
    (f) => f.severity === "critical",
  ).length
  if (result.summary.critical_count !== actualCritical) {
    errors.push(
      `critical_count is ${result.summary.critical_count} but found ${actualCritical} critical findings`,
    )
  }

  const actualError = result.findings.filter(
    (f) => f.severity === "error",
  ).length
  if (result.summary.error_count !== actualError) {
    errors.push(
      `error_count is ${result.summary.error_count} but found ${actualError} error findings`,
    )
  }

  for (const f of result.findings) {
    if (!f.id || !f.file || !f.issue || !f.suggested_fix || !f.detected_pattern) {
      errors.push(`Finding ${f.id || "(no id)"} missing required fields`)
    }
  }

  return errors
}

export type { ReviewFinding, ReviewResult }
