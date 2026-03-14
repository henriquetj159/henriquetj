# Ensinio — Padrões de Onboarding & Migração

> Dados reais extraídos de calls de vendas (Ricardo) e suporte (Bhrenda). Alimentado pela task `extract-from-calls.md`.

## Padrões de Migração por Plataforma Anterior

| Plataforma anterior | Estratégia de migração | Timeline | Riscos | Fonte |
|---------------------|----------------------|----------|--------|-------|
| **Hotmart** | Manter alunos antigos na Hotmart (integração), migrar novos para Ensinio. Checkout paralelo possível (teste A/B com Eduzz). | 20-30 dias | Reprocessamento de cartão pode causar churn de alunos antigos | tl;dv call "69b45eb" |
| **Academia** | Migração completa. Planilha de alunos (bulk import). Aguardar App 2.0 (abril) para timing ideal. | 2-4 semanas | Launch em progresso pode atrasar início | tl;dv call "Como Elevar" |
| **Carne Academia** | Migração gradual "formiguinha" (3-6 meses). Manter plataformas em paralelo. | 3-6 meses | Duplo custo, fragmentação de esforço, risco de esquecimento | tl;dv call "Continuação Luiz e Flávia" |
| **WhatsApp manual** | Sem migração de conteúdo. Setup de AI Agent do zero. | 2-5 dias | Curva de aprendizado do prospect, expectativa de ROI imediato | tl;dv call "Como implementar agentes" |

## Componentes do Onboarding (Ricardo)

### Migração Assistida
Ricardo usa a metáfora da mudança de casa:
> "Vocês tiram os pertences da gaveta e colocam numa caixa. A gente pega essa caixa e leva pra nova casa."

**Fluxo:**
1. Prospect exporta dados (planilha CSV ou acesso à plataforma anterior)
2. Ensinio importa estrutura (cursos → módulos → aulas)
3. Prospect valida e faz ajustes visuais (capas, descrições)
4. Alunos migrados via bulk import ou convite por email

### Trilha de Onboarding
1. **Trilha gravada** (vídeos do Gui Ávila no YouTube) — autoserviço
2. **Call de tira-dúvidas** com gerente de conta (Bhrenda) — agendada
3. **Check-in em 21 dias** — "a gente pega no pé de vocês de forma positiva"

> "Nada mais justo que vocês usarem 100% do que vocês estão investindo." — Ricardo

### Prazos Reais Comunicados
| Item | Prazo comunicado | Prazo real estimado |
|------|-----------------|-------------------|
| Migração de aulas | "Máximo 30 dias" | 20-25 dias |
| App Apple (aprovação) | "2 meses" | 1-1.5 meses |
| App Google Play | "10-15 dias" | Similar |
| Setup básico (sem migração) | "2-3 dias" | 2-3 dias |
| AI Agent configurado | "2 dias" | 1-2 dias (co-criação na call) |

**Padrão Ricardo:** Over-promete prazo para cima (ex: fala 2 meses, entrega em 1.5). Gera surpresa positiva.

## Fricções Comuns por Etapa

| Etapa | Fricção | Frequência | Solução Padrão | Fonte |
|-------|---------|-----------|----------------|-------|
| Migração | Reprocessamento de cartão (alunos antigos) | Alta | Manter alunos na plataforma anterior, migrar só novos | tl;dv call "69b45eb" |
| Migração | Volume alto de aulas (600+ aulas) | Média | Planilha assistida + time acelera para 20-25 dias | tl;dv call "69b45eb" |
| Setup | Falta de autonomia para banners/CTAs | Alta (quem vem de Academia) | Ensinio permite edição direta (sem suporte) | tl;dv call "Como Elevar" |
| Setup | Push notifications (sem app nativo atual) | Média | App 2.0 vindo em abril, usar Telegram/WhatsApp enquanto isso | tl;dv call "Como Elevar" |
| AI Agent | Curva de aprendizado do prospect | Alta | Co-criação ao vivo na call + follow-up sexta | tl;dv call "Como implementar agentes" |
| AI Agent | Consumo de créditos alto (franquias) | Média | Testar com 300 créditos grátis, calcular média real | tl;dv call "Como automatizar vendas" |

## FAQs de Vendas (Perguntas Reais dos Prospects)

