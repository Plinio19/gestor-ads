# Skill: analyze-keywords

## Objetivo
Analisar performance de todas as palavras-chave ativas e identificar o que otimizar.

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
- CPC dentro do limite
- Aumentar lance em 10-20%

### 💀 Keywords Mortas (pausar)
- Mais de 30 cliques e zero conversões
- CPC > R$ 10,00 sem conversão
- CTR < 0,5%
- Pausar e reportar ao gestor

### ⚠️ Keywords em Observação
- Entre 10-30 cliques sem conversão
- CTR entre 1-3%
- Aguardar mais dados antes de decisão

### 🔧 Keywords para Ajuste de Lance
- Boa conversão mas CPC muito alto → reduzir lance 15%
- Boa CTR mas impressões baixas → aumentar lance 10%

## Limites de CPC por produto
- Álcool etílico PA: máx R$ 6,00
- Acetona PA: máx R$ 5,00
- Xileno PA: máx R$ 7,00
- Formaldeído PA: máx R$ 8,00
- Reagentes específicos/nicho: máx R$ 10,00

## Output
Relatório com:
1. Resumo geral (total gasto, conversões, CPC médio)
2. Top 10 keywords por gasto
3. Keywords recomendadas para pausar
4. Keywords recomendadas para escalar
5. Oportunidades identificadas
