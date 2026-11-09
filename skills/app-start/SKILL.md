---
name: app-start
description: Start a new app from the user's Vite or Next.js toolkit, or inspect and start an existing app without replacing its stack.
---

Use the shared local `app-workflow` command, installed from ~/Projects/app-toolkit. Do not fetch a different starter/framework. Inspect cwd, project instructions and existing files first. If the request is only an idea with unresolved scope, load grill-me and grilling first. Existing apps keep their stack; doctor is read-only and does not add a manifest or migrate them.

For a new app settle only missing decisions with exactly one OpenCode native `question` prompt at a time: destination and Vite lightweight vs Next.js full-stack. Recommend based on the agreed requirements. Do not silently choose a destination. OpenCode's native question tool waits for the actual answer. Do not replace it with printed choices; wait before advancing. Respect dismissal/stop and tell the user if their host cannot supply a picker.

Known defaults: React+TypeScript, Tailwind+shadcn/ui, mobile-friendly PWA with offline fallback; optional Supabase, no automatic cloud resources. Once app creation/path are authorized run `app-workflow new PATH --starter vite|next --install`. It refuses existing destinations. Run doctor and relevant checks, start `app-workflow dev --project PATH` in a retained process/session, inspect its startup and health rather than announcing an unverified URL. Do not kill another process to take its port. Keep process ownership/logs available and stop only your own server when requested. No new scheduler or always-on MCP is needed.

Record agreed app scope and results in SPEC.md/TASK_LEDGER.md. Report path, selected starter, actual checks/results, working preview URL and exact limitations. A local demo does not prove live Supabase auth or cloud deployment. If asked to connect Supabase, inspect only configuration names/presence, use the project's documented setup and request explicit service actions when necessary; never put service-role credentials in frontend code. Deploy only when explicitly requested. Use demo-ready for a final browser/demo milestone.

If app-workflow is unavailable, explain the missing local installation and refer to ~/Projects/app-toolkit/README.md; do not silently install unrelated tools or spawn a replacement agent framework.
