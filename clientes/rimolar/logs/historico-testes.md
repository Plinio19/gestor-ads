# Histórico de Testes — Rimolar Química (Google Ads)

> Reconstruído em 07/08/2026: a pasta original foi excluída pelo próprio gestor humano por engano (achava que era só a parte de orçamentos/cotações, mas também continha todo o histórico de Ads). Reconstruído a partir do histórico desta conversa. A partir de agora esta pasta é commitada no git.

## 2026-07-07 — Setup inicial do gestor + auditoria de conta

**Ação:** Configuração inicial do escopo do gestor de tráfego para a Rimolar Química. Estrutura criada e briefing preenchido com identidade de marca fornecida pelo gestor humano.

**Auditoria da conta Google Ads (customer_id 8358877005, via MCC 6017081450):**
- 1 campanha ativa: PMax "Campanha PMax tray - Não Remover" (ID 23972573458), integrada ao Merchant Center (5813715934) via Tray
- Orçamento diário: R$40 | Atividade real: apenas 3 dias no período observado até então — indicava campanha recém-criada/reativada
- Resultado inicial: 87 cliques, R$239,36 investidos, 0 conversões
- Conversão primária "Conversão automática tray" corretamente configurada (Webpage/Purchase, primary_for_goal=true, ENABLED)
- **Diagnóstico:** sem erro estrutural aparente. Zero conversões esperado nesta fase inicial.

## 2026-07-07 — Decisão: não criar 2ª PMax ainda

**Pergunta do gestor:** manter só a campanha PMax atual até sair da fase de aprendizado, ou já criar uma PMax "geral" em paralelo?

**Recomendação dada:** manter só 1 campanha. Motivos: (1) dado insuficiente ainda; (2) risco de self-competition — 2 PMax com o mesmo feed/catálogo brigam no mesmo leilão, a menos que segmentadas por listing groups (catálogo não mapeado); (3) orçamento enxuto — dividir atrasaria a saída da fase de aprendizado.
**Status:** Gestor confirmou aguardar ~10 dias antes de reavaliar.

## 2026-07-15 — Reavaliação de performance (ROAS real)

**Correção:** entradas anteriores tinham data incorreta — a campanha rodou continuamente desde 04/07, sem parar.

**Performance real — 30 dias:**
- Custo: R$561,63 | Conversões: 4,00 | Receita: R$608,85 | **ROAS: 1,08x** ⚠️ | CPA: R$140,41 | Ticket médio implícito: R$152,21 | CTR: 2,36%

**Diagnóstico:** CTR bom, mas ROAS de 1,08x é receita bruta — depois de custo de produto, frete, impostos (Simples Nacional) e taxa de pagamento, a operação provavelmente estava no zero a zero ou no prejuízo.

## 2026-07-28 — Auditoria de verificação (só leitura)

**Resultado:**
- Orçamento diário: R$62/dia (subiu de R$40 em 21/07 — alterado fora deste chat por administrativo@rimolar.com.br, ~55% de aumento)
- 30 dias: custo R$1.238,76, receita R$6.946,05, **ROAS 5,61x**, CPA R$103,23, 12 conversões, CTR 2,54%
- 7 dias: ROAS 13,23x, CPA R$73,88
- Asset group ELIGIBLE, sem bloqueios. Atividade diária contínua, sem gaps.
- **Diagnóstico:** melhora expressiva frente a 15/07 — sem necessidade de ação corretiva.

## 2026-07-29 — Checagem: "pedidos pararam"

**Contexto:** gestor relatou queda de 1-3 pedidos/dia para quase zero, perguntou se eu tinha mexido em algo.

**Confirmado:** nenhuma ação minha na conta (só queries de leitura). Único change_event nos últimos 14 dias: alteração de orçamento em 21/07 por administrativo@rimolar.com.br via UI (não é pausa/mudança estrutural).
- Tráfego seguia normal (impressões/cliques constantes), conversão primária ativa, asset group ELIGIBLE.
- **Diagnóstico:** tráfego chegando mas não convertendo em alguns dias — problema provavelmente fora do Ads (site/checkout/estoque, sem visibilidade via API do Ads).
- Confirmado: não tenho acesso à Tray (painel/API da loja).

## 2026-07-29 — Recomendação estratégica: Search de Marca vs. 2ª PMax

**Achado:** conta tinha 0 campanhas de Search. PMax com `search_impression_share` de ~20%, 80% perdido por Rank (não por orçamento) — demanda de busca não capturada.

**Recomendação:** priorizar Search de Marca antes de 2ª PMax (risco de self-competition sem catálogo segmentado). Estrutura completa proposta: campanha Search-only, orçamento R$15/dia, Maximizar conversões, 1 grupo "Marca Rimolar" com ~9 keywords de marca, 4 negativas, RSA com 15 headlines + 4 descriptions, sitelinks e callouts.
**Bloqueio identificado:** URL do site não estava disponível em nenhum lugar do projeto.

