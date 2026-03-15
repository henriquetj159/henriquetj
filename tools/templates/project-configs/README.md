# Project Config Templates

Templates de configuração `.claude/` para novos projetos AIOX.

## Estrutura

```
project-configs/
├── base/                    # Template base (todos herdam)
│   ├── .claude/
│   │   ├── settings.json   # Permissões padrão
│   │   ├── CLAUDE.md       # Instruções de projeto
│   │   └── rules/
│   │       ├── behavioral-rules.md  # NEVER/ALWAYS
│   │       └── project-rules.md     # Placeholder customizável
│   └── docs/
│       └── README.md
├── app/                     # Override para apps
├── squad/                   # Override para squads
├── mind-clone/              # Override para mind clones
├── pipeline/                # Override para pipelines
├── knowledge/               # Override para knowledge bases
└── research/                # Override para research projects
```

## Como Funciona

1. **Base é sempre copiado** — todos os projetos começam com `base/`
2. **Override por tipo** — se existe template específico, sobrescreve apenas `settings.json`
3. **Placeholders** — `CLAUDE.md` tem {{VARS}} que são substituídas no `/new-project`

## Permissões por Tipo

### Base
- Read/Write/Edit/Bash básico
- Git local operations (pull, commit, add, etc.)
- **DENY:** git push, destructive commands

### App (+npm/docker/build)
- Base +
- npm/yarn/pnpm/bun commands
- docker/docker-compose commands
- **DENY:** npm publish, docker push

### Squad (+Task/agents)
- Base +
- Task tool para squad agents
- Task tool para AIOX agents

### Mind Clone (+WebSearch/WebFetch priority)
- Base +
- WebFetch/WebSearch unrestricted
- Task tool para mind-cloning squad

### Pipeline (+media tools)
- Base +
- ffmpeg, imagemagick, convert
- python/node script execution

### Knowledge (+Glob/Grep/Read amplified)
- Base +
- Glob/Grep/Read unrestricted

### Research (+deep-research tools)
- Base +
- WebFetch/WebSearch unrestricted
- Task tool para deep-research/tech-search agents

## Uso

Integrado automaticamente no `/new-project` skill (Passo 2.8).

Manual:
```bash
# Copiar template para projeto externo
cp -r tools/templates/project-configs/base/.claude ~/CODE/Projects/meu-app/
cp tools/templates/project-configs/app/.claude/settings.json ~/CODE/Projects/meu-app/.claude/

# Substituir placeholders no CLAUDE.md
sed -i '' 's/{{PROJECT_NAME}}/Meu App/g' ~/CODE/Projects/meu-app/.claude/CLAUDE.md
```

## Manutenção

Ao atualizar regras:
1. Edite `base/` primeiro (afeta todos)
2. Teste com `/audit-project-config` skill
3. Override específico só se necessário

## Validação

Use `/audit-project-config` para validar projetos existentes contra templates atuais.
