# Painel 747 Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Consolidar os principais indicadores de vendas, campanhas e SEO em um painel unico por produto.
- Reduzir o tempo de diagnostico de performance para afiliados durante execucao de campanhas.
- Aumentar a qualidade das decisoes operacionais com sinais visuais claros e acionaveis.
- Diminuir dependencia de multiplas ferramentas desconectadas para leitura de performance.

### Background Context
Afiliados geralmente acompanham metricas criticas em plataformas diferentes, o que torna a analise lenta e propensa a erro. Essa fragmentacao dificulta a identificacao rapida de gargalos de conversao, queda de qualidade de trafego e variacoes de performance ao longo do tempo.

O Painel 747 propoe uma experiencia de monitoramento inspirada em cockpit: visao consolidada, foco no essencial e leitura operacional imediata. O objetivo e permitir que o afiliado entenda rapidamente o estado da campanha de um produto e aja com maior confianca.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-01 | 0.1 | Draft inicial de Goals, Background e Requirements | Morgan (PM) |
| 2026-03-01 | 0.2 | Refino de Requirements com criterios testaveis | Morgan (PM) |
| 2026-03-01 | 0.3 | Inclusao de metricas obrigatorias de vendas/campanha e consistencia de calculo | Morgan (PM) |
| 2026-03-01 | 0.4 | Inclusao de mitigacoes de risco para atribuicao, confiabilidade e leitura operacional | Morgan (PM) |
| 2026-03-01 | 0.5 | Priorizacao MVP (YAGNI): requisitos avancados movidos para post-MVP | Morgan (PM) |
| 2026-03-01 | 0.6 | Refinos de fluxo UI: empty state, seletor global de produto e estados de dados | Morgan (PM) |
| 2026-03-01 | 0.7 | Corte critico de UI para MVP: funcao acima de tema e simplificacao de fluxos | Morgan (PM) |
| 2026-03-01 | 0.8 | Corte critico no Epic 2 com rollout de metricas e simplificacao de alertas no MVP inicial | Morgan (PM) |
| 2026-03-01 | 0.9 | Consolidacao do Epic 3 em 3 stories e move de itens avancados para post-MVP | Morgan (PM) |
| 2026-03-01 | 1.0 | Refino do Epic 3 com criterios mensuraveis, severidade formal e dependencias explicitas | Morgan (PM) |
| 2026-03-01 | 1.1 | Calibracao de metas operacionais e adicao de validacao de usabilidade no deep dive | Morgan (PM) |
| 2026-03-01 | 1.2 | Inclusao de riscos consolidados e plano de mitigacao de execucao do MVP | Morgan (PM) |
| 2026-03-01 | 1.3 | Definicao de Hard MVP e Expansion Gate para validar valor com menor complexidade inicial | Morgan (PM) |

## Requirements

