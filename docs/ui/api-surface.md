# UI → Data Surface Map (v1)

**Status:** Draft v1.0  
**Last updated:** 2026-02-05  
**Purpose:** Prevent UI/DB drift by defining what each screen needs from Supabase.

> Rule: If a screen changes its required fields, update this file in the same PR.

---

## Mapping Table

| Screen | Route | Supabase source | Query shape | Required fields |
|---|---|---|---|---|
| Dashboard (Change-first) | `/dashboard` | `exposure_events` + `exposures_current` (or `ui_dashboard_changes` view) | Rollup counts + top lists by change_type in time window | `exposure_id`, `change_type`, `bucket`, `severity`, `observed_host`, `observed_ip`, `port`, `first_seen`, `last_seen`, `event_time` |
| Exposures (All current) | `/exposures` | `exposures_current` | Filterable list | `id`, `bucket`, `severity`, `status`, `title`, `observed_host`, `observed_ip`, `port`, `proto`, `first_seen`, `last_seen`, `identity_key` |
| Exposure Detail | `/exposures/:exposureId` | `exposures_current` + `exposure_events` + `exposure_actions` | Detail + timeline + actions | From `exposures_current`: `id`, `bucket`, `severity`, `status`, `title`, `summary`, `fix_guidance`, `evidence`, `observed_host`, `observed_ip`, `port`, `proto`, `first_seen`, `last_seen`, `identity_key` |
| Exposure Detail (history) | `/exposures/:exposureId` | `exposure_events` | Ordered timeline | `id`, `exposure_id`, `event_time`, `change_type`, `material_diff` (optional), `scan_id` |
| Exposure Detail (actions) | `/exposures/:exposureId` | `exposure_actions` | Ordered list | `id`, `exposure_id`, `created_at`, `action_type`, `notes`, `assigned_to` (optional), `requested_verify_at` (optional), `actor_user_id` |
| Assets | `/assets` | `assets` | List + CRUD | `id`, `asset_type`, `asset_value`, `tags`, `created_at` |
| Scans (history) | `/scans` | `scans` | List | `id`, `scan_kind`, `scan_profile`, `status`, `started_at`, `finished_at`, `created_at` |
| Scans (enqueue) | `/scans` or `/dashboard` | `scan_jobs` (insert) | Insert job | `id`, `tenant_key`, `scan_kind`, `scan_profile`, `requested_asset_ids` (optional), `status`, `created_at` |
| Proof / Exports | `/proof` | `exposures_current` (where `status=confirmed_fixed`) OR `evidence_packets` view/table | List | `exposure_id`, `status`, `verified_at`, `verified_by`, `evidence_packet_ref` (or inline), `export_hash` (v1.1+) |
| Settings (notifications) | `/settings/notifications` | `tenant_settings` (optional) | Read/update | `tenant_key`, `email_digest_enabled`, `digest_time`, `alert_rules_json` |
| Settings (scanning defaults) | `/settings/scanning` | `tenant_settings` (optional) | Read/update | `tenant_key`, `default_scan_profile`, `default_schedule_cron` (optional), `limits_overrides` (optional) |

---

## Notes and recommendations

### 1) Consider creating a UI view for Dashboard
To keep the dashboard query simple and fast, consider:
- `ui_dashboard_changes` view:
  - pre-joins `exposure_events` to `exposures_current`
  - returns “latest event per exposure in window”
  - supports counts + lists with one source

### 2) Evidence shape is governed by contracts
The `evidence` JSON payload in `exposures_current` must remain compatible with:
- `docs/contracts/scan-result.md` (raw scan data)
- `docs/contracts/exposure-identity.md` (identity and material change inputs)

### 3) Proof packets (v1)
For v1, proof can be:
- stored inline in `exposures_current.evidence_packet` (simple)
or
- normalized into a `proof_packets` table/view (cleaner)

If using the tamper-evident ledger (v1.1), the proof screen must also display:
- hash
- prev_hash
- verification status

---
