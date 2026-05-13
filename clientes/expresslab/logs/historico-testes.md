# HISTÓRICO DE TESTES E HIPÓTESES — ExpressLab Equipamentos
> Arquivo atualizado automaticamente pelo Gestor IA após cada ação na conta.
> **REGRA:** Antes de qualquer análise ou otimização, leia este arquivo completo para não repetir testes já realizados.

---

## 📋 COMO USAR ESTE ARQUIVO

### O gestor IA DEVE:
1. **Antes de agir:** Ler este arquivo e verificar se o teste já foi feito
2. **Após qualquer ação:** Registrar o que foi feito no formato abaixo
3. **Ao propor hipótese:** Verificar se já foi testada antes de sugerir

### Formato de registro:
```
### [DATA] — [TIPO DE AÇÃO]
- **O que foi feito:** descrição clara
- **Hipótese:** o que esperávamos que acontecesse
- **Resultado:** o que aconteceu de fato
- **Aprendizado:** o que isso nos ensina
- **Próximo passo:** o que fazer com base nisso
- **Status:** ✅ Concluído / 🔄 Em andamento / ❌ Cancelado
```

---

## 🗓️ REGISTRO DE AÇÕES

### [22/04/2026] — DIAGNÓSTICO PÓS-REATIVAÇÃO (3 dias rodando)
- **O que foi feito:** Verificação completa após site voltar ao ar e billing desbloqueado (R$1k de crédito adicionado). Monitor diário, tags de conversão e performance geográfica analisados.
- **Resultado:**
  - 3 dias: R$149,18 gastos | 1 compra | R$2.529,54 receita | ROAS 17x acumulado
  - Melhor dia (21/04): ROAS 31,7x
  - Tag duplicada "Compra (1)" identificada e marcada como não-primária (fora da otimização)
  - "Adicionar ao Carrinho - GTM" renomeada para "Início de Checkout - GTM" (categoria real = BEGIN_CHECKOUT)
  - Geograficamente: AP e RS consumindo mais orçamento sem conversão; PB gerou a única compra com ROAS 1723x; SP e MG com gasto baixo apesar de serem os maiores mercados
- **Aprendizado:** Algoritmo ainda em re-aprendizado. Cedo demais para otimizar localização — decisão deliberada de aguardar mais dados antes de excluir estados ou ajustar bid modifiers.
- **Próximo passo:** Revisitar geo em ~14 dias com volume maior. Avaliar escala de orçamento se ROAS > 20x se mantiver por 7 dias consecutivos.
- **Status:** 🔄 Em andamento — aguardando acúmulo de dados

### [22/04/2026] — CORREÇÃO DE TAGS DE CONVERSÃO
- **O que foi feito:** (1) "Compra (1)" marcada como não-primária via API — era duplicata de "Compra - GTM", ambas com primary_for_goal=true causando possível dupla contagem. (2) "Adicionar ao Carrinho - GTM" renomeada para "Início de Checkout - GTM" pois categoria real da API é BEGIN_CHECKOUT, não ADD_TO_CART.
- **Hipótese:** Duplicata estava distorcendo contagem de conversões e ROAS reportado
- **Resultado:** ✅ "Compra (1)" agora secundária | ✅ tag renomeada corretamente
- **Aprendizado:** Conversion actions não permitem status PAUSED ou HIDDEN via API — solução é marcar como não-primária (primary_for_goal=false). Remoção definitiva deve ser feita no painel.
- **Status:** ✅ Concluído

### [17/04/2026] — DIA DE REATIVAÇÃO COMPLETO — RESUMO EXECUTIVO

**Tudo que foi feito em 17/04/2026:**

#### 1. Infraestrutura do cliente criada
- Pasta `clientes/expresslab/` criada com estrutura completa
- `.env` preenchido com credenciais do MCC + Customer ID 924-777-7129
- `BRIEFING.md` carregado com dados completos da ExpressLab Equipamentos
- Skills personalizadas criadas: `expresslab-audience.md`, `expresslab-competitors.md`, `expresslab-products.md`
- Skills halogenn-específicas removidas da pasta da Expresslab
- `CLAUDE.md` atualizado para multi-cliente com tabela de KPI (Halogenn=CPL / ExpressLab=ROAS+CPA)

