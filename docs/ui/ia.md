# Information Architecture (v1)

**Principle:** The default landing view is **Change-first**.

---

## 1. Navigation (sidebar)

**Primary**
1) **Dashboard** (Change-first)  
2) **Exposures** (All current exposures, filterable)  
3) **Assets** (Scope management)  
4) **Scans** (History + run scan)  
5) **Proof / Exports** (Evidence packets and exports)

**Secondary**
6) **Settings**
   - Notifications (email; Teams/Slack later)
   - Team & roles (Clerk org membership)
   - Scan schedule defaults (v1: per-tenant)
   - Suppressions (v1: minimal; optional)

---

## 2. URL structure (recommended)

- `/` → redirects to `/dashboard`
- `/dashboard`
- `/exposures`
- `/exposures/:exposureId`
- `/assets`
- `/assets/new` (optional)
- `/scans`
- `/scans/:scanId` (optional detail page)
- `/proof`
- `/proof/:packetId` (or derived from exposure)
- `/settings`
- `/settings/notifications`
- `/settings/team`
- `/settings/scanning`

---

## 3. Page hierarchy and drill-down rules

### 3.1 Change-first drill-down
`Dashboard → Exposure Detail → Actions (Fix/Verify) → Proof Export`

### 3.2 “All exposures” drill-down
`Exposures → Exposure Detail → History (events) + Evidence`

### 3.3 Scope drill-down
`Assets → Asset Detail (optional) → Recent scans & exposures for asset`

---

## 4. Global UI patterns

### 4.1 Global filters (top bar)
- Tenant/Org switcher (Clerk)
- Search (domain / IP / exposure title)
- Time context (Last scan time, Last change window)

### 4.2 States
All list screens must have:
- Loading skeleton
- Empty state (with next-step CTA)
- Error state (retry + support note)

### 4.3 “Do not bury the lede”
- Default sort is always:
  - **NEW first**
  - then **CHANGED (worse)**
  - then other states
- Exposure detail always shows:
  - **What is it**
  - **Why it matters**
  - **Proof / Evidence**
  - **How to fix**
  - **Verify fix**

---

## 5. v1 scope boundaries in UI

v1 must NOT expose UI implying:
- internal scanning / credentialed checks
- brute force / exploitation
- deep vulnerability management platform features

Use wording:
- “External exposure”
- “Observed from the public internet”
- “Verification scan”

---
