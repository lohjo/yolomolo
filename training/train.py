"""Fine-tune olmOCR-2-7B on math OCR data using QLoRA.

Usage:
    python -m training.train
    python -m training.train --epochs 5 --lr 1e-4 --max-samples 1000
    python -m training.train --dataset allenai/olmocr-bench --output ./my-checkpoints

Requirements:
    pip install transformers peft bitsandbytes accelerate datasets trl
    GPU with 24GB+ VRAM recommended (QLoRA enables training on 12GB with smaller batch)
"""

import argparse
import logging
import os

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoProcessor,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

from config import TrainingConfig
from dataset import build_training_dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def load_model_and_processor(cfg: TrainingConfig):
    logger.info("Loading model %s with 4-bit quantization...", cfg.model_name)

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=cfg.load_in_4bit,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16 if cfg.fp16 else torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )

    model = AutoModelForCausalLM.from_pretrained(
        cfg.model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )

    processor = AutoProcessor.from_pretrained(cfg.model_name, trust_remote_code=True)

    model = prepare_model_for_kbit_training(model)

    lora_config = LoraConfig(
        r=cfg.lora_r,
        lora_alpha=cfg.lora_alpha,
        lora_dropout=cfg.lora_dropout,
        target_modules=cfg.lora_target_modules,
        bias="none",
        task_type="CAUSAL_LM",
    )

    model = get_peft_model(model, lora_config)
    trainable, total = model.get_nb_trainable_parameters()
    logger.info("Trainable params: %s / %s (%.2f%%)", f"{trainable:,}", f"{total:,}", 100 * trainable / total)

    return model, processor


def train(cfg: TrainingConfig, max_samples=None):
    model, processor = load_model_and_processor(cfg)

    dataset = build_training_dataset(
        cfg.dataset_name,
        split="train",
        processor=processor,
        max_samples=max_samples,
    )

    training_args = TrainingArguments(
        output_dir=cfg.output_dir,
        num_train_epochs=cfg.num_epochs,
        per_device_train_batch_size=cfg.per_device_batch_size,
        gradient_accumulation_steps=cfg.gradient_accumulation_steps,
        learning_rate=cfg.learning_rate,
        warmup_ratio=cfg.warmup_ratio,
        weight_decay=cfg.weight_decay,
        fp16=cfg.fp16,
        bf16=cfg.bf16,
        save_strategy=cfg.save_strategy,
        logging_steps=cfg.logging_steps,
        seed=cfg.seed,
        optim="paged_adamw_8bit",
        report_to="none",
        remove_unused_columns=False,
        dataloader_pin_memory=False,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
    )

    logger.info("Starting training...")
    trainer.train()

    final_path = os.path.join(cfg.output_dir, "final")
    model.save_pretrained(final_path)
    processor.save_pretrained(final_path)
    logger.info("Model saved to %s", final_path)


def main():
    parser = argparse.ArgumentParser(description="Fine-tune olmOCR on math OCR data")
    parser.add_argument("--model", default=None, help="Model name/path")
    parser.add_argument("--dataset", default=None, help="Dataset name on HuggingFace")
    parser.add_argument("--output", default=None, help="Output directory")
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--lr", type=float, default=None)
    parser.add_argument("--batch-size", type=int, default=None)
    parser.add_argument("--max-samples", type=int, default=None, help="Limit training samples (for testing)")
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()

    cfg = TrainingConfig()
    if args.model:
        cfg.model_name = args.model
    if args.dataset:
        cfg.dataset_name = args.dataset
    if args.output:
        cfg.output_dir = args.output
    if args.epochs:
        cfg.num_epochs = args.epochs
    if args.lr:
        cfg.learning_rate = args.lr
    if args.batch_size:
        cfg.per_device_batch_size = args.batch_size
    if args.seed:
        cfg.seed = args.seed

    train(cfg, max_samples=args.max_samples)


if __name__ == "__main__":
    main()
