export interface ParsedOlmOcrResponse {
  metadata: Record<string, string | boolean | number> | null
  rawMetadata: string
  equation: string
}

const FRONTMATTER_RE = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n?/

function parseValue(raw: string): string | boolean | number {
  const trimmed = raw.trim()
  if (trimmed === "true") return true
  if (trimmed === "false") return false
  const num = Number(trimmed)
  if (trimmed !== "" && !Number.isNaN(num)) return num
  return trimmed
}

export function parseOlmOcrResponse(raw: string): ParsedOlmOcrResponse {
  const match = raw.match(FRONTMATTER_RE)
  if (!match) {
    return { metadata: null, rawMetadata: "", equation: raw.trim() }
  }

  const rawMetadata = match[0]
  const body = match[1]
  const equation = raw.slice(rawMetadata.length).trim()

  const metadata: Record<string, string | boolean | number> = {}
  for (const line of body.split("\n")) {
    const idx = line.indexOf(":")
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1)
    if (key) metadata[key] = parseValue(val)
  }

  return { metadata, rawMetadata, equation }
}
