import argparse
import asyncio
import atexit
import base64
import datetime
import hashlib
import json
import logging
import multiprocessing
import os
import random
import re
import shutil
import ssl
import sys
import tarfile
import tempfile
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from functools import cache
from io import BytesIO
from urllib.parse import urlparse

import boto3
import httpx
from botocore.exceptions import ClientError
from huggingface\_hub import snapshot\_download
from PIL import Image
from pypdf import PdfReader
from tqdm import tqdm

from olmocr.check import (
 check\_poppler\_version,
 check\_torch\_gpu\_available,
)
from olmocr.data.renderpdf import render\_pdf\_to\_base64png
from olmocr.filter.filter import Language, PdfFilter
from olmocr.image\_utils import convert\_image\_to\_pdf\_bytes, is\_jpeg, is\_png
from olmocr.metrics import MetricsKeeper, WorkerTracker
from olmocr.prompts import PageResponse, build\_no\_anchoring\_v4\_yaml\_prompt
from olmocr.prompts.anchor import get\_anchor\_text
from olmocr.s3\_utils import (
 download\_directory,
 download\_zstd\_csv,
 expand\_s3\_glob,
 get\_s3\_bytes,
 get\_s3\_bytes\_with\_backoff,
 parse\_s3\_path,
)
from olmocr.train.front\_matter import FrontMatterParser
from olmocr.version import VERSION
from olmocr.work\_queue import LocalBackend, S3Backend, WorkQueue

\# Initialize logger
logger = logging.getLogger(\_\_name\_\_)
logger.setLevel(logging.DEBUG)
logger.propagate = False

server\_logger = logging.getLogger("vllm")
server\_logger.propagate = False

console\_handler = logging.StreamHandler()
console\_handler.setLevel(logging.INFO)
console\_handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))

\# Add console handler to loggers (file handler added later if disk logging enabled)
logger.addHandler(console\_handler)
server\_logger.addHandler(console\_handler)

\# Quiet logs from pypdf
logging.getLogger("pypdf").setLevel(logging.ERROR)

\# Global s3 clients fo the whole script, we have two separate ones in case your workspace and your pdfs are in different accounts
workspace\_s3 = boto3.client("s3")
pdf\_s3 = boto3.client("s3")

\# Global variables for token statistics
metrics = MetricsKeeper(window=60 \* 5)
tracker = WorkerTracker()

\# Global variable for vLLM queue status (updated by vllm\_server\_task)
vllm\_queued\_requests = None

\# Temperature values for retry attempts - higher temperature helps overcome repetition issues
TEMPERATURE\_BY\_ATTEMPT = \[0.1, 0.1, 0.2, 0.3, 0.5, 0.8, 0.9, 1.0\]

pdf\_render\_max\_workers\_limit = asyncio.BoundedSemaphore(int(float(os.environ.get("BEAKER\_ASSIGNED\_CPU\_COUNT", max(1, multiprocessing.cpu\_count() - 2)))))
max\_concurrent\_requests\_limit = asyncio.BoundedSemaphore(1) # Actual value set by args in main()

\# Filter object, cached so it will only get loaded when/if you need it
get\_pdf\_filter = cache(lambda: PdfFilter(languages\_to\_keep={Language.ENGLISH, None}, apply\_download\_spam\_check=True, apply\_form\_check=True))

@dataclass(frozen=True)
class PageResult:
 s3\_path: str
 page\_num: int
 response: PageResponse

 input\_tokens: int
 output\_tokens: int
 is\_fallback: bool
 is\_valid: bool

async def build\_page\_query(local\_pdf\_path: str, page: int, target\_longest\_image\_dim: int, image\_rotation: int = 0, model\_name: str = "olmocr") -> dict:
 MAX\_TOKENS = 8000
 assert image\_rotation in \[0, 90, 180, 270\], "Invalid image rotation provided in build\_page\_query"

 # Allow the page rendering to process in the background, but limit the number of workers otherwise you can overload the system
 async with pdf\_render\_max\_workers\_limit:
 image\_base64 = await asyncio.to\_thread(render\_pdf\_to\_base64png, local\_pdf\_path, page, target\_longest\_image\_dim=target\_longest\_image\_dim)

 if image\_rotation != 0:
 image\_bytes = base64.b64decode(image\_base64)
 with Image.open(BytesIO(image\_bytes)) as img:
 if image\_rotation == 90:
 tranpose = Image.Transpose.ROTATE\_90
 elif image\_rotation == 180:
 tranpose = Image.Transpose.ROTATE\_180
 else:
 tranpose = Image.Transpose.ROTATE\_270

 rotated\_img = img.transpose(tranpose)

 # Save the rotated image to a bytes buffer
 buffered = BytesIO()
 rotated\_img.save(buffered, format="PNG")

 # Encode the rotated image back to base64
 image\_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

 return {
 "model": model\_name,
 "messages": \[\
 {\
 "role": "user",\
 "content": \[\
 {"type": "text", "text": build\_no\_anchoring\_v4\_yaml\_prompt()},\
 {"type": "image\_url", "image\_url": {"url": f"data:image/png;base64,{image\_base64}"}},\
 \],\
 }\
 \],
 "max\_tokens": MAX\_TOKENS,
 "temperature": 0.0, # This will get overridden later
 }

async def try\_single\_page(
 args,
 pdf\_orig\_path: str,
 pdf\_local\_path: str,
 page\_num: int,
 attempt: int,
 rotation: int,
) -\> PageResult \| None:
 """
 Try processing a single page once. Returns PageResult on success, None on failure.
 Does NOT handle retries - caller is responsible for retry logic.
 """
 COMPLETION\_URL = f"{args.server.rstrip('/')}/chat/completions"
 MODEL\_MAX\_CONTEXT = 16384

 temp\_idx = min(attempt, len(TEMPERATURE\_BY\_ATTEMPT) - 1)
 temperature = TEMPERATURE\_BY\_ATTEMPT\[temp\_idx\]

 api\_key = args.api\_key if args.server and hasattr(args, "api\_key") else None

 try:
 query = await build\_page\_query(
 pdf\_local\_path,
 page\_num,
 args.target\_longest\_image\_dim,
 image\_rotation=rotation,
 model\_name=args.model,
 )
 query\["temperature"\] = temperature

 if args.guided\_decoding:
 query\["guided\_regex"\] = (
 r"---\\nprimary\_language: (?:\[a-z\]{2}\|null)\\nis\_rotation\_valid: (?:True\|False\|true\|false)\\nrotation\_correction: (?:0\|90\|180\|270)\\nis\_table: (?:True\|False\|true\|false)\\nis\_diagram: (?:True\|False\|true\|false)\\n(?:---\|---\\n\[\\s\\S\]+)"
 )

 async with max\_concurrent\_requests\_limit:
 status\_code, response\_body = await apost(COMPLETION\_URL, json\_data=query, api\_key=api\_key)

 if status\_code != 200:
 logger.warning(
 f"Server returned {status\_code} for {pdf\_orig\_path}-{page\_num} attempt {attempt}: {response\_body\[:500\] if response\_body else 'empty response'}"
 )
 return None

 base\_response\_data = json.loads(response\_body)

 metrics.add\_metrics(
 server\_input\_tokens=base\_response\_data\["usage"\].get("prompt\_tokens", 0),
 server\_output\_tokens=base\_response\_data\["usage"\].get("completion\_tokens", 0),
 )

 is\_valid = True

 if base\_response\_data\["usage"\]\["total\_tokens"\] > MODEL\_MAX\_CONTEXT:
 is\_valid = False

 if base\_response\_data\["choices"\]\[0\]\["finish\_reason"\] != "stop":
 is\_valid = False

 model\_response\_markdown = base\_response\_data\["choices"\]\[0\]\["message"\]\["content"\]

 parser = FrontMatterParser(front\_matter\_class=PageResponse)
 front\_matter, text = parser.\_extract\_front\_matter\_and\_text(model\_response\_markdown)
 page\_response = parser.\_parse\_front\_matter(front\_matter, text)

 return PageResult(
 pdf\_orig\_path,
 page\_num,
 page\_response,
 input\_tokens=base\_response\_data\["usage"\].get("prompt\_tokens", 0),
 output\_tokens=base\_response\_data\["usage"\].get("completion\_tokens", 0),
 is\_fallback=False,
 is\_valid=is\_valid,
 )
 except asyncio.CancelledError:
 raise
 except (ConnectionError, OSError, asyncio.TimeoutError):
 # Re-raise connection errors so caller can apply exponential backoff
 raise
 except Exception as e:
 logger.warning(f"try\_single\_page failed for {pdf\_orig\_path}-{page\_num} attempt {attempt}: {type(e).\_\_name\_\_}: {e}")
 return None

