# MathScribe

> **Handwritten math → LaTeX, instantly.**
> Point your camera at any formula — equations, integrals, matrices — and get clean, copy-paste-ready LaTeX in under a second.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.1-green)](https://fastapi.tiangolo.com)

**Live app:** https://mathscribe.vercel.app

---

## Table of Contents

- [What It Does](#what-it-does)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
  - [Frontend (Next.js)](#frontend-nextjs)
  - [Backend (FastAPI + pix2tex)](#backend-fastapi--pix2tex)
  - [Docker](#docker)
- [Environment Variables](#environment-variables)
- [olmOCR Enhanced Mode](#olmocr-enhanced-mode-optional)
- [GPU Acceleration](#gpu-acceleration-optional)
- [Training](#training-optional)
- [API Reference](#api-reference)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Contributing](#contributing)
- [License](#license)

---

## What It Does

MathScribe converts handwritten or printed math formulas to LaTeX using OCR. Two modes:

| Mode | Model | Speed | Hardware |
|------|-------|-------|----------|
| **Fast** | pix2tex (ViT+ResNet encoder, Transformer decoder) | 500ms–4s | CPU or GPU |
| **Enhanced** | olmOCR-2-7B via vLLM | 5–15s | GPU (12GB+ VRAM) |

The app runs as a **Next.js frontend + FastAPI backend**. The frontend is hosted on Vercel; the backend runs on any machine with a GPU (or CPU for lower throughput).

---

## Features

| Feature | Details |
|---------|---------|
| **Live camera capture** | Auto-captures every 2s using `getUserMedia`; environment-facing camera on mobile |
| **Upload mode** | Drag-and-drop or click to upload an image |
| **MathJax rendering** | Formula rendered instantly beneath the LaTeX output |
| **Enhance button** | Re-process with olmOCR for higher accuracy (when VLM server is running) |
| **History panel** | Scrollable past results, persisted in session |
| **Dark mode** | `Ctrl+D` or settings toggle |
| **Google SSO** | NextAuth.js v5 with email allowlist — no open registration |
| **LRU cache** | Backend caches last 64 results by MD5 hash, skips re-inference on identical frames |
| **Docker** | Single-command local stack, with optional olmOCR profile |
| **QLoRA training** | Fine-tune olmOCR-2-7B on custom math OCR data |

---

## Architecture

```
Browser
  ↓ HTTPS
Vercel (Next.js 14 App Router)
  ├── /api/convert   → proxy → FastAPI :8000  (pix2tex)
  ├── /api/enhance   → external VLM providers (DeepInfra / Parasail / Cirrascale)
  └── /api/set-provider  → httpOnly cookie

FastAPI :8000
  ├── ocr.py         MathOCR singleton, threading.Lock, asyncio.to_thread, LRU cache
  └── ocr_vlm.py     olmOCR via vLLM OpenAI-compatible API :8001

vLLM :8001 (optional)
  └── allenai/olmOCR-2-7B-1025
```

---

## Quick Start

### Frontend (Next.js)

```bash
npm install
npm run dev       # http://localhost:3000
```

### Backend (FastAPI + pix2tex)

Python 3.11+ required.

```bash
pip install -r backend/requirements.txt

# From the backend/ directory:
python -m uvicorn main:app --reload --port 8000
```

First run downloads ~100MB OCR model from HuggingFace. A loading banner appears until the model is ready.

> **Critical:** `albumentations==1.4.3` must stay pinned — pix2tex 0.1.4 breaks with albumentations 2.x.

Open http://localhost:3000.

### Docker

```bash
# pix2tex only
docker compose up --build

# With olmOCR VLM (requires GPU)
docker compose --profile vlm up --build
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Google OAuth (required for auth)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# NextAuth
NEXTAUTH_SECRET=       # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Email allowlist (comma-separated)
ALLOWED_EMAILS=you@example.com

# FastAPI backend URL
FASTAPI_BACKEND_URL=http://localhost:8000
```

Create Google OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials.

For Vercel deployment, set these via `vercel env add` or the Vercel dashboard. `NEXTAUTH_URL` should be your production domain.

---

## olmOCR Enhanced Mode (Optional)

Higher-quality OCR using a 7B VLM. Requires 12GB+ VRAM.

```bash
pip install vllm

python -m vllm.entrypoints.openai.api_server \
  --model allenai/olmOCR-2-7B-1025 \
  --port 8001 \
  --max-model-len 4096 \
  --gpu-memory-utilization 0.9
```

When running, an **Enhance** button appears in the UI. The user selects a provider (DeepInfra, Parasail, or Cirrascale) and provides their API key via the settings panel — keys are stored in an httpOnly cookie, never committed.

---

## GPU Acceleration (Optional)

Drops pix2tex inference from 2–4s (CPU) to ~500ms.

```powershell
pip install torch --extra-index-url https://download.pytorch.org/whl/cu121

$env:CUDA_VISIBLE_DEVICES = "0"
python -m uvicorn main:app --port 8000
```

Replace `cu121` with your CUDA version.

---

## Training (Optional)

QLoRA fine-tuning of olmOCR-2-7B on math OCR data. Requires 24GB+ VRAM.

```bash
pip install -r training/requirements.txt

# Basic
python -m training.train

# With options
python -m training.train --epochs 5 --lr 1e-4 --max-samples 1000

# Custom dataset
python -m training.train --dataset allenai/olmocr-bench --output ./my-checkpoints
```

---

## API Reference

All endpoints served by the FastAPI backend on `:8000`.

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/convert` | POST | `multipart/form-data` image | `{latex, confidence, elapsed_ms}` |
| `/enhance` | POST | `multipart/form-data` image | `{latex, confidence, elapsed_ms, model}` |
| `/health` | GET | — | `{status, model_loaded, loading, error}` |
| `/vlm/status` | GET | — | `{available, model, url}` |

Returns `503` if the pix2tex model is not yet loaded or the VLM server is unavailable.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Manual capture |
| `Ctrl+D` | Toggle dark mode |
| `Ctrl+H` | Toggle history panel |
| `Ctrl+,` | Open settings |
| `Escape` | Close panels |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Run lint and tests before pushing: `npm run lint && npm run test`
4. Open a pull request — CI runs lint, tests, and a Claude Code review automatically

**Maintainer:** [@lohjo](https://github.com/lohjo)

---

## License

MIT — see [LICENSE](LICENSE).
