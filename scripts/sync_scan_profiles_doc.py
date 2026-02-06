from __future__ import annotations

from pathlib import Path
from typing import List, Any

import yaml

BEGIN = "<!-- BEGIN:SCAN_PROFILES_AUTO -->"
END = "<!-- END:SCAN_PROFILES_AUTO -->"


def _load_yaml(path: str = "config/scan_profiles.yaml") -> dict:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Missing {p}")
    return yaml.safe_load(p.read_text(encoding="utf-8"))


def _get(d: dict, ref: str) -> Any:
    # Resolve dotted refs like "ports.v1_baseline_tcp_allowlist"
    cur: Any = d
    for part in ref.split("."):
        cur = cur[part]
    return cur


def _md_list_ints(values: List[int]) -> str:
    return ", ".join(str(v) for v in sorted(values))


def render_block(cfg: dict) -> str:
    baseline = cfg["profiles"]["v1_baseline"]
    ports_baseline = _get(cfg, baseline["tcp_ports_allowlist_ref"])
    ports_http = _get(cfg, baseline["http_candidate_ports_ref"])
    ports_https = _get(cfg, baseline["https_candidate_ports_ref"])
    ports_tls = _get(cfg, baseline["tls_candidate_ports_ref"])

    dns = cfg["tools"]["dns"]
    naabu = cfg["tools"]["naabu"]
    httpx = cfg["tools"]["httpx"]
    tlsx = cfg["tools"]["tlsx"]
    nuclei = cfg["tools"]["nuclei"]

    caps = cfg["caps"]
    conc = cfg["concurrency"]

    return f"""\
{BEGIN}
## v1 scan profiles (auto-generated from `config/scan_profiles.yaml`)

### Baseline port allowlist (TCP)
- {_md_list_ints(ports_baseline)}

### HTTP candidates (httpx)
- {_md_list_ints(ports_http)}

### HTTPS candidates (httpx)
- {_md_list_ints(ports_https)}

### TLS candidates (tlsx)
- {_md_list_ints(ports_tls)}

### Timeouts / retries
- DNS: timeout={dns['timeout_seconds']}s retries={dns['retries']} budget/domain={dns['total_budget_seconds_per_domain']}s
- naabu: connect_timeout={naabu['connect_timeout_ms']}ms retries={naabu['retries']} host_timeout={naabu['host_timeout_seconds']}s
- httpx: timeout={httpx['timeout_seconds']}s retries={httpx['retries']} max_redirects={httpx['max_redirects']} max_bytes={httpx['max_response_bytes']}
- tlsx: timeout={tlsx['timeout_seconds']}s retries={tlsx['retries']}
- nuclei: timeout={nuclei['timeout_seconds']}s retries={nuclei['retries']}

### Limits / caps
- max_total_runtime_seconds={caps['max_total_runtime_seconds']}
- max_runtime_seconds_per_endpoint={caps['max_runtime_seconds_per_endpoint']}
- max_total_endpoints_per_scan={caps['max_total_endpoints_per_scan']}
- max_endpoints_per_asset(domain)={caps['max_endpoints_per_asset']['domain']}
- max_endpoints_per_asset(cidr)={caps['max_endpoints_per_asset']['cidr']}

### Concurrency
- naabu_rate_pps={conc['naabu_rate_pps']}
- httpx_concurrency={conc['httpx_concurrency']}
- tlsx_concurrency={conc['tlsx_concurrency']}
- nuclei_concurrency={conc['nuclei_concurrency']}
- nuclei_rate_limit_rps={conc['nuclei_rate_limit_rps']}
- per_host_concurrency_cap={conc['per_host_concurrency_cap']}
{END}
"""


def replace_block(doc_text: str, new_block: str) -> str:
    if BEGIN not in doc_text or END not in doc_text:
        raise RuntimeError(
            "docs/spec/v1-scan-profiles.md must contain the auto-block markers:\n"
            f"{BEGIN}\n...\n{END}"
        )
    pre = doc_text.split(BEGIN)[0]
    post = doc_text.split(END)[1]
    return pre + new_block + post


def main() -> None:
    cfg = _load_yaml("config/scan_profiles.yaml")

    doc_path = Path("docs/spec/v1-scan-profiles.md")
    if not doc_path.exists():
        raise FileNotFoundError(f"Missing {doc_path}")

    doc_text = doc_path.read_text(encoding="utf-8")
    new_block = render_block(cfg)

    updated = replace_block(doc_text, new_block)
    doc_path.write_text(updated, encoding="utf-8")

    print(f"Synced scan profiles into {doc_path}")


if __name__ == "__main__":
    main()
