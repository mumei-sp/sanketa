# ADR-0002: mise for commands and environment profiles

- Status: Accepted
- Date: 2026-10-24

## Context
Developers need a discoverable set of commands (start, migrate, check, deploy) without memorising them, and every environment must be driven by config rather than by code changes. Make was a poor fit: no real flags or per-command help, and no notion of environments.

## Decision
- **mise** runs the commands (`mise-tasks/<group>/<name>`) and selects the environment: `mise.toml` (shared) + `mise.<profile>.toml`, picked with `-E <profile>`; `dev` is the default (`.miserc.toml`).
- Tasks are thin wrappers; all logic stays in `scripts/` so it can run (and be replaced) without mise.
- Safety switches (`ALLOW_SEEDS`, `ALLOW_RESET`, `REQUIRE_CONFIRM`, …) default to deny and are opted into per profile.
- Secrets are never in TOML: `.secrets/<profile>.env` (git-ignored) or CI-injected (`SECRETS_SOURCE=env`). Vault is planned and only changes the loader.
- Each local profile gets its own Docker stack (container, volume, port).

## Consequences
- One install for developers (`brew install mise`); CI uses `jdx/mise-action`.
- `mise run` gives an interactive menu, `--help` per command, completions.
- mise `[env]` values override the process environment; settings CI must override (`SECRETS_SOURCE`, `LOCK_TIMEOUT`) read it explicitly via `get_env`.
- mise is mostly maintained by one person. The exit cost is low: replace the profile TOML with env files and the tasks with a small CLI over `scripts/`.