def make\_fallback\_result(pdf\_orig\_path: str, pdf\_local\_path: str, page\_num: int) -> PageResult:
 """Create a fallback PageResult using pdftotext."""
 return PageResult(
 pdf\_orig\_path,
 page\_num,
 PageResponse(
 natural\_text=get\_anchor\_text(pdf\_local\_path, page\_num, pdf\_engine="pdftotext"),
 primary\_language=None,
 is\_rotation\_valid=True,
 rotation\_correction=0,
 is\_table=False,
 is\_diagram=False,
 ),
 input\_tokens=0,
 output\_tokens=0,
 is\_fallback=True,
 is\_valid=True,
 )

async def try\_single\_page\_with\_backoff(
 args,
 pdf\_orig\_path: str,
 pdf\_local\_path: str,
 page\_num: int,
 attempt: int,
 rotation: int,
) -\> PageResult \| None:
 """
 Wrapper around try\_single\_page that handles connection errors with exponential backoff.
 """
 MAX\_BACKOFF\_ATTEMPTS = 10

 for backoff\_count in range(MAX\_BACKOFF\_ATTEMPTS):
 try:
 return await try\_single\_page(args, pdf\_orig\_path, pdf\_local\_path, page\_num, attempt, rotation)
 except (ConnectionError, OSError, asyncio.TimeoutError) as e:
 sleep\_delay = 10 \* (2\*\*backoff\_count)
 logger.warning(
 f"Connection error on {pdf\_orig\_path}-{page\_num} attempt {attempt}: {type(e).\_\_name\_\_}: {e}. "
 f"Backoff {backoff\_count + 1}/{MAX\_BACKOFF\_ATTEMPTS}, sleeping {sleep\_delay}s"
 )
 await asyncio.sleep(sleep\_delay)

 logger.error(f"Max backoff attempts reached for {pdf\_orig\_path}-{page\_num}, terminating job")
 sys.exit(1)

async def process\_page(args, worker\_id: int, pdf\_orig\_path: str, pdf\_local\_path: str, page\_num: int) -> PageResult:
 """
 Process a single page with retry logic:
 1\. Try first attempt
 2\. If success: return result
 3\. If rotation error: retry sequentially (need model feedback for rotation correction)
 4\. If other error: fire all remaining retries in parallel (if queue empty) or sequential
 """
 MAX\_RETRIES = args.max\_page\_retries
 retry\_attempts = list(range(1, MAX\_RETRIES))
 cumulative\_rotation = 0

 await tracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "started")

 # === First attempt ===
 result = await try\_single\_page\_with\_backoff(args, pdf\_orig\_path, pdf\_local\_path, page\_num, attempt=0, rotation=cumulative\_rotation)

 if result is not None and not result.response.is\_rotation\_valid:
 cumulative\_rotation = result.response.rotation\_correction % 360

 # Success on first try
 if result is not None and result.is\_valid and result.response.is\_rotation\_valid:
 metrics.add\_metrics(\*\*{"completed\_pages": 1, "finished\_on\_attempt\_0": 1})
 await tracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")
 return result

 # === Rotation error path: sequential retries with model feedback ===
 if result is not None and not result.response.is\_rotation\_valid:
 logger.info(f"Rotation error for {pdf\_orig\_path}-{page\_num}, retrying sequentially with rotation={cumulative\_rotation}")

 for attempt in retry\_attempts:
 result = await try\_single\_page\_with\_backoff(args, pdf\_orig\_path, pdf\_local\_path, page\_num, attempt, cumulative\_rotation)

 if result is not None and result.is\_valid and result.response.is\_rotation\_valid:
 metrics.add\_metrics(\*\*{"completed\_pages": 1, f"finished\_on\_attempt\_{attempt}": 1})
 await tracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")
 return result

 if result is not None: # Another rotation correction needed
 cumulative\_rotation = (cumulative\_rotation + result.response.rotation\_correction) % 360

 # If you tried many times and all rotations were invalid, but you at least had a valid response, then return that in the end
 if result is not None and result.is\_valid:
 metrics.add\_metrics(\*\*{"completed\_pages": 1, f"finished\_on\_attempt\_{MAX\_RETRIES}": 1})
 await tracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")
 return result

 # Otherwise you can do a full fallback
 logger.error(f"Failed {pdf\_orig\_path}-{page\_num} after {MAX\_RETRIES} rotation retries")
 metrics.add\_metrics(failed\_pages=1)
 await tracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "errored")
 return make\_fallback\_result(pdf\_orig\_path, pdf\_local\_path, page\_num)

 # === Non-rotation error path: sequential, but switch to parallel if queue empties ===
 for i, attempt in enumerate(retry\_attempts):
 result = await try\_single\_page\_with\_backoff(args, pdf\_orig\_path, pdf\_local\_path, page\_num, attempt, rotation=cumulative\_rotation)

 if result is not None and result.is\_valid and result.response.is\_rotation\_valid:
 metrics.add\_metrics(\*\*{"completed\_pages": 1, f"finished\_on\_attempt\_{attempt}": 1})
 await tracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")
 return result

 # After each failed attempt, check if queue is empty - if so, fire remaining in parallel
 remaining\_attempts = retry\_attempts\[i + 1 :\]
 if remaining\_attempts and vllm\_queued\_requests == 0:
 logger.info(f"Queue empty, firing {len(remaining\_attempts)} parallel retries for {pdf\_orig\_path}-{page\_num}")
 tasks = \[\
 asyncio.create\_task(try\_single\_page\_with\_backoff(args, pdf\_orig\_path, pdf\_local\_path, page\_num, a, rotation=cumulative\_rotation))\
 for a in remaining\_attempts\
 \]

 for coro in asyncio.as\_completed(tasks):
 try:
 result = await coro
 if result is not None and result.is\_valid and result.response.is\_rotation\_valid:
 for t in tasks:
 t.cancel()
 metrics.add\_metrics(\*\*{"completed\_pages": 1, "finished\_on\_parallel\_retry": 1})
 await tracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")
 return result
 except asyncio.CancelledError:
 continue
 break # Parallel attempts exhausted

 # If you tried many times and a least had a valid response, then return that in the end
 if result is not None and result.is\_valid:
 metrics.add\_metrics(\*\*{"completed\_pages": 1, f"finished\_on\_attempt\_{MAX\_RETRIES}": 1})
 await tracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")
 return result

 # All retries exhausted
 logger.error(f"Failed {pdf\_orig\_path}-{page\_num} after {MAX\_RETRIES} attempts")
 metrics.add\_metrics(failed\_pages=1)
 await tracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "errored")
 return make\_fallback\_result(pdf\_orig\_path, pdf\_local\_path, page\_num)

