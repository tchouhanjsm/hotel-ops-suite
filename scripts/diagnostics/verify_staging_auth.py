from __future__ import annotations

import os
import re
import subprocess
import sys

from pwdlib import PasswordHash
from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[2]
