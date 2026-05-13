# Histórico de Testes e Ações — Linklab Científica

> **Regra anti-repetição:** Antes de executar qualquer teste ou ação, leia este arquivo.
> Se encontrar um teste similar já realizado, informe o resultado anterior e proponha variação diferente.

---

## CONTEXTO ESTRATÉGICO (ler sempre antes de agir)

> A Linklab é uma **empresa secundária** do gestor humano.
> Objetivo atual: gerar receita complementar com mínimo de trabalho operacional.
> **Meta atual: R$ 80.000/mês de receita.**
> Quando atingir R$ 80k/mês consistentemente → revisar orçamento e expandir campanhas.
> Até lá: **manter apenas a PMAX ativa, não criar campanhas novas, não alterar estrutura.**

---

## Como usar este arquivo

Cada entrada deve ter:
- **Data:** quando começou
- **Hipótese:** "Se eu fizer X, então Y vai acontecer, porque Z"
- **O que mudou:** ação exata executada
- **Resultado:** dados reais após o prazo mínimo
- **Aprendizado:** o que isso ensina para campanhas futuras
- **Status:** ✅ Concluído | 🔄 Em andamento | ❌ Cancelado | ⚠️ Inconclusivo

---

## AUDITORIA INICIAL — 22/04/2026

**Tipo:** Diagnóstico completo da conta
**Executado por:** Gestor IA
**Status:** ✅ Concluído

### Dados encontrados (30 dias)
- Investimento: R$ 2.020
- Receita: R$ 50.349
- ROAS: 24.92x
- CPA: R$ 41,23
- Conversões: 49 vendas
- Ticket médio: R$ 1.027

### Dados encontrados (90 dias)
- Investimento: R$ 5.553
- Receita: R$ 219.814
- ROAS: 39.58x
- CPA: R$ 63,47
- Conversões: 87 vendas

### Campanhas
- 🟢 ATIVA: `[HighFly] PMAX | Vendas (17/jan/25)` — única campanha gerando resultado
- 🟡 PAUSADAS (5): Shopping Escala, Shopping Padrão, PMAX-SHOPPING, Display Remarketing, YT Branding
- Decisão do cliente: manter apenas a PMAX ativa até atingir R$80k/mês

### Problemas identificados
1. **8 tags de conversão PRIMÁRIAS** (ideal = 1-2) — distorce ROAS/CPA reportado
   - YouTube subscriptions como primária = ERRADO
   - YouTube follow-on views como primária = ERRADO
   - Adicionar ao Carrinho como primária = ERRADO
   - 3 tags de compra primárias simultâneas = pode contar venda 3x
2. **ROAS em queda semanal**: 90d=39x → 30d=24x → 7d=14x — monitorar
3. **Geo ineficiente**: RJ (ROAS 0.89x), MG (ROAS 0x) consumindo ~17% do orçamento
4. **Tablet sem conversão**: R$6,80 desperdiçado, bloquear

### O que está funcionando bem
- PMAX com histórico sólido de 90 dias
- Produtos estrela identificados: Colilert (ROAS 241x), Quarteador inox (ROAS 378x), Peneiras tamis
- Mobile performa igual ou melhor que desktop (não reduzir lances)
- SP = 31% do investimento, 69% das conversões, ROAS 63x

### Nicho estratégico descoberto
A Linklab tem forte performance em:
- Análise de água (Colilert, DBO, turbidímetro)
- Equipamentos de inox (quarteador, peneira, balde, funil)
- Equipamentos de análise (banho maria, eletrodo pH)
Esses são os produtos que sustentam o ROAS alto.

---

## DECISÕES ESTRATÉGICAS DO CLIENTE — 22/04/2026

**Contexto:** Linklab é empresa secundária para compor receita.
**Decisão:** Manter apenas PMAX ativa. Não criar campanhas novas agora.
**Meta:** R$ 80.000/mês de receita antes de qualquer expansão.
**Registro:** Aprovado pelo gestor humano em 22/04/2026.

---

## Backlog de ações (para quando atingir R$80k/mês)

