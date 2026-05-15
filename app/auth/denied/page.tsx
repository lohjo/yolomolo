import Link from "next/link"

export default function DeniedPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface)",
        padding: "var(--sp-5)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--surface-1)",
          border: "1px solid var(--amber-border)",
          borderRadius: "var(--r-lg)",
          padding: "var(--sp-7) var(--sp-6)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            font: "var(--t-h1)",
            color: "var(--amber)",
            margin: "0 0 var(--sp-3)",
          }}
        >
          Access Denied
        </h1>
        <p
          style={{
            font: "var(--t-body)",
            color: "var(--ink-2)",
            margin: "0 0 var(--sp-6)",
          }}
        >
          Your email is not on the allowlist.
        </p>
        <Link
          href="/"
          style={{
            font: "var(--t-button)",
            color: "var(--blue)",
            textDecoration: "none",
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
