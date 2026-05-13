# Skill: weekly-report

## Objetivo
Gerar relatório semanal completo de performance e gravar na planilha Google Sheets.

## Quando executar
Toda segunda-feira às 9h (ou quando solicitado manualmente)

## Período
Últimos 7 dias (segunda a domingo anterior)

## Queries necessárias

### Performance geral
```sql
SELECT
  campaign.name,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.ctr,
  metrics.average_cpc,
  metrics.conversion_rate
FROM campaign
WHERE segments.date DURING LAST_7_DAYS
  AND campaign.status = 'ENABLED'
ORDER BY metrics.cost_micros DESC
```

### Top keywords da semana
```sql
SELECT
  ad_group_criterion.keyword.text,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.ctr
FROM keyword_view
WHERE segments.date DURING LAST_7_DAYS
ORDER BY metrics.clicks DESC
LIMIT 20
```

## Estrutura do relatório

### 1. Resumo executivo (para o gestor humano)
- Total gasto na semana: R$ X
- Total de cliques: X
- Total de conversões (leads): X
- CPC médio: R$ X
- Comparação com semana anterior: +X% / -X%

### 2. Performance por campanha
Tabela com: campanha, gasto, cliques, conversões, CTR, CPC médio

### 3. Top 5 keywords que geraram resultado
### 4. Top 5 keywords que mais gastaram sem conversão
### 5. Alertas da semana
### 6. Recomendações para próxima semana (máx 3)

## Alertas automáticos no relatório

🚨 CRÍTICO se:
- Gasto semanal > R$ 600 (>30% do mensal)
- Alguma keyword com CPC > 2x o limite
- Zero conversões na semana com gasto > R$ 200

⚠️ ATENÇÃO se:
- CTR médio < 2%
- CPC médio subiu > 30% em relação à semana anterior
- Termos industriais aparecendo nos resultados de busca

## Gravação no Sheets
- Aba: "Semanal"
- Uma linha por campanha por semana
- Incluir data, métricas e alertas
