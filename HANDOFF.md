# OpenCode Setup Handoff

This document lets another OpenCode instance on another device clone this setup with **no secrets and no provider settings**. Everything here is sanitized; any credentials or provider blocks were intentionally removed and must be re-created manually on the target device.

## Overview

| Field | Value |
| --- | --- |
| Handoff date | 2026-11-01 |
| Source OS | linux |
| Tool | OpenCode (opencode) |
| Source config root | `$HOME/.config/opencode/` |
| Bundle | `opencode-config-bundle.tar.gz` |

## Inventory

### Agents (12 files)

`agents/` contains the following agent definitions:

```
backend.md        coder.md         database.md
devops.md        docs.md          frontend.md
orchestrator.md  planner.md       researcher.md
reviewer.md      security.md      tester.md
```

### Skills

- `.config/opencode/skills/` contains **42 entries**: 41 are symlinks into `~/.agents/skills/` plus one real directory `impeccable/`.
- The source of truth is `~/.agents/skills/` which contains **113 entries**. On the new device you can either copy the resolved skill content (as the bundle does, via dereferenced symlinks) or replicate the whole `~/.agents/skills/` directory and re-create the symlinks.
- `commands/` contains 1 file: `impeccable.md`.

### Plugins (4)

```
cc-safety-net@latest
@tarquinen/opencode-dcp@latest
envsitter-guard@latest
@slkiser/opencode-quota
```

### MCP servers (16 in global config)

| Server | Type | Re-auth / handling |
| --- | --- | --- |
| `linear` | remote (enabled) | No secret in config; browser OAuth at first connect |
| `aws-mcp` | local | `mcp-proxy-for-aws` binary must be installed (see prereqs); AWS auth via `aws` CLI |
| `github` | remote | Requires `Authorization: Bearer <pat>` header — **must be re-added manually** |
| `supabase` | remote | OAuth at first connect |
| `21st` | remote | Requires `x-api-key` header — **must be re-added manually** |
| `chrome-devtools` | local (disabled) | `npx chrome-devtools-mcp@latest`; disabled, no auth |
| `playwright` | local | `npx @playwright/mcp@latest`; no auth |
| `puppeteer` | local (disabled) | `npx puppeteer-mcp-server`; disabled, no auth |
| `filesystem` | local | `npx @modelcontextprotocol/server-filesystem`; no auth |
| `memory` | local | `npx @modelcontextprotocol/server-memory`; no auth |
| `[envsitter: DATABASE_URL redacted]` | local | postgres MCP; requires `DATABASE_URL` env — **must be set manually** |
| `sqlite` | local (disabled) | `uvx mcp-sqlite`; disabled, no auth |
| `sentry` | remote | OAuth at first connect |
| `netlify` | local | `npx @netlify/mcp`; no auth |
| `falkordb` | local | Requires `FALKORDB_URL` env — **must be set manually** |
| `open-design` | local | Runs via docker exec into `open-design` container |

Project-level `$HOME/opencode.json` additionally defines `accessibility-companion` (remote → `http://127.0.0.1:8097/mcp`), a localhost server — not in the global config.

### Appearance & behavior

- **Theme:** `tokyonight` (mode `system`)
- **Permissions:** `autoaccept`
- **Default agent:** `orchestrator`
- **Default model:** `opencode/deepseek-v4.1-flash-free` (model name is fine to keep; it is not a secret)

## What is NOT included

The following are **excluded by design** and must be re-created manually:

- All **provider / providers blocks** (removed per request — re-add via `opencode auth login` or manual config)
- All **API keys / secrets** (replaced with `REDACTED_SET_MANUALLY`)
- `service.json` (contains a password) — regenerate with `openssl rand -base64 32`
- `auth.json`, `opencode.db`, session files, and any `*.backup-*` files
- `opencode-quota/` quota provider settings
- MCP auth headers, `DATABASE_URL`, `FALKORDB_URL`

## What to copy

Copy the bundle `opencode-config-bundle.tar.gz` to the new device. It contains:

- `agents/`, `skills/` (dereferenced from `~/.agents/skills/`), `commands/`, `sounds/`
- Sanitized `opencode.json.sanitized`, `cli.json.sanitized`, `dcp.jsonc.sanitized`

Example copy + extract:

```bash
scp user@source:/home/ansh/opencode-handoff/opencode-config-bundle.tar.gz /tmp/
mkdir -p "$HOME/.config/opencode"
tar -xzf /tmp/opencode-config-bundle.tar.gz -C "$HOME/.config/opencode" agents skills commands sounds opencode.json.sanitized cli.json.sanitized dcp.jsonc.sanitized
```

### Place sanitized configs

The extract command above already placed the sanitized JSons into `$HOME/.config/opencode/` alongside the other files, so copy them from there into their final names:

```bash
mkdir -p "$HOME/.config/opencode"
cp "$HOME/.config/opencode/opencode.json.sanitized" "$HOME/.config/opencode/opencode.json"
cp "$HOME/.config/opencode/cli.json.sanitized"      "$HOME/.config/opencode/cli.json"
cp "$HOME/.config/opencode/dcp.jsonc.sanitized"     "$HOME/.config/opencode/dcp.jsonc"
```

