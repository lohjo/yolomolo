"use client"

import { useState, useEffect, useCallback } from "react"
import { checkHealth } from "@/lib/api-client"
import { loadMathJax } from "@/lib/mathjax"
import type { HistoryEntry } from "@/lib/types"
import type { TabId } from "@/components/TabBar"
import Topbar from "@/components/Topbar"
import ModelBanner from "@/components/ModelBanner"
import TabBar from "@/components/TabBar"
import CameraCapture from "@/components/CameraCapture"
import UploadZone from "@/components/UploadZone"
import HistoryPanel from "@/components/HistoryPanel"

export default function ConsolePage() {
  const [activeTab, setActiveTab] = useState<TabId>("camera")
  const [modelReady, setModelReady] = useState(false)
  const [bannerState, setBannerState] = useState<"loading" | "error" | "hidden">("loading")
  const [bannerMessage, setBannerMessage] = useState("Connecting to backend…")
  const [statusColor, setStatusColor] = useState("var(--amber)")
  const [statusText, setStatusText] = useState("Connecting…")
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    loadMathJax()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const data = await checkHealth()
        if (cancelled) return

        if (data.model_loaded) {
          setModelReady(true)
          setBannerState("hidden")
          setStatusColor("var(--green)")
          setStatusText("Model ready")
          return
        }
        if (data.loading) {
          setBannerState("loading")
          setBannerMessage("Loading OCR model… first run downloads ~100MB")
          setStatusColor("var(--amber)")
          setStatusText("Model loading…")
        }
        if (data.error) {
          setBannerState("error")
          setBannerMessage(`Model error: ${data.error}`)
          setStatusColor("var(--red)")
          setStatusText("Model error")
          return
        }
      } catch {
        if (cancelled) return
        setBannerState("error")
        setBannerMessage("Cannot reach backend. Is it running?")
        setStatusColor("var(--red)")
        setStatusText("Backend offline")
      }
      if (!cancelled) setTimeout(poll, 2000)
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [])

  const addToHistory = useCallback((latex: string, ms: number) => {
    const time = new Date().toLocaleTimeString("en", {
      hour: "2-digit",
      minute: "2-digit",
    })
    setHistory((prev) => {
      const next = [{ latex, ms, time }, ...prev]
      if (next.length > 20) next.pop()
      return next
    })
  }, [])

  const handleRestore = useCallback((index: number) => {
    setActiveTab("camera")
  }, [])

  return (
    <>
      <Topbar statusColor={statusColor} statusText={statusText} />
      <ModelBanner state={bannerState} message={bannerMessage} />
      <TabBar
        active={activeTab}
        onTabChange={setActiveTab}
        historyCount={history.length}
      />

      <div style={{ display: activeTab === "camera" ? "block" : "none" }}>
        <CameraCapture modelReady={modelReady} onResult={addToHistory} />
      </div>
      <div style={{ display: activeTab === "upload" ? "block" : "none" }}>
        <UploadZone onResult={addToHistory} />
      </div>
      <div style={{ display: activeTab === "history" ? "block" : "none" }}>
        <HistoryPanel entries={history} onRestore={handleRestore} />
      </div>
    </>
  )
}
