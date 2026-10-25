# ADR-0003: No session table in the Global DB

- Status: Accepted
- Date: 2026-10-25

## Context
The old MySQL design had `fabric_sessions`: one row per session, `last_accessed_at` updated on every request. No fabric code used it. fabric authenticates requests with a signed, 15-minute Tenant Context Token (PASETO, Ed25519), verified without any lookup.

## Decision
No session table. Each need goes where it fits:
- Login sessions, refresh, "log out everywhere", active devices: **Keycloak**.
- Per-request authorisation: **the signed token** (signature check in memory).
- Immediate revocation (user or membership suspended, logout) within the 15 minutes: **Redis**, one key per user ("tokens issued before X are invalid") with automatic expiry.
- Login history / security audit: **Keycloak events**, later an append-only audit store.

## Consequences
- No database write on the request path; the Global DB stays off the hottest path.
- fabric must add the Redis revocation check, so suspensions take effect immediately.
