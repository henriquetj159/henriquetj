# Ensinio — Project Index

## Estado Atual
- **Squad ativo:** `ensinio-mind` v3.0.0 — KB enrichment via tl;dv calls
- **Epic:** [EPIC-ENSINIO-APP](../../stories/epics/epic-ensinio-prospector-app/EPIC.md) — Evolução Squad → App
- **Local:** `docs/projects/ensinio/`
- **ensinio-mind:** v3.0.0 — 5/28 calls processadas (batch 1 completo), 8 data files enriquecidos
- **ensinio-whatsapp-prospector:** v5.0 — Sheets auditado, 75/77 GHL sync OK (parado)

## Dados do Projeto
- **Phone-book:** `squads/ensinio-whatsapp-prospector/data/phone-books/mentoria-50k.json`
- **Outputs:** `squads/ensinio-whatsapp-prospector/data/outputs/mentoria-50k/`
  - `EXECUTIVE-SUMMARY.md` — Resumo executivo com Top 5 e action plan
  - `analysis-results-FINAL.md` — Relatório detalhado
  - `analysis-results.md` — Análise completa (2025 linhas, todos os 77 prospects)
  - `outreach-messages.md` — 77 mensagens personalizadas com WhatsApp links
  - `unique-quotes-top20.md` — Quotes fingerprint para busca no WhatsApp
  - `outreach-sheets-final.tsv` — Dados formatados para Google Sheets (7 colunas)
  - `populate-sheet.gs` — Google Apps Script para popular planilha automaticamente
- **Planilha:** `https://docs.google.com/spreadsheets/d/124EQQAkmt9D7-49LbR-Jx64DhxdtCwceUQgqolk5ZFI`
- **Scripts:** `squads/ensinio-whatsapp-prospector/scripts/`
  - `generate-sheets-csv.js` — Gera TSV com 12 colunas (formato expandido)
  - `generate-sheets-paste.js` — Gera TSV com 7 colunas (formato planilha padrão)
  - `generate-apps-script.js` — Gera Apps Script com dados embutidos

## Última Sessão (2026-03-14 — LATEST)
- **Data:** 2026-03-14
- **Agente/Squad:** ensinio-mind (extract-from-calls task)
- **O que foi feito:**
  1. ✅ Processou batch 1 (5 maiores transcrições tl;dv, ~57K palavras)
  2. ✅ Extraiu ~45 insights (15 objeções, 7 técnicas, 5 ICPs, 6 concorrentes, 5 red flags, 8 cases, 4 ciclos)
  3. ✅ Atualizou 8/15 data files do ensinio-mind
  4. ✅ Bumped version 2.1.0 → 3.0.0
  5. ✅ Renomeou 5 transcrições com prefixo `(MIND-CLONING OK)`
  6. ✅ Commitado: `1608de6d7`

---

## Sessão Anterior (GHL Integration)
- **Data:** 2026-03-12 ~18:30
- **Agente/Squad:** Epic EPIC-ENSINIO-APP + GHL Sync Investigation
- **Resumo:**
  1. ✅ Criado Epic EPIC-ENSINIO-APP com 4 milestones (M0→M4)
  2. ✅ 5 stories M0 criadas e validadas com @po (READY FOR IMPLEMENTATION)
  3. ✅ Investigado endpoint `/opportunities/` 404 → encontrado problema: faltava trailing slash
  4. ✅ Testado fluxo de deduplicação com test-ghl-single.js → **SUCCESS HTTP 201**
  5. ✅ Descoberto: lookup endpoint `/contacts/lookup/phone/` NÃO funciona (404)
  6. ✅ Solução: tentar criar → se 400, extrair contactId do erro meta
  7. ✅ Blocker GHL documentado em ADR-001-tech-stack.md + M0.4 story

## Próximo Passo
- **ensinio-mind:** Processar batch 2 (calls #6-10) com `*extract-from-calls` — restam 23 transcrições
- **ensinio-whatsapp-prospector:** Verificar 2 telefones pendentes, implementar Phase 8/9 v5.0

## Histórico
| Data | Sessão | Resumo |
|------|--------|--------|
| 2026-03-14 | ensinio-mind v3.0 | Batch 1: 5 calls processadas, 8 data files enriquecidos, ~45 insights extraídos |
| 2026-03-12 (3) | Sheets Audit + GHL Sync | Auditoria 77 leads, 9 telefones corrigidos, 23 nomes completados, 75 sincronizados no GHL |
| 2026-03-12 (2) | GHL Integration v4.0 | API GHL validada, pipeline v4.0 com sync (contact+deal+msg), tag prompt, image-first phone resolution |
| 2026-03-10 (2) | Phone Resolution + Sheets | 77/77 telefones resolvidos, scripts Google Sheets, MCP OAuth configurado |
| 2026-03-10 (1) | Outreach completo | 57 novas mensagens (score 3-6), total 77/77 prospects cobertos |
| 2026-03-09 (3) | Phone Resolution + Outreach | 20/20 telefones resolvidos, 20 mensagens personalizadas escritas |
| 2026-03-09 (2) | Pipeline real MENTORIA 50K | Parse+Score de 9708 linhas: 178 contatos, 77 qualificados, 20 HOT |
| 2026-03-09 (1) | Squad v3.0.0 | 4 melhorias: phone resolution, ICP/red flags, batch, scoring v2.1 |

## Epic & Stories
- **Epic:** [EPIC-ENSINIO-APP](../../stories/epics/epic-ensinio-prospector-app/EPIC.md) — 4 milestones (M0→M4), ~20 stories
- **ADR:** [ADR-001 Tech Stack](../../stories/epics/epic-ensinio-prospector-app/ADR-001-tech-stack.md) — Decisões arquiteturais
- **Stories M0:** `docs/stories/active/story-M0.*` — Fundação técnica (5 stories)

## Squads Relacionados
- `ensinio-whatsapp-prospector` — Pipeline de prospecção via WhatsApp (v4.0, base do app)
- `ensinio-mind` — Source of truth do conhecimento Ensinio (v3.0.0, 15 data files)
- `ensinio-prospector` — Prospecção geral (consome ensinio-mind)