| Pergunta | Resposta Padrão | Fonte |
|----------|----------------|-------|
| "Aceita compras internacionais?" | "Sim, com American Express. Para outros cartões, integração com Hotmart/Stripe." | tl;dv call "Como Elevar" |
| "Posso usar YouTube mascarado + Ensinio Stream?" | "Sim, modelo híbrido. Alguns vídeos no YouTube mascarado, outros no Ensinio Stream (com Chromecast/Airplay)." | tl;dv call "69b45eb" |
| "Transmite para TV?" | "Ensinio Stream sim (Chromecast + Airplay). YouTube mascarado não permite." | tl;dv call "69b45eb" |
| "Tem fidelidade/carência?" | "Não tem fidelidade. Cancela quando quiser, igual Netflix." | tl;dv call "Como implementar agentes" |
| "A IA aparece como assistente virtual?" | "Pode configurar como 'secretária da [nome]', não como assistente virtual." | tl;dv call "Como implementar agentes" |
| "Armazenamento da comunidade enche?" | "Pesa muito pouco. Vídeo aula é o que conta. Nunca vimos problema." | tl;dv call "Continuação Luiz e Flávia" |

## Padrões de Setup por Nicho

| Nicho | Necessidades principais | Timeline típico | Gargalos comuns | Fonte |
|-------|------------------------|----------------|----------------|-------|
| Educação religiosa | UX premium, modelo assinatura, gamificação | 20-30 dias (migração de 600+ aulas) | Volume de conteúdo, checkout duplo durante transição | tl;dv call "69b45eb" |
| Blog monetization (grande criador) | App nativo, push notifications, autonomia de edição, multi-organização | 2-4 semanas (aguardar App 2.0) | Decisor ausente, launch em curso | tl;dv call "Como Elevar" |
| Advocacia online | AI Agent para qualificação de leads, follow-up automatizado | 2-5 dias | Expectativa ROI imediato, negócio novo | tl;dv call "Como implementar agentes" |
| Franquias educacionais | AI Agent para padronização de atendimento, integração CRM | 1-2 semanas (trial first) | Volume alto de créditos, ceticismo de chatbot | tl;dv call "Como automatizar vendas" |
| Costura/modelagem | Migração gradual, comunidade, programa de afiliados | 3-6 meses (paralelo) | Checkout internacional, antecipação de pagamento | tl;dv call "Continuação Luiz e Flávia" |

## Métricas de Onboarding

| Métrica | Valor | Última Atualização | Fonte |
|---------|-------|--------------------|-------|
| Tempo médio de setup (sem migração) | 2-3 dias | 2026-03-14 | tl;dv calls |
| Tempo médio de migração completa | 20-30 dias | 2026-03-14 | tl;dv call "69b45eb" |
| Taxa de conclusão do onboarding | *(pendente — dados de Bhrenda necessários)* | | |
| Principal motivo de ticket pós-setup | *(pendente — dados de Bhrenda necessários)* | | |

---

## TOP 10 Fricções Críticas (Batch 3, tl;dv 2026-03-14)

### #1. Migração de alunos com múltiplos produtos = trabalho manual gigante 🔴
**Frequência:** 4 calls (Gabriel Guitarrari, Camila Tourinho, Flavia Affonso, Rica Pro)

**Problema:**
- Cliente vem de Hotmart com aluno que comprou múltiplos produtos
- Precisa repetir email do aluno N vezes na planilha (1 linha por grupo)
- Trabalho manual enorme para 2.000+ alunos

**Workaround atual:** Planilha com repetição de email (sem automação)

**Impacto:** ALTO — gargalo de onboarding, atrasa migração completa, cliente frustra e adia

**Fonte:** tl;dv calls batch 3 (Gabriel Guitarrari, Camila Tourinho, Flavia Affonso, Rica Pro), 2026-03-11 a 2026-03-14

---

### #2. Dashboard de engajamento — "quem comprou X dias atrás e usou Y vezes" 🔴
**Frequência:** 3 calls (Marlos/Aforismos, Elton, Gil)

**Problema:**
- Cliente precisa saber: "Quem comprou há X dias e usou pelo menos Y vezes?"
- Hoje: Exportar vendas (jan) + exportar acessos (jan) → cruzar emails manualmente no Excel
- Não tem dashboard automática

**Workaround atual:** Cruzamento manual via Excel

**Impacto:** ALTO — retenção depende disso. Clientes usam para identificar quem precisa de follow-up.

**Feature Request:** Dashboard pronta com filtros (período de compra + frequência de acesso)

**Fonte:** tl;dv calls batch 3 (Aforismos, Elton Luiz, Gil Junior), 2026-03-11 a 2026-03-14

---

### #3. Bug arquivo .apkg (Anki flashcards) — CHURN RISK 🔴
**Frequência:** 1 call (Gil Junior)

**Problema:**
- Cliente de preparatórios (concursos) precisa de flashcards .apkg (Anki)
- Arquivo não funciona quando sobe (desconfigurado, não abre como deveria)
- **CRÍTICO** para nicho de concursos (PF, OAB, tribunais)

**Impacto:** ALTO — Gil Junior em 85% churn risk por isso. Nicho preparatórios é grande.

**Ação:** Resolver bug .apkg URGENTE — **P0**

