import threading
import time
import logging
import base64
from io import BytesIO
from PIL import Image

logger = logging.getLogger(__name__)


class VLMOcr:
    """olmOCR-2-7B inference via vLLM OpenAI-compatible API.

    Requires a running vLLM server:
      python -m vllm.entrypoints.openai.api_server \
        --model allenai/olmOCR-2-7B-1025 \
        --max-model-len 4096 \
        --gpu-memory-utilization 0.9
    """

    def __init__(self, vllm_url="http://localhost:8001/v1"):
        self.vllm_url = vllm_url
        self.model_name = "allenai/olmOCR-2-7B-1025"
        self._available = None
        self._lock = threading.Lock()

    @property
    def is_available(self):
        if self._available is None:
            self._check_availability()
        return self._available

    def _check_availability(self):
        try:
            import httpx
            r = httpx.get(f"{self.vllm_url}/models", timeout=5)
            self._available = r.status_code == 200
        except Exception:
            self._available = False

    def infer(self, image_bytes: bytes) -> dict:
        import httpx

        with self._lock:
            img = Image.open(BytesIO(image_bytes)).convert("RGB")
            buf = BytesIO()
            img.save(buf, format="PNG")
            b64 = base64.b64encode(buf.getvalue()).decode()

            start = time.perf_counter()
            payload = {
                "model": self.model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/png;base64,{b64}"},
                            },
                            {
                                "type": "text",
                                "text": "Extract all mathematical expressions from this image. Return only the LaTeX code, no explanation.",
                            },
                        ],
                    }
                ],
                "max_tokens": 512,
                "temperature": 0.1,
            }

            r = httpx.post(
                f"{self.vllm_url}/chat/completions",
                json=payload,
                timeout=60,
            )
            r.raise_for_status()
            data = r.json()

            latex = data["choices"][0]["message"]["content"].strip()
            elapsed_ms = int((time.perf_counter() - start) * 1000)

            return {"latex": latex, "confidence": 0.9, "elapsed_ms": elapsed_ms, "model": "olmOCR-2-7B"}