### Functional
- FR1: O sistema deve permitir cadastrar e conectar APIs de fontes de dados de vendas, marketing e SEO para um produto.
- FR2: O sistema deve exibir um dashboard principal com cliques, visitas, conversao, receita e custo da campanha.
- FR3: O sistema deve permitir filtragem por periodo (dia, semana, mes e intervalo customizado).
- FR4: O sistema deve apresentar comparacao basica entre periodos (atual vs anterior) para metricas-chave.
- FR5: O sistema deve destacar automaticamente alertas visuais quando uma metrica-chave variar acima de um limiar configuravel (padrao inicial: 20%) em comparacao ao periodo anterior equivalente.
- FR6: O sistema deve permitir visualizar analise da campanha de um produto por vez com contexto unificado.
- FR7: O sistema deve registrar ultima atualizacao dos dados e status de sincronizacao por fonte conectada.
- FR8: O sistema deve oferecer visualizacao de metricas de pagina com, no minimo, visitas, taxa de rejeicao e tempo medio por pagina de destino.
- FR9: O sistema deve permitir personalizacao do painel MVP por mostrar/ocultar cartoes de indicadores pre-definidos.
- FR10: O sistema deve manter historico minimo de 90 dias de metricas para comparacoes de tendencia e periodos.
- FR11: O sistema deve exigir autenticacao de usuario e garantir que cada usuario acesse apenas suas configuracoes, integracoes e dados associados.
- FR12: O sistema deve exibir como metricas obrigatorias do cockpit no MVP: CTR, CPC, CPM, CPA, ROAS, Checkout Initials (IC), Taxa de Conversao da Pagina, Taxa de Conversao do Checkout, ROI e Taxa de Aprovacao de Boletos/Pix.
- FR13: O sistema deve manter um dicionario de metricas com nome, definicao, formula de calculo e origem dos dados para cada metrica exibida no painel.
- FR14 (Post-MVP): O sistema deve indicar status de disponibilidade por metrica (disponivel, estimada, indisponivel) quando houver ausencia ou atraso de dados na fonte.
- FR15 (Post-MVP): O sistema deve registrar e exibir por metrica a janela de atribuicao e regra de consolidacao usada por fonte, com versionamento de formula quando houver alteracoes.
- FR16: O sistema deve exibir timestamp de ultima atualizacao (freshness) e nivel de confiabilidade do dado por cartao/metrica no dashboard.
- FR17 (Post-MVP): O sistema deve permitir configuracao de limiares de alerta por metrica, com valor padrao inicial e ajuste por usuario.
- FR18 (Post-MVP): O sistema deve oferecer visao hierarquica de metricas no cockpit (primarias no primeiro viewport e secundarias em detalhes) para evitar sobrecarga visual.
- FR19 (Post-MVP): O sistema deve reconciliar metricas financeiras de ROI e aprovacao de boleto/pix considerando estados finais de pagamento, cancelamentos e chargebacks quando disponiveis.

### Non Functional
- NFR1: A API de agregacao deve responder em p95 <= 1200 ms para consultas do dashboard principal em condicoes normais de operacao.
- NFR2: A interface do dashboard principal deve renderizar em ate 800 ms apos recebimento do payload da API em condicoes normais.
- NFR3: O sistema deve suportar navegadores modernos (Chrome, Edge, Firefox, Safari recentes).
- NFR4: Credenciais e tokens de APIs devem ser armazenados com criptografia em repouso e transmitidos somente por canais criptografados.
- NFR5: O sistema deve apresentar disponibilidade mensal minima de 99.0% no ambiente de producao, excluindo janelas de manutencao planejada.
- NFR6: Falhas de integracao com APIs externas devem ser registradas com observabilidade suficiente para diagnostico (erro, fonte, timestamp e contexto minimo).
- NFR7: O sistema deve respeitar limites de taxa das APIs externas com mecanismo de retry exponencial e backoff.
- NFR8: O sistema deve manter rastreabilidade basica de eventos criticos (logins, conexoes de API, erros de sincronizacao e falhas de autenticacao).
- NFR9: A interface MVP deve atender no minimo aos criterios WCAG AA para contraste, navegacao por teclado, foco visivel e textos alternativos em elementos criticos.
- NFR10: O sistema deve garantir consistencia de calculo das metricas obrigatorias em todas as visualizacoes e exportacoes, usando as mesmas formulas definidas no dicionario de metricas.
- NFR11 (Post-MVP): O sistema deve manter trilha de auditoria para mudancas de formula/atribuicao, incluindo versao, data da mudanca e impacto nas metricas afetadas.

### MVP Prioritization Snapshot
- Incluido no MVP: FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR16, NFR1, NFR2, NFR3, NFR4, NFR5, NFR6, NFR7, NFR8, NFR9, NFR10.
- Post-MVP (Fase 2): FR14, FR15, FR17, FR18, FR19, NFR11.

## User Interface Design Goals

### Overall UX Vision
Entregar uma experiencia de cockpit orientada a decisao rapida: leitura do estado da campanha em segundos, destaque de desvios relevantes e navegacao curta ate a causa raiz. A interface deve equilibrar densidade informacional com clareza visual, priorizando primeiro as metricas criticas de rentabilidade e conversao.

Regra de design para MVP: funcao acima de tema. A inspiracao cockpit nao pode reduzir legibilidade, contraste ou velocidade de interpretacao.

