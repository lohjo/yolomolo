import Link from "next/link"

export default function LandingPage() {
  return (
    <>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--sp-5) clamp(1rem, 5vw, 2.5rem)",
          borderBottom: "1px solid var(--rule)",
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "color-mix(in oklch, var(--surface) 92%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <span
          style={{
            font: "700 18px var(--font-mono)",
            color: "var(--ink)",
            letterSpacing: "-0.02em",
          }}
        >
          Math<span style={{ color: "var(--blue)" }}>Scribe</span>
        </span>
        <div style={{ display: "flex", gap: "var(--sp-6)" }}>
          <a
            href="#features"
            style={{
              fontSize: "14px",
              color: "var(--ink-3)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Features
          </a>
          <a
            href="#how"
            style={{
              fontSize: "14px",
              color: "var(--ink-3)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            How it works
          </a>
        </div>
      </nav>

      <section
        style={{
          position: "relative",
          padding: "var(--sp-8) clamp(1rem, 5vw, 2.5rem) var(--sp-7)",
          maxWidth: "860px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            font: "800 clamp(2.5rem, 6vw, 4rem)/1.1 var(--font-ui)",
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            marginBottom: "var(--sp-5)",
          }}
        >
          Handwriting to{" "}
          <span style={{ color: "var(--blue)" }}>LaTeX</span>, instantly.
        </h1>
        <p
          style={{
            fontSize: "17px",
            color: "var(--ink-2)",
            lineHeight: 1.55,
            maxWidth: "60ch",
            marginBottom: "var(--sp-5)",
          }}
        >
          Point your camera at handwritten math and get production-ready LaTeX
          in milliseconds. Powered by pix2tex and olmOCR-2-7B.
        </p>
        <div style={{ display: "flex", gap: "var(--sp-3)", flexWrap: "wrap" }}>
          <Link
            href="/console"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--sp-2)",
              background: "var(--blue)",
              color: "var(--surface)",
              padding: "0.6rem 1.4rem",
              borderRadius: "var(--r-md)",
              font: "var(--t-button)",
              textDecoration: "none",
              border: "1px solid var(--blue)",
            }}
          >
            Launch Console →
          </Link>
          <a
            href="https://github.com/yolomolo/mathscribe"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--sp-2)",
              background: "transparent",
              color: "var(--ink-2)",
              padding: "0.55rem 1.1rem",
              borderRadius: "var(--r-md)",
              font: "var(--t-button)",
              textDecoration: "none",
              border: "1px solid var(--border)",
            }}
          >
            GitHub
          </a>
        </div>
      </section>

      <section
        id="features"
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "var(--sp-8) clamp(1rem, 5vw, 2.5rem)",
        }}
      >
        <h2>Features</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1px",
            background: "var(--rule)",
            border: "1px solid var(--rule)",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            marginTop: "var(--sp-5)",
          }}
        >
          {[
            {
              title: "Real-time Camera",
              desc: "Auto-captures every 2s with frame-diff optimization. Desktop and mobile.",
            },
            {
              title: "Drag & Drop Upload",
              desc: "Drop any image. 3-step pipeline visualization shows preprocessing, inference, and rendering.",
            },
            {
              title: "olmOCR Quality Mode",
              desc: "7B-parameter VLM via DeepInfra, Parasail, or Cirrascale. Full document processing.",
            },
            {
              title: "Instant Preview",
              desc: "MathJax renders LaTeX in real-time. Edit and re-render on the fly.",
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: "var(--surface-1)",
                padding: "var(--sp-6)",
              }}
            >
              <h3
                style={{
                  font: "700 16px var(--font-ui)",
                  color: "var(--ink)",
                  margin: "0 0 var(--sp-2)",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  font: "400 14px/1.65 var(--font-ui)",
                  color: "var(--ink-2)",
                  margin: 0,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how"
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "var(--sp-8) clamp(1rem, 5vw, 2.5rem)",
        }}
      >
        <h2>How it works</h2>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--sp-4)",
            flexWrap: "wrap",
            marginTop: "var(--sp-5)",
          }}
        >
          {[
            {
              num: "01",
              title: "Capture",
              desc: "Point camera at handwritten math or upload an image.",
            },
            {
              num: "02",
              title: "OCR",
              desc: "pix2tex or olmOCR extracts mathematical expressions.",
            },
            {
              num: "03",
              title: "LaTeX",
              desc: "Get production-ready LaTeX with MathJax preview. Copy and paste.",
            },
          ].map((s) => (
            <div key={s.num} style={{ flex: 1, minWidth: "180px" }}>
              <span
                style={{
                  display: "block",
                  font: "700 11px var(--font-mono)",
                  color: "var(--blue)",
                  letterSpacing: "0.05em",
                  marginBottom: "var(--sp-3)",
                }}
              >
                STEP {s.num}
              </span>
              <h4
                style={{
                  font: "700 15px var(--font-ui)",
                  color: "var(--ink)",
                  margin: "0 0 var(--sp-2)",
                }}
              >
                {s.title}
              </h4>
              <p
                style={{
                  font: "400 13.5px/1.6 var(--font-ui)",
                  color: "var(--ink-2)",
                  margin: 0,
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid var(--rule)",
          padding: "var(--sp-5) clamp(1rem, 5vw, 2.5rem)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          font: "var(--t-mono-sm)",
          color: "var(--ink-4)",
        }}
      >
        <span>MathScribe · MIT License</span>
        <span>pix2tex + olmOCR</span>
      </footer>
    </>
  )
}
