from dataclasses import dataclass, field


@dataclass
class TrainingConfig:
    model_name: str = "allenai/olmOCR-2-7B-1025"
    dataset_name: str = "allenai/olmocr-bench"
    output_dir: str = "./checkpoints"

    num_epochs: int = 3
    learning_rate: float = 2e-4
    per_device_batch_size: int = 2
    gradient_accumulation_steps: int = 8
    warmup_ratio: float = 0.05
    weight_decay: float = 0.01
    max_seq_length: int = 512

    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    lora_target_modules: list = field(
        default_factory=lambda: ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    )

    fp16: bool = True
    bf16: bool = False
    load_in_4bit: bool = True
    save_strategy: str = "epoch"
    logging_steps: int = 10
    seed: int = 42
