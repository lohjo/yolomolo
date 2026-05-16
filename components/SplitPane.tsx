"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import styles from "./SplitPane.module.css"

interface SplitPaneProps {
  storageKey: string
  defaultRatio?: number
  minRatio?: number
  maxRatio?: number
  left: React.ReactNode
  right: React.ReactNode
}

export default function SplitPane({
  storageKey,
  defaultRatio = 0.5,
  minRatio = 0.25,
  maxRatio = 0.75,
  left,
  right,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const rafRef = useRef<number>(0)

  const [ratio, setRatio] = useState(() => {
    if (typeof window === "undefined") return defaultRatio
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const parsed = parseFloat(stored)
      if (!Number.isNaN(parsed) && parsed >= minRatio && parsed <= maxRatio)
        return parsed
    }
    return defaultRatio
  })

  const [isDragging, setIsDragging] = useState(false)

  const persist = useCallback(
    (r: number) => {
      try {
        localStorage.setItem(storageKey, r.toString())
      } catch {}
    },
    [storageKey],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const handle = e.currentTarget as HTMLElement
      handle.setPointerCapture(e.pointerId)
      draggingRef.current = true
      setIsDragging(true)
      document.body.style.userSelect = "none"

      const onMove = (ev: PointerEvent) => {
        if (!draggingRef.current || !containerRef.current) return
        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
          const rect = containerRef.current!.getBoundingClientRect()
          const x = ev.clientX - rect.left
          const newRatio = Math.min(maxRatio, Math.max(minRatio, x / rect.width))
          setRatio(newRatio)
        })
      }

      const onUp = () => {
        draggingRef.current = false
        setIsDragging(false)
        document.body.style.userSelect = ""
        setRatio((r) => {
          persist(r)
          return r
        })
        handle.removeEventListener("pointermove", onMove)
        handle.removeEventListener("pointerup", onUp)
      }

      handle.addEventListener("pointermove", onMove)
      handle.addEventListener("pointerup", onUp)
    },
    [minRatio, maxRatio, persist],
  )

  const handleDoubleClick = useCallback(() => {
    setRatio(defaultRatio)
    persist(defaultRatio)
  }, [defaultRatio, persist])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{
        gridTemplateColumns: `${ratio}fr 5px ${1 - ratio}fr`,
      }}
    >
      <div
        className={styles.pane}
        style={isDragging ? { pointerEvents: "none" } : undefined}
      >
        {left}
      </div>
      <div
        className={`${styles.handle} ${isDragging ? styles.dragging : ""}`}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(ratio * 100)}
        tabIndex={0}
      />
      <div
        className={styles.pane}
        style={isDragging ? { pointerEvents: "none" } : undefined}
      >
        {right}
      </div>
    </div>
  )
}
