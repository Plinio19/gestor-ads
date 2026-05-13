# Skill: weekly-report

## Objetivo
Gerar relatório semanal completo de performance e registrar para acompanhamento.

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
  metrics.conversions_value,
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
  metrics.conversions_value,
  metrics.ctr
FROM keyword_view
WHERE segments.date DURING LAST_7_DAYS
ORDER BY metrics.conversions_value DESC
LIMIT 20
```

## Estrutura do relatório

### 1. Resumo executivo
- Total gasto na semana: R$ X
- Total de cliques: X
- Total de conversões (vendas): X
- Receita: R$ X
- ROAS da semana: Xx
- CPA médio: R$ X
- Comparação com semana anterior: +X% / -X%

### 2. Performance por campanha
Tabela: campanha, tipo, gasto, cliques, conversões, receita, ROAS, CPA

### 3. Top 5 termos de busca que geraram conversão
### 4. Top 5 keywords que mais gastaram sem conversão
### 5. Alertas da semana
### 6. Recomendações para próxima semana (máx 3)
### 7. Hipótese da semana (registrar no historico-testes.md)

## Alertas automáticos no relatório

🚨 CRÍTICO se:
- ROAS semanal < 5x
- CPA > R$150
- Zero conversões na semana com gasto > R$200
- Alguma keyword com CPC > 2x o limite da categoria

⚠️ ATENÇÃO se:
- ROAS entre 5x e 8x (abaixo do ideal)
- CTR médio < 2%
- CPC médio subiu > 30% em relação à semana anterior
- Termos fora do portfólio aparecendo com gasto relevante
