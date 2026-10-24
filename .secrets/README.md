# .secrets/

One git-ignored file per profile: `.secrets/<profile>.env` (dotenv format).
Only passwords live here; everything else is in `mise.<profile>.toml`.

- Local profiles (`dev`, `ci`) create theirs automatically from
  `config/secrets.local.example` on first run.
- Remote profiles: create the file by hand, or set `SECRETS_SOURCE=env`
  and inject the variables (CI). Vault support will replace this later.