### Key Interaction Paradigms
- Leitura em camadas: visao executiva primeiro, detalhes por drill-down em seguida.
- Semaforizacao visual: estados normal, atencao e critico para metricas-chave.
- Comparacao contextual: atual vs periodo anterior sempre disponivel no contexto da metrica.
- Filtros persistentes: produto e periodo visiveis e aplicados globalmente no painel.
- Acao orientada por anomalia: alertas clicaveis levam ao bloco de diagnostico relacionado.

### Core Screens and Views
- Login Screen
- Onboarding de Integracoes (conexao de APIs)
- Empty State & Setup Guidance (primeiro acesso sem fontes conectadas)
- Main Dashboard (cockpit principal por produto)
- Performance Deep Dive MVP (detalhe inicial em duas trilhas: Aquisicao e Conversao)
- Alert Center (historico simples; alertas criticos devem aparecer no dashboard principal)
- Metric Dictionary View (Post-MVP; no MVP usar ajuda contextual/tooltip por metrica)
- Settings Page (preferencias, perfil e seguranca)

### Accessibility: WCAG AA
No MVP, seguir WCAG AA para contraste, navegacao por teclado, foco visivel e textos alternativos em elementos criticos. Garantir legibilidade em telas desktop com alta densidade de dados.

### Branding
Direcao visual inspirada em cockpit de 747: paineis instrumentais, foco em contraste funcional e hierarquia clara de sinais. Evitar excesso de elementos decorativos que prejudiquem leitura operacional.

### Target Device and Platforms: Web Responsive
Plataforma-alvo do MVP: Web responsivo, com prioridade de experiencia em desktop e suporte funcional em tablet/mobile para consulta rapida.

### UI Flow and Data State Rules
- Seletor de produto ativo deve ser global e persistente no topo do cockpit.
- No primeiro acesso sem integracoes, o usuario deve ver estado de setup guiado com CTA para onboarding.
- Cada cartao de metrica deve exibir estado de dado: `ok`, `atrasado` ou `indisponivel`.
- No mobile MVP, priorizar modo leitura (metricas-chave, alertas ativos e filtros basicos), sem fluxo complexo de onboarding de integracoes.

## Technical Assumptions

### Repository Structure: Monorepo
- Frontend dashboard, backend API de agregacao e jobs de sincronizacao no mesmo repositorio para acelerar evolucao coordenada no MVP.

### Service Architecture
- Monolito modular no MVP:
  - API backend para autenticacao, configuracao e agregacao de metricas.
  - Worker de sincronizacao para coleta periodica nas APIs externas.
  - Camada de normalizacao de metricas antes de exibir no cockpit.
- Evolucao futura para servicos separados se volume crescer.

### Testing Requirements
- Unit + Integration no MVP:
  - Unit: calculo de metricas (CTR, CPC, CPM, CPA, ROAS, ROI, conversoes e aprovacao).
  - Integration: conectores API, sincronizacao, persistencia e endpoints do dashboard.
  - Smoke E2E leve para fluxo critico: login -> selecionar produto -> visualizar cockpit.

### Additional Technical Assumptions and Requests
- Stack sugerida: TypeScript end-to-end.
- Frontend web responsivo desktop-first.
- Persistencia com banco relacional para configuracoes, historico e snapshots de metricas.
- Observabilidade minima (logs estruturados + tracing basico de sincronizacao).
- Segredos de API com criptografia e rotacao operacional.

## Epic List

- Epic 1: Foundation, Access & Data Connections
  - Goal: estabelecer base operacional com autenticacao, selecao de produto ativo e integracoes API essenciais, entregando visao minima funcional do cockpit.
- Epic 2: Core Cockpit Metrics & Analysis
  - Goal: entregar dashboard principal com metricas obrigatorias, filtros por periodo, comparacao entre periodos e alertas visuais base.
- Epic 3: Conversion Diagnostics & Operational Reliability
  - Goal: aprofundar diagnostico de aquisicao/conversao e consolidar confiabilidade operacional com freshness/status e historico de metricas.

### Epic List Decision Notes
- Estrutura aprovada via analise Tree of Thoughts: 3 epicos.
- Justificativa: melhor equilibrio entre velocidade de entrega, sequenciamento de dependencias e controle de escopo do MVP.

