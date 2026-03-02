# Pre-Push Report - P747-1

## Scope
Frontend cockpit MVP + PRD/Architecture docs for Painel 747.

## Staged Files (Story Scope)
- docs/architecture.md
- docs/brief.md
- docs/front-end-architecture.md
- docs/prd.md
- ui/src/app/dashboard/page.tsx
- ui/src/app/globals.css
- ui/src/app/layout.tsx
- ui/src/app/page.tsx
- ui/src/components/cockpit/GaugeDial.tsx
- ui/src/components/cockpit/MetricCard.tsx
- ui/src/components/cockpit/StatusLed.tsx
- ui/src/components/cockpit/TrendChart.tsx
- ui/src/components/cockpit/types.ts
- ui/src/lib/dashboard-data.ts

## Quality Gates
- UI lint (`cd ui && npm run lint`): PASS
- Root typecheck (`npm run typecheck`): PASS
- Root lint (`npm run lint`): FAIL (pre-existing repository-wide issues)
- Root tests (`npm test`): FAIL (pre-existing multi-suite failures)

## Waiver Justification
Root `lint` and `test` failures are not isolated to P747-1 scope and were already present in unrelated modules and test suites. This PR is scoped to UI cockpit + product docs and keeps local UI quality gate passing.

## Risks
- Merging without root gate stabilization may keep CI red if pipeline enforces full-repo checks.
- `docs/stories/` artifacts are git-ignored by repository rule and cannot be included unless force-added.

## Recommended DevOps Action
1. Create PR with scoped files only.
2. Mark waiver for pre-existing root failures and link this report.
3. Run staging deploy for visual validation of cockpit.
4. Open follow-up technical debt issue to stabilize root lint/test baseline.
