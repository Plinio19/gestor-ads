# Skill: campaign-structure

## Objetivo
Definir a estrutura ideal de campanhas para a Linklab Científica no Google Ads.

## Contexto atual da conta (diagnóstico 22/04/2026)

| Campanha | Tipo | Status | ROAS 30d |
|---|---|---|---|
| [HighFly] PMAX Vendas | PMAX | 🟢 ATIVA | 25.84x |
| Shopping Escala | Shopping | 🟡 Pausada | — |
| Shopping Padrão | Shopping | 🟡 Pausada | — |
| PMAX-SHOPPING | PMAX | 🟡 Pausada | — |
| Display Remarketing | Display | 🟡 Pausada | — |
| YT Branding | Video | 🟡 Pausada | — |

> A campanha PMAX ativa está com ROAS 25.84x e CPA R$39.76 — excelente performance.
> Avaliar reativação das campanhas pausadas com cautela.

---

## Estrutura recomendada (fase 1 — portfólio completo)

### Campanha 1 — PMAX Geral (já existe, manter e otimizar)
**Tipo:** Performance Max
**Status:** ATIVA — não mexer sem dados
**Objetivo:** Maximizar valor de conversão (ROAS alvo: 15x+)
**Notas:** Campanha herdada com bom histórico — prioridade máxima para não quebrar

---

### Campanha 2 — Search Equipamentos
**Orçamento:** A definir conforme ROAS inicial
**Estratégia:** CPC manual com limite → migrar para Target ROAS após 30 conversões
**Localização:** Brasil — prioridade SP, RJ, MG, PR, RS

#### Grupos de anúncios:
- Estufas Laboratoriais
- Agitadores e Chapas Aquecedoras
- Centrífugas
- Balanças (analítica, de precisão)
- pHmetros e Multiparâmetros
- Espectrofotômetros
- Incubadoras BOD
- Outros Equipamentos

---

### Campanha 3 — Search Reagentes Analíticos
**Orçamento:** A definir
**Estratégia:** CPC manual

#### Grupos de anúncios:
- Álcool Etílico PA / PA-ACS
- Acetona PA / PA-ACS
- Ácidos PA (sulfúrico, clorídrico)
- Solventes PA (xileno, metanol, éter)
- Reagentes para Análise de Água
- Meios de Cultura e Microbiologia

**Regra crítica:** Sempre incluir grau PA nos anúncios de reagentes — filtrar público industrial.

---

### Campanha 4 — Search Consumíveis e Vidraria
**Orçamento:** A definir
**Estratégia:** CPC manual (CPCs menores — produtos de ticket baixo)

#### Grupos de anúncios:
- Luvas de Laboratório
- Tubos (falcão, eppendorf, ensaio)
- Pipetas e Ponteiras
- Béqueres e Erlenmeyers
- Vidraria Geral
- EPIs Laboratoriais

---

### Campanha 5 — Shopping / PMAX-SHOPPING
**Tipo:** Performance Max com feed de Shopping OU Shopping Padrão
**Pré-requisito:** Merchant Center com produtos aprovados
**Objetivo:** Tráfego qualificado com intenção de compra clara

> ⚠️ Antes de reativar Shopping: verificar se Merchant Center está com produtos aprovados.

---

### Campanha 6 — Remarketing (Display)
**Orçamento:** Menor — complementar
**Público:** Visitantes que adicionaram ao carrinho mas não finalizaram
**Mensagens:** "Ainda precisa de [produto]? Finalize sua compra na Linklab"

---

## Regras de estrutura

### Um grupo = um produto/categoria
- Nunca misturar estufa com agitador no mesmo grupo
- Keywords do grupo devem ser todas sobre o mesmo produto/categoria
- Anúncio deve mencionar o produto específico do grupo

### Match types recomendados
- **Phrase match** `"estufa laboratorial"` — equilíbrio entre alcance e relevância
- **Exact match** `[estufa de esterilização laboratório]` — para termos de alta conversão
- **Broad match** — EVITAR no início; só com lista de negativos robusta

### Nunca fazer
- Broad match sem negativos extensos
- Um grupo para todos os produtos
- Anúncio genérico sem mencionar o produto
- Campanha sem extensões configuradas
- Mexer na PMAX ativa sem dados suficientes
