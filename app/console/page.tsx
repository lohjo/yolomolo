"use client"

import { useState, useEffect, useCallback } from "react"
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
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    loadMathJax()
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

  const handleRestore = useCallback(() => {
    setActiveTab("camera")
  }, [])

  return (
    <>
      <Topbar statusColor="var(--green)" statusText="olmOCR ready" />
      <ModelBanner state="hidden" message="" />
      <TabBar
        active={activeTab}
        onTabChange={setActiveTab}
        historyCount={history.length}
      />

      <div style={{ display: activeTab === "camera" ? "block" : "none" }}>
        <CameraCapture modelReady onResult={addToHistory} />
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
