# Skill: alert-methodology

## Objetivo
Definir quando e como disparar alertas para o gestor humano (Plinio).

## Canais de alerta
- Relatório no terminal (sempre)
- Entrada na aba "Alertas" do Google Sheets
- (Futuro) Mensagem via WhatsApp ou e-mail

## Níveis de alerta

### 🚨 NÍVEL 1 — CRÍTICO (ação imediata necessária)
Parar o que estiver fazendo e reportar imediatamente.

Situações:
- Orçamento diário esgotado antes das 12h
- CPC de alguma keyword explodiu para > 3x o limite
- Gasto semanal ultrapassou 35% do orçamento mensal
- Campanha inteira sem impressões por mais de 24h
- Erro de API que impediu execução de script crítico
- Termo industrial aparecendo com muitos cliques e gasto alto

Formato do alerta:
```
🚨 ALERTA CRÍTICO — [data/hora]
Situação: [descrição]
Impacto: [quanto já gastou / qual o risco]
Ação necessária: [o que precisa ser feito]
Requer aprovação: SIM
```

### ⚠️ NÍVEL 2 — ATENÇÃO (revisar em até 24h)
Situações:
- CTR caiu abaixo de 2% em campanha principal
- CPC médio subiu > 40% sem explicação clara
- Semana sem nenhuma conversão com gasto > R$ 100
- Quality Score de keyword importante caiu para < 5
- Novo concorrente apareceu no auction insights

Formato:
```
⚠️ ATENÇÃO — [data/hora]
Situação: [descrição]
Dados: [métricas relevantes]
Sugestão: [o que o gestor IA recomenda]
```

### ℹ️ NÍVEL 3 — INFORMATIVO (ver no relatório semanal)
Situações:
- Keyword nova com bom desempenho identificada
- Oportunidade de novo nicho detectada
- Concorrente pausou anúncios (queda no overlap)
- Termo de busca interessante surgindo

## Regra de ouro
**Sempre que houver dúvida se deve alertar ou não → ALERTAR.**
É melhor um alerta a mais do que uma campanha sangrando sem que o gestor humano saiba.

## Registro obrigatório
Todo alerta deve ser registrado na aba "Alertas" do Google Sheets com:
- Data/hora
- Nível (Crítico/Atenção/Informativo)
- Descrição
- Ação tomada (se autônoma) ou "Aguardando aprovação"
- Status (Resolvido / Em aberto)