#### 2. Auditoria completa via API
- Conexão à conta confirmada: EXPRESSLAB COMERCIO E IMPORTACAO DE EQUIPAMENTOS LTDA
- 3 campanhas encontradas: 2 PMAX ATIVAS (R$122/dia) + 1 Search PAUSADA
- 7 conversões configuradas — funil GTM completo (Carrinho → Checkout → Compra)
- 154 produtos aprovados no Google Merchant Center — feed ativo
- 0 impressões nos últimos 30 dias — conta paralisada desde fev/2026

#### 3. Histórico completo puxado (jul/2025 → abr/2026)
- R$ 9.588 investidos · 338 conversões · R$ 410.804 em receita
- ROAS histórico: **42,84x** · CPA histórico: **R$ 28,37**
- Pico: setembro/2025 (ROAS 67x) e novembro/2025 (ROAS 71x)
- PMAX-SHOPPING: campanha estrela — R$207k em receita, ROAS 44x
- Causa da parada: site fora do ar → Merchant Center removeu aprovação dos produtos

#### 4. Setup de reativação executado via API
- **38 palavras negativas** aplicadas nas 2 PMAX (camp-level criteria)
  - Fora do portfólio: béquer, vidraria, erlenmeyer, reagentes, kit educacional...
  - Intenção errada: aluguel, manutenção, conserto, assistência técnica, usado...
  - Concorrentes: netlab, splabor, interlab, kasvi, qualividros, nalgon...
- **ROAS alvo definido:** PMAX-SHOPPING = **8x** · PMAX EXPRESSLAB = **10x**
- **Ambas as PMAX** migradas para estratégia "Maximizar Valor de Conversão"
- **"[Google] Leads Pesquisa"** confirmada PAUSADA (objetivo errado para e-commerce)

#### 5. Script de monitoramento diário criado
- Arquivo: `clientes/expresslab/scripts/monitor-diario.js`
- Monitora: impressões, ROAS, CPA, orçamento, termos suspeitos
- Alertas automáticos: 🔴 ROAS < 8x · 🟡 orçamento esgotando cedo · 🚀 ROAS > 20x (sinal de escala)
- Log salvo em: `clientes/expresslab/logs/daily-monitor.log`

- **Status geral:** ✅ Reativação completa — aguardando retorno das impressões (24-48h)

---

### [17/04/2026] — SETUP DE REATIVAÇÃO EXECUTADO VIA API
- **O que foi feito:** Script `setup-reativacao.js` executado. (1) 38 palavras negativas adicionadas como critério de campanha nas 2 PMAX. (2) Ambas as PMAX migradas para estratégia "Maximizar Valor de Conversão" com ROAS alvo (PMAX EXPRESSLAB = 10x, PMAX-SHOPPING = 8x). (3) "[Google] Leads Pesquisa" confirmada PAUSADA.
- **Hipótese:** Negativos + ROAS alvo + site no ar = campanhas voltam a gastar com qualidade nos próximos 24-48h
- **Resultado:** ✅ PMAX EXPRESSLAB: ATIVA, Maximizar Valor de Conversão, R$50/dia | ✅ PMAX-SHOPPING: ATIVA, Maximizar Valor de Conversão, R$72/dia | ⏸️ Leads Pesquisa: PAUSADA
- **Aprendizado:** SharedSet API retornou erro (resource_name undefined) — fallback para campaign-level criteria funcionou. Negativos aplicados com match PHRASE direto nas campanhas.
- **Próximo passo:** Monitorar impressões nas próximas 24-48h. Rodas diagnóstico em 7 dias.
- **Status:** ✅ Concluído