\# Manual simple implementation of HTTP Post
\# It feels strange perhaps, but httpx and aiohttp are very complex beasts
\# Ex. the sessionpool in httpcore has 4 different locks in it, and I've noticed
\# that at the scale of 100M+ requests, that they deadlock in different strange ways
async def apost(url, json\_data, api\_key=None):
 parsed\_url = urlparse(url)
 host = parsed\_url.hostname
 # Default to 443 for HTTPS, 80 for HTTP
 if parsed\_url.scheme == "https":
 port = parsed\_url.port or 443
 use\_ssl = True
 else:
 port = parsed\_url.port or 80
 use\_ssl = False
 path = parsed\_url.path or "/"

 writer = None
 try:
 if use\_ssl:
 ssl\_context = ssl.create\_default\_context()
 reader, writer = await asyncio.open\_connection(host, port, ssl=ssl\_context)
 else:
 reader, writer = await asyncio.open\_connection(host, port)

 json\_payload = json.dumps(json\_data)

 headers = \[\
 f"POST {path} HTTP/1.1",\
 f"Host: {host}",\
 f"Content-Type: application/json",\
 f"Content-Length: {len(json\_payload)}",\
 \]

 if api\_key:
 headers.append(f"Authorization: Bearer {api\_key}")

 headers.append("Connection: close")

 request = "\\r\\n".join(headers) + "\\r\\n\\r\\n" + json\_payload
 writer.write(request.encode())
 await writer.drain()

 status\_line = await reader.readline()
 if not status\_line:
 raise ConnectionError("No response from server")
 status\_parts = status\_line.decode().strip().split(" ", 2)
 if len(status\_parts) < 2:
 raise ValueError(f"Malformed status line: {status\_line.decode().strip()}")
 status\_code = int(status\_parts\[1\])

 # Read headers
 headers = {}
 while True:
 line = await reader.readline()
 if line in (b"\\r\\n", b"\\n", b""):
 break
 key, \_, value = line.decode().partition(":")
 headers\[key.strip().lower()\] = value.strip()

 # Read response body
 if "content-length" in headers:
 body\_length = int(headers\["content-length"\])
 response\_body = await reader.readexactly(body\_length)
 elif headers.get("transfer-encoding", "") == "chunked":
 chunks = \[\]
 while True:
 # Read chunk size line
 size\_line = await reader.readline()
 chunk\_size = int(size\_line.strip(), 16) # Hex format

 if chunk\_size == 0:
 await reader.readline() # Read final CRLF
 break

 chunk\_data = await reader.readexactly(chunk\_size)
 chunks.append(chunk\_data)

 # Read trailing CRLF after chunk data
 await reader.readline()

 response\_body = b"".join(chunks)
 elif headers.get("connection", "") == "close":
 # Read until connection closes
 response\_body = await reader.read()
 else:
 raise ConnectionError("Cannot determine response body length")

 return status\_code, response\_body
 except Exception as e:
 # Pass through errors
 raise e
 finally:
 # But just make sure to close the socket on your way out
 if writer is not None:
 try:
 writer.close()
 await writer.wait\_closed()
 except:
 pass

def is\_tarball\_path(path: str) -> bool:
 """Check if a path is a tarball based on extension."""
 lower = path.lower()
 return lower.endswith(".tar.gz") or lower.endswith(".tgz")

async def process\_tarball(args, worker\_id: int, tarball\_path: str) -> list:
 """Process all PDFs inside a tarball concurrently and return list of Dolma documents."""
 logger.info(f"Worker {worker\_id} processing tarball {tarball\_path}")

 tarball\_bytes = await asyncio.to\_thread(lambda: get\_s3\_bytes\_with\_backoff(pdf\_s3, tarball\_path))

 # Extract all PDFs to a temp directory
 temp\_dir = tempfile.mkdtemp()
 try:
 pdf\_files = \[\] # (source\_path, local\_path)
 with tarfile.open(fileobj=BytesIO(tarball\_bytes), mode="r:gz") as tar:
 for member in tar.getmembers():
 if member.isfile() and member.name.lower().endswith(".pdf"):
 local\_path = os.path.join(temp\_dir, os.path.basename(member.name))
 with open(local\_path, "wb") as f:
 extracted = tar.extractfile(member)
 if extracted:
 f.write(extracted.read())
 pdf\_files.append((f"{tarball\_path}::{member.name}", local\_path))

 logger.info(f"Worker {worker\_id} extracted {len(pdf\_files)} PDFs from {tarball\_path}")

 # Process all PDFs concurrently
 async with asyncio.TaskGroup() as tg:
 tasks = \[tg.create\_task(process\_single\_pdf(args, worker\_id, src, local)) for src, local in pdf\_files\]

 dolma\_docs = \[t.result() for t in tasks if t.result() is not None\]
 logger.info(f"Worker {worker\_id} processed {len(dolma\_docs)} PDFs from tarball {tarball\_path}")
 return dolma\_docs
 finally:
 shutil.rmtree(temp\_dir, ignore\_errors=True)

async def process\_single\_pdf(args, worker\_id: int, pdf\_orig\_path: str, local\_pdf\_path: str):
 """Process a single PDF that's already on disk.

 Args:
 args: Pipeline arguments
 worker\_id: Worker ID for logging
 pdf\_orig\_path: Original path (for metadata, can be tarball::internal format)
 local\_pdf\_path: Local path to the PDF file

 Returns:
 Dolma document or None
 """
 try:
 try:
 reader = PdfReader(local\_pdf\_path)
 num\_pages = reader.get\_num\_pages()
 except:
 logger.exception(f"Could not count number of pages for {pdf\_orig\_path}, aborting document")
 return None

 logger.debug(f"Got {num\_pages} pages to do for {pdf\_orig\_path} in worker {worker\_id}")

 if args.apply\_filter and get\_pdf\_filter().filter\_out\_pdf(local\_pdf\_path):
 logger.info(f"Filtering out pdf {pdf\_orig\_path}")
 return None

 # List to hold the tasks for processing each page
 page\_tasks = \[\]
 page\_results = \[\]

 async with asyncio.TaskGroup() as tg:
 for page\_num in range(1, num\_pages + 1):
 task = tg.create\_task(process\_page(args, worker\_id, pdf\_orig\_path, local\_pdf\_path, page\_num))
 page\_tasks.append(task)

 # Collect the results from the entire task group, assuming no exceptions, if there is an exception propagated to this point in any page, it will abort the PDF itself
 page\_results = \[task.result() for task in page\_tasks\]
 assert all(page\_result.is\_valid for page\_result in page\_results)

 num\_fallback\_pages = sum(page\_result.is\_fallback for page\_result in page\_results)

 if num\_fallback\_pages / num\_pages > args.max\_page\_error\_rate:
 logger.error(
 f"Document {pdf\_orig\_path} has {num\_fallback\_pages} fallback pages out of {num\_pages} exceeding max\_page\_error\_rate of {args.max\_page\_error\_rate}, discarding document."
 )
 return None
 elif num\_fallback\_pages > 0:
 logger.warning(
 f"Document {pdf\_orig\_path} processed with {num\_fallback\_pages} fallback pages out of {num\_pages}, proceeding to build Dolma document."
 )

 return build\_dolma\_document(pdf\_orig\_path, page\_results)
 except Exception as e:
 logger.exception(f"Exception in process\_single\_pdf for {pdf\_orig\_path}: {e}")
 return None

async def process\_pdf(args, worker\_id: int, pdf\_orig\_path: str):
 """Process a single PDF from S3/local path and return a Dolma document."""
 with tempfile.NamedTemporaryFile("wb+", suffix=".pdf", delete=False) as tf:
 try:
 data = await asyncio.to\_thread(lambda: get\_s3\_bytes\_with\_backoff(pdf\_s3, pdf\_orig\_path))
 tf.write(data)
 tf.flush()
 except ClientError as ex:
 if ex.response\["Error"\]\["Code"\] == "NoSuchKey":
 logger.info(f"S3 File Not found, skipping it completely {pdf\_orig\_path}")
 return None
 else:
 raise

 if is\_png(tf.name) or is\_jpeg(tf.name):
 logger.info(f"Converting {pdf\_orig\_path} from image to PDF format...")
 tf.seek(0)
 tf.write(convert\_image\_to\_pdf\_bytes(tf.name))
 tf.flush()

 try:
 return await process\_single\_pdf(args, worker\_id, pdf\_orig\_path, tf.name)
 finally:
 if os.path.exists(tf.name):
 os.unlink(tf.name)

def build\_dolma\_document(pdf\_orig\_path, page\_results):
 # Build the document text and page spans
 document\_text = ""
 pdf\_page\_spans = \[\]
 current\_char\_pos = 0

 for index, page\_result in enumerate(page\_results):
 if page\_result.response.natural\_text is not None:
 content = page\_result.response.natural\_text + ("\\n" if index < len(page\_results) - 1 else "")
 else:
 content = ""

 start\_pos = current\_char\_pos
 document\_text += content
 current\_char\_pos = len(document\_text)
 pdf\_page\_spans.append(\[start\_pos, current\_char\_pos, page\_result.page\_num\])

 if not document\_text:
 logger.info(f"No document text for {pdf\_orig\_path}")
 return None # Return None if the document text is empty

 # Build the Dolma document
 metadata = {
 "Source-File": pdf\_orig\_path,
 "olmocr-version": VERSION,
 "pdf-total-pages": len(page\_results),
 "total-input-tokens": sum(page.input\_tokens for page in page\_results),
 "total-output-tokens": sum(page.output\_tokens for page in page\_results),
 "total-fallback-pages": sum(page.is\_fallback for page in page\_results),
 }

 id\_ = hashlib.sha1(document\_text.encode()).hexdigest()

 dolma\_doc = {
 "id": id\_,
 "text": document\_text,
 "source": "olmocr",
 "added": datetime.datetime.now().strftime("%Y-%m-%d"),
 "created": datetime.datetime.now().strftime("%Y-%m-%d"),
 "metadata": metadata,
 "attributes": {
 "pdf\_page\_numbers": pdf\_page\_spans,
 "primary\_language": \[p.response.primary\_language for p in page\_results\],
 "is\_rotation\_valid": \[p.response.is\_rotation\_valid for p in page\_results\],
 "rotation\_correction": \[p.response.rotation\_correction for p in page\_results\],
 "is\_table": \[p.response.is\_table for p in page\_results\],
 "is\_diagram": \[p.response.is\_diagram for p in page\_results\],
 },
 }
 return dolma\_doc

