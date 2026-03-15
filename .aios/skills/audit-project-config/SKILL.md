# Audit Project Config Skill

Valida configurações `.claude/` de projetos existentes contra templates atuais.

## Uso

```
/audit-project-config
```

ou

```
/audit-project-config {project-name}
```

## O Que Faz

1. **Scanneia projetos:**
   - Lê `docs/projects/ACTIVE.md`
   - Detecta projetos CENTRALIZED e HYBRID
   - Identifica caminho de cada projeto

2. **Valida configuração `.claude/`:**
   - Verifica se `.claude/` existe
   - Compara `settings.json` com template atual
   - Verifica se `CLAUDE.md` tem placeholders não substituídos
   - Valida que `behavioral-rules.md` está atualizado

3. **Gera relatório de gaps:**
   - Lista projetos sem `.claude/`
   - Lista projetos com configuração desatualizada
   - Lista projetos com placeholders não substituídos

4. **Oferece auto-fix:**
   - Pergunta se quer corrigir gaps automaticamente
   - Executa `copy-project-config.js` para projetos com problemas

## Workflow

Quando invocado:

1. **Ler ACTIVE.md:**
   - Parse table para extrair lista de projetos
   - Para cada projeto, extrair:
     - Nome (coluna "Projeto")
     - Link INDEX (coluna "INDEX")
     - Detectar modo (HYBRID se link contém `.aios/`, CENTRALIZED se contém `docs/projects/`)

2. **Para cada projeto:**
   - Computar caminho `.claude/`:
     - CENTRALIZED: `docs/projects/{nome}/.claude/`
     - HYBRID: `{path-from-link}/../.claude/` (relativo ao INDEX.md)
   - Verificar se `.claude/` existe
   - Se existe:
     - Ler `settings.json` e comparar com template (verificar se tem keys essenciais)
     - Ler `CLAUDE.md` e buscar por `{{` (placeholder não substituído)
     - Verificar se `behavioral-rules.md` existe
   - Se não existe:
     - Marcar como "MISSING CONFIG"

3. **Gerar relatório:**

```markdown
# Audit Report — Project Configurations

**Data:** {hoje}
**Total Projetos:** {N}
**Com Configuração:** {X}
**Sem Configuração:** {Y}
**Desatualizados:** {Z}

## ✅ OK ({X} projetos)

| # | Projeto | Modo | Config Path |
|---|---------|------|-------------|
| 1 | my-app | HYBRID | ~/CODE/Projects/my-app/.claude/ |

## ❌ Missing Config ({Y} projetos)

| # | Projeto | Modo | Esperado Em |
|---|---------|------|-------------|
| 2 | old-proj | CENTRALIZED | docs/projects/old-proj/.claude/ |

## ⚠️ Outdated / Incomplete ({Z} projetos)

| # | Projeto | Issue | Details |
|---|---------|-------|---------|
| 3 | partial-app | Placeholders | {{PROJECT_NAME}} não substituído |
| 4 | legacy-squad | Missing behavioral-rules.md | — |
```

4. **Perguntar ao usuário:**

Use `AskUserQuestion` com opções:
- "Corrigir automaticamente todos os gaps"
- "Corrigir apenas projetos sem config"
- "Apenas mostrar relatório (não corrigir nada)"
- "Escolher quais projetos corrigir"

5. **Se escolher auto-fix:**
   - Para cada projeto com gap:
     - Ler INDEX.md para extrair tipo de projeto
     - Executar `node ~/aios-core/tools/copy-project-config.js {destination} {type} "{name}" {mode}`
     - Validar que foi criado com sucesso
     - Atualizar relatório: ❌ → ✅

6. **Mostrar resumo final:**

```
🎉 Audit Complete!

✅ 15 projetos OK
🔧 5 projetos corrigidos
⏭️ 2 projetos pulados (escolha do usuário)
```

## Detalhes de Validação

### settings.json
Verificar que contém pelo menos:
- `permissions.allow` (array não vazio)
- `permissions.deny` (array contendo deny rules de segurança)
- `alwaysThinkingEnabled` (boolean)

### CLAUDE.md
Verificar que NÃO contém:
- `{{PROJECT_NAME}}`
- `{{MODE}}`
- `{{INDEX_PATH}}`
- `{{STORIES_PATH}}`
- `{{SESSIONS_PATH}}`
- `{{PROJECT_SLUG}}`
- `{{SAVE_LOCATION}}`
- `{{MODE_DESCRIPTION}}`

Se contém, marcar como "Placeholders não substituídos"

### behavioral-rules.md
Verificar que arquivo existe e tem conteúdo (> 100 chars).

## Edge Cases

- **Projeto sem tipo definido no INDEX.md:** Usar `knowledge` como fallback
- **Path inválido no ACTIVE.md:** Marcar como "INVALID PATH" e pular
- **Projeto externo sem .aios/INDEX.md:** Marcar como "HYBRID MODE INCOMPLETE"

## Exemplo de Uso

```
User: /audit-project-config

Claude:
🔍 Auditando configurações de projetos...

Lendo docs/projects/ACTIVE.md...
✅ Encontrados 20 projetos

Validando configurações...
[██████████] 20/20

📊 Relatório gerado!

✅ OK: 15 projetos
❌ Missing Config: 3 projetos (ensinio-mind, legacy-tool, old-research)
⚠️ Outdated: 2 projetos (partial-app tem placeholders, squad-x sem behavioral-rules.md)

Quer corrigir automaticamente?
1. Sim, corrigir todos os 5 gaps
2. Apenas criar config para os 3 sem config
3. Não, só mostrar relatório
```

## Implementação

Execute estas ações sequencialmente:

1. Ler `docs/projects/ACTIVE.md`
2. Parse table (regex ou split por linhas)
3. Para cada projeto:
   - Extrair nome, link INDEX, detectar modo
   - Validar `.claude/` conforme regras acima
4. Gerar relatório markdown
5. Usar `AskUserQuestion` para escolher ação
6. Se auto-fix:
   - Para cada projeto com gap:
     - Ler INDEX.md → extrair tipo
     - `node copy-project-config.js ...`
     - Validar sucesso
7. Mostrar resumo final

## Notas

- **Não modificar** projetos que já têm `.claude/` funcionando (mesmo que desatualizado levemente)
- **Respeitar** customizações do usuário em `project-rules.md`
- **Nunca sobrescrever** `settings.json` que foi customizado (a menos que usuário confirme)
- **Logging:** Mostrar progresso durante scan (barra de progresso ou emoji ✅ ❌)
