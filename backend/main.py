import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import asyncio
import threading
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ocr import MathOCR
from ocr_vlm import VLMOcr

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ocr = MathOCR()
vlm = VLMOcr()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB


@asynccontextmanager
async def lifespan(app: FastAPI):
    thread = threading.Thread(target=ocr.load_model, daemon=True)
    thread.start()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"(http://localhost:\d+|https://mathscribe\.vercel\.app|https://.*\.vercel\.app)",
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": ocr.is_ready,
        "loading": ocr._loading,
        "error": ocr._error,
    }


@app.post("/convert")
async def convert(image: UploadFile = File(...)):
    if not ocr.is_ready:
        raise HTTPException(503, detail="Model still loading, please wait")

    if image.content_type and image.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, detail=f"Unsupported image type: {image.content_type}")

    image_bytes = await image.read()

    if len(image_bytes) > MAX_SIZE:
        raise HTTPException(413, detail="Image too large (max 10MB)")

    if len(image_bytes) == 0:
        raise HTTPException(400, detail="Empty image file")

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(ocr.infer, image_bytes),
            timeout=90.0,
        )
        return JSONResponse(result)
    except asyncio.TimeoutError:
        raise HTTPException(504, detail="Inference timed out (>90s)")
    except Exception as e:
        logger.error("Inference error: %s", e)
        raise HTTPException(500, detail=str(e))


@app.post("/enhance")
async def enhance(image: UploadFile = File(...)):
    """Re-process image with olmOCR VLM for higher quality (slower)."""
    if not vlm.is_available:
        raise HTTPException(
            503,
            detail="olmOCR VLM not available. Start vLLM server on port 8001. See README.",
        )

    if image.content_type and image.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, detail=f"Unsupported image type: {image.content_type}")

    image_bytes = await image.read()

    if len(image_bytes) > MAX_SIZE:
        raise HTTPException(413, detail="Image too large (max 10MB)")

    if len(image_bytes) == 0:
        raise HTTPException(400, detail="Empty image file")

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(vlm.infer, image_bytes),
            timeout=60.0,
        )
        return JSONResponse(result)
    except asyncio.TimeoutError:
        raise HTTPException(504, detail="VLM inference timed out (>60s)")
    except Exception as e:
        logger.error("VLM inference error: %s", e)
        raise HTTPException(500, detail=str(e))


@app.get("/vlm/status")
async def vlm_status():
    return {"available": vlm.is_available, "model": vlm.model_name, "url": vlm.vllm_url}
