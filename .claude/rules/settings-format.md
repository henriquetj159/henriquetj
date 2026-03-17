# Settings Format Rules

## Formato Correto do .claude/settings.json

### ✅ CORRETO

```json
{
  "hooks": {},
  "permissions": {
    "allow": [...],
    "deny": [...]
  }
}
```

**Regra:** `hooks` DEVE ser um **objeto** (`{}`), nunca um array (`[]`).

---

## ❌ ERRADO (Formato Antigo)

```json
{
  "hooks": [],  // ← ERRADO! Causa erro "Expected record, but received array"
  "permissions": {...}
}
```

---

## Estrutura Completa dos Hooks

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node script.cjs",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",  // ← String simples, não objeto!
        "hooks": [...]
      }
    ]
  }
}
```

**Detalhes:**
- `hooks` (raiz): Objeto com chaves de eventos (`SessionStart`, `PostToolUse`, etc)
- Cada evento: Array de objetos com `hooks` ou `matcher` + `hooks`
- `matcher`: String simples (`"Edit"`, `"Write"`), **não** `{"tools": ["Edit"]}`

---

## Validação Automática

O script `.claude/hooks/validate-settings-format.cjs` roda automaticamente no `SessionStart` e:

1. Detecta formato errado (`hooks` como array)
2. Corrige automaticamente (converte para objeto `{}`)
3. Salva o arquivo corrigido
4. Avisa no console

**Execução manual:**
```bash
node .claude/hooks/validate-settings-format.cjs
```

---

## Projetos HYBRID

Para projetos HYBRID (fora do aios-core):

**Opção 1 (Recomendada):** NÃO criar `.claude/settings.json`
→ Projeto herda automaticamente do aios-core

**Opção 2:** Criar com formato mínimo:
```json
{
  "hooks": {},
  "permissions": {...}
}
```

**NUNCA:**
- ❌ Copiar/colar hooks do aios-core (duplicação desnecessária)
- ❌ Usar formato antigo com `hooks` como array
- ❌ Criar settings.json sem necessidade

---

## Troubleshooting

### Erro: "Expected record, but received array"

**Causa:** Arquivo `.claude/settings.json` com formato antigo (`"hooks": []`)

**Solução:**
1. Rodar: `node .claude/hooks/validate-settings-format.cjs`
2. Ou remover o arquivo (se for projeto HYBRID) para herdar do aios-core
3. Ou corrigir manualmente: `"hooks": []` → `"hooks": {}`

---

## Referência

- Schema completo: https://json.schemastore.org/claude-code-settings.json
- Docs oficiais: https://code.claude.com/docs/en/hooks
