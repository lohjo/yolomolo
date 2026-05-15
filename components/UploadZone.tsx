"use client"

import { useRef, useState } from "react"
import { useOcrPipeline } from "@/lib/use-ocr-pipeline"
import LatexOutput from "./LatexOutput"
import Pipeline from "./Pipeline"
import styles from "./UploadZone.module.css"

interface UploadZoneProps {
  onResult: (latex: string, ms: number) => void
}

export default function UploadZone({ onResult }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const { state, run, setLatex } = useOcrPipeline(onResult)

  const showFile = (f: File) => setFile(f)
  const clearFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleConvert = () => {
    if (file && !state.inflight) run(file)
  }

  const zoneClass = [
    styles.zone,
    dragOver ? styles.dragOver : "",
    file ? styles.hasFile : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1px",
        background: "var(--rule)",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      <section
        style={{
          background: "var(--surface)",
          padding: "var(--sp-5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-4)",
        }}
      >
        <span
          style={{
            font: "var(--t-section)",
            textTransform: "uppercase",
            letterSpacing: "0.10em",
            color: "var(--blue)",
          }}
        >
          Image source
        </span>
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
            className={`${styles.btn} ${styles.btnPrimary} ${state.inflight ? styles.loading : ""}`}
            disabled={!file || state.inflight}
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

        {state.visible && (
          <Pipeline
            steps={state.steps}
            heading={state.heading}
            dotColor={state.dotColor}
            showFinalizing={state.showFinalizing}
          />
        )}
      </section>

      <section
        style={{
          background: "var(--surface)",
          padding: "var(--sp-5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-4)",
        }}
      >
        <LatexOutput
          latex={state.latex}
          onLatexChange={setLatex}
          elapsedMs={state.elapsedMs}
          label="LaTeX source"
        />
      </section>
    </div>
  )
}
