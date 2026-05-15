[Skip to main content](https://pypi.org/project/olmocr/#content) Switch to mobile version

Join us at PyCon US 2026 in Long Beach, CA starting May 13! Grab your ticket today before they're gone.
[PYCON US: TICKET SALES ENDING SOON!](https://us.pycon.org/2026/attend/information/)

Search PyPISearch

# olmocr 0.4.27

pip install olmocrCopy PIP instructions

[Latest version](https://pypi.org/project/olmocr/)

Released: Mar 12, 2026

Fast, efficient, and high quality OCR powered by open visual language models

### Navigation

### Verified details

_These details have been [verified by PyPI](https://docs.pypi.org/project_metadata/#verified-details)_

###### Maintainers

[![Avatar for jakep-allenai from gravatar.com](https://pypi-camo.freetls.fastly.net/cfa1a27fa76a75cda63a2bd9b18adeccf2e59693/68747470733a2f2f7365637572652e67726176617461722e636f6d2f6176617461722f32376234623964663839366233353835363061336164353465326332343132393f73697a653d3530)jakep-allenai](https://pypi.org/user/jakep-allenai/)

### Unverified details

_These details have **not** been verified by PyPI_

###### Project links

- [Changelog](https://github.com/allenai/olmocr/blob/main/CHANGELOG.md)
- [Homepage](https://github.com/allenai/olmocr)
- [Repository](https://github.com/allenai/olmocr)

###### Meta

- **License:** Apache Software License (Apache License)

- **Author:** [Allen Institute for Artificial Intelligence](mailto:jakep@allenai.org)
- **Requires:** Python >=3.11

- **Provides-Extra:**`gpu`
, `beaker`
, `dev`
, `bench`
, `train`
, `elo`

###### Classifiers

- **Development Status**  - [3 - Alpha](https://pypi.org/search/?c=Development+Status+%3A%3A+3+-+Alpha)
- **Intended Audience**  - [Science/Research](https://pypi.org/search/?c=Intended+Audience+%3A%3A+Science%2FResearch)
- **License**  - [OSI Approved :: Apache Software License](https://pypi.org/search/?c=License+%3A%3A+OSI+Approved+%3A%3A+Apache+Software+License)
- **Programming Language**  - [Python :: 3](https://pypi.org/search/?c=Programming+Language+%3A%3A+Python+%3A%3A+3)
- **Topic**  - [Scientific/Engineering :: Artificial Intelligence](https://pypi.org/search/?c=Topic+%3A%3A+Scientific%2FEngineering+%3A%3A+Artificial+Intelligence)

[Report project as malware](https://pypi.org/project/olmocr/submit-malware-report/)

## Project description

![olmocr-2-full@2x](https://pypi-camo.freetls.fastly.net/45bbac40a4ab79b921725e5003b48feaa598a34c/68747470733a2f2f6769746875622e636f6d2f757365722d6174746163686d656e74732f6173736574732f32346631623539362d343035392d343666312d383133302d356437326463633062303265)

* * *

[![GitHub License](https://pypi-camo.freetls.fastly.net/699e7e346068603187778459131a52aa1c491222/68747470733a2f2f696d672e736869656c64732e696f2f6769746875622f6c6963656e73652f616c6c656e61692f4f4c4d6f)](https://github.com/allenai/OLMo/blob/main/LICENSE)[![GitHub release](https://pypi-camo.freetls.fastly.net/1921cb71d696c28037d3790f6c6cc80e868aca87/68747470733a2f2f696d672e736869656c64732e696f2f6769746875622f72656c656173652f616c6c656e61692f6f6c6d6f63722e737667)](https://github.com/allenai/olmocr/releases)[![Tech Report v1](https://pypi-camo.freetls.fastly.net/f8ddd7d3a446f524d5e5cbe7b5330806c8764d57/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f50617065725f76312d6f6c6d4f43522d626c7565)](https://arxiv.org/abs/2502.18443)[![Tech Report v2](https://pypi-camo.freetls.fastly.net/f38f6e67e65a46e7b038f6416369ef4f38852946/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f50617065725f76322d6f6c6d4f43522d626c7565)](https://arxiv.org/abs/2510.19817)[![Demo](https://pypi-camo.freetls.fastly.net/f866eaafb873e9e30e9c910c8c0f9f545fcf12e0/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4169322d44656d6f2d463035323943)](https://olmocr.allenai.org/)[![Discord](https://pypi-camo.freetls.fastly.net/a1f4f7ca938b7f0ab114c7a4c6a45bd96cb8c851/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f446973636f72642532302d253230626c75653f7374796c653d666c6174266c6f676f3d646973636f7264266c6162656c3d41693226636f6c6f723d253233354236354539)](https://discord.gg/sZq3jTNVNG)

A toolkit for converting PDFs and other image-based document formats into clean, readable, plain text format.

Try the online demo: [https://olmocr.allenai.org/](https://olmocr.allenai.org/)

Features:

- Convert PDF, PNG, and JPEG based documents into clean Markdown
- Support for equations, tables, handwriting, and complex formatting
- Automatically removes headers and footers
- Convert into text with a natural reading order, even in the presence of
figures, multi-column layouts, and insets
- Efficient, less than $200 USD per million pages converted
- (Based on a 7B parameter VLM, so it requires a GPU)

### News

- October 21, 2025 - v0.4.0 - [New model release](https://huggingface.co/allenai/olmOCR-2-7B-1025-FP8), boosts olmOCR-bench score by ~4 points using synthetic data and introduces RL training.
- August 13, 2025 - v0.3.0 - [New model release](https://huggingface.co/allenai/olmOCR-7B-0825-FP8), fixes auto-rotation detection, and hallucinations on blank documents.
- July 24, 2025 - v0.2.1 - [New model release](https://huggingface.co/allenai/olmOCR-7B-0725-FP8), scores 3 points higher on [olmOCR-Bench](https://github.com/allenai/olmocr/tree/main/olmocr/bench), also runs significantly faster because it's default FP8, and needs much fewer retries per document.
- July 23, 2025 - v0.2.0 - New cleaned up [trainer code](https://github.com/allenai/olmocr/tree/main/olmocr/train), makes it much simpler to train olmOCR models yourself.
- June 17, 2025 - v0.1.75 - Switch from sglang to vllm based inference pipeline, updated docker image to CUDA 12.8.
- May 23, 2025 - v0.1.70 - Official docker support and images are now available! [See Docker usage](https://pypi.org/project/olmocr/#using-docker)
- May 19, 2025 - v0.1.68 - [olmOCR-Bench](https://github.com/allenai/olmocr/tree/main/olmocr/bench) launch, scoring 77.4. Launch includes 2 point performance boost in olmOCR pipeline due to bug fixes with prompts.
- Mar 17, 2025 - v0.1.60 - Performance improvements due to better temperature selection in sampling.
- Feb 25, 2025 - v0.1.58 - Initial public launch and demo.

### Benchmark

[**olmOCR-Bench**](https://github.com/allenai/olmocr/tree/main/olmocr/bench):
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

### Installation

#### System Dependencies

You will need to install poppler-utils and additional fonts for rendering PDF images.

Install dependencies (Ubuntu/Debian):

```
sudo apt-get update
sudo apt-get install poppler-utils ttf-mscorefonts-installer msttcorefonts fonts-crosextra-caladea fonts-crosextra-carlito gsfonts lcdf-typetools
```

#### Python Installation

Set up a conda environment and install olmocr. The requirements for running olmOCR
are difficult to install in an existing python environment, so please do make a clean python environment to install into.

```
conda create -n olmocr python=3.11
conda activate olmocr
```

Choose the installation option that matches your use case:

**Option 1: Remote Inference (Lightweight)**

If you plan to use a remote vLLM server with the `--server` flag, install the base package:

```
pip install olmocr
```

This avoids installing heavy GPU dependencies like PyTorch (~2GB+).

**Option 2: Local GPU Inference**

Requirements:

- Recent NVIDIA GPU (tested on RTX 4090, L40S, A100, H100) with at least 12 GB of GPU RAM
- 30GB of free disk space

For running inference with your own GPU:

```
pip install olmocr[gpu] --extra-index-url https://download.pytorch.org/whl/cu128

# Recommended: Install flash infer for faster inference on GPU
pip install https://download.pytorch.org/whl/cu128/flashinfer/flashinfer_python-0.2.5%2Bcu128torch2.7-cp38-abi3-linux_x86_64.whl
```

**Option 3: Beaker Cluster Execution**

For submitting jobs to Beaker clusters with the `--beaker` flag:

```
pip install olmocr[beaker]
```

**Option 4: Benchmark Suite**

For running the olmOCR benchmark suite:

```
pip install olmocr[bench]
```

**Combined Installation**

You can combine multiple options:

```
# GPU + Beaker support
pip install olmocr[gpu,beaker] --extra-index-url https://download.pytorch.org/whl/cu128

# GPU + Benchmark support
pip install olmocr[gpu,bench] --extra-index-url https://download.pytorch.org/whl/cu128
```

**Troubleshooting**

If you run into errors about `too many open files`, update your ulimit:

```
ulimit -n 65536
```

### Usage Examples

For quick testing, try the [web demo](https://olmocr.allen.ai/).

**Convert a Single PDF (Local GPU):**

```
# Download a sample PDF
curl -o olmocr-sample.pdf https://olmocr.allenai.org/papers/olmocr_3pg_sample.pdf

# Convert it to markdown
olmocr ./localworkspace --markdown --pdfs olmocr-sample.pdf
```

**Convert an Image file:**

```
olmocr ./localworkspace --markdown --pdfs random_page.png
```

**Convert Multiple PDFs:**

```
olmocr ./localworkspace --markdown --pdfs tests/gnarly_pdfs/*.pdf
```

**Use Remote Inference Server:**

```
olmocr ./localworkspace --server http://remote-server:8000/v1 --model allenai/olmOCR-2-7B-1025-FP8 --markdown --pdfs *.pdf
```

With the `--markdown` flag, results will be stored as markdown files inside of `./localworkspace/markdown/`.

> **Note:** You can also use `python -m olmocr.pipeline` instead of `olmocr` if you prefer.

#### Viewing Results

The `./localworkspace/` workspace folder will then have both [Dolma](https://github.com/allenai/dolma) and markdown files (if using `--markdown`).

```
cat localworkspace/markdown/olmocr-sample.md
```

```
olmOCR: Unlocking Trillions of Tokens in PDFs with Vision Language Models
...
```

### Using an Inference Provider or External Server

If you have a vLLM server already running elsewhere (or any inference platform implementing the OpenAI API), you can point olmOCR to use it instead of spawning a local instance.

**Installation for Remote Inference:**

```
# Lightweight installation - no GPU dependencies needed
pip install olmocr
```

**Using an External Server:**

```
# Use external vLLM server instead of local one
olmocr ./localworkspace --server http://remote-server:8000/v1 --model allenai/olmOCR-2-7B-1025-FP8 --markdown --pdfs tests/gnarly_pdfs/*.pdf
```

The served model name in vLLM needs to match the value provided in `--model`.

**Example vLLM Server Launch:**

```
vllm serve allenai/olmOCR-2-7B-1025-FP8 --max-model-len 16384
```

#### Verified External Providers

We have tested `olmOCR-2-7B-1025-FP8` on these external model providers and confirmed that they work

|  | $/1M Input tokens | $/1M Output tokens | Example Command |
| --- | --- | --- | --- |
| [Cirrascale](https://ai2endpoints.cirrascale.ai/models/overview) | $0.07 | $0.15 | `olmocr ./workspace --server https://ai2endpoints.cirrascale.ai/api --api_key sk-XXXXXXX --workers 1 --max_concurrent_requests 20 --model olmOCR-2-7B-1025 --pdfs tests/gnarly_pdfs/*.pdf` |
| [DeepInfra](https://deepinfra.com/) | $0.09 | $0.19 | `olmocr ./workspace --server https://api.deepinfra.com/v1/openai --api_key DfXXXXXXX --workers 1 --max_concurrent_requests 20 --model allenai/olmOCR-2-7B-1025 --pdfs tests/gnarly_pdfs/*.pdf` |
| [Parasail](https://www.saas.parasail.io/serverless?name=olmocr-7b-1025-fp8) | $0.10 | $0.20 | `olmocr ./workspace --server https://api.parasail.io/v1 --api_key psk-XXXXX --workers 1 --max_concurrent_requests 20 --model allenai/olmOCR-2-7B-1025 --pdfs tests/gnarly_pdfs/*.pdf` |

Notes on arguments

- `--server`: Defines the OpenAI-compatible endpoint: ex `https://api.deepinfra.com/v1/openai`
- `--api_key`: Your API key, bassed in via Authorization Bearer HTTP header
- `--max_concurrent_requests`: Max concurrent requests that will be in-flight to the inference provider at one time
- `--workers`: Max number of page groups that will be processed at once. You may want to set this to `1` so that you finish one group of stuff before moving on.
- `--pages_per_group`: You may want a smaller number of pages per group as many external provides have lower concurrent request limits
- `--model`: The model identifier, ex. `allenai/olmOCR-2-7B-1025`, different providers have different names, and if you run locally, you can use `olmocr`
- Other arguments work the same as with local inference

### Multi-node / Cluster Usage

If you want to convert millions of PDFs using multiple nodes running in parallel, olmOCR supports
reading PDFs from AWS S3 and coordinating work using an AWS S3 output bucket.

**Start the first worker node:**

```
olmocr s3://my_s3_bucket/pdfworkspaces/exampleworkspace --pdfs s3://my_s3_bucket/jakep/gnarly_pdfs/*.pdf
```

This sets up a simple work queue in your AWS bucket and starts converting PDFs.

**On subsequent worker nodes:**

```
olmocr s3://my_s3_bucket/pdfworkspaces/exampleworkspace
```

They will automatically start grabbing items from the same workspace queue.

#### Using Beaker for Cluster Execution

If you are at Ai2 and want to linearize millions of PDFs efficiently using [beaker](https://www.beaker.org/), install with Beaker support:

```
pip install olmocr[gpu,beaker] --extra-index-url https://download.pytorch.org/whl/cu128
```

Then use the `--beaker` flag to prepare the workspace locally and launch N GPU workers in the cluster:

```
olmocr s3://my_s3_bucket/pdfworkspaces/exampleworkspace --pdfs s3://my_s3_bucket/jakep/gnarly_pdfs/*.pdf --beaker --beaker_gpus 4
```

### Using Docker

Pull the Docker image (large, includes the model, ~30GB):

```
docker pull alleninstituteforai/olmocr:latest-with-model
```

For advanced users who want to manage their own model downloads, we also provide a base image without the model:

```
docker pull alleninstituteforai/olmocr:latest
```

#### Quick Start - Process PDFs

Process a single PDF in your current directory:

```
docker run --gpus all \
  -v $(pwd):/workspace \
  alleninstituteforai/olmocr:latest-with-model \
  -c "olmocr /workspace/output --markdown --pdfs /workspace/sample.pdf"
```

Process multiple PDFs:

```
docker run --gpus all \
  -v /path/to/pdfs:/input \
  -v /path/to/output:/output \
  alleninstituteforai/olmocr:latest-with-model \
  -c "olmocr /output --markdown --pdfs /input/*.pdf"
```

#### Interactive Mode

Run the container interactively for exploration and debugging:

```
docker run -it --gpus all alleninstituteforai/olmocr:latest-with-model
```

> Visit our Docker repository on [Docker Hub](https://hub.docker.com/r/alleninstituteforai/olmocr) for more information.

### Full Documentation

To see all available options:

```
olmocr --help
usage: pipeline.py [-h] [--pdfs [PDFS ...]] [--model MODEL] [--workspace_profile WORKSPACE_PROFILE] [--pdf_profile PDF_PROFILE] [--pages_per_group PAGES_PER_GROUP] [--max_page_retries MAX_PAGE_RETRIES] [--max_page_error_rate MAX_PAGE_ERROR_RATE] [--workers WORKERS]
                   [--apply_filter] [--stats] [--markdown] [--target_longest_image_dim TARGET_LONGEST_IMAGE_DIM] [--target_anchor_text_len TARGET_ANCHOR_TEXT_LEN] [--guided_decoding] [--gpu-memory-utilization GPU_MEMORY_UTILIZATION] [--max_model_len MAX_MODEL_LEN]
                   [--tensor-parallel-size TENSOR_PARALLEL_SIZE] [--data-parallel-size DATA_PARALLEL_SIZE] [--port PORT] [--server SERVER] [--beaker] [--beaker_workspace BEAKER_WORKSPACE] [--beaker_cluster BEAKER_CLUSTER] [--beaker_gpus BEAKER_GPUS] [--beaker_priority BEAKER_PRIORITY]
                   workspace

Manager for running millions of PDFs through a batch inference pipeline

positional arguments:
  workspace             The filesystem path where work will be stored, can be a local folder, or an s3 path if coordinating work with many workers, s3://bucket/prefix/

options:
  -h, --help            show this help message and exit
  --pdfs [PDFS ...]     Path to add pdfs stored in s3 to the workspace, can be a glob path s3://bucket/prefix/*.pdf or path to file containing list of pdf paths
  --model MODEL         Path where the model is located, allenai/olmOCR-7B-0725-FP8 is the default, can be local, s3, or hugging face.
  --workspace_profile WORKSPACE_PROFILE
                        S3 configuration profile for accessing the workspace
  --pdf_profile PDF_PROFILE
                        S3 configuration profile for accessing the raw pdf documents
  --pages_per_group PAGES_PER_GROUP
                        Aiming for this many pdf pages per work item group
  --max_page_retries MAX_PAGE_RETRIES
                        Max number of times we will retry rendering a page
  --max_page_error_rate MAX_PAGE_ERROR_RATE
                        Rate of allowable failed pages in a document, 1/250 by default
  --workers WORKERS     Number of workers to run at a time
  --apply_filter        Apply basic filtering to English pdfs which are not forms, and not likely seo spam
  --stats               Instead of running any job, reports some statistics about the current workspace
  --markdown            Also write natural text to markdown files preserving the folder structure of the input pdfs
  --target_longest_image_dim TARGET_LONGEST_IMAGE_DIM
                        Dimension on longest side to use for rendering the pdf pages
  --target_anchor_text_len TARGET_ANCHOR_TEXT_LEN
                        Maximum amount of anchor text to use (characters), not used for new models
  --guided_decoding     Enable guided decoding for model YAML type outputs

VLLM arguments:
  --gpu-memory-utilization GPU_MEMORY_UTILIZATION
                        Fraction of VRAM vLLM may pre-allocate for KV-cache (passed through to vllm serve).
  --max_model_len MAX_MODEL_LEN
                        Upper bound (tokens) vLLM will allocate KV-cache for, lower if VLLM won't start
  --tensor-parallel-size TENSOR_PARALLEL_SIZE, -tp TENSOR_PARALLEL_SIZE
                        Tensor parallel size for vLLM
  --data-parallel-size DATA_PARALLEL_SIZE, -dp DATA_PARALLEL_SIZE
                        Data parallel size for vLLM
  --port PORT           Port to use for the VLLM server
  --server SERVER       URL of external vLLM (or other compatible provider)
                        server (e.g., http://hostname:port). If provided,
                        skips spawning local vLLM instance

beaker/cluster execution:
  --beaker              Submit this job to beaker instead of running locally
  --beaker_workspace BEAKER_WORKSPACE
                        Beaker workspace to submit to
  --beaker_cluster BEAKER_CLUSTER
                        Beaker clusters you want to run on
  --beaker_gpus BEAKER_GPUS
                        Number of gpu replicas to run
  --beaker_priority BEAKER_PRIORITY
                        Beaker priority level for the job
```

## Code overview

There are some nice reusable pieces of the code that may be useful for your own projects:

- A prompting strategy to get really good natural text parsing using ChatGPT 4o - [buildsilver.py](https://github.com/allenai/olmocr/blob/main/olmocr/data/buildsilver.py)
- Basic filtering by language and SEO spam removal - [filter.py](https://github.com/allenai/olmocr/blob/main/olmocr/filter/filter.py)
- SFT Finetuning code for Qwen2.5-VL - [train.py](https://github.com/allenai/olmocr/blob/main/olmocr/train/train.py)
- GRPO RL Trainer - [grpo\_train.py](https://github.com/allenai/olmocr/blob/main/olmocr/train/grpo_train.py)
- Synthetic data generation - [mine\_html\_templates.py](https://github.com/allenai/olmocr/blob/main/olmocr/bench/synth/mine_html_templates.py)
- Processing millions of PDFs through a finetuned model using VLLM - [pipeline.py](https://github.com/allenai/olmocr/blob/main/olmocr/pipeline.py)
- Viewing [Dolma docs](https://github.com/allenai/dolma) created from PDFs - [dolmaviewer.py](https://github.com/allenai/olmocr/blob/main/olmocr/viewer/dolmaviewer.py)

## Team

**olmOCR** is developed and maintained by the AllenNLP team, backed by [the Allen Institute for Artificial Intelligence (AI2)](https://allenai.org/).
AI2 is a non-profit institute with the mission to contribute to humanity through high-impact AI research and engineering.
To learn more about who specifically contributed to this codebase, see [our contributors](https://github.com/allenai/olmocr/graphs/contributors) page.

## License

**olmOCR** is licensed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0).
A full copy of the license can be found [on GitHub](https://github.com/allenai/olmocr/blob/main/LICENSE).

## Citing

For olmOCR v1 and OlmOCR-bench:

```
@misc{olmocrbench,
      title={{olmOCR: Unlocking Trillions of Tokens in PDFs with Vision Language Models}},
      author={Jake Poznanski and Jon Borchardt and Jason Dunkelberger and Regan Huff and Daniel Lin and Aman Rangapur and Christopher Wilhelm and Kyle Lo and Luca Soldaini},
      year={2025},
      eprint={2502.18443},
      archivePrefix={arXiv},
      primaryClass={cs.CL},
      url={https://arxiv.org/abs/2502.18443},
}
```

For olmOCR v2 Unit Testing Rewards with RL:

```
@misc{olmocr2,
      title={olmOCR 2: Unit Test Rewards for Document OCR},
      author={Jake Poznanski and Luca Soldaini and Kyle Lo},
      year={2025},
      eprint={2510.19817},
      archivePrefix={arXiv},
      primaryClass={cs.CV},
      url={https://arxiv.org/abs/2510.19817},
}
```

## Project details

### Verified details

_These details have been [verified by PyPI](https://docs.pypi.org/project_metadata/#verified-details)_

###### Maintainers

[![Avatar for jakep-allenai from gravatar.com](https://pypi-camo.freetls.fastly.net/cfa1a27fa76a75cda63a2bd9b18adeccf2e59693/68747470733a2f2f7365637572652e67726176617461722e636f6d2f6176617461722f32376234623964663839366233353835363061336164353465326332343132393f73697a653d3530)jakep-allenai](https://pypi.org/user/jakep-allenai/)

### Unverified details

_These details have **not** been verified by PyPI_

###### Project links

- [Changelog](https://github.com/allenai/olmocr/blob/main/CHANGELOG.md)
- [Homepage](https://github.com/allenai/olmocr)
- [Repository](https://github.com/allenai/olmocr)

###### Meta

- **License:** Apache Software License (Apache License)

- **Author:** [Allen Institute for Artificial Intelligence](mailto:jakep@allenai.org)
- **Requires:** Python >=3.11

- **Provides-Extra:**`gpu`
, `beaker`
, `dev`
, `bench`
, `train`
, `elo`

###### Classifiers

- **Development Status**  - [3 - Alpha](https://pypi.org/search/?c=Development+Status+%3A%3A+3+-+Alpha)
- **Intended Audience**  - [Science/Research](https://pypi.org/search/?c=Intended+Audience+%3A%3A+Science%2FResearch)
- **License**  - [OSI Approved :: Apache Software License](https://pypi.org/search/?c=License+%3A%3A+OSI+Approved+%3A%3A+Apache+Software+License)
- **Programming Language**  - [Python :: 3](https://pypi.org/search/?c=Programming+Language+%3A%3A+Python+%3A%3A+3)
- **Topic**  - [Scientific/Engineering :: Artificial Intelligence](https://pypi.org/search/?c=Topic+%3A%3A+Scientific%2FEngineering+%3A%3A+Artificial+Intelligence)

## Release history[Release notifications](https://pypi.org/help/\#project-release-notifications) \|  [RSS feed](https://pypi.org/rss/project/olmocr/releases.xml)

This version

![](https://pypi.org/static/images/blue-cube.572a5bfb.svg)

[0.4.27\\
\\
\\
Mar 12, 2026](https://pypi.org/project/olmocr/0.4.27/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.25\\
\\
\\
Jan 24, 2026](https://pypi.org/project/olmocr/0.4.25/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.24\\
\\
\\
Jan 23, 2026](https://pypi.org/project/olmocr/0.4.24/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.21\\
\\
\\
Jan 23, 2026](https://pypi.org/project/olmocr/0.4.21/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.20\\
\\
\\
Jan 20, 2026](https://pypi.org/project/olmocr/0.4.20/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.19\\
\\
\\
Jan 20, 2026](https://pypi.org/project/olmocr/0.4.19/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.18\\
\\
\\
Jan 20, 2026](https://pypi.org/project/olmocr/0.4.18/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.16\\
\\
\\
Jan 12, 2026](https://pypi.org/project/olmocr/0.4.16/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.15\\
\\
\\
Jan 9, 2026](https://pypi.org/project/olmocr/0.4.15/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.14\\
\\
\\
Jan 8, 2026](https://pypi.org/project/olmocr/0.4.14/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.12\\
\\
\\
Dec 10, 2025](https://pypi.org/project/olmocr/0.4.12/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.11\\
\\
\\
Dec 10, 2025](https://pypi.org/project/olmocr/0.4.11/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.10\\
\\
\\
Dec 9, 2025](https://pypi.org/project/olmocr/0.4.10/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.9\\
\\
\\
Dec 9, 2025](https://pypi.org/project/olmocr/0.4.9/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.7\\
\\
\\
Dec 1, 2025](https://pypi.org/project/olmocr/0.4.7/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.6\\
\\
\\
Nov 17, 2025](https://pypi.org/project/olmocr/0.4.6/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.5\\
\\
\\
Nov 14, 2025](https://pypi.org/project/olmocr/0.4.5/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.4\\
\\
\\
Nov 4, 2025](https://pypi.org/project/olmocr/0.4.4/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.3\\
\\
\\
Oct 31, 2025](https://pypi.org/project/olmocr/0.4.3/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.4.2\\
\\
\\
Oct 22, 2025](https://pypi.org/project/olmocr/0.4.2/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.3.9\\
\\
\\
Oct 7, 2025](https://pypi.org/project/olmocr/0.3.9/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.3.8\\
\\
\\
Oct 6, 2025](https://pypi.org/project/olmocr/0.3.8/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.3.6\\
\\
\\
Sep 29, 2025](https://pypi.org/project/olmocr/0.3.6/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.3.4\\
\\
\\
Aug 30, 2025](https://pypi.org/project/olmocr/0.3.4/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.3.3\\
\\
\\
Aug 15, 2025](https://pypi.org/project/olmocr/0.3.3/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.3.2\\
\\
\\
Aug 14, 2025](https://pypi.org/project/olmocr/0.3.2/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.3.1\\
\\
\\
Aug 14, 2025](https://pypi.org/project/olmocr/0.3.1/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.3.0\\
\\
\\
Aug 13, 2025](https://pypi.org/project/olmocr/0.3.0/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.2.3\\
\\
\\
Aug 4, 2025](https://pypi.org/project/olmocr/0.2.3/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.2.2\\
\\
\\
Aug 4, 2025](https://pypi.org/project/olmocr/0.2.2/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.2.1\\
\\
\\
Jul 23, 2025](https://pypi.org/project/olmocr/0.2.1/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.2.0\\
\\
\\
Jul 23, 2025](https://pypi.org/project/olmocr/0.2.0/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.76\\
\\
\\
Jun 23, 2025](https://pypi.org/project/olmocr/0.1.76/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.75\\
\\
\\
Jun 17, 2025](https://pypi.org/project/olmocr/0.1.75/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.74\\
\\
\\
Jun 17, 2025](https://pypi.org/project/olmocr/0.1.74/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.73\\
\\
\\
Jun 17, 2025](https://pypi.org/project/olmocr/0.1.73/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.72\\
\\
\\
Jun 17, 2025](https://pypi.org/project/olmocr/0.1.72/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.71\\
\\
\\
May 30, 2025](https://pypi.org/project/olmocr/0.1.71/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.70\\
\\
\\
May 23, 2025](https://pypi.org/project/olmocr/0.1.70/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.69\\
\\
\\
May 20, 2025](https://pypi.org/project/olmocr/0.1.69/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.68\\
\\
\\
May 19, 2025](https://pypi.org/project/olmocr/0.1.68/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.60\\
\\
\\
Mar 17, 2025](https://pypi.org/project/olmocr/0.1.60/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.58\\
\\
\\
Feb 14, 2025](https://pypi.org/project/olmocr/0.1.58/)

![](https://pypi.org/static/images/white-cube.2351a86c.svg)

[0.1.53\\
\\
\\
Feb 14, 2025](https://pypi.org/project/olmocr/0.1.53/)

## Download files

Download the file for your platform. If you're not sure which to choose, learn more about [installing packages](https://packaging.python.org/tutorials/installing-packages/ "External link").

### Source Distribution

[olmocr-0.4.27.tar.gz](https://files.pythonhosted.org/packages/d0/2c/85d7a6c032cbad5a5d25178618a2704225fcfd692340c9d88ab1d14705fc/olmocr-0.4.27.tar.gz)
(410.4 kB
[view details](https://pypi.org/project/olmocr/#olmocr-0.4.27.tar.gz))


Uploaded Mar 12, 2026`Source`

### Built Distribution

Filter files by name, interpreter, ABI, and platform.

If you're not sure about the file name format, learn more about [wheel file names](https://packaging.python.org/en/latest/specifications/binary-distribution-format/ "External link").

Copy a direct link to the current filters [https://pypi.org/project/olmocr/#files](https://pypi.org/project/olmocr/#files)
Copy

Showing 1 of 1 file.

File name

InterpreterInterpreterpy3

ABIABInone

PlatformPlatformany

[olmocr-0.4.27-py3-none-any.whl](https://files.pythonhosted.org/packages/06/5c/41b86d46c037dc5bc1fceaa5843c8029ebc54c6713afe4a9e10c163c4cc1/olmocr-0.4.27-py3-none-any.whl)
(423.4 kB
[view details](https://pypi.org/project/olmocr/#olmocr-0.4.27-py3-none-any.whl))


Uploaded Mar 12, 2026`Python 3`

## File details

Details for the file `olmocr-0.4.27.tar.gz`.


### File metadata

- Download URL: [olmocr-0.4.27.tar.gz](https://files.pythonhosted.org/packages/d0/2c/85d7a6c032cbad5a5d25178618a2704225fcfd692340c9d88ab1d14705fc/olmocr-0.4.27.tar.gz)
- Upload date: Mar 12, 2026
- Size: 410.4 kB
- Tags: Source
- Uploaded using Trusted Publishing? No
- Uploaded via: twine/6.2.0 CPython/3.11.14

### File hashes

| Algorithm | Hash digest |  |
| --- | --- | --- |
| SHA256 | `7da74f37a3e987f966765503c59913c2268289c9ecb14b4c5f40c89a0e8e5393` | Copy |
| MD5 | `c9f0fcdfb31c85cff39487ce64f6f58e` | Copy |
| BLAKE2b-256 | `d02c85d7a6c032cbad5a5d25178618a2704225fcfd692340c9d88ab1d14705fc` | Copy |

Hashes for olmocr-0.4.27.tar.gz

[See more details on using hashes here.](https://pip.pypa.io/en/stable/topics/secure-installs/#hash-checking-mode "External link")

## File details

Details for the file `olmocr-0.4.27-py3-none-any.whl`.


### File metadata

- Download URL: [olmocr-0.4.27-py3-none-any.whl](https://files.pythonhosted.org/packages/06/5c/41b86d46c037dc5bc1fceaa5843c8029ebc54c6713afe4a9e10c163c4cc1/olmocr-0.4.27-py3-none-any.whl)
- Upload date: Mar 12, 2026
- Size: 423.4 kB
- Tags: Python 3
- Uploaded using Trusted Publishing? No
- Uploaded via: twine/6.2.0 CPython/3.11.14

### File hashes

| Algorithm | Hash digest |  |
| --- | --- | --- |
| SHA256 | `4c54b77d1e5dd487bcd60be26728dc07aa74f7fb3947bae4c697776bd500f480` | Copy |
| MD5 | `d19a13fe20c46cc82c08b4f40858c969` | Copy |
| BLAKE2b-256 | `065c41b86d46c037dc5bc1fceaa5843c8029ebc54c6713afe4a9e10c163c4cc1` | Copy |

Hashes for olmocr-0.4.27-py3-none-any.whl

[See more details on using hashes here.](https://pip.pypa.io/en/stable/topics/secure-installs/#hash-checking-mode "External link")

- English
- español
- français
- 日本語
- português (Brasil)
- українська
- Ελληνικά
- Deutsch
- 中文 (简体)
- 中文 (繁體)
- русский
- עברית
- Esperanto
- 한국어

Supported by

[![](https://pypi-camo.freetls.fastly.net/ed7074cadad1a06f56bc520ad9bd3e00d0704c5b/68747470733a2f2f73746f726167652e676f6f676c65617069732e636f6d2f707970692d6173736574732f73706f6e736f726c6f676f732f6177732d77686974652d6c6f676f2d7443615473387a432e706e67)AWS\\
Cloud computing and Security Sponsor](https://aws.amazon.com/) [![](https://pypi-camo.freetls.fastly.net/8855f7c063a3bdb5b0ce8d91bfc50cf851cc5c51/68747470733a2f2f73746f726167652e676f6f676c65617069732e636f6d2f707970692d6173736574732f73706f6e736f726c6f676f732f64617461646f672d77686974652d6c6f676f2d6668644c4e666c6f2e706e67)Datadog\\
Monitoring](https://www.datadoghq.com/) [![](https://pypi-camo.freetls.fastly.net/60f709d24f3e4d469f9adc77c65e2f5291a3d165/68747470733a2f2f73746f726167652e676f6f676c65617069732e636f6d2f707970692d6173736574732f73706f6e736f726c6f676f732f6465706f742d77686974652d6c6f676f2d7038506f476831302e706e67)Depot\\
Continuous Integration](https://depot.dev/) [![](https://pypi-camo.freetls.fastly.net/df6fe8829cbff2d7f668d98571df1fd011f36192/68747470733a2f2f73746f726167652e676f6f676c65617069732e636f6d2f707970692d6173736574732f73706f6e736f726c6f676f732f666173746c792d77686974652d6c6f676f2d65684d3077735f6f2e706e67)Fastly\\
CDN](https://www.fastly.com/) [![](https://pypi-camo.freetls.fastly.net/420cc8cf360bac879e24c923b2f50ba7d1314fb0/68747470733a2f2f73746f726167652e676f6f676c65617069732e636f6d2f707970692d6173736574732f73706f6e736f726c6f676f732f676f6f676c652d77686974652d6c6f676f2d616734424e3774332e706e67)Google\\
Download Analytics](https://careers.google.com/) [![](https://pypi-camo.freetls.fastly.net/d01053c02f3a626b73ffcb06b96367fdbbf9e230/68747470733a2f2f73746f726167652e676f6f676c65617069732e636f6d2f707970692d6173736574732f73706f6e736f726c6f676f732f70696e67646f6d2d77686974652d6c6f676f2d67355831547546362e706e67)Pingdom\\
Monitoring](https://www.pingdom.com/) [![](https://pypi-camo.freetls.fastly.net/67af7117035e2345bacb5a82e9aa8b5b3e70701d/68747470733a2f2f73746f726167652e676f6f676c65617069732e636f6d2f707970692d6173736574732f73706f6e736f726c6f676f732f73656e7472792d77686974652d6c6f676f2d4a2d6b64742d706e2e706e67)Sentry\\
Error logging](https://sentry.io/for/python/?utm_source=pypi&utm_medium=paid-community&utm_campaign=python-na-evergreen&utm_content=static-ad-pypi-sponsor-learnmore) [![](https://pypi-camo.freetls.fastly.net/b611884ff90435a0575dbab7d9b0d3e60f136466/68747470733a2f2f73746f726167652e676f6f676c65617069732e636f6d2f707970692d6173736574732f73706f6e736f726c6f676f732f737461747573706167652d77686974652d6c6f676f2d5467476c6a4a2d502e706e67)StatusPage\\
Status page](https://statuspage.io/)