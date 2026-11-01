# my-opencode-setup

Sanitized OpenCode configuration handoff — start with [HANDOFF.md](HANDOFF.md).

Configs (`opencode.json.sanitized`, `cli.json.sanitized`, `dcp.jsonc.sanitized`) are scrubbed: no providers, no API keys, no secrets. `opencode-config-bundle.tar.gz` holds the agents/skills tree only.

Restore: extract the tarball into `~/.config/opencode/`, rename each `*.sanitized` to its real name, then re-add your own provider credentials locally.
