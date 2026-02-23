# Story TOK-3: PTC for Native/CLI Bulk Operations

## Metadata

| Field | Value |
|-------|-------|
| **Story ID** | TOK-3 |
| **Epic** | Token Optimization — Intelligent Tool Loading |
| **Type** | Enhancement |
| **Status** | Draft |
| **Priority** | P1 (Optimization) |
| **Points** | 5 |
| **Agent** | @dev (Dex) |
| **Quality Gate** | @qa (Quinn) |
| **Quality Gate Tools** | [ptc_validation, token_comparison] |
| **Blocked By** | TOK-1.5 |
| **Branch** | feat/epic-token-optimization |
| **Origin** | Research: programmatic-tool-calling (2026-02-22) + Codex CRITICO-2 |

---

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["ptc_validation", "token_comparison"]
```

### Agent Routing Rationale

| Agent | Role | Justification |
|-------|------|---------------|
| `@dev` | Implementor | Annotates tasks with `execution_mode: programmatic`, creates PTC templates, implements batch execution patterns. |
| `@qa` | Quality Gate | Validates PTC reduces tokens vs baseline (TOK-1.5), ensures no functional regression, tests batch accuracy. |

## Story

**As a** AIOS workflow developer,
**I want** bulk native tool operations (QA checks, entity validation, research aggregation) to execute as single programmatic code blocks,
**so that** intermediate tool results stay in the sandbox and do not consume context window tokens.

## Context

Programmatic Tool Calling (PTC) allows a single code block to execute N tool calls, with intermediate results staying in the sandbox. This reduces context by ~37% for multi-tool workflows. **CRITICAL RESTRICTION (ADR-3):** PTC is only available for native/CLI tools — MCP connector tools CANNOT be called programmatically (Anthropic limitation).

### Research References
- [Programmatic Tool Calling — CodeAct paper, -37% tokens](../../../research/2026-02-22-programmatic-tool-calling/)
- [Codex CRITICO-2: PTC+MCP limitation](CODEX-CRITICAL-ANALYSIS.md#critico-2)
- [ADR-3: PTC native ONLY](ARCHITECT-BLUEPRINT.md#9-architectural-decisions-summary)

### Target Workflows for PTC

| Workflow | Current | PTC Approach |
|----------|---------|-------------|
| QA Gate (7 checks) | 7 separate tool calls, each result in context | 1 code block, 7 checks, 1 summary result |
| Entity validation | N entities × M checks | 1 batch scan, 1 summary |
| Research aggregation | Multiple WebSearch + analysis | 1 code block with search + filter |

## Acceptance Criteria

### PTC Annotation

1. Task frontmatter schema extended with `execution_mode: programmatic` field
2. At least 3 tasks annotated with `execution_mode: programmatic`: `qa-gate`, `entity-validation`, `research-aggregation`
3. Tool registry `task_bindings` updated to reflect PTC-eligible tasks

### PTC Templates

4. PTC code template created for QA Gate: runs lint, typecheck, test in single block, returns summary
5. PTC code template created for entity validation: batch-scans entities, returns summary
6. PTC code template created for research aggregation: multi-search + filter in single block

### Schema Formalization (Handoff ajuste obrigatorio)

7. Define whether `execution_mode` enters `task-v3-schema.json` formally or is transitional metadata
8. Inventory of impacted tasks: list ALL tasks that would benefit from PTC annotation (not just 3)
9. Backward compatibility: tasks WITHOUT `execution_mode` continue to work identically (field is optional)

### Restriction Enforcement

10. **CRITICAL:** No MCP tools used inside PTC code blocks — only native/CLI tools (Bash, Read, Grep, etc.)
11. Tool registry marks PTC-eligible tools with `ptc_eligible: true` — only native tools
12. Documentation clearly states MCP exclusion with ADR-3 reference

### PTC vs Shell Differentiation (Handoff ajuste obrigatorio)

13. Clearly differentiate PTC (Anthropic programmatic tool calling API feature) from regular Bash script automation
14. If PTC API is not available in Claude Code runtime, document the fallback approach (Bash scripting) and expected token savings difference

### Token Comparison

15. Token usage measured for QA Gate: PTC vs direct execution (compared to TOK-1.5 baseline)
16. Token reduction of at least 20% for PTC workflows (conservative vs 37% benchmark)
17. `npm test` passes — zero regressions

## Tasks / Subtasks

> **Execution order:** Task 1 → Task 2 → Task 3 → Task 4

- [ ] **Task 1: Schema and registry updates** (AC: 1, 2, 3, 8, 9)
  - [ ] 1.1 Extend task frontmatter with `execution_mode` field
  - [ ] 1.2 Annotate 3+ tasks with `execution_mode: programmatic`
  - [ ] 1.3 Update tool registry `task_bindings`
  - [ ] 1.4 Add `ptc_eligible: true` to native tools in registry

- [ ] **Task 2: PTC templates** (AC: 4, 5, 6)
  - [ ] 2.1 Create QA Gate PTC template (lint + typecheck + test)
  - [ ] 2.2 Create entity validation PTC template (batch scan)
  - [ ] 2.3 Create research aggregation PTC template (multi-search)

- [ ] **Task 3: Restriction documentation** (AC: 7, 9)
  - [ ] 3.1 Document MCP exclusion in task templates
  - [ ] 3.2 Add ADR-3 reference to registry

- [ ] **Task 4: Token comparison** (AC: 10, 11, 12)
  - [ ] 4.1 Run QA Gate workflow: PTC vs direct
  - [ ] 4.2 Measure and document token difference
  - [ ] 4.3 Compare against TOK-1.5 baseline
  - [ ] 4.4 Run `npm test` — zero regressions

## Scope

### IN Scope
- PTC annotation in task frontmatter
- PTC code templates for 3 workflows
- Token comparison measurement
- Native/CLI tools only restriction

### OUT of Scope
- PTC for MCP tools (ADR-3: not supported)
- PTC for structured outputs (incompatible)
- Automated PTC execution engine (manual template usage)
- PTC + tool_choice forced (incompatible)

## Dependencies

```
TOK-1.5 (Baseline) → TOK-3 (this story — needs baseline for comparison)
TOK-1 (Registry) → TOK-3 (registry provides task_bindings)
```

## Complexity & Estimation

**Complexity:** High
**Estimation:** 5 points (3 PTC templates + schema extension + measurement)

## Boundary Impact (L1-L4)

| Path | Layer | Action | Deny/Allow |
|------|-------|--------|-----------|
| `.aios-core/development/tasks/qa-gate.md` | L2 | Modified | **DENY** (tasks/**) — **REQUER** `frameworkProtection: false` |
| `.aios-core/data/tool-registry.yaml` | L3 | Modified | ALLOW (`data/**`) |
| `.aios-core/development/templates/ptc-*.md` | L2 | Created | **DENY** (templates/**) — **REQUER** `frameworkProtection: false` |
| `.aios-core/infrastructure/schemas/task-v3-schema.json` | L2 | Modified (if formal) | **DENY** (infrastructure/**) — **REQUER** contributor mode |

**ATENCAO:** Esta story modifica paths L2 protegidos. Deve ser executada com `boundary.frameworkProtection: false` em `core-config.yaml` (contributor mode).

**Scope Source of Truth:** Project framework (L2 — contributor mode required)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| PTC execution model changes in Claude Code updates | MEDIUM | Capability gate (ADR-7), version pinning |
| Token savings lower than 20% in AIOS context | MEDIUM | Baseline comparison validates; adjust targets |
| PTC templates complex to maintain | LOW | Keep templates simple, documented |
| L2 deny rules block implementation | HIGH | Execute with `frameworkProtection: false`; re-enable after |
| PTC API not available in Claude Code (only API) | HIGH | Fallback to Bash script automation; document savings difference |

## Dev Notes

### Technical References
- PTC paper: CodeAct (2024) — single code block = N tool calls
- PTC Anthropic docs: `tool_use` with code execution
- Native tools: Bash, Read, Write, Edit, Grep, Glob
- MCP exclusion: "MCP connector tools cannot currently be called programmatically"

### Implementation Notes
- PTC templates are code blocks that run tools via Bash
- Results stay in sandbox (not injected into context)
- Only final summary enters context
- Template pattern: `#!/bin/bash\n# PTC: qa-gate\nlint=$(npm run lint 2>&1)\n...echo "$summary"`

## Testing

```bash
# Verify task frontmatter schema
grep -r "execution_mode: programmatic" .aios-core/development/tasks/

# Verify no regressions
npm test
```

## File List

| File | Action | Description |
|------|--------|-------------|
| `.aios-core/development/tasks/qa-gate.md` | Modified | Add `execution_mode: programmatic` |
| `.aios-core/data/tool-registry.yaml` | Modified | Update task_bindings, ptc_eligible flags |
| `.aios-core/development/templates/ptc-qa-gate.md` | Created | PTC template for QA Gate |
| `.aios-core/development/templates/ptc-entity-validation.md` | Created | PTC template for entity validation |
| `.aios-core/development/templates/ptc-research-aggregation.md` | Created | PTC template for research aggregation |

## CodeRabbit Integration

| Field | Value |
|-------|-------|
| **Story Type** | Feature / Performance |
| **Complexity** | High |
| **Primary Agent** | @dev |
| **Self-Healing Mode** | standard (2 iterations, 20 min, CRITICAL+HIGH) |

**Severity Behavior:**
- CRITICAL: auto_fix (max 2 iterations)
- HIGH: auto_fix (max 1 iteration)
- MEDIUM: document_as_debt
- LOW: ignore

**Focus Areas:**
- No MCP tools in PTC templates (ADR-3)
- Token comparison accuracy
- Template correctness

## QA Results

_Pending implementation_

## Dev Agent Record

_Pending implementation_

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-22 | @sm (River) | Story drafted from Blueprint v2.0 + Codex CRITICO-2 |
