from __future__ import annotations

import sys
from pathlib import Path

# Add project root to sys.path so we can import scripts
sys.path.append(str(Path(__file__).parent.parent))

from scripts.sync_scan_profiles_doc import render_block, BEGIN, END  # noqa: E402


def extract_block(text: str) -> str:
    assert BEGIN in text and END in text, "Missing auto-block markers in docs/spec/v1-scan-profiles.md"
    return text.split(BEGIN)[1].split(END)[0].strip()


def test_scan_profiles_doc_matches_yaml():
    import yaml  # local import so test error is clear if missing

    cfg_path = Path("config/scan_profiles.yaml")
    doc_path = Path("docs/spec/v1-scan-profiles.md")

    assert cfg_path.exists(), "Missing config/scan_profiles.yaml"
    assert doc_path.exists(), "Missing docs/spec/v1-scan-profiles.md"

    cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8"))
    doc = doc_path.read_text(encoding="utf-8")

    generated = render_block(cfg)

    assert extract_block(doc) == extract_block(generated), (
        "docs/spec/v1-scan-profiles.md drifted from config/scan_profiles.yaml.\n"
        "Run: python scripts/sync_scan_profiles_doc.py"
    )

if __name__ == "__main__":
    test_scan_profiles_doc_matches_yaml()
    print("Test passed: docs/spec/v1-scan-profiles.md is in sync with config/scan_profiles.yaml")
