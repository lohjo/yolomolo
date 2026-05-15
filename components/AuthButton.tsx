"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <span
        style={{
          font: "var(--t-body-sm)",
          color: "var(--ink-3)",
        }}
      >
        ...
      </span>
    )
  }

  if (session?.user) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--sp-3)",
        }}
      >
        <span
          style={{
            font: "var(--t-body-sm)",
            color: "var(--ink-2)",
          }}
        >
          {session.user.email}
        </span>
        <button
          onClick={() => signOut()}
          style={{
            font: "var(--t-button)",
            color: "var(--ink-3)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: "var(--sp-2) var(--sp-4)",
            cursor: "pointer",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--ink)"
            e.currentTarget.style.borderColor = "var(--ink-3)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--ink-3)"
            e.currentTarget.style.borderColor = "var(--border)"
          }}
        >
          Sign out
        </button>
      </span>
    )
  }

  return (
    <Link
      href="/auth/signin"
      style={{
        font: "var(--t-button)",
        color: "var(--blue)",
        textDecoration: "none",
        border: "1px solid var(--blue-border)",
        borderRadius: "var(--r-md)",
        padding: "var(--sp-2) var(--sp-4)",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--blue-bg)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent"
      }}
    >
      Sign in
    </Link>
  )
}
