# Architect Agent Memory

## EPIC-ACT Wave 2 Quality Gate Review (2026-02-06)
- Reviewed: ACT-6 (Unified Activation Pipeline, 67 tests, APPROVED)
- Total EPIC-ACT: 255 tests pass across 4 test suites (0 regressions)
- UnifiedActivationPipeline: single entry point, 5-way parallel load, 3-phase sequential, GreetingBuilder final
- Timeout architecture: 150ms per-loader, 200ms total pipeline, fallback greeting on failure
- Timer leak concern: _timeoutFallback setTimeout not cancelled when pipeline wins the race (advisory, not blocking)
- generate-greeting.js refactored to thin wrapper; backward compatible
- All 12 agent .md files updated with unified STEP 3 reference
- *validate-agents command added to aios-master (validate-agents.md task file)

## EPIC-ACT Wave 1 Quality Gate Review (2026-02-06)
- Reviewed: ACT-1 (config fix, merged), ACT-2 (user_profile audit, 31 tests), ACT-3 (ProjectStatusLoader, 90 tests), ACT-4 (PermissionMode, 67 tests)
- All 188 tests pass across 3 test suites
- Key patterns: fingerprint-based cache invalidation, file locking with wx flag, mode cycling (ask>auto>explore)
- PermissionMode reads from `.aios/config.yaml`, NOT from `.aios-core/core-config.yaml` - different config hierarchy
- GreetingPreferenceManager reads from `.aios-core/core-config.yaml` (agentIdentity.greeting.preference)
- The *yolo command cycles PermissionMode; it does NOT directly change greeting preference

## Architecture Patterns to Track
- Agent activation: UnifiedActivationPipeline is now THE single entry point for all 12 agents (ACT-6)
- Previous two paths (Direct 9 agents + CLI wrapper 3 agents) are now unified
- generate-greeting.js is thin wrapper around UnifiedActivationPipeline (backward compat)
- user_profile cascades: config-resolver > validate-user-profile > greeting-preference-manager > greeting-builder
- Permission system: permission-mode.js + operation-guard.js + index.js (facade)
- ProjectStatusLoader: .aios/project-status.yaml (runtime cache), separate from .aios-core/ (framework config)
- PM agent bypasses bob mode restriction in _resolvePreference()

## Key File Locations
- Unified Pipeline: `.aios-core/development/scripts/unified-activation-pipeline.js`
- Permissions: `.aios-core/core/permissions/`
- Greeting system: `.aios-core/development/scripts/greeting-builder.js`, `greeting-preference-manager.js`
- Project status: `.aios-core/infrastructure/scripts/project-status-loader.js`
- User profile validation: `.aios-core/infrastructure/scripts/validate-user-profile.js`
- Post-commit hook: `.aios-core/infrastructure/scripts/git-hooks/post-commit.js` + `.husky/post-commit`
- Validate agents task: `.aios-core/development/tasks/validate-agents.md`

## JARVIS Architecture (2026-02-26)
- Created: `docs/stories/jarvis/ARCHITECTURE-JARVIS.md` (v0.1.0-draft)
- JARVIS = Composition layer on top of existing agents, NOT a replacement
- 6 core components: Intent Engine, Router/Dispatcher, Execution Monitor, Autonomy Engine, Personality Layer, Multi-Platform Adapter
- Hybrid NLU: Tier 1 regex patterns (<10ms, ~80% coverage) + Tier 2 LLM fallback (~20%)
- Autonomy levels: full / supervised / manual (YAML-configured rules)
- CLI First (Constitution Art. I): CLI primary, Slack/Discord/REST are secondary adapters
- Authority Passthrough: JARVIS inherits delegated agent's authority, never escalates
- Consumes existing: AgentInvoker, WorkflowOrchestrator, MasterOrchestrator, workflow-chains.yaml, SYNAPSE
- New file tree: `.aios-core/core/jarvis/` (intent/, router/, monitor/, autonomy/, personality/, adapters/, config/, session/)
- CLI entry: `bin/jarvis.js` or `npx aios-core jarvis`
- 6 ADRs proposed (J1-J6): composition layer, hybrid NLU, YAML rules, CLI primary, event-driven, optional
- 16-story roadmap in 4 phases: Foundation, Orchestration, Adapters, Intelligence

## JARVIS Voice Hub Analysis (2026-02-28)
- Created: `docs/stories/wave2-ux-analysis.md`
- Voice Hub v6.0: 2,657 LOC across 6 files (server.js 781, app.js 1389, styles.css 251, index.html 158, sw.js 61, manifest.json 17)
- Architecture: Vanilla JS monolith, no build step, Express+WS+OpenAI Realtime API
- W2.7-W2.12 all ALREADY IN CODEBASE despite roadmap showing them as pending
- W2.7 (file preview): DONE, addFilePreview() + fp-* CSS classes, collapsible code blocks
- W2.8 (OCR): BROKEN — sends PDF buffer as data:application/pdf to GPT-4o Vision (unsupported MIME). Needs pdf-to-img conversion first
- W2.9 (toasts): DONE, showToast() 4 types, auto-dismiss, animation
- W2.10 (theme): DONE, dark/light toggle, localStorage persistence, html.light CSS overrides
- W2.11 (PWA): PARTIAL — manifest + sw.js work, but only has inline SVG emoji icon (no proper 192/512 PNGs)
- W2.12 (auth): PARTIAL — server middleware complete (PIN, token, protected routes), but ZERO frontend auth code in app.js. WebSocket NOT protected.
- Security concern: run_command blocklist is bypassable; WS gives full tool access without auth
- Key file: apps/jarvis-hub/ (NOT in .aios-core/ — this is L4 project runtime)

## WAVE 3 Core Analysis (2026-02-28)
- Created: `docs/stories/wave3-core-analysis.md`
- 17 items analyzed: 5 ALREADY DONE, 6 Quick Wins, 5 Medium Effort, 1 Heavy Lift, 0 Deprecated (INS-4.11 done)
- W3.1 (ACT-2), W3.2 (ACT-3), W3.3 (ACT-4), W3.5 (ACT-6), W3.12 (INS-4.11) = already completed
- W3.14 (CODEINTEL-RP-001) = QA PASS, 351 tests, just needs status update to DONE
- W3.8 (phantom memory): REMOVE dead try/catch refs in context-injector.js + subagent-dispatcher.js
- W3.9 (3 duplicate task pairs): apply-qa-fixes/dev-apply-qa-fixes, create-next-story/sm-create-next-story, validate-next-story/dev-validate-next-story
- W3.10 (3 elicitation dupes): agent-elicitation.js IDENTICAL, task-elicitation.js IDENTICAL, workflow-elicitation.js DIFFERENT (core is newer)
- W3.11 (config migration) = ONLY W4 BLOCKER. migrate-config.js + config-resolver.js exist but never executed
- Config resolver: 5-level hierarchy L1 Framework > L2 Project > Pro > L3 App > L4 Local > L5 User
- W3.17 (GHIM-001): only 1 checkbox remaining — run each Action once with test issue
- Execution order: Phase A (housekeeping 3h) > Phase B (cleanup 5h) > Phase C (config migration 10h) > Phase D (enhancements 25h)
- Total estimated: 40-55 hours across 3-4 sessions

## Pre-existing Test Failures (not EPIC-ACT related)
- squads/mmos-squad/ (6 suites): missing clickup module
- tests/core/orchestration/ (2 suites): greenfield-handler, terminal-spawner
