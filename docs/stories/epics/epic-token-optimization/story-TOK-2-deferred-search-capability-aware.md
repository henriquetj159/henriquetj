# Story TOK-2: Deferred/Search Capability-Aware Loading

## Metadata

| Field | Value |
|-------|-------|
| **Story ID** | TOK-2 |
| **Epic** | Token Optimization — Intelligent Tool Loading |
| **Type** | Enhancement |
| **Status** | Draft |
| **Priority** | P0 (Foundation) |
| **Points** | 5 |
| **Agent** | @dev (Dex) + @devops (Gage) |
| **Quality Gate** | @architect (Aria) |
| **Quality Gate Tools** | [capability_detection, fallback_validation] |
| **Blocked By** | TOK-1 |
| **Branch** | feat/epic-token-optimization |
| **Origin** | Research: tool-search-deferred-loading + Codex CRITICO-1 |

---

## Executor Assignment

```yaml
executor: "@dev + @devops"
quality_gate: "@architect"
quality_gate_tools: ["capability_detection", "fallback_validation"]
```

### Agent Routing Rationale

| Agent | Role | Justification |
|-------|------|---------------|
| `@dev` | Implementor | Creates capability detection, configures deferred loading, implements fallback. |
| `@devops` | Co-executor | Manages MCP server configuration, `.mcp.json` changes. |
| `@architect` | Quality Gate | Validates capability gate design (ADR-7), fallback completeness, L1-L4 alignment. |

## Story

**As a** AIOS framework user,
**I want** the system to detect runtime capabilities and apply deferred/search loading where supported,
**so that** MCP tool schemas are not loaded upfront when not needed, reducing token overhead by 50-85%.

## Context

Codex CRITICO-1 identified that Claude Code's defer control is not equivalent to the API. Claude Code has automatic Tool Search when `ENABLE_TOOL_SEARCH` is active, but fine-grained per-tool defer control may not be exposed. This story must be **capability-aware**: detect what the runtime supports and apply the best available strategy.

