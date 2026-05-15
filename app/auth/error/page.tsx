import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

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
          border: "1px solid var(--red-border)",
          borderRadius: "var(--r-lg)",
          padding: "var(--sp-7) var(--sp-6)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            font: "var(--t-h1)",
            color: "var(--red)",
            margin: "0 0 var(--sp-3)",
          }}
        >
          Authentication Error
        </h1>
        <p
          style={{
            font: "var(--t-body)",
            color: "var(--ink-2)",
            margin: "0 0 var(--sp-6)",
          }}
        >
          {error ?? "An unexpected error occurred during sign in."}
        </p>
        <Link
          href="/auth/signin"
          style={{
            font: "var(--t-button)",
            color: "var(--blue)",
            textDecoration: "none",
          }}
        >
          Try again
        </Link>
      </div>
    </div>
  )
}
