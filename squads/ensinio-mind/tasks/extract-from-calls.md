# Task: Extrair Insights de Calls (tl;dv)

> Processa transcrições de calls do tl;dv (Google Drive) e enriquece o knowledge base com dados reais de campo.

## Quando usar
- Calls da semana acumularam no Drive (4-10 calls/semana)
- Trigger manual: "processa as calls da semana"
- Novo vendedor/CS entrou e precisa alimentar KB com primeiras calls

## Pré-requisitos
- [ ] Google Drive for Desktop sincronizado (pasta acessível localmente)
- [ ] Pasta das transcrições: `/Users/luizfosc/Library/CloudStorage/GoogleDrive-luizfosc@gmail.com/.shortcut-targets-by-id/1b2DqeBvE_0aH_REqLVWWqrIGQu6wyQDF/Ensinio - Gui e Fosc/BANCO DE DADOS/Transcrição das Reuniões TLDV`
- [ ] Acesso aos data files em `squads/ensinio-mind/data/`

## Speakers

| Speaker | Área | Tipo de call | Insights esperados |
|---------|------|-------------|-------------------|
| Ricardo | Vendas | Demo, negociação, follow-up | Objeções, técnicas, ICP, red flags, concorrentes |
| Bhrenda | Suporte/Onboarding | Setup, treinamento, CS | Fricções, FAQs, padrões de setup, timeline |

## Processo

### Fase 1: Discovery (5 min)

1. Listar arquivos `.md` na pasta local das transcrições:
   ```
   Glob: "*.md" na pasta de transcrições tl;dv
   ```
2. Filtrar arquivos cujo nome **NÃO** começa com `(MIND-CLONING OK)`
3. Listar arquivos novos com: nome, data de modificação, word count estimado
4. Apresentar lista ao usuário e confirmar quais processar

**Gate:** Sem arquivos novos → parar e avisar. Arquivos com < 200 palavras → flaggar como incompleto, perguntar se processa.

### Fase 2: Read & Classify (10 min)

Para cada arquivo aprovado na Fase 1:

1. Ler conteúdo completo via `Read` (arquivo .md local)
2. Classificar por speaker e tipo:

| Indicador | Classificação |
|-----------|--------------|
| Ricardo mencionado / título com "vendas", "sales", "demo" | `vendas` |
| Bhrenda mencionada / título com "suporte", "onboarding", "cs" | `suporte` |
| Ambíguo | Perguntar ao usuário |

3. Gerar resumo de 2-3 linhas de cada call

### Fase 3: Extract Insights (20-40 min)

#### Para calls de VENDAS (Ricardo)

| Insight | Formato | Destino |
|---------|---------|---------|
| Objeções reais (frase literal do prospect + resposta dada) | Citação direta | `ensinio-sales-playbook.md` |
| Técnicas de fechamento usadas | Descrição + contexto | `ensinio-sales-playbook.md` |
| Perfis de prospects (nicho, faturamento, audiência, plataforma anterior) | Dados estruturados | `ensinio-icps.md` |
| Red flags observados | Sinal + contexto | `ensinio-red-flags.md` |
| Menções a concorrentes + argumentos usados | Concorrente + argumento | `ensinio-competitors.md` |
| Cases citados (verificar se já existem no KB) | Nome + resultado | `ensinio-cases.md` |
| Insights de timeline/gargalos | Etapa + duração | `ensinio-sales-cycle.md` |

#### Para calls de SUPORTE (Bhrenda)

| Insight | Formato | Destino |
|---------|---------|---------|
| Pontos de fricção no onboarding | Etapa + dor | `ensinio-onboarding-patterns.md` |
| Perguntas frequentes | Pergunta + resposta padrão | `ensinio-onboarding-patterns.md` |
| Padrões de setup por nicho | Nicho + config típica | `ensinio-onboarding-patterns.md` |
| Tempo de onboarding + gargalos | Timeline + bloqueio | `ensinio-sales-cycle.md` |
| Bugs/feature requests | Descrição | **NÃO vai pro KB** (separar e avisar usuário) |

### Fase 4: Mapping (10 min)

1. Consolidar insights de todas as calls processadas
2. Para cada insight, verificar:
   - [ ] Dado **novo** → marcar para inserção
   - [ ] **Confirmação** de padrão existente → marcar para reforço (ex: incrementar frequência)
   - [ ] **Contradição** com KB → PAUSAR e perguntar ao usuário
3. Gerar mapa: `insight → arquivo destino → seção específica → ação (inserir/atualizar/reforçar)`

### Fase 5: Review (10-20 min)

1. Apresentar resumo executivo:
   - X calls processadas
   - Y insights extraídos (por tipo)
   - Z arquivos a modificar
2. Preview de cada mudança proposta (estilo diff)
3. Usuário aprova, rejeita ou edita cada mudança

**Vetos obrigatórios (pausa automática):**
- Contradiz dado existente no KB
- Métrica suspeita (ex: faturamento > R$ 500K, audiência > 1M)
- Dados pessoais detectados (CPF, email pessoal, telefone)
- Informação sem contexto suficiente para validar

### Fase 6: Update KB (20-40 min)

1. Aplicar mudanças aprovadas nos data files
2. Se `ensinio-onboarding-patterns.md` não existe, criar com template base
3. Manter formato existente de cada arquivo (tabelas, headers, checklists)
4. Adicionar fonte e data em cada dado novo: `(Fonte: tl;dv call {título}, {data})`
5. Atualizar `config.yaml`:
   - Bumpar versão patch (ex: 2.0.0 → 2.1.0)
   - Adicionar "tl;dv calls (Ricardo/Bhrenda)" em sources se não existir
   - Adicionar `ensinio-onboarding-patterns.md` ao data list se criado
6. Commit: `docs(ensinio-mind): enrich KB vX.Y from tl;dv calls`

### Fase 7: Mark as Processed (5 min)

1. Para cada arquivo processado com sucesso:
   - Renomear localmente adicionando `(MIND-CLONING OK) ` no início do nome do arquivo
   - Exemplo: `call-2026-03-14.md` → `(MIND-CLONING OK) call-2026-03-14.md`
   - Método: `mv` via Bash (o rename sincroniza automaticamente para o Drive)
2. Relatório final:
   - X arquivos processados / Y ignorados
   - Z insights extraídos (breakdown por tipo)
   - W arquivos atualizados
   - Próxima execução sugerida: "daqui a 1 semana"

## Veto Conditions

- **NUNCA** adicionar dados pessoais (CPF, email pessoal, telefone pessoal)
- **NUNCA** inventar insights que não estão na transcrição
- **NUNCA** sobrescrever dados existentes sem confirmação
- **NUNCA** incluir bugs/feature requests no KB (separar e reportar)
- **SEMPRE** citar fonte (call + data) em cada dado adicionado
- **SEMPRE** pausar se dado contradiz KB existente
- **SEMPRE** anonimizar nomes de prospects/clientes (usar nicho + porte)

## Output

- Data files atualizados em `squads/ensinio-mind/data/`
- Arquivos processados renomeados com prefixo `(MIND-CLONING OK)` (sync automático pro Drive)
- Config.yaml versionado
- Commit feito
- Relatório de execução apresentado

## Compatibilidade

Esta task complementa `update-kb.md`. A diferença:
- `update-kb.md` → fontes estruturadas (formulários, CSVs, docs)
- `extract-from-calls.md` → fontes não-estruturadas (transcrições de calls)

Ambas alimentam os mesmos data files e seguem as mesmas veto conditions.

---

**Criado:** 2026-03-14 | **Tipo:** Operacional | **Fonte:** tl;dv (.md via Google Drive sync)
