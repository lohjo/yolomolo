"use client"

import styles from "./ModelBanner.module.css"

interface ModelBannerProps {
  state: "hidden" | "loading" | "error"
  message: string
}

export default function ModelBanner({ state, message }: ModelBannerProps) {
  if (state === "hidden") return null

  return (
    <div
      className={`${styles.banner} ${
        state === "loading" ? styles.loading : styles.error
      }`}
    >
      {message}
    </div>
  )
}
