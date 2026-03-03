# Validation Report: Autonomous Agents Architecture

**Auditor:** @pedro-valerio (Process Absolutist)
**Date:** 2026-03-01
**Status:** CONCERNS (7 FAIL, 19 CONCERNS, 16 PASS across 42 validation points)
**Architecture Under Review:** Autonomous Agents Architecture: From Single-Daemon to Governed Agent Fleet (`autonomous-agents-architecture.md`)
**Baseline:** `session-daemon-phase0.md` (CONCERNS verdict, 3 FAIL), `session-daemon-phase0-validation.md`, `telegram-observability-validation.md` (FAIL verdict, 15 FAIL), `agent-authority.md`, `workflow-execution.md`, `constitution.md`

---

## Executive Summary

This is the most ambitious architecture I have audited in this project. It proposes evolving the AIOS from a single shared Claude Code session (currently implemented in `packages/session-daemon/`) to a Master-Worker fleet where the Orchestrator spawns isolated Worker processes, each running its own Claude SDK session with per-agent authority profiles. The scope is enormous: 8 new modules, 5 implementation phases, 10-17 weeks of estimated work.

The architecture makes several genuinely strong decisions. The Master-Worker model correctly avoids the RAM problem of 11 persistent daemons. Filesystem-based IPC extends the existing battle-tested inbox/outbox pattern. Per-agent `denied_bash_patterns` enforces Authority Matrix at the process level. The 5-phase incremental roadmap allows each phase to ship independently.

However, the architecture suffers from a class of problem I have seen across every audit in this project: **it builds a skyscraper on a foundation that has not been poured yet.** The Session Daemon Phase 0 (the foundation this architecture depends on) received a CONCERNS verdict with 3 FAILs, including untested load-bearing assumptions about `settingSources` loading CLAUDE.md and `resumeSession()` reliability. Those FAILs have not been resolved. The Phase 0 implementation exists in `packages/session-daemon/` but the R0 verification script (my blocking recommendation from the Phase 0 audit) has not been confirmed as passing. This architecture assumes Phase 0 is solid and proceeds to define Phases 1-5 on top of it.

Additionally, there are structural governance gaps. The `denied_bash_patterns` mechanism is a string matching heuristic that can be bypassed. The QA Loop workflow allows infinite loops under certain conditions. The @devops Worker has `denied_tools: [Write, Edit]` but can still modify files via Bash. And the entire overnight execution system relies on the Orchestrator itself being infallible -- but there is no watchdog watching the watchdog.

### Verdict Summary

| Category | Count |
|----------|-------|
| PASS | 16 |
| CONCERNS | 19 |
| FAIL | 7 |
| **Total** | **42** |

### Comparison to Previous Audits

| Metric | Telegram Obs. (v3) | Session Daemon P0 | This Architecture |
|--------|--------------------|--------------------|-------------------|
| FAIL | 15 | 3 | 7 |
| CONCERNS | 11 | 12 | 19 |
| PASS | 5 | 10 | 16 |
| Showstoppers | 1 (statefulness) | 0 | 0 |
| Verdict | FAIL | CONCERNS | CONCERNS |

No showstoppers this time. The statefulness problem is solved (in principle) by the SDK. But the volume of unresolved concerns is the highest across all audits, which is proportional to the scope.

---

## Table of Contents