### [17/04/2026] — HISTÓRICO COMPLETO DESDE A FUNDAÇÃO (jul/2025 → abr/2026)
- **O que foi feito:** Auditoria histórica total via API. Período: 01/07/2025 a 17/04/2026.
- **Hipótese:** Conta parada e sem resultados desde a fundação
- **Resultado:** CONTA TEVE PERFORMANCE EXCELENTE antes de parar. R$ 9.588 investidos, 338 conversões, R$ 410.804 em receita, ROAS 42,84x, CPA R$ 28,37. Parada gradual: dez/2025 → jan/2026 → fev/2026 (R$ 7 gasto). Causa provável: site fora do ar removeu aprovação dos produtos no Merchant Center, paralisando as PMAX.
- **Aprendizado:** As campanhas funcionam muito bem quando o site está no ar. Pico em set/2025 (ROAS 67x) e nov/2025 (ROAS 71x). PMAX-SHOPPING é a campanha estrela (ROAS 44x, 15k cliques). Quando o site voltar o Merchant Center regulariza e as PMAX retomam o gasto automaticamente.
- **Próximo passo:** Aguardar site voltar ao ar → verificar aprovação de produtos no Merchant Center → monitorar retomada das impressões nas PMAX → criar lista de negativos antes do relançamento
- **Status:** ✅ Concluído

### [17/04/2026] — AUDITORIA COMPLETA INICIAL VIA API
- **O que foi feito:** Primeira conexão à conta via Google Ads API (MCC 601-708-1450 → Customer 924-777-7129). Auditoria completa: campanhas, conversões, performance 30 dias, Merchant Center, extensões.
- **Hipótese:** Conta ativa com campanhas rodando desde julho/2025
- **Resultado:** 3 campanhas encontradas. 2 PMAX ATIVAS (R$122/dia de orçamento) com **zero impressões e zero gasto nos últimos 30 dias** — conta paralisada. 1 campanha Search PAUSADA. Conversões GTM corretamente configuradas. Merchant Center não verificado (erro na query). Sem listas de palavras negativas.
- **Aprendizado:** Conta tem estrutura montada mas não está gerando tráfego. Principal suspeita: Merchant Center desvinculado impede PMAX Shopping de servir. Verificar billing e feed de produtos.
- **Próximo passo:** (1) Verificar Merchant Center, (2) Checar motivo das PMAX não gastarem, (3) Criar listas de negativos, (4) Avaliar campanha "[Google] Leads Pesquisa" — objetivo errado para e-commerce
- **Status:** ✅ Concluído

---

## 📊 HIPÓTESES A TESTAR (backlog)

*A preencher após início das campanhas.*

---

## 🚫 TESTES JÁ REALIZADOS — NÃO REPETIR

*Nenhum teste concluído ainda — conta em fase de setup.*

---

## 📈 PALAVRAS-CHAVE TESTADAS

| Keyword | Data | Cliques | Conversões | CPC Médio | Decisão | Motivo |
|---|---|---|---|---|---|---|
| *Aguardando início das campanhas* | | | | | | |

---

## 🗑️ PALAVRAS NEGATIVADAS

| Termo | Data | Motivo | Campanha |
|---|---|---|---|
| *Aguardando início das campanhas* | | | |

---

## 📢 ANÚNCIOS TESTADOS

| Anúncio | Data | CTR | Conversões | Decisão |
|---|---|---|---|---|
| *Aguardando início das campanhas* | | | | |

---

## 💡 INSIGHTS ACUMULADOS

*Insights serão adicionados conforme campanhas rodarem.*

---

## ⚙️ REGRA DE ATUALIZAÇÃO AUTOMÁTICA

O gestor IA deve adicionar uma entrada neste arquivo **sempre que:**
- Criar ou pausar uma campanha
- Adicionar ou remover palavras-chave
- Negativar um termo de busca
- Testar uma variação de anúncio
- Identificar um padrão novo nos dados
- Rodar análise semanal ou mensal
- Receber aprovação para executar uma ação

**Nunca apagar registros antigos — apenas adicionar novos.**
