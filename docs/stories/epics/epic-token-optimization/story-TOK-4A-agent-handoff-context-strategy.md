# Story TOK-4A: Agent Handoff Context Strategy

## Metadata

| Field | Value |
|-------|-------|
| **Story ID** | TOK-4A |
| **Epic** | Token Optimization — Intelligent Tool Loading |
| **Type** | Enhancement |
| **Status** | Draft |
| **Priority** | P1 (Optimization) |
| **Points** | 3-5 |
| **Agent** | @dev (Dex) + @architect (Aria) |
| **Quality Gate** | @qa (Quinn) |
| **Quality Gate Tools** | [context_measurement, handoff_integrity] |
| **Blocked By** | TOK-1 |
| **Branch** | feat/epic-token-optimization |
| **Origin** | Codex ALTO-1: TOK-4 split — Handoff strategy separated from Input Examples |

---

## Executor Assignment

```yaml
executor: "@dev + @architect"
quality_gate: "@qa"
quality_gate_tools: ["context_measurement", "handoff_integrity"]
```

### Agent Routing Rationale

| Agent | Role | Justification |
|-------|------|---------------|
| `@dev` | Implementor | Creates handoff artifact template, implements context compaction on agent switch. |
| `@architect` | Co-executor | Designs Swarm-like handoff pattern, validates architecture. |
| `@qa` | Quality Gate | Validates context does not accumulate, handoff preserves critical information, no regressions. |

## Story

**As a** AIOS multi-agent workflow user,
**I want** agent switches to compact previous agent context and load clean new agent profiles,
**so that** context window does not accumulate 3+ agent personas, reducing unnecessary token overhead.

## Context

When AIOS switches between agents (e.g., @sm → @dev → @qa in SDC), each agent's full persona, instructions, and tool definitions accumulate in the context. After 3+ switches, significant context is consumed by stale agent data. OpenAI's Swarm pattern shows that compacting previous agent context on handoff maintains quality while reducing overhead.