**Fonte:** tl;dv call Gil Junior & Ensinio, 2026-03-14

---

### #4. Muitas capas para criar (horizontal, vertical, fundo, estampa, módulo) 🟡
**Frequência:** 3 calls (Flavia Affonso, Camila Tourinho, Elton)

**Problema:**
- Cada grupo precisa: capa horizontal, vertical, fundo, estampa, capas de módulos
- Trabalho de design grande (cliente pagou caro em plataforma anterior e precisa refazer tudo)
- Tamanhos diferentes da plataforma anterior

**Workaround atual:** Migração via dev (caso a caso) — Bhrenda oferece ajuda

**Impacto:** MÉDIO — atrasa migração, mas não impede

**Fonte:** tl;dv calls batch 3 (Flavia Affonso, Camila Tourinho), 2026-03-14

---

### #5. Email Microsoft bloqueado — problema conhecido sem solução 🟡
**Frequência:** 2 calls (Camila Tourinho, não especificado)

**Problema:**
- Email de boas-vindas bloqueado pela Microsoft (Outlook, Hotmail)
- Gmail funciona bem, Microsoft bloqueia
- Problema conhecido, sem solução atualmente

**Workaround atual:** "Use Gmail" (não resolve B2B)

**Impacto:** MÉDIO — afeta onboarding de alunos com email corporativo Microsoft

**Fonte:** tl;dv calls batch 3, 2026-03-14

---

### #6. Pagamento não cai no mesmo dia (Ted = até 3 dias) vs Hotmart D+2 🟡
**Frequência:** 1 call (Gil Junior)

**Problema:**
- Hotmart: saque até meio-dia cai no mesmo dia, após 17h cai no dia seguinte
- Ensinio: D+3 Ted (banco) — impossível mudar
- Cliente com fluxo de caixa semanal depende de saques rápidos

**Impacto:** ALTO — churn risk (Gil Junior comparando custos)

**Solução atual:** D+15 cartão, D+3 pix/boleto sem taxa de antecipação

**Fonte:** tl;dv call Gil Junior & Ensinio, 2026-03-14

---

### #7. Checkout em 2 etapas cria "lixo" na base (cadastro sem compra) 🟡
**Frequência:** 1 call (Camila Tourinho)

**Problema:**
- Checkout em 2 etapas: pessoas criam cadastro mas não finalizam compra
- Base fica com "lixo" (usuários sem acesso)

**Solução:** Mudar para checkout one-page (experiências → One page)

**Impacto:** BAIXO — resolvível facilmente

**Fonte:** tl;dv call Camila Tourinho, 2026-03-14

---

### #8. Não consegue criar sessões por aula (só módulo/grupo) 🟡
**Frequência:** 2 calls (Camila Tourinho, não especificado)

**Problema:**
- Cliente quer criar sessão mostrando apenas aulas específicas (ex: "Cardio Intenso" só as aulas desse tema)
- Limitação técnica: só módulos ou grupos
- Alternativa: tipo módulo (mostra módulos do grupo)

**Impacto:** MÉDIO — limitação de UX, não bloqueante

**Fonte:** tl;dv call Camila Tourinho, 2026-03-14

---

### #9. Limite de banda vs armazenamento (vídeos 4K consomem muito) 🟡
**Frequência:** 2 calls (Flavia Affonso, Box1824)

**Problema:**
- Cliente com vídeos 4K: "Tô com 86% de armazenamento e só uso 5% da banda mensal"
- Preocupação com custo de excedente (18-20 centavos/GB)

**Solução atual:** Comunicar custo 1 mês antes + oferecer planos maiores

**Impacto:** MÉDIO — afeta clientes premium com muito conteúdo

**Fonte:** tl;dv calls batch 3 (Flavia Affonso, Box1824), 2026-03-14

---

### #10. Botão SSO (Okta) muito em evidência confunde cliente final 🟢
**Frequência:** 2 calls (Prof. Fredão, 04032026-Meeting)

**Problema:**
- Botão "Entrar com Okta" em destaque na tela de login
- Cliente final (alunos) não usa Okta, só interno
- Confunde UX

**Solução:** Dev vai avaliar colocar botão SSO em segundo plano (embaixo do email/senha)

**Impacto:** BAIXO — questão estética, não bloqueante

**Fonte:** tl;dv calls batch 3 (Prof. Fredão, 04032026-Meeting), 2026-03-14

---

## Fonte Consolidada Completa

Para **47 fricções**, **58 FAQs** e **12 padrões de setup** completos, consultar:
**`squads/ensinio-mind/data/insights-batch-3-raw.md`** (785 linhas, seções consolidadas)

---

**Versão:** 2.1.0 | **Atualizado:** 2026-03-14 | **Fonte principal:** tl;dv calls batch 1+3 (21 calls, Ricardo + Bhrenda)
