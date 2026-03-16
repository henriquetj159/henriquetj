# Checkpoint: /new-project Hardening

**Data:** 2026-03-15
**Contexto:** Análise profunda + implementação de melhorias críticas no sistema /new-project
**Branch:** `chore/devops-10-improvements`
**Chiefs Consultados:** pedro-valerio, oalanicolas, squad-chief, kaizen

---

## O Que Foi Feito

### ✅ Fase 1: Quick Wins (COMPLETO - commit a1645d6df)

**Score:** 7.8/10 → 8.7/10
**Esforço:** 3-4h
**Commits:** 1 commit (a1645d6df)

#### Tasks Completadas
1. **C1: Dry-run validation** — `tools/validate-structure.js`
   - Modo `--dry-run` com 4 pre-flight checks
   - Valida ANTES de criar qualquer arquivo (fail-fast)
   - Checks: diretório pai, conflitos, permissões, path absoluto
   - ✅ 8/8 testes passando

2. **C2: Decision tree** — `.claude/commands/new-project.md`
   - Guia visual para escolher CENTRALIZED vs HYBRID
   - Tabela com casos de uso de cada modo
   - "Na dúvida? Use CENTRALIZED"

3. **H4: Coluna Modo** — `docs/projects/ACTIVE.md`
   - 📦 = CENTRALIZED (72% dos projetos)
   - 🏠 = HYBRID (28% dos projetos)
   - 18 linhas atualizadas manualmente

4. **H2: Symlinks em HYBRID** — `tools/create-epic-structure.js`
   - Detecta modo automaticamente (.aios/ exists?)
   - Cria symlinks: `docs/INDEX.md` → `../.aios/INDEX.md`
   - Elimina duplicação de fonte de verdade
   - ✅ Testado em /tmp com sucesso

5. **Passo 7: Sugestão de upgrade** — `.claude/commands/new-project.md`
   - Se tipo = app/squad/pipeline → sugere `/new-project-full`
   - Melhora discoverability do pipeline completo

### 🚧 Fase 2: Robustez (PARCIAL - não commitado ainda)

**Score alvo:** 8.7/10 → 9.5/10
**Esforço:** 6-8h
**Status:** F2.1-F2.6 implementados, mas NÃO testados completamente

#### Tasks Implementadas (needs testing)

1. **F2.1: Rollback automático** — `.claude/commands/new-project.md`
   - Se validação falhar 2x → oferece remover estrutura criada
   - Desfaz na ordem inversa (ACTIVE.md → .claude → docs → dirs)
   - Pergunta ao usuário antes de deletar
   - ⚠️ **NÃO IMPLEMENTADO NO CÓDIGO** (só documentado no skill)

2. **F2.2: Validar header ACTIVE.md** — `.claude/commands/new-project.md`
   - Antes de append, verifica header da tabela
   - Se corrompido → WARN + corrige automaticamente
   - Se vazio → cria header padrão
   - ⚠️ **NÃO IMPLEMENTADO NO CÓDIGO** (só documentado no skill)

3. **F2.3: epics/ opcional** — `tools/create-epic-structure.js`
   - Flag `--skip-epics` adicionada
   - Tabela de decisão por tipo:
     - app/squad → cria epics/
     - pipeline/mind-clone/knowledge/research → pula epics/
   - ✅ Testado: `/tmp/test-skip-epics` passou

4. **F2.4: Tipo híbrido app+squad** — `.claude/commands/new-project.md`
   - Pergunta 6 adicionada: "Tem squad associado?"
   - Merge de checklists (app + squad)
   - Merge de settings.json (permissões combinadas)
   - ⚠️ **NÃO IMPLEMENTADO NO CÓDIGO** (só documentado no skill)

5. **F2.5: Registry central** — `tools/validate-active.js` (NOVO arquivo)
   - Escaneia ACTIVE.md linha por linha
   - Detecta links quebrados (INDEX.md não existe)
   - Atualiza `.aios/project-registry.json` (last_seen, mode, type)
   - ✅ Testado: 17/18 projetos OK, 1 link detectado como diretório

