# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install backend dependencies (first time: ~250MB download)
pip install -r backend/requirements.txt

# Run backend (from backend/)
python -m uvicorn main:app --reload --port 8000

# Run frontend (from frontend/ — camera requires HTTP, not file://)
python -m http.server 3000

# Docker (pix2tex only)
docker compose up --build

# Docker with olmOCR VLM
docker compose --profile vlm up --build

# Training (requires 24GB+ VRAM)
pip install -r training/requirements.txt
python -m training.train --epochs 5 --lr 1e-4 --max-samples 1000

# olmOCR vLLM server (optional, requires 12GB+ VRAM)
python -m vllm.entrypoints.openai.api_server \
  --model allenai/olmOCR-2-7B-1025 \
  --port 8001 \
  --max-model-len 4096 \
  --gpu-memory-utilization 0.9
```

Open http://localhost:3000. First run downloads pix2tex model (~100MB from HuggingFace).

## Architecture

Two-process local app. No build step anywhere.

**Backend** (`backend/`) — FastAPI served on :8000
- `ocr.py`: `MathOCR` singleton wraps `pix2tex.cli.LatexOCR`. Model loads in background thread at startup via `lifespan`. Inference serialized through `threading.Lock` (pix2tex is not thread-safe). `asyncio.to_thread` keeps FastAPI event loop unblocked. LRU cache (64 entries) keyed on MD5 hash of raw image bytes. Images downscaled to 448px max dimension before inference.
- `ocr_vlm.py`: `VLMOcr` hits a vLLM OpenAI-compatible API on port 8001 running `allenai/olmOCR-2-7B-1025`. Availability checked lazily on first request. Falls back gracefully if server not running.
- `main.py`: Four endpoints — `POST /convert` (pix2tex, 90s timeout), `POST /enhance` (olmOCR VLM, 60s timeout), `GET /health`, `GET /vlm/status`. Returns 503 if pix2tex model not yet ready or VLM server unavailable.

**Frontend** (`frontend/`) — static files served on :3000
- `index.html`: Full tool console. Camera tab auto-captures every 2s (`getUserMedia` with `facingMode: 'environment'` + desktop fallback), canvas frames as JPEG. Upload tab shows 3-step pipeline visualization. History tab. Keyboard shortcuts: Ctrl+Enter (capture), Ctrl+D (dark mode), Ctrl+H (history), Ctrl+, (settings).
- `landing.html`: Marketing page linking to `index.html`.
- `design-tokens.css`: Dark scientific palette (oklch-based), IBM Plex Sans + JetBrains Mono, spacing/radius/type tokens.
- `styles.css`: All component styles (topbar, tabs, camera panel, upload zone, pipeline, badges, history).
- MathJax: calls `typesetClear([el])` before each re-render to prevent DOM accumulation. `startup.typeset: false` prevents DOM scan on load.
- Inflight debounce: skips capture if previous POST still pending.

**Training** (`training/`) — QLoRA fine-tuning of olmOCR-2-7B on math OCR data. Separate `requirements.txt`.

## Critical Constraints

- `albumentations==1.4.3` — MUST be pinned. pix2tex 0.1.4 breaks with albumentations 2.x.
- `pix2tex==0.1.4` — pin to avoid upstream changes.
- Frontend must be served via HTTP (`python -m http.server`), not `file://` — `getUserMedia` requires secure context.
- CORS regex `r"http://localhost:\d+"` — backend only accepts localhost origins.
- `KMP_DUPLICATE_LIB_OK=TRUE` set in `main.py` to suppress OpenMP duplicate lib error on Windows.
- `confidence` is always `0.85` fixed heuristic for pix2tex (`0.9` for olmOCR) — pix2tex has no confidence API.
- Blank/solid-color frames trigger a `RuntimeWarning: invalid value encountered in divide` in pix2tex internals — harmless, pix2tex returns empty or garbage LaTeX which the frontend handles.

## GPU Acceleration

```powershell
pip install torch --extra-index-url https://download.pytorch.org/whl/cu121
$env:CUDA_VISIBLE_DEVICES = "0"
python -m uvicorn main:app --port 8000
```

Drops pix2tex inference from 2-4s (CPU) to ~500ms. olmOCR always requires GPU (12GB+ VRAM).
