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

MathScribe converts handwritten or printed math formulas to LaTeX using olmOCR-2-7B via DeepInfra. Two tiers:

| Mode | Provider | Speed | Notes |
|------|----------|-------|-------|
| **Default `/convert`** | DeepInfra olmOCR (server-side key) | 2–6s | Lower `max_tokens` for fast tier; no setup |
| **Enhanced `/enhance`** | User-configured provider (DeepInfra / Parasail / Cirrascale) | 5–15s | Higher token budget, BYO API key in httpOnly cookie |

The production app is **single-platform on Vercel** — no separate GPU host needed. The `backend/` directory holds an optional FastAPI + pix2tex stack used only for local development or self-hosting.

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
  ├── /api/convert       → DeepInfra olmOCR (DEEPINFRA_API_KEY, max_tokens 1024)
  ├── /api/enhance       → user-configured VLM provider (cookie-stored key)
  ├── /api/set-provider  → writes httpOnly cookie with provider + API key
  └── /api/health        → static {model_loaded: true}

Optional local dev:
  backend/ (FastAPI + pix2tex)  — only if you want pix2tex self-hosted
  vLLM :8001                    — only if you want olmOCR self-hosted on GPU
```

---

## Quick Start

### Frontend (Next.js)

```bash
npm install
npm run dev       # http://localhost:3000
```

### Backend (optional, local-only)

The Next.js app talks to DeepInfra directly in production. The FastAPI stack is only needed if you want local pix2tex inference. Python 3.11+ required.

```bash
pip install -r backend/requirements.txt

# From the backend/ directory:
python -m uvicorn main:app --reload --port 8000

# Then point Next.js at it
echo "FASTAPI_BACKEND_URL=http://localhost:8000" >> .env.local
```

First run downloads ~100MB OCR model from HuggingFace.

> **Critical:** `albumentations==1.4.3` must stay pinned — pix2tex 0.1.4 breaks with albumentations 2.x.

The production deployment ignores this entirely.

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

# DeepInfra olmOCR (required) — server-side key for /api/convert
DEEPINFRA_API_KEY=

# Optional: local FastAPI backend (only if running backend/ locally)
# FASTAPI_BACKEND_URL=http://localhost:8000
```

Create Google OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials. Add `https://<your-vercel-domain>/api/auth/callback/google` to Authorized redirect URIs.

For Vercel deployment, set every variable above via `vercel env add` or the Vercel dashboard. `NEXTAUTH_URL` is pinned to `https://mathscribe.vercel.app` in `vercel.json` — change it there if your domain is different.

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

Next.js App Router routes hosted on Vercel.

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/convert` | POST | `multipart/form-data` image | `{latex, confidence, elapsed_ms, model}` — calls DeepInfra with `DEEPINFRA_API_KEY` |
| `/api/enhance` | POST | `multipart/form-data` image | `{latex, confidence, elapsed_ms, model}` — calls user-selected provider via cookie |
| `/api/health` | GET | — | `{status:"ok", model_loaded:true}` |
| `/api/set-provider` | POST | `{providerId, apiKey}` | `{ok:true}` — stores provider config in httpOnly cookie |

`/convert` returns `503 {code:"NO_KEY"}` if `DEEPINFRA_API_KEY` is missing. `/enhance` returns `503 {code:"NO_PROVIDER"}` if no provider cookie is set.

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
