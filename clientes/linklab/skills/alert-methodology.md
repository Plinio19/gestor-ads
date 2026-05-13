# Skill: alert-methodology

## Objetivo
Definir quando e como disparar alertas para o gestor humano.

## Canais de alerta
- Relatório no terminal (sempre)
- Entrada na aba "Alertas" do Google Sheets
- (Futuro) Mensagem via WhatsApp ou e-mail

## Níveis de alerta

### 🚨 NÍVEL 1 — CRÍTICO (ação imediata necessária)

Situações:
- Orçamento diário esgotado antes das 12h
- ROAS caiu abaixo de 5x por mais de 2 dias
- CPA ultrapassou R$150 sem ajuste
- Campanha inteira sem impressões por mais de 24h
- Merchant Center com produtos reprovados em massa
- Erro de API que impediu execução de script crítico

Formato:
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
- Semana sem nenhuma conversão com gasto > R$200
- Quality Score de keyword importante caiu para < 5
- Novo concorrente apareceu no auction insights
- ROAS entre 5x e 8x (abaixo do ideal mas aceitável)

### ℹ️ NÍVEL 3 — INFORMATIVO (ver no relatório semanal)

Situações:
- Keyword nova com bom desempenho identificada
- Oportunidade de nicho detectada (ex: veterinário, farmácia manipulação)
- Concorrente pausou anúncios (queda no overlap)
- Produto em destaque no e-commerce sem campanha ativa

## Regra de ouro
**Sempre que houver dúvida se deve alertar ou não → ALERTAR.**

## Registro obrigatório
Todo alerta deve ser registrado com:
- Data/hora
- Nível (Crítico/Atenção/Informativo)
- Descrição
- Ação tomada ou "Aguardando aprovação"
- Status (Resolvido / Em aberto)