def get\_markdown\_path(workspace: str, source\_file: str) -> str:
 """
 Calculate the markdown output path for a given source file.

 Args:
 workspace: The workspace directory path
 source\_file: The original source file path (can be S3, local, or tarball::internal\_path)

 Returns:
 The full path where the markdown file should be written
 """
 # Handle tarball paths (format: tarball\_path::internal\_path)
 if "::" in source\_file:
 tarball\_path, internal\_path = source\_file.split("::", 1)
 # Use tarball basename + internal path structure
 tarball\_basename = os.path.splitext(os.path.basename(tarball\_path))\[0\]
 if tarball\_basename.endswith(".tar"):
 tarball\_basename = tarball\_basename\[:-4\]
 relative\_path = os.path.join(tarball\_basename, internal\_path)
 elif source\_file.startswith("s3://"):
 # Extract the path after the bucket name for S3 sources
 parsed = urlparse(source\_file)
 relative\_path = parsed.path.lstrip("/")
 else:
 # For local files, strip leading slash to make it relative
 relative\_path = source\_file.lstrip("/")

 # Sanitize path: remove any .. components to prevent path traversal
 parts = relative\_path.split("/")
 safe\_parts = \[p for p in parts if p and p != ".."\]
 relative\_path = "/".join(safe\_parts)

 # Change the extension to .md
 md\_filename = os.path.splitext(os.path.basename(relative\_path))\[0\] + ".md"
 # Get the directory path without the filename
 dir\_path = os.path.dirname(relative\_path)

 # Create the output markdown path
 markdown\_dir = os.path.join(workspace, "markdown", dir\_path)
 markdown\_path = os.path.join(markdown\_dir, md\_filename)

 return markdown\_path

async def worker(args, work\_queue: WorkQueue, worker\_id):
 while True:

 work\_item = await work\_queue.get\_work()

 if work\_item is None:
 logger.info(f"Worker {worker\_id} exiting due to empty queue")
 break

 logger.info(f"Worker {worker\_id} processing work item {work\_item.hash}")
 await tracker.clear\_work(worker\_id)

 try:
 async with asyncio.TaskGroup() as tg:
 dolma\_tasks = \[\]
 for path in work\_item.work\_paths:
 if is\_tarball\_path(path):
 # Tarball returns a list of docs, so we handle it specially
 dolma\_tasks.append(tg.create\_task(process\_tarball(args, worker\_id, path)))
 else:
 dolma\_tasks.append(tg.create\_task(process\_pdf(args, worker\_id, path)))
 logger.info(f"Created all tasks for {work\_item.hash}")

 logger.info(f"Finished TaskGroup for worker on {work\_item.hash}")

 dolma\_docs = \[\]
 for task in dolma\_tasks:
 try:
 result = task.result()
 except:
 # some dolma doc creations may have failed
 result = None

 if result is None:
 continue
 # process\_tarball returns a list, process\_pdf returns a single doc
 if isinstance(result, list):
 dolma\_docs.extend(result)
 else:
 dolma\_docs.append(result)

 logger.info(f"Got {len(dolma\_docs)} docs for {work\_item.hash}")

 # Write the Dolma documents to a local temporary file in JSONL format
 with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tf:
 for doc in dolma\_docs:
 tf.write(json.dumps(doc))
 tf.write("\\n")
 tf.flush()
 temp\_path = tf.name

 try:
 # Define the output S3 path using the work\_hash
 output\_final\_path = os.path.join(args.workspace, "results", f"output\_{work\_item.hash}.jsonl")

 if output\_final\_path.startswith("s3://"):
 bucket, key = parse\_s3\_path(output\_final\_path)
 workspace\_s3.upload\_file(temp\_path, bucket, key)
 else:
 # Ensure the results directory exists for local workspace
 os.makedirs(os.path.dirname(output\_final\_path), exist\_ok=True)
 shutil.copyfile(temp\_path, output\_final\_path)
 finally:
 # Clean up the temporary file
 if os.path.exists(temp\_path):
 os.unlink(temp\_path)

 # If --markdown flag is set, also write the natural text to markdown files
 if args.markdown:
 logger.info(f"Writing {len(dolma\_docs)} markdown files for {work\_item.hash}")
 for doc in dolma\_docs:
 source\_file = doc\["metadata"\]\["Source-File"\]
 natural\_text = doc\["text"\]

 markdown\_path = get\_markdown\_path(args.workspace, source\_file)
 markdown\_dir = os.path.dirname(markdown\_path)

 # Create the directory structure if it doesn't exist
 if markdown\_path.startswith("s3://"):
 # For S3 paths, we'll create a temporary file and upload it
 with tempfile.NamedTemporaryFile(mode="w+", delete=False) as md\_tf:
 md\_tf.write(natural\_text)
 md\_tf.flush()
 md\_temp\_path = md\_tf.name

 try:
 md\_bucket, md\_key = parse\_s3\_path(markdown\_path)
 workspace\_s3.upload\_file(md\_temp\_path, md\_bucket, md\_key)
 finally:
 # Make sure to clean up the temporary file even if upload fails
 if os.path.exists(md\_temp\_path):
 os.unlink(md\_temp\_path)
 else:
 # For local paths, create the directory structure and write the file
 os.makedirs(markdown\_dir, exist\_ok=True)
 with open(markdown\_path, "w") as md\_f:
 md\_f.write(natural\_text)

 # Update finished token counts from successful documents
 metrics.add\_metrics(
 finished\_input\_tokens=sum(doc\["metadata"\]\["total-input-tokens"\] for doc in dolma\_docs),
 finished\_output\_tokens=sum(doc\["metadata"\]\["total-output-tokens"\] for doc in dolma\_docs),
 )

 await work\_queue.mark\_done(work\_item)
 except Exception as e:
 logger.exception(f"Exception occurred while processing work\_hash {work\_item.hash}: {e}")

