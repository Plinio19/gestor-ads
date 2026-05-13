# Skill: analyze-competitors

## Objetivo
Monitorar concorrentes no leilão do Google Ads e identificar oportunidades estratégicas.

## Concorrentes prioritários da Halogenn
- Êxodo Científica (exodocientifica.com.br)
- Neon Comercial (neoncomercial.com.br)
- ACS Científica
- Sinfe
- Exel Científica

## Query GAQL — Auction Insights
```sql
SELECT
  campaign.name,
  auction_insight.domain,
  metrics.auction_insight_search_impression_share,
  metrics.auction_insight_search_outranking_share,
  metrics.auction_insight_search_overlap_rate,
  metrics.auction_insight_search_position_above_rate,
  metrics.auction_insight_search_top_impression_share
FROM auction_insight_campaign
WHERE segments.date DURING LAST_30_DAYS
```

## O que analisar

### Impression Share
- Se concorrente tem IS > 70% → eles dominam esse termo
- Se Halogenn tem IS < 30% → estamos perdendo visibilidade
- Meta: IS > 50% nas keywords prioritárias

### Overlap Rate
- Alto overlap = disputamos os mesmos leilões
- Identificar onde concorrentes são mais fortes e fracos

## Estratégias por situação

### Se concorrente domina uma keyword importante:
1. Verificar quality score da nossa keyword
2. Revisar relevância do anúncio e landing page
3. Considerar aumentar lance gradualmente
4. Criar anúncio mais específico para aquele produto

### Oportunidades onde concorrentes são fracos:
- Nichos específicos: anatomia/patologia, análise de água, HPLC
- Regiões geográficas menos atendidas
- Produtos menos populares mas estratégicos

## Output mensal
- Tabela de IS por concorrente
- Tendência (subindo/descendo)
- 3 recomendações estratégicas baseadas nos dados
