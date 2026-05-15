"use client"

import { useState, useCallback } from "react"
import { PROVIDERS } from "@/lib/providers"
import { setProvider } from "@/lib/api-client"
import styles from "./ProviderPicker.module.css"

export default function ProviderPicker() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState("")

  const handleSave = useCallback(async () => {
    if (!selectedId || !apiKey) return
    setSaving(true)
    setStatus("")
    try {
      await setProvider(selectedId, apiKey)
      setStatus("Provider saved")
    } catch (e: any) {
      setStatus(`Error: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }, [selectedId, apiKey])

  return (
    <div className={styles.wrapper}>
      <span className={styles.title}>olmOCR Provider</span>
      <div className={styles.grid}>
        {PROVIDERS.map((p) => (
          <div
            key={p.id}
            className={`${styles.card} ${selectedId === p.id ? styles.selected : ""}`}
            onClick={() => setSelectedId(p.id)}
          >
            <div className={styles.providerName}>{p.label}</div>
            <div className={styles.price}>{p.price}</div>
          </div>
        ))}
      </div>

      {selectedId && (
        <>
          <input
            className={styles.keyInput}
            type="password"
            placeholder="API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            className={styles.saveBtn}
            disabled={!apiKey || saving}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save Provider"}
          </button>
        </>
      )}

      {status && <span className={styles.status}>{status}</span>}
    </div>
  )
}
