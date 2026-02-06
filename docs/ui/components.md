# UI Components & Patterns (v1)

**Stack:** Next.js + Tailwind + shadcn/ui  
**Goal:** Small, consistent set of reusable components that support “change-first”.

---

## 1. Global layout components

### 1.1 App Shell
- Sidebar nav (primary IA)
- Top bar:
  - Org switcher (Clerk)
  - Search
  - “Run scan” shortcut

### 1.2 Page Header
- Title
- Context line: “Last scan: …”
- Primary CTA (Run scan / Add asset)

---

## 2. Badges and chips (canonical)

### 2.1 Change State Chip
- NEW
- CHANGED
- FIXED
- UNRESPONSIVE

Rules:
- used in dashboard lists and timelines
- always present for change-focused views

### 2.2 Severity Badge (v1)
- High / Medium / Low

### 2.3 Risk Bucket Tag
- RB1…RB7 + short label
- Tooltip shows full bucket definition (from product doc)

### 2.4 Status Badge (workflow)
- OPEN
- FIX_IN_PROGRESS
- CONFIRMED_FIXED
- STILL_OPEN
- FALSE_POSITIVE (optional)

---

## 3. List and table patterns

### 3.1 Exposure List Item (Card Row)
Minimum fields:
- Change chip (when context is “changes”)
- Bucket tag
- Severity badge
- Target (domain/ip + port)
- First seen / Last seen
- “View” action

### 3.2 Filter Bar
- Search input
- Filters (bucket, severity, status)
- Sort dropdown

---

## 4. Detail page components

### 4.1 Exposure Header
- Title (human readable)
- Key badges: Bucket, Severity, Status
- Quick actions: Verify fix, Export proof (when available)

### 4.2 Evidence Panel (Tabs)
Tabs:
- Summary (human readable)
- Ports (naabu)
- HTTP (httpx)
- TLS (tlsx)
- Detections (nuclei)
- Raw (artifact link or JSON view)

Rules:
- evidence shown as “observed from public internet”
- avoid dumping raw unless user asks

### 4.3 Fix Guidance Block
- “How to fix” steps (v1 can be templated per bucket)
- “Verify fix” CTA

### 4.4 History Timeline
- NEW/CHANGED/FIXED events from `exposure_events`
- user notes/actions from `exposure_actions`

---

## 5. Empty states (required)

### 5.1 No Assets
- Explain: “Add your authorized external assets to begin monitoring”
- CTA: Add asset

### 5.2 No Scans Yet
- CTA: Run first scan

### 5.3 No Changes
- “No changes since last scan”
- Link to Exposures (All)

---

## 6. Loading and error patterns

### 6.1 Loading
- Use skeletons (shadcn Skeleton)
- Preserve layout to prevent jumping

### 6.2 Error
- Show simple message + Retry
- Provide small “details” accordion for debugging (optional)

---

## 7. shadcn/ui building blocks (recommended set)
- Button, Badge, Card, Tabs, Table, Tooltip, Dialog, Drawer/Sheet
- Skeleton, Separator
- Toast (for actions)
- DropdownMenu (filters)
- Command (optional search palette)

---
