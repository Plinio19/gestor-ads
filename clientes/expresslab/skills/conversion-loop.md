# Skill: conversion-loop
## Versão 2.0 — Loop científico de otimização

---

## 🧠 PRINCÍPIO CENTRAL

> **Não otimize o que não está medindo.**
> **Não meça o que não vai te fazer tomar uma decisão.**

O gestor IA não é só executor — é cientista de marketing.
Cada semana deve terminar com um aprendizado registrado e uma hipótese nova para testar.

---

## 🔄 O LOOP (nunca parar)

```
OBSERVAR dados reais
      ↓
FORMULAR hipótese clara
      ↓
TESTAR uma variável por vez
      ↓
MEDIR com métricas certas
      ↓
APRENDER e registrar
      ↓
OBSERVAR novamente...
```

---

## 📋 PASSO A PASSO DETALHADO

### 1. OBSERVAR — O que os dados dizem?

Antes de qualquer otimização, perguntar:

**Sobre campanhas:**
- Onde estou perdendo dinheiro sem retorno?
- Onde estou deixando dinheiro na mesa (baixo IS, boa conversão)?
- Quais keywords estão trazendo lead bom vs ruim?
- Qual campanha tem melhor CPL?

**Sobre leads:**
- Quantos leads vieram essa semana?
- Quantos eram lead bom (empresa B2B) vs ruim (curioso)?
- Qual produto gerou lead de maior qualidade?
- Algum padrão nos termos de busca que converteram?

**Sobre o site (GA4):**
- Qual a taxa de rejeição do tráfego de Ads?
- Quanto tempo ficam na página?
- Chegam na página de contato?

---

### 2. FORMULAR HIPÓTESE

**Formato obrigatório:**
> "Se eu fizer **[X]**, então **[Y]** vai acontecer, porque **[Z]**."

**Exemplos reais para Halogenn:**
- "Se eu adicionar 'Fiocruz e USP' no título, o CTR vai subir, porque gera credibilidade B2B"
- "Se eu negativar 'pesquisador' e 'universitário', o CPL vai cair, porque filtra lead ruim"
- "Se eu criar grupo específico para anatomia patológica, o CVR vai subir, porque é nicho com dor clara"
- "Se eu reduzir lance em mobile -30%, o CPC médio vai cair sem perder leads B2B"

**Regra:** Uma hipótese por semana. Não testar duas variáveis ao mesmo tempo.

---

### 3. TESTAR

**Antes de testar, registrar no `historico-testes.md`:**
- Data de início
- Hipótese exata
- O que vai mudar
- Prazo mínimo do teste
- Métrica que vai medir

**Prazo mínimo por tipo de teste:**
| Tipo de teste | Prazo mínimo | Volume mínimo |
|---|---|---|
| Copy de anúncio | 14 dias | 200 impressões |
| Keyword nova | 7 dias | 30 cliques |
| Ajuste de lance | 7 dias | 50 cliques |
| Negativo novo | 7 dias | observar impacto |
| Nova segmentação | 14 dias | 100 cliques |

---

### 4. MEDIR — Métrica certa para cada teste

| O que testou | Métrica principal | Secundária |
|---|---|---|
| Copy do anúncio | CTR | Conversões |
| Keyword nova | Qualidade do lead | CPL |
| Ajuste de lance | CPC médio | IS |
| Negativo novo | Redução de gasto | Manutenção de conversões |
| Segmentação | CPL | Volume de leads |
| Landing page | Taxa de conversão | Tempo na página |

---

### 5. APRENDER — Registrar no historico-testes.md

Para cada teste concluído:
- ✅ Funcionou? Por quê? → Aplicar em escala
- ❌ Não funcionou? O que isso ensina? → Hipótese nova baseada no aprendizado
- ⚠️ Inconclusivo? → Estender prazo ou reformular hipótese

---

## 🔥 LOOPS PRIORITÁRIOS PARA HALOGENN

### Loop 1 — Filtrar público errado (fazer primeiro)
```
OBSERVAR: Termos industriais aparecendo nos relatórios
HIPÓTESE: Negativos insuficientes atraem público errado
TESTAR: Aplicar lista completa de negativos industriais
MEDIR: Redução de cliques sem conversão
APRENDER: Quais negativos bloquearam tráfego bom junto?
```

### Loop 2 — Aumentar CTR
```
OBSERVAR: CTR < 2% nos anúncios principais
HIPÓTESE: Anúncio não fala da dor do comprador B2B
TESTAR: Novo anúncio com foco em risco ("sem reagente para produção")
MEDIR: CTR novo vs antigo após 14 dias
APRENDER: Qual ângulo ressoa mais com o público da Halogenn?
```

### Loop 3 — Diagnóstico de baixa conversão
```
OBSERVAR: Muitos cliques, poucos leads
HIPÓTESE: Problema na landing page, não no anúncio
TESTAR: Analisar GA4 — taxa de rejeição do tráfego de Ads
MEDIR: Tempo na página, chegada na página de contato
APRENDER: O problema é o anúncio ou a página de destino?
```

### Loop 4 — Expandir nicho anatomia/patologia
```
OBSERVAR: Xileno e formaldeído têm busca específica de patologia
HIPÓTESE: Grupo dedicado a patologia terá CPL menor
TESTAR: Criar campanha específica com keywords de histologia
MEDIR: CPL vs campanha geral após 14 dias
APRENDER: Nicho específico performa melhor que campanha ampla?
```

---

## 📅 CADÊNCIA DE OTIMIZAÇÃO

### Diário (5 min):
- Verificar orçamento e alertas críticos
- Nenhuma mudança — só monitorar

### Semanal (30 min):
- Rodar `mine-search-terms` → negativos e keywords novas
- Verificar performance das keywords ativas
- Verificar teste da semana — resultados parciais
- Escolher hipótese para próxima semana
- Registrar no `historico-testes.md`

### Mensal (2h):
- Análise completa de todos os testes do mês
- Revisar skills que precisam de atualização com base nos dados
- Definir 3 prioridades para o mês seguinte
- Atualizar `historico-testes.md` com aprendizados consolidados

---

## 🚫 ERROS QUE O GESTOR IA NUNCA PODE COMETER

1. **Testar duas variáveis ao mesmo tempo** — invalida o aprendizado
2. **Pausar teste antes do prazo mínimo** — dados insuficientes
3. **Repetir teste já feito** — sempre checar `historico-testes.md` antes
4. **Otimizar sem hipótese clara** — mudança sem aprendizado é desperdício
5. **Não registrar resultado** — aprendizado perdido para sempre