async def vllm\_server\_task(model\_name\_or\_path, args, unknown\_args=None):
 cmd = \[\
 "vllm",\
 "serve",\
 model\_name\_or\_path,\
 "--port",\
 str(args.port),\
 "--disable-log-requests",\
 "--uvicorn-log-level",\
 "warning",\
 "--served-model-name",\
 "olmocr",\
 "--tensor-parallel-size",\
 str(args.tensor\_parallel\_size),\
 "--data-parallel-size",\
 str(args.data\_parallel\_size),\
 "--limit-mm-per-prompt",\
 '{"video": 0}', # Disabling video encoder saves RAM that you can put towards the KV cache, thanks @charitarthchugh\
 \]

 if args.gpu\_memory\_utilization is not None:
 cmd.extend(\["--gpu-memory-utilization", str(args.gpu\_memory\_utilization)\])

 if args.max\_model\_len is not None:
 cmd.extend(\["--max-model-len", str(args.max\_model\_len)\])

 if unknown\_args:
 cmd.extend(unknown\_args)

 proc = await asyncio.create\_subprocess\_exec(
 \*cmd,
 stdout=asyncio.subprocess.PIPE,
 stderr=asyncio.subprocess.PIPE,
 # OMP\_NUM\_THREADS needs to be 1, otherwise you could have contention if you are running multiple copies of olmOCR on a machine with several GPUS
 env={\*\*os.environ, "OMP\_NUM\_THREADS": "1"},
 )

 # Ensure the subprocess is terminated on exit
 def \_kill\_proc():
 try:
 proc.terminate()
 except:
 logger.info("VLLM Process already terminated")

 atexit.register(\_kill\_proc)

 # Shared variables between tasks
 last\_running\_req, peak\_running\_req, last\_queue\_req = 0, 0, 0
 server\_printed\_ready\_message = False

 async def process\_line(line):
 nonlocal last\_running\_req, last\_queue\_req, peak\_running\_req, server\_printed\_ready\_message
 server\_logger.info(line)

 if "Detected errors during sampling" in line:
 logger.error("Cannot continue, sampling errors detected, model is probably corrupt")
 sys.exit(1)

 if not server\_printed\_ready\_message and ("The server is fired up and ready to roll!" in line or "Starting vLLM API server" in line):
 server\_printed\_ready\_message = True

 if match := re.search(r"Running: (\\d+)", line):
 current\_running = int(match.group(1))
 # Track peak running requests
 if current\_running > peak\_running\_req:
 peak\_running\_req = current\_running
 logger.info(f"New peak running requests: {peak\_running\_req}")
 last\_running\_req = current\_running

 if match := re.search(r"(?:Waiting\|Pending):\\s\*(\\d+)", line):
 global vllm\_queued\_requests
 last\_queue\_req = int(match.group(1))
 vllm\_queued\_requests = last\_queue\_req
 logger.info(f"vllm running req: {last\_running\_req} queue req: {last\_queue\_req}")

 async def read\_stream(stream):
 while True:
 line = await stream.readline()
 if not line:
 break
 try:
 line = line.decode("utf-8").rstrip()
 await process\_line(line)
 except Exception as ex:
 logger.warning(f"Got {ex} when reading log line from inference server, skipping")

 # Start tasks to read stdout, stderr, and handle timeout logic
 stdout\_task = asyncio.create\_task(read\_stream(proc.stdout))
 stderr\_task = asyncio.create\_task(read\_stream(proc.stderr))

 try:
 await proc.wait()
 except asyncio.CancelledError:
 logger.info("Got cancellation request for VLLM server")
 proc.terminate()
 try:
 await asyncio.wait\_for(proc.wait(), timeout=10.0)
 except asyncio.TimeoutError:
 logger.warning("VLLM server did not terminate within 10 seconds")
 raise

 await asyncio.gather(stdout\_task, stderr\_task, return\_exceptions=True)

async def vllm\_server\_host(model\_name\_or\_path, args, unknown\_args=None):
 MAX\_RETRIES = 5
 retry = 0

 while retry < MAX\_RETRIES:
 await vllm\_server\_task(model\_name\_or\_path, args, unknown\_args)
 logger.warning("VLLM server task ended")
 retry += 1

 if retry >= MAX\_RETRIES:
 logger.error(f"Ended up starting the vllm server more than {retry} times, cancelling pipeline")
 logger.error("")
 logger.error(
 "Please make sure vllm is installed according to the latest instructions here: https://docs.vllm.ai/en/stable/getting\_started/installation/gpu.html"
 )
 sys.exit(1)

async def vllm\_server\_ready(args):
 max\_attempts = args.max\_server\_ready\_timeout
 delay\_sec = 1
 url = f"{args.server.rstrip('/')}/models"

 for attempt in range(1, max\_attempts + 1):
 try:
 headers = {}
 if args.server and hasattr(args, "api\_key") and args.api\_key:
 headers\["Authorization"\] = f"Bearer {args.api\_key}"

 async with httpx.AsyncClient() as session:
 response = await session.get(url, headers=headers)

 if response.status\_code == 200:
 logger.info("vllm server is ready.")
 return
 else:
 logger.info(f"Attempt {attempt}: Unexpected status code {response.status\_code}")
 except Exception:
 logger.warning(f"Attempt {attempt}: Please wait for vllm server to become ready...")

 await asyncio.sleep(delay\_sec)

 raise Exception("vllm server did not become ready after waiting.")

async def download\_model(model\_name\_or\_path: str, max\_retries: int = 5):
 for retry in range(max\_retries):
 try:
 if model\_name\_or\_path.startswith("s3://") or model\_name\_or\_path.startswith("gs://") or model\_name\_or\_path.startswith("weka://"):
 logger.info(f"Downloading model directory from '{model\_name\_or\_path}'")
 model\_cache\_dir = os.path.join(os.path.expanduser("~"), ".cache", "olmocr", "model")
 # Delete existing model cache directory if it exists
 if os.path.exists(model\_cache\_dir):
 shutil.rmtree(model\_cache\_dir)
 download\_directory(\[model\_name\_or\_path\], model\_cache\_dir)
 return model\_cache\_dir
 elif os.path.isabs(model\_name\_or\_path) and os.path.isdir(model\_name\_or\_path):
 logger.info(f"Using local model path at '{model\_name\_or\_path}'")
 return model\_name\_or\_path
 else:
 logger.info(f"Downloading model with hugging face '{model\_name\_or\_path}'")
 snapshot\_download(repo\_id=model\_name\_or\_path)
 return model\_name\_or\_path
 except Exception:
 if retry == max\_retries - 1:
 raise # Raise on final attempt and fail the job

 sleep\_time = random.randrange(2, 20) \* 2\*\*retry
 logger.exception(f"Could not download model, sleeping for {sleep\_time} seconds to retry ({retry + 1}/{max\_retries})")
 await asyncio.sleep(random.randrange(10, 30) \* 2\*\*retry)

async def metrics\_reporter(work\_queue):
 while True:
 # Leading newlines preserve table formatting in logs
 logger.info(f"Queue remaining: {work\_queue.size}")
 logger.info("\\n" + str(metrics))
 logger.info("\\n" + str(await tracker.get\_status\_table()))
 await asyncio.sleep(10)

def submit\_beaker\_job(args):
 from beaker import ( # type: ignore
 Beaker,
 BeakerConstraints,
 BeakerEnvVar,
 BeakerExperimentSpec,
 BeakerImageSource,
 BeakerJobPriority,
 BeakerResultSpec,
 BeakerRetrySpec,
 BeakerTaskContext,
 BeakerTaskResources,
 BeakerTaskSpec,
 )
 from beaker.exceptions import BeakerSecretNotFound

 Beaker.TIMEOUT = 60
 b = Beaker.from\_env(default\_workspace=args.beaker\_workspace)
 owner = b.user\_name
 beaker\_image = f"jakep/olmocr-inference-{VERSION}"

 task\_name = f"olmocr-{os.path.basename(args.workspace.rstrip('/'))}"

 # Take out --beaker flag so the workers will just run things
 args\_list = \[arg for arg in sys.argv\[1:\] if arg != "--beaker"\]

 # Take out the --pdfs \[arg\] or --pdfs=\[arg\], since the queue is populated locally
 args\_list = \[arg for i, arg in enumerate(args\_list) if not (arg.startswith("--pdfs") or (i > 0 and args\_list\[i - 1\] == "--pdfs"))\]

 try:
 b.secret.get(f"{owner}-WEKA\_ACCESS\_KEY\_ID")
 b.secret.get(f"{owner}-WEKA\_SECRET\_ACCESS\_KEY")
 b.secret.get(f"{owner}-AWS\_CREDENTIALS\_FILE")
 except BeakerSecretNotFound:
 print(
 f"Expected beaker secrets for accessing Weka and S3 are not found. Are you okay to write those to your beaker workspace {args.beaker\_workspace}? \[y/n\]"
 )

 if input().strip().lower() != "y":
 print("Exiting...")
 sys.exit(1)

 b.secret.write(f"{owner}-WEKA\_ACCESS\_KEY\_ID", os.environ.get("WEKA\_ACCESS\_KEY\_ID", ""))
 b.secret.write(f"{owner}-WEKA\_SECRET\_ACCESS\_KEY", os.environ.get("WEKA\_SECRET\_ACCESS\_KEY", ""))
 b.secret.write(
 f"{owner}-AWS\_CREDENTIALS\_FILE",
 open(os.path.join(os.path.expanduser("~"), ".aws", "credentials")).read(),
 )

 env\_var\_secrets = \[\
 BeakerEnvVar(name="WEKA\_ACCESS\_KEY\_ID", secret=f"{owner}-WEKA\_ACCESS\_KEY\_ID"),\
 BeakerEnvVar(name="WEKA\_SECRET\_ACCESS\_KEY", secret=f"{owner}-WEKA\_SECRET\_ACCESS\_KEY"),\
 BeakerEnvVar(name="AWS\_CREDENTIALS\_FILE", secret=f"{owner}-AWS\_CREDENTIALS\_FILE"),\
 \]

 try:
 b.secret.get("OLMOCR\_PREVIEW\_HF\_TOKEN")
 env\_var\_secrets.append(BeakerEnvVar(name="HF\_TOKEN", secret="OLMOCR\_PREVIEW\_HF\_TOKEN"))
 except BeakerSecretNotFound:
 pass

 try:
 b.secret.get("OE\_DATA\_GCS\_SA\_KEY")
 env\_var\_secrets.append(BeakerEnvVar(name="GOOGLE\_APPLICATION\_CREDENTIALS\_FILE", secret="OE\_DATA\_GCS\_SA\_KEY"))
 except BeakerSecretNotFound:
 print("Input the olmo-gcs SA key if you would like to load weights from gcs (end with a double newline):")
 lines = \[\]
 prev\_empty = False
 for line in iter(input, None):
 if not line and prev\_empty:
 break
 prev\_empty = not line
 lines.append(line)
 gcs\_sa\_key = "\\n".join(lines\[:-1\]).strip() # Remove the last empty line
 if gcs\_sa\_key:
 b.secret.write("OE\_DATA\_GCS\_SA\_KEY", gcs\_sa\_key)
 env\_var\_secrets.append(BeakerEnvVar(name="GOOGLE\_APPLICATION\_CREDENTIALS\_FILE", secret="OE\_DATA\_GCS\_SA\_KEY"))

 # Create the experiment spec
 experiment\_spec = BeakerExperimentSpec(
 budget="ai2/oe-base",
 description=task\_name,
 tasks=\[\
 BeakerTaskSpec(\
 name=task\_name,\
 propagate\_failure=False,\
 propagate\_preemption=False,\
 replicas=args.beaker\_gpus,\
 context=BeakerTaskContext(\
 priority=BeakerJobPriority\[args.beaker\_priority\],\
 preemptible=True,\
 ),\
 image=BeakerImageSource(beaker=beaker\_image),\
 command=\["python", "-m", "olmocr.pipeline"\] + args\_list,\
 env\_vars=\[\
 BeakerEnvVar(name="BEAKER\_JOB\_NAME", value=task\_name),\
 BeakerEnvVar(name="OWNER", value=owner),\
 BeakerEnvVar(name="HF\_HUB\_OFFLINE", value="1"),\
 \]\
 \+ env\_var\_secrets,\
 resources=BeakerTaskResources(gpu\_count=1, memory="125GB"), # Have to set a memory limit, otherwise VLLM may use too much on its own\
 constraints=BeakerConstraints(cluster=args.beaker\_cluster if isinstance(args.beaker\_cluster, list) else \[args.beaker\_cluster\]),\
 result=BeakerResultSpec(path="/noop-results"),\
 )\
 \],
 retry=BeakerRetrySpec(allowed\_task\_retries=10),
 )

 workload = b.experiment.create(spec=experiment\_spec)

 print(f"Experiment URL: https://beaker.org/ex/{workload.experiment.id}")

