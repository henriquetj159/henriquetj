# Agent Authority — Detailed Rules

## Delegation Matrix

### @devops (Gage) — EXCLUSIVE Authority

| Operation | Exclusive? | Other Agents |
|-----------|-----------|--------------|
| `git push` / `git push --force` | YES | BLOCKED |
| `gh pr create` / `gh pr merge` | YES | BLOCKED |
| MCP add/remove/configure | YES | BLOCKED |
| CI/CD pipeline management | YES | BLOCKED |
| Release management | YES | BLOCKED |

### @pm (Morgan) — Epic Orchestration

| Operation | Exclusive? | Delegated From |
|-----------|-----------|---------------|
| `*execute-epic` | YES | — |
| `*create-epic` | YES | — |
| EPIC-{ID}-EXECUTION.yaml management | YES | — |
| Requirements gathering | YES | — |
| Spec writing (spec pipeline) | YES | — |

### @po (Pax) — Story Validation

| Operation | Exclusive? | Details |
|-----------|-----------|---------|
| `*validate-story-draft` | YES | 10-point checklist |
| Story context tracking in epics | YES | — |
| Epic context management | YES | — |
| Backlog prioritization | YES | — |

### @sm (River) — Story Creation

| Operation | Exclusive? | Details |
|-----------|-----------|---------|
| `*draft` / `*create-story` | YES | From epic/PRD |
| Story template selection | YES | — |

### @dev (Dex) — Implementation

| Allowed | Blocked |
|---------|---------|
| `git add`, `git commit`, `git status` | `git push` (delegate to @devops) |
| `git branch`, `git checkout`, `git merge` (local) | `gh pr create/merge` (delegate to @devops) |
| `git stash`, `git diff`, `git log` | MCP management |
| Story file updates (File List, checkboxes) | Story file updates (AC, scope, title) |

### @architect (Aria) — Design Authority

| Owns | Delegates To |
|------|-------------|
| System architecture decisions | — |
| Technology selection | — |
| High-level data architecture | @data-engineer (detailed DDL) |
| Integration patterns | @data-engineer (query optimization) |
| Complexity assessment | — |

### @data-engineer (Dara) — Database

| Owns (delegated from @architect) | Does NOT Own |
|----------------------------------|-------------|
| Schema design (detailed DDL) | System architecture |
| Query optimization | Application code |
| RLS policies implementation | Git operations |
| Index strategy execution | Frontend/UI |
| Migration planning & execution | — |

### @aiox-master — Framework Governance

**Default behavior: DELEGATE to the exclusive agent when one exists.**

| Capability | Details |
|-----------|---------|
| Framework governance tasks | Execute directly (meta-ops, orchestration, framework health) |
| Tasks with a mapped exclusive agent | **DELEGATE by default** — route to the owning agent |
| Override agent boundaries | Only with explicit `--force-execute` flag, workflow-engine mode, or `AIOX_DEBUG=true` |
| Constitutional enforcement | Execute directly |

**Pre-Execution Check (MANDATORY):** Before executing any task, @aiox-master MUST check the Delegation Matrix above. If an exclusive agent owns the operation, @aiox-master MUST delegate — not execute directly. The only exceptions are:
1. User explicitly requests `--force-execute`
2. Running in workflow-engine mode (automated pipeline)
3. Framework debugging with `AIOX_DEBUG=true`

**Rejection Script:** When @aiox-master cannot execute a task due to agent authority:
```
⚠️ This task belongs to @{agent} ({persona}).
Delegating: → @{agent} | task: {task-file}
```

**Self-Correction Protocol:** When @aiox-master has already begun executing a task that belongs to an exclusive agent, it MUST:
1. **Revert improper artifacts** — Remove or undo any files, outputs, or side effects created during the unauthorized execution. Artifact naming follows the owning agent's conventions (e.g., story files follow `{epicNum}.{storyNum}.story.md`; git operations leave no remote state).
2. **Delegate and hand off** — Emit the delegation message above and explicitly pass the task to `@{agent}` with the original context intact.
3. **Log the incident** — Append a structured entry to `.aiox/logs/agent-authority-incidents.log`:
   ```
   [timestamp] AUTHORITY_VIOLATION: @aiox-master attempted {task-file}
   owned_by: @{agent} ({persona})
   actions_taken: [list of actions performed before detection]
   reverted: [list of artifacts removed/undone]
   delegated_to: @{agent}
   ```

## Cross-Agent Delegation Patterns

### Git Push Flow
```
ANY agent → @devops *push
```

### Schema Design Flow
```
@architect (decides technology) → @data-engineer (implements DDL)
```

### Story Flow
```
@sm *draft → @po *validate → @dev *develop → @qa *qa-gate → @devops *push
```

### Epic Flow
```
@pm *create-epic → @pm *execute-epic → @sm *draft (per story)
```

## Escalation Rules

1. Agent cannot complete task → Escalate to @aiox-master
2. Quality gate fails → Return to @dev with specific feedback
3. Constitutional violation detected → BLOCK, require fix before proceed
4. Agent boundary conflict → @aiox-master mediates
