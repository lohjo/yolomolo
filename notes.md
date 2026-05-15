```
C:\Users\User\Projects\GitHub\yolomolo\backend\venv\Lib\site-packages\pix2tex\utils\utils.py:117: RuntimeWarning: invalid value encountered in divide
  data = (data-data.min())/(data.max()-data.min())*255
```

Fires when input image has zero variance — all pixels same value (blank/solid-color frame). Division by zero in alization: (max - min) = 0.

    Harmless — pix2tex handles it, returns empty or garbage LaTeX. Frontend already handles latex: "" case.

      Only worth suppressing if it floods logs. Can ignore.

---

frontend implemented:
- frontend/design-tokens.css — dark scientific palette (oklch-based), IBM Plex Sans + JetBrains Mono, spacing/radius/type tokens
- frontend/styles.css — all component styles (topbar, tabs, camera panel, upload zone, pipeline, badges, history)
- frontend/landing.html — marketing page with hero (handwriting→LaTeX showcase with double-arrow), features grid, how-it-works steps
- frontend/index.html — full tool console with real camera (getUserMedia, frame diff, auto-capture), real pipeline visualization wired to /convert, MathJax preview, history tab, copy buttons

Key wiring decisions:
- Camera tab auto-captures every 2s, results appear in camera panel's right column
- Upload tab shows the 3-step pipeline (preprocess → inference → render) with real timing
- History tab restores any entry to both panels and switches to camera view
- Ctrl+Enter forces a camera capture
- landing.html links to index.html (Launch Console), index.html back-links to landing.html