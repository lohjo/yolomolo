import type { Metadata } from "next"
import AuthSessionProvider from "@/components/SessionProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "MathScribe — Handwriting to LaTeX",
  description:
    "Convert handwritten math to LaTeX with pix2tex and olmOCR. Real-time camera capture, drag-drop upload, instant MathJax preview.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:ital,wght@0,400;0,700;1,400&family=Caveat:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/tabler-icons.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  )
}
