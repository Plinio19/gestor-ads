# Skill: analyze-competitors

## Objetivo
Monitorar concorrentes no leilão do Google Ads e identificar oportunidades estratégicas para a Linklab.

## Concorrentes prioritários da Linklab
- Êxodo Científica (exodocientifica.com.br) — concorrente mais direto
- Neon Comercial (neoncomercial.com.br)
- Netlab (netlab.com.br)
- Interlab (interlab.com.br)
- SPLABOR (splabor.com.br)
- Kasvi (kasvi.com.br)
- Prolab (lojaprolab.com.br)

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
- Se Linklab tem IS < 30% → estamos perdendo visibilidade
- Meta: IS > 50% nas keywords prioritárias por categoria

### Overlap Rate
- Alto overlap = disputamos os mesmos leilões
- Identificar onde Êxodo e Neon são mais fortes e fracos

## Estratégias por situação

### Se Êxodo domina uma keyword:
1. Verificar quality score da nossa keyword
2. Revisar relevância do anúncio e landing page
3. Focar no diferencial e-commerce moderno da Linklab
4. Atacar onde Êxodo é fraco: experiência de compra rápida, frete grátis SP

### Oportunidades onde concorrentes são fracos:
- Consumíveis e vidraria (menos disputados que equipamentos)
- Reagentes de nicho (análise ambiental, veterinário)
- Keywords de portfólio cruzado ("equipamentos e reagentes laboratório")

## Output mensal
- Tabela de IS por concorrente por categoria
- Tendência (subindo/descendo)
- 3 recomendações estratégicas baseadas nos dados
