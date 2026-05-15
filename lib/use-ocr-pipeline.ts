"use client"

import { useCallback, useRef, useState } from "react"
import { convertImage } from "@/lib/api-client"
import type { PipelineStep, PipelineStepKey } from "@/lib/types"

const INITIAL: PipelineStep[] = [
  { key: "preprocess", state: "pending", status: "" },
  { key: "segment", state: "pending", status: "" },
  { key: "inference", state: "pending", status: "" },
  { key: "postprocess", state: "pending", status: "" },
  { key: "render", state: "pending", status: "" },
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const jitter = (min: number, max: number) =>
  Math.round(min + Math.random() * (max - min))

export interface OcrPipelineState {
  steps: PipelineStep[]
  heading: string
  dotColor: string
  showFinalizing: boolean
  visible: boolean
  latex: string
  elapsedMs?: number
  inflight: boolean
  error?: string
}

export function useOcrPipeline(onResult: (latex: string, ms: number) => void) {
  const [state, setState] = useState<OcrPipelineState>({
    steps: INITIAL.map((s) => ({ ...s })),
    heading: "Processing",
    dotColor: "var(--amber)",
    showFinalizing: false,
    visible: false,
    latex: "",
    elapsedMs: undefined,
    inflight: false,
    error: undefined,
  })

  const previewRef = useRef<HTMLDivElement | null>(null)

  const updateStep = useCallback(
    (key: PipelineStepKey, patch: Partial<PipelineStep>) => {
      setState((prev) => ({
        ...prev,
        steps: prev.steps.map((s) =>
          s.key === key ? { ...s, ...patch } : s,
        ),
      }))
    },
    [],
  )

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      steps: INITIAL.map((s) => ({ ...s })),
      heading: "Processing",
      dotColor: "var(--amber)",
      showFinalizing: false,
      latex: "",
      elapsedMs: undefined,
      error: undefined,
    }))
  }, [])

  const setLatex = useCallback((latex: string) => {
    setState((prev) => ({ ...prev, latex }))
  }, [])

  const run = useCallback(
    async (file: File) => {
      if (state.inflight) return
      setState((prev) => ({ ...prev, inflight: true, visible: true }))
      reset()

      updateStep("preprocess", { state: "running", status: "Binarising" })
      const pre = jitter(120, 240)
      await sleep(pre)
      updateStep("preprocess", { state: "done", status: `${pre} ms` })

      updateStep("segment", { state: "running", status: "Detecting regions" })
      const seg = jitter(220, 420)
      await sleep(seg)
      updateStep("segment", { state: "done", status: `${seg} ms` })

      updateStep("inference", { state: "running", status: "Querying olmOCR" })
      const t0 = performance.now()
      let stopCounter = false
      const tick = async () => {
        while (!stopCounter) {
          await sleep(160)
          if (stopCounter) break
          const tokens = Math.round((performance.now() - t0) / 32)
          updateStep("inference", {
            state: "running",
            status: `Querying olmOCR… ${tokens} tokens`,
          })
        }
      }
      const counterPromise = tick()

      try {
        const data = await convertImage(file)
        stopCounter = true
        await counterPromise
        const inferMs = Math.round(performance.now() - t0)
        updateStep("inference", { state: "done", status: `${inferMs} ms` })

        updateStep("postprocess", {
          state: "running",
          status: "Cleaning LaTeX",
        })
        const post = jitter(120, 280)
        await sleep(post)
        updateStep("postprocess", { state: "done", status: `${post} ms` })

        updateStep("render", { state: "running", status: "Rendering MathJax" })
        setState((prev) => ({ ...prev, latex: data.latex }))

        const renderStart = performance.now()
        await new Promise((r) => setTimeout(r, 60))
        const renderMs = Math.round(performance.now() - renderStart)
        updateStep("render", { state: "done", status: `${renderMs} ms` })

        setState((prev) => ({
          ...prev,
          heading: "Done",
          dotColor: "var(--green)",
          showFinalizing: true,
          elapsedMs: data.elapsed_ms,
          inflight: false,
        }))

        if (data.latex) onResult(data.latex, data.elapsed_ms)
      } catch (e: unknown) {
        stopCounter = true
        await counterPromise
        const message = e instanceof Error ? e.message : "Conversion failed"
        updateStep("inference", { state: "error", status: message })
        setState((prev) => ({
          ...prev,
          heading: "Error",
          dotColor: "var(--red)",
          inflight: false,
          error: message,
        }))
      }
    },
    [state.inflight, reset, updateStep, onResult],
  )

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }))
  }, [])

  return { state, run, hide, setLatex, previewRef }
}
