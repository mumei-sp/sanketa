.DEFAULT_GOAL := help
SHELL := /usr/bin/env bash
DC := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo docker-compose)

sync: ## Bring the DB in line with this branch (starts local Postgres if needed)
	scripts/db-sync.sh

check: ## Report pending migrations; exit 3 if any
	scripts/db-sync.sh --check

seed: ## Sync + dev seeds (local only)
	scripts/db-sync.sh --with-seeds

tenant: ## Create/migrate one tenant: make tenant instance=sanketa_db_1 name=tenant_school_042
	scripts/db-sync.sh --tenant "$(instance):$(name)"

new: ## New migration: make new scope=global|tenant desc="create users"
	@scripts/new-migration.sh "$(scope)" "$(desc)"

up: ## Start local Postgres
	$(DC) up -d --wait postgres

down: ## Stop local Postgres (keeps data)
	$(DC) down

reset: ## Destroy local data, then sync from scratch
	$(DC) down -v && scripts/db-sync.sh

psql: ## psql into a local DB as superuser: make psql db=sanketa_db_1 (default sanketa_global)
	$(DC) exec postgres psql -U postgres -d $(or $(db),sanketa_global)

lint: ## Lint SQL (needs: pipx install sqlfluff)
	sqlfluff lint migrations seeds

help:
	@grep -E '^[a-z]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[36m%-8s\033[0m %s\n", $$1, $$2}'

.PHONY: sync check seed tenant new up down reset psql lint help
