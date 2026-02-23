# Story TOK-5: Tool Usage Analytics Pipeline

## Metadata

| Field | Value |
|-------|-------|
| **Story ID** | TOK-5 |
| **Epic** | Token Optimization — Intelligent Tool Loading |
| **Type** | Enhancement |
| **Status** | Draft |
| **Priority** | P2 (Intelligence) |
| **Points** | 3 |
| **Agent** | @dev (Dex) + @analyst (Atlas) |
| **Quality Gate** | @architect (Aria) |
| **Quality Gate Tools** | [analytics_accuracy, baseline_comparison] |
| **Blocked By** | TOK-1.5 |
| **Branch** | feat/epic-token-optimization |
| **Origin** | Blueprint v2.0 — closing the optimization loop |

---

## Executor Assignment

```yaml
executor: "@dev + @analyst"
quality_gate: "@architect"
quality_gate_tools: ["analytics_accuracy", "baseline_comparison"]
```

### Agent Routing Rationale

| Agent | Role | Justification |
|-------|------|---------------|
| `@dev` | Implementor | Creates analytics collection, storage, and reporting. |
| `@analyst` | Co-executor | Analyzes data, produces promote/demote recommendations. |
| `@architect` | Quality Gate | Validates analytics accuracy vs baseline, architectural soundness. |

## Story

**As a** AIOS framework maintainer,
**I want** a tool usage analytics pipeline that tracks which tools are used, how often, and their token cost,
**so that** I can validate optimization targets against baseline and automatically recommend tool promotion/demotion.

## Context

After baseline measurement (TOK-1.5) and optimizations (TOK-2, TOK-3, TOK-4A/B, TOK-6), we need to close the loop with actual measurement. This story compares post-optimization metrics against baseline to validate the 25-45% reduction target. It also generates automatic recommendations: frequently-used deferred tools should be promoted to always-loaded, rarely-used always-loaded tools should be demoted.