1. [Foundation Dependency: Phase 0 Status](#1-foundation-dependency-phase-0-status)
2. [Constitution Compliance](#2-constitution-compliance)
3. [Authority Matrix Preservation](#3-authority-matrix-preservation)
4. [Workflow Flow Validation](#4-workflow-flow-validation)
5. [Governance Engine Analysis](#5-governance-engine-analysis)
6. [Overnight Execution](#6-overnight-execution)
7. [Memory and State](#7-memory-and-state)
8. [Concurrency and Resource Management](#8-concurrency-and-resource-management)
9. [Event Bus and IPC](#9-event-bus-and-ipc)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Structural Process Audit](#11-structural-process-audit)
12. [Summary Matrix](#12-summary-matrix)
13. [Recommendations](#13-recommendations)

---

## 1. Foundation Dependency: Phase 0 Status

### V1.1: Session Daemon Phase 0 FAILs Resolution

**Verdict: FAIL -- Foundation not verified**

My Phase 0 audit (session-daemon-phase0-validation.md) identified 3 FAILs:

| Phase 0 FAIL | Resolution Status | Impact on This Architecture |
|-------------|-------------------|---------------------------|
| V1.2: `settingSources` loading CLAUDE.md | UNKNOWN | If CLAUDE.md does not load, no Worker has agent definitions, authority matrix, or Constitution |
| V4.2: `resumeSession()` reliability | UNKNOWN | Workers use fresh sessions (mitigated), but Orchestrator recovery depends on session state |
| V10.3: Filesystem atomicity for pickup | UNKNOWN | The event bus extends the same pattern -- same atomicity gap now multiplied across 11+ agent inboxes |

The architecture document references "session-daemon-phase0.md" in its preamble but does not explicitly state that R0 (the pre-implementation verification script) has passed. The existing code in `packages/session-daemon/src/session-adapter.js` implements V2/V1 SDK integration, but whether `settingSources` actually loads CLAUDE.md remains undocumented.

**Why this is FAIL:** This architecture builds 8 new modules on top of Session Daemon Phase 0. If the Phase 0 foundation has unresolved FAILs, every module inherits those FAILs. The architecture document should have opened with: "Phase 0 verification (R0) has been executed and confirmed: [results]."

**Veto condition:** Before this architecture is approved for implementation, R0 results must be documented. If R0 was executed and passed, cite the evidence. If R0 has not been executed, execute it first.

### V1.2: Existing Code vs. Architecture Alignment

**Verdict: PASS**

The existing `packages/session-daemon/` code aligns well with the architecture's "Current Architecture Baseline" (Section 3). The code implements exactly what the document describes:

- `src/index.js`: SessionDaemon orchestrator (single process)
- `src/inbox-watcher.js`: InboxWatcher (chokidar-based)
- `src/command-queue.js`: CommandQueue (FIFO)
- `src/session-adapter.js`: SessionAdapter (V2+V1 SDK fallback)
- `src/stream-processor.js`: StreamProcessor
- `src/outbox-writer.js`: OutboxWriter
- `src/health-monitor.js`: HealthMonitor

The architecture correctly identifies these as the starting point for evolution. Section 11.1 maps each existing file to its fate in the new architecture (EVOLVES, MOVED, NEW). This is traceable and honest.

---

## 2. Constitution Compliance

### V2.1: Article I -- CLI First

**Verdict: PASS**

Design Principle P1 explicitly states: "All agent orchestration via CLI/filesystem. No web UI required." The Orchestrator is a systemd service controlled via CLI. The Telegram Bridge is observability only. The overnight schedule is generated from a CLI-initiated command (`/overnight` comes from Telegram, but the Orchestrator could equally accept it from the filesystem inbox). No web UI is introduced or required.

The architecture does introduce Telegram commands (`/kill`, `/halt`, `/push`, `/overnight`, `/approve`) that have CONTROL authority, not just observability. This deserves scrutiny:

- `/kill` kills all workers
- `/halt` stops the Orchestrator entirely
- `/push` triggers @devops git push
- `/overnight` schedules autonomous work
- `/approve` authorizes overnight execution

These are CONTROL commands, not observation. However, they are routed through the same inbox/outbox mechanism as any other command. They could equally be invoked via CLI (`echo '{"command":"/kill"}' > .aios/inbox/pending/cmd.json`). Telegram is a delivery mechanism, not the control plane.

**Assessment:** CLI First is preserved. Telegram is a convenient delivery channel for commands that are fundamentally CLI-executable.

### V2.2: Article II -- Agent Authority (Structural Enforcement)

**Verdict: CONCERNS -- See Section 3 for full analysis**

The architecture claims Article II is enforced "structurally at the process level." This is the central innovation of the architecture. Analysis is in Section 3.

### V2.3: Article III -- Story-Driven Development

**Verdict: PASS**

The Task Schema (Section 7.2) includes `workflow.id`, `context.story_id`, `context.story_path`. Every task is traceable to a story. The Workflow Engine (Section 7) orchestrates the SDC 4-phase workflow where each phase is a task assigned to the correct agent.

The overnight schedule (Section 9.2) ties tasks to story IDs. The cost tracking is per-task, which is per-story. The audit trail records `task_id` which maps to `story_id`.

### V2.4: Article IV -- No Invention

**Verdict: PASS**

The architecture is traced to:
- Market research findings (L3 autonomy level, 60-80% success rate for <2h tasks)
- Phase 0 architecture (Session Daemon foundation)
- Existing code patterns (inbox/outbox, health monitor)
- Constitution requirements (authority matrix, CLI First)
- Physical constraints (8GB RAM, 2 CPU cores)

Decision D7 (overnight autonomy level) explicitly cites market research. Decision D1 (execution model) cites RAM constraints. No features appear invented without requirements backing.

### V2.5: Article V -- Quality First

**Verdict: CONCERNS**

The architecture defines quality gates at multiple levels:
- Pre-flight: Constitution gate, authority check, budget check
- Runtime: Sentinel monitoring, drift detection
- Post-flight: Output validation, git diff check

However, the existing quality gates from the Constitution (lint, typecheck, test, build) are not explicitly wired into the Worker lifecycle. When Worker @dev completes a story implementation, does the Worker run `npm run lint`, `npm run typecheck`, `npm test` before reporting `task_completed`?

The architecture does not specify whether Workers execute quality gates as part of their task, or whether quality gates are separate tasks dispatched by the Workflow Engine. If Workers are expected to self-enforce quality gates, this relies on the system prompt ("You are @dev, run tests before reporting done") which is advisory, not structural.

**Recommendation:** Quality gates should be explicit steps in the task definition:
```json
{
  "post_conditions": [
    {"command": "npm run lint", "expect": "exit_code_0"},
    {"command": "npm test", "expect": "exit_code_0"}
  ]
}
```

### V2.6: Article VI -- Absolute Imports

**Verdict: PASS (not directly relevant)**

Article VI is a code style rule. The architecture does not introduce new application code patterns. Workers will use whatever import style their task requires, governed by ESLint rules already in place.

---

## 3. Authority Matrix Preservation

### V3.1: @devops Exclusive Authority (git push, PR creation)

**Verdict: PASS**

The Worker profile for @devops (Section 5.4) has `allowed_bash_patterns: ["git push", "gh pr"]`. All other agents have `denied_bash_patterns: ["git push", "gh pr create", "gh pr merge"]`.

This is structural enforcement at the SDK configuration level. The `denied_bash_patterns` are applied before bash command execution, preventing the operation at the tool invocation layer.

The SDC workflow correctly maps the push step to @devops: the overnight flow stops at "branches ready for push" and requires explicit `/push` command, which dispatches to Worker @devops.

### V3.2: @qa Read-Only Enforcement

**Verdict: FAIL -- Incomplete enforcement**

The @qa Worker profile specifies:
```yaml
denied_tools:
  - Write
  - Edit
```

This prevents @qa from using the `Write` and `Edit` tools. However, @qa still has `Bash` in its `allowed_tools` list. Via Bash, @qa can execute:

```bash
echo "malicious content" > src/component.tsx
sed -i 's/old/new/g' src/component.tsx
node -e 'require("fs").writeFileSync("src/x.js", "hack")'
```

The `denied_bash_patterns` for @qa are: `["git push", "rm -rf"]`. These do not cover arbitrary file writes via `echo >`, `sed`, `tee`, `cp`, `mv`, `node -e`, `python -c`, or any other shell command that modifies files.

**Why this is FAIL:** The architecture claims @qa is "READ-ONLY" and "CANNOT modify files." This is enforced at the SDK tool level (Write/Edit blocked) but not at the Bash level. The system prompt says "You are READ-ONLY" but this is advisory, not structural. A sufficiently creative LLM response could write files through Bash.

**The architecture's own design principle P2 states: "Authority is structural, not advisory."** The @qa Worker violates P2 by relying on system prompt for file modification prevention while leaving Bash as a write-capable escape hatch.

**Mitigation options:**
1. Remove `Bash` from @qa's `allowed_tools` entirely (most restrictive)
2. Add comprehensive `denied_bash_patterns` for file modification: `["echo.*>", "sed -i", "tee ", ">", ">>", "cp ", "mv ", "node -e", "python -c"]` (fragile, always bypassable)
3. Use systemd `ReadWritePaths` to make the codebase read-only for @qa Worker's cgroup (OS-level enforcement -- the architecture mentions this in Section 8.1 Layer 2 but does not implement it for @qa)

**Recommendation:** Option 3 is the only process-correct solution. If @qa Worker runs under a systemd transient unit with `ReadWritePaths=/tmp ReadOnlyPaths=/home/ubuntu/aios-core`, the OS prevents all file writes regardless of how the command is crafted. This aligns with P2. But this is deferred to Phase 5 (systemd transient units), meaning @qa is NOT read-only in Phases 0-4.

### V3.3: @devops File Modification Restriction

**Verdict: FAIL -- Same class of bug as V3.2**

The @devops Worker profile specifies:
```yaml
denied_tools:
  - Write
  - Edit
```

But @devops has `Bash` in allowed_tools with `allowed_bash_patterns: ["git push", "gh pr"]`. However, `allowed_bash_patterns` is an ALLOWLIST, not a DENYLIST. If the implementation treats `allowed_bash_patterns` as "only these bash commands are permitted," then @devops is indeed restricted to git push and gh pr operations only.

But the architecture does not specify whether `allowed_bash_patterns` is an allowlist (only these commands work) or a supplementary list (these commands work IN ADDITION to everything not denied). The worker profile schema shows:

- @dev has `denied_bash_patterns` (denylist approach)
- @devops has `allowed_bash_patterns` (allowlist approach)

**These are two different enforcement models used on different agents.** The architecture must clarify: does `allowed_bash_patterns` mean "ONLY these commands" or "these commands are ADDITIONALLY allowed"?

If it means "ONLY these commands," @devops is properly restricted. If it means "additionally allowed," @devops can run any bash command not explicitly denied, which means @devops can modify files via echo/sed/etc.

**Recommendation:** Clarify the semantic model. If an agent has BOTH `denied_bash_patterns` AND `allowed_bash_patterns`, which takes precedence? Define this unambiguously:

```yaml
bash_enforcement_mode: "allowlist"  # Only allowed_bash_patterns execute
# OR
bash_enforcement_mode: "denylist"   # Everything except denied_bash_patterns executes
```

### V3.4: @architect Authority Scope

**Verdict: CONCERNS**

The @architect Worker profile allows `Write` and `Edit` tools with no file path restrictions at the SDK level. The system prompt says "Design only, no implementation." But @architect could write implementation code to any file.

Section 8.1 Layer 2 mentions `ReadWritePaths` systemd restrictions, but no specific paths are defined for @architect. The architecture mentions "ALLOWED (docs only)" for @architect file writes in the authority table (Section 8.2), but this "docs only" restriction is not implemented structurally.

**Assessment:** For the current codebase where @architect writes to `docs/architecture/`, this is low risk. But the principle violation remains: the restriction is advisory, not structural.

### V3.5: Missing Agents in Worker Profiles

**Verdict: CONCERNS**

The architecture defines Worker profiles for 4 agents: @dev, @qa, @architect, @devops. The AIOS has 11 agents: @dev, @qa, @architect, @devops, @pm, @po, @sm, @analyst, @data-engineer, @ux-design-expert, @aios-master.

7 agents have no Worker profile defined. Section 5.4 says "Other agents can be added following the same pattern." This is correct as an extensibility statement, but for a governance-focused architecture, the missing profiles are a gap.

**Key concern:** @aios-master has no Worker profile. In the current architecture, @aios-master "can execute ANY task directly" and "override agent boundaries." How does this translate to Worker profiles? Does @aios-master run with zero restrictions (no denied tools, no denied bash patterns)? If so, this should be documented explicitly.

**Recommendation:** At minimum, define profiles for @aios-master and the 3 SDC-critical agents (@sm, @po, @pm) that appear in Workflow Engine Phase 3.

---

## 4. Workflow Flow Validation

### V4.1: Story Development Cycle (SDC) Automation

**Verdict: PASS**

Section 6.4 provides a concrete flow for SDC Phase 3 -> Phase 4 transition:

1. @dev Worker completes implementation
2. Writes `task_completed` event to `events/pending/`
3. Orchestrator EventBus detects new event
4. Governance Engine validates authority
5. Workflow Engine checks story status
6. Task Dispatcher creates QA task in `workers/qa/inbox/`
7. Orchestrator spawns Worker @qa
8. QA gate executes

This is unidirectional. Each step produces an output that the next step consumes. No step feeds back to a previous step in the happy path.

### V4.2: QA Loop Bounded Iteration

**Verdict: FAIL -- Infinite loop possible**

The existing QA Loop workflow (from `workflow-execution.md`) has `max_iterations: 5`. The architecture's Workflow Engine must enforce this. But the architecture does not specify how the Workflow Engine tracks QA Loop iteration count.

**Scenario for infinite loop:**

1. @dev implements story 2.1 (task A)
2. @qa reviews, verdict: REJECT (task B)
3. Workflow Engine creates fix task for @dev (task C -- iteration 1)
4. @dev fixes (task C completes)
5. @qa re-reviews, verdict: REJECT (task D -- iteration 2)
6. ...repeat...

Where does the iteration counter live? Options:
- In the `workflows` SQLite table? (Section 10.4 has no `iteration_count` column)
- In the event payload? (task_completed does not carry iteration count)
- In the Workflow Engine's in-memory state? (Lost on restart)

The SQLite `workflows` table schema (Section 10.4) has:
```sql
current_phase TEXT,
current_step INTEGER,
context TEXT  -- JSON blob
```

The `current_step` could theoretically encode iteration count, but this conflates step progression with iteration tracking. The `context` JSON blob is unspecified.

**Why this is FAIL:** The QA Loop is a bounded loop. If the bound is not enforced structurally, the loop can run forever (each iteration spawns a new Worker, consumes tokens, burns budget). The architecture defines `max_iterations_reached` as an escalation trigger (Section 2, QA Loop) but does not specify WHERE the counter is maintained or HOW it is incremented in the distributed Worker model.

**Recommendation:** Add `iteration_count INTEGER DEFAULT 0` to the `workflows` SQLite table. The Workflow Engine increments this on each `task_completed` event that triggers a re-review. When `iteration_count >= max_iterations`, the Workflow Engine emits `escalation` event instead of creating another fix task.

### V4.3: SDC Phase Dependencies

**Verdict: PASS**

The dependency graph (Section 7.4) correctly models SDC:

```
[validate] ---> [implement] ---> [qa-gate] ---> [push]
     |               |               |             |
   @po done      @dev done       @qa done    @devops done
```

The Task Dispatcher runs topological sort on the dependency graph. Circular dependency detection is specified. A task is only dispatched when all `depends_on` tasks have status `completed`.

The `depends_on` field in the task schema (Section 7.2) is an array of task IDs. This allows complex dependency chains without ambiguity.

### V4.4: Spec Pipeline and Brownfield Discovery

**Verdict: CONCERNS**

The architecture mentions these workflows in Phase 5 ("Advanced Features"). But the Workflow Engine (Phase 3) is designed around SDC and QA Loop only. The Spec Pipeline has conditional skip logic (Section "Spec Pipeline" in workflow-execution.md):

- SIMPLE class skips phases 2, 3 (assess, research)
- COMPLEX class adds revision cycles

The Workflow Engine must support conditional branching, not just linear dependency chains. The architecture does not address this. The `workflows` table has `current_phase` and `current_step` but no mechanism for conditional skip.

**Assessment:** This is deferred to Phase 5, so it is not blocking Phases 0-4. But the Workflow Engine design should at least MENTION that it needs to support conditional logic, or Phase 5 will require a rewrite rather than an extension.

### V4.5: Brownfield Discovery Integration

**Verdict: CONCERNS**

Same issue as V4.4. Brownfield Discovery is a 10-phase workflow with a QA Gate in Phase 7 that can loop back to Phase 4. This is a non-trivial state machine that the current Workflow Engine design does not accommodate.

---

## 5. Governance Engine Analysis

### V5.1: Pre-Flight Constitution Gate (Layer 1)

**Verdict: PASS**

Pre-flight checks are specified:
- Authority: "Can this agent perform this task?"
- Budget: "Is cost within limits?"
- Dependencies: "Are prerequisites met?"
- Constitution: Article check against task definition

These checks happen BEFORE the Worker is spawned. A rejected task never consumes SDK tokens. This is cost-efficient and structurally sound.

### V5.2: Structural Enforcement (Layer 2) -- denied_bash_patterns

**Verdict: FAIL -- String matching is bypassable**

`denied_bash_patterns` for @dev: `["git push", "gh pr create", "gh pr merge"]`

These are substring matches. They can be bypassed:

```bash
# All of these bypass "git push" pattern matching:
git     push origin main          # extra spaces
GIT PUSH ORIGIN MAIN              # case variation
/usr/bin/git push origin main     # absolute path
git -c push.default=current push  # flag before subcommand
g\it pu\sh                        # backslash escaping
$(echo git) $(echo push)          # command substitution
eval "git push"                   # eval
bash -c "git push"               # subshell
```

The architecture does not specify the pattern matching algorithm. Is it:
- Substring match: `command.includes("git push")` (most bypassable)
- Regex match: `/git\s+push/i.test(command)` (better but still bypassable via eval/subshell)
- AST-level: Parse bash command and check semantics (complex but thorough)
- SDK-level: Intercept at the tool invocation layer before shell execution

The SDK's `deniedBashCommands` config (if it exists in the Claude Agent SDK) would be the structural solution. But the architecture does not specify whether `denied_bash_patterns` is a custom implementation or an SDK feature.

**Why this is FAIL:** The architecture's own principle P2 states "Authority is structural, not advisory." Pattern-based string matching on bash commands is one step above advisory. A determined LLM could craft a command that evades the pattern. This is not a theoretical concern -- LLMs are known to be creative with shell syntax.

**Mitigation:** The 4-layer defense (SDK tool whitelist + bash pattern + systemd ReadWritePaths + stream sentinel) provides defense in depth. Layer 3 (systemd) would catch the bypass. But Layer 3 is deferred to Phase 5. In Phases 0-4, `denied_bash_patterns` is the primary mechanism, and it is bypassable.

**Recommendation:** At minimum, document the pattern matching algorithm explicitly. Use regex with case-insensitive matching. Add patterns for `eval`, `bash -c`, `sh -c`, `exec`, and absolute path variants. Accept that this is defense-in-depth Layer 2 (heuristic) and that Layer 3 (systemd) is the structural guarantee when it arrives in Phase 5.

### V5.3: Runtime Sentinel (Layer 3)

**Verdict: CONCERNS**

The Runtime Sentinel (Section 8.3) monitors the Worker's output stream for:
1. Goal re-injection every N tool calls
2. File scope monitoring
3. Token velocity monitoring
4. Time-based checkpoints

**Concern 1: How does the Sentinel access the Worker's stream?**

The Worker runs as a child process (child_process.fork). The Orchestrator can monitor stdout/stderr. But the SDK stream (tool calls, responses) is internal to the Worker process. The Sentinel would need either:
- IPC messages from Worker to Orchestrator reporting each tool call (adds latency)
- The Worker writing tool call events to a file that the Sentinel watches (filesystem latency)
- The Orchestrator intercepting the SDK stream directly (not possible without being inside the Worker process)

The architecture does not specify this mechanism. It says "Stream watcher monitors worker's output stream" but the SDK stream is consumed inside the Worker, not visible to the Orchestrator.

**Concern 2: Goal re-injection into the Worker's stream**

"Every N tool calls, the Orchestrator injects a system message into the worker's stream."

How? The Worker owns its SDK session. The Orchestrator cannot inject messages into an SDK session it does not own. Options:
- Write to the Worker's inbox, and the Worker checks between tool calls (cooperative)
- Use IPC to signal the Worker to self-inject (cooperative)
- The SDK supports external message injection (unknown)

If cooperative, the Worker must check for Sentinel messages. If the Worker is in the middle of a long tool call (e.g., running tests for 5 minutes), it cannot check until the call completes.

### V5.4: Post-Flight Validation (Layer 4)

**Verdict: PASS**

Post-flight checks are well-specified:
- Validates output artifacts exist
- Checks git diff for unauthorized changes
- Verifies no file modifications outside scope
- Records audit trail

These are filesystem operations the Orchestrator can perform after the Worker exits. No access to the Worker process is required. This is structurally sound.

### V5.5: Kill Switch Hierarchy

**Verdict: PASS**

The 5-level kill switch (Section 8.4) is well-designed:
- Level 1: PAUSE (reversible, cooperative)
- Level 2: TERMINATE (SIGTERM, 30s graceful)
- Level 3: KILL (SIGKILL, immediate)
- Level 4: KILL ALL (emergency)
- Level 5: SYSTEM HALT (Orchestrator stops)

Each level is more severe and less recoverable. The triggers are clearly mapped. The escalation from automated (Levels 1-3) to manual (Levels 4-5) is correct.

### V5.6: Audit Trail Completeness

**Verdict: PASS**

The audit schema (Section 8.5) captures: timestamp, type, agent, operation, result, reason, task_id, constitution_article. The SQLite `audit` table (Section 10.4) mirrors this schema. Rotation is daily, retention is 30 days.

The audit trail is append-only (INSERT INTO audit). Workers cannot modify audit entries. The Orchestrator is the sole writer.

---

## 6. Overnight Execution

### V6.1: Task Categorization (Overnight-safe vs. Not)

**Verdict: PASS**

Section 9.1 correctly categorizes:
- YES: Bug fixes, story implementation, tests, docs, refactoring, QA gate, architecture analysis, research
- NO: git push, PR creation, deploy, schema migrations
- CONDITIONAL: New architectural decisions (if cost > $5)

The NO category precisely maps to @devops exclusive operations (Constitution Article II). The architecture is consistent: overnight agents cannot do what they are not authorized to do during the day.

### V6.2: Budget Enforcement

**Verdict: CONCERNS**

Per-task budget (`governance.budget_limit_usd: 5.00` in task schema) and per-overnight budget (`budget_limit_usd: 25.00` in schedule) are defined.

**Concern 1: Budget tracking accuracy**

The CostTracker (Section 9, implied) must track token usage in real-time. But token counts are only available AFTER the SDK processes a turn. The CostTracker cannot prevent a token-expensive turn from executing; it can only detect the budget exceeded AFTER the turn completes.

This means a single expensive turn could exceed the budget significantly before the kill switch activates. Example: @architect (using Opus at $5/Mtok input + $25/Mtok output) generates a 100K output token response ($2.50) that pushes the budget from $4.50 to $7.00 (exceeding the $5.00 per-task limit by 40%).

**Concern 2: Cost tracking source**

The architecture does not specify WHERE token counts come from. Options:
- SDK stream messages (if the SDK reports token usage per turn)
- Anthropic API usage dashboard (post-hoc, not real-time)
- Token counting on the prompt/response text (estimate, not exact)

If the SDK does not report token counts, the CostTracker is blind.

**Recommendation:** Specify the token count source. If the SDK provides usage metadata in stream messages, use that. If not, use tiktoken-equivalent estimation with a 20% safety margin (stop at 80% of budget, not 100%).

### V6.3: Escalation During Overnight

**Verdict: PASS**

The escalation matrix (Section 9.4) defines 4 severity levels with clear actions. Severity 4 (CRITICAL) triggers dual notification (Telegram + WhatsApp via OpenClaw). The WhatsApp fallback using `openclaw message send` is a direct reference to the existing CLAUDE.md configuration.

### V6.4: Overnight Schedule Approval

**Verdict: PASS**

The flow is: User sends `/overnight` -> Orchestrator generates schedule -> sends to Telegram for review -> User sends `/approve` -> execution begins. This is a two-step approval flow that prevents accidental overnight execution.

The schedule JSON includes `approved: true/false`. The Orchestrator does not start overnight tasks until `approved` is true. This is a structural gate.

### V6.5: Recovery from VPS Restart During Overnight

**Verdict: CONCERNS**

Section 10.3 defines a 7-step recovery sequence. But:

**Concern:** Step 4 asks "Was it near completion?" and proposes "Check git status for partial work." How does the Orchestrator determine "near completion" for an interrupted task? The `workers/{agent}/state.json` has progress tracking, but "near completion" is subjective. At what percentage does the Orchestrator decide to re-dispatch vs. skip?

**Second concern:** Re-dispatching an interrupted task means the Worker starts fresh (new SDK session, no context from the interrupted session). The Worker will re-execute from scratch, potentially creating duplicate work (duplicate commits, duplicate files).

This is the same retry idempotency issue I flagged in the Phase 0 audit (V4.4). The architecture inherits this concern but does not address it further.

---

## 7. Memory and State

### V7.1: Memory Hierarchy Design

**Verdict: PASS**

The 5-layer memory hierarchy (Section 10.1) is well-designed:
- Layer 1 (volatile session memory) dies with Worker -- correct
- Layer 2 (worker state.json) survives restart, deleted on completion -- correct
- Layer 3 (agent MEMORY.md) persists across sessions -- correct
- Layer 4 (project memory: stories, decisions, audit) persists forever -- correct
- Layer 5 (SQLite orchestrator state) survives VPS restart -- correct

The blackboard pattern (Section 10.2) is the right choice for inter-agent knowledge sharing. Agents communicate through artifacts (files), not messages. This preserves the process principle: everything is traceable and auditable.

### V7.2: Concurrent Write Conflicts on Agent Memory

**Verdict: CONCERNS**

Layer 3 includes `.aios-core/development/agents/{id}/MEMORY.md` and `.claude/agent-memory/{agent}/MEMORY.md`. If two Workers need to update the same agent's memory (unlikely but possible in edge cases), they would both write to the same file.

More likely: Worker @dev writes to `agents/dev/MEMORY.md` while Worker @qa reads it. If @qa reads a partially-written file, it gets corrupted data.

The architecture does not specify file locking for agent memory writes. On Linux, `writeFileSync` is not atomic for large files (it can be interrupted mid-write, leaving a truncated file).

**Recommendation:** Use the atomic-rename pattern: write to `MEMORY.md.tmp`, then `rename('MEMORY.md.tmp', 'MEMORY.md')`. Rename is atomic on the same filesystem.

### V7.3: SQLite Under Concurrent Access

**Verdict: CONCERNS**

The Orchestrator is the sole writer to `state.db`. Workers do not write to SQLite. This eliminates write contention.

However, if the Orchestrator has multiple async operations writing to SQLite simultaneously (e.g., processing events from two Workers at once), SQLite WAL mode handles this correctly but the Node.js SQLite driver must be configured for serialized access.

The architecture specifies WAL mode, which is correct. But the Node.js binding choice (better-sqlite3? sqlite3? Drizzle? Knex?) is not specified. Some bindings are not safe for concurrent async writes within a single process.

---

## 8. Concurrency and Resource Management

### V8.1: Worker Semaphore

**Verdict: PASS**

`MAX_CONCURRENT_WORKERS = 2` with FIFO queue and no preemption. Tasks wait if both slots are occupied. Starvation prevented by `max_wall_time` per Worker.

This is correct for 8GB RAM. The math works: 300 (Orchestrator) + 600 + 600 (2 Workers) + 80 (Bridge) = 1,580 MB peak. Leaves ~6.2 GB for OS and other services.

### V8.2: Worker Resource Limits (cgroup)

**Verdict: CONCERNS**

Per-Worker: `MemoryMax: 1.5G`, `CPUQuota: 100%`. Orchestrator: `MemoryMax: 512M`, `CPUQuota: 50%`.

**Concern:** The current implementation uses `child_process.fork()` (Decision D4). `fork()` does NOT automatically create cgroup limits. The cgroup enforcement requires either:
- systemd transient units (e.g., `systemd-run --scope -p MemoryMax=1536M node worker.js`)
- Manual cgroup manipulation via `/sys/fs/cgroup/`
- Node.js `child_process` resource limits (only `maxBuffer` is available, no memory limit)

The architecture specifies these limits but does not specify HOW they are applied with `child_process.fork()`. If using fork() in Phase 0-1, there are NO resource limits. systemd transient units are mentioned as a Phase 5 option.

**Assessment:** In Phases 0-4, Worker resource limits are NOT enforced. A runaway Worker can consume all available RAM, triggering OOM killer. The `worker_heartbeat_timeout_ms: 300000` (5 minutes) provides a time-based kill, but memory exhaustion can happen in seconds.

### V8.3: fork() vs exec() Memory Characteristics

**Verdict: CONCERNS**

Decision D4 chooses `child_process.fork()` with rationale "fork() shares V8 heap initially (copy-on-write), fastest spawn."

**Correction:** Node.js `child_process.fork()` does NOT share V8 heap with copy-on-write. `fork()` in Node.js is NOT the same as POSIX `fork()`. Node.js `fork()` spawns a NEW Node.js process with a NEW V8 instance. There is no copy-on-write memory sharing.

The correct behavior:
- `child_process.fork()`: New Node.js process, new V8 heap, IPC channel via `process.send()`/`process.on('message')`
- `child_process.spawn()`: New process (any executable), no IPC channel
- `child_process.exec()`: New shell + new process, captures stdout

All three create independent processes with independent memory. None share V8 heap.

**Impact:** The rationale for choosing fork() is based on an incorrect assumption. However, fork() is still a reasonable choice because it provides built-in IPC via `process.send()`, which the architecture needs for Worker-Orchestrator communication.

---

## 9. Event Bus and IPC

### V9.1: Filesystem Event Bus Design

**Verdict: PASS**

The event bus extends the existing inbox/outbox pattern with a `pending -> processing -> completed -> failed` state machine. Event files are JSON with schema versioning. This is consistent with the existing IPC and adds no new infrastructure.

### V9.2: Event Bus Performance

**Verdict: CONCERNS**

`event_poll_interval_ms: 2000` means up to 2 seconds latency on event detection. For overnight batch work, this is fine. For interactive command response (user sends command via Telegram, expects real-time progress), 2 seconds between progress updates is noticeable.

The architecture uses chokidar for file watching, which can detect changes faster than polling. But chokidar falls back to polling on some filesystems. On ext4 (the typical Linux filesystem), inotify should work and provide sub-100ms detection.

**Assessment:** In practice, this is likely fine. But the 2-second poll interval should be configurable per-context (faster for interactive, slower for batch).

### V9.3: Event Bus Atomicity

**Verdict: FAIL -- Same gap as Phase 0**

The event bus uses file moves between directories (pending -> processing -> completed). This is the same pattern as the inbox/outbox. My Phase 0 audit (V10.3) identified a FAIL for this pattern: the pickup sequence (read file, update state, move file) is not atomic.

In the new architecture, the problem is AMPLIFIED:
- 11 agent inboxes + 1 event bus + 1 external inbox = 13 directories being watched
- Multiple Workers writing events simultaneously
- The Orchestrator processing events from multiple sources

**Scenario:** Worker @dev writes `task_completed` event. The Orchestrator reads it, moves to `processing/`, and starts creating a QA task. The Orchestrator crashes mid-creation. On restart:
- Event is in `processing/` (already read)
- QA task was never written to `workers/qa/inbox/`
- The workflow is stuck: @dev is done, @qa never starts

**Recommendation:** Same as Phase 0 R1: define the exact processing sequence with deduplication as the safety net. On startup, scan `processing/` for stale events (events that have been in `processing/` for more than a timeout) and re-process them.

### V9.4: Event Schema Versioning

**Verdict: PASS**

Events use `schema_version: "3.0"`. The existing inbox/outbox uses `schema_version: "2.0"` (from Phase 0). This is a clean version bump. Backward compatibility is maintained by keeping the existing inbox/outbox paths working.

### V9.5: Broadcast Events

**Verdict: CONCERNS**

Section 6.5 defines broadcast events (`target.agent: "*", broadcast: true`) for architectural decisions that affect all agents. The Orchestrator delivers broadcast events "to all active workers."

**Concern:** How are broadcast events delivered to Workers? Writing to every agent's inbox? That creates N copies of the same event. If a Worker is not currently running (most agents are idle), the event sits in their inbox until they are spawned for a task. By then, the broadcast may be stale.

**Second concern:** Broadcast events create a fan-out pattern. With 11 agents, one broadcast creates 11 inbox writes. If broadcasts are frequent (multiple architectural decisions in a session), this creates significant filesystem IO.

**Assessment:** Broadcasts are likely rare (architectural decisions are infrequent). The concern is more about unspecified semantics than practical impact.

---

## 10. Implementation Roadmap

### V10.1: Phase Independence

**Verdict: PASS**

Each phase is stated as "independently deployable and backward-compatible." I verified this claim:

| Phase | Independent? | Backward Compatible? |
|-------|-------------|---------------------|
| Phase 0 (Worker isolation) | YES -- can run single worker sequentially | YES -- same inbox/outbox |
| Phase 1 (Parallel) | YES -- adds semaphore, parallel is additive | YES -- single command still works |
| Phase 2 (Governance) | YES -- adds safety checks | YES -- no change to happy path |
| Phase 3 (Workflows) | YES -- adds workflow automation | YES -- manual commands still work |
| Phase 4 (Overnight) | YES -- adds scheduled execution | YES -- daytime operation unchanged |

This is well-structured. Each phase genuinely adds capability without breaking the previous phase.

### V10.2: Effort Estimates

**Verdict: CONCERNS**

Total estimate: 63-91 dev days (10-17 weeks). For a single developer working through Claude Code agents (which is the AIOS model), this is 3-4 months of work.

**Concern:** The estimates assume no blockers. But:
- Phase 0 depends on unverified SDK assumptions (R0)
- Phase 2 (Governance) requires SDK features (`denied_bash_patterns`) that may not exist
- Phase 3 (Workflows) requires state machine implementation that is never simple
- Phase 5 (Advanced) includes "semantic analysis of output" for drift detection, which is research-grade

The estimates feel optimistic for the complexity involved. Phase 3 alone ("10-14 days") for implementing SDC, QA Loop, dependency resolution, and workflow status tracking seems like it should be 3-4 weeks.

### V10.3: Missing Phase 0.5

**Verdict: CONCERNS**

The architecture jumps from Phase 0 (single worker, sequential) to Phase 1 (multiple workers, parallel). There is no intermediate step to validate that a single Worker process works correctly with the full governance lifecycle.

A Phase 0.5 would be: "Run a single Worker with per-agent profile enforcement, verify denied_bash_patterns work, verify tool whitelists work, verify the Worker can be spawned and killed cleanly." This validates the Worker model before introducing parallelism.

Without Phase 0.5, Phase 1 introduces two variables simultaneously (parallelism + worker model), making it harder to debug issues.

---

## 11. Structural Process Audit

### V11.1: Unidirectional Flow

**Verdict: PASS**

The primary flows are unidirectional:

```
External -> Inbox -> Orchestrator -> Worker Inbox -> Worker -> Worker Outbox -> Event Bus -> Orchestrator -> Next Worker or Bridge
```

No component feeds back to a previous component in the happy path. The QA Loop is a bounded iteration (with the caveat from V4.2 about enforcement).

### V11.2: Can the Executor Skip Steps?

**Verdict: CONCERNS**

The Orchestrator is the single point of control. Workers cannot skip steps because:
- Workers only see their own inbox
- Workers cannot write directly to other agent inboxes
- Workers communicate through events that the Orchestrator processes

However, a Worker COULD write directly to `.aios/workers/qa/inbox/` via Bash (bypassing the Orchestrator). There is no filesystem-level prevention of this. The Worker runs as the same Unix user as the Orchestrator.

**Assessment:** The LLM in the Worker would need to intentionally decide to bypass the Orchestrator, craft the correct JSON schema, and write to the correct directory. This is unlikely in practice but possible in principle. systemd `ReadWritePaths` (Phase 5) would prevent this by restricting each Worker's write access.

### V11.3: Watchdog for the Orchestrator

**Verdict: FAIL -- No watchdog watches the watchdog**

The Orchestrator monitors Workers. Workers have heartbeats. If a Worker dies, the Orchestrator detects it. If a Worker misbehaves, the Orchestrator kills it.

**But who monitors the Orchestrator?**

The Orchestrator is a systemd service with `Restart=always`. If the Orchestrator crashes, systemd restarts it. But:
- If the Orchestrator enters a crash loop (crash -> restart -> crash -> restart), systemd's default `StartLimitIntervalSec` (10 seconds) and `StartLimitBurst` (5) will stop restarting after 5 crashes in 10 seconds. Then the Orchestrator is dead and no Workers can be spawned.
- If the Orchestrator hangs (infinite loop, deadlock, memory leak approaching MemoryMax), it is still "running" from systemd's perspective. Workers send heartbeats but the Orchestrator never processes them.

**The architecture defines no self-health mechanism for the Orchestrator.** It writes a `health.json` (Section "Appendix A") but no one reads it. The Telegram Bridge could check Orchestrator health, but the Bridge's role is observability, not control.

**Recommendation:**
1. The Orchestrator should set `WatchdogSec=60` in its systemd unit file and call `sd_notify(0, "WATCHDOG=1")` periodically. If it stops notifying, systemd kills and restarts it.
2. The Telegram Bridge should check `orchestrator/state.json` periodically and send an alert if it has not been updated for 5 minutes.
3. Define a maximum crash loop count in the overnight config. If the Orchestrator crashes more than N times during overnight execution, send the EMERGENCY WhatsApp notification and do not restart.

### V11.4: Single Point of Failure Analysis

**Verdict: CONCERNS**

The architecture correctly identifies the single-daemon model's single point of failure (Section 3.2). The new architecture improves this: Workers are process-isolated, so one crash does not affect others.

However, the Orchestrator itself is now the single point of failure. If the Orchestrator dies:
- No new Workers can be spawned
- Running Workers continue (they are independent processes) but their results are never collected
- The event bus is not processed
- Workflow transitions do not happen

The Orchestrator is a LESS LIKELY single point of failure (it does not hold an SDK session, so it is simpler), but it is still a single point.

---

## 12. Summary Matrix

| ID | Validation Point | Verdict | Severity | Notes |
|----|-----------------|---------|----------|-------|
| V1.1 | Phase 0 FAILs resolution | FAIL | CRITICAL | R0 verification not documented |
| V1.2 | Code-architecture alignment | PASS | -- | Existing code matches baseline description |
| V2.1 | Article I: CLI First | PASS | -- | Telegram is delivery, not control plane |
| V2.2 | Article II: Agent Authority | CONCERNS | HIGH | See Section 3 |
| V2.3 | Article III: Story-Driven | PASS | -- | Tasks traceable to stories |
| V2.4 | Article IV: No Invention | PASS | -- | Decisions traced to requirements |
| V2.5 | Article V: Quality First | CONCERNS | MEDIUM | Quality gates not wired into Worker lifecycle |
| V2.6 | Article VI: Absolute Imports | PASS | -- | Not directly relevant |
| V3.1 | @devops exclusive authority | PASS | -- | denied_bash_patterns + allowed_bash_patterns |
| V3.2 | @qa read-only enforcement | FAIL | HIGH | Bash is a write-capable escape hatch |
| V3.3 | @devops file modification | FAIL | HIGH | allowed_bash_patterns semantics undefined |
| V3.4 | @architect scope | CONCERNS | MEDIUM | "docs only" not enforced structurally |
| V3.5 | Missing agent profiles | CONCERNS | MEDIUM | 7 of 11 agents lack Worker profiles |
| V4.1 | SDC automation | PASS | -- | Unidirectional, clear dependencies |
| V4.2 | QA Loop bounds | FAIL | HIGH | Iteration counter not specified |
| V4.3 | SDC dependencies | PASS | -- | Topological sort, circular detection |
| V4.4 | Spec Pipeline support | CONCERNS | LOW | Conditional branching not specified |
| V4.5 | Brownfield support | CONCERNS | LOW | Complex state machine not accommodated |
| V5.1 | Pre-flight gate | PASS | -- | Authority + budget + dependency check |
| V5.2 | denied_bash_patterns bypass | FAIL | HIGH | String matching is bypassable |
| V5.3 | Runtime Sentinel access | CONCERNS | MEDIUM | Sentinel cannot access Worker's internal stream |
| V5.4 | Post-flight validation | PASS | -- | Filesystem checks after Worker exit |
| V5.5 | Kill switch hierarchy | PASS | -- | 5 levels, clear escalation |
| V5.6 | Audit trail | PASS | -- | Complete schema, append-only |
| V6.1 | Overnight task categorization | PASS | -- | Maps to authority matrix |
| V6.2 | Budget enforcement | CONCERNS | MEDIUM | Token count source not specified |
| V6.3 | Escalation during overnight | PASS | -- | 4 severity levels, dual notification |
| V6.4 | Schedule approval | PASS | -- | Two-step approval gate |
| V6.5 | VPS restart recovery | CONCERNS | MEDIUM | "Near completion" heuristic undefined |
| V7.1 | Memory hierarchy | PASS | -- | 5 layers, well-separated |
| V7.2 | Concurrent memory writes | CONCERNS | LOW | No atomic write for MEMORY.md |
| V7.3 | SQLite concurrency | CONCERNS | LOW | Driver choice affects safety |
| V8.1 | Worker semaphore | PASS | -- | Correct for RAM constraints |
| V8.2 | cgroup enforcement | CONCERNS | MEDIUM | Not actually enforced until Phase 5 |
| V8.3 | fork() memory model | CONCERNS | LOW | Rationale based on incorrect assumption |
| V9.1 | Event bus design | PASS | -- | Consistent with existing IPC |
| V9.2 | Event bus performance | CONCERNS | LOW | 2s polling for interactive use |
| V9.3 | Event bus atomicity | FAIL | MEDIUM | Same gap as Phase 0, amplified |
| V9.4 | Schema versioning | PASS | -- | Clean version bump |
| V9.5 | Broadcast events | CONCERNS | LOW | Delivery semantics unspecified |
| V10.1 | Phase independence | PASS | -- | Each phase independently deployable |
| V10.2 | Effort estimates | CONCERNS | LOW | Likely optimistic for complexity |
| V10.3 | Missing Phase 0.5 | CONCERNS | MEDIUM | Worker model untested before parallelism |
| V11.1 | Unidirectional flow | PASS | -- | No feedback loops in happy path |
| V11.2 | Step skipping | CONCERNS | LOW | Same-user Workers could bypass Orchestrator |
| V11.3 | Orchestrator watchdog | FAIL | HIGH | No one monitors the Orchestrator |
| V11.4 | Single point of failure | CONCERNS | MEDIUM | Orchestrator is the new SPOF |

**Totals: 16 PASS, 19 CONCERNS, 7 FAIL**

---

## 13. Recommendations

### R0: Resolve Phase 0 FAILs (BLOCKING)

**Status: Same recommendation as Phase 0 audit, now escalated to CRITICAL.**

Before this architecture proceeds to implementation, provide evidence that:
1. `settingSources` loads CLAUDE.md into Worker sessions
2. `resumeSession()` works (or document its absence as a known limitation)
3. Filesystem atomicity is specified for the inbox pickup sequence

If R0 was already executed and passed, add the results to this architecture document (Section 3.3 or a new Section 3.4).

### R1: Fix @qa Read-Only Enforcement (BLOCKING for Phase 2)

Choose one:
- **Option A (strict):** Remove `Bash` from @qa's `allowed_tools`. @qa uses only Read, Grep, Glob, Task.
- **Option B (structural):** Use systemd `ReadOnlyPaths` on @qa Worker's cgroup. Requires Phase 5 to be partially pulled into Phase 2.
- **Option C (defense-in-depth):** Expand `denied_bash_patterns` for @qa to cover common file-write commands AND add post-flight git diff check that blocks if @qa modified any files.

Recommendation: Option A for Phases 0-4, Option B for Phase 5. @qa does not need Bash for its core function (code review, test execution can be done via Task tool).

### R2: Define allowed_bash_patterns Semantics (BLOCKING for Phase 2)

Specify in the Worker profile schema:

```yaml
bash_enforcement:
  mode: "denylist"  # or "allowlist"
  # denylist: all commands allowed EXCEPT denied_bash_patterns
  # allowlist: ONLY allowed_bash_patterns are permitted
  case_sensitive: false
  match_type: "regex"  # or "substring" or "command_parser"
```

For @devops, use mode `allowlist` with `match_type: "regex"`:
```yaml
allowed_bash_patterns:
  - "^git\\s+push"
  - "^gh\\s+pr"
  - "^git\\s+status"
  - "^git\\s+log"
```

### R3: Add QA Loop Iteration Counter (BLOCKING for Phase 3)

Add to the `workflows` SQLite table:
```sql
ALTER TABLE workflows ADD COLUMN iteration_count INTEGER DEFAULT 0;
ALTER TABLE workflows ADD COLUMN max_iterations INTEGER DEFAULT 5;
```

The Workflow Engine MUST increment `iteration_count` on each QA REJECT -> @dev fix cycle. When `iteration_count >= max_iterations`, emit escalation event and STOP the loop.

### R4: Add Orchestrator Watchdog (BLOCKING for Phase 4)

Add to the systemd unit file:
```ini
[Service]
WatchdogSec=60
WatchdogSignal=SIGTERM
```

Add to the Orchestrator code:
```javascript
const sdNotify = require('sd-notify');
setInterval(() => sdNotify.watchdog(), 30000);
```

If the Orchestrator hangs, systemd kills and restarts it after 60 seconds.

### R5: Add Phase 0.5 to Roadmap (RECOMMENDED)

Insert a Phase 0.5 between Phase 0 and Phase 1:

**Phase 0.5: Worker Profile Validation (3-5 days)**
- Spawn a single Worker with @dev profile
- Verify `denied_bash_patterns` blocks `git push`
- Spawn a single Worker with @qa profile
- Verify `denied_tools: [Write, Edit]` blocks file modifications
- Verify Worker exits cleanly with correct exit codes
- Verify Worker health.json is written and monitored
- Do NOT add parallelism

### R6: Specify Runtime Sentinel Access Mechanism (RECOMMENDED for Phase 2)

Define how the Sentinel accesses Worker state:
- Workers write tool call events to `.aios/workers/{agent}/tools.jsonl` (append-only log)
- The Sentinel watches this file (not the SDK stream)
- Goal re-injection: the Orchestrator writes a `sentinel.json` file in the Worker's inbox. The Worker checks for this file between tool calls (cooperative check, implemented in worker.js).

### R7: Correct fork() Rationale in Decision Log (INFORMATIONAL)

Decision D4 states "fork() shares V8 heap initially (copy-on-write)." This is incorrect for Node.js. Update the rationale to: "fork() provides built-in IPC via process.send()/process.on('message'), which simplifies Worker-Orchestrator communication."

### R8: Define Worker Profiles for All SDC Agents (RECOMMENDED for Phase 3)

Before Phase 3 (Workflow Engine), define Worker profiles for:
- @sm (story creation -- needs Write, no git push)
- @po (story validation -- needs Read only)
- @pm (epic orchestration -- needs Write for execution files)
- @aios-master (framework governance -- unrestricted, document explicitly)

---

## Final Assessment

This architecture is the natural and correct evolution of the Session Daemon Phase 0. The core decisions (Master-Worker, filesystem IPC, per-agent isolation, incremental phases) are sound. The scope is ambitious but the phased approach makes it manageable.

The 7 FAILs fall into three categories:

**Category 1: Inherited (unresolved from Phase 0)**
- V1.1: Phase 0 R0 verification -- must be resolved before any further work
- V9.3: Event bus atomicity -- same filesystem gap, now amplified

**Category 2: Governance gaps (authority enforcement)**
- V3.2: @qa Bash escape hatch
- V3.3: allowed_bash_patterns undefined semantics
- V5.2: denied_bash_patterns bypassable via string manipulation

**Category 3: Structural completeness**
- V4.2: QA Loop iteration counter missing
- V11.3: No Orchestrator watchdog

Category 1 is BLOCKING: no progress until R0 is confirmed. Category 2 is BLOCKING for Phase 2 (Governance Engine). Category 3 is BLOCKING for Phases 3 and 4 respectively.

**Conditional verdict:** If R0 is confirmed and the governance gaps (R1, R2) are addressed in the Governance Engine design, this architecture is APPROVED for implementation starting at Phase 0. Each subsequent phase requires its blocking recommendations to be addressed before implementation begins.

---

*Validation by @pedro-valerio -- Process Absolutist.*
*"Se executor CONSEGUE fazer errado, processo esta errado."*
