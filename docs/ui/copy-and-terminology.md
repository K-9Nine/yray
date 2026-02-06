# Copy & Terminology (v1)

**Goal:** Consistent language that reduces confusion and supports trust.

---

## 1. Canonical nouns

### Exposure (preferred)
Use “Exposure” as the primary noun (not “Finding”).
- Exposure = “something observable from the public internet that increases risk”

Avoid:
- “vulnerability” (unless it truly is a CVE-based vuln)
- “attack” (sounds like active exploitation)

### Asset
Asset = a tenant-authorized scope item:
- domain
- public IP
- CIDR (guarded)

### Scan
Scan = an execution that checks assets and produces:
- evidence
- exposures
- change events

### Evidence
Evidence = raw-ish observations from tools (ports/http/tls/detections).

### Proof-of-fix
Proof-of-fix = before/after evidence packet produced by verification.

---

## 2. Canonical verbs (buttons and CTAs)

### Run scan
Use: **Run scan**
Avoid: “Start assessment”, “Audit”

### Verify fix
Use: **Verify fix**
Avoid: “Rescan” (too generic), “Validate” (too compliance)

### Fix in progress
Use: **Fix in progress**
Avoid: “Remediating” (too formal)

### Export proof
Use: **Export proof**
Avoid: “Generate report”

---

## 3. Change-state labels (must match diff-engine)

- **NEW**: not present last scan, present now
- **CHANGED**: same identity, material evidence changed
- **FIXED**: present last scan, absent now
- **UNRESPONSIVE**: port open but app-layer probe failed / unknown service

These terms must align with `docs/contracts/diff-engine.md`.

---

## 4. Severity language (v1)

- **High**: RB1/RB2 by default; cert expired
- **Medium**: weak TLS posture, spoofing posture, cert near expiry
- **Low**: headers advisories, unresponsive/unknown edge service (investigate)

Avoid:
- “Critical” in v1 unless you’re very sure; reserve for v2+ scoring.

---

## 5. Trust and scope copy (must appear in UI)

### “External-only” disclaimer (recommended)
Use a small line on evidence screens:
> Observed from the public internet. XRAY does not perform internal or credentialed scanning.

### “Authorized scanning only” (recommended)
In assets onboarding:
> Only add assets you own or have explicit authorization to monitor.

---

## 6. Tone

- Clear, direct, MSP-friendly
- Avoid fear language
- Prefer “what to do next” over “what’s wrong”

---

## 7. Example titles (by bucket)

RB1:
- “Remote admin exposed: RDP on 203.0.113.10:3389”

RB2:
- “Admin panel exposed: Cisco ASA login (https://example.com/login)”

RB3:
- “Weak encryption: TLS 1.0 enabled (example.com:443)”

RB4:
- “Certificate expired: example.com (expired 3 days ago)”

RB5:
- “Security headers missing: CSP, X-Frame-Options (example.com)”

RB6:
- “Unknown service: TCP 8443 open but unresponsive (203.0.113.10)”

RB7:
- “Email spoofing risk: DMARC missing (example.com)”

---
