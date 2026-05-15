module.exports = (review) => {
  const verdict = {
    approve:         "✅ **Approved** — no issues found",
    request_changes: "⚠️ **Changes requested**",
    block:           "🚫 **Blocked** — critical issues must be resolved",
  }[review.summary.overall_verdict]

  const findings = review.findings.map(f => {
    const icon = { critical:"🚫", error:"❌", warning:"⚠️", info:"ℹ️" }[f.severity]
    const conf = f.confidence < 0.6 ? " _(low confidence — human review requested)_" : ""
    return `${icon} **[${f.severity.toUpperCase()}]** \`${f.file}:${f.line}\`\n`
         + `> ${f.issue}${conf}\n`
         + `> **Fix:** ${f.suggested_fix}`
  }).join("\n\n")

  return `## 🤖 Claude Code Review\n\n${verdict}\n\n${findings || "_No issues found._"}`
}
