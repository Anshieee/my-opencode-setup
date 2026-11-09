---
name: hill-climbing
description: Use when the user explicitly wants iterative improvement against fixed evals and independent council scores until all targets pass. Not for ordinary one-shot implementation or vague quality claims.
---

# Eval-driven hill climbing with independent council

The user sets the goal and acceptance contract. The dev controller owns implementation/subagents and integration. The native app-council plugin runs the fixed checks and the selected blind tool-free council reviews. Existing /goal owns continuation; /loop can schedule an already-defined bounded iteration instead, but never start both as competing drivers.

## Establish the contract

Use the current spec and repo facts. Ask only missing decisions. Identify testable behavior, a scoring rubric (0..10 with concrete anchors), target for each criterion, immutable checks, declared text artifacts the council can inspect, protected evaluation files, editable scope and iteration/time limits. Separate machine-measured facts from model judgment. Do not promise that a council score proves production quality. For visual or usability criteria, require an actual browser/accessibility/screenshot evaluator and saved evidence; the text-only council cannot view screenshots.

Write `.hillclimb/contract.json`, show the user its concrete checks/rubric/scope/budget and start only after they authorize the run. A standing authorization recorded by the user counts as authorization for every run in its scope: this user granted standing authorization for autonomous hill-climbing on 2026-11-06, so do not re-ask per run — still show the contract/budget, still enforce the contract's maxRounds/maxMinutes caps, and still require review before starting a changed contract. Defaults when not specified: maxRounds20 and maxMinutes60; explain them in the contract. Prefer tighter task-specific limits. User may change them before starting. `goal` token/turn limits may stop sooner. No automatic external publishing, deployments or unrelated config changes.

Required schema: version1, goal:string, checks:[{name,argv:string[],timeoutSeconds:1..600}], criteria:[{id,description,target:0..10}], artifacts:[relative text file paths], protectedFiles:[relative eval/test paths], maxRounds:positive integer<=1000, maxMinutes:positive number. Optional editableFiles, nonGoals and rubric anchors are descriptive constraints. Paths are relative to the session's project directory. Tests/fixtures/eval definitions belong in protectedFiles. Contract hash and protected-file hashes freeze when the run starts. Prefer small decisive artifact selections that fit context.

Start with `/hill-climb run .hillclimb/contract.json`. This forwards to existing /goal and registers the per-session completion gate. `/hill-climb setup <goal>` only prepares the contract. Use this registered command for a scored goal; loading the skill alone does not register a run. Only the main controller invokes hillclimb_evaluate. Implementation subagents run the fixed test commands and return evidence; they must not start another goal/council loop. Existing ordinary /goal sessions still work independently.

## One bounded iteration

1. Read SPEC.md, TASK_LEDGER.md, the frozen contract and last saved eval report. Inspect current Git state. Save original dirty changes; use a disposable experiment branch/worktree or exact owned-file snapshots. Never reset unrelated work, erase user changes, amend their commits or use blanket git reset --hard.
2. Run hillclimb_evaluate with the relative contract path for baseline/current state. The tool executes checks itself and scores declared artifacts independently. Use the report path, actual command exits, all selected scores and blockers. Never fabricate an eval result or substitute your own score.
3. If passed:true, verify the declared files are unchanged, perform any remaining agreed whole-change review, and complete the goal with concrete report links/check results. A subsequent edit invalidates the certificate and requires reevaluation. Missing review or other acceptance work still prevents completion even if the scoring tool passed.
4. Otherwise identify the specific failed check/criterion. Form one focused improvement hypothesis. Implement inline for a small change or use bounded dev-coder/specialists for substantial work; supply file ownership and acceptance details. Use TDD for behavior changes and systematic-debugging for failures. Reviewers do not implement their own proposals.
5. Run hillclimb_evaluate again after each candidate. Keep a candidate only if fixed checks remain satisfied and the worst-reviewer score for each criterion does not regress, with at least one measurable improvement. A real hard-check failure resolved counts as improvement. A passing candidate wins. Treat errors/unstable results as unverified, not improvement. Revert only that candidate's owned delta if worse; preserve its report. Repeated noise needs repeat measurements under the same conditions, not an adjusted rubric.
6. Record the candidate diff/commit, report link, per-reviewer scores, check results, keep/discard reason and next hypothesis in TASK_LEDGER.md. Report one useful short update per iteration. Continue immediately through the current goal while targets are unmet and resources allow. Do not ask routine permission to continue.

The plugin passes only when all check processes exit0, every selected council member meet EVERY target without material blockers, and the frozen contract/protected files/artifacts stayed stable. It never averages away a failing reviewer, treats provider errors as success, or lets the builder grade itself. The saved tool evidence remains available for debugging.

## Stop, resume and scope changes

Stop on passing acceptance, explicit user stop, contract budget, provider/rate/permission limit or a concrete external blocker. A budget stop is incomplete, with exact unmet criteria and best saved candidate; never lower targets to finish. Use native goal status/limit behavior rather than spawning another daemon. Native /goal pause and /goal resume are the controls. Resume reads the ledger and plugin state; it does not silently reset the run budget or contract. Explicitly starting a new /hill-climb run registers a new run; review/authorize any changed contract first. Do not alter a usage-limited unrelated goal.

Council can also be called once with /council, /council-arch, /council-review or /council-debug. Save expensive broad council discussions for real decisions. The scored hill-climb eval already invokes the selected independent reviewers; avoid redundant full councils every turn.

## Council panel selection

Focused is3 lenses (correctness, architecture, jester); app is4 (correctness, product/UX, security, jester); full is7 including reliability and performance. Set councilPreset to focused/app/full in the reviewed contract, or start /hill-climb run --app <contract> or --full <contract>. Member definitions, models and concurrency are frozen at run start; later global/project council config edits do not alter this run. All selected members must meet every target, without averaging away failures. Two existing Go model architectures are reused across the initial seven role lenses, not seven distinct models. More reviewers mean more provider calls; show the selected panel and limits before starting. At most two calls run concurrently.


## Strict scoring for new runs

New runs freeze evidence-strict-v1. Scores are integer evidence grades, not praise: 0 no usable proof, 1-2 partial, 3-4 demonstrated core, 5-6 edge and failure paths, 7 regressions, 8 separate independent validation, 9 all these without known gaps. The parser verifies exact excerpts against supplied artifacts and executed check output, then caps scores when coverage evidence is absent. Coverage classification remains model judgment. Passing stdout alone is not coverage proof. Include meaningful case/results output and protected evaluator source in the evidence. Never add tests merely to game categories.

Ten is unavailable without criterion.perfectScoreCheck naming a declared frozen check, and requires evidence for all lower levels plus no limitations. Use that field only for an explicitly bounded property with an agreed exhaustive proof, never an entire app's perfection. New contracts should normally target 7 or 8 with concrete task-specific anchors; do not lower a user's existing target. Show these standards during setup.

Two consecutive qualifying evaluations of identical declared artifact hashes are required to pass. After an eligible-but-unconfirmed result, rerun hillclimb_evaluate without changing code for an independent confirmation; do not fabricate another change. Any failed evaluation or artifact change resets confirmation. Each round consumes the same declared budget. Two rounds reduce random optimism but do not prove universal quality. No score-increase cap: a large improvement can be valid when previously missing proof is supplied. Explain that distinction using report evidence.

Existing frozen runs retain legacy scoring. Explicitly start a new reviewed run to use this policy; never silently reset a running experiment's contract or budget.