## Epic 1 Foundation, Access & Data Connections

Expanded Goal:
Construir a base tecnica e funcional para o Painel 747 operar com seguranca e dados confiaveis sem bloquear validacao de valor inicial. Este epico estabelece autenticacao, contexto de produto ativo, conexao com fontes de dados MVP e uma trilha de demonstracao para validar UX mesmo antes de integracoes completas. Ao final, o usuario consegue acessar o sistema, configurar o produto ativo e migrar do modo demo para dados reais com visibilidade de status.

### Story 1.1 Auth e Workspace Base
As a afiliado,
I want criar conta e acessar com autenticacao segura,
so that apenas eu veja minhas integracoes e dados.

Acceptance Criteria
1. Usuario consegue registrar, login e logout com sessao valida.
2. Acesso e isolado por usuario sem vazamento de dados entre contas.
3. Fluxos de erro de autenticacao retornam mensagens claras.
4. Eventos criticos de autenticacao sao registrados para rastreabilidade basica.

### Story 1.2 Selecao de Produto Ativo
As a afiliado,
I want definir um produto ativo para analise,
so that o painel mostre contexto unico e evite mistura de metricas.

Acceptance Criteria
1. Usuario pode criar e selecionar um produto ativo.
2. Produto ativo fica visivel globalmente no topo da interface.
3. Troca de produto atualiza o contexto do dashboard.
4. Estado sem produto ativo mostra orientacao de setup.

### Story 1.3 Cockpit Demo (Sandbox de Validacao)
As a afiliado,
I want visualizar um cockpit com dados de exemplo,
so that eu entenda o valor e o fluxo do produto antes de concluir integracoes reais.

Acceptance Criteria
1. Sistema oferece modo demo com dataset de exemplo coerente com metricas do cockpit.
2. Dataset demo deve manter paridade de definicao e formula com metricas equivalentes do modo real sempre que aplicavel.
3. Interface sinaliza claramente quando os dados sao simulados.
4. Modo demo cobre navegacao principal (dashboard, filtros basicos, alertas de exemplo).
5. Renderizacao inicial do cockpit demo atende meta de performance da interface definida em NFR2.

### Story 1.4 Onboarding de Integracoes API MVP
As a afiliado,
I want conectar fontes prioritarias do MVP,
so that o painel consolide metricas reais da minha campanha.

Acceptance Criteria
1. Lista de fontes MVP e fechada para a primeira entrega: Meta Ads, Google Ads e Google Analytics 4 (GA4).
2. Usuario consegue cadastrar credenciais e validar conexao por fonte.
3. Sistema exibe status por fonte (conectada, falha, pendente).
4. Tokens e segredos sao armazenados com criptografia em repouso e trafego seguro.
5. Usuario pode revogar e reconectar credenciais por fonte sem perder o contexto de produto ativo.
6. Ao concluir integracao minima, sistema recomenda migracao para dados reais com indicacao visual clara do modo ativo (demo vs real).

### Story 1.5 Sincronizacao Inicial por Fonte
As a afiliado,
I want sincronizar dados iniciais apos conectar cada fonte,
so that eu comece a visualizar metricas reais no cockpit.

Acceptance Criteria
1. Sistema executa sincronizacao inicial apos conexao valida de cada fonte.
2. Falhas por fonte nao bloqueiam sincronizacao das demais fontes.
3. Dashboard mostra quando a carga inicial foi concluida por fonte.
4. Fluxo informa proximas acoes quando uma fonte falhar.

### Story 1.6 Freshness, Status Operacional e Logs Minimos
As a afiliado,
I want ver status de atualizacao e confiabilidade dos dados,
so that eu confie no que estou vendo no cockpit.

Acceptance Criteria
1. Dashboard mostra timestamp de ultima atualizacao por fonte.
2. Cada cartao de metrica exibe estado de dado: ok, atrasado ou indisponivel.
3. Falhas de sincronizacao sao registradas com erro, fonte e timestamp.
4. Alertas operacionais nao interrompem o uso do painel quando houver dados parciais.

