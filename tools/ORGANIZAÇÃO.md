# 📚 Sistema de Organização AIOX

Este guia ensina como usar a estrutura de organização mostrada na aula.

## 🎯 A Filosofia

**Epic → Stories → Tasks → Code → QA → Deploy**

Igual linha de montagem: cada peça tem seu lugar, cada etapa tem seu checkpoint.

---

## 🏗️ Setup Inicial (Primeira Vez)

### 1. Criar estrutura em um projeto novo

```bash
# Dentro do seu projeto (ou caminho que quiser)
node ~/aios-core/tools/create-epic-structure.js .

# Ou em qualquer outro lugar
node ~/aios-core/tools/create-epic-structure.js ~/CODE/Projects/meu-projeto
```

Isso cria:
```
docs/
├── stories/
│   ├── active/      # Stories em andamento
│   ├── done/        # Stories concluídas
│   └── epics/       # Epics (agrupam stories)
├── sessions/        # Handoffs entre sessões
│   └── 2026-03/     # Organizado por ano-mês
├── HANDOFFS-INDEX.md
├── INDEX.md         # Estado do projeto
└── README.md
```

---

## 📝 Criar Epic (Projeto Grande)

### 2. Criar um novo Epic

```bash
node ~/aios-core/tools/new-epic.js 15 correcoes-melhorias-crm

# Saída:
# ✅ Epic criado com sucesso!
# 📂 docs/stories/epics/EPIC-15-correcoes-melhorias-crm/
# 📄 EPIC-15-correcoes-melhorias-crm-master.md
```

### 3. Preencher o Epic

Abrir `docs/stories/epics/EPIC-15-correcoes-melhorias-crm/EPIC-15-correcoes-melhorias-crm-master.md` e:

1. **Objetivo** — Por que estamos fazendo isso?
2. **Acceptance Criteria** — Como sabemos que está pronto?
3. **Stories** — Quebrar em pedaços menores (Stories)

**Exemplo:**

```markdown
## Objetivo

Corrigir 14 bugs reportados no CRM e melhorar UX de campos de entrada.

**Problema:** Clientes reclamam de validação de email e campo de telefone que não aceita DDD.
**Solução:** Refatorar validações + adicionar máscaras.
**Valor:** Reduzir tickets de suporte em 40%.

## Stories

| ID | Story | Status | Owner | Est. |
|----|-------|--------|-------|------|
| 15.1 | Corrigir validação de email | Draft | @dev | 2h |
| 15.2 | Adicionar máscara de telefone | Draft | @dev | 3h |
| 15.3 | Testes E2E de formulários | Draft | @qa | 2h |

**Total Estimado:** 7h
```

---

## ✍️ Criar Stories (Pedaços de Trabalho)

### 4. Criar uma Story

```bash
node ~/aios-core/tools/new-story.js 15.1 corrigir-validacao-email

# Saída:
# ✅ Story criada com sucesso!
# 📄 docs/stories/active/STORY-15.1-corrigir-validacao-email.md
```

### 5. Preencher a Story

Abrir `docs/stories/active/STORY-15.1-corrigir-validacao-email.md` e:

1. **User Story** — Como [quem], Quero [o quê], Para que [por quê]
2. **Acceptance Criteria** — Checkboxes mensuráveis
3. **Tasks** — Passo a passo técnico
4. **Files Affected** — Quais arquivos vou tocar

**Exemplo:**

```markdown
## User Story

**Como** usuário do CRM,
**Quero** que o campo de email aceite endereços válidos com subdomínios,
**Para que** eu possa cadastrar clientes de empresas grandes (ex: joao.silva@dept.empresa.com.br).

## Acceptance Criteria

- [ ] AC-1: Email com 2+ subdomínios é aceito (ex: a@b.c.d.com)
- [ ] AC-2: Email inválido mostra mensagem clara
- [ ] AC-3: Testes cobrem 5+ edge cases

## Tasks

- [ ] T-1: Atualizar regex de validação em `lib/validators.js` (15min)
- [ ] T-2: Adicionar testes unitários (20min)
- [ ] T-3: Testar manualmente no formulário (10min)

**Total:** 45min
```

---

## 🚀 Workflow de Trabalho

### 6. Trabalhar na Story

1. **Marcar como In Progress**
   - Mudar `Status: Draft` → `Status: In Progress` no topo da story

2. **Fazer o trabalho**
   - Seguir as tasks
   - Marcar checkboxes conforme completa

3. **Atualizar File List**
   - Adicionar arquivos modificados em `Files Affected`

4. **Rodar DoD (Definition of Done)**
   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```

5. **Marcar como Ready for Review**
   - Mudar `Status: In Progress` → `Status: Ready for Review`

6. **Após Review: Mover para Done**
   ```bash
   # Manualmente mover arquivo
   mv docs/stories/active/STORY-15.1-corrigir-validacao-email.md \
      docs/stories/done/
   ```

---

## 📊 Manter Atualizado

### 7. Atualizar INDEX.md

Sempre que concluir uma story, atualizar `docs/INDEX.md`:

```markdown
## Metrics

