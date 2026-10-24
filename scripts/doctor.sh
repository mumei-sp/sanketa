#!/usr/bin/env bash
# Check the toolchain and the active profile's config. Reports every problem
# instead of stopping at the first. Exit 1 if any check failed (✗).
source "$(dirname "$0")/lib.sh"
set +e

FAILS=0
ok()   { printf '\033[32m✓\033[0m %s\n' "$1"; }
bad()  { printf '\033[31m✗\033[0m %s\n    fix: %s\n' "$1" "$2"; FAILS=$((FAILS + 1)); }
note() { printf '\033[33m!\033[0m %s\n    fix: %s\n' "$1" "$2"; }

# ---- toolchain ---------------------------------------------------------------
DOCKER_UP=0
if command -v docker >/dev/null; then
  ok "docker CLI ($(docker --version 2>/dev/null | sed 's/^Docker version //'))"
  if docker info >/dev/null 2>&1; then ok "docker daemon reachable"; DOCKER_UP=1
  else bad "docker daemon not reachable" "start Docker Desktop / colima, then re-run"; fi
  if v="$(docker compose version --short 2>/dev/null)"; then ok "docker compose plugin ($v)"
  elif v="$(docker-compose version --short 2>/dev/null)"; then ok "docker-compose ($v)"
  else bad "docker compose not found" "install the compose plugin (Docker Desktop ships it)"; fi
else
  bad "docker CLI not found" "install Docker Desktop or colima + docker CLI"
fi

if v="$(mise --version 2>/dev/null)"; then ok "mise ${v%% *}"
else bad "mise not found" "https://mise.jdx.dev/getting-started.html"; fi

if command -v python3 >/dev/null; then ok "python3 ($(python3 --version 2>&1 | cut -d' ' -f2))"
else bad "python3 not found (needed by check:safety)" "brew install python3"; fi

if mise which sqlfluff >/dev/null 2>&1; then ok "sqlfluff (via mise)"
else note "sqlfluff not installed (SQL lint)" "mise install"; fi

# ---- profile -----------------------------------------------------------------
if [[ -z "${DB_PROFILE:-}" ]]; then
  bad "no DB_PROFILE loaded" "run through mise: 'mise run dev:doctor' or 'mise -E <profile> run dev:doctor'"
  printf '\n%s problem(s)\n' "$FAILS"; exit 1
fi
ok "profile '$DB_PROFILE' (${DB_TARGET:-local})"

# Secrets: the file must exist and hold the passwords this profile needs.
# A tenant migrator password may be per instance (<INSTANCE>_MIGRATOR_PASSWORD).
need_pw=(GLOBAL_DB_MIGRATOR_PASSWORD)
[[ "${DB_TARGET:-local}" == local ]] && need_pw+=(POSTGRES_PASSWORD GLOBAL_DB_APP_PASSWORD TENANT_DB_MIGRATOR_PASSWORD TENANT_DB_APP_PASSWORD)
for i in $(csv "${TENANT_INSTANCES:-}"); do need_pw+=("$(upper "$i")_MIGRATOR_PASSWORD|TENANT_DB_MIGRATOR_PASSWORD"); done
missing_pw() {  # has_cmd -> prints keys (alternatives joined by |) that are absent
  local spec k found
  for spec in "${need_pw[@]}"; do
    found=0
    for k in ${spec//|/ }; do "$1" "$k" && found=1; done
    [[ $found == 1 ]] || printf ' %s' "${spec##*|}"
  done | tr ' ' '\n' | sort -u | tr '\n' ' '
}
in_file() { grep -q "^$1=." "$ROOT/.secrets/${DB_PROFILE}.env"; }
in_env()  { [[ -n "${!1:-}" ]]; }

case "${SECRETS_SOURCE:-file}" in
  file)
    f=".secrets/${DB_PROFILE}.env"
    if [[ -f "$ROOT/$f" ]]; then
      missing="$(missing_pw in_file | xargs)"
      if [[ -z "${missing// /}" ]]; then ok "secrets file $f"
      else bad "$f is missing: $missing" "add them (see config/secrets.local.example)"; fi
    elif [[ "${DB_TARGET:-local}" == local ]]; then
      note "secrets file $f not created yet" "created from config/secrets.local.example on 'mise run dev:start'"
    else
      bad "secrets file $f missing" "create it with the *_PASSWORD keys, or set SECRETS_SOURCE=env"
    fi ;;
  env)
    missing="$(missing_pw in_env | xargs)"
    if [[ -z "${missing// /}" ]]; then ok "secrets from environment"
    else bad "SECRETS_SOURCE=env but unset: $missing" "export them before running"; fi ;;
  *) bad "SECRETS_SOURCE='${SECRETS_SOURCE}' is not supported" "use file or env" ;;
