---
name: atomic-orchestrator
description: Use when a project explicitly requires the atomic-orchestrator skill for delegation or multi-file work.
---

# Atomic task compatibility

Read and execute the project's Orchestration defaults as the authoritative atomic-task contract. The development controller provides the bounded delegation and verification workflow when the project has no such section. Keep ownership, dependencies, acceptance commands and integration evidence explicit; the controller owns shared contracts and the final acceptance decision.

This entry preserves projects that still name atomic-orchestrator after the earlier skill cleanup. It adds no scheduler, tools, provider settings or reporting template. Continue through the existing /goal and /loop mechanisms.