- **Total Epics:** 3
- **Active Stories:** 2
- **Completed Stories:** 8
- **Last Updated:** 2026-03-14
```

### 8. Criar Handoffs

Ao final de uma sessão de trabalho:

```bash
# Criar arquivo manualmente em docs/sessions/YYYY-MM/
docs/sessions/2026-03/session-2026-03-14-epic-15-kickoff.md
```

**Template de Handoff:**

```markdown
# Handoff — Epic 15 Kickoff

**Data:** 2026-03-14
**Duração:** 2h
**Epic:** [EPIC-15](../stories/epics/EPIC-15-correcoes-melhorias-crm/)

## O Que Foi Feito

- [x] Epic 15 criado com 3 stories
- [x] Story 15.1 implementada e testada
- [ ] Story 15.2 iniciada (50% completa)

## Próximos Passos

1. Terminar Story 15.2
2. Rodar testes E2E (Story 15.3)
3. Deploy

## Blockers

- Nenhum

## Decisões Tomadas

- Usar biblioteca `validator.js` em vez de regex custom (menos bugs)

## Handoff Para

@dev — continuar Story 15.2 amanhã
```

Adicionar linha em `docs/HANDOFFS-INDEX.md`:

```markdown
| 2026-03-14 | Epic 15 Kickoff | [sessions/2026-03/...](sessions/2026-03/session-2026-03-14-epic-15-kickoff.md) | ✅ Complete |
```

---

## 🎨 Cultura de Organização

### Regras de Ouro

1. **Um Epic por tema grande** — Não misture features não relacionadas
2. **Stories pequenas** — Se passar de 4h, quebrar em 2 stories
3. **Sempre atualizar INDEX.md** — É o estado atual do projeto
4. **Handoffs em sessions/** — Nunca perder contexto entre sessões
5. **Mover para done/** — Arquivo limpo em `active/` = foco claro

### Naming Conventions

| Tipo | Formato | Exemplo |
|------|---------|---------|
| Epic | `EPIC-XX-short-description/` | `EPIC-15-correcoes-melhorias-crm/` |
| Story | `STORY-X.Y-short-description.md` | `STORY-15.1-corrigir-validacao-email.md` |
| Session | `session-YYYY-MM-DD-topic.md` | `session-2026-03-14-epic-15-kickoff.md` |

---

## 🔥 Quick Commands

```bash
# Setup inicial (primeira vez)
node ~/aios-core/tools/create-epic-structure.js .

# Criar Epic
node ~/aios-core/tools/new-epic.js 15 correcoes-melhorias-crm

# Criar Story
node ~/aios-core/tools/new-story.js 15.1 corrigir-validacao-email

# Ver estado do projeto
cat docs/INDEX.md

# Ver todos os handoffs
cat docs/HANDOFFS-INDEX.md

# Listar stories ativas
ls -lh docs/stories/active/

# Listar epics
ls -lh docs/stories/epics/
```

---

## 💡 Exemplo Completo (End-to-End)

```bash
# 1. Setup (só precisa fazer uma vez)
cd ~/CODE/Projects/meu-crm
node ~/aios-core/tools/create-epic-structure.js .

# 2. Criar Epic
node ~/aios-core/tools/new-epic.js 15 correcoes-melhorias-crm

# 3. Preencher Epic (manual)
# Abrir docs/stories/epics/EPIC-15-correcoes-melhorias-crm/EPIC-15-correcoes-melhorias-crm-master.md
# Preencher Objetivo + Stories

# 4. Criar Stories
node ~/aios-core/tools/new-story.js 15.1 corrigir-validacao-email
node ~/aios-core/tools/new-story.js 15.2 adicionar-mascara-telefone

# 5. Trabalhar (manual)
# Abrir docs/stories/active/STORY-15.1-corrigir-validacao-email.md
# Implementar, testar, marcar checkboxes

# 6. Mover para done
mv docs/stories/active/STORY-15.1-corrigir-validacao-email.md docs/stories/done/

# 7. Criar handoff (manual)
# Criar docs/sessions/2026-03/session-2026-03-14-epic-15-complete.md

# 8. Atualizar índices (manual)
# Atualizar docs/INDEX.md
# Atualizar docs/HANDOFFS-INDEX.md
```

---

## ❓ FAQ

**P: Preciso criar Epic para todo projeto?**
R: Não. Para trabalhos pequenos (< 4h), crie só uma Story diretamente em `active/`.

**P: Posso ter múltiplos Epics ativos?**
R: Sim, mas evite. Foco > quantidade. Termine um Epic antes de começar outro.

**P: E se eu esquecer de preencher algo?**
R: Não tem problema. Volte e preencha depois. O importante é ter **algo** documentado.

**P: Posso adaptar os templates?**
R: SIM! Eles são pontos de partida. Adapte ao seu workflow.

---

**Criado em:** 2026-03-14
**Baseado em:** Aula AIOX — De Squad no Terminal ao Produto no Mundo
**Inspiração:** Estrutura mostrada na imagem (docs/stories/epics/)
