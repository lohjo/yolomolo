"use client"

import type { HistoryEntry } from "@/lib/types"
import styles from "./HistoryPanel.module.css"

interface HistoryPanelProps {
  entries: HistoryEntry[]
  onRestore: (index: number) => void
  onDelete?: (index: number) => void
}

export default function HistoryPanel({
  entries,
  onRestore,
  onDelete,
}: HistoryPanelProps) {
  return (
    <div className={styles.wrapper}>
      <span style={{ display: "block", font: "var(--t-section)", textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--blue)", marginBottom: "var(--sp-3)" }}>
        Recent conversions
      </span>
      <div className={styles.container}>
        {entries.length === 0 ? (
          <p className={styles.empty}>No conversions yet.</p>
        ) : (
          entries.map((h, i) => (
            <div key={h.id ?? i}>
              <div className={styles.itemRow}>
                <button
                  className={styles.item}
                  type="button"
                  onClick={() => onRestore(i)}
                >
                  <span className={styles.time}>{h.time}</span>
                  {h.sourceTab && (
                    <span className={styles.sourceBadge}>{h.sourceTab}</span>
                  )}
                  <span className={styles.src}>{h.latex}</span>
                  <span className={styles.ms}>{h.ms} ms</span>
                </button>
                {onDelete && (
                  <button
                    className={styles.deleteBtn}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(i)
                    }}
                    aria-label="Delete entry"
                  >
                    &#x2715;
                  </button>
                )}
              </div>
              {i < entries.length - 1 && <div className={styles.divider} />}
            </div>
          ))
        )}
      </div>
      <p className={styles.hint}>
        {entries.some((e) => e.synced)
          ? "Synced to your account."
          : "Conversions stored in session."}
      </p>
    </div>
  )
}
