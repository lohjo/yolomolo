"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { renderPreview } from "@/lib/mathjax"
import styles from "./LatexOutput.module.css"

interface LatexOutputProps {
  latex: string
  onLatexChange: (value: string) => void
  elapsedMs?: number
  label?: string
}

export default function LatexOutput({
  latex,
  onLatexChange,
  elapsedMs,
  label = "LaTeX output",
}: LatexOutputProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    renderPreview(latex, previewRef.current)
  }, [latex])

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
            onClick={() => copy(latex, "latex")}
          >
            {copiedId === "latex" ? "Copied" : "Copy LaTeX"}
          </button>
          <button
            className={`${styles.copyBtn} ${copiedId === "mathjax" ? styles.copied : ""}`}
            onClick={() => copy(latex ? `$$${latex}$$` : "", "mathjax")}
          >
            {copiedId === "mathjax" ? "Copied" : "Copy MathJax"}
          </button>
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
    </div>
  )
}