6. **F2.6: /validate-active skill** — `tools/validate-active.js` (integrado com F2.5)
   - Oferece auto-fix para remover rows quebradas do ACTIVE.md
   - Output colorido: ✅ OK, ❌ Broken
   - ✅ Funcional, testado com ACTIVE.md atual

---

## Arquivos Modificados

### Commit a1645d6df (Fase 1)
```
M tools/validate-structure.js       (+110 linhas - modo dry-run)
M tools/create-epic-structure.js    (+34 linhas - symlinks HYBRID)
M .claude/commands/new-project.md   (+51 linhas - decision tree + Passo 7)
M docs/projects/ACTIVE.md           (+20 linhas - coluna Modo)
```

### Working directory (Fase 2 - NÃO commitado)
```
M tools/create-epic-structure.js    (+23 linhas - --skip-epics)
M .claude/commands/new-project.md   (+48 linhas - rollback, header validation, app+squad)
A tools/validate-active.js          (NOVO - 157 linhas)
```

---

## Estado dos Testes

### Fase 1 (commit a1645d6df)
| # | Teste | Status |
|---|-------|--------|
| 1 | dry-run path novo | ✅ 4/4 PASS |
| 2 | dry-run projeto existente | ✅ FAIL (detectou conflito) |
| 3 | dry-run path relativo | ✅ PASS (resolve auto) |
| 4 | dry-run pai inexistente | ✅ FAIL (detectou 2 erros) |
| 5 | epic-structure HYBRID | ✅ Symlinks criados |
| 6 | epic-structure CENTRALIZED | ✅ Sem symlinks |
| 7 | validate pós-criação CENTRALIZED | ✅ 6/6 PASS |
| 8 | validate pós-criação HYBRID | ✅ Detectou INDEX sem Metrics |

**8/8 testes passando.**

### Fase 2 (working directory)
| # | Feature | Status |
|---|---------|--------|
| F2.1 | Rollback automático | ⚠️ Documentado, mas NÃO implementado em código |
| F2.2 | Validar header ACTIVE.md | ⚠️ Documentado, mas NÃO implementado em código |
| F2.3 | --skip-epics | ✅ Testado, funciona |
| F2.4 | app+squad | ⚠️ Documentado, mas NÃO implementado em código |
| F2.5 | Registry central | ✅ Testado, funciona |
| F2.6 | validate-active skill | ✅ Testado, funciona |

**Apenas F2.3, F2.5, F2.6 estão realmente implementados em código.**
**F2.1, F2.2, F2.4 precisam ser convertidos de documentação para código executável.**

---

## Blockers e Gaps

### 🔴 Crítico
1. **F2.1, F2.2, F2.4 não implementados em código**
   - Atualmente são apenas instruções no `.claude/commands/new-project.md`
   - Precisam de scripts/funções executáveis
   - Skill `/new-project` não roda código, só instrui agentes

2. **Rollback (F2.1) precisa de tracking de arquivos criados**
   - Atual: skill cria arquivos, mas não guarda lista
   - Solução: criar `{project-path}/.new-project.log` com lista de arquivos criados
   - Ao rodar rollback, ler o log e deletar cada arquivo

3. **Header validation (F2.2) precisa de script helper**
   - Atual: skill faz append direto no ACTIVE.md
   - Solução: criar `tools/append-to-active.js` que valida header antes de append

4. **app+squad (F2.4) precisa de merge de JSON**
   - Atual: `copy-project-config.js` copia apenas 1 tipo
   - Solução: adicionar flag `--merge-types app,squad` que faz deep merge

### 🟡 Médio
1. **validate-active.js não está integrado como skill**
   - Arquivo existe, mas não tem `.aios/skills/validate-active/SKILL.md`
   - Não aparece no autocomplete de `/`
   - Solução: criar skill wrapper

2. **project-registry.json não está sendo usado ainda**
   - validate-active.js cria/atualiza registry
   - Mas nenhum outro script lê o registry ainda
   - Solução: fazer ACTIVE.md ser gerado a partir do registry (source of truth)

---

## Próximos Passos

