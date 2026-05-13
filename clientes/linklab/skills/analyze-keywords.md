# Skill: analyze-keywords

## Objetivo
Analisar performance de todas as palavras-chave ativas e identificar o que otimizar na conta da Linklab.

## Query GAQL
```sql
SELECT
  campaign.name,
  ad_group.name,
  ad_group_criterion.keyword.text,
  ad_group_criterion.keyword.match_type,
  ad_group_criterion.quality_info.quality_score,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value,
  metrics.ctr,
  metrics.average_cpc,
  metrics.search_impression_share
FROM keyword_view
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status = 'ENABLED'
ORDER BY metrics.cost_micros DESC
```

## Classificação de keywords

### 🏆 Keywords Estrela (manter e escalar)
- Conversões > 0
- CTR > 3%
- CPC dentro do limite por categoria
- Aumentar lance em 10-20%

### 💀 Keywords Mortas (pausar)
- Mais de 30 cliques e zero conversões
- CPC > R$ 8,00 sem conversão (para consumíveis e vidraria — categoria de baixo ticket)
- CTR < 0,5%
- Pausar e reportar ao gestor

### ⚠️ Keywords em Observação
- Entre 10-30 cliques sem conversão
- CTR entre 1-3%
- Aguardar mais dados antes de decisão

### 🔧 Keywords para Ajuste de Lance
- Boa conversão mas CPC muito alto → reduzir lance 15%
- Boa CTR mas impressões baixas → aumentar lance 10%

## Limites de CPC por categoria
| Categoria | CPC Máximo |
|---|---|
| Equipamentos de alto valor (estufa, espectrofotômetro, centrífuga) | R$ 5,00 – R$ 7,00 |
| Equipamentos de médio valor (agitador, pHmetro, balança) | R$ 3,50 – R$ 5,00 |
| Reagentes analíticos PA | R$ 5,00 – R$ 7,00 |
| Consumíveis (luvas, tubos, ponteiras) | R$ 1,50 – R$ 2,50 |
| Vidraria (béquer, erlenmeyer) | R$ 2,00 – R$ 3,00 |
| EPIs laboratoriais | R$ 1,50 – R$ 2,00 |
| Portfólio geral / genéricas | R$ 3,00 – R$ 4,00 |

## Output
Relatório com:
1. Resumo geral (total gasto, conversões, ROAS, CPA)
2. Top 10 keywords por gasto
3. Keywords recomendadas para pausar
4. Keywords recomendadas para escalar
5. Oportunidades identificadas