### Research References
- [Token Optimization Architecture — Analytics](../../../research/2026-02-22-aios-token-optimization-architecture/)
- [Blueprint v2.0 — Success Metrics](ARCHITECT-BLUEPRINT.md#8-success-metrics-v20--conservador)
- [TOK-1.5 Baseline](story-TOK-1.5-baseline-metrics.md)

## Acceptance Criteria

### Data Collection

1. Tool usage tracked per session: tool name, invocation count, token cost (input + output), timestamp
2. Data stored in `.aios/analytics/tool-usage.json` (runtime, gitignored)
3. Collection is non-intrusive: no performance impact on tool execution

### Baseline Comparison

4. Post-optimization metrics compared against TOK-1.5 baseline for each workflow
5. Comparison report includes: total token reduction %, per-workflow breakdown, per-tool breakdown
6. Report clearly states whether 25-45% target is achieved, partially achieved, or not achieved

### Promote/Demote Recommendations

7. Tools used >10 times per session average → recommend promote from deferred to frequently_used
8. Tools used <1 time per 5 sessions → recommend demote from always_loaded to deferred
9. Recommendations output as structured YAML with tool name, current tier, recommended tier, evidence

### Data Governance (Handoff ajuste obrigatorio)

10. Define minimum event schema: tool_name, invocation_count, token_cost_input, token_cost_output, session_id, timestamp
11. Data retention: 30 days rolling window, older data archived or deleted
12. Privacy/sanitization: no user content or sensitive payloads stored in analytics (tool names and counts only)

### Promote/Demote Thresholds

13. Promote threshold: tool used >10 times per session average across 5+ sessions → recommend tier upgrade
14. Demote threshold: tool used <1 time per 5 sessions average → recommend tier downgrade
15. Thresholds are configurable in tool-registry.yaml (not hardcoded)

### Reporting

16. Summary report generated at `.aios/analytics/optimization-report.json`
17. Report includes: measurement period, sessions analyzed, total tokens saved, percentage reduction
18. `npm test` passes — zero regressions

## Tasks / Subtasks

> **Execution order:** Task 1 → Task 2 → Task 3 → Task 4

- [ ] **Task 1: Data collection** (AC: 1, 2, 3)
  - [ ] 1.1 Define tool-usage.json schema
  - [ ] 1.2 Create collection mechanism (session metadata or manual logging)
  - [ ] 1.3 Validate no performance impact

- [ ] **Task 2: Baseline comparison** (AC: 4, 5, 6)
  - [ ] 2.1 Load TOK-1.5 baseline data
  - [ ] 2.2 Compare post-optimization metrics per workflow
  - [ ] 2.3 Calculate total token reduction percentage
  - [ ] 2.4 Generate comparison report

- [ ] **Task 3: Promote/demote engine** (AC: 7, 8, 9)
  - [ ] 3.1 Define promotion threshold (>10 uses/session)
  - [ ] 3.2 Define demotion threshold (<1 use/5 sessions)
  - [ ] 3.3 Generate recommendations YAML

- [ ] **Task 4: Reporting and validation** (AC: 10, 11, 12)
  - [ ] 4.1 Generate optimization-report.json
  - [ ] 4.2 Validate report accuracy
  - [ ] 4.3 Run `npm test` — zero regressions

## Scope

### IN Scope
- Tool usage data collection
- Baseline comparison reporting
- Promote/demote recommendations
- Summary optimization report

### OUT of Scope
- Real-time dashboard or UI
- Automated tool tier changes (manual review of recommendations)
- Cross-project analytics
- Historical trend analysis

## Dependencies

```
TOK-1.5 (Baseline) → TOK-5 (baseline is reference for comparison)
TOK-6 (Dynamic Filtering) → TOK-5 (filtering metrics feed analytics)
```

## Complexity & Estimation

**Complexity:** Medium
**Estimation:** 3 points (data schema + collection + reporting)

## Boundary Impact (L1-L4)

| Path | Layer | Action | Deny/Allow |
|------|-------|--------|-----------|
| `.aios/analytics/tool-usage.json` | L4 | Created | N/A (gitignored runtime) |
| `.aios/analytics/optimization-report.json` | L4 | Created | N/A (gitignored runtime) |

**Scope Source of Truth:** Runtime (`.aios/` — L4, gitignored). Nenhuma violacao de boundary.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token count accuracy limited by Claude Code observability | MEDIUM | Use available metadata; estimate where needed |
| Promote/demote thresholds too aggressive | LOW | Thresholds are configurable (AC 15); recommendations are advisory |
| Analytics data grows unbounded | LOW | Rotation: 30 days (AC 11) |
| Sensitive data in analytics payloads | LOW | AC 12 requires sanitization — tool names and counts only |

## Dev Notes

### Technical References
- Baseline: `.aios/analytics/token-baseline.json` (TOK-1.5)
- Tool registry: `.aios-core/data/tool-registry.yaml` (TOK-1)
- Runtime data: `.aios/analytics/` (gitignored)

### Implementation Notes
- Collection can be manual (log after each session) or semi-automated
- Promote/demote recommendations are advisory — human reviews before applying
- Data rotation: keep 30 days of usage data, archive older
- JSON format for easy parsing by scripts and future dashboard

## Testing

```bash
# Validate analytics JSON
node -e "JSON.parse(require('fs').readFileSync('.aios/analytics/tool-usage.json', 'utf8')); console.log('VALID')"

# Verify no regressions
npm test
```

## File List

| File | Action | Description |
|------|--------|-------------|
| `.aios/analytics/tool-usage.json` | Created | Tool usage tracking data |
| `.aios/analytics/optimization-report.json` | Created | Comparison report vs baseline |

## CodeRabbit Integration

| Field | Value |
|-------|-------|
| **Story Type** | Feature / Analytics |
| **Complexity** | Medium |
| **Primary Agent** | @dev + @analyst |
| **Self-Healing Mode** | light (2 iterations, 15 min, CRITICAL only) |

**Severity Behavior:**
- CRITICAL: auto_fix (max 2 iterations)
- HIGH: document_as_debt
- MEDIUM: ignore
- LOW: ignore

**Focus Areas:**
- Data accuracy and completeness
- Baseline comparison correctness
- Recommendation threshold logic

## QA Results

_Pending implementation_

## Dev Agent Record

_Pending implementation_

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-22 | @sm (River) | Story drafted from Blueprint v2.0 |
