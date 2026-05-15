import logging
from datasets import load_dataset

logger = logging.getLogger(__name__)


def load_olmocr_dataset(dataset_name="allenai/olmocr-bench", split="train", max_samples=None):
    """Load olmOCR dataset from HuggingFace Hub.

    Returns dataset with columns: image, ground_truth
    """
    logger.info("Loading dataset %s (split=%s)...", dataset_name, split)
    ds = load_dataset(dataset_name, split=split)
    if max_samples:
        ds = ds.select(range(min(max_samples, len(ds))))
    logger.info("Loaded %d samples", len(ds))
    return ds


def format_for_vlm(example, processor):
    """Format a single example for VLM fine-tuning.

    Converts image + ground_truth into the chat format expected by
    Qwen2.5-VL-based models.
    """
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image"},
                {"type": "text", "text": "Extract all mathematical expressions from this image. Return only the LaTeX code."},
            ],
        },
        {
            "role": "assistant",
            "content": example.get("ground_truth", example.get("text", "")),
        },
    ]

    text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)
    image = example.get("image")

    inputs = processor(
        text=[text],
        images=[image] if image else None,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=512,
    )

    inputs["labels"] = inputs["input_ids"].clone()
    return {k: v.squeeze(0) for k, v in inputs.items()}


def build_training_dataset(dataset_name, split, processor, max_samples=None):
    ds = load_olmocr_dataset(dataset_name, split, max_samples)
    ds = ds.map(
        lambda ex: format_for_vlm(ex, processor),
        remove_columns=ds.column_names,
        desc="Formatting for VLM",
    )
    return ds
