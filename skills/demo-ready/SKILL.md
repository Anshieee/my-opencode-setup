---
name: demo-ready
description: Verify and prepare an app's main browser journey, fictional demo data, reset path, and concise demonstration instructions before a demo or handoff.
---

Inspect the app's SPEC.md, task ledger and .app-workflow.json. Run `app-workflow doctor --project PATH`; for an existing app without a manifest use its documented commands and do not migrate its stack. State which user journey is the agreed demonstration. Run focused checks during fixes, then the full agreed checks/build and browser smoke before completion. Preserve exact commands, exits, failures and skipped checks; never infer a browser result from a build.

Toolkit projects expose `check`, `build`, `smoke`, `demo` and `demo-reset` actions. Smoke should use the production preview and exercise create/update/reload, desktop/mobile sizes, and offline fallback. Inspect the saved trace/screenshot/report, not just the command exit. Keep unrelated development servers running; choose a free port or report an ownership conflict rather than killing them. Test real UI behavior where the host has browser tools. Chromium viewport emulation is not a physical phone/install test.

Prepare only fictional demo data in its separate namespace. `demo-reset` must not delete live/shared Supabase data or clear unrelated browser storage; use the documented local reset path. Demonstrate normal and empty states and one representative failure. Keep any mocked behavior clearly identified; it does not verify the real API/auth. Do not cache private account pages or backend responses for the fallback-only PWA. Offline editing/sync and push are out of scope unless separately agreed.

Write a short DEMO.md or update the existing one with prerequisites, reset/start commands, URL, a brief sequence of actions, expected results, and a fallback if the external integration is unavailable. Include evidence links, known limitations and real deployment status. No automatic publishing, production resets, cloud provisioning or broad new monitoring service. Use the existing fresh independent review/council only when requested or justified by the change; don't invoke every reviewer for a tiny UI adjustment.