### Epic 1 Risk Mitigation Notes
- Interface deve exibir watermark persistente e indicador textual do modo ativo (Demo ou Real) em todas as telas do cockpit.
- Estados de dado (ok, atrasado, indisponivel) devem incluir acao recomendada de proximo passo para o usuario.
- Onboarding deve suportar progressao incremental: conexao inicial de 1 fonte com valor imediato, mantendo expansao para as demais fontes em seguida.
- Fluxos de revogacao e reconexao de credenciais devem ter tratamento transacional para evitar estado orfao de sincronizacao.
- Conectores das fontes MVP devem possuir validacao de contrato de API e monitoramento de limites/rate-limit.
- Calculos de metrica compartilhados entre Demo e Real devem passar por verificacao de consistencia em cada release.

## Epic 2 Core Cockpit Metrics & Analysis

Expanded Goal:
Entregar o cockpit principal com leitura rapida e decisao acionavel, priorizando primeiro as metricas de maior impacto operacional. Este epico adota rollout em duas fases para reduzir risco de bloqueio por dados incompletos e acelerar validacao com usuarios reais. Ao final, o afiliado monitora o nucleo de performance com comparacao de periodos e alertas criticos no dashboard principal.

### Story 2.1 Cockpit Core Fase A (Top 6 Metricas)
As a afiliado,
I want visualizar primeiro as metricas mais criticas de performance,
so that eu tome decisoes rapidas sem sobrecarga visual.

Acceptance Criteria
1. Cockpit MVP inicial exibe no primeiro viewport: CTR, CPC, CPA, ROAS, IC e Taxa de Conversao do Checkout.
2. Cada metrica exibe valor atual e variacao vs periodo anterior equivalente.
3. Cartoes sem dado disponivel exibem estado e motivo de indisponibilidade.
4. Definicoes/formulas das metricas ficam acessiveis via ajuda contextual no cartao.

### Story 2.2 Filtros Globais e Persistencia de Contexto
As a afiliado,
I want aplicar filtros globais de produto e periodo,
so that toda analise fique consistente no mesmo contexto.

Acceptance Criteria
1. Filtros globais de produto e periodo ficam persistentes no topo.
2. Alteracoes de filtro atualizam todas as metricas exibidas no cockpit.
3. Periodos suportados: dia, semana, mes e intervalo customizado.
4. Estado de filtros e mantido ao navegar entre dashboard e deep dive MVP.

### Story 2.3 Comparacao de Periodos com Regras de Calculo
As a afiliado,
I want comparar periodo atual com periodo anterior equivalente,
so that eu identifique rapidamente melhoria ou piora de desempenho.

Acceptance Criteria
1. As metricas da Fase A suportam comparacao com periodo anterior equivalente.
2. Tendencia visual por metrica e exibida como subiu, desceu ou estavel.
3. Regras de calculo seguem o dicionario de metricas definido no PRD.
4. Casos de base zero ou divisao invalida usam regra explicita e exibicao segura.

### Story 2.4 Alertas Criticos MVP Inicial
As a afiliado,
I want receber alertas criticos nas metricas mais importantes,
so that eu aja rapido em desvios relevantes.

Acceptance Criteria
1. Alertas criticos MVP inicial cobrem 3 metricas-chave: ROAS, CPA e Taxa de Conversao do Checkout.
2. Desvio acima do limiar padrao de 20% gera alerta visivel no dashboard principal.
3. Alerta exibe metrica afetada, periodo, magnitude e direcao da variacao.
4. Alertas nao bloqueiam visualizacao do cockpit e podem ser consultados no historico simples.

### Story 2.5 Cockpit Core Fase B (Expansao de Metricas)
As a afiliado,
I want ampliar visao de performance com metricas complementares,
so that eu faca diagnosticos mais completos apos validar o nucleo.

Acceptance Criteria
1. Fase B adiciona ao cockpit: CPM, Taxa de Conversao da Pagina, ROI e Taxa de Aprovacao de Boleto/Pix.
2. Novas metricas seguem mesma regra de comparacao e ajuda contextual da Fase A.
3. Layout mantem priorizacao visual: Top 6 no primeiro viewport e metricas complementares em secao expandivel.
4. Modo ativo (Demo ou Real) e freshness continuam visiveis em todas as metricas.

