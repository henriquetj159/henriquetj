# Story TOK-4B: Input Examples Registry + Injection

## Metadata

| Field | Value |
|-------|-------|
| **Story ID** | TOK-4B |
| **Epic** | Token Optimization — Intelligent Tool Loading |
| **Type** | Enhancement |
| **Status** | Draft |
| **Priority** | P1 (Optimization) |
| **Points** | 3-5 |
| **Agent** | @dev (Dex) |
| **Quality Gate** | @architect (Aria) |
| **Quality Gate Tools** | [example_accuracy, injection_validation] |
| **Blocked By** | TOK-1 |
| **Branch** | feat/epic-token-optimization |
| **Origin** | Research: tool-use-examples + Codex ALTO-1: TOK-4 split |

---

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["example_accuracy", "injection_validation"]
```

### Agent Routing Rationale

| Agent | Role | Justification |
|-------|------|---------------|
| `@dev` | Implementor | Creates examples registry, implements client-layer injection, extends entity-registry. |
| `@architect` | Quality Gate | Validates example quality, injection mechanism, ADR-4/ADR-5 compliance. |

## Story

**As a** AIOS framework user,
**I want** MCP tools to have concrete input examples that improve tool selection accuracy,
**so that** Claude selects the correct tool on the first try, reducing retry overhead and improving workflow efficiency.

## Context

Anthropic's research shows `input_examples` improve tool selection accuracy by +18pp (72% → 90%). However, MCP spec does NOT support native input_examples — AIOS must inject them client-side (ADR-4). Additionally, input_examples and tool_search are INCOMPATIBLE on the same tool (ADR-5): use examples for always-loaded tools, search for deferred tools.

### Research References
- [Tool Use Examples — +18pp accuracy](../../../research/2026-02-22-tool-use-examples/)
- [ADR-4: input_examples client-layer injection](ARCHITECT-BLUEPRINT.md#9-architectural-decisions-summary)
- [ADR-5: Search for discovery, Examples for accuracy](ARCHITECT-BLUEPRINT.md#9-architectural-decisions-summary)
- [Compatibility Matrix: Tool Search ✕ Input Examples = NO](ARCHITECT-BLUEPRINT.md#5-compatibility-matrix-critical)

### Incompatibility Rule (ADR-5)

| Tool Category | Strategy | Why |
|--------------|----------|-----|
| Always-loaded (Tier 1/2) | input_examples | Tool is always in context, examples improve accuracy |
| Deferred (Tier 3) | tool_search keywords | Tool is discovered via search, examples not applicable |

## Acceptance Criteria

### Examples Registry

1. `.aios-core/data/mcp-tool-examples.yaml` created with input examples for MCP tools
2. Each example includes: `tool_name`, `description`, `input` (concrete parameters), `expected_behavior`
3. Top-10 most-used MCP tools have at least 2 examples each
4. Examples are real, tested, and produce correct results

### Client-Layer Injection

5. Injection mechanism appends `input_examples` to tool schemas at session initialization
6. Injection only applies to always-loaded tools (Tier 1/2), NOT to deferred tools (ADR-5)
7. Injection does not break existing tool functionality

### Entity Registry Extension

8. `entity-registry.yaml` extended with `invocationExamples` field for tool entities
9. Examples in entity registry are consistent with `mcp-tool-examples.yaml`

### Registry Pipeline Impact (Handoff ajuste obrigatorio)

10. Define limit and format for `invocationExamples` in entity-registry to avoid parsing degradation (max N examples per entity, max M tokens per example)
11. `populate-entity-registry.js` updated to handle new `invocationExamples` field (or documented as separate pipeline)
12. Performance validation: entity-registry YAML parsing time does NOT increase >10% after adding examples

### Validation

13. Tool selection accuracy measured for top-5 tools: with vs without examples
14. No conflict with tool_search for deferred tools (ADR-5 compliance)
15. `npm test` passes — zero regressions

## Tasks / Subtasks

> **Execution order:** Task 1 → Task 2 → Task 3 → Task 4

- [ ] **Task 1: Identify top-10 tools** (AC: 3)
  - [ ] 1.1 Analyze tool usage from current workflows
  - [ ] 1.2 Rank tools by frequency of use
  - [ ] 1.3 Select top-10 for example creation

- [ ] **Task 2: Create examples registry** (AC: 1, 2, 4)
  - [ ] 2.1 Create `.aios-core/data/mcp-tool-examples.yaml`
  - [ ] 2.2 Write 2+ examples per top-10 tool
  - [ ] 2.3 Test each example for correctness

- [ ] **Task 3: Client-layer injection** (AC: 5, 6, 7, 8, 9)
  - [ ] 3.1 Implement injection mechanism (CLAUDE.md instructions or script)
  - [ ] 3.2 Ensure injection respects ADR-5 (always-loaded only)
  - [ ] 3.3 Extend entity-registry with `invocationExamples`

- [ ] **Task 4: Validation** (AC: 10, 11, 12)
  - [ ] 4.1 Measure tool selection accuracy: with vs without examples
  - [ ] 4.2 Verify no conflict with tool_search on deferred tools
  - [ ] 4.3 Run `npm test` — zero regressions

## Scope

### IN Scope
- MCP tool examples registry
- Client-layer injection mechanism
- Entity registry extension
- Top-10 tools with examples
- Accuracy measurement

### OUT of Scope
- Server-side examples (MCP spec doesn't support)
- Examples for deferred/search tools (ADR-5)
- Automated example generation
- UI for managing examples

## Dependencies

```
TOK-1 (Registry) → TOK-4B (registry defines which tools are always-loaded vs deferred)
```

## Complexity & Estimation

**Complexity:** Medium
**Estimation:** 3-5 points (examples creation + injection mechanism + entity registry extension)

## Boundary Impact (L1-L4)

| Path | Layer | Action | Deny/Allow |
|------|-------|--------|-----------|
| `.aios-core/data/mcp-tool-examples.yaml` | L3 | Created | ALLOW (`data/**`) |
| `.aios-core/data/entity-registry.yaml` | L3 | Modified | ALLOW (`data/**`) |

**Scope Source of Truth:** Project (`.aios-core/data/` — L3 mutable). Nenhuma violacao de boundary.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Examples become stale as MCP tools update | MEDIUM | Version examples with tool version; CI check |
| Injection mechanism breaks tool schemas | MEDIUM | Validate schema after injection |
| Accuracy improvement less than +18pp | LOW | Any improvement is valuable; adjust targets |
| Entity registry parsing degradation (502KB + examples) | MEDIUM | AC 12 limits example size; performance validation required |

## Dev Notes

### Technical References
- Anthropic input_examples spec: `input_schema.examples` in tool definition
- MCP spec: does NOT support input_examples natively
- Client injection: append examples to tool description or schema before sending to API
- Entity registry: `.aios-core/data/entity-registry.yaml`

### Implementation Notes
- Client-layer = AIOS injects examples into tool schemas before Claude sees them
- For Claude Code: examples can be in CLAUDE.md tool guidance section
- For API: examples go in `input_schema.examples` field
- ADR-5 is a hard constraint: never put examples on tools that use tool_search

### Example Format

```yaml
# mcp-tool-examples.yaml
tools:
  web_search_exa:
    tier: 3  # BUT frequently_used in some profiles → gets examples
    examples:
      - description: "Search for React documentation"
        input:
          query: "React server components best practices 2026"
          type: "keyword"
        expected: "Returns relevant React documentation links"
      - description: "Company research"
        input:
          query: "Anthropic AI company funding rounds"
          type: "keyword"
        expected: "Returns company financial information"
```

## Testing

```bash
# Validate examples YAML
node -e "const yaml = require('js-yaml'); const fs = require('fs'); yaml.load(fs.readFileSync('.aios-core/data/mcp-tool-examples.yaml', 'utf8')); console.log('VALID')"

# Verify no regressions
npm test
```

## File List

| File | Action | Description |
|------|--------|-------------|
| `.aios-core/data/mcp-tool-examples.yaml` | Created | Input examples for top-10 MCP tools |
| `.aios-core/data/entity-registry.yaml` | Modified | Add `invocationExamples` field |

## CodeRabbit Integration

| Field | Value |
|-------|-------|
| **Story Type** | Feature / Data |
| **Complexity** | Medium |
| **Primary Agent** | @dev |
| **Self-Healing Mode** | light (2 iterations, 15 min, CRITICAL only) |

**Severity Behavior:**
- CRITICAL: auto_fix (max 2 iterations)
- HIGH: document_as_debt
- MEDIUM: ignore
- LOW: ignore

**Focus Areas:**
- ADR-5 compliance (no examples on deferred tools)
- Example accuracy and correctness
- Entity registry schema integrity

## QA Results

_Pending implementation_

## Dev Agent Record

_Pending implementation_

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-22 | @sm (River) | Story drafted from Blueprint v2.0 + Codex ALTO-1 split |
