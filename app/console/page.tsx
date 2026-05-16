"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { loadMathJax } from "@/lib/mathjax"
import { fetchHistory, saveHistoryEntry, deleteHistoryEntry } from "@/lib/api-client"
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
  const hydratedRef = useRef(false)

  useEffect(() => {
    loadMathJax()
  }, [])

  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    fetchHistory(20).then(({ entries }) => {
      setHistory(
        entries.map((e) => ({
          id: e.id,
          latex: e.latex,
          rawResponse: e.raw_response ?? undefined,
          ms: e.elapsed_ms,
          time: new Date(e.created_at).toLocaleTimeString("en", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sourceTab: e.source_tab,
          synced: true,
        })),
      )
    }).catch(() => {})
  }, [])

  const addToHistory = useCallback(
    (latex: string, ms: number, sourceTab?: string) => {
      const time = new Date().toLocaleTimeString("en", {
        hour: "2-digit",
        minute: "2-digit",
      })
      const entry: HistoryEntry = { latex, ms, time, sourceTab, synced: false }

      setHistory((prev) => {
        const next = [entry, ...prev]
        if (next.length > 50) next.pop()
        return next
      })

      saveHistoryEntry({
        latex,
        rawResponse: latex,
        elapsedMs: ms,
        sourceTab: sourceTab ?? "upload",
      }).then((result) => {
        if (result) {
          setHistory((prev) =>
            prev.map((h) =>
              h === entry ? { ...h, id: result.id, synced: true } : h,
            ),
          )
        }
      })
    },
    [],
  )

  const handleDelete = useCallback(async (index: number) => {
    setHistory((prev) => {
      const entry = prev[index]
      if (entry?.id) {
        deleteHistoryEntry(entry.id)
      }
      return prev.filter((_, i) => i !== index)
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
        <CameraCapture
          modelReady
          onResult={(latex, ms) => addToHistory(latex, ms, "camera")}
        />
      </div>
      <div style={{ display: activeTab === "upload" ? "block" : "none" }}>
        <UploadZone
          onResult={(latex, ms) => addToHistory(latex, ms, "upload")}
        />
      </div>
      <div style={{ display: activeTab === "history" ? "block" : "none" }}>
        <HistoryPanel
          entries={history}
          onRestore={handleRestore}
          onDelete={handleDelete}
        />
      </div>
    </>
  )
}