## Epic 3 Conversion Diagnostics & Operational Reliability

Expanded Goal:
Consolidar confiabilidade operacional pratica do cockpit e aprofundar diagnostico de conversao para decisoes mais precisas. Este epico prioriza transparencia de atualizacao/qualidade de dados e capacidade de investigacao de gargalos entre aquisicao, pagina e checkout. Ao final, o afiliado consegue confiar no dado e agir com menor incerteza durante oscilacoes de campanha.

### Story 3.1a Deep Dive Operacional de Aquisicao e Conversao
As a afiliado,
I want investigar em detalhe aquisicao e conversao,
so that eu identifique gargalos reais no fluxo atual de campanha.

Acceptance Criteria
1. Deep Dive MVP exibe trilhas de Aquisicao e Conversao com navegacao a partir dos cartoes do cockpit.
2. Comparacao por periodo funciona tambem no deep dive.
3. Diagnostico que depende de metricas da Fase B do Epic 2 deve exibir estado de funcionalidade indisponivel ate a metrica estar habilitada.
4. Contexto de produto ativo e filtros globais permanece consistente durante toda a navegacao do deep dive.

### Story 3.2 Resiliencia de Sincronizacao e Qualidade de Dados
As a afiliado,
I want que o painel continue util mesmo com falhas parciais,
so that eu mantenha visao operacional durante incidentes de fonte.

Acceptance Criteria
1. Falha em uma fonte nao interrompe exibicao das demais metricas disponiveis.
2. Painel informa impacto da falha nas metricas afetadas e proximo passo recomendado.
3. Politica de retry/backoff e aplicada na sincronizacao conforme padrao definido no PRD.
4. Logs operacionais minimos permitem diagnostico rapido por fonte e timestamp.
5. Com falha completa de uma unica fonte, a meta inicial e manter ao menos 60% dos cartoes do cockpit exibidos quando houver dados de outras fontes, com calibracao apos beta.
6. Status de freshness e estado de dado devem ser atualizados na meta inicial de ate 5 minutos apos evento de falha ou recuperacao da sincronizacao, com calibracao apos beta.

### Story 3.3 Operacao em Cenario Critico
As a afiliado,
I want clareza imediata quando houver degradacao de dados ou performance,
so that eu reaja rapido sem depender de suporte imediato.

Acceptance Criteria
1. Estados atrasado e indisponivel exibem orientacao objetiva de acao.
2. Alertas seguem severidade formal com prioridade visual: critical > warning > info.
3. Dashboard permanece utilizavel com dados parciais e sinalizacao clara de limites.
4. Indicadores de modo ativo (Demo ou Real) e freshness permanecem visiveis durante a navegacao.

### Story 3.1b Historico e Tendencia (90 dias)
As a afiliado,
I want analisar tendencia historica de metricas no periodo de 90 dias,
so that eu diferencie oscilacao pontual de mudanca real de desempenho.

Acceptance Criteria
1. Sistema disponibiliza historico minimo de 90 dias para metricas suportadas.
2. Visualizacao de tendencia permite comparacao por periodo selecionado.
3. Ausencia parcial de historico e sinalizada com transparencia e impacto na interpretacao.
4. Regras de calculo historico seguem o mesmo dicionario de metricas do cockpit.
5. Politica de retencao e snapshots deve ser documentada para manter custo operacional previsivel no periodo de 90 dias.

### Story 3.4 Validacao de Usabilidade do Diagnostico
As a afiliado,
I want validar que o deep dive realmente acelera decisao,
so that o produto entregue ganho pratico de analise no uso real.

Acceptance Criteria
1. Realizar rodada de validacao com usuarios afiliados representativos do publico-alvo.
2. Meta inicial: usuarios devem identificar principal gargalo de campanha em ate 5 minutos no deep dive.
3. Feedback qualitativo e quantitativo deve gerar backlog priorizado de melhorias de diagnostico.
4. Metricas de usabilidade coletadas devem orientar calibracao das metas operacionais do Epic 3 apos beta.