### Research References
- [Tool Search + Deferred Loading — 85% reduction](../../../research/2026-02-22-tool-search-deferred-loading/)
- [Codex CRITICO-1: defer_loading control](CODEX-CRITICAL-ANALYSIS.md#critico-1)
- [ADR-7: Capability gate por runtime](ARCHITECT-BLUEPRINT.md#9-architectural-decisions-summary)

### Strategy Hierarchy (ADR-7)
1. **Best case:** Claude Code auto-mode with Tool Search → deferred MCP schemas automatically
2. **Fallback 1:** MCP discipline — disable non-essential MCP servers in `.mcp.json`
3. **Fallback 2:** CLAUDE.md guidance — instruct Claude to prefer native tools over MCP

## Acceptance Criteria

### Capability Detection

1. Runtime capability detection script/module that identifies: Tool Search availability, MCP server list, defer_loading support
2. Detection runs at session initialization (not per-turn)
3. Detection result stored in runtime config (`.aios/runtime-capabilities.json`)

### Deferred Loading (when supported)

4. Tier 3 tools (MCP) configured with `defer_loading: true` when Tool Search is available
5. Tool Search latency < 500ms per search (measured)
6. Maximum 2 tool searches per turn (avoid excessive search overhead)
7. Tool search accuracy validated: correct tool found in top-3 results for 5+ test queries

### MCP Discipline Fallback

8. When deferred loading is NOT available: `.mcp.json` updated to disable non-essential servers
9. Essential MCP servers defined in tool-registry.yaml (Tier 3 with `essential: true`)
10. Non-essential servers can be re-enabled per-session via config

### CLAUDE.md Guidance Fallback

11. CLAUDE.md includes tool selection guidance: "prefer native tools over MCP for common operations"
12. Guidance references tool-registry.yaml for tool selection hierarchy

### Scope Separation (Handoff ajuste obrigatorio)

13. ACs separated by scope: project (`.mcp.json`) vs global (`~/.claude.json`) with precedence rule
14. Capability detection validates against MCPs actually available: project MCPs (nogic, code-graph) + global Docker MCPs (EXA, Context7, Apify, Playwright)
15. Fallback for environments WITHOUT Docker Gateway: system functions with project MCPs only

### Validation

16. Token overhead comparison: before vs after deferred loading (or MCP discipline)
17. No functional regression: all workflows that use MCP tools still function correctly
18. `npm test` passes — zero regressions

## Tasks / Subtasks

> **Execution order:** Task 1 → Task 2 → Task 3 → Task 4

- [ ] **Task 1: Capability detection** (AC: 1, 2, 3)
  - [ ] 1.1 Research Claude Code runtime detection methods
  - [ ] 1.2 Create capability detection module
  - [ ] 1.3 Store results in `.aios/runtime-capabilities.json`

- [ ] **Task 2: Deferred loading configuration** (AC: 4, 5, 6, 7)
  - [ ] 2.1 Configure Tier 3 tools with defer based on capability detection
  - [ ] 2.2 Validate Tool Search latency
  - [ ] 2.3 Validate search accuracy for common queries
  - [ ] 2.4 Implement 2-search-per-turn limit

- [ ] **Task 3: Fallback strategies** (AC: 8, 9, 10, 11, 12)
  - [ ] 3.1 Define essential vs non-essential MCP servers in registry
  - [ ] 3.2 Create MCP discipline config for fallback
  - [ ] 3.3 Add CLAUDE.md tool selection guidance

- [ ] **Task 4: Validation** (AC: 13, 14, 15)
  - [ ] 4.1 Measure token overhead before/after
  - [ ] 4.2 Test all MCP-dependent workflows still function
  - [ ] 4.3 Run `npm test` — zero regressions

## Scope

### IN Scope
- Capability detection for Claude Code runtime
- Deferred loading config for MCP tools
- MCP discipline fallback (disable non-essential servers)
- CLAUDE.md guidance fallback
- Token overhead measurement

### OUT of Scope
- Skills deferred loading (Issue #19445 — not yet available)
- PTC integration (TOK-3)
- Analytics pipeline (TOK-5)
- Custom tool search UI

## Dependencies

```
TOK-1 (Registry) → TOK-2 (this story)
TOK-2 (this story) → TOK-6 (Dynamic Filtering)
```

## Complexity & Estimation

**Complexity:** High
**Estimation:** 5 points (capability detection + multi-strategy fallback + validation)

## Boundary Impact (L1-L4)

| Path | Layer | Action | Deny/Allow |
|------|-------|--------|-----------|
| `.aios/runtime-capabilities.json` | L4 | Created | N/A (gitignored runtime) |
| `.mcp.json` | L3 | Modified | Project-level, permitted |
| `~/.claude.json` | Global | Read-only | Outside repo — read for detection, do NOT modify |
| `.claude/CLAUDE.md` | L3 | Modified | Permitted |
| `.aios-core/data/tool-registry.yaml` | L3 | Modified | ALLOW (`data/**`) |

**Scope Source of Truth:** Project (`.mcp.json`) + Global (`~/.claude.json`, read-only)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Claude Code doesn't expose defer control API | HIGH | MCP discipline fallback is ready |
| Tool Search latency exceeds 500ms | MEDIUM | Limit to 2 searches/turn; cache results |
| MCP discipline breaks workflows that need disabled servers | MEDIUM | Essential flag in registry; per-session override |
| Runtime detection unreliable | MEDIUM | Conservative fallback: if unknown, use MCP discipline |
| Ambiguidade project vs global MCP scope | MEDIUM | ACs 13-15 separam scopes explicitamente |

## Dev Notes

### Technical References
- Claude Code Tool Search: `ENABLE_TOOL_SEARCH` environment variable
- MCP config: `.mcp.json` (project-level)
- Tool registry: `.aios-core/data/tool-registry.yaml` (TOK-1)
- Runtime data: `.aios/` (gitignored)

### Implementation Notes
- Capability detection must be non-destructive (read-only)
- Fallback hierarchy: defer > discipline > guidance
- MCP discipline = toggling `disabled: true` in `.mcp.json` server entries
- Essential servers (defined in registry) are never disabled

## Testing

```bash
# Validate runtime capabilities
node -e "JSON.parse(require('fs').readFileSync('.aios/runtime-capabilities.json', 'utf8')); console.log('VALID')"

# Verify no regressions
npm test
```

## File List

| File | Action | Description |
|------|--------|-------------|
| `.aios/runtime-capabilities.json` | Created | Runtime capability detection results |
| `.mcp.json` | Modified | MCP server discipline config (if fallback) |
| `.claude/CLAUDE.md` | Modified | Tool selection guidance section |
| `.aios-core/data/tool-registry.yaml` | Modified | `essential` flag for MCP servers |

## CodeRabbit Integration

| Field | Value |
|-------|-------|
| **Story Type** | Feature / Infrastructure |
| **Complexity** | High |
| **Primary Agent** | @dev + @devops |
| **Self-Healing Mode** | standard (2 iterations, 20 min, CRITICAL+HIGH) |

**Severity Behavior:**
- CRITICAL: auto_fix (max 2 iterations)
- HIGH: auto_fix (max 1 iteration)
- MEDIUM: document_as_debt
- LOW: ignore

**Focus Areas:**
- Capability detection robustness
- Fallback correctness
- MCP config integrity
- No broken tool dependencies

## QA Results

_Pending implementation_

## Dev Agent Record

_Pending implementation_

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-22 | @sm (River) | Story drafted from Blueprint v2.0 + Codex CRITICO-1 |
