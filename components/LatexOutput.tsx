"use client"

import { useRef, useEffect, useCallback, useState, useMemo } from "react"
import { renderPreview } from "@/lib/mathjax"
import { parseOlmOcrResponse } from "@/lib/parse-olmocr"
import styles from "./LatexOutput.module.css"

interface LatexOutputProps {
  latex: string
  onLatexChange: (value: string) => void
  elapsedMs?: number
  label?: string
  onClear?: () => void
}

export default function LatexOutput({
  latex,
  onLatexChange,
  elapsedMs,
  label = "LaTeX output",
  onClear,
}: LatexOutputProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [metadataOpen, setMetadataOpen] = useState(false)

  const parsed = useMemo(() => parseOlmOcrResponse(latex), [latex])

  useEffect(() => {
    renderPreview(parsed.equation, previewRef.current)
  }, [parsed.equation])

  const copy = useCallback(
    async (text: string, id: string) => {
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
      } catch {}
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1200)
    },
    [],
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.sectionLabel}>{label}</span>
        <div className={styles.buttons}>
          <button
            className={`${styles.copyBtn} ${copiedId === "latex" ? styles.copied : ""}`}
            onClick={() => copy(parsed.equation, "latex")}
          >
            {copiedId === "latex" ? "Copied" : "Copy LaTeX"}
          </button>
          <button
            className={`${styles.copyBtn} ${copiedId === "mathjax" ? styles.copied : ""}`}
            onClick={() => copy(parsed.equation ? `$$${parsed.equation}$$` : "", "mathjax")}
          >
            {copiedId === "mathjax" ? "Copied" : "Copy MathJax"}
          </button>
          {onClear && (
            <button
              className={styles.clearBtn}
              onClick={onClear}
              disabled={!latex}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <textarea
        className={styles.textarea}
        value={latex}
        onChange={(e) => onLatexChange(e.target.value)}
        spellCheck={false}
        aria-label={label}
        aria-live="polite"
        placeholder="LaTeX appears here after capture…"
      />

      <div className={styles.previewHeader}>
        <span className={styles.sectionLabel}>Rendered preview</span>
        {elapsedMs !== undefined && (
          <span className={styles.badge}>{elapsedMs} ms</span>
        )}
      </div>

      <div className={styles.previewBox} ref={previewRef}>
        {!latex && (
          <span className={styles.placeholder}>
            Preview appears here once conversion completes.
          </span>
        )}
      </div>

      {parsed.metadata && (
        <div className={styles.accordion}>
          <button
            className={styles.accordionToggle}
            onClick={() => setMetadataOpen((v) => !v)}
            aria-expanded={metadataOpen}
          >
            <span
              className={styles.chevron}
              style={{ transform: metadataOpen ? "rotate(90deg)" : undefined }}
            >
              &#9654;
            </span>
            Metadata
          </button>
          {metadataOpen && (
            <div className={styles.metadataGrid}>
              {Object.entries(parsed.metadata).map(([key, val]) => (
                <div key={key} className={styles.metadataRow}>
                  <span className={styles.metadataKey}>{key}</span>
                  <span className={styles.metadataVal}>{String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