### Epic 3 Scope Guardrails
- Itens de rastreabilidade/auditoria avancada de formula e atribuicao permanecem em post-MVP.
- Prioridade do epico: confiabilidade pratica para operacao diaria, nao governanca analitica completa.
- Dependencias de metricas da Fase B do Epic 2 devem ser explicitadas em cada historia que exigir essas metricas.

## Risks and Mitigation Plan (Consolidated)

### Scope and Delivery Risks
- Risco: inflacao de escopo do MVP mesmo com cortes.
  - Mitigacao: estabelecer MVP hard boundary por sprint e congelar Fase B do Epic 2 ate validacao da Fase A.
- Risco: dependencia de 3 APIs no inicio atrasar validacao de valor.
  - Mitigacao: manter trilha demo funcional e onboarding incremental com 1 fonte prioritaria primeiro.

### Data and Metric Trust Risks
- Risco: divergencia de atribuicao entre Meta Ads, Google Ads e GA4.
  - Mitigacao: matriz source-of-truth por metrica com owner, regra de atribuicao e janela de comparacao.
- Risco: atraso/ausencia de dados para ROI e aprovacao de boleto/pix.
  - Mitigacao: sinalizar impacto no cockpit e usar estado de dado com orientacao objetiva.
- Risco: drift de formula entre modos Demo e Real.
  - Mitigacao: verificacao de consistencia por release e checklist de paridade de formula.

### UX and Operational Risks
- Risco: cockpit denso para usuario iniciante.
  - Mitigacao: manter top 6 no primeiro viewport e evoluir via telemetria de uso real.
- Risco: fadiga de alerta por thresholds inadequados.
  - Mitigacao: beta fechado com 5-10 afiliados para calibracao rapida de limiares.
- Risco: interpretacao ambigua de estados operacionais.
  - Mitigacao: playbook de acao por estado (ok, atrasado, indisponivel) embutido na interface.

### Technical and Cost Risks
- Risco: retry/backoff inadequado elevar custo e latencia.
  - Mitigacao: definir politica de sincronizacao com limites de custo observaveis.
- Risco: historico de 90 dias gerar custo operacional acima do esperado.
  - Mitigacao: documentar e monitorar politica de snapshot/retencao com revisao apos beta.
- Risco: fallback demo/real causar confusao em incidentes.
  - Mitigacao: indicador persistente de modo ativo e regras de transicao claras.

### Execution Controls
- Definir e revisar semanalmente matriz de source-of-truth por metrica.
- Instrumentar telemetria de produto: tempo ate insight, taxa de setup concluido, uso de alertas.
- Rodar beta fechado e priorizar backlog por impacto em confianca de dado e decisao operacional.

## Hard MVP and Expansion Gate

### Hard MVP (Validation Release)
- Login e autenticacao com isolamento por usuario.
- Selecao de produto ativo.
- Onboarding de 1 fonte prioritaria inicialmente (demais fontes entram apos gate).
- Cockpit Top 6 metricas (Fase A do Epic 2).
- Comparacao de periodo (atual vs anterior equivalente) para metricas Top 6.
- Alertas criticos iniciais limitados a ROAS e CPA.

### Expansion Gate (Condition to Unlock Next Scope)
Desbloquear expansao de escopo (novas fontes, Fase B de metricas, diagnostico ampliado) somente apos validar no beta fechado:
- Taxa de setup concluido no fluxo inicial.
- Tempo ate insight no cockpit/deep dive.
- Retencao inicial dos afiliados em uso recorrente.

### Post-Gate Expansion Candidates
- Adicionar 2a e 3a fonte (Google Ads, GA4 ou ordem definida por demanda real).
- Expandir alertas para Conversao Checkout e demais metricas.
- Liberar Fase B completa do cockpit.
- Avancar para historias de confiabilidade ampliada do Epic 3.

## Checklist Results Report

### Executive Summary
- Overall PRD completeness: 89%
- MVP scope appropriateness: Just Right (com Hard MVP + Expansion Gate)
- Readiness for architecture phase: Nearly Ready (sem bloqueadores criticos)
- Most critical gaps:
  - Falta baseline numerico inicial para KPIs do beta
  - Ausencia de aprovadores formais e fluxo de aprovacao documentado
  - Detalhamento de compliance/legal ainda superficial para dados de marketing

