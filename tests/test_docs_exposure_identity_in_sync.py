from __future__ import annotations

import sys
from pathlib import Path

# Add project root to sys.path so we can import scripts
sys.path.append(str(Path(__file__).parent.parent))

from scripts.sync_exposure_identity_doc import render_block, BEGIN, END  # noqa: E402


def extract_block(text: str) -> str:
    assert BEGIN in text and END in text, "Missing auto-block markers in docs/contracts/exposure-identity.md"
    return text.split(BEGIN)[1].split(END)[0].strip()


def test_exposure_identity_doc_matches_yaml():
    import yaml  # local import so missing dependency is obvious

    cfg_path = Path("config/exposure_identity.yaml")
    doc_path = Path("docs/contracts/exposure-identity.md")

    assert cfg_path.exists(), "Missing config/exposure_identity.yaml"
    assert doc_path.exists(), "Missing docs/contracts/exposure-identity.md"

    cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8"))
    doc = doc_path.read_text(encoding="utf-8")

    generated = render_block(cfg)

    assert extract_block(doc) == extract_block(generated), (
        "docs/contracts/exposure-identity.md drifted from config/exposure_identity.yaml.\n"
        "Run: python scripts/sync_exposure_identity_doc.py"
    )

if __name__ == "__main__":
    test_exposure_identity_doc_matches_yaml()
    print("Test passed: docs/contracts/exposure-identity.md is in sync with config/exposure_identity.yaml")
