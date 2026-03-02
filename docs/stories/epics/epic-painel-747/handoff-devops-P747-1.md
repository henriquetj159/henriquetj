# DevOps Handoff - Story P747-1

## Story Reference
- Story: `docs/stories/epics/epic-painel-747/story-P747-1-hard-mvp-cockpit-ui.md`
- Status atual: `Ready for Review`
- QA Gate atual: `CONCERNS` (somente build nao conclusivo em sandbox)

## Technical Summary
- Cockpit MVP implementado em `ui/src/app/dashboard/page.tsx`
- Componentizacao concluida:
  - `ui/src/components/cockpit/MetricCard.tsx`
  - `ui/src/components/cockpit/TrendChart.tsx`
  - `ui/src/components/cockpit/GaugeDial.tsx`
  - `ui/src/components/cockpit/StatusLed.tsx`
  - `ui/src/components/cockpit/types.ts`
- Integracao de dados com fallback resiliente em `ui/src/lib/dashboard-data.ts`
  - `/api/v1/dashboard/top6`
  - `/api/v1/alerts/history`
  - `/api/v1/metrics/deep-dive`
- Filtros reais via query params (`productId`, `period`) no dashboard
- Redirect raiz `/` -> `/dashboard`
- Tema cockpit global em `ui/src/app/globals.css`

## Known Concern
- `npm run build` no sandbox atual falhou por restricao de ambiente (Turbopack bind/process permission), nao por erro funcional de codigo.
- Revalidar build em ambiente DevOps/CI real antes do push.

## Pre-Push Checklist (DevOps)
1. Validar status da story e QA Results atualizados
2. Rodar quality gates no `ui/`:
   - `npm run lint`
   - `npm run build`
3. Rodar quality gates no repo raiz (conforme AGENTS.md):
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
4. Garantir worktree limpo e sem conflitos
5. Gerar resumo de gate e solicitar confirmacao para push
6. Criar PR com descricao da story e evidencias de testes
7. Executar deploy conforme pipeline do repositorio

## Suggested Commands
- Local (UI):
  - `cd ui && npm run lint`
  - `cd ui && npm run build`
- Root quality gates:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
- Agent DevOps flow:
  - `@devops *pre-push`
  - `@devops *create-pr`
  - `@devops *push`
  - `@devops *release` (se aplicavel)

## Deployment Note
- Esta story e orientada a frontend MVP. Caso deploy parcial seja permitido, priorizar ambiente staging para validacao visual do cockpit antes de promover para producao.
