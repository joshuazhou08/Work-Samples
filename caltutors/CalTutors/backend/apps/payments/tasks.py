from celery import shared_task
import subprocess
import os
from pathlib import Path
from django.conf import settings

@shared_task
def run_go_charger():
    project_root = settings.PROJECT_ROOT

    charger_path = project_root / "automation" / "bin" / "charger"

    if not charger_path.exists():
        raise FileNotFoundError(f"Charger binary not found at: {charger_path}")

    result = subprocess.run(
        [str(charger_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    return {
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }