# yolomolo

Live handwritten math to LaTeX — point your camera at a formula, get LaTeX instantly.

## Quick Start

### Prerequisites

- Python 3.11+

### Install

```bash
pip install -r backend/requirements.txt
```

First install downloads ~250MB (torch, opencv, pix2tex).

### Run

Open two terminals:

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload --port 8000
```

```bash
# Terminal 2: Frontend (REQUIRED for camera — file:// won't work)
cd frontend
python -m http.server 3000
```

### Use

Open http://localhost:3000

First run downloads the OCR model (~100MB from HuggingFace). You'll see a loading banner until it's ready.

- **Camera mode:** Point at math, LaTeX updates every 2-4 seconds
- **Upload mode:** Drag-and-drop or click to upload an image
- **Dark mode:** Ctrl+D or settings gear icon
- **History:** Ctrl+H to toggle past results
- **Settings:** Ctrl+, to adjust capture interval and JPEG quality

## How It Works

| Component | Technology |
|-----------|-----------|
| OCR Model (fast) | pix2tex (ViT+ResNet encoder, Transformer decoder, ~100MB) |
| OCR Model (quality) | olmOCR-2-7B via vLLM (optional, requires GPU) |
| Backend | FastAPI + Uvicorn |
| Frontend | Vanilla HTML/CSS/JS (single file) |
| Math Rendering | MathJax 3 |
| Training | PyTorch + HuggingFace Trainer + QLoRA |

### Latency

| Mode | Hardware | Per-inference |
|------|----------|-------------|
| pix2tex | CPU | 2-4 seconds |
| pix2tex | GPU (CUDA) | ~500ms |
| olmOCR (enhance) | GPU (12GB+ VRAM) | 5-15 seconds |

## olmOCR Enhanced Mode (Optional)

For higher-quality OCR, run the olmOCR VLM alongside the app. Requires 12GB+ VRAM.

```bash
# Install vLLM
pip install vllm

# Start vLLM server (separate terminal)
python -m vllm.entrypoints.openai.api_server \
  --model allenai/olmOCR-2-7B-1025 \
  --port 8001 \
  --max-model-len 4096 \
  --gpu-memory-utilization 0.9
```

When running, an "Enhance" button appears in the UI to re-process the current image with olmOCR.

## Training on olmOCR Dataset

Fine-tune olmOCR-2-7B on math OCR data using QLoRA. Requires 24GB+ VRAM.

```bash
# Install training dependencies
pip install -r training/requirements.txt

# Run training
python -m training.train

# With options
python -m training.train --epochs 5 --lr 1e-4 --max-samples 1000

# Custom dataset
python -m training.train --dataset allenai/olmocr-bench --output ./my-checkpoints
```

## Docker

```bash
# Basic (pix2tex only)
docker compose up --build

# With olmOCR VLM (requires 2 GPUs or shared GPU)
docker compose --profile vlm up --build
```

## GPU Acceleration (Optional)

```powershell
# Install CUDA-enabled torch (replace cu121 with your CUDA version)
pip install torch --extra-index-url https://download.pytorch.org/whl/cu121

# Windows PowerShell
$env:CUDA_VISIBLE_DEVICES = "0"
python -m uvicorn main:app --port 8000
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/convert` | POST | pix2tex inference — multipart image → `{latex, confidence, elapsed_ms}` |
| `/enhance` | POST | olmOCR VLM inference — multipart image → `{latex, confidence, elapsed_ms, model}` |
| `/health` | GET | Backend status — `{status, model_loaded, loading, error}` |
| `/vlm/status` | GET | VLM availability — `{available, model, url}` |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Enter | Manual capture |
| Ctrl+D | Toggle dark mode |
| Ctrl+H | Toggle history |
| Ctrl+, | Open settings |
| Escape | Close panels |

## Troubleshooting

- **Camera not working:** Must use `http://localhost:3000`, not `file://`. Camera requires secure context.
- **Model loading slow:** First run downloads ~100MB. Check network connection.
- **albumentations error:** Ensure `albumentations==1.4.3` is installed (pix2tex breaks with 2.x).
- **CORS error:** Backend must be on port 8000, frontend on 3000.
- **Enhance button missing:** olmOCR VLM server not running on port 8001.

## License

MIT