### Imediato (antes de commit)
1. **Implementar F2.1 (rollback) em código:**
   - Criar `tools/rollback-project.js`
   - Modificar `new-project.md` Passo 6 para rodar script
   - Testar: criar projeto, forçar validação a falhar, confirmar rollback

2. **Implementar F2.2 (header validation) em código:**
   - Criar `tools/append-to-active.js --project {nome} --mode {HYBRID|CENTRALIZED} --path {link}`
   - Modificar `new-project.md` Passo 4 para usar script em vez de echo/append manual
   - Testar: corromper header, rodar append, verificar auto-fix

3. **Implementar F2.4 (app+squad) em código:**
   - Modificar `tools/copy-project-config.js` para aceitar `--merge-types app,squad`
   - Criar `tools/merge-checklists.js` que combina 2 tipos
   - Testar: criar projeto app+squad, verificar settings.json merged

4. **Testar Fase 2 end-to-end:**
   - Criar projeto tipo `research` (sem epics)
   - Criar projeto tipo `app` com squad associado
   - Forçar validação a falhar e rodar rollback
   - Corromper ACTIVE.md header e adicionar projeto

5. **Commit Fase 2:**
   ```bash
   git add tools/ .claude/commands/new-project.md
   git commit -m "feat: implement rollback, header validation, and app+squad support (Fase 2)"
   ```

### Curto prazo (Fase 3 para 10/10)
1. **F3.1: Template research** (30min)
   - Criar `tools/templates/project-configs/research/.claude/settings.json`
   - Permissões: WebSearch, WebFetch, Task para analyst/tech-search

2. **F3.2: Handoff automático** (1h)
   - Modificar `new-project.md` Passo 7 para criar session file automaticamente
   - Template: `docs/sessions/YYYY-MM/handoff-{nome}-{timestamp}.md`

3. **F3.3: Testes Jest** (2h)
   - `tests/validate-structure.test.js`
   - `tests/create-epic-structure.test.js`
   - `tests/validate-active.test.js`

4. **F3.4: Idempotência** (30min)
   - Rodar `/new-project` 2x no mesmo path não quebra
   - Se estrutura existe, perguntar: "Sobrescrever? (S/N)"

---

## Checklist de Retomada

Para continuar na próxima sessão:

- [ ] Ler este checkpoint
- [ ] Revisar working directory (`git status`)
- [ ] Decidir se commita Fase 2 parcial OU implementa F2.1/F2.2/F2.4 primeiro
- [ ] Se implementar: criar os 3 scripts faltantes (rollback, append-to-active, merge-types)
- [ ] Testar end-to-end antes de commit
- [ ] Commit Fase 2 completo
- [ ] Começar Fase 3 (template research + handoff auto + testes + idempotência)

---

## Scores de Qualidade

| Métrica | Antes (7.8/10) | Fase 1 (8.7/10) | Fase 2 alvo (9.5/10) | Fase 3 alvo (10/10) |
|---------|----------------|-----------------|----------------------|---------------------|
| Governance | 8/10 | 9/10 | 10/10 | 10/10 |
| Templates | 7/10 | 7/10 | 9/10 | 10/10 |
| Scalability | 9/10 | 9.5/10 | 10/10 | 10/10 |
| Automation | 9/10 | 10/10 | 10/10 | 10/10 |
| Documentation | 6/10 | 8/10 | 9/10 | 10/10 |

**Fase 1 completa:** 8.7/10 ✅
**Fase 2 parcial:** ~9.0/10 (falta implementar F2.1/F2.2/F2.4)
**Fase 3 estimada:** 10/10 (4-5h de esforço)

---

## Referências

- **Análise inicial:** Mensagem do usuário (análise profunda com chiefs)
- **Commit Fase 1:** `a1645d6df`
- **Chiefs consultados:**
  - pedro-valerio: Score 6.7/10, detectou violação fail-late
  - oalanicolas: Extraiu 10 heurísticas implícitas + DNA do sistema
  - squad-chief: Score 7.8/10, confirmou necessidade de decision tree
  - kaizen: Consolidou recomendações em 3 fases

---

**Fim do checkpoint.**
**Última atualização:** 2026-03-15 21:18 (contexto quase no limite, não rolou teste completo da Fase 2)