### Category Statuses

| Category                         | Status  | Critical Issues |
| -------------------------------- | ------- | --------------- |
| 1. Problem Definition & Context  | PASS    | Nenhum bloqueador |
| 2. MVP Scope Definition          | PASS    | Nenhum bloqueador |
| 3. User Experience Requirements  | PASS    | Nenhum bloqueador |
| 4. Functional Requirements       | PASS    | Nenhum bloqueador |
| 5. Non-Functional Requirements   | PARTIAL | Compliance/regulacao pouco detalhado |
| 6. Epic & Story Structure        | PASS    | Nenhum bloqueador |
| 7. Technical Guidance            | PASS    | Nenhum bloqueador |
| 8. Cross-Functional Requirements | PARTIAL | Governanca de dados e formatos de troca podem ser mais especificos |
| 9. Clarity & Communication       | PARTIAL | Stakeholders e processo formal de aprovacao nao definidos |

### Top Issues by Priority
- BLOCKERS
  - Nenhum bloqueador identificado para iniciar arquitetura.
- HIGH
  - Definir baseline inicial de KPIs do beta para medir sucesso com criterio objetivo.
  - Definir owners/aprovadores formais do PRD (produto, tecnico, negocio).
- MEDIUM
  - Expandir requisitos de compliance e privacidade conforme jurisdicao/mercado alvo.
  - Detalhar formato e contrato de intercambio de dados por integracao principal.
- LOW
  - Incluir diagrama de fluxo principal para acelerar onboarding de stakeholders.

### MVP Scope Assessment
- Features que podem ser cortadas para manter MVP estrito:
  - Expansoes da Fase B e itens de confiabilidade ampliada que nao afetam Hard MVP.
- Missing features essenciais:
  - Nenhuma essencial faltante para validacao inicial.
- Complexity concerns:
  - Integracao simultanea de multiplas fontes no inicio pode aumentar risco de cronograma.
- Timeline realism:
  - Viavel com estrategia incremental: 1 fonte -> validar -> expandir.

### Technical Readiness
- Clarity of technical constraints: Alta (monorepo, monolito modular, NFRs definidos).
- Identified technical risks: Cobertos (fontes externas, divergencia de atribuicao, custo operacional).
- Areas needing architect investigation:
  - Modelo de normalizacao de metricas multi-fonte
  - Estrategia de armazenamento/snapshots para historico 90 dias
  - Politica de sincronizacao para custo/latencia sob rate-limit

### Recommendations
1. Formalizar baseline de KPI do beta (setup concluido, tempo ate insight, retencao).
2. Nomear aprovadores oficiais e criterio de sign-off do PRD.
3. Consolidar matriz source-of-truth por metrica antes de iniciar implementacao de conectores.
4. Validar com Architect os limites tecnicos do Hard MVP para preservar prazo.
5. Manter Fase B travada ate cumprir Expansion Gate.

### Final Decision
- READY FOR ARCHITECT (com recomendacoes HIGH tratadas no kickoff tecnico).

## Next Steps

### UX Expert Prompt
Use este PRD (`docs/prd.md`) para gerar o front-end spec do Painel 747 em modo MVP-first. Priorize cockpit de leitura rapida (Top 6 no primeiro viewport), estado operacional claro (`ok/atrasado/indisponivel`), fluxo de onboarding incremental, e diferenciacao visual inequívoca de modo Demo vs Real. Entregue fluxos, wireframes de baixa fidelidade e regras de interacao para dashboard, deep dive MVP e estados vazios/erro.

### Architect Prompt
Use este PRD (`docs/prd.md`) para criar arquitetura MVP do Painel 747 com foco no Hard MVP e Expansion Gate. Defina estrutura monolito modular em monorepo, estrategia de conectores para 1 fonte inicial com expansao posterior, normalizacao de metricas, sincronizacao resiliente com retry/backoff, e modelo de armazenamento para historico de 90 dias com custo previsivel. Especifique NFRs implementaveis, riscos tecnicos e plano de evolucao para Fase B sem quebrar o MVP.
