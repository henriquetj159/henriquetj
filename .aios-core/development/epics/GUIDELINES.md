# Epic Governance Guidelines

**Version:** 1.0
**Last Updated:** 2026-03-12
**Applies To:** All epics in `.aios-core/development/epics/`

---

## Directory Structure (Obrigatório)

Cada epic DEVE ter:

```
epics/{YYYY-MM}-{domain}/
├─ README.md                      ← Entry point
├─ docs/
│  ├─ EPIC-master.md              ← Vision + AC + timeline
│  ├─ EPIC-status.md              ← Daily updates
│  ├─ EPIC-runbook.md             ← How to execute
│  └─ EPIC-audit-findings.md      ← Research/context (se aplicável)
├─ stories/
│  ├─ INDEX.md                    ← Links para todas as stories
│  └─ story-details/
│     └─ (optional: resumos locais)
└─ templates/
   ├─ story-template.md
   └─ checklist-template.md
```

**Regra:** Sem exceção. Consistency = escalabilidade.

---

## Naming Convention

### Epic Directory
- Format: `{YYYY-MM}-{domain}`
- Examples:
  - `2026-03-squad-ecosystem-quality` ✅
  - `2026-04-workflow-architecture` ✅
  - `squad-audit-v3` ❌ (sem data)
  - `2026-big-project-epic` ❌ (domain vago)

### Files
- `EPIC-{descriptor}.md` (master docs)
- `story-{domain}-{action}.md` (filhas em docs/stories/active/)
- `INDEX-{category}.md` (consolidated views)

**Regra:** `{TYPE}-{DOMAIN}-{DESCRIPTOR}`. Always.

---

## Checklist: New Epic

Quando criar novo epic, fazer EXATAMENTE isto:

```
1. [ ] Create directory: .aios-core/development/epics/{YYYY-MM}-{domain}/
2. [ ] Create README.md com quick stats
3. [ ] Create docs/ folder com 3 docs (master, status, runbook)
4. [ ] Create stories/ folder com INDEX.md
5. [ ] Create templates/ folder (copy from previous epic)
6. [ ] Create 5-7 stories em docs/stories/active/ com padrão {TYPE}-{DOMAIN}-{ACTION}
7. [ ] Add row em docs/projects/ACTIVE.md
8. [ ] Link em master INDEX (docs/stories/active/INDEX-*.md)
9. [ ] Create ClickUp folder com tasks
10. [ ] Schedule first standup meeting
11. [ ] Communicate ao squad-chief
```

**Tempo:** ~2h setup completo

---

## Document Templates

### EPIC-master.md
```markdown
# EPIC: {Title}

**Epic ID:** {ID}
**Status:** Backlog | Ready | In Progress | Complete
**Priority:** HIGH | MEDIUM | LOW
**Created:** YYYY-MM-DD
**Owner:** @name

## Vision
{1-3 paragraphs}

## Stories Filhas
| # | Story | Squad | P | AC | Owner |
|---|-------|-------|---|----|----|

## Acceptance Criteria
- [ ] All X stories completed
- [ ] Metrics: Y → Z

## Timeline
- Sprint 1: Days X-Y
- Sprint 2: Days Y-Z

## Resources
- Teams: N devs
- Effort: XXh total
- Budget: $X (if applicable)
```

### EPIC-status.md
```markdown
# EPIC Status

**Last Updated:** YYYY-MM-DD HH:MM
**Overall Progress:** X%

## Story Status
| Story | Owner | Status | Progress | Blocker |
|-------|-------|--------|----------|---------|

## Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|

## Upcoming Milestones
- M1: Date (description)

## Communication Log
| Date | Event | Status |
|------|-------|--------|
```

### EPIC-runbook.md
```markdown
# EPIC Runbook

## Prerequisites
- [ ] Checklist item 1
- [ ] Checklist item 2

## Execution Steps
1. Step 1: ...
2. Step 2: ...

## Troubleshooting
| Issue | Solution |
|-------|----------|

## Rollback
If needed: [steps]

## Contact
- Epic Owner: @name
- Squad Chief: @name
```

---

## Status Labels

