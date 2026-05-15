import os
import hashlib
import threading
import time
import logging
from io import BytesIO
from collections import OrderedDict
from PIL import Image

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import torch
torch.set_num_threads(max(1, os.cpu_count() - 1))

from pix2tex.cli import LatexOCR

logger = logging.getLogger(__name__)

MAX_DIMENSION = 448
CACHE_SIZE = 64


class LRUCache:
    def __init__(self, maxsize):
        self._cache = OrderedDict()
        self._maxsize = maxsize

    def get(self, key):
        if key in self._cache:
            self._cache.move_to_end(key)
            return self._cache[key]
        return None

    def put(self, key, value):
        if key in self._cache:
            self._cache.move_to_end(key)
        else:
            if len(self._cache) >= self._maxsize:
                self._cache.popitem(last=False)
        self._cache[key] = value


def _downscale(img, max_dim=MAX_DIMENSION):
    w, h = img.size
    if w <= max_dim and h <= max_dim:
        return img
    scale = max_dim / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    return img.resize((new_w, new_h), Image.LANCZOS)


def _image_hash(image_bytes):
    return hashlib.md5(image_bytes).hexdigest()


class MathOCR:
    def __init__(self):
        self.model = None
        self._lock = threading.Lock()
        self._loading = False
        self._error = None
        self._cache = LRUCache(CACHE_SIZE)

    @property
    def is_ready(self):
        return self.model is not None and not self._loading

    def load_model(self):
        self._loading = True
        self._error = None
        try:
            logger.info("Loading pix2tex model (first run downloads ~100MB)...")
            self.model = LatexOCR()
            logger.info("Model loaded, warming up...")
            try:
                import random
                warmup_img = Image.new("RGB", (320, 80), (248, 248, 248))
                pixels = warmup_img.load()
                rng = random.Random(42)
                for y in range(warmup_img.height):
                    for x in range(warmup_img.width):
                        if rng.random() < 0.12:
                            v = rng.randint(0, 60)
                            pixels[x, y] = (v, v, v)
                self.model(warmup_img)
                logger.info("Warmup complete — JIT paths primed")
            except Exception as e:
                logger.warning("Warmup failed (%s) — first inference will be slower", e)
            logger.info("Model ready")
        except Exception as e:
            self._error = str(e)
            logger.error("Failed to load model: %s", e)
        finally:
            self._loading = False

    def infer(self, image_bytes: bytes) -> dict:
        if not self.is_ready:
            raise RuntimeError("Model not loaded")

        img_hash = _image_hash(image_bytes)
        cached = self._cache.get(img_hash)
        if cached:
            return {**cached, "cached": True}

        with self._lock:
            img = Image.open(BytesIO(image_bytes)).convert("RGB")
            img = _downscale(img)

            start = time.perf_counter()
            with torch.inference_mode():
                latex = self.model(img)
            elapsed_ms = int((time.perf_counter() - start) * 1000)

            if not latex or not latex.strip():
                result = {"latex": "", "confidence": 0.0, "elapsed_ms": elapsed_ms}
            else:
                result = {"latex": latex.strip(), "confidence": 0.85, "elapsed_ms": elapsed_ms}

            self._cache.put(img_hash, result)
            return {**result, "cached": False}
