"use client"

import styles from "./TabBar.module.css"

export type TabId = "camera" | "upload" | "history"

interface TabBarProps {
  active: TabId
  onTabChange: (tab: TabId) => void
  historyCount: number
}

const TABS: { id: TabId; label: string }[] = [
  { id: "camera", label: "Camera" },
  { id: "upload", label: "Upload" },
  { id: "history", label: "History" },
]

export default function TabBar({
  active,
  onTabChange,
  historyCount,
}: TabBarProps) {
  return (
    <div className={styles.tabs} role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className={`${styles.tab} ${active === tab.id ? styles.active : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {tab.id === "history" && (
            <span className={styles.count}>{historyCount}</span>
          )}
        </button>
      ))}
    </div>
  )
}
