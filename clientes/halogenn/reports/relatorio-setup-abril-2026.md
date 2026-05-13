# RELATÓRIO DE SETUP — GESTOR DE TRÁFEGO IA
## Cliente: Halogenn Química | Data: 16 de Abril de 2026

---

## 1. VISÃO GERAL DO PROJETO

**Objetivo:** Criar um sistema de gestão de tráfego pago com IA para automatizar campanhas Google Ads, relatórios e monitoramento de conversões.

**Cliente:** Halogenn Química — fabricante de reagentes analíticos B2B (PA, PA-ACS, PA-CS, HPLC)
**Orçamento mensal:** R$ 2.000,00
**Meta:** Gerar leads qualificados via formulário de contato e WhatsApp

---

## 2. INFRAESTRUTURA CRIADA

### 2.1 Estrutura de pastas

```
gestor-ads/
├── CLAUDE.md                        ← instruções do gestor IA
├── .gitignore                       ← protege credenciais
├── lib/auth-client.js               ← cliente OAuth2 compartilhado
├── package.json
└── clientes/halogenn/
    ├── .env                         ← credenciais (NUNCA commitar)
    ├── BRIEFING.md                  ← briefing completo do cliente
    ├── logs/
    │   └── historico-testes.md     ← histórico de ações e hipóteses
    ├── reports/
    │   ├── audit-2026-04-16.json   ← auditoria completa da conta
    │   └── looker-studio-guide.md  ← guia para montar dashboard
    ├── scripts/ (13 scripts)
    └── skills/ (17 arquivos de skill)
```

### 2.2 Credenciais e IDs configurados

| Variável | Valor |
|---|---|
| Customer ID (Google Ads) | 7877031919 |
| GA4 Property ID | 442689165 |
| GTM Container ID | GTM-NH4J85X4 |
| Google Sheets ID | 19EZHTT04fFQIMhY7GTCwEzV01FB_3sijqJhQcB4eY9w |
| Search Console | sc-domain:halogenn.com.br |

---

## 3. SCRIPTS CRIADOS

| Script | O que faz |
|---|---|
| `auth.js` | Gera REFRESH_TOKEN via OAuth2 (todos os escopos) |
| `test-connection.js` | Testa conexão com Google Ads API e lista campanhas |
| `audit.js` | Audita toda a conta: campanhas, grupos, keywords, anúncios |
| `test-ga4.js` | Testa conexão com Google Analytics 4 |
| `test-gtm.js` | Testa conexão com Google Tag Manager |
| `test-search-console.js` | Testa conexão com Search Console |
| `check-gtm-triggers.js` | Diagnóstico detalhado de tags e triggers do GTM |
| `fix-gtm.js` | Aplicou as 4 correções no GTM |
| `publish-gtm.js` | Cria nova versão e publica o container GTM |
| `setup-sheets.js` | Cria planilha "Relatórios Halogenn Ads" com 6 abas |
| `report-weekly.js` | Gera relatório semanal com alertas automáticos |
| `report-monthly.js` | Gera relatório mensal com análise de keywords |
| `check-conversions.js` | Verifica configuração de conversões |

---

## 4. INTEGRAÇÕES CONFIGURADAS

### 4.1 Google Ads API
- **Status:** Conectada (modo "Acesso às Análises" — leitura)
- **Aguardando:** Upgrade para "Acesso Básico" (~3 dias úteis solicitados em abril/2026)
- **Com Acesso Básico:** poderá criar e editar campanhas via script
- **Escopos ativos:** `adwords`

### 4.2 Google Analytics 4 (GA4)
- **Status:** Conectado e funcionando
- **Property:** Halogenn Quimica Cientifica (442689165)
- **Vinculação com Google Ads:** Concluída via Analytics Admin API
- **Escopos ativos:** `analytics.readonly`, `analytics.edit`

### 4.3 Google Tag Manager (GTM)
- **Status:** Conectado, container publicado (versão 15)
- **Container:** GTM-NH4J85X4 — www.halogenn.com.br
- **Escopos ativos:** `tagmanager.edit.containers`, `tagmanager.edit.containerversions`, `tagmanager.publish`

### 4.4 Google Search Console
- **Status:** Conectado
- **Propriedade:** sc-domain:halogenn.com.br
- **Escopos ativos:** `webmasters.readonly`

### 4.5 Google Sheets
- **Status:** Planilha criada e ativa
- **Nome:** Relatórios Halogenn Ads
- **Abas:** Resumo, Semanal, Mensal, Campanhas, Keywords, Alertas
- **Escopos ativos:** `spreadsheets`, `drive.file`

---

## 5. AUDITORIA DA CONTA GOOGLE ADS

**Data da auditoria:** 16/04/2026
**Arquivo:** `reports/audit-2026-04-16.json`

### Campanhas encontradas: 11 (todas pausadas)

| # | Nome | Tipo | Status |
|---|---|---|---|
| 1 | [Busca] - Formaldeido | Search | Pausada |
| 2 | [Busca] - Parafina | Search | Pausada |
| 3 | [Busca] - Xileno | Search | Pausada |
| 4 | [Busca] - Acetona PA | Search | Pausada |
| 5 | [Busca] - Alcool Etilico | Search | Pausada |
| 6 | [Busca] - Alcool Metilico | Search | Pausada |
| 7 | [Busca] - Cloroformio | Search | Pausada |
| 8 | [Busca] - Acido Sulfurico | Search | Pausada |
| 9 | [Busca] - Acido Cloridrico | Search | Pausada |
| 10 | [Busca] - Acetato Etila | Search | Pausada |
| 11 | [Busca] - Eter Petroleo | Search | Pausada |

