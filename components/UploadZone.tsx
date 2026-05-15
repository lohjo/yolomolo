"use client"

import { useRef, useState, useCallback } from "react"
import { convertImage } from "@/lib/api-client"
import type { PipelineStep } from "@/lib/types"
import LatexOutput from "./LatexOutput"
import Pipeline from "./Pipeline"
import styles from "./UploadZone.module.css"

interface UploadZoneProps {
  onResult: (latex: string, ms: number) => void
}

const INITIAL_STEPS: PipelineStep[] = [
  { key: "preprocess", state: "pending", status: "" },
  { key: "inference", state: "pending", status: "" },
  { key: "render", state: "pending", status: "" },
]

export default function UploadZone({ onResult }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [inflight, setInflight] = useState(false)
  const [showPipeline, setShowPipeline] = useState(false)
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS)
  const [pipelineHeading, setPipelineHeading] = useState("Processing")
  const [dotColor, setDotColor] = useState("var(--amber)")
  const [showFinalizing, setShowFinalizing] = useState(false)
  const [latex, setLatex] = useState("")
  const [elapsedMs, setElapsedMs] = useState<number | undefined>(undefined)

  const updateStep = (key: string, state: PipelineStep["state"], status: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, state, status } : s)),
    )
  }

  const resetPipeline = () => {
    setSteps(INITIAL_STEPS.map((s) => ({ ...s })))
    setShowFinalizing(false)
    setPipelineHeading("Processing")
    setDotColor("var(--amber)")
  }

  const showFile = (f: File) => {
    setFile(f)
  }

  const clearFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleConvert = useCallback(async () => {
    if (!file || inflight) return
    setInflight(true)
    setShowPipeline(true)
    resetPipeline()

    updateStep("preprocess", "running", "Binarising…")
    await new Promise((r) => setTimeout(r, 100))
    updateStep("preprocess", "done", "done")
    updateStep("inference", "running", "Querying OCR…")

    try {
      const data = await convertImage(file)
      const ms = data.elapsed_ms
      updateStep("inference", "done", `${ms} ms`)
      updateStep("render", "running", "Rendering…")

      if (data.latex) {
        setLatex(data.latex)
        setElapsedMs(ms)
        onResult(data.latex, ms)
      }

      updateStep("render", "done", "done")
      setPipelineHeading("Done")
      setDotColor("var(--green)")
      setShowFinalizing(true)
    } catch (e: any) {
      updateStep("inference", "error", e.message)
      setPipelineHeading("Error")
      setDotColor("var(--red)")
    } finally {
      setInflight(false)
    }
  }, [file, inflight, onResult])

  const zoneClass = [
    styles.zone,
    dragOver ? styles.dragOver : "",
    file ? styles.hasFile : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--rule)", minHeight: "calc(100vh - 120px)" }}>
      <section style={{ background: "var(--surface)", padding: "var(--sp-5)", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <span style={{ font: "var(--t-section)", textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--blue)" }}>Image source</span>
        <div
          className={zoneClass}
          role="button"
          tabIndex={0}
          aria-label="Upload image of handwritten math"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files[0]) showFile(e.dataTransfer.files[0])
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            hidden
            onChange={(e) => {
              if (e.target.files?.[0]) showFile(e.target.files[0])
            }}
          />
          <div className={styles.icon}>{file ? "✓" : "⊕"}</div>
          <p className={styles.label}>
            {file ? "Ready to convert" : "Drop an image or click to browse"}
          </p>
          {!file && <p className={styles.sublabel}>JPG · PNG · HEIC · WebP</p>}
          {file && (
            <p className={styles.filename}>
              {file.name} · {Math.round(file.size / 1024)} KB
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnPrimary} ${inflight ? styles.loading : ""}`}
            disabled={!file || inflight}
            onClick={handleConvert}
          >
            Convert →
          </button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={clearFile}
          >
            Clear
          </button>
        </div>

        {showPipeline && (
          <Pipeline
            steps={steps}
            heading={pipelineHeading}
            dotColor={dotColor}
            showFinalizing={showFinalizing}
          />
        )}
      </section>

      <section style={{ background: "var(--surface)", padding: "var(--sp-5)", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <LatexOutput
          latex={latex}
          onLatexChange={setLatex}
          elapsedMs={elapsedMs}
          label="LaTeX source"
        />
      </section>
    </div>
  )
}
