![olmocr-2-full@2x](https://github.com/user-attachments/assets/24f1b596-4059-46f1-8130-5d72dcc0b02e)

* * *

[![GitHub License](https://img.shields.io/github/license/allenai/OLMo)](https://github.com/allenai/OLMo/blob/main/LICENSE)[![GitHub release](https://img.shields.io/github/release/allenai/olmocr.svg)](https://github.com/allenai/olmocr/releases)[![Tech Report v1](https://img.shields.io/badge/Paper_v1-olmOCR-blue)](https://arxiv.org/abs/2502.18443)[![Tech Report v2](https://img.shields.io/badge/Paper_v2-olmOCR-blue)](https://arxiv.org/abs/2510.19817)[![Demo](https://img.shields.io/badge/Ai2-Demo-F0529C)](https://olmocr.allenai.org/)[![Discord](https://img.shields.io/badge/Discord%20-%20blue?style=flat&logo=discord&label=Ai2&color=%235B65E9)](https://discord.gg/sZq3jTNVNG)

A toolkit for converting PDFs and other image-based document formats into clean, readable, plain text format.

Try the online demo: \[https://olmocr.allenai.org/\](https://olmocr.allenai.org/)

Features:
 \- Convert PDF, PNG, and JPEG based documents into clean Markdown
 \- Support for equations, tables, handwriting, and complex formatting
 \- Automatically removes headers and footers
 \- Convert into text with a natural reading order, even in the presence of
 figures, multi-column layouts, and insets
 \- Efficient, less than $200 USD per million pages converted
 \- (Based on a 7B parameter VLM, so it requires a GPU)

\### News
 \- October 21, 2025 - v0.4.0 - \[New model release\](https://huggingface.co/allenai/olmOCR-2-7B-1025-FP8), boosts olmOCR-bench score by ~4 points using synthetic data and introduces RL training.
 \- August 13, 2025 - v0.3.0 - \[New model release\](https://huggingface.co/allenai/olmOCR-7B-0825-FP8), fixes auto-rotation detection, and hallucinations on blank documents.
 \- July 24, 2025 - v0.2.1 - \[New model release\](https://huggingface.co/allenai/olmOCR-7B-0725-FP8), scores 3 points higher on \[olmOCR-Bench\](https://github.com/allenai/olmocr/tree/main/olmocr/bench), also runs significantly faster because it's default FP8, and needs much fewer retries per document.
 \- July 23, 2025 - v0.2.0 - New cleaned up \[trainer code\](https://github.com/allenai/olmocr/tree/main/olmocr/train), makes it much simpler to train olmOCR models yourself.
 \- June 17, 2025 - v0.1.75 - Switch from sglang to vllm based inference pipeline, updated docker image to CUDA 12.8.
 \- May 23, 2025 - v0.1.70 - Official docker support and images are now available! \[See Docker usage\](#using-docker)
 \- May 19, 2025 - v0.1.68 - \[olmOCR-Bench\](https://github.com/allenai/olmocr/tree/main/olmocr/bench) launch, scoring 77.4. Launch includes 2 point performance boost in olmOCR pipeline due to bug fixes with prompts.
 \- Mar 17, 2025 - v0.1.60 - Performance improvements due to better temperature selection in sampling.
 \- Feb 25, 2025 - v0.1.58 - Initial public launch and demo.

\### Benchmark

\[\*\*olmOCR-Bench\*\*\](https://github.com/allenai/olmocr/tree/main/olmocr/bench):
We also ship a comprehensive benchmark suite covering over 7,000 test cases across 1,400 documents to help measure performance of OCR systems.

|  | ArXiv | Old<br>scans<br>math | Tables | Old<br>scans | Headers<br>&<br>footers | Multi<br>column | Long<br>tiny<br>text | Base | Overall |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mistral OCR API | 77.2 | 67.5 | 60.6 | 29.3 | 93.6 | 71.3 | 77.1 | 99.4 | 72.0±1.1 |
| Marker 1.10.1 | 83.8 | 66.8 | 72.9 | 33.5 | 86.6 | 80.0 | 85.7 | 99.3 | 76.1±1.1 |
| MinerU 2.5.4\* | 76.6 | 54.6 | 84.9 | 33.7 | 96.6 | 78.2 | 83.5 | 93.7 | 75.2±1.1 |
| DeepSeek-OCR | 77.2 | 73.6 | 80.2 | 33.3 | 96.1 | 66.4 | 79.4 | 99.8 | 75.7±1.0 |
| Nanonets-OCR2-3B | 75.4 | 46.1 | 86.8 | 40.9 | 32.1 | 81.9 | 93.0 | 99.6 | 69.5±1.1 |
| PaddleOCR-VL\* | 85.7 | 71.0 | 84.1 | 37.8 | 97.0 | 79.9 | 85.7 | 98.5 | 80.0±1.0 |
| Infinity-Parser 7B\* | 84.4 | 83.8 | 85.0 | 47.9 | 88.7 | 84.2 | 86.4 | 99.8 | 82.5±? |
| Chandra OCR 0.1.0\* | 82.2 | 80.3 | 88.0 | 50.4 | 90.8 | 81.2 | 92.3 | 99.9 | 83.1±0.9 |
| * * * |
| **olmOCR v0.4.0** | 83.0 | 82.3 | 84.9 | 47.7 | 96.1 | 83.7 | 81.9 | 99.7 | 82.4±1.1 |

\### Installation

\#### System Dependencies

You will need to install poppler-utils and additional fonts for rendering PDF images.

Install dependencies (Ubuntu/Debian):
\`\`\`bash
sudo apt-get update
sudo apt-get install poppler-utils ttf-mscorefonts-installer msttcorefonts fonts-crosextra-caladea fonts-crosextra-carlito gsfonts lcdf-typetools
\`\`\`

\#### Python Installation

Set up a conda environment and install olmocr. The requirements for running olmOCR
are difficult to install in an existing python environment, so please do make a clean python environment to install into.

\`\`\`bash
conda create -n olmocr python=3.11
conda activate olmocr
\`\`\`

Choose the installation option that matches your use case:

\*\*Option 1: Remote Inference (Lightweight)\*\*

If you plan to use a remote vLLM server with the \`--server\` flag, install the base package:
\`\`\`bash
pip install olmocr
\`\`\`
This avoids installing heavy GPU dependencies like PyTorch (~2GB+).

\*\*Option 2: Local GPU Inference\*\*

Requirements:
 \- Recent NVIDIA GPU (tested on RTX 4090, L40S, A100, H100) with at least 12 GB of GPU RAM
 \- 30GB of free disk space

For running inference with your own GPU:
\`\`\`bash
pip install olmocr\[gpu\] --extra-index-url https://download.pytorch.org/whl/cu128

\# Recommended: Install flash infer for faster inference on GPU
pip install https://download.pytorch.org/whl/cu128/flashinfer/flashinfer\_python-0.2.5%2Bcu128torch2.7-cp38-abi3-linux\_x86\_64.whl
\`\`\`

\*\*Option 3: Beaker Cluster Execution\*\*

For submitting jobs to Beaker clusters with the \`--beaker\` flag:
\`\`\`bash
pip install olmocr\[beaker\]
\`\`\`

\*\*Option 4: Benchmark Suite\*\*

For running the olmOCR benchmark suite:
\`\`\`bash
pip install olmocr\[bench\]
\`\`\`

\*\*Combined Installation\*\*

You can combine multiple options:
\`\`\`bash
\# GPU + Beaker support
pip install olmocr\[gpu,beaker\] --extra-index-url https://download.pytorch.org/whl/cu128

\# GPU + Benchmark support
pip install olmocr\[gpu,bench\] --extra-index-url https://download.pytorch.org/whl/cu128
\`\`\`

\*\*Troubleshooting\*\*

If you run into errors about \`too many open files\`, update your ulimit:
\`\`\`bash
ulimit -n 65536
\`\`\`

\### Usage Examples

For quick testing, try the \[web demo\](https://olmocr.allen.ai/).

\*\*Convert a Single PDF (Local GPU):\*\*
\`\`\`bash
\# Download a sample PDF
curl -o olmocr-sample.pdf https://olmocr.allenai.org/papers/olmocr\_3pg\_sample.pdf

\# Convert it to markdown
olmocr ./localworkspace --markdown --pdfs olmocr-sample.pdf
\`\`\`

\*\*Convert an Image file:\*\*
\`\`\`bash
olmocr ./localworkspace --markdown --pdfs random\_page.png
\`\`\`

\*\*Convert Multiple PDFs:\*\*
\`\`\`bash
olmocr ./localworkspace --markdown --pdfs tests/gnarly\_pdfs/\*.pdf
\`\`\`

\*\*Use Remote Inference Server:\*\*
\`\`\`bash
olmocr ./localworkspace --server http://remote-server:8000/v1 --model allenai/olmOCR-2-7B-1025-FP8 --markdown --pdfs \*.pdf
\`\`\`

With the \`--markdown\` flag, results will be stored as markdown files inside of \`./localworkspace/markdown/\`.

\> \*\*Note:\*\* You can also use \`python -m olmocr.pipeline\` instead of \`olmocr\` if you prefer.

\#### Viewing Results

The \`./localworkspace/\` workspace folder will then have both \[Dolma\](https://github.com/allenai/dolma) and markdown files (if using \`--markdown\`).

\`\`\`bash
cat localworkspace/markdown/olmocr-sample.md
\`\`\`

\`\`\`
olmOCR: Unlocking Trillions of Tokens in PDFs with Vision Language Models
...
\`\`\`

\### Using an Inference Provider or External Server

If you have a vLLM server already running elsewhere (or any inference platform implementing the OpenAI API), you can point olmOCR to use it instead of spawning a local instance.

\*\*Installation for Remote Inference:\*\*
\`\`\`bash
\# Lightweight installation - no GPU dependencies needed
pip install olmocr
\`\`\`

\*\*Using an External Server:\*\*
\`\`\`bash
\# Use external vLLM server instead of local one
olmocr ./localworkspace --server http://remote-server:8000/v1 --model allenai/olmOCR-2-7B-1025-FP8 --markdown --pdfs tests/gnarly\_pdfs/\*.pdf
\`\`\`

The served model name in vLLM needs to match the value provided in \`--model\`.

\*\*Example vLLM Server Launch:\*\*
\`\`\`bash
vllm serve allenai/olmOCR-2-7B-1025-FP8 --max-model-len 16384
\`\`\`

\#### Verified External Providers

We have tested \`olmOCR-2-7B-1025-FP8\` on these external model providers and confirmed that they work

\| \| $/1M Input tokens \| $/1M Output tokens \| Example Command \|
\|-----------------------------------------------------------------------------\|-------------------\|--------------------\|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------\|
\| \[Cirrascale\](https://ai2endpoints.cirrascale.ai/models/overview) \| $0.07 \| $0.15 \| \`olmocr ./workspace --server https://ai2endpoints.cirrascale.ai/api --api\_key sk-XXXXXXX --workers 1 --max\_concurrent\_requests 20 --model olmOCR-2-7B-1025 --pdfs tests/gnarly\_pdfs/\*.pdf\` \|
\| \[DeepInfra\](https://deepinfra.com/) \| $0.09 \| $0.19 \| \`olmocr ./workspace --server https://api.deepinfra.com/v1/openai --api\_key DfXXXXXXX --workers 1 --max\_concurrent\_requests 20 --model allenai/olmOCR-2-7B-1025 --pdfs tests/gnarly\_pdfs/\*.pdf\` \|
\| \[Parasail\](https://www.saas.parasail.io/serverless?name=olmocr-7b-1025-fp8) \| $0.10 \| $0.20 \| \`olmocr ./workspace --server https://api.parasail.io/v1 --api\_key psk-XXXXX --workers 1 --max\_concurrent\_requests 20 --model allenai/olmOCR-2-7B-1025 --pdfs tests/gnarly\_pdfs/\*.pdf\` \|

Notes on arguments
\- \`--server\`: Defines the OpenAI-compatible endpoint: ex \`https://api.deepinfra.com/v1/openai\`
\- \`--api\_key\`: Your API key, bassed in via Authorization Bearer HTTP header
\- \`--max\_concurrent\_requests\`: Max concurrent requests that will be in-flight to the inference provider at one time
\- \`--workers\`: Max number of page groups that will be processed at once. You may want to set this to \`1\` so that you finish one group of stuff before moving on.
\- \`--pages\_per\_group\`: You may want a smaller number of pages per group as many external provides have lower concurrent request limits
\- \`--model\`: The model identifier, ex. \`allenai/olmOCR-2-7B-1025\`, different providers have different names, and if you run locally, you can use \`olmocr\`
\- Other arguments work the same as with local inference

\### Multi-node / Cluster Usage

If you want to convert millions of PDFs using multiple nodes running in parallel, olmOCR supports
reading PDFs from AWS S3 and coordinating work using an AWS S3 output bucket.

\*\*Start the first worker node:\*\*
\`\`\`bash
olmocr s3://my\_s3\_bucket/pdfworkspaces/exampleworkspace --pdfs s3://my\_s3\_bucket/jakep/gnarly\_pdfs/\*.pdf
\`\`\`

This sets up a simple work queue in your AWS bucket and starts converting PDFs.

\*\*On subsequent worker nodes:\*\*
\`\`\`bash
olmocr s3://my\_s3\_bucket/pdfworkspaces/exampleworkspace
\`\`\`

They will automatically start grabbing items from the same workspace queue.

\#### Using Beaker for Cluster Execution

If you are at Ai2 and want to linearize millions of PDFs efficiently using \[beaker\](https://www.beaker.org), install with Beaker support:

\`\`\`bash
pip install olmocr\[gpu,beaker\] --extra-index-url https://download.pytorch.org/whl/cu128
\`\`\`

Then use the \`--beaker\` flag to prepare the workspace locally and launch N GPU workers in the cluster:

\`\`\`bash
olmocr s3://my\_s3\_bucket/pdfworkspaces/exampleworkspace --pdfs s3://my\_s3\_bucket/jakep/gnarly\_pdfs/\*.pdf --beaker --beaker\_gpus 4
\`\`\`

\### Using Docker

Pull the Docker image (large, includes the model, ~30GB):
\`\`\`bash
docker pull alleninstituteforai/olmocr:latest-with-model
\`\`\`

For advanced users who want to manage their own model downloads, we also provide a base image without the model:
\`\`\`bash
docker pull alleninstituteforai/olmocr:latest
\`\`\`

\#### Quick Start - Process PDFs

Process a single PDF in your current directory:
\`\`\`bash
docker run --gpus all \
 -v $(pwd):/workspace \
 alleninstituteforai/olmocr:latest-with-model \
 -c "olmocr /workspace/output --markdown --pdfs /workspace/sample.pdf"
\`\`\`

Process multiple PDFs:
\`\`\`bash
docker run --gpus all \
 -v /path/to/pdfs:/input \
 -v /path/to/output:/output \
 alleninstituteforai/olmocr:latest-with-model \
 -c "olmocr /output --markdown --pdfs /input/\*.pdf"
\`\`\`

\#### Interactive Mode

Run the container interactively for exploration and debugging:
\`\`\`bash
docker run -it --gpus all alleninstituteforai/olmocr:latest-with-model
\`\`\`

\> Visit our Docker repository on \[Docker Hub\](https://hub.docker.com/r/alleninstituteforai/olmocr) for more information.

\### Full Documentation

To see all available options:
\`\`\`bash
olmocr --help
usage: pipeline.py \[-h\] \[--pdfs \[PDFS ...\]\] \[--model MODEL\] \[--workspace\_profile WORKSPACE\_PROFILE\] \[--pdf\_profile PDF\_PROFILE\] \[--pages\_per\_group PAGES\_PER\_GROUP\] \[--max\_page\_retries MAX\_PAGE\_RETRIES\] \[--max\_page\_error\_rate MAX\_PAGE\_ERROR\_RATE\] \[--workers WORKERS\]
 \[--apply\_filter\] \[--stats\] \[--markdown\] \[--target\_longest\_image\_dim TARGET\_LONGEST\_IMAGE\_DIM\] \[--target\_anchor\_text\_len TARGET\_ANCHOR\_TEXT\_LEN\] \[--guided\_decoding\] \[--gpu-memory-utilization GPU\_MEMORY\_UTILIZATION\] \[--max\_model\_len MAX\_MODEL\_LEN\]
 \[--tensor-parallel-size TENSOR\_PARALLEL\_SIZE\] \[--data-parallel-size DATA\_PARALLEL\_SIZE\] \[--port PORT\] \[--server SERVER\] \[--beaker\] \[--beaker\_workspace BEAKER\_WORKSPACE\] \[--beaker\_cluster BEAKER\_CLUSTER\] \[--beaker\_gpus BEAKER\_GPUS\] \[--beaker\_priority BEAKER\_PRIORITY\]
 workspace

Manager for running millions of PDFs through a batch inference pipeline

positional arguments:
 workspace The filesystem path where work will be stored, can be a local folder, or an s3 path if coordinating work with many workers, s3://bucket/prefix/

options:
 -h, --help show this help message and exit
 --pdfs \[PDFS ...\] Path to add pdfs stored in s3 to the workspace, can be a glob path s3://bucket/prefix/\*.pdf or path to file containing list of pdf paths
 --model MODEL Path where the model is located, allenai/olmOCR-7B-0725-FP8 is the default, can be local, s3, or hugging face.
 --workspace\_profile WORKSPACE\_PROFILE
 S3 configuration profile for accessing the workspace
 --pdf\_profile PDF\_PROFILE
 S3 configuration profile for accessing the raw pdf documents
 --pages\_per\_group PAGES\_PER\_GROUP
 Aiming for this many pdf pages per work item group
 --max\_page\_retries MAX\_PAGE\_RETRIES
 Max number of times we will retry rendering a page
 --max\_page\_error\_rate MAX\_PAGE\_ERROR\_RATE
 Rate of allowable failed pages in a document, 1/250 by default
 --workers WORKERS Number of workers to run at a time
 --apply\_filter Apply basic filtering to English pdfs which are not forms, and not likely seo spam
 --stats Instead of running any job, reports some statistics about the current workspace
 --markdown Also write natural text to markdown files preserving the folder structure of the input pdfs
 --target\_longest\_image\_dim TARGET\_LONGEST\_IMAGE\_DIM
 Dimension on longest side to use for rendering the pdf pages
 --target\_anchor\_text\_len TARGET\_ANCHOR\_TEXT\_LEN
 Maximum amount of anchor text to use (characters), not used for new models
 --guided\_decoding Enable guided decoding for model YAML type outputs

VLLM arguments:
 --gpu-memory-utilization GPU\_MEMORY\_UTILIZATION
 Fraction of VRAM vLLM may pre-allocate for KV-cache (passed through to vllm serve).
 --max\_model\_len MAX\_MODEL\_LEN
 Upper bound (tokens) vLLM will allocate KV-cache for, lower if VLLM won't start
 --tensor-parallel-size TENSOR\_PARALLEL\_SIZE, -tp TENSOR\_PARALLEL\_SIZE
 Tensor parallel size for vLLM
 --data-parallel-size DATA\_PARALLEL\_SIZE, -dp DATA\_PARALLEL\_SIZE
 Data parallel size for vLLM
 --port PORT Port to use for the VLLM server
 --server SERVER URL of external vLLM (or other compatible provider)
 server (e.g., http://hostname:port). If provided,
 skips spawning local vLLM instance

beaker/cluster execution:
 --beaker Submit this job to beaker instead of running locally
 --beaker\_workspace BEAKER\_WORKSPACE
 Beaker workspace to submit to
 --beaker\_cluster BEAKER\_CLUSTER
 Beaker clusters you want to run on
 --beaker\_gpus BEAKER\_GPUS
 Number of gpu replicas to run
 --beaker\_priority BEAKER\_PRIORITY
 Beaker priority level for the job
\`\`\`

\## Code overview

There are some nice reusable pieces of the code that may be useful for your own projects:
 \- A prompting strategy to get really good natural text parsing using ChatGPT 4o - \[buildsilver.py\](https://github.com/allenai/olmocr/blob/main/olmocr/data/buildsilver.py)
 \- Basic filtering by language and SEO spam removal - \[filter.py\](https://github.com/allenai/olmocr/blob/main/olmocr/filter/filter.py)
 \- SFT Finetuning code for Qwen2.5-VL - \[train.py\](https://github.com/allenai/olmocr/blob/main/olmocr/train/train.py)
 \- GRPO RL Trainer - \[grpo\_train.py\](https://github.com/allenai/olmocr/blob/main/olmocr/train/grpo\_train.py)
 \- Synthetic data generation - \[mine\_html\_templates.py\](https://github.com/allenai/olmocr/blob/main/olmocr/synth/mine\_html\_templates.py)
 \- Processing millions of PDFs through a finetuned model using VLLM - \[pipeline.py\](https://github.com/allenai/olmocr/blob/main/olmocr/pipeline.py)
 \- Viewing \[Dolma docs\](https://github.com/allenai/dolma) created from PDFs - \[dolmaviewer.py\](https://github.com/allenai/olmocr/blob/main/olmocr/viewer/dolmaviewer.py)

\## Team

\*\*olmOCR\*\* is developed and maintained by the AllenNLP team, backed by \[the Allen Institute for Artificial Intelligence (AI2)\](https://allenai.org/).
AI2 is a non-profit institute with the mission to contribute to humanity through high-impact AI research and engineering.
To learn more about who specifically contributed to this codebase, see \[our contributors\](https://github.com/allenai/olmocr/graphs/contributors) page.

\## License

\*\*olmOCR\*\* is licensed under \[Apache 2.0\](https://www.apache.org/licenses/LICENSE-2.0).
A full copy of the license can be found \[on GitHub\](https://github.com/allenai/olmocr/blob/main/LICENSE).

\## Citing

For olmOCR v1 and OlmOCR-bench:
\`\`\`bibtex
@misc{olmocrbench,
 title={{olmOCR: Unlocking Trillions of Tokens in PDFs with Vision Language Models}},
 author={Jake Poznanski and Jon Borchardt and Jason Dunkelberger and Regan Huff and Daniel Lin and Aman Rangapur and Christopher Wilhelm and Kyle Lo and Luca Soldaini},
 year={2025},
 eprint={2502.18443},
 archivePrefix={arXiv},
 primaryClass={cs.CL},
 url={https://arxiv.org/abs/2502.18443},
}
\`\`\`

For olmOCR v2 Unit Testing Rewards with RL:
\`\`\`bibtex
@misc{olmocr2,
 title={olmOCR 2: Unit Test Rewards for Document OCR},
 author={Jake Poznanski and Luca Soldaini and Kyle Lo},
 year={2025},
 eprint={2510.19817},
 archivePrefix={arXiv},
 primaryClass={cs.CV},
 url={https://arxiv.org/abs/2510.19817},
}
\`\`\`