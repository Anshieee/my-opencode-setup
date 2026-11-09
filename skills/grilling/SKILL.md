---
name: grilling
description: Interview the user one decision at a time with OpenCode's native selectable question menu. Use when the user asks to grill an idea, plan or design.
---

# Question-first interview with native menus

Interview until you and the user share an explicit understanding of the idea. Map dependencies as a design tree internally, but ask only the next decision whose prerequisites are settled.

For EACH decision, call OpenCode's native `question` tool with a `questions` array containing EXACTLY ONE question. Use a short header, a complete plain-language question and two to four meaningful choices with short descriptions. Put the recommended option first and append `(Recommended)` to its label. Use `multiple:false` unless this one decision actually needs several selections. OpenCode supplies a custom-answer option automatically; do not add an Other choice yourself.

Wait for the selected answer before asking the next question. Do not print a numbered questionnaire, all frontier questions, or several questions in chat. Do not ask the user to type out a list of answers. The terminal menu owns the choices; chat can provide one short sentence of context when useful. Avoid unexplained jargon; frame choices around the user's app and consequences.

Finding facts is your job. Inspect the workspace, available integrations and project rules; delegate a bounded read-only investigation when useful. Ask the user for decisions, not facts you can find. Investigating one unknown need not block an independent question, but never ask a question whose answer depends on an unsettled prerequisite.

If the native question tool is unavailable in a noninteractive client, state that precise limitation and ask just ONE plain-text question, then wait. Never fall back to a batch. If the user dismisses a menu, wait for their steering instead of treating the recommended choice as consent.

Record settled decisions and remaining unknowns in the current conversation. Do not invent certainty or silently pick product decisions. Prototype a genuinely unanswerable design choice if the user wants to try it, then return to the interview.

When the decision frontier is empty, use one native question menu to confirm shared understanding. Do not implement until the user confirms. Save SPEC.md/acceptance criteria only when requested or agreed; this interview does not automatically publish issues or change the project.
