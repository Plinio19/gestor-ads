# Skill: mine-search-terms

## Objetivo
Garimpar os termos de busca das campanhas ativas, identificar oportunidades e ameaças, e gerar um CSV com recomendações fundamentadas.

## Processo

### 1. Coleta de dados via GAQL
```sql
SELECT
  campaign.name,
  ad_group.name,
  ad_group_criterion.keyword.text,
  ad_group_criterion.keyword.match_type,
  search_term_view.search_term,
  search_term_view.status,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.ctr
FROM search_term_view
WHERE segments.date DURING LAST_30_DAYS
  AND metrics.impressions > 10
ORDER BY metrics.cost_micros DESC
```

### 2. Filtros obrigatórios
- Foco em termos com status `NONE` (nem adicionados nem negativados)
- Ordenar por custo DESC para atacar os maiores gastos primeiro
- Filtrar termos com mais de 10 impressões

### 3. Avaliação de cada termo
Para cada termo, aplicar a skill `search-term-methodology`

### 4. Output CSV
Gerar arquivo `search-terms-YYYY-MM-DD.csv` com colunas:
- campaign
- ad_group
- keyword
- search_term
- match_type
- impressions
- clicks
- cost
- conversions
- ctr
- recommendation (ADICIONAR / NEGATIVAR / MONITORAR)
- reasoning (explicação da decisão)

### 5. Ações após análise
- Termos marcados como NEGATIVAR → aplicar via `negative-keywords` skill
- Termos marcados como ADICIONAR → sugerir como nova keyword
- Sempre pedir aprovação antes de aplicar mudanças