If you extracted the bundle to a different staging directory instead, point the `cp` sources at that directory (and adjust the `tar` source in the previous step if the bundle was copied somewhere other than `/tmp`).

### Fix `/home/ansh` → your home path

The sanitized `opencode.json` still contains `/home/ansh` paths (e.g. `mcp-proxy-for-aws`, `filesystem` root, `uvx`, `sample.db`, cargo `falkordb-mcp`). Replace them on the target device:

```bash
sed -i "s#/home/ansh#$HOME#g" "$HOME/.config/opencode/opencode.json"
```

(`cli.json.sanitized` already uses `$HOME` placeholders — no fix needed.)

## Recreate manually

1. **Provider settings** — the `provider` and `providers` blocks were **removed** per request. Re-add them with `opencode auth login` or by editing the config manually.
2. **All API keys / secrets** — replace every `REDACTED_SET_MANUALLY` placeholder with the real value.
3. **`service.json` password** — regenerate: `openssl rand -base64 32`
4. **MCP auth headers** — re-add for `github` (Bearer PAT) and `21st` (`x-api-key`).
5. **`DATABASE_URL`** — for the postgres MCP server.
6. **`FALKORDB_URL`** — for the `falkordb` MCP server.
7. **Quota providers** — any `opencode-quota` provider config.

## Restore steps (new device)

1. **Install OpenCode** — `curl -fsSL https://opencode.ai/install | bash` (or your preferred install method).
2. **Create directories** — `mkdir -p "$HOME/.config/opencode/sounds"`.
3. **Copy the bundle** and extract `agents/`, `skills/`, `commands/`, `sounds/` into `$HOME/.config/opencode/`.
4. **Place the sanitized JSON configs** into `$HOME/.config/opencode/` (see above).
5. **Fix paths** — `sed -i "s#/home/ansh#$HOME#g" "$HOME/.config/opencode/opencode.json"`.
6. **Re-add providers and auth** — `opencode auth login`; re-add headers and secret env values.
7. **Install MCP prerequisites**:
   - `uvx` (for `sqlite`/`uvx`-based servers)
   - `npx` (for `playwright`, `chrome-devtools`, `puppeteer`, `filesystem`, `memory`, postgres, `netlify`)
   - `mcp-proxy-for-aws` (for `aws-mcp`)
   - `falkordb-mcp` (for `falkordb`)
   - Docker container `open-design` (for `open-design`)
8. **Re-auth remote MCPs** via `/mcps` (browser OAuth for `linear`, `supabase`, `sentry`; header-based for `github` — `Authorization: Bearer <pat>` — and `21st` — `x-api-key`).

## Verification checklist

```bash
# 1. JSON validity
jq empty "$HOME/.config/opencode/opencode.json" && echo "opencode.json OK"
jq empty "$HOME/.config/opencode/cli.json" && echo "cli.json OK"

# 2. File counts
ls "$HOME/.config/opencode/agents" | wc -l      # expect 12
find "$HOME/.config/opencode/skills" -maxdepth 1 -mindepth 1 | wc -l   # expect 42
ls "$HOME/.config/opencode/commands" | wc -l     # expect 1
ls "$HOME/.config/opencode/sounds" | wc -l       # expect 2

# 3. No secrets / providers leaked (should return only placeholders or nothing)
grep -n "REDACTED_SET_MANUALLY" "$HOME/.config/opencode/opencode.json"  # only these placeholders
grep -nE '"(provider|providers|headers|oauth)"' "$HOME/.config/opencode/opencode.json"  # expect empty
grep -inE 'apikey|bearer|x-api-key|github_pat|21st_sk|HERMES' "$HOME/.config/opencode/opencode.json"  # expect empty

# 4. No absolute /home/ansh paths remain (except intentionally normalized)
grep -n '/home/ansh' "$HOME/.config/opencode/opencode.json" || echo "paths normalized"
```

## Notes

- **Known redaction artifact** — the MCP server listed as `[envsitter: DATABASE_URL redacted]` appears that way because its server name/command was redacted on read by the envsitter-guard plugin. It is **not** a real server name. On restore:
  - Check the **source** `opencode.json` for the actual DB server name/command (likely `postgres`, e.g. `npx -y @modelcontextprotocol/server-postgres`) and enter it in place of the redacted command.
  - Re-enter the `DATABASE_URL` environment value manually — the sanitized file sets `DATABASE_URL: REDACTED_SET_MANUALLY`, which is intentional and correct.
- If you also want the **`~/.agents/skills`** source (113 entries) and **`~/.claude/settings.json`** hooks, copy them separately — they are not part of this bundle.
- The bundle excludes `service.json`, `auth.json`, `opencode.db`, session files, and backups by design.
- Regulatory note: commit only sanitized configs to version control; never commit the raw `opencode.json` (which contains keys), `service.json`, or `auth.json`.
