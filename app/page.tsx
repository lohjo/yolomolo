import { Fragment } from "react"
import Link from "next/link"

const PlayTri = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    style={{ width: 14, height: 14, flexShrink: 0, fill: "currentColor" }}
  >
    <polygon points="5,3 19,12 5,21" />
  </svg>
)

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
        <a
          href="/"
          style={{
            font: "700 18px var(--font-mono)",
            color: "var(--ink)",
            letterSpacing: "-0.02em",
            textDecoration: "none",
          }}
        >
          Math<span style={{ color: "var(--blue)" }}>Scribe</span>
        </a>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-6)",
          }}
        >
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
          <a
            href="https://github.com/lohjo/yolomolo"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "14px",
              color: "var(--ink-3)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            GitHub
          </a>
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
            <PlayTri />
            Launch Console
          </Link>
        </div>
      </nav>

      <section
        style={{
          position: "relative",
          padding: "var(--sp-8) clamp(1rem, 5vw, 2.5rem) var(--sp-7)",
          maxWidth: "860px",
          margin: "0 auto",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.35,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              font: "800 clamp(2.5rem, 6vw, 4rem)/1.1 var(--font-ui)",
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              margin: "0 0 var(--sp-5)",
            }}
          >
            Convert handwriting
            <br />
            to <span style={{ color: "var(--blue)" }}>LaTeX</span>.
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
            Snap a photo, drop a PDF, or point a camera. olmOCR returns clean
            LaTeX in under three seconds.
          </p>
          <div
            style={{
              display: "flex",
              gap: "var(--sp-3)",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
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
              <PlayTri />
              Launch Console
            </Link>
            <a
              href="#how"
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
              See it work
              <i className="ti ti-arrow-down" aria-hidden="true" />
            </a>
          </div>

          <div
            aria-hidden="true"
            style={{
              marginTop: "var(--sp-7)",
              padding: "var(--sp-5) var(--sp-6)",
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              overflowX: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-5)",
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(14px, 2vw, 18px)",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "'Caveat', 'Kalam', cursive",
                  fontWeight: 700,
                  fontSize: "1.85em",
                  color: "var(--ink)",
                  lineHeight: 1,
                  letterSpacing: "0.01em",
                }}
              >
                ∫<sub style={{ fontSize: "0.55em" }}>0</sub>
                <sup style={{ fontSize: "0.55em" }}>∞</sup> e
                <sup style={{ fontSize: "0.55em" }}>−x²</sup> dx&nbsp;&nbsp;
                =&nbsp;&nbsp;√π / 2
              </span>
              <span style={{ color: "var(--blue)", fontSize: "1.5em" }}>⟶</span>
              <span style={{ color: "var(--blue)" }}>
                {String.raw`\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}`}
              </span>
            </div>
          </div>
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
        <span
          style={{
            display: "block",
            font: "var(--t-section)",
            textTransform: "uppercase",
            letterSpacing: "0.10em",
            color: "var(--blue)",
            marginBottom: "var(--sp-3)",
          }}
        >
          What it does
        </span>
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
              icon: "ti-camera",
              title: "Live camera capture",
              desc: "Point your device camera at any handwritten equation. Capture frame-by-frame with sub-second feedback.",
            },
            {
              icon: "ti-brain",
              title: "olmOCR VLM backend",
              desc: "Powered by Allen AI's olmOCR — a vision-language model trained specifically on mathematical notation.",
            },
            {
              icon: "ti-copy",
              title: "One-click LaTeX export",
              desc: "Copy clean LaTeX or MathJax-wrapped output. Preview renders inline before you commit.",
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: "var(--surface-1)",
                padding: "var(--sp-6)",
              }}
            >
              <i
                className={`ti ${f.icon}`}
                aria-hidden="true"
                style={{
                  fontSize: "24px",
                  color: "var(--blue)",
                  display: "inline-block",
                }}
              />
              <h3
                style={{
                  font: "700 16px var(--font-ui)",
                  color: "var(--ink)",
                  margin: "var(--sp-3) 0 0",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  font: "400 14px/1.65 var(--font-ui)",
                  color: "var(--ink-2)",
                  margin: "var(--sp-2) 0 0",
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
        <span
          style={{
            display: "block",
            font: "var(--t-section)",
            textTransform: "uppercase",
            letterSpacing: "0.10em",
            color: "var(--blue)",
            marginBottom: "var(--sp-3)",
          }}
        >
          How it works
        </span>
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
              title: "Snap or upload",
              desc: "Use your camera or drop an image of any handwritten or printed math.",
            },
            {
              num: "02",
              title: "VLM converts",
              desc: "olmOCR reads the image, identifies equations, and generates LaTeX output.",
            },
            {
              num: "03",
              title: "Copy and paste",
              desc: "Preview in MathJax, copy the LaTeX, paste directly into your document.",
            },
          ].map((s, i, arr) => (
            <Fragment key={s.num}>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <span
                  style={{
                    display: "block",
                    font: "700 11px var(--font-mono)",
                    color: "var(--blue)",
                    letterSpacing: "0.05em",
                    marginBottom: "var(--sp-3)",
                  }}
                >
                  {s.num}
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
              {i < arr.length - 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    fontSize: "20px",
                    color: "var(--ink-4)",
                    marginTop: "14px",
                    flexShrink: 0,
                  }}
                >
                  →
                </div>
              )}
            </Fragment>
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
          flexWrap: "wrap",
          gap: "var(--sp-3)",
        }}
      >
        <span>
          Math<span style={{ color: "var(--blue)" }}>Scribe</span> · v1.0
        </span>
        <span>Built on olmOCR · Allen AI</span>
        <a
          href="https://github.com/lohjo/yolomolo"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--ink-3)", textDecoration: "none" }}
        >
          GitHub →
        </a>
      </footer>
    </>
  )
}
