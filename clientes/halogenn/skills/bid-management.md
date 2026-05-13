# Skill: bid-management

## Objetivo
Gerenciar lances de forma inteligente para maximizar conversões dentro do orçamento de R$2.000/mês.

## Regras gerais de lance

### Limites máximos de CPC por categoria
| Produto | CPC Máximo |
|---|---|
| Álcool etílico PA/PA-ACS | R$ 6,00 |
| Acetona PA | R$ 5,00 |
| Xileno/Xilol PA | R$ 7,00 |
| Formaldeído PA | R$ 8,00 |
| Parafina histológica | R$ 9,00 |
| Ácidos PA (sulfúrico, clorídrico) | R$ 7,00 |
| Éter etílico/petróleo | R$ 8,00 |
| Reagentes nicho (HPLC, específicos) | R$ 12,00 |

### Quando AUMENTAR lance (máx +20% por ajuste):
- Keyword com conversão e IS < 50%
- CTR > 5% e posição média > 3
- Produto prioritário com bom desempenho
- Período de alta demanda (início do mês)

### Quando REDUZIR lance (máx -20% por ajuste):
- CPC atual > limite máximo sem conversão
- Posição média 1 sem necessidade (desperdício)
- IS já > 80% (não precisa pagar mais)
- Final do mês com orçamento no limite

### Quando PAUSAR keyword:
- Mais de 50 cliques sem nenhuma conversão
- CPC > 2x o limite máximo
- Termo claramente irrelevante escapou dos negativos

## Ajustes por dispositivo
- Mobile: -20% (comprador B2B raramente converte no celular)
- Desktop: base (0%)
- Tablet: -10%

## Ajustes por horário
- Seg-Sex 8h-18h: base (0%) — horário comercial
- Seg-Sex 18h-22h: -30%
- Sab-Dom: -50%
- Madrugada (0h-7h): -80%

## Ajustes geográficos
- São Paulo (estado): base (0%) — maior mercado
- Rio de Janeiro: base (0%)
- Sul e outros grandes estados: -10%
- Regiões remotas: -30%

## Frequência de revisão
- Diária: verificar se algum CPC explodiu
- Semanal: ajustes baseados em performance da semana
- Mensal: revisão completa da estratégia de lances
