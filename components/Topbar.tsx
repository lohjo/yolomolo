"use client"

import Link from "next/link"
import styles from "./Topbar.module.css"
import AuthButton from "./AuthButton"

interface TopbarProps {
  statusColor?: string
  statusText?: string
}

export default function Topbar({
  statusColor = "var(--amber)",
  statusText = "Connecting…",
}: TopbarProps) {
  return (
    <nav className={styles.topbar}>
      <Link href="/" className={styles.backLink}>
        Math<span className={styles.accent}>Scribe</span>
      </Link>
      <div className={styles.right}>
        <div className={styles.statusChip}>
          <span
            className={styles.statusDot}
            style={{ background: statusColor }}
          />
          <span>{statusText}</span>
        </div>
        <AuthButton />
      </div>
    </nav>
  )
}