def print\_stats(args, root\_work\_queue):
 LONG\_CONTEXT\_THRESHOLD = 32768
 assert args.workspace.startswith("s3://"), "Printing stats functionality only works with s3 workspaces for now."

 done\_work\_items = expand\_s3\_glob(workspace\_s3, os.path.join(args.workspace, "results", "\*.jsonl"))
 work\_queue\_lines = download\_zstd\_csv(workspace\_s3, os.path.join(args.workspace, "work\_index\_list.csv.zstd"))
 work\_queue = {parts\[0\]: parts\[1:\] for line in work\_queue\_lines if line.strip() and (parts := root\_work\_queue.\_decode\_csv\_row(line.strip()))}

 total\_items, completed\_items = len(work\_queue), len(done\_work\_items)

 def process\_output\_file(s3\_path):
 try:
 stats = {
 "docs": 0,
 "input\_tokens": 0,
 "output\_tokens": 0,
 "pages": 0,
 "fallback\_pages": 0,
 "long\_docs": 0,
 "long\_tokens": 0,
 "en\_docs": 0,
 "en\_tokens": 0,
 }
 paths = set()
 for line in get\_s3\_bytes(workspace\_s3, s3\_path).decode("utf-8").splitlines():
 if not line.strip():
 continue
 doc = json.loads(line)
 meta, attrs = doc\["metadata"\], doc.get("attributes", {})
 out\_tokens = meta.get("total-output-tokens", 0)
 stats\["docs"\] += 1
 stats\["input\_tokens"\] += meta.get("total-input-tokens", 0)
 stats\["output\_tokens"\] += out\_tokens
 stats\["pages"\] += meta.get("pdf-total-pages", 0)
 stats\["fallback\_pages"\] += meta.get("total-fallback-pages", 0)
 paths.add(meta\["Source-File"\])
 if out\_tokens > LONG\_CONTEXT\_THRESHOLD:
 stats\["long\_docs"\] += 1
 stats\["long\_tokens"\] += out\_tokens
 langs = attrs.get("primary\_language", \[\])
 if langs and sum(1 for ln in langs if ln == "en") > len(langs) / 2:
 stats\["en\_docs"\] += 1
 stats\["en\_tokens"\] += out\_tokens
 return stats, paths
 except Exception as e:
 logger.warning(f"Error processing {s3\_path}: {e}")
 return {
 k: 0 for k in \["docs", "input\_tokens", "output\_tokens", "pages", "fallback\_pages", "long\_docs", "long\_tokens", "en\_docs", "en\_tokens"\]
 }, set()

 print(f"\\nCompleted work items {completed\_items:,} out of {total\_items:,}: {completed\_items/total\_items\*100:.2f}%")
 print("\\nProcessing output files...")

 totals = {"docs": 0, "input\_tokens": 0, "output\_tokens": 0, "pages": 0, "fallback\_pages": 0, "long\_docs": 0, "long\_tokens": 0, "en\_docs": 0, "en\_tokens": 0}
 all\_processed, original\_paths = set(), set()

 for item in done\_work\_items:
 if (match := re.search(r"output\_(\\w+).jsonl", item)) and match.group(1) in work\_queue:
 original\_paths.update(work\_queue\[match.group(1)\])

 with ThreadPoolExecutor() as executor:
 for stats, paths in tqdm(executor.map(process\_output\_file, done\_work\_items), total=len(done\_work\_items)):
 for k in totals:
 totals\[k\] += stats\[k\]
 all\_processed.update(paths)

 d, p, o, c = totals\["docs"\], totals\["pages"\], totals\["output\_tokens"\], max(1, completed\_items)
 print(f"""
Work Items Status:
Total work items: {total\_items:,}
Completed items: {completed\_items:,}
Remaining items: {total\_items - completed\_items:,}

Results:
Total documents processed: {d:,}
Total documents skipped: {len(original\_paths - all\_processed):,}
Total pages on fallback: {totals\['fallback\_pages'\]:,}
Total pages processed: {p:,}

Total output tokens: {o:,}
Projected output tokens: {round(o / c \* total\_items):,}

Average pages per doc: {p / max(1, d):,.1f}
Average output tokens per doc: {o / max(1, d):,.1f}
Average output tokens per page: {o / max(1, p):,.1f}

Long Context Documents (>{LONG\_CONTEXT\_THRESHOLD} tokens): {totals\['long\_docs'\]:,}
Total tokens in long context documents: {totals\['long\_tokens'\]:,}

English-only documents (>50% pages with 'en'): {totals\['en\_docs'\]:,}
Total output tokens in English-only documents: {totals\['en\_tokens'\]:,}
Projected English-only output tokens: {round(totals\['en\_tokens'\] / c \* total\_items):,}""")