## 2026-08-05 — Criação da campanha Search — Rimolar Marca (via API, PAUSADA)

**Ação:** Gestor confirmou a direção, passou a URL do site (`https://www.rimolar.com.br/`) e pediu para eu criar a campanha de verdade, só isso, sem mexer em mais nada. Confirmou: criar **pausada**.

**Processo:** rodei `validate_only: true` primeiro (2 rodadas até zerar erros — corrigi `explicitly_shared: false` no orçamento e `contains_eu_political_advertising` obrigatório na campanha, e removi `resource_name` manual dos critérios de local/idioma) antes da mutação real.

**Criado (customer_id 8358877005):**
- Campanha `Search — Rimolar Marca` (ID 24107119847) — status PAUSADA inicialmente, Search-only, Maximizar conversões, orçamento R$15,00/dia
- Grupo de anúncios "Marca Rimolar" (ID 202053039594), 9 palavras-chave de marca, 4 negativas
- Segmentação: Brasil + Português
- 1 anúncio RSA (15 headlines, 4 descriptions, final URL correta) + 4 callouts

**Verificado por query após criação:** tudo conferiu com o especificado.

**Atualização mesma data:** change_event mostrou administrativo@rimolar.com.br atualizando a campanha ~40min depois — cliente ativou manualmente (status passou a ENABLED). Sitelinks não foram criados (sem URLs de subpáginas confirmadas).

## 2026-08-07 — Relatório semanal completo + diagnóstico

**Acumulado PMax (04/07 a 06/08, ~5 semanas):** R$1.824,68 investido, 19 conversões, R$8.180,02 receita, **ROAS 4,48x**, CPA R$96,04, CTR 2,55%.

**Semana a semana:**
| Semana | Custo | Conv. | Receita | ROAS |
|---|---|---|---|---|
| 06/07 | R$309,08 | 3 | R$524,27 | 1,70x |
| 13/07 | R$278,75 | 3 | R$562,15 | 2,02x |
| 20/07 | R$431,30 | 5 | R$5.675,87 | 13,16x |
| 27/07 | R$396,92 | 7 | R$1.138,02 | 2,87x |
| 03/08 | R$248,95 | 1 | R$279,71 | 1,12x |

**Diagnóstico:** ROAS acumulado (4,48x) enganoso — carregado quase todo por 1 venda outlier de R$5.022,93 (25/07). Sem ela, ROAS semanal real fica entre 1,12x-2,87x. Padrão de "zero conversão" recorrente identificado em 6 de 10 dias analisados, com tráfego constante — sugeriu problema fora do Ads.

**Comparação com Tray (mesma janela 09/07-07/08, dados trazidos pelo gestor via print):**
- Tray (loja toda): R$14.109,88 em 55 pedidos, 1.400 visitas, conversão 6,50%
- Ads: R$8.032,03 em 18 conversões, 2.034 cliques — **56,9% da receita total, 32,7% dos pedidos**
- ⚠️ Cliques do Ads (2.034) **excedem** visitas totais da loja (1.400) — discrepância de medição/atribuição não resolvida entre Ads e Tray.
- 2º print: Total Pedidos R$21.450,14, Vendas Realizadas R$14.109,88, **Pedidos Cancelados R$4.593,44** (~21,4% do valor total), conversão de vendas 57,29%.

**Causa confirmada pelo gestor:** problema no meio de pagamento, ocorrido 2x no período — explica boa parte dos cancelamentos e dos dias de zero conversão. **Não é falha da campanha/mídia, é operacional.**

**Diagnóstico final revisado:** a campanha PMax está performando melhor do que os números brutos de conversão sugeriam — o gargalo real (parcialmente) é o meio de pagamento, fora do controle do Ads. Recomendações: (1) não aumentar orçamento da PMax até a conversão estabilizar; (2) resolver estabilidade do meio de pagamento (fora do meu escopo/acesso); (3) investigar a discrepância cliques×visitas com a equipe da Tray; (4) monitorar a Search de Marca (sem dado de veiculação nos primeiros dias, verificar se voltou a girar).

## 2026-08-07 — Pasta excluída e reconstruída

**Incidente:** gestor excluiu a pasta `clientes/rimolar/` inteira por engano, achando que era só a parte de propostas comerciais/cotações — na verdade continha todo esse histórico de Ads também. Reconstruído a partir do histórico da conversa (este arquivo, `CLAUDE.md` e `BRIEFING.md`). **Desta vez commitado direto no git** para não perder de novo. Propostas/cotações (pasta `propostas/`) permanecem fora — eram intencionalmente excluídas e não fazem mais parte do escopo deste chat.
