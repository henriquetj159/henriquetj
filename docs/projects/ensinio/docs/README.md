# Documentation

Este diretório contém toda a documentação de desenvolvimento do projeto.

## Estrutura

```
docs/
├── stories/
│   ├── active/      # Stories em progresso
│   ├── done/        # Stories concluídas
│   └── epics/       # Epics (agrupam stories)
├── sessions/        # Handoffs entre sessões
├── HANDOFFS-INDEX.md
├── INDEX.md         # Estado do projeto
└── README.md        # Este arquivo
```

## Workflow

1. **Criar Epic** → `docs/stories/epics/EPIC-XX-name/`
2. **Criar Stories** → `docs/stories/active/STORY-X.Y-name.md`
3. **Trabalhar** → Atualizar checkboxes, File List
4. **Concluir** → Mover para `done/`
5. **Handoff** → Criar em `sessions/YYYY-MM/`

Veja [INDEX.md](INDEX.md) para estado atual.
