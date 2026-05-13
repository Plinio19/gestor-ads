# Skill: conversion-loop
## Versão 2.0 — Loop científico de otimização

---

## 🧠 PRINCÍPIO CENTRAL

> **Não otimize o que não está medindo.**
> **Não meça o que não vai te fazer tomar uma decisão.**

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

## 📋 PASSO A PASSO

### 1. OBSERVAR

**Sobre campanhas:**
- Onde estou perdendo dinheiro sem retorno?
- Quais produtos têm maior ROAS?
- Quais categorias têm CPA acima da meta?
- A PMAX está se beneficiando de todo o catálogo ou só produtos específicos?

**Sobre conversões:**
- Quais produtos estão sendo mais vendidos?
- Qual categoria tem maior ticket médio?
- Há carrinho abandonado significativo?

**Sobre o site (GA4):**
- Qual a taxa de rejeição do tráfego de Ads?
- Quais categorias têm mais saída sem conversão?
- Taxa de add-to-cart vs. finalização de compra?

---

### 2. FORMULAR HIPÓTESE

**Formato obrigatório:**
> "Se eu fizer **[X]**, então **[Y]** vai acontecer, porque **[Z]**."

**Exemplos reais para Linklab:**
- "Se eu criar campanha Search para consumíveis, o ROAS vai ser maior que equipamentos, porque o ticket é menor e a intenção de compra é mais imediata"
- "Se eu ajustar -20% mobile, o CPA vai cair sem perder conversões B2B, porque B2B finaliza no desktop"
- "Se eu reativar PMAX-Shopping, o ROAS vai se manter acima de 10x, porque o histórico da conta é forte"
- "Se eu adicionar extensões de preço, o CTR vai subir, porque mostra transparência no e-commerce"

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
| Reativação de campanha | 14 dias | 100 cliques |
| Nova segmentação | 14 dias | 100 cliques |

---

### 4. MEDIR

| O que testou | Métrica principal | Secundária |
|---|---|---|
| Copy do anúncio | CTR | ROAS |
| Keyword nova | ROAS / CPA | Volume de vendas |
| Ajuste de lance | CPC médio | IS |
| Reativação de campanha | ROAS | CPA |
| Nova categoria | CPA | Ticket médio |

---

### 5. APRENDER

- ✅ Funcionou? → Aplicar em escala
- ❌ Não funcionou? → Hipótese nova baseada no aprendizado
- ⚠️ Inconclusivo? → Estender prazo ou reformular

---

## 🔥 LOOPS PRIORITÁRIOS PARA LINKLAB

### Loop 1 — Verificar saúde das tags de conversão (fazer primeiro)
```
OBSERVAR: Múltiplas tags primárias — pode estar inflando/deflando dados
HIPÓTESE: Tags duplicadas podem estar distorcendo ROAS reportado
TESTAR: Auditar tags e deixar apenas purchase como primária
MEDIR: Variação no ROAS reportado após correção
APRENDER: O ROAS real é igual ao reportado?
```

### Loop 2 — Reativar Shopping Padrão
```
OBSERVAR: 2 campanhas Shopping pausadas com histórico
HIPÓTESE: Shopping Padrão pode ter ROAS > 10x dado histórico positivo da conta
TESTAR: Reativar com orçamento baixo (R$20/dia) e Target ROAS conservador (8x)
MEDIR: ROAS e CPA após 14 dias
APRENDER: Vale reativar ou PMAX já cobre o mesmo tráfego?
```

### Loop 3 — Expandir com Search por categoria
```
OBSERVAR: PMAX cobre tudo mas não dá controle por categoria
HIPÓTESE: Search específico por categoria permitirá otimização mais granular
TESTAR: Criar campanha Search para equipamentos de maior ticket
MEDIR: ROAS da Search vs PMAX para mesma categoria
APRENDER: Search complementa ou canibaliza a PMAX?
```

---

## 📅 CADÊNCIA DE OTIMIZAÇÃO

### Diário (5 min): Verificar ROAS e alertas críticos
### Semanal (30 min): Análise de performance + hipótese nova + registrar no historico-testes.md
### Mensal (2h): Análise completa + revisão de skills + prioridades do mês seguinte