Use **SEMPRE** estes labels:

```
Status:
🟡 PENDING   — não começou
🔵 IN_PROG   — em andamento
🟢 COMPLETE  — pronto
⚠️ BLOCKED   — bloqueado
❌ FAILED    — não passou QA
```

Priority:
```
🔴 P0 (CRÍTICO)
🟠 P1 (ALTO)
🟡 P2 (MÉDIO)
🔵 P3 (BAIXO)
```

---

## Communication Rules

### Daily Standup
- **Frequência:** 15 min, mesmo horário
- **Quem:** Epic owner + 7 lead devs (ou mais)
- **Format:** 1 min por dev (what done + what's next + blockers)
- **Saída:** Updated EPIC-status.md

### Weekly Sync
- **Frequência:** 1h, sexta-feira
- **Attendees:** Squad chief + epic owner + team leads
- **Agenda:** Progress review + risk assessment + next week planning
- **Saída:** EPIC-status.md + meeting notes

### Escalation
- **Blocker detected:** Immediate Slack + meeting same day
- **Risk materialized:** Update docs + plan mitigation
- **Change request:** Document in EPIC-status.md + get approval

---

## Metrics & Success Criteria

### Quantitative
```
✅ Success:
- 100% of stories completed
- 100% of AC met per story
- 0 regressions (other squads unaffected)
- Metric delta achieved (e.g., score 8.2 → 8.7)
```

### Qualitative
```
✅ Success:
- Stakeholders satisfied
- Documentation complete
- Team learned something valuable
- Process can be reused
```

---

## Escalation Matrix

| Issue | Owner | Escalate To | Timeline |
|-------|-------|-------------|----------|
| Story blocker | Dev | Epic Owner | Same day |
| Resource shortage | Epic Owner | Squad Chief | Within 24h |
| Scope creep | Dev | @PM | Within 24h |
| Safety/compliance | Dev | @Security | Immediate |

---

## Review Checklist (Before Close)

```
[ ] All 7 stories completed
[ ] All AC in green (100%)
[ ] Zero regressions detected
[ ] Documentation complete + updated
[ ] Test coverage >= target
[ ] Performance SLA met
[ ] Security review passed
[ ] Stakeholder sign-off
[ ] Release notes written
[ ] Next epic queued
```

---

## Templates Library

Dentro de `templates/`:

1. **story-template.md** — Use para todas as filhas
2. **epic-template.md** — Use para próximos epics
3. **checklist-template.md** — Use para acceptance criteria
4. **runbook-template.md** — Use para execution docs
5. **status-template.md** — Use para daily tracking

Copy-paste & customize. Nunca escrever from scratch.

---

## Governance Checkpoints

| Checkpoint | Owner | Gate |
|-----------|-------|------|
| Epic Creation | @PM / @Squad-Chief | Vision + AC must be clear |
| Story Assignment | Epic Owner | Each story has owner |
| Sprint Kickoff | Team Leads | All blockers resolved |
| Mid-Sprint | Epic Owner | Progress on track |
| Sprint Close | @QA | All AC met |
| Epic Complete | @Squad-Chief | Final sign-off |

---

## Best Practices

✅ DO:
- Create epic BEFORE writing code
- Update status.md daily (automation OK)
- Run daily standups religiously
- Document blockers immediately
- Reference stories in commits
- Link everything (no orphans)
- Archive completed epics (keep for reference)

❌ DON'T:
- Skip epic creation (go straight to stories)
- Let status.md get stale
- Create stories without epic
- Promise timeline without estimates
- Hide blockers (escalate immediately)
- Create stories without AC
- Use vague names (be specific)

---

## Archive Strategy

When epic completes:

```
.aios-core/development/epics/completed/
└─ 2026-03-squad-ecosystem-quality/
   ├─ [all files from active epic]
   └─ COMPLETION-REPORT.md
```

Keep for reference. Reference in memory for future epics.

---

## Questions?

Check:
1. This file (GUIDELINES.md)
2. Most recent completed epic (reference)
3. ACTIVE.md (see live examples)
4. Ask @squad-chief

---

Generated: 2026-03-12
Version: 1.0
