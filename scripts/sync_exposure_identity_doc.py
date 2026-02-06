from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

import yaml

BEGIN = "<!-- BEGIN:EXPOSURE_IDENTITY_AUTO -->"
END = "<!-- END:EXPOSURE_IDENTITY_AUTO -->"

BUCKET_ORDER = ["RB1", "RB2", "RB3", "RB4", "RB5", "RB6", "RB7"]


def _load_yaml(path: str = "config/exposure_identity.yaml") -> dict:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Missing {p}")
    return yaml.safe_load(p.read_text(encoding="utf-8"))


def _fmt_list(xs: List[Any]) -> str:
    return ", ".join(str(x) for x in xs)


def _fmt_bool(v: Any) -> str:
    return "true" if bool(v) else "false"


def _bucket_fingerprint_summary(bucket_cfg: Dict[str, Any]) -> str:
    fp = bucket_cfg.get("fingerprint", {}) or {}

    # Common simple template
    if "template" in fp and isinstance(fp["template"], str):
        return fp["template"]

    # RB3 category-per-exposure
    if fp.get("strategy") == "category_per_exposure":
        cats = fp.get("categories", []) or []
        parts = []
        for c in cats:
            tid = c.get("id", "")
            tmpl = c.get("template", "")
            parts.append(f"{tid}→`{tmpl}`")
        return "category_per_exposure: " + "; ".join(parts)

    # RB7 record-per-exposure
    if fp.get("strategy") == "record_per_exposure":
        recs = fp.get("records", {}) or {}
        parts = []
        for k in ["spf", "dmarc", "dkim"]:
            if k in recs:
                parts.append(f"{k}→`{recs[k].get('template','')}`")
        return "record_per_exposure: " + "; ".join(parts)

    return "(see config)"


def _bucket_port_rule(bucket_cfg: Dict[str, Any]) -> str:
    src = bucket_cfg.get("port_source", "unknown")
    if src == "none":
        return f"none (port={bucket_cfg.get('port_value', 0)})"
    if src == "use_exposure_port":
        return "use exposure port"
    if src == "observed_open_port":
        return "observed open port"
    if src == "from_observation":
        return "from observation"
    return str(src)


def render_block(cfg: dict) -> str:
    ident = cfg.get("identity_key", {}) or {}
    canon = cfg.get("canonicalization", {}) or {}

    host = canon.get("host", {}) or {}
    url = canon.get("url", {}) or {}
    tls = canon.get("tls", {}) or {}

    host_domain = host.get("domain", {}) or {}
    url_query = url.get("query_handling", "drop")

    tls_anchor_pref = tls.get("cert_anchor_preference", []) or []

    buckets = cfg.get("buckets", {}) or {}

    # Build RB table rows
    rows = []
    for b in BUCKET_ORDER:
        bcfg = buckets.get(b, {}) or {}
        rows.append(
            {
                "bucket": b,
                "name": bcfg.get("name", ""),
                "proto": str(bcfg.get("proto", "")).replace("_", "/"),
                "port_rule": _bucket_port_rule(bcfg),
                "fingerprint": _bucket_fingerprint_summary(bcfg),
                "material": _fmt_list(bcfg.get("material_change_fields", []) or []),
            }
        )

    # Markdown table
    table_lines = [
        "| Bucket | Name | Proto | Port rule | Fingerprint rule | Material-change fields |",
        "|---|---|---|---|---|---|",
    ]
    for r in rows:
        table_lines.append(
            f"| {r['bucket']} | {r['name']} | {r['proto']} | {r['port_rule']} | {r['fingerprint']} | {r['material']} |"
        )

    table = "\n".join(table_lines)

    return f"""\
{BEGIN}
## Identity rules (auto-generated from `config/exposure_identity.yaml`)

### Identity key format
- identity_version: `{ident.get('identity_version')}`
- fingerprint_version: `{ident.get('fingerprint_version')}`
- canonical identity string:
  - `{ident.get('format')}`

### Canonicalization highlights (v1)
- host/domain: lowercase={_fmt_bool(host_domain.get('lowercase'))}, strip_trailing_dot={_fmt_bool(host_domain.get('strip_trailing_dot'))}, idna={host_domain.get('idna')}
- url/query_handling: `{url_query}` (v1 default to avoid identity churn)
- tls/cert_anchor_preference: `{_fmt_list(tls_anchor_pref)}`

### RB1–RB7 fingerprint rules (deterministic)
{table}

> Note: If this block conflicts with prose elsewhere in the contract, the YAML is the source of truth.
{END}
"""


def replace_block(doc_text: str, new_block: str) -> str:
    if BEGIN not in doc_text or END not in doc_text:
        raise RuntimeError(
            "docs/contracts/exposure-identity.md must contain the auto-block markers:\n"
            f"{BEGIN}\n...\n{END}"
        )
    pre = doc_text.split(BEGIN)[0]
    post = doc_text.split(END)[1]
    return pre + new_block + post


def main() -> None:
    cfg = _load_yaml("config/exposure_identity.yaml")

    doc_path = Path("docs/contracts/exposure-identity.md")
    if not doc_path.exists():
        raise FileNotFoundError(f"Missing {doc_path}")

    doc_text = doc_path.read_text(encoding="utf-8")
    new_block = render_block(cfg)

    updated = replace_block(doc_text, new_block)
    doc_path.write_text(updated, encoding="utf-8")

    print(f"Synced exposure identity rules into {doc_path}")


if __name__ == "__main__":
    main()