esac

# Config: load_config + use_instance in a subshell with secrets stubbed out
# (checked above), so a failure is reported instead of exiting.
cfg_out="$( {
  load_secrets() { :; }
  for k in GLOBAL_DB_MIGRATOR_PASSWORD TENANT_DB_MIGRATOR_PASSWORD; do export "$k=${!k:-x}"; done
  load_config && for i in $(tenant_instances); do use_instance "$i"; done
  echo OK
} 2>&1 )"
LOCAL_CONTAINER="sanketa-postgres-${DB_PROFILE}"
if [[ "$cfg_out" == *OK ]]; then
  ok "config keys present (global + $(csv "${TENANT_INSTANCES:-}" | grep -c .) tenant instance(s))"
else
  bad "config: $(printf '%s' "$cfg_out" | sed $'s/\033\\[[0-9;]*m//g; s/^xx //' | tail -1)" "set it in mise.toml / mise.${DB_PROFILE}.toml"
fi

# No passwords in committed mise config (personal *.local.toml are git-ignored).
leaks="$(cd "$ROOT" && for f in mise*.toml; do
  [[ "$f" == *.local.toml || ! -f "$f" ]] && continue
  grep -nE '^[[:space:]]*"?[A-Za-z0-9_]*PASSWORD[A-Za-z0-9_]*"?[[:space:]]*=' "$f" | sed "s|^|$f:|"
done)"
if [[ -z "$leaks" ]]; then ok "no passwords in committed mise*.toml"
else bad "password keys in committed config: $(printf '%s' "$leaks" | cut -d= -f1 | tr '\n' ' ')" "move them to .secrets/${DB_PROFILE}.env and rotate them"; fi

# ---- docker-side checks ------------------------------------------------------
if [[ $DOCKER_UP == 1 ]]; then
  if [[ "${DB_TARGET:-local}" == local ]]; then
    port="${LOCAL_PORT:-5433}"
    holder="$(docker ps --filter "publish=$port" --format '{{.Names}}' | head -1)"
    if [[ "$holder" == "$LOCAL_CONTAINER" ]]; then ok "port $port held by this profile's container"
    elif [[ -n "$holder" ]]; then bad "port $port used by container '$holder'" "stop it, or set LOCAL_PORT in mise.${DB_PROFILE}.toml"
    elif (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then bad "port $port used by another process" "lsof -nP -iTCP:$port -sTCP:LISTEN; or change LOCAL_PORT"
    else ok "port $port free"; fi
  fi
  if docker image inspect "$FLYWAY_IMAGE" >/dev/null 2>&1; then ok "flyway image $FLYWAY_IMAGE"
  else note "flyway image $FLYWAY_IMAGE not pulled (first sync downloads it)" "docker pull $FLYWAY_IMAGE"; fi
fi

echo
if [[ $FAILS -gt 0 ]]; then printf '\033[31m%s problem(s)\033[0m\n' "$FAILS"; exit 1; fi
printf '\033[32mAll good.\033[0m\n'
