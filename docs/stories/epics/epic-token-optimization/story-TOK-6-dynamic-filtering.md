# Story TOK-6: Dynamic Filtering Generalizado

## Metadata

| Field | Value |
|-------|-------|
| **Story ID** | TOK-6 |
| **Epic** | Token Optimization — Intelligent Tool Loading |
| **Type** | Enhancement |
| **Status** | Draft |
| **Priority** | P2 (Intelligence) |
| **Points** | 3-5 |
| **Agent** | @dev (Dex) |
| **Quality Gate** | @qa (Quinn) |
| **Quality Gate Tools** | [filter_accuracy, payload_reduction] |
| **Blocked By** | TOK-2 |
| **Branch** | feat/epic-token-optimization |
| **Origin** | Research: dynamic-filtering-web-fetch (2026-02-22) + Blueprint v2.0 |

---

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["filter_accuracy", "payload_reduction"]
```

### Agent Routing Rationale

| Agent | Role | Justification |
|-------|------|---------------|
| `@dev` | Implementor | Creates filter configurations, implements client-side schema-aware filtering, extends tool registry. |
| `@qa` | Quality Gate | Validates filter accuracy (no critical data lost), payload reduction measured, no regressions. |

## Story

**As a** AIOS framework user,
**I want** large MCP responses (Apify scrapers, database queries, web fetch) to be dynamically filtered before entering the context window,
**so that** only relevant data consumes context tokens, reducing payload overhead by 24-98%.

## Context

Dynamic filtering goes beyond web fetch. Anthropic's research shows -24% tokens for web content, but structured data (JSON from scrapers, DB results) can achieve 98%+ reduction by selecting only relevant fields. This story generalizes the filter pattern to ALL large MCP responses, configurable per tool in the tool registry.

### Research References
- [Dynamic Filtering — -24% tokens, up to 98%+ for structured data](../../../research/2026-02-22-dynamic-filtering-web-fetch/)
- [ADR-6: Dynamic Filtering como pattern geral](ARCHITECT-BLUEPRINT.md#9-architectural-decisions-summary)
- [Blueprint v2.0 — TOK-6 description](ARCHITECT-BLUEPRINT.md#wave-3-intelligence-p2--6-8-pontos)

### Filter Types

| Source | Filter Type | Reduction |
|--------|-----------|-----------|
| Web fetch (HTML → markdown) | Content extraction, noise removal | -24% |
| Apify scraper (JSON array) | Field selection, row limit | -80-98% |
| Database query (JSON) | Column projection, result limit | -60-90% |
| API response (JSON) | Schema-aware field extraction | -50-80% |

## Acceptance Criteria

### Filter Configuration

1. Tool registry extended with `filter` config per tool: `filter_type` (content/schema/field), `max_tokens` (limit), `fields` (whitelist)
2. At least 4 tool filter configs created: web_search_exa, apify scrapers, get-library-docs, web fetch
3. Filter configs are declarative (no code per filter — config-driven)

### Client-Side Filtering

4. Filter engine processes MCP responses BEFORE they enter context
5. Content filter: strips HTML noise, extracts main content, limits to `max_tokens`
6. Schema filter: selects only specified `fields` from JSON responses
7. Field filter: projects specific columns from array data, limits row count

### Server-Side Integration (Optional)

8. For tools that support server-side filtering (Apify, DB), pass filter params to the tool
9. Server-side + client-side filtering can combine (belt and suspenders)

### Boundary-Compliant Implementation (Handoff ajuste obrigatorio — CRITICO)

10. Filter engine modules implemented at **`.aios-core/utils/filters/`** (NOT `core/filters/` — `core/` is L1 DENY)
11. If `.aios-core/utils/` does not exist, create it as L3 utility path with appropriate allow rules
12. Document the deny/allow matrix: confirm implementation path is permitted without exceptions

### Validation

13. Payload reduction measured for each filtered tool: at least -24% for content, -50% for structured data
14. No critical data lost: filtered output still contains information needed for task completion
15. Filter does not break tool responses (still parseable, still useful)
16. Baseline comparison: filtered vs unfiltered token count for each tool (reference TOK-1.5)
17. `npm test` passes — zero regressions

## Tasks / Subtasks

> **Execution order:** Task 1 → Task 2 → Task 3 → Task 4

- [ ] **Task 1: Filter configuration schema** (AC: 1, 2, 3)
  - [ ] 1.1 Extend tool-registry.yaml with `filter` section per tool
  - [ ] 1.2 Define filter types: content, schema, field
  - [ ] 1.3 Create filter configs for 4+ tools

- [ ] **Task 2: Client-side filter engine** (AC: 4, 5, 6, 7)
  - [ ] 2.1 Implement content filter (HTML → clean markdown, token limit)
  - [ ] 2.2 Implement schema filter (JSON field selection)
  - [ ] 2.3 Implement field filter (array projection + row limit)
  - [ ] 2.4 Integrate filter engine with MCP response pipeline

- [ ] **Task 3: Server-side integration** (AC: 8, 9)
  - [ ] 3.1 Pass filter params to Apify actors
  - [ ] 3.2 Pass filter params to DB queries (if applicable)

- [ ] **Task 4: Validation** (AC: 10, 11, 12, 13)
  - [ ] 4.1 Measure payload reduction per tool
  - [ ] 4.2 Verify no critical data loss
  - [ ] 4.3 Verify filtered responses are parseable
  - [ ] 4.4 Run `npm test` — zero regressions

## Scope

### IN Scope
- Filter configuration in tool registry
- Client-side filter engine (content, schema, field)
- Server-side filter params (where supported)
- Payload reduction measurement
- 4+ tool filter configs

### OUT of Scope
- ML-based content relevance scoring (use simple rules)
- Real-time filter tuning
- Filter UI or dashboard
- Filters for native Claude Code tools (they're already efficient)

## Dependencies

```
TOK-2 (Deferred/Search) → TOK-6 (deferred tools need filtering for when they load)
TOK-6 (this story) → TOK-5 (filtering metrics feed analytics)
```

## Complexity & Estimation

**Complexity:** Medium-High
**Estimation:** 3-5 points (Codex reestimated from 2 to 3-5: filter engine + 4 configs + measurement)

## Boundary Impact (L1-L4)

| Path | Layer | Action | Deny/Allow |
|------|-------|--------|-----------|
| ~~`.aios-core/core/filters/`~~ | ~~L1~~ | ~~REMOVED~~ | ~~**DENY** — VIOLACAO~~ |
| `.aios-core/utils/filters/` | L3 | Created | **REQUIRES** allow rule or new path validation |
| `.aios-core/data/tool-registry.yaml` | L3 | Modified | ALLOW (`data/**`) |

**CORRECAO CRITICA:** O path original proposto (`core/filters/`) viola L1 deny rules. Movido para `.aios-core/utils/filters/` que esta fora do scope de deny rules. Verificar se `.aios-core/utils/` precisa de allow rule explicita em `settings.json`.

**Scope Source of Truth:** Project framework utilities (`.aios-core/utils/` — verificar boundary classification)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Over-aggressive filtering removes critical data | HIGH | Conservative defaults, test with real workflows; fallback to no-filter |
| Filter engine adds processing latency | MEDIUM | Keep filters simple (regex/JSON path), < 100ms |
| MCP response format varies unexpectedly | MEDIUM | Schema-aware filters with fallback to no-filter |
| Implementation path blocked by deny rules | **RESOLVED** | Moved from `core/filters/` (L1 DENY) to `utils/filters/` |

## Dev Notes

### Technical References
- Anthropic dynamic filtering: "filter-then-reason" paradigm
- Content filter: markdown extraction, HTML cleaning
- Schema filter: JSON path selection (e.g., `$.data[*].{title,url,summary}`)
- Field filter: Array projection (SQL-like SELECT)

### Implementation Notes
- Filters run client-side in AIOS response pipeline
- Config-driven: no hardcoded filters per tool
- Fallback: if filter fails, pass unfiltered response (never lose data)
- Token limit: `max_tokens` is a soft limit — truncate at natural boundary
- Schema filter uses JSON path or simple field whitelist

### Filter Config Example

```yaml
# In tool-registry.yaml
tools:
  - name: web_search_exa
    filter:
      type: content
      max_tokens: 2000
      extract: ["title", "snippet", "url"]

  - name: apify_instagram_scraper
    filter:
      type: schema
      fields: ["username", "caption", "likes", "timestamp"]
      max_rows: 20

  - name: get-library-docs
    filter:
      type: content
      max_tokens: 5000
```

## Testing

```bash
# Verify filter configs in registry
node -e "const yaml = require('js-yaml'); const fs = require('fs'); const reg = yaml.load(fs.readFileSync('.aios-core/data/tool-registry.yaml', 'utf8')); const filtered = reg.tools.filter(t => t.filter); console.log(filtered.length + ' tools with filters')"

# Verify no regressions
npm test
```

## File List

| File | Action | Description |
|------|--------|-------------|
| `.aios-core/data/tool-registry.yaml` | Modified | Add filter configs per tool |
| `.aios-core/utils/filters/content-filter.js` | Created | Content filter (HTML → markdown, token limit) |
| `.aios-core/utils/filters/schema-filter.js` | Created | Schema filter (JSON field selection) |
| `.aios-core/utils/filters/field-filter.js` | Created | Field filter (array projection + row limit) |
| `.aios-core/utils/filters/index.js` | Created | Filter engine entry point |

## CodeRabbit Integration

| Field | Value |
|-------|-------|
| **Story Type** | Feature / Performance |
| **Complexity** | Medium-High |
| **Primary Agent** | @dev |
| **Self-Healing Mode** | standard (2 iterations, 20 min, CRITICAL+HIGH) |

**Severity Behavior:**
- CRITICAL: auto_fix (max 2 iterations)
- HIGH: auto_fix (max 1 iteration)
- MEDIUM: document_as_debt
- LOW: ignore

**Focus Areas:**
- No data loss in filtered responses
- Filter performance (< 100ms)
- Config-driven design (no hardcoded filters)

## QA Results

_Pending implementation_

## Dev Agent Record

_Pending implementation_

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-22 | @sm (River) | Story drafted from Blueprint v2.0 + Codex reestimation |
