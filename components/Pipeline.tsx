"use client"

import styles from "./Pipeline.module.css"
import type { PipelineStep, PipelineStepKey } from "@/lib/types"

const ICONS: Record<PipelineStep["state"], string> = {
  pending: "○",
  running: "◐",
  done: "✓",
  error: "✕",
}

const LABELS: Record<PipelineStepKey, string> = {
  preprocess: "Preprocessing image",
  segment: "Segmenting regions",
  inference: "olmOCR VLM inference",
  postprocess: "Generating LaTeX",
  render: "Rendering preview",
}

interface PipelineProps {
  steps: PipelineStep[]
  heading: string
  dotColor: string
  showFinalizing: boolean
}

export default function Pipeline({
  steps,
  heading,
  dotColor,
  showFinalizing,
}: PipelineProps) {
  return (
    <div className={styles.box} role="status" aria-live="polite">
      <div className={styles.header}>
        <div className={styles.dot} style={{ background: dotColor }} />
        <span className={styles.heading}>{heading}</span>
      </div>
      {steps.map((step) => (
        <div
          key={step.key}
          className={`${styles.step} ${styles[step.state]}`}
          data-state={step.state}
        >
          <div className={styles.icon}>{ICONS[step.state]}</div>
          <div className={styles.label}>{LABELS[step.key]}</div>
          <div className={styles.status}>
            {step.status}
            {step.state === "running" && step.status && (
              <span className={styles.runningDot} />
            )}
          </div>
        </div>
      ))}
      {showFinalizing && (
        <div className={styles.finalizing}>
          <div className={styles.finalizingDot} />
          <span>Preparing output…</span>
        </div>
      )}
    </div>
  )
}
