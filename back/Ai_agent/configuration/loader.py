import yaml
import os
from pathlib import Path
from functools import lru_cache

# Define the path to the configuration file
CONFIG_PATH = Path(__file__).parent / "config_llm.yaml"

@lru_cache()
def load_llm_config():
    """Load the LLM configuration from the YAML file."""
    if not CONFIG_PATH.exists():
        # Fallback if config file is missing
        return {
            "main_llm": {"model_name": "gpt-4o-mini", "temperature": 0},
            "tool_router_llm": {"model_name": "gpt-4o-mini", "temperature": 0},
            "category_selector_llm": {"model_name": "gpt-4o-mini", "temperature": 0},
            "moderation_llm": {"model_name": "gpt-4o-mini", "temperature": 0},
        }

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def get_llm_config(key: str):
    """Get a specific LLM configuration by key."""
    config = load_llm_config()
    return config.get(key, {"model_name": "gpt-4o-mini", "temperature": 0})