**Decisão:** Campanhas existentes serão arquivadas. Nova estrutura será criada do zero conforme `campaign-structure.md` quando o Acesso Básico for aprovado.

---

## 6. CORREÇÕES REALIZADAS NO GTM

**Problema identificado:** As 3 tags de conversão do Google Ads não disparavam — o trigger "All Pages" havia sido deletado da conta.

### Correções aplicadas (script fix-gtm.js — versão 15):

| # | Correção | Detalhe |
|---|---|---|
| 1 | Criação do trigger "All Pages" | Novo trigger do tipo PAGEVIEW, vinculado às tags GA4, Conversion Linker e Google Tag |
| 2 | Correção do trigger "Tag Gads Click WhatsApp" | Trocado de variável incorreta ({{Click URL}}) para LINK_CLICK com seletor CSS `[href*="wa.me"],[href*="whatsapp"]` |
| 3 | Correção do trigger "Formulario de Contato" | Trocado para FORM_SUBMISSION com condição {{Page URL}} contém halogenn.com.br |
| 4 | Correção do trigger "Formulario de Orçamento" | Verificado e mantido como FORM_SUBMISSION |

**Resultado:** Tags GA4, Conversion Linker e Google Tag AW-11402544358 confirmadas disparando (verificado via Tag Assistant em 16/04/2026).

### Solução adicional — WhatsApp href:
O botão de WhatsApp do site não usava tag `<a>` (era onClick puro em Next.js). O programador adicionou o atributo `href="https://wa.me/5511957072489?text=..."` para compatibilidade com o trigger GTM.

---

## 7. SKILLS DO GESTOR IA (17 arquivos)

Cada skill é um documento de referência que o gestor IA lê antes de executar cada tarefa:

| Skill | Finalidade |
|---|---|
| `ad-copywriting.md` | Regras de redação de anúncios |
| `alert-methodology.md` | Quando e como disparar alertas |
| `analyze-competitors.md` | Como analisar concorrentes no leilão |
| `analyze-keywords.md` | Como analisar performance de keywords |
| `bid-management.md` | Regras de ajuste de lances |
| `budget-management.md` | Controle de orçamento diário/mensal |
| `campaign-structure.md` | Estrutura de campanhas para Halogenn |
| `halogenn-audience.md` | Perfil detalhado do público-alvo |
| `halogenn-competitors.md` | Mapeamento de concorrentes |
| `halogenn-products.md` | Catálogo de produtos e graus analíticos |
| `keyword-research.md` | Como pesquisar novas palavras-chave |
| `mine-search-terms.md` | Como garimpar termos de busca |
| `monthly-report.md` | Formato do relatório mensal |
| `negative-keywords.md` | Regras de negativação |
| `quality-score-improvement.md` | Como melhorar Quality Score |
| `search-term-methodology.md` | Metodologia de avaliação de termos |
| `weekly-report.md` | Formato do relatório semanal |

---

## 8. LOOKER STUDIO

**Guia criado:** `reports/looker-studio-guide.md`

Dashboard a ser montado manualmente em: https://lookerstudio.google.com

| Gráfico | Fonte | Métricas |
|---|---|---|
| Série temporal | Sheets/Semanal | Custo, Cliques, Conversões por semana |
| Tabela | Sheets/Campanhas | Performance por campanha |
| Scorecard | Sheets/Resumo | Total gasto, Total conversões, CPC médio |
| Pizza | GA4 | Sessões por canal |
| Tabela | Sheets/Keywords | Top keywords |
| Tabela | Sheets/Alertas | Alertas ativos |

---

## 9. STATUS ATUAL — 16/04/2026

| Item | Status |
|---|---|
| Google Ads API | Conectada (leitura) |
| GA4 | Conectado e funcionando |
| GTM | Corrigido e publicado (v15) |
| Search Console | Conectado |
| Google Sheets | Criada e ativa |
| GA4 vinculada ao Google Ads | Concluído |
| Tags de base disparando | Confirmado via Tag Assistant |
| Tags de conversão | Aguardando testes manuais (clicar WhatsApp, submeter formulário) |
| Acesso Básico API | Aguardando aprovação Google |

---

## 10. PRÓXIMOS PASSOS (quando Acesso Básico for aprovado)

1. **Testar conversões** — clicar no botão WhatsApp e submeter formulário com Tag Assistant aberto para confirmar que as tags de conversão disparam
2. **Criar nova estrutura de campanhas** — conforme `campaign-structure.md`, começando pelos produtos de maior volume (Álcool Etílico, Acetona, Xileno, Formaldeído)
3. **Montar Looker Studio** — seguir guia em `reports/looker-studio-guide.md`
4. **Primeira análise semanal** — comando: "rodar análise semanal"
5. **Monitorar conversões no GA4** — verificar se estão sendo registradas após campanhas no ar

---

## 11. REGRAS DE OURO DO GESTOR IA

1. Sempre ler a skill correspondente antes de executar qualquer tarefa
2. Sempre pedir aprovação antes de criar campanhas, aumentar orçamento ou fazer mudanças grandes
3. Sempre justificar com dados — nunca fazer mudanças sem explicar o porquê
4. Nunca ultrapassar R$ 2.000/mês sem aprovação explícita
5. Sempre incluir grau analítico (PA, PA-ACS) em qualquer keyword ou anúncio
6. Registrar tudo na planilha Google Sheets e no historico-testes.md
7. Ler o historico-testes.md antes de qualquer ação para não repetir testes

---

*Relatório gerado em: 16/04/2026*
*Gestor de Tráfego IA — Halogenn Química*