async def main():
 parser = argparse.ArgumentParser(description="Manager for running millions of PDFs through a batch inference pipeline.")
 parser.add\_argument(
 "workspace",
 help="The filesystem path where work will be stored, can be a local folder, or an s3 path if coordinating work with many workers, s3://bucket/prefix/ ",
 )
 parser.add\_argument(
 "--pdfs",
 nargs="\*",
 help="Path to add pdfs stored in s3 to the workspace, can be a glob path s3://bucket/prefix/\*.pdf or path to file containing list of pdf paths",
 default=None,
 )
 parser.add\_argument(
 "--model",
 help="Path where the model is located, allenai/olmOCR-2-7B-1025-FP8 is the default, can be local, s3, or hugging face.",
 default="allenai/olmOCR-2-7B-1025-FP8",
 )

 # More detailed config options, usually you shouldn't have to change these
 parser.add\_argument("--workspace\_profile", help="S3 configuration profile for accessing the workspace", default=None)
 parser.add\_argument("--pdf\_profile", help="S3 configuration profile for accessing the raw pdf documents", default=None)
 parser.add\_argument("--pages\_per\_group", type=int, default=argparse.SUPPRESS, help="Aiming for this many pdf pages per work item group")
 parser.add\_argument("--max\_page\_retries", type=int, default=8, help="Max number of times we will retry rendering a page")
 parser.add\_argument("--max\_page\_error\_rate", type=float, default=0.004, help="Rate of allowable failed pages in a document, 1/250 by default")
 parser.add\_argument("--workers", type=int, default=20, help="Number of workers to run at a time")
 parser.add\_argument("--max\_concurrent\_requests", type=int, default=1600, help="Max number of concurrent VLLM server requests at a time.")
 parser.add\_argument("--max\_server\_ready\_timeout", type=int, default=600, help="Number of seconds to wait for vllm to become ready before exiting.")
 parser.add\_argument("--apply\_filter", action="store\_true", help="Apply basic filtering to English pdfs which are not forms, and not likely seo spam")
 parser.add\_argument("--stats", action="store\_true", help="Instead of running any job, reports some statistics about the current workspace")
 parser.add\_argument("--markdown", action="store\_true", help="Also write natural text to markdown files preserving the folder structure of the input pdfs")
 parser.add\_argument("--target\_longest\_image\_dim", type=int, help="Dimension on longest side to use for rendering the pdf pages", default=1288)
 parser.add\_argument("--target\_anchor\_text\_len", type=int, help="Maximum amount of anchor text to use (characters), not used for new models", default=-1)
 parser.add\_argument("--guided\_decoding", action="store\_true", help="Enable guided decoding for model YAML type outputs")
 parser.add\_argument(
 "--disk\_logging",
 type=str,
 nargs="?",
 const="olmocr-pipeline-debug.log",
 default=None,
 help="Enable writing logs to disk, optionally specify filename (default: olmocr-pipeline-debug.log)",
 )

 server\_group = parser.add\_argument\_group("Server arguments, to specify where your VLLM inference engine is running")
 server\_group.add\_argument(
 "--server",
 type=str,
 help="URL of external vLLM (or other compatible provider) server (e.g., http://hostname:port/v1). If provided, skips spawning local vLLM instance",
 )
 server\_group.add\_argument("--api\_key", type=str, default=None, help="API key for authenticated remote servers (e.g., DeepInfra)")

 vllm\_group = parser.add\_argument\_group(
 "VLLM arguments", "These arguments are passed to vLLM. Any unrecognized arguments are also automatically forwarded to vLLM."
 )
 vllm\_group.add\_argument(
 "--gpu-memory-utilization", type=float, help="Fraction of VRAM vLLM may pre-allocate for KV-cache " "(passed through to vllm serve)."
 )
 vllm\_group.add\_argument("--max\_model\_len", type=int, default=16384, help="Upper bound (tokens) vLLM will allocate KV-cache for, lower if VLLM won't start")
 vllm\_group.add\_argument("--tensor-parallel-size", "-tp", type=int, default=1, help="Tensor parallel size for vLLM")
 vllm\_group.add\_argument("--data-parallel-size", "-dp", type=int, default=1, help="Data parallel size for vLLM")
 vllm\_group.add\_argument("--port", type=int, default=30024, help="Port to use for the VLLM server")

 # Beaker/job running stuff
 beaker\_group = parser.add\_argument\_group("beaker/cluster execution")
 beaker\_group.add\_argument("--beaker", action="store\_true", help="Submit this job to beaker instead of running locally")
 beaker\_group.add\_argument("--beaker\_workspace", help="Beaker workspace to submit to", default="ai2/olmocr")
 beaker\_group.add\_argument(
 "--beaker\_cluster",
 help="Beaker clusters you want to run on",
 default=\["ai2/jupiter", "ai2/ceres", "ai2/neptune", "ai2/saturn"\],
 )
 beaker\_group.add\_argument("--beaker\_gpus", type=int, default=1, help="Number of gpu replicas to run")
 beaker\_group.add\_argument("--beaker\_priority", type=str, default="normal", help="Beaker priority level for the job")

 args, unknown\_args = parser.parse\_known\_args()

 # Set up file logging if enabled
 if args.disk\_logging:
 file\_handler = logging.FileHandler(args.disk\_logging, mode="a")
 file\_handler.setLevel(logging.DEBUG)
 file\_handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
 logger.addHandler(file\_handler)
 server\_logger.addHandler(file\_handler)

 logger.info(
 "If you run out of GPU memory during start-up or get 'KV cache is larger than available memory' errors, retry with lower values, e.g. --gpu\_memory\_utilization 0.80 --max\_model\_len 16384"
 )

 use\_internal\_server = not args.server
 global workspace\_s3, pdf\_s3, max\_concurrent\_requests\_limit

 max\_concurrent\_requests\_limit = asyncio.BoundedSemaphore(args.max\_concurrent\_requests)

 # setup the job to work in beaker environment, load secrets, adjust logging, etc.
 if "BEAKER\_JOB\_NAME" in os.environ:
 cred\_path = os.path.join(os.path.expanduser("~"), ".aws", "credentials")
 os.makedirs(os.path.dirname(cred\_path), exist\_ok=True)
 with open(cred\_path, "w") as f:
 f.write(os.environ.get("AWS\_CREDENTIALS\_FILE"))
 cred\_path = os.path.join(os.path.expanduser("~"), ".gcs", "credentials")
 os.makedirs(os.path.dirname(cred\_path), exist\_ok=True)
 with open(cred\_path, "w") as f:
 f.write(os.environ.get("GOOGLE\_APPLICATION\_CREDENTIALS\_FILE"))
 os.environ\["GOOGLE\_APPLICATION\_CREDENTIALS"\] = cred\_path
 workspace\_s3 = boto3.client("s3")
 pdf\_s3 = boto3.client("s3")

 # Wait a little bit so that not all beaker jobs in a task start at the same time and download the model at the same time
 replica\_count = int(os.environ.get("BEAKER\_REPLICA\_COUNT", "1"))
 interval = 10 if (replica\_count - 1) \* 10 <= 30 else 30 / max(1, replica\_count - 1)
 sleep\_time = int(os.environ.get("BEAKER\_REPLICA\_RANK", "0")) \* interval
 logger.info(f"Beaker job sleeping for {sleep\_time} seconds to stagger model downloads")
 await asyncio.sleep(sleep\_time)

 # If you specify an API key, meaning you are on a remote provider, then lower the group size default, not to overwhelm such servers
 # and not to waste money if a group doesn't finish right away
 if not hasattr(args, "pages\_per\_group"):
 args.pages\_per\_group = 50 if args.api\_key is not None else 500

 if args.workspace\_profile:
 workspace\_session = boto3.Session(profile\_name=args.workspace\_profile)
 workspace\_s3 = workspace\_session.client("s3")

 if args.pdf\_profile:
 pdf\_session = boto3.Session(profile\_name=args.pdf\_profile)
 pdf\_s3 = pdf\_session.client("s3")

 # We need poppler to load the initial pdfs, even if we are not processing them here
 check\_poppler\_version()

 # Create work queue
 if args.workspace.startswith("s3://"):
 work\_queue = WorkQueue(S3Backend(workspace\_s3, args.workspace))
 else:
 work\_queue = WorkQueue(LocalBackend(args.workspace))

 if args.pdfs:
 logger.info("Got --pdfs argument, going to add to the work queue")
 pdf\_work\_paths = set()
 tarball\_paths = set()

 for pdf\_path in args.pdfs:
 # Expand s3 glob paths first, then categorize results
 if pdf\_path.startswith("s3://"):
 logger.info(f"Expanding s3 glob at {pdf\_path}")
 expanded\_paths = set(expand\_s3\_glob(pdf\_s3, pdf\_path))
 tarball\_paths.update(p for p in expanded\_paths if is\_tarball\_path(p))
 pdf\_work\_paths.update(p for p in expanded\_paths if not is\_tarball\_path(p))
 elif os.path.exists(pdf\_path):
 # Check if this is a tar.gz file (local)
 if is\_tarball\_path(pdf\_path):
 tarball\_paths.add(pdf\_path)
 elif (
 pdf\_path.lower().endswith(".pdf")
 or pdf\_path.lower().endswith(".png")
 or pdf\_path.lower().endswith(".jpg")
 or pdf\_path.lower().endswith(".jpeg")
 ):
 if open(pdf\_path, "rb").read(4) == b"%PDF":
 logger.info(f"Loading file at {pdf\_path} as PDF document")
 pdf\_work\_paths.add(pdf\_path)
 elif is\_png(pdf\_path) or is\_jpeg(pdf\_path):
 logger.info(f"Loading file at {pdf\_path} as image document")
 pdf\_work\_paths.add(pdf\_path)
 else:
 logger.warning(f"File at {pdf\_path} is not a valid PDF")
 elif pdf\_path.lower().endswith(".txt"):
 logger.info(f"Loading file at {pdf\_path} as list of paths")
 with open(pdf\_path, "r") as f:
 lines = \[line.strip() for line in f if line.strip()\]
 tarball\_paths.update(p for p in lines if is\_tarball\_path(p))
 pdf\_work\_paths.update(p for p in lines if not is\_tarball\_path(p))
 else:
 raise ValueError(f"Unsupported file extension for {pdf\_path}")
 else:
 raise ValueError("pdfs argument needs to be either a local path, an s3 path, or an s3 glob pattern...")

 logger.info(f"Found {len(pdf\_work\_paths):,} regular pdf paths and {len(tarball\_paths):,} tarballs to add")

 # Process regular PDFs with calculated items\_per\_group
 if pdf\_work\_paths:
 # Estimate average pages per pdf
 sample\_size = min(100, len(pdf\_work\_paths))
 sampled\_pdfs = random.sample(list(pdf\_work\_paths), sample\_size)
 page\_counts = \[\]

 for pdf in tqdm(sampled\_pdfs, desc="Sampling PDFs to calculate optimal length"):
 try:
 # Download the PDF to a temp file
 with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp\_file:
 tmp\_file.write(get\_s3\_bytes(pdf\_s3, pdf))
 tmp\_file.flush()
 if is\_png(tmp\_file.name) or is\_jpeg(tmp\_file.name):
 page\_counts.append(1)
 else:
 reader = PdfReader(tmp\_file.name)
 page\_counts.append(len(reader.pages))
 except Exception as e:
 logger.warning(f"Failed to read {pdf}: {e}")

 if page\_counts:
 avg\_pages\_per\_pdf = sum(page\_counts) / len(page\_counts)
 else:
 logger.warning("Could not read any PDFs to estimate average page count.")
 avg\_pages\_per\_pdf = 10 # Default to 10 pages per PDF if sampling fails

 items\_per\_group = max(1, int(args.pages\_per\_group / avg\_pages\_per\_pdf))
 logger.info(f"Calculated items\_per\_group: {items\_per\_group} based on average pages per PDF: {avg\_pages\_per\_pdf:.2f}")

 # Now call populate\_queue for regular PDFs
 await work\_queue.populate\_queue(list(pdf\_work\_paths), items\_per\_group)

 # Add tarballs to the queue - each tarball is one work item
 if tarball\_paths:
 await work\_queue.populate\_queue(tarball\_paths, 1)

 if args.stats:
 print\_stats(args, work\_queue)
 return

 if args.beaker:
 submit\_beaker\_job(args)
 return

 # If you get this far, then you are doing inference and need a GPU
 # check\_sglang\_version()
 if use\_internal\_server:
 check\_torch\_gpu\_available()

 logger.info(f"Starting pipeline with PID {os.getpid()}")

 # Download the model before you do anything else
 if use\_internal\_server:
 model\_name\_or\_path = await download\_model(args.model)
 args.server = f"http://localhost:{args.port}/v1"
 args.model = "olmocr" # Internal server always uses this name for the model, for supporting weird local model paths
 logger.info(f"Using internal server at {args.server}")
 else:
 logger.info(f"Using external server at {args.server}")
 model\_name\_or\_path = None

 # Initialize the work queue
 qsize = await work\_queue.initialize\_queue()

 if qsize == 0:
 logger.info("No work to do, exiting")
 return

 # Start local vLLM instance if not using external one
 vllm\_server = None
 if use\_internal\_server:
 vllm\_server = asyncio.create\_task(vllm\_server\_host(model\_name\_or\_path, args, unknown\_args))

 await vllm\_server\_ready(args)

 metrics\_task = asyncio.create\_task(metrics\_reporter(work\_queue))

 # Create worker tasks to process the queue concurrently.
 worker\_tasks = \[\]
 for i in range(args.workers):
 task = asyncio.create\_task(worker(args, work\_queue, worker\_id=i))
 worker\_tasks.append(task)

 # Wait for all worker tasks to finish
 await asyncio.gather(\*worker\_tasks)

 # Cancel vLLM server if it was started
 if vllm\_server is not None:
 vllm\_server.cancel()
 metrics\_task.cancel()

 # Wait for cancelled tasks to complete
 tasks\_to\_wait = \[metrics\_task\]
 if vllm\_server is not None:
 tasks\_to\_wait.append(vllm\_server)
 await asyncio.gather(\*tasks\_to\_wait, return\_exceptions=True)

 # Output final metrics summary
 metrics\_summary = metrics.get\_metrics\_summary()
 logger.info("=" \* 80)
 logger.info("FINAL METRICS SUMMARY")
 logger.info("=" \* 80)
 logger.info(f"Total elapsed time: {metrics\_summary\['elapsed\_time\_seconds'\]:.2f} seconds")

 # Output token counts and rates
 total\_metrics = metrics\_summary\["total\_metrics"\]
 rates = metrics\_summary\["rates"\]

 logger.info(f"Total Server Input tokens: {total\_metrics.get('server\_input\_tokens', 0):,}")
 logger.info(f"Total Server Output tokens: {total\_metrics.get('server\_output\_tokens', 0):,}")

 logger.info(f"Finished input tokens: {total\_metrics.get('finished\_input\_tokens', 0):,}")
 logger.info(f"Finished output tokens: {total\_metrics.get('finished\_output\_tokens', 0):,}")

 logger.info(f"Completed pages: {total\_metrics.get('completed\_pages', 0):,}")
 logger.info(f"Failed pages: {total\_metrics.get('failed\_pages', 0):,}")
 logger.info(
 f"Page Failure rate: {total\_metrics.get('failed\_pages', 0) / max(total\_metrics.get('completed\_pages', 0) + total\_metrics.get('failed\_pages', 0), 1) \* 100:.2f}%"
 )

 # Output finished\_on\_attempt statistics
 logger.info("")
 logger.info("Pages finished by attempt number:")
 total\_finished = sum(total\_metrics.get(f"finished\_on\_attempt\_{i}", 0) for i in range(args.max\_page\_retries))
 cumulative = 0

 for i in range(args.max\_page\_retries):
 if f"finished\_on\_attempt\_{i}" in total\_metrics:
 count = total\_metrics\[f"finished\_on\_attempt\_{i}"\]
 cumulative += count
 percentage = (count / total\_finished \* 100) if total\_finished > 0 else 0
 cumulative\_percentage = (cumulative / total\_finished \* 100) if total\_finished > 0 else 0
 logger.info(f" Attempt {i}: {count:,} pages ({percentage:.1f}%) - Cumulative: {cumulative:,} ({cumulative\_percentage:.1f}%)")

 # Output rates
 if "server\_input\_tokens\_per\_sec" in rates:
 logger.info(f"Server Input tokens/sec rate: {rates\['server\_input\_tokens\_per\_sec'\]:.2f}")
 if "server\_output\_tokens\_per\_sec" in rates:
 logger.info(f"Server Output tokens/sec rate: {rates\['server\_output\_tokens\_per\_sec'\]:.2f}")
 if "finished\_input\_tokens\_per\_sec" in rates:
 logger.info(f"Finished Input tokens/sec rate: {rates\['finished\_input\_tokens\_per\_sec'\]:.2f}")
 if "finished\_output\_tokens\_per\_sec" in rates:
 logger.info(f"Finished Output tokens/sec rate: {rates\['finished\_output\_tokens\_per\_sec'\]:.2f}")

 logger.info("=" \* 80)
 logger.info("Work done")

def cli\_main():
 """Synchronous entry point for the CLI."""
 return asyncio.run(main())

if \_\_name\_\_ == "\_\_main\_\_":
 cli\_main()