- [ ] Corrigir tags de conversão (deixar 1-2 primárias — compra Tray + GA4)
- [ ] Aplicar ajustes geográficos: -30% RJ, -40% MG, -100% Tablet
- [ ] Investigar queda de ROAS (90d=39x → 7d=14x)
- [ ] Criar campanha Search para nicho de Análise de Água
- [ ] Criar campanha Search para nicho de Inox
- [ ] Reativar Shopping Padrão (R$20/dia, Target ROAS 10x)
- [ ] Reativar PMAX-SHOPPING
- [ ] Reativar Remarketing Display

---

---

## VARREDURA PMAX — 23/04/2026

**Tipo:** Análise profunda da campanha ativa
**Executado por:** Gestor IA
**Status:** ✅ Concluído

### Configurações da campanha

- Nome: [HighFly] PMAX | Vendas (17/jan/25)
- ID: 22137404594
- Orçamento: R$65/dia
- Estratégia: Maximizar valor de conversão **sem Target ROAS** (piso não definido)

### Asset groups

- "KeyWords" (ID 6546987556) — PAUSADO — histórico ROAS 13.61x
- "Interesses Otimizados" (ID 6561502364) — ATIVO — ROAS 23.37x, 1 audience signal

### Audiência ativa

- ID 214216647 — nome: "Interesses – otimizado" (custom audience de interesse)

### Performance semanal (tendência)

- 02/03: ROAS 4.0x | 09/03: 24.1x | 16/03: 39.2x | 23/03: 2.8x | 30/03: 60.8x | 06/04: 28.5x | 13/04: 14.3x
- Conclusão: volatilidade normal de baixo volume, não é queda estrutural

### Geo (30 dias)

- SP: R$638 → ROAS 65.7x, 36 conv (73% das conversões)
- RJ: R$238 → ROAS 0.8x, 1 conv ❌
- PR/BA/outros: R$393 → ROAS 0 ❌
- Total desperdiçado: ~R$393/mês (20% do orçamento)

### Dispositivos (30 dias)

- Desktop: R$1.498 → ROAS 25.5x (38 conv)
- Mobile: R$442 → ROAS 27.5x (11 conv)
- Tablet: R$6,80 → ROAS 0x (0 conv)

### Search insights (top termos convertendo)

- "lumilabor" (concorrente) → 8 conversões capturadas — positivo
- "proveta de plástico" → 13 conv
- "peneira granulométrica" → 13 conv
- "bombona graduada 20 litros" → 6 conv em 7 cliques (taxa ~86%)
- "centrífuga científica" → 304 cliques, apenas 4.5 conv (baixo CR)

### Assets identificados

- Imagens: fotos de banco de imagens gratuitas + imagens geradas por IA (Flux) — SEM FOTOS REAIS
- Headlines: genéricos ("Garantia de Qualidade", "LinkLab") — falta especificidade
- CTA: não configurado (Google escolhe automaticamente)
- Descriptions: "parcelando em 12x" e "pagamento facilitado" — bons diferenciais

### Problemas identificados

1. Sem Target ROAS → semanas de ROAS 2.8x acontecem sem freio
2. Imagens de banco/IA sem fotos reais dos produtos
3. CTA não configurado
4. RJ + PR + BA gastando R$393/mês com ROAS ~0
5. Tablet: R$6,80/mês desperdiçados

### Ações recomendadas (imediatas)

- [x] Configurar Target ROAS 8x (piso de segurança) — **executado 23/04/2026**
- [x] Headlines específicos adicionados — **executado 23/04/2026** (15/15 headlines, +8 novos de produto)
- [ ] Substituir imagens por fotos reais
- [x] Adicionar CTA "Comprar agora" — **confirmado SHOP_NOW ativo em 23/04/2026** (já existia, verificado e confirmado)
- [ ] Corrigir YouTube tags via UI (manual)

### Ações diferidas (após R$80k/mês)

- [ ] Geo: excluir RJ (-100%), PR (-50%), BA (-100%)
- [ ] Aumentar orçamento para R$120-186/dia (3x CPA)

---

## Backlog de hipóteses (para fase de expansão)

- [ ] Ajuste geográfico (-30% RJ, -40% MG) vai redirecionar orçamento para SP e aumentar ROAS?
- [ ] Campanha Search dedicada a Análise de Água vai capturar tráfego qualificado que PMAX perde?
- [ ] Corrigir para 1 tag primária vai melhorar otimização da PMAX?
- [ ] Bahia (ROAS 157x) é consistente ou foi outlier de um pedido grande?
