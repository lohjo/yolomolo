"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { convertImage } from "@/lib/api-client"
import LatexOutput from "./LatexOutput"
import styles from "./CameraCapture.module.css"

const CAPTURE_MAX_DIM = 448
const JPEG_QUALITY = 0.85
const CAPTURE_INTERVAL = 2000
const DIFF_THRESHOLD = 0.03

interface CameraCaptureProps {
  modelReady: boolean
  onResult: (latex: string, ms: number) => void
}

export default function CameraCapture({
  modelReady,
  onResult,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null)
  const inflightRef = useRef(false)

  const [cameraState, setCameraState] = useState("Waiting for camera…")
  const [showVideo, setShowVideo] = useState(false)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [latex, setLatex] = useState("")
  const [elapsedMs, setElapsedMs] = useState<number | undefined>(undefined)

  const frameDiff = useCallback((current: Uint8ClampedArray) => {
    const prev = prevFrameRef.current
    if (!prev || prev.length !== current.length) return 1.0
    let diff = 0
    for (let i = 0; i < current.length; i += 4 * 16) {
      diff += Math.abs(current[i] - prev[i])
    }
    return diff / (Math.floor(current.length / 64) * 255)
  }, [])

  const sendImage = useCallback(
    async (blob: Blob) => {
      if (inflightRef.current) return
      inflightRef.current = true
      try {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" })
        const data = await convertImage(file)
        if (data.latex) {
          setLatex(data.latex)
          setElapsedMs(data.elapsed_ms)
          onResult(data.latex, data.elapsed_ms)
        }
      } catch (e: any) {
        setElapsedMs(undefined)
      } finally {
        inflightRef.current = false
      }
    },
    [onResult],
  )

  const captureFrame = useCallback(
    (force: boolean) => {
      if (inflightRef.current || !streamRef.current || !modelReady) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      const ctx = canvas.getContext("2d", { alpha: false })
      if (!ctx) return

      const track = streamRef.current.getVideoTracks()[0]
      if (!track) return

      const s = track.getSettings()
      const srcW = s.width || video.videoWidth || 640
      const srcH = s.height || video.videoHeight || 480
      const scale = Math.min(1, CAPTURE_MAX_DIM / Math.max(srcW, srcH))
      canvas.width = Math.round(srcW * scale)
      canvas.height = Math.round(srcH * scale)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      const diff = frameDiff(frame)
      prevFrameRef.current = frame

      if (!force && diff < DIFF_THRESHOLD) return
      canvas.toBlob(
        (blob) => {
          if (blob) sendImage(blob)
        },
        "image/jpeg",
        JPEG_QUALITY,
      )
    },
    [modelReady, frameDiff, sendImage],
  )

  const startCamera = useCallback(async () => {
    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setShowVideo(true)
      setCameraState("")
    } catch (e: any) {
      const msg =
        e.name === "NotAllowedError"
          ? "Camera permission denied"
          : `Camera: ${e.message}`
      setCameraState(msg)
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setShowVideo(false)
  }, [])

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (modelReady && streamRef.current && !timerRef.current) {
      timerRef.current = setInterval(() => captureFrame(false), CAPTURE_INTERVAL)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [modelReady, captureFrame])

  const handleFlip = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    stopCamera()
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
  }

  useEffect(() => {
    if (!showVideo && facingMode) {
      startCamera()
    }
  }, [facingMode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault()
        captureFrame(true)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [captureFrame])

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--rule)", minHeight: "calc(100vh - 120px)" }}>
      <section style={{ background: "var(--surface)", padding: "var(--sp-5)", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <span className={styles.hint} style={{ color: "var(--blue)", font: "var(--t-section)", textTransform: "uppercase", letterSpacing: "0.10em" }}>Camera feed</span>
        <div className={styles.panel}>
          {!showVideo && <div className={styles.stage}>{cameraState}</div>}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={styles.video}
            style={{ display: showVideo ? "block" : "none" }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div className={styles.reticle} aria-hidden="true">
            <span className={`${styles.corner} ${styles.tl}`} />
            <span className={`${styles.corner} ${styles.tr}`} />
            <span className={`${styles.corner} ${styles.bl}`} />
            <span className={`${styles.corner} ${styles.br}`} />
            <span className={styles.scanLine} />
          </div>
          <div className={styles.controls}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => captureFrame(true)}
            >
              Capture
            </button>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={handleFlip}
            >
              Flip
            </button>
          </div>
        </div>
        <p className={styles.hint}>
          Auto-captures every 2s when model ready · Ctrl+Enter to force capture
        </p>
      </section>

      <section style={{ background: "var(--surface)", padding: "var(--sp-5)", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <LatexOutput
          latex={latex}
          onLatexChange={setLatex}
          elapsedMs={elapsedMs}
        />
      </section>
    </div>
  )
}