### Research References
- [Token Optimization Architecture — Agent handoff](../../../research/2026-02-22-aios-token-optimization-architecture/)
- [Codex ALTO-1: TOK-4 inconsistency → split](CODEX-CRITICAL-ANALYSIS.md#alto-1)
- [Blueprint v2.0 — TOK-4A description](ARCHITECT-BLUEPRINT.md#wave-2-optimization-p1--11-15-pontos)
- [SYNAPSE context tracking](../epic-nogic-code-intelligence/) — NOG-18 foundation

### Current Problem

```
Session starts: @sm (River) → ~3K tokens persona + tools
Agent switch: + @dev (Dex) → +5K tokens (accumulated: ~8K)
Agent switch: + @qa (Quinn) → +4K tokens (accumulated: ~12K)
Agent switch: + @devops (Gage) → +3K tokens (accumulated: ~15K)
```

After 4 agent switches: ~15K tokens of agent context, only 1 agent is active.

### Target

```
Session starts: @sm (River) → ~3K tokens
Agent switch: @sm compacted to ~500 tokens summary + @dev loaded → ~5.5K total
Agent switch: @dev compacted + @qa loaded → ~4.5K total
```

Max context: always ~1 active agent + summaries of previous agents.

## Acceptance Criteria

### Handoff Artifact

1. Handoff artifact template created: captures critical state (current story, decisions made, files modified, blockers)
2. Artifact is compact: max 500 tokens for previous agent summary
3. Artifact is structured: YAML or markdown with fixed sections

### Context Compaction

4. On agent switch: previous agent's full persona/instructions are compacted to handoff artifact
5. New agent receives: own full profile + handoff artifact from previous agent(s)
6. Context does NOT accumulate 3+ full agent personas simultaneously

### SYNAPSE Integration

7. Handoff integrates with SYNAPSE context tracking (NOG-18)
8. SYNAPSE domain switch triggers handoff compaction
9. Handoff artifact stored in `.aios/handoffs/` (runtime, gitignored)

### Integration Point (Handoff ajuste obrigatorio)

10. Define exact integration point: SYNAPSE layer (new l8?), orchestration hook, or standalone module
11. No regression in current subagent flow: `subagent-prompt-builder.js` and `executor-assignment.js` continue to work identically
12. Define objective compaction limits: max tokens for handoff artifact, max retained agent summaries

### Validation

13. SDC workflow (4 agent switches) measured: context growth < 50% vs current accumulation
14. No critical information lost in handoff (story context, decisions, file lists preserved)
15. `npm test` passes — zero regressions

## Tasks / Subtasks

> **Execution order:** Task 1 → Task 2 → Task 3 → Task 4

- [ ] **Task 1: Handoff artifact design** (AC: 1, 2, 3)
  - [ ] 1.1 Design handoff artifact schema (story context, decisions, files, blockers)
  - [ ] 1.2 Create template at `.aios-core/development/templates/agent-handoff-tmpl.yaml`
  - [ ] 1.3 Validate template is < 500 tokens when filled

- [ ] **Task 2: Context compaction implementation** (AC: 4, 5, 6)
  - [ ] 2.1 Define compaction trigger (agent switch detection)
  - [ ] 2.2 Implement context compaction: extract critical state, discard persona
  - [ ] 2.3 Load new agent profile from tool registry

- [ ] **Task 3: SYNAPSE integration** (AC: 7, 8, 9)
  - [ ] 3.1 Link handoff to SYNAPSE domain switch
  - [ ] 3.2 Store handoff artifacts in `.aios/handoffs/`
  - [ ] 3.3 Test with SYNAPSE context tracking active

- [ ] **Task 4: Validation** (AC: 10, 11, 12)
  - [ ] 4.1 Measure SDC workflow context growth: before vs after
  - [ ] 4.2 Verify critical information preserved across handoffs
  - [ ] 4.3 Run `npm test` — zero regressions

## Scope

### IN Scope
- Handoff artifact template
- Context compaction on agent switch
- SYNAPSE integration
- SDC workflow validation

### OUT of Scope
- Input examples for tools (TOK-4B)
- Tool loading changes (TOK-2)
- Automated handoff (manual trigger acceptable for v1)
- Multi-session persistence (single session only)

## Dependencies

```
TOK-1 (Registry) → TOK-4A (agent profiles from registry)
NOG-18 (SYNAPSE) → TOK-4A (context tracking foundation)
```

## Complexity & Estimation

**Complexity:** Medium-High
**Estimation:** 3-5 points (artifact design + compaction logic + SYNAPSE integration)

## Boundary Impact (L1-L4)

| Path | Layer | Action | Deny/Allow |
|------|-------|--------|-----------|
| `.aios-core/development/templates/agent-handoff-tmpl.yaml` | L2 | Created | **DENY** (templates/**) — **REQUER** `frameworkProtection: false` |
| `.aios/handoffs/` | L4 | Created | N/A (gitignored runtime) |

**ATENCAO:** Template em L2 requer contributor mode. Alternativa: colocar template em `.aios-core/data/` (L3, permitido).

**Scope Source of Truth:** Template: Project framework (L2). Runtime: `.aios/` (L4, gitignored).

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Compaction loses critical context | HIGH | Structured artifact with mandatory sections; AC 12 defines limits |
| SYNAPSE integration complexity (8 layers) | MEDIUM-HIGH | Start with standalone module, SYNAPSE integration optional; AC 10 defines integration point |
| Agent switch detection unreliable | MEDIUM | Use explicit `@agent` command as trigger |
| L2 deny rules block template creation | MEDIUM | Use contributor mode OR move template to L3 (`data/`) |

## Dev Notes

### Technical References
- SYNAPSE context: `.aios-core/core/synapse/` — domain-based context management
- Agent definitions: `.claude/agents/*.md`
- Tool registry profiles: `.aios-core/data/tool-registry.yaml` (TOK-1)
- OpenAI Swarm: github.com/openai/swarm — handoff pattern reference

### Implementation Notes
- Handoff artifact = compact summary of what the previous agent did
- Compaction is lossy by design — only critical state preserved
- `/compact` native command can assist with context compaction
- First version can use CLAUDE.md instructions for compaction behavior

## Testing

```bash
# Verify no regressions
npm test
```

## File List

| File | Action | Description |
|------|--------|-------------|
| `.aios-core/development/templates/agent-handoff-tmpl.yaml` | Created | Handoff artifact template |
| `.aios/handoffs/` | Created | Runtime handoff storage (gitignored) |

## CodeRabbit Integration

| Field | Value |
|-------|-------|
| **Story Type** | Feature / Architecture |
| **Complexity** | Medium-High |
| **Primary Agent** | @dev + @architect |
| **Self-Healing Mode** | standard (2 iterations, 20 min, CRITICAL+HIGH) |

**Severity Behavior:**
- CRITICAL: auto_fix (max 2 iterations)
- HIGH: auto_fix (max 1 iteration)
- MEDIUM: document_as_debt
- LOW: ignore

**Focus Areas:**
- Handoff completeness (no critical data loss)
- Context accumulation prevention
- SYNAPSE integration correctness

## QA Results

_Pending implementation_

## Dev Agent Record

_Pending implementation_

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-22 | @sm (River) | Story drafted from Codex ALTO-1 split recommendation |
