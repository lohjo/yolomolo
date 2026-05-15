---

# BUILD: Live Handwritten Math → LaTeX Web App

## Role
You are a senior full-stack engineer and Mathematics PhD. Build a production-ready,
single-page web application that converts handwritten or printed mathematical formulae
into LaTeX in real time using two input modes: live camera stream and image upload.

---

## Stack (non-negotiable)
- **Frontend**: Vanilla HTML/CSS/JS (single `index.html`) — no build step, no framework
- **Backend**: Python FastAPI — async, minimal, fast
- **OCR Engine**: olmOCR VLM via `olmocr` Python toolkit
  - Repo: https://github.com/allenai/olmocr
  - Demo ref: https://olmocr.allenai.org/
- **Math Rendering**: MathJax 3 (CDN) for live LaTeX preview
- **Camera**: WebRTC `getUserMedia` API — continuous frame capture pipeline

---

## File Structure (generate exactly this)



project/

├── backend/

│   ├── main.py          # FastAPI app, single file

│   ├── ocr.py           # olmOCR inference wrapper

│   └── requirements.txt

├── frontend/

│   └── index.html       # Entire UI — HTML + CSS + JS inline

└── README.md            # Setup + run instructions


---

## Backend Spec — `backend/main.py`

### Endpoints



POST /convert

  Body:    multipart/form-data { image: File }

  Returns: { latex: string, confidence: float, elapsed_ms: int }

  Timeout: 8s hard limit



GET /health

  Returns: { status: "ok", model_loaded: bool }


### olmOCR Integration — `backend/ocr.py`
```python
# Implement this interface exactly:
class MathOCR:
    def __init__(self): ...          # Load olmOCR model once at startup (singleton)
    def infer(self, image_bytes: bytes) -> dict:
        # Returns: { "latex": str, "confidence": float }
        # Preprocess: grayscale → denoise → adaptive threshold → pad to square
        # Use olmocr.model or pipeline — check the repo for correct import path
        # Fallback: if olmOCR unavailable, raise ImportError with install instructions





### Performance Requirements

- Model loaded **once** at startup via `lifespan` context manager

- Image preprocessing in-memory (no disk I/O)

- Target: **< 3s** per inference on CPU, < 800ms on GPU

- CORS enabled for `localhost:*`



---



## Frontend Spec — `frontend/index.html`



### Layout (two-panel, responsive)

┌─────────────────────────────────────────────┐
│  🔢 MathSnap  [Camera] [Upload]   [Settings]│
├──────────────────┬──────────────────────────┤
│                  │  LaTeX Output            │
│  INPUT PANEL     │  ┌──────────────────┐   │
│                  │  │ \frac{d}{dx}...  │   │
│  [Camera Feed /  │  └──────────────────┘   │
│   Dropped Image] │  [Copy] [Clear]          │
│                  │                          │
│                  │  Preview (MathJax):      │
│                  │  ┌──────────────────┐   │
│                  │  │  (rendered math) │   │
│                  │  └──────────────────┘   │
└──────────────────┴──────────────────────────┘





### Camera Mode (implement fully)

- `getUserMedia({ video: { facingMode: 'environment' } })` — prefer rear camera

- **Auto-capture loop**: every 1500ms, grab a frame from `<video>` → `<canvas>` → 

  POST to `/convert` → update output **only if confidence > 0.6**

- Visual indicator: pulsing green dot = streaming, red = error

- "Capture Now" button for manual trigger outside the loop

- Debounce: skip POST if previous request still in flight



### Upload Mode

- Drag-and-drop zone + `<input type="file" accept="image/*">`

- Mobile: also accept `capture="camera"` attribute

- Show image thumbnail in input panel on load

- Auto-POST on file select — no submit button needed



### LaTeX Output Panel

- Syntax-highlighted `<textarea>` (monospace, dark bg)

- Live MathJax re-render on every output update:

  ```js

  MathJax.typesetPromise([previewEl])  // after injecting `$$...$$`

  ```

- "Copy LaTeX" button → `navigator.clipboard.writeText(latex)`

  - Button text changes to "✓ Copied!" for 1.5s

- Character count + elapsed_ms displayed as subtle metadata



### UX Details

- Loading state: skeleton shimmer on output panel during inference

- Error state: inline red banner with error message (not alert())

- Confidence badge: color-coded (green ≥ 0.8, yellow ≥ 0.6, red < 0.6)

- Dark mode default, CSS variables for theming

- Keyboard shortcut: `Ctrl+Enter` = manual capture/re-convert



---



## `requirements.txt`

fastapi
uvicorn[standard]
python-multipart
pillow
olmocr          # pip install olmocr
torch           # required by olmOCR



---



## `README.md` — Must include

1. One-command setup: `pip install -r requirements.txt`

2. Run backend: `uvicorn main:app --reload --port 8000`

3. Open `frontend/index.html` directly in browser (no server needed)

4. GPU acceleration note: `CUDA_VISIBLE_DEVICES=0 uvicorn ...`

5. Troubleshooting: olmOCR model download path, camera permissions



---



## Constraints & Quality Gates

- [ ] Zero npm / no Node.js required

- [ ] All JS in `index.html` — no external JS files

- [ ] Backend must start without error if olmOCR model not yet downloaded

      (lazy-load model on first request, show "Model loading..." in UI)

- [ ] Camera stream must stop (tracks released) when switching to Upload mode

- [ ] No placeholder comments — every function fully implemented

- [ ] Handle these edge cases in the backend:

      - Non-image file → 400 with message

      - Image too large (> 10MB) → 413

      - olmOCR returns empty string → return `{ latex: "", confidence: 0 }`



---



## Start Generation Order

1. `backend/ocr.py` (olmOCR wrapper)  

2. `backend/main.py` (FastAPI routes + lifespan)  

3. `backend/requirements.txt`  

4. `frontend/index.html` (full UI)  

5. `README.md`



Generate all files completely. Do not truncate. Do not use placeholder TODOs.

```

