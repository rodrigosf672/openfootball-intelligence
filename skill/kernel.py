"""OpenFootball Intelligence (OFI) -- Claude Science skill entry point.

Re-exports the metric library from the repo root so this skill and the
standalone `ofi.py` library can never drift out of sync. See SKILL.md for
the workflow and response format.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ofi import *  # noqa: F401,F403
