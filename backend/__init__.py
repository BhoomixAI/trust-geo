"""TRUST-GEO Backend Package.

Geospatial AI Reliability and Crash-Testing Harness.
"""

__version__ = "0.2.0"

# Load local settings (e.g. ANTHROPIC_API_KEY) from a git-ignored .env file at the repo root.
# Real environment variables (such as those set on Render) take precedence.
try:
    from pathlib import Path as _Path

    from dotenv import load_dotenv as _load_dotenv

    _load_dotenv(_Path(__file__).resolve().parent.parent / ".env", override=False)
except ImportError:  # python-dotenv is optional
    pass
