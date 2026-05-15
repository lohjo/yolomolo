declare global {
  interface Window {
    MathJax?: {
      typesetClear: (elements: HTMLElement[]) => void
      typesetPromise: (elements: HTMLElement[]) => Promise<void>
    }
  }
}

let loaded = false

export function loadMathJax(): void {
  if (loaded || typeof window === "undefined") return
  loaded = true

  ;(window as any).MathJax = {
    tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]] },
    startup: { typeset: false },
  }

  const script = document.createElement("script")
  script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"
  script.async = true
  document.head.appendChild(script)
}

export async function renderPreview(
  latex: string,
  el: HTMLElement | null,
): Promise<void> {
  if (!latex || !el) return
  try {
    if (window.MathJax?.typesetClear) window.MathJax.typesetClear([el])
    el.innerHTML = `$$${latex}$$`
    if (window.MathJax?.typesetPromise) await window.MathJax.typesetPromise([el])
  } catch {
    el.textContent = latex
  }
}
