"""
Structured Logging Setup
==========================
Configures Python's logging module with structured formatting.
Console + optional file output. Log level driven by settings.
"""

import logging
import sys
from typing import Optional

from backend.app.core.config import get_settings


def setup_logging(log_level: Optional[str] = None) -> logging.Logger:
    """
    Configure and return the application logger.
    
    Args:
        log_level: Override log level (DEBUG, INFO, WARNING, ERROR, CRITICAL).
                   Defaults to settings.LOG_LEVEL.
    
    Returns:
        Configured Logger instance.
    """
    settings = get_settings()
    level = getattr(logging, (log_level or settings.LOG_LEVEL).upper(), logging.INFO)

    # Create the root application logger
    logger = logging.getLogger("aio_crm")
    logger.setLevel(level)

    # Avoid duplicate handlers on re-initialization
    if logger.handlers:
        return logger

    # ── Console Handler ──────────────────────────────────────────
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)

    if settings.LOG_FORMAT == "json":
        formatter = logging.Formatter(
            '{"time": "%(asctime)s", "level": "%(levelname)s", '
            '"module": "%(name)s", "message": "%(message)s"}',
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
    else:
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger


def get_logger(name: str = "aio_crm") -> logging.Logger:
    """
    Get a child logger with the given name.
    
    Usage:
        logger = get_logger("auth")
        logger.info("User logged in")
    """
    return logging.getLogger(f"aio_crm.{name}")
