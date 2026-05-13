# HISTÓRICO DE TESTES E HIPÓTESES — Halogenn Química
> Arquivo atualizado automaticamente pelo Gestor IA após cada ação na conta.
> **REGRA:** Antes de qualquer análise ou otimização, leia este arquivo completo para não repetir testes já realizados.

---

## 📋 COMO USAR ESTE ARQUIVO

### O gestor IA DEVE:
1. **Antes de agir:** Ler este arquivo e verificar se o teste já foi feito
2. **Após qualquer ação:** Registrar o que foi feito no formato abaixo
3. **Ao propor hipótese:** Verificar se já foi testada antes de sugerir

### Formato de registro:
```
### [DATA] — [TIPO DE AÇÃO]
- **O que foi feito:** descrição clara
- **Hipótese:** o que esperávamos que acontecesse
- **Resultado:** o que aconteceu de fato
- **Aprendizado:** o que isso nos ensina
- **Próximo passo:** o que fazer com base nisso
- **Status:** ✅ Concluído / 🔄 Em andamento / ❌ Cancelado
```

---

## 🗓️ REGISTRO DE AÇÕES

### [28/04/2026] — GARIMPO DE TERMOS + NEGATIVAS + KEYWORDS (varredura 24–28/04)

- **O que foi feito:** Varredura completa de 158 termos NONE no período 24–28/04. Aplicadas 29 negativas (× 2 campanhas = 58 critérios) e 8 keywords novas. Também identificado gap crítico: Hipoclorito de Sódio PA sem nenhuma keyword ativa, apesar de 3 leads confirmados.
- **Negativas aplicadas** (ambas campanhas):
  - `alcool absoluto esteril` [PHRASE] — uso médico, não lab analítico
  - `fispq xileno` / `fispq xilol` / `xileno fispq` [PHRASE] — busca de ficha informativa
  - `xileno fds` [PHRASE] — Ficha de Dados de Segurança, não compra
  - `o que e xilol` / `o que e xileno` / `o que é xileno` [PHRASE] — informativo
  - `para que serve o xilol` / `para que serve xilol` / `xilol para que serve` [PHRASE] — informativo
  - `xileno bula` / `xileno toxicidade` / `xileno molecula` / `xileno quimica organica` [PHRASE] — informativo/acadêmico
  - `uso de xileno` [PHRASE] — informativo
  - `xilene` / `xileni` / `xilou` [EXACT] — typos sem valor comercial
  - `cas xileno` / `cas1330 20 7` [PHRASE] — busca de número CAS
  - `densidade do xilol` [PHRASE] — técnico/informativo
  - `xileno sulfonato de sodio` [PHRASE] — já negativado 23/04, reapareceu
  - `formol 37 para que serve` / `formalina o que é` / `o que é formalina` / `formol inibido 37 para que serve` [PHRASE] — informativo
  - `ph acido sulfurico 98` / `densidade do hcl 37` [PHRASE] — técnico/informativo
- **Keywords adicionadas:**
  - `etanol absoluto pa` [PHRASE] → Álcool Etílico PA-ACS (PA explícito = qualificado)
  - `álcool 99 farmácia` [PHRASE] → Álcool Etílico PA-ACS (farmácias compram álcool PA — aprovado pelo gestor)
  - `acido cloridrico 37 pa` [PHRASE] → Ácido Clorídrico PA-ACS (concentração + grau)
  - `ácido sulfúrico 98 comprar` [PHRASE] → Ácido Sulfúrico PA-ACS (intenção de compra + concentração)
  - `formol estabilizado 37` [PHRASE] → Formaldeído PA (estabilizado = com inibidor de metanol = produto HL)
  - `venda de xilol` [PHRASE] → Xileno e Xilol PA (intenção de compra)
  - `bloco de parafina histológica` [PHRASE] → Parafina Histológica (produto direto)
  - `parafina de laboratorio` [PHRASE] → Parafina Histológica (contexto laboratorial)
- **Gap identificado (ação pendente):** Hipoclorito de Sódio PA (HL100.133) sem ad group nem keywords ativas. 3 leads confirmados em abril (Leads #002, #003, #004 — incluindo R$9K em aberto). Aguardando decisão do gestor sobre criar ad group.
- **Status:** ✅ Concluído

### [28/04/2026] — GARIMPO 4ª RODADA — KEYWORDS + NEGATIVAS (análise todo o período, CSV completo)

- **O que foi feito:** Varredura do CSV "todo o período" com 103 termos NONE (= 113 no UI por variantes de tipo de correspondência). Detectado e corrigido erro de metodologia: scripts anteriores usavam `LAST_30_DAYS` + `impressions > 10`, perdendo histórico. Novo script usa data range completo sem filtro de impressões.
- **Negativas aplicadas (3ª rodada, × 2 campanhas = 6 critérios):**
  - `álcool etílico absoluto para que serve` [PHRASE] — informativo
  - `diluir formol 37 para 10` [PHRASE] — instrução de diluição, não comprador
  - `formol 37 fispq` [PHRASE] — FISPQ = ficha de segurança, não comprador
- **Keywords adicionadas (69 total):**
  - **Álcool Etílico PA-ACS (39):** alcool pa, alcool p a, álcool absoluto pa, alcool absoluto pa, álcool absoluto 99/99 3/99 5/99 8, álcool absoluto onde comprar/comprar, álcool absoluto 99 onde comprar, onde comprar álcool/alcool absoluto, onde comprar alcool anidro, preço alcool absoluto, álcool etílico 99/99 5/99 9/absoluto 99 5/p a, alcool etílico absoluto/pa, alcool etilico 99/99 3/p a, etanol 99/99 5/99.9/absoluto/p a/pa preço, álcool 99 5/99 9/onde comprar + resgatados pelo gestor: alcool 99 gl, alcool absoluto 92, alcool absoluto 96, álcool 100 por cento
  - **Formaldeído PA (4):** formol 1 litro, formol 37 1 litro, formol 37 5 litros, formalina tamponada
  - **Xileno e Xilol PA (5):** xilol puro, solvente xilol, xilol 1 litro, xileno solvente, xileno preço
  - **Ácido Sulfúrico PA-ACS (7):** ácido sulfúrico 98/pa/98 preço/pa preço, ácido sulfurico pa/pa preço, acido sulfurico p a
  - **Ácido Clorídrico PA-ACS (9):** ácido clorídrico p a/pa/pa preço/37 preço/fumegante, acido cloridrico 37/fumegante, hcl p a, hci 37
  - **Álcool Metílico PA-ACS (3):** metanol p a, álcool metílico pa, methanol p a
  - **Parafina Histológica (2):** parafina histologia, parafina histologica
- **Observação:** `alcool etílico 99` e `alcool etilico 99 5` bloqueados por policy ALCOHOL_SALE (is_exemptible). Cobertos pelas versões com acento `álcool etílico 99` e `álcool etílico 99 5` que foram adicionadas com sucesso.
- **MONITORAR:** `álcool absoluto` / `alcool absoluto` (121+103 impr, CTR ~0%) — genérico, pode ser doméstico. Revisar após 7 dias.
- **Status:** ✅ Concluído

### [28/04/2026] — GARIMPO 2ª RODADA — ANÁLISE PDF TODO O PERÍODO

- **O que foi feito:** Análise do PDF "Todo o período" (884 impr acumuladas) revelou termos não capturados na janela 24–28/04. Aplicadas 10 negativas (× 2 campanhas = 20 critérios) e 5 keywords novas.
- **Negativas aplicadas** (ambas campanhas — todas PHRASE):
  - `etanol merck` — marca Merck/Sigma-Aldrich (concorrente direto, maior fornecedor lab BR)
  - `alcool absoluto prolink` — marca Prolink
  - `rialcool absoluto` — marca
  - `álcool absoluto para que serve` — informativo
  - `álcool absoluto 70` — 70% = sanitizante doméstico, não PA absoluto
  - `álcool 99 para que serve` — informativo
  - `álcool absoluto 99 3 para que serve` — informativo
  - `o que é alcool absoluto` — informativo
  - `alcool absoluto ampola` — uso médico/hospitalar
  - `xileno densidade` — técnico informativo
- **Keywords adicionadas:**
  - `alcool anidro 99` [PHRASE] → Álcool Etílico PA-ACS
  - `acido sulfurico 95 98` [PHRASE] → Ácido Sulfúrico PA-ACS
  - `comprar xilol` [PHRASE] → Xileno e Xilol PA
  - `parafina patologia` [PHRASE] → Parafina Histológica
  - `eter pa` [PHRASE] → Éter de Petróleo PA
- **MONITORAR:** `xilol xileno` — decisão explícita do gestor, não negativar
- **Resultado:** ✅ 20 negativas + ✅ 5 keywords aplicadas com sucesso
- **Status:** ✅ Concluído

---

### [23/04/2026] — KEYWORD ADICIONAL: formol 37 inibido

- **O que foi feito:** Identificado termo `formol 37 inibido` no relatório pós-ação (3ª rodada do dia). Adicionado como PHRASE match ao ad group Formaldeído PA.
- **Motivo:** Formol com inibidor de metanol = produto exato da Halogenn (HL100.042). 4 impressões, 0 cliques — novo termo, intenção qualificada.
- **Status:** ✅ Concluído

---

### [23/04/2026] — GARIMPO DE TERMOS + NEGATIVAS + KEYWORDS (2ª RODADA — análise PDF UI)

- **O que foi feito:** Análise do relatório PDF exportado da UI do Google Ads (filtro: status NENHUM, campanhas Prioritários e Secundários, todo o período). Confirmados 64 termos únicos via API (69 na UI — diferença por agregação de tipo de correspondência). Aplicadas 9 negativas e 9 keywords novas.
- **Negativas aplicadas** (ambas campanhas ativas):
  - `xileno o que é` [PHRASE] — busca informacional
  - `cola xilol` [PHRASE] — uso errado (adesivo artesanal)
  - `xileno sulfonato de sódio` [PHRASE] — surfactante industrial, produto diferente
  - `para xileno` [PHRASE] — p-xileno industrial, produto diferente
  - `ksilen` [BROAD] — idioma estrangeiro
  - `cas 1330 20 7` [PHRASE] — busca de número CAS, não comprador
  - `formol 37 mercado livre` [PHRASE] — quer marketplace, não B2B
  - `parafina leica` [PHRASE] — marca concorrente
  - `densidade hcl 37` [PHRASE] — busca técnica, não comprador
- **Mantido:** `ácido clorídrico fumegante` — pode indicar comprador de HCl concentrado para laboratório
- **Keywords adicionadas:**
  - `alcool etilico pa` [PHRASE] → Álcool Etílico PA-ACS (14 impr)
  - `ácido clorídrico pa` [PHRASE] → Ácido Clorídrico PA-ACS (10 impr, 1 click)
  - `acido sulfurico pa` [PHRASE] → Ácido Sulfúrico PA-ACS (8 impr)
  - `alcool metilico pa` [PHRASE] → Álcool Metílico PA-ACS (5 impr)
  - `metanol acs` [PHRASE] → Álcool Metílico PA-ACS (grau ACS = muito qualificado)
  - `onde comprar xilol` [PHRASE] → Xileno e Xilol PA (intenção de compra)
  - `xilol venda` [PHRASE] → Xileno e Xilol PA (intenção de compra)
  - `onde comprar formol 37` [PHRASE] → Formaldeído PA (intenção de compra)
  - `comprar formol 37` [PHRASE] → Formaldeído PA (intenção de compra)
- **Monitorar na próxima semana:** `álcool absoluto` (52 impr, 0 cli) — maior volume, decisão pendente
- **Status:** ✅ Concluído

---

### [23/04/2026] — GARIMPO DE TERMOS + NEGATIVAS + KEYWORDS

- **O que foi feito:** Varredura completa de 102 termos de busca do período (17-23/04). Identificadas e aplicadas 15 negativas e 10 keywords novas.
- **Negativas aplicadas** (Produtos Prioritários + Produtos Secundários):
  - Estrangeiros/idioma: xylene (BROAD), xylol (BROAD), xylene chemical, hydrochloric acid fuming 37, acido clorhidrico 37, solvente xilol precio
  - Busca técnica (não compradores): fds xilol, xilol fispq, cas xilol, xilol molecula, fds hcl 37
  - Concorrentes: hcl 37 sigma, paraplast plus, dilutec industria e comercio de produtos quimicos, quimica zew
- **Keywords adicionadas:**
  - Formaldeído PA: "formaldeído pa" [EXACT], "formalina" [PHRASE], "formol 37" [PHRASE], "formol inibido 37" [PHRASE]
  - Xileno e Xilol PA: "xilol para histologia", "xilol comprar", "xileno comprar" [PHRASE]
  - Acetona PA-ACS: "acetona acs" [PHRASE]
  - Álcool Etílico PA-ACS: "álcool etílico absoluto" [PHRASE]
  - Ácido Clorídrico PA-ACS: "ácido clorídrico 37" [PHRASE]
- **Contexto:** Conta com 22 cliques em 6 dias — volume muito baixo para leads consistentes. Budget aumentado hoje (R$30→R$43/dia) deve resolver progressivamente.
- **Monitorar:** "álcool absoluto" (66 impressões, 1 clique) — maior volume da conta, ambíguo. Avaliar na próxima semana.
- **Status:** ✅ Concluído

---

### [23/04/2026] — REALOCAÇÃO DE ORÇAMENTO + DIAGNÓSTICO DE POLÍTICA

- **O que foi feito:**
  1. Diagnosticado alerta de CTR baixo (1,96% em 21/04) — confirmado como variação de 1 dia, CTR consolidado 30d está em 4,05%
  2. Auditoria de política: API mostrava 4 de 5 anúncios como DISAPPROVED — confirmado via UI e PDF que são artefatos da API. Único anúncio real afetado: Acetona PA-ACS (APPROVED_LIMITED / BIRTH_CONTROL falso positivo). Decisão: aguardar, contestar via UI quando oportuno.
  3. Pausadas 2 campanhas sem resultado: [Busca] - Nichos Específicos (0 impr em 6 dias) e [Busca] - Marca Halogenn (0 impr — esperado para marca nova)
  4. Realocado orçamento: Produtos Prioritários R$30→R$43/dia (+43%), Produtos Secundários R$10→R$17/dia (+70%)
- **Hipótese:** Concentrar orçamento nas campanhas que já provaram tração vai aumentar impressões e cliques sem aumentar o limite mensal
- **Motivo da pausa de Nichos:** Landing pages apontam para homepage (QS baixo), keywords muito específicas, sem conversões em 6 dias. Reativar somente após criar landing pages de produto específicas.
- **Motivo da pausa de Marca:** Halogenn é marca nova, volume de busca por nome é mínimo. Reativar após crescimento de reconhecimento de marca.
- **Próximo passo:** Monitorar impressões de Produtos Prioritários e Secundários nos próximos 7 dias. Quando site atingir 100+ visitantes únicos, criar campanha de Remarketing (R$200/mês reservado no buffer).
- **PMAX descartado por ora:** Halogenn é B2B puro sem conversões taggeadas. PMAX otimiza para conversões — sem dados, desperdiça em Display/YouTube/Gmail irrelevantes para compradores de reagentes PA. Remarketing é o próximo passo lógico.
- **Status:** ✅ Concluído

---

### [22/04/2026] — SEGMENTAÇÃO GEOGRÁFICA + LEAD SPAM IDENTIFICADO
- **O que foi feito:** Adicionado Brasil (geoTargetConstants/2076) como único alvo geográfico nas 4 campanhas ativas. Antes disso, as campanhas não tinham nenhum critério de localização definido — exibindo para o mundo inteiro.
- **Hipótese:** Campanha sem geo-target estava atraindo tráfego internacional irrelevante
- **Resultado:** Confirmado. Recebemos contato de fornecedor chinês (Annie / Pangs Chem) via formulário — cold email clássico, não um comprador. Prova concreta de que o formulário estava sendo atingido por tráfego fora do Brasil.
- **Aprendizado:** SEMPRE configurar segmentação geográfica ao criar campanhas. Sem geo-target, o Google exibe globalmente por padrão — mesmo com moeda BRL e timezone São Paulo. Qualquer "conversão" registrada antes de 22/04 pode estar contaminada por leads internacionais.
- **Próximo passo:** Monitorar qualidade dos leads a partir de agora. Leads legítimos devem ser 100% brasileiros com CNPJ/contexto nacional.
- **Status:** ✅ Concluído

### [22/04/2026] — RELATÓRIOS AUTOMÁTICOS COMPLETOS
- **O que foi feito:** Criado `monthly-pdf-report.js` (PDF mensal igual ao diário, puxa mês anterior completo). Agendado `report-weekly.js` toda segunda 08:00 para alimentar Google Sheets → Looker Studio. Agendado `monthly-pdf-report.js` todo dia 30 às 08:00.
- **Resultado:** ✅ Planilha atualizada com dados reais da semana (515 impr, 23 cliques, R$98,63, CTR 4,47%). PDF mensal testado com sucesso.
- **Aprendizado:** O `daily-report.js` só gera PDF — não alimenta Sheets. Scripts separados para cada finalidade.
- **Status:** ✅ Concluído

### [22/04/2026] — AUDITORIA GERAL DE AD GROUPS
- **O que foi feito:** Varredura completa dos 16 ad groups ativos. Detectado anúncio da Acetona PA-ACS reprovado por política BIRTH_CONTROL (falso positivo — acetona é reagente químico). Re-revisão forçada via update na API.
- **Resultado:** Todos os demais AGs com 1 anúncio + keywords. AGs de Nichos Específicos ainda apontam para homepage (sem landing page de produto específico). Maioria EM_REVISÃO após mudanças de URL da semana anterior — normal.
- **Próximo passo:** Acompanhar aprovação da Acetona nos próximos 1-2 dias úteis.
- **Status:** 🔄 Aguardando revisão do Google

### [22/04/2026] — PALAVRAS NEGATIVAS + NOVAS KEYWORDS (21/04)
- **O que foi feito:** Adicionadas 7 negativas em nível de campanha (todas 4): "o que é xilol", "o xilol", "o xilene", "o xileno", "densidade ácido clorídrico 37", "álcool etílico absoluto estéril 10ml", "sigma". Adicionadas 9 keywords técnicas: etanol pa/p.a., hcl pa/hcl 37, metanol pa/p.a., xileno EXACT+PHRASE.
- **Resultado:** ✅ Executado com sucesso.
- **Aprendizado:** "solvente xilol" e "xilol solvente" foram mantidos — usuário avaliou como relevantes para uso laboratorial.
- **Status:** ✅ Concluído

### [17/04/2026] — AUDITORIA PÓS-ATIVAÇÃO + CRIAÇÃO DE RSAs FALTANTES
- **O que foi feito:** Auditoria completa pós-ativação. Detectado GAP: 10 ad groups sem RSA (Produtos Secundários e Nichos Específicos). Criados 10 RSAs via script `create-rsa-missing.js`
- **Hipótese:** Tudo estaria em ordem após ativação do dia anterior
- **Resultado:** ✅ 4 campanhas ATIVAS, billing APROVADO, agora 16 RSAs no total (6 anteriores + 10 novos). QS = N/A em todos (esperado — sem impressões ainda). Erro na 1ª tentativa: textos acima do limite (headlines >30 chars, descriptions >90 chars) — corrigido na 2ª tentativa.
- **Aprendizado:** Sempre contar chars antes de criar RSAs. Headlines ≤ 30 chars, descriptions ≤ 90 chars. MetadataLookupWarning do gRPC é inofensivo — não indica falha.
- **Próximo passo:** Aguardar 24-48h para impressões e QS popularem. Monitorar CTR e CPC iniciais.
- **Status:** ✅ Concluído

### [16/04/2026] — SETUP INICIAL
- **O que foi feito:** Configuração inicial do projeto. Criação de estrutura multi-cliente, .env com credenciais, scripts de conexão com Google Ads API, GA4, GTM, Search Console e Sheets.
- **Hipótese:** Infraestrutura completa permitirá gestão automatizada das campanhas
- **Resultado:** Setup concluído, aguardando aprovação de Acesso Básico da API
- **Aprendizado:** Token atual em modo "Acesso às Análises" — pode ler mas não escrever campanhas ainda
- **Próximo passo:** Quando Acesso Básico for aprovado, criar campanhas conforme `campaign-structure.md`
- **Status:** 🔄 Em andamento

---

### [22/04/2026] — LEAD REAL REGISTRADO — UFMS / Álcool Etílico 95% PA
- **O que foi feito:** Registro de lead qualificado recebido em 20/04/2026 via formulário de cotação.
- **Dados do lead:**
  - Nome: Denise Brentan Silva
  - Empresa: Fundação Universidade Federal de Mato Grosso do Sul (UFMS)
  - Cargo: Professor
  - Segmento: Laboratório de Pesquisa
  - Cidade: Campo Grande / MS
  - CNPJ: 15.461.510/0001-93
  - Produto solicitado: **Álcool Etílico 95% PA 200L — HL100.075**
- **Resultado:** Lead legítimo, cotação formal solicitada. Resposta pendente pelo gestor humano. Fechamento a confirmar.
- **Aprendizados críticos:**
  1. **Universidades federais são compradores reais** — confirma que campanha Nichos (Universidades e Pesquisa) tem potencial direto
  2. **O produto convertido foi Álcool Etílico 95% PA (HL100.075)** — nosso AG atual aponta para HL100.006 (PA-ACS absoluto). São SKUs diferentes. Verificar se temos keywords cobrindo "álcool etílico 95%" e "etanol 95%"
  3. **Volume pedido: 200L** — compra de grande porte, ticket alto. Público universitário compra em volume.
  4. **Lead veio antes da correção de geo-target (20/04 vs 22/04)** — campanha já estava gerando leads reais mesmo com configuração incompleta
- **Próximo passo:**
  - Aguardar confirmação de fechamento para registrar CPL real
  - Verificar se "álcool etílico 95%" e variações têm cobertura de keywords
  - Considerar mencionar "200L" e volumes grandes em anúncios para atrair perfil universitário
- **Status:** 🔄 Aguardando fechamento

---

### [06/05/2026] — ROTINA SEMANAL: VARREDURA NONE + KEYWORDS + NOVO AD GROUP

- **Performance semana 29/04–06/05:** 5.171 impr | 173 clicks | CTR 3,35% | CPC R$3,15 | Custo R$545,51 | **3 conversões | CPL R$181,84**
- **Conta:** 161 keywords ativas em 10 ad groups (antes desta rodada)

- **Negativas aplicadas (3 termos × 2 campanhas = 6 critérios) [PHRASE]:**
  - `álcool benzílico` — produto completamente diferente (álcool aromático)
  - `álcool hidratado` — 92,8% hidratado ≠ PA absoluto
  - `alcool 96 liquido` — qualificação doméstica, sem intenção analítica

- **Keywords adicionadas (20 termos em 3 AGs):**
  - **Ácido Sulfúrico PA-ACS (4):** h2so4, ácido sulfúrico, acido sulfúrico, acido sulfurico
  - **Ácido Clorídrico PA-ACS (5):** ácido clorídrico pa, ácido clorídrico, acido clorídrico, acido cloridrico, ácido hidroclorídrico
  - **Álcool Etílico PA-ACS (11):** álcool etílico, álcool etilico, alcool etilico, alcool etílico, álcool 99, álcool 100, alcool 100, álcool anidro, álcool 100 puro, alcohol absoluto, alcool 99 9

- **NOVO AD GROUP criado: Álcool Isopropílico PA (Produtos Secundários)**
  - ID: 196180455813 | RSA aprovado para revisão
  - Gestor confirmou que Halogenn vende IPA — `álcool isopropílico` estava gerando R$19,63 de custo no AG errado (Álcool Etílico) sem conversão
  - 13 keywords [PHRASE]: álcool isopropílico, alcool isopropilico, álcool isopropílico pa, isopropanol pa, álcool isopropílico 99, isopropanol grau analítico, comprar álcool isopropílico, onde comprar álcool isopropílico, isopropanol 99, isopropanol 99 5, isopropanol acs, ipa pa, álcool isopropílico grau analítico

- **MONITORAR (sem ação agora):** álcool absoluto (CTR 0,6% — 2 semanas monitorando, próximo de negativar), álcool 96/alcool 96, alcool etílico 99 (policy ALCOHOL_SALE — sendo servido via BROAD), alcool 99 liquido
- **Status:** ✅ Concluído

### [06/05/2026] — GARIMPO TERMOS DE PESQUISA (709 termos analisados)

- **Negativas aplicadas (9 termos × 2 campanhas = 18 critérios) [PHRASE]:**
  - `álcool 70` — cobre todas variantes (álcool 70 atacado, 70 1 litro, distribuidora álcool 70)
  - `distribuidora de álcool` — quer distribuidor, não comprador direto
  - `etanol sigma aldrich` — concorrente Sigma-Aldrich
  - `sigma aldrich merck` — concorrentes
  - `lab alley ethanol` — marca americana, não buyer BR
  - `alcool etilico 500ml` — 500ml = varejo/farmácia, não B2B
  - `formol para desinfecção` — uso doméstico, não PA laboratorial
  - `fispq ácido clorídrico` — FISPQ = ficha de segurança, busca informacional
  - `álcool propílico` — 1-propanol, produto diferente, Halogenn não vende (confirmado)

- **Keywords adicionadas (2 termos) em Álcool Etílico PA-ACS:**
  - `etanol grau hplc` [PHRASE] — grau HPLC = comprador altamente técnico
  - `etanol para laboratorio` [PHRASE] — laboratorial + etanol = qualificado

- **MONITORAR:** `álcool absoluto`/`alcool absoluto` — CTR 0,56%/1,32% com 330 impr combinadas. Se continuar abaixo de 2% na próxima semana → negativar. `álcool isopropílico` migra naturalmente para novo AG IPA.
- **Status:** ✅ Concluído

---

### [06/05/2026] — GARIMPO GRUPOS 2–6: SOLVENTES, ÁCIDOS, OUTROS + 2 NOVOS AGs

- **O que foi feito:** Continuação do garimpo dos 512 termos NONE. Grupos 2 a 6 aprovados e executados. Criados 2 novos ad groups (Hexano PA + Tolueno PA, ambos confirmados pelo gestor). Total: 158 negativas (79 × 2 campanhas) + 66 keywords em AGs existentes + 24 keywords nos novos AGs.

- **NOVO AG: Hexano PA (Produtos Secundários)**
  - ID: 195927942469 | RSA aprovado para revisão
  - 12 keywords [PHRASE]: hexano pa, hexano pa-acs, hexano grau analítico, n-hexano pa, comprar hexano, onde comprar hexano, hexano para laboratório, hexano puro, hexano p a, hexano acs, hexano analítico, solvente hexano pa

- **NOVO AG: Tolueno PA (Produtos Secundários)**
  - ID: 194607419445 | RSA aprovado para revisão
  - 12 keywords [PHRASE]: tolueno pa, tolueno pa-acs, tolueno grau analítico, tolueno puro, comprar tolueno, onde comprar tolueno, tolueno para laboratório, tolueno p a, tolueno acs, tolueno analítico, solvente tolueno pa, toluol pa

- **Negativas aplicadas (79 termos × 2 campanhas = 158 critérios) [PHRASE]:**
  - **2A — Hexano informacional/idiomas (9):** hexano para que serve, o que é hexano, hexano formula molecular, hexano ponto de ebulição, fds hexano, fispq hexano, hexane, n-hexane, hexano cadeia carbonica
  - **2B — Tolueno informacional/idiomas (9):** tolueno para que serve, o que é tolueno, tolueno toxicidade, tolueno fds, tolueno fispq, toluene, toluol, tolueno inflamável, tolueno estrutura molecular
  - **2C — Xileno/Xilol industrial/doméstico (6):** xileno industrial, xilol industrial, xilol para pintura, xileno para pintura, xilol thinner, xilol para limpeza
  - **3A — Formaldeído doméstico/idiomas (10):** formol farmácia, formol caseiro, formaldehyde, formol para embalsamamento, formol para que serve, formalina para que serve, formol 10 para que serve, formaldeído o que é, formol odor, formol cheiro
  - **4A — H2SO4 informacional/industrial/idiomas (13):** sulfuric acid, ácido sulfúrico formula, ácido sulfúrico o que é, h2so4 o que é, ácido sulfúrico para baterias, ácido sulfúrico baterias, acido sulfurico baterias, ácido sulfúrico industrial, fds ácido sulfúrico, fispq ácido sulfúrico, acido sulfurico sigma, h2so4 sigma aldrich, ácido sulfúrico sigma aldrich
  - **5A — HCl informacional/industrial/idiomas (11):** hydrochloric acid, ácido clorídrico formula, ácido clorídrico o que é, ácido muriático, acido muriatico, hcl sigma aldrich, ácido clorídrico sigma, acido cloridrico na piscina, ácido clorídrico piscina, hcl industrial, ácido clorídrico industrial
  - **6A — Acetona doméstico/idiomas (7):** acetona para unhas, acetona remove esmalte, acetona farmácia, acetone, acetona caseira, acetona para esmalte, acetona beleza
  - **6B — Parafina doméstico/cosmético (8):** parafina para velas, parafina corporal, parafina para cabelo, parafina depilação, parafina alimentar, vela de parafina, parafina para artesanato, parafina liquida
  - **6C — Metanol combustível/idiomas (6):** metanol combustível, metanol para motor, methanol, metanol biocombustível, metanol para carro, alcool metilico combustivel

- **Keywords adicionadas (66 termos em 7 AGs) [PHRASE]:**
  - **Xileno e Xilol PA (13):** xilol pa, xilol pa-acs, xileno pa, xileno pa-acs, xilol/xileno grau analítico, xilol/xileno p a, xileno 1 litro, xilol 5 litros, xileno/xilol para laboratorio, xileno diluente
  - **Formaldeído PA (11):** formol para histologia/patologia/anatomia, formol 37 granel, formaldeído puro, formol inibido preço, formol 37 preço, formol 20/200 litros, formaldeído 37, formaldeído 37 comprar
  - **H2SO4 PA-ACS (11):** ácido sulfúrico concentrado, h2so4 concentrado, h2so4 grau analítico, ácido sulfúrico 98 onde comprar, comprar ácido sulfúrico, onde comprar ácido sulfúrico, h2so4 98, ácido sulfúrico para laboratório, ácido sulfúrico p a, h2so4 acs, acido sulfurico 98
  - **HCl PA-ACS (10):** ácido clorídrico concentrado, hcl concentrado, hcl 37 pa, hcl/ácido clorídrico grau analítico, comprar/onde comprar ácido clorídrico, ácido clorídrico para laboratório, hcl para laboratório, acido cloridrico pa preço
  - **Acetona PA-ACS (8):** acetona pa, acetona pa-acs, acetona pura, acetona grau analítico, comprar acetona pa, acetona para laboratório, acetona p a, acetona laboratorial
  - **Parafina Histológica (5):** parafina para inclusão, parafina em bloco, parafina para microscopia, parafina grau histológico, parafina para embebição
  - **Álcool Metílico PA-ACS (8):** metanol 99, metanol 99 5, metanol anidro pa, metanol grau hplc, metanol para laboratório, alcool metilico pa preço, metanol preço, metanol puro

- **Correção de mapeamento:** H2SO4, HCl e Metanol estão em Produtos Secundários (não Prioritários). Acetona e Parafina estão em Produtos Prioritários (não Secundários). Corrigido no script antes de executar.
- **Status:** ✅ Concluído

---

### [06/05/2026] — GARIMPO GRUPO 1: ÁLCOOL ETÍLICO — NEGATIVAS + KEYWORDS (512 NONE, todo período)

- **O que foi feito:** Classificação manual de todos os 512 termos NONE do período completo (2024-01-01 a 06/05/2026). Grupo 1 aprovado pelo gestor. Executados: 91 negativas × 2 campanhas + 26 keywords ao Álcool Etílico PA-ACS + 8 keywords ao Álcool Isopropílico PA.
- **Negativas aplicadas (91 termos × 2 campanhas = 182 critérios) [PHRASE]:**
  - **1A — Concorrentes/Marcas (15):** álcool santa cruz ltda, alcool santa cruz ltda, etanol absoluto merck, isopropanol quimidrol, alcool isopropilico cda, implastec alcool isopropilico, alcohol absoluto farmatodo, alcool ferreira s a, alcool uzuclean, amazon alcool 99, etanol al 96, 64 17 5, cas 64 17 5, etanol absoluto cas, 7897780207162 (EAN)
  - **1B — Informacional/FDS/FISPQ (28):** todas variantes de `fds álcool`/`fispq álcool`, `ncm álcool`, `onu 1219`, `inpm alcool`, `92 8 inpm`, `para que serve o álcool absoluto/isopropílico`, `álcool etílico densidade`, `o que é álcool absoluto/neutro/hidratado`, `qual é o álcool etílico`, `existe alcool 100`, `composição do álcool 96`, `alcool etilico cas`
  - **1C — Doméstico/Bebidas/Perfumaria (40):** `etanol para perfumes`, `alcool de perfumaria`, `alcool neutro`/`álcool neutro`/`etanol neutro`, `álcool etílico extra neutro`, `álcool etílico potável`/`de origem agrícola`, `alcool desnaturado`/`álcool etílico desnaturado`, `álcool etílico para bebidas`, `alcool de cereais 96`, `etanol etilico`/`etanol etílico`, `alcool esteril`, `álcool absoluto estéril ampola`, `alcool institucional`, `álcool hidrofílico`, `álcool 92` (todas variantes), `álcool 90 farmácia`, `alcool etilico hidratado`/`álcool etílico hidratado` (todas variantes), `etílico hidratado`
  - **1D — Idiomas estrangeiros (8):** ethanol, ethanol puro, ethyl alcohol, alcohol etilico, alcohol etilico 96, etanolo, benzyl alcohol, denatured ethanol
- **⚠️ BUG CORRIGIDO:** `álcool etílico anidro` estava indevidamente na lista de negativas (1C). Removido antes de executar — é produto que Halogenn vende, adicionado como keyword em vez disso.
- **Keywords adicionadas (26 termos) em Álcool Etílico PA-ACS [PHRASE]:**
  - 96% PA confirmado: alcool 96, álcool 96, álcool etílico 96
  - 95%: alcool 95, álcool 95, álcool 95 onde comprar, etanol 95
  - Etanol 96: etanol 96, alcool 96 gl, álcool 96 gl, alcool 96 gl preço, álcool 96 graus, álcool 96 inpm
  - Anidro: álcool etílico anidro, alcool anidro preço, álcool anidro onde comprar, onde comprar etanol anidro
  - Laboratorial/PA: alcool etilico p a, acs ethanol, etoh pa, etoh 96
  - Intenção de compra: comprar etanol, etanol comprar, alcool etanol onde comprar, etanol farmaceutico onde comprar, onde comprar etanol puro
- **Keywords adicionadas (8 termos) em Álcool Isopropílico PA [PHRASE]:**
  - isopropanol, álcool isopropílico 5l, álcool isopropílico 5 litros, álcool isopropílico puro, álcool isopropílico p a, álcool isopropílico 99 8, onde comprar álcool isopropílico 99, onde vende álcool isopropílico
- **Observação policy ALCOHOL_SALE:** `alcool etilico 96` (sem acento no á e é) bloqueou o lote inteiro. Removido; cobertura feita via `álcool etílico 96` (com acento) que passa pela policy. Mesmo padrão visto em rodadas anteriores com `alcool etilico 99`.
- **⚠️ Possível duplicata IPA:** 1F rodou 2x por falha na 1ª tentativa da 1E. Verificar keywords duplicadas em Álcool Isopropílico PA se houver problemas de performance.
- **Pendente (Grupos 2–6):** aguardando aprovação do gestor para os demais grupos (Xileno, Formaldeído, H2SO4, HCl, Outros).
- **Status:** ✅ Concluído

---

### [04/05/2026] — LEADS RECEBIDOS (7 leads — batch #007 a #013)

#### Lead #007 — Bruno Porto de Lima | Afya Centro Universitário Ji-Paraná
- **Produto:** FORMALDEIDO 37% 50L x2 (HL100.061)
- **Empresa:** Afya Centro Universitário Ji-Paraná
- **Segmento:** Educação (centro universitário)
- **Cargo:** Coordenador de Curso
- **Cidade:** Ji-Paraná / RO
- **CNPJ:** 84.596.170/0011-42
- **Email:** bruno.lima@afya.com.br | Tel: (69) 9 9922-6478
- **Mensagem:** Solicita cotação com frete incluso
- **Volume:** 2 bombonas de 50L = 100L de formol 37%
- **Status:** 🔄 Aguardando cotação

#### Lead #008 — Adriano Francisco da Silva | pessoa física / alimentício
- **Produto:** HIPOCLORITO DE SODIO 10%-12% PA ACS 50L x1 (HL100.133)
- **Empresa:** Adriano Francisco da Silva (pessoa física/ME)
- **Segmento:** Alimentício
- **Cargo:** Proprietário
- **Cidade:** Osasco / SP
- **CNPJ:** 65.159.001/0001-29
- **Email:** asilva.bicudo@gmail.com | Tel: (11) 9 4741-7738
- **Observação:** Mais um lead de Hipoclorito de Sódio — reforça urgência de criar ad group específico para HL100.133
- **Status:** 🔄 Aguardando cotação

#### Lead #009 — Nathalye Trindade Valadão | DL GELOS
- **Produto:** ALCOOL ETILICO ABS. 99,5% PA 50L x1 (HL100.009)
- **Empresa:** DL GELOS
- **Segmento:** Gelos
- **Cargo:** Proprietária
- **Cidade:** São Paulo / SP
- **CNPJ:** 60.226.130/0001-79
- **Email:** leoenana2512@gmail.com | Tel: (11) 9 9446-5077
- **Observação:** Segmento "Gelos" — álcool etílico absoluto possivelmente para processo de produção ou sanitização industrial
- **Status:** 🔄 Aguardando cotação

#### Lead #010 — João Carlos Ventura Martins | CPRM (órgão federal) ⚠️ LICITAÇÃO
- **Produto:** ALCOOL ETILICO 95% PA 1L x1 (HL100.071) + 50L x18 (HL100.074)
- **Empresa:** CPRM — Companhia de Pesquisa de Recursos Minerais (empresa pública federal)
- **Cargo:** (não informado)
- **Cidade:** Rio de Janeiro / RJ
- **CNPJ:** 00.091.652/0001-89
- **Email:** joao.martins@sgb.gov.br | Tel: (21) 9 8871-3804
- **Mensagem:** "SOLICITO COTAÇÃO PARA EFEITO DE PESQUISA DE PREÇOS VISANDO CONTRATAÇÃO FUTURA"
- **Volume:** 1L x1 + 50L x18 = 901L de álcool etílico 95% PA — ticket muito alto
- **ALERTA:** Este é um processo de PESQUISA DE PREÇOS para licitação futura (lei 8.666/14.133). Não é venda direta. Resposta deve seguir protocolo formal de cotação para órgãos públicos. Domínio @sgb.gov.br = Serviço Geológico do Brasil (SGB/CPRM).
- **Status:** 🔄 Aguardando cotação formal

#### Lead #011 — William Tashiro | biolabmed ⚠️ DIVERGÊNCIA PRODUTO
- **Produto no carrinho:** ALCOOL ETILICO ABS. 99,5% PA 1L x24 (HL100.006)
- **Produto solicitado na mensagem:** ÁLCOOL METÍLICO PADRÃO ANALÍTICO (METANOL), 1L frasco vidro
- **Empresa:** biolabmed produtos medicos e laboratoriais LTDA
- **Segmento:** Laboratório
- **Cargo:** Gerente
- **Cidade:** Manaus / AM
- **CNPJ:** 63.461.566/0001-30
- **Email:** biolabmedcomercial@gmail.com | Tel: (92) 9 9206-1916
- **ALERTA:** Divergência entre mensagem (pede metanol) e carrinho (álcool etílico absoluto). Clarificar com o cliente qual produto realmente deseja antes de cotar.
- **Status:** 🔄 Aguardando esclarecimento + cotação

#### Lead #012 — Luciano Alves dos Santos Junior | EMBRAPA Semiárido
- **Produtos:** HIPOCLORITO DE CÁLCIO GRANULADO 65% 45KG x1 (HL100.374) + SULFATO DE ALUMINIO ANIDRO PA 25KG x1 (HL100.378)
- **Empresa:** EMBRAPA Semiárido (empresa pública federal)
- **Cargo:** (não informado)
- **Cidade:** Petrolina / PE
- **CNPJ:** 00.348.003/0041-08
- **Email:** luciano.junior@embrapa.br | Tel: (87) 3866-3634
- **Observação:** EMBRAPA = empresa pública federal de pesquisa agropecuária. Domínio @embrapa.br confirma legitimidade. Produtos fora dos ad groups atuais — verificar cobertura de keywords para hipoclorito de cálcio e sulfato de alumínio.
- **Status:** 🔄 Aguardando cotação

#### Lead #013 — Raquel Maria de Souza Cassari | 56979281Ricardo F F Benedicto
- **Produto:** ALCOOL ETILICO ABS. 99,5% PA 1L x48 (HL100.006)
- **Empresa:** 56979281Ricardo F F Benedicto
- **Cargo:** (não informado)
- **Cidade:** (não informada)
- **CNPJ:** 56.979.281/0001-20
- **Email:** quel_cassari@hotmail.com | Tel: (11) 9 8368-8641
- **Mensagem:** Quer 48 litros em embalagens de 1L
- **Volume:** 48 x 1L = 48L em fracionado — pode ser revenda ou uso intensivo em processos fracionados
- **Status:** 🔄 Aguardando cotação

#### Análise agregada (batch 04/05)
- **Total de leads:** 7
- **Produtos mais solicitados:** Álcool Etílico (ABS 99,5% = 3 leads, 95% = 1 lead), Hipoclorito de Sódio (1 lead), Formaldeído 37% (1 lead), outros (EMBRAPA: hipoclorito cálcio + sulfato alumínio)
- **Órgãos públicos/federais:** 2 — CPRM (#010) + EMBRAPA (#012) → padrão de órgãos federais comprando via pesquisa de preços
- **Alertas críticos:**
  - Lead #010 (CPRM): processo licitatório — não tratar como venda direta
  - Lead #011 (biolabmed): divergência entre produto pedido (metanol) e carrinho (álcool etílico) — esclarecer antes de cotar

---

### [11/05/2026] — LEADS RECEBIDOS (3 leads — #014 a #016)

#### Lead #014 — Lucinda Areias | HTK Lentes Oftálmicas ⚠️ SEM PRODUTO ESPECIFICADO
- **Formulário:** Contato (não cotação)
- **Empresa:** HTK Lentes Oftálmicas (haytek.com.br)
- **Cargo:** (não informado)
- **Cidade:** Rio de Janeiro / RJ (DDI 21)
- **Email:** lucinda.areias@haytek.com.br | Tel: (21) 2589-6961
- **Mensagem:** "Gostaria de ter orçamento para entregas mensais"
- **Análise:** Lentes oftálmicas = fabricação/acabamento de óculos. Processo usa álcool etílico e possivelmente acetona ou solventes para limpeza de lentes. "Entregas mensais" sinaliza intenção de compra recorrente — alto LTV potencial. Email corporativo @haytek.com.br confirma B2B legítimo.
- **Ação necessária:** Qualificar: qual produto, qual volume mensal, qual finalidade (limpeza, processo, lab). Propor reunião ou enviar formulário de qualificação antes de cotar.
- **Status:** 🔄 Aguardando qualificação

#### Lead #015 — Botânica Brasil Ltda | Etanol Anidro 1.000L 💰 TICKET ALTO
- **Produto:** ÁLCOOL ETÍLICO ABS. 99,5% PA 200L x5 = **1.000 litros** (HL100.010)
- **Empresa:** Botânica Brasil Ltda
- **Segmento:** Indústria
- **Cargo:** Comprador
- **Cidade:** São Francisco do Sul / SC
- **CNPJ:** 06.989.471/0001-50
- **Email:** sauer.fortes@hotmail.com | Tel: (48) 9 9610-2455
- **Mensagem:** "Orçamento Etanol Anidro"
- **Análise:** Botânica + indústria + etanol anidro absoluto 99,5% = extração de plantas/fitoterapia ou produção de extratos vegetais. São Francisco do Sul é polo industrial portuário em SC. Volume de 1.000L é pedido B2B expressivo — ticket alto. Email hotmail pode ser do comprador pessoalmente (comum em PMEs). CNPJ verificável.
- **Observação:** HL100.010 = Álcool Etílico Abs. 99,5% PA em bombonas de 200L. Verificar disponibilidade de estoque para 5 unidades.
- **Status:** 🔄 Aguardando cotação

#### Lead #016 — Luciano Alves dos Santos Junior | EMBRAPA Semiárido ⚠️ RESUBMISSÃO #012
- **Produtos:** HIPOCLORITO DE CÁLCIO GRANULADO 65% 45KG x1 (HL100.374) + SULFATO DE ALUMINIO ANIDRO PA 25KG x1 (HL100.378)
- **Empresa:** EMBRAPA Semiárido (empresa pública federal)
- **Cidade:** Petrolina / PE
- **CNPJ:** 00.348.003/0041-08
- **Email:** luciano.junior@embrapa.br | Tel: (87) 3866-3634
- **Mensagem:** "Bom dia, solicitamos orçamento dos produtos adicionados ao carrinho."
- **⚠️ ALERTA CRÍTICO:** Esta é a mesma pessoa do Lead #012 (registrado em 04/05). Mesmos produtos, mesmo CNPJ, mesmo email. Reenviou a cotação após 7 dias sem resposta. Cotação original está em aberto há 1 semana. Resposta urgente antes de perder o lead.
- **Status:** 🚨 URGENTE — sem resposta há 7 dias

#### Análise agregada (batch 11/05)
- **Total de leads:** 3 novos
- **Destaque:** Lead #015 (Botânica Brasil) é o maior volume unitário registrado — 1.000L de etanol absoluto PA em uma única cotação
- **Novo segmento identificado:** HTK Lentes Oftálmicas (#014) = indústria óptica. Nenhum AG atual cobre esse segmento. Monitorar se aparecem mais leads do setor.
- **Alertas:**
  - Lead #016 (EMBRAPA): resubmissão após 7 dias — resposta urgente
  - Lead #014 (HTK): sem produto definido — qualificar antes de cotar
  - Acumulado de leads sem resposta confirmada: #007, #008, #009, #010, #011, #012, #013, #014, #015, #016
  - Hipoclorito de Sódio (#008): terceiro ou quarto lead consecutivo neste produto sem ad group dedicado
  - EMBRAPA (#012): produtos (hipoclorito de cálcio 65% + sulfato alumínio anidro PA) sem cobertura de ad group confirmada

---

### [07/05/2026] — GARIMPO PDF RESTANTES: NEGATIVAS + KEYWORDS (termos não cobertos nos scripts anteriores)

- **O que foi feito:** Varredura do PDF com 438 termos NONE ainda visíveis (após propagação dos scripts de 06/05). Identificados e executados termos genuinamente novos não cobertos por scripts anteriores. Script: `aplicar-pdf-restantes.js`.

- **Negativas aplicadas (19 termos × 2 campanhas = 38 critérios) [PHRASE]:**
  - **Álcool — concentrações/uso indevido (10):** `álcool etílico 98`, `álcool 98` (concentração 98% inexistente para etanol), `álcool butílico` (butanol = produto diferente), `álcool combustível` (automotivo), `alcool etilico 70` (variante sem acento de 70% — não coberta por `álcool 70` PHRASE), `álcool hospitalar 96` (varejo/farmácia), `alcool benzilico`, `alcool benzilico usp` (benzyl alcohol = produto diferente), `álcool 54` (concentração inexistente), `alcool propilico` (sem acento — não coberta por `álcool propílico` PHRASE)
  - **Formaldeído — informativo/diluição (3):** `densidade formol 37` (R$3,46 gasto — informativo), `fispq formol 37` (FISPQ = ficha de segurança), `diluição formol 37 para 10` (instrução de diluição, não comprador)
  - **H2SO4 — FDS/produtos diferentes (3):** `acido sulfurico fds` (R$3,19 gasto — FDS informativo), `ácido sulfuroso` (H2SO3 ≠ H2SO4), `cas7664 93 9` (número CAS = informativo/acadêmico)
  - **HCl — informativo/idiomas (3):** `ph ácido clorídrico`, `ph acido cloridrico` (informativo), `acido clorhidrico` (espanhol)

- **Keywords adicionadas (18 termos em 5 AGs) [PHRASE]:**
  - **Formaldeído PA — Prioritários (3):** `litro de formol` (CTR 100%, 2 clicks, R$6,98 gasto — intenção de compra clara), `venda de formol`, `formaldeido pa`
  - **Ácido Clorídrico PA-ACS — Secundários (3):** `ácido clorídrico hcl`, `ácido clorídrico venda`, `hcl fumegante`
  - **Álcool Etílico PA-ACS — Prioritários (4):** `fabricante de alcool`, `fornecedor de alcool`, `alcool 99 comprar`, `alcool 99 liquido`
  - **Ácido Sulfúrico PA-ACS — Secundários (2):** `ácido sulfúrico preço` (CTR 40%, R$6,36 gasto), `preço ácido sulfúrico`
  - **Xileno e Xilol PA — Prioritários (1):** `compra de reagentes quimicos`

- **⚠️ Policy ALCOHOL_SALE:** `álcool etílico 96 onde comprar` bloqueou o lote de álcool (mesmo com acento, o conjunto `álcool etílico` + intenção `onde comprar` dispara a policy). Removido; as 4 demais keywords do lote foram submetidas separadamente e aprovadas.
- **Observação:** A maioria dos 438 termos visíveis no PDF já estava coberta por negativas aplicadas em 06/05 — o delay de propagação (2–24h) explica a visibilidade residual. Apenas ~19 termos eram genuinamente novos.
- **Status:** ✅ Concluído

---

### [07/05/2026] — GARIMPO API REAL: 359 TERMOS NONE (Prioritários + Secundários, todo o período)

- **O que foi feito:** Primeira varredura usando `search_term_view` API com filtro `status = 'NONE'` diretamente nas campanhas ativas. Anteriormente o processo estava baseado em PDFs exportados da UI, o que não refletia o estado real da conta. Agora usando dados da API como fonte de verdade. Script: `auditoria-none.js` (auditoria) + `garimpo-api-none-07-05.js` (ação).
- **Total NONE encontrados:** 359 termos | Gasto total nesses termos: R$33,54 | 12 termos com custo, 347 só com impressão

- **Negativas aplicadas (101 termos × 2 = 202 critérios) [PHRASE]:**
  - **Álcool 70% — variantes sem acento (10):** `alcool 70` (base, cobre todas variantes), distribuidoras/fornecedores/galão de álcool 70, formula/tipos de alcool 70
  - **Álcool hidratado/concentrações indevidas (22):** `alcool etilico 1 litro` (R$3,45 gasto), `álcool etílico 96 onde comprar` (R$2,76 — ALCOHOL_SALE blocks keyword), `álcool etileno` (R$2,73 — produto diferente), hidratado 92.8%, 90%, 70%, alcool 40, álcool 95 para bebida
  - **Álcool cosmético/marcas/estrangeiro (12):** cosméticos, extra fino, marcas (Tupi, Ferreira, Synth), ampola, espanhol/francês/italiano
  - **Álcool informativo/fragmentos (13):** etílico/etilico, álcool genérico, o que é, densidade, fragmentos
  - **H2SO4 informativo/produto diferente (24):** densidade, FISPQ, pH, BASF chemistry, ácido sulfênico/sulfídrico, H2SO4 1N, sulfúrico/sulfurico genérico, H2SO4 50%
  - **HCl informativo/diluído (33):** FISPQ, CAS, densidade, pH, peso molecular, o que é, gás clorídrico, chemicals, ácido muriático concentração, HCl <37% (4%, 10%, 32%, 33%)
  - **Formaldeído informativo/diluído (6):** densidade, formaldehyde liquid, como diluir, o que é, lifemold, formaldeído 10%
  - **Xileno informativo/CAS (2):** xilol o que é, 1330 20 7
  - **Parafina produto diferente (1):** parafina liquida laboratorio (óleo mineral ≠ parafina histológica sólida)

- **Keywords adicionadas (136 termos em 10 AGs) [PHRASE]:**
  - **H2SO4 (28):** variantes sem acento (acido sulfurico pa/comprar/preco/concentrado/95/98/puro/venda/onde comprar), formas mistas, ácido sulfúrico comprar/onde comprar/h2so4/valor/preço
  - **HCl (13):** ácido clorídrico p a (R$3,98 — mais quente), acido cloridrico p a/comprar/puro/37, acido hcl, ácido hidroclorídrico/hidroclorídrico, hcl p a, clorídrico, onde encontrar
  - **Álcool Etílico (58):** variantes sem acento qualificadas (alcool etilico pa/absoluto/preço/puro), graus (95/96/99/99.5/100), intenção compra (comprar/onde comprar), anidro, álcool de cereais, etanol anidro/100
  - **Álcool Metílico (6):** metanol 99 pureza (R$2,70), metanol p a, methanol p a, álcool/alcool metílico, preço
  - **Acetona (6):** acetona 100, acetona p a, onde comprar acetona pura/100 pura
  - **Formaldeído (16):** formaldeido/37/comprar/preço, formalina 37/preço, formol 5l/5 litros/litro/líquido/estabilizado/inibido/preço, quanto custa
  - **Parafina Histológica (4):** parafina histologica, bloco de parafina biopsia, bloco histologico, blocos de parafina
  - **Xileno e Xilol (8):** solvente xileno, xilenos, xileno quimica/produto quimico, tolueno e xileno, xileno tolueno, m p xileno, empresas de reagentes quimicos
  - **Hexano PA (1):** hexano p a
  - **Acetato de Etila PA (1):** acetato de etila p a

- **ALCOHOL_SALE policy:** 7 termos bloqueados (alcool etílico 99, comprar alcool 96, alcool etilico 96 puro, alcool etilico 95, alcool etilico 5 litros, alcool etilico 1l, alcool etilico 99 5). Cobertura garantida pelas versões com acento completo já adicionadas anteriormente. Termos seguros resubmetidos em lote separado com sucesso.
- **Aprendizado-chave:** USAR SEMPRE `search_term_view` API como fonte de verdade para NONE, não PDF exportado da UI. O PDF mostra histórico cumulativo incluindo termos já cobertos. A API mostra o estado real.
- **Status:** ✅ Concluído

---

### [07/05/2026] — ATUALIZAÇÃO DE RSAs: Ad Strength POOR/AVERAGE → GOOD

- **O que foi feito:** Substituição de 7 RSAs com Ad Strength insuficiente. Estratégia: remover ad antigo + criar novo com 15 headlines (máximo do RSA). Todos os AGs de template (Hexano, Tolueno, IPA, Hipoclorito) tinham 9 headlines e D3 genérica idêntica. Scripts: `listar-rsas.js` + `atualizar-rsas.js`.
- **Motivo:** RSAs com Ad Strength POOR recebem menos impressões e pior posição de leilão. 15 headlines permite ao Google testar mais combinações e encontrar as melhores para cada usuário.
- **AGs substituídos (7):**
  - Formaldeído PA: POOR 10 headlines → 15 headlines ✅
  - Álcool Etílico PA-ACS: POOR 10 headlines → 15 headlines ✅
  - Xileno e Xilol PA: AVERAGE 10 headlines → 15 headlines ✅
  - Hexano PA: POOR 9 headlines → 15 headlines + D3 específica ✅
  - Tolueno PA: POOR 9 headlines → 15 headlines + D3 específica ✅
  - Álcool Isopropílico PA: POOR 9 headlines → 15 headlines + D3 específica ✅
  - Hipoclorito de Sódio PA: POOR 9 headlines → 15 headlines + D3 específica ✅
- **Headlines adicionados por AG:** concentrações específicas (96%/99% álcool), uso caso (histologia, cromatografia, extração), intenção compra (comprar, solicite cotação), prova social (Fiocruz/USP), brand (Halogenn)
- **AGs não alterados (Ad Strength GOOD):** Acetona, Parafina, Acetato de Etila, HCl, H2SO4, Álcool Metílico — mantidos
- **Observação API:** RSA headlines/descriptions são IMMUTABLE (não é possível UPDATE). Único caminho via API é remove + create. Padrão para futuras atualizações de copy.
- **Próximo passo:** Verificar Ad Strength após 24h. Meta: todos os 7 AGs em GOOD ou EXCELLENT.
- **Status:** ✅ Concluído

---

### [07/05/2026] — AUMENTO DE ORÇAMENTO (+R$600/mês)

- **O que foi feito:** Orçamento diário aumentado nas 2 campanhas ativas. Motivo: IS perdido por orçamento = 32,17% — conta limitada por verba, não por demanda. CPL real ~R$82 justifica o investimento. Script: `aumentar-orcamento-07-05.js`.
- **Prioritários:** R$43/dia → R$57/dia (+R$14/dia | +R$420/mês) → R$1.710/mês
- **Secundários:** R$17/dia → R$23/dia (+R$6/dia | +R$180/mês) → R$690/mês
- **Total comprometido:** R$2.400/mês (era R$1.800)
- **Distribuição:** proporcional ao peso de cada campanha (72% Prioritários / 28% Secundários)
- **Hipótese:** IS vai subir de 18% para ~26–28% nas próximas semanas, aumentando impressões e leads proporcionalmente sem deteriorar CTR ou CPL
- **Próximo passo:** Monitorar IS e CPL na semana seguinte. Se IS ainda acima de 25% perdido por orçamento após 7 dias, avaliar novo aumento.
- **Status:** ✅ Concluído

---

### [07/05/2026] — NOVO AD GROUP: Hipoclorito de Sódio PA

- **O que foi feito:** Criado ad group "Hipoclorito de Sódio PA" na campanha Produtos Secundários. Produto HL100.133 (NaOCl 10-12% PA-ACS). Motivo: 4 leads acumulados sem nenhuma cobertura de keywords. Script: `criar-ag-hipoclorito.js`.
- **Ad Group ID:** 201973085451 | RSA aprovado para revisão
- **RSA criado:**
  - Headlines: "Hipoclorito de Sódio PA", "NaOCl 10-12% Grau Analítico", "Hipoclorito PA-ACS Certificado", "Laudo de Qualidade Incluso", "Para Laboratório e Indústria", "Entrega para Todo o Brasil", "Reagente de Alta Pureza", "Compra Segura Online", "Hipoclorito de Sódio 10%"
  - Descriptions: laudo analítico / certificado de pureza / atendemos CNPJ e laboratórios
- **17 keywords adicionadas [PHRASE]:** hipoclorito de sódio pa, hipoclorito de sodio pa, hipoclorito de sódio pa-acs, hipoclorito de sódio grau analítico, hipoclorito de sódio analítico, hipoclorito de sódio para laboratório, hipoclorito de sódio laboratorial, naocl pa, naocl grau analítico, hipoclorito de sódio 10, hipoclorito de sódio 12, hipoclorito 10 pa, comprar hipoclorito de sódio pa, onde comprar hipoclorito de sódio pa, hipoclorito de sódio puro, solução hipoclorito pa, hipoclorito de sodio analitico
- **Contexto:** Leads #002, #003, #004 e #008 (Adriano Francisco da Silva / alimentício) chegaram sem AG dedicado. Com AG ativo, buscas por hipoclorito PA passam a ter anúncio relevante e QS adequado.
- **Próximo passo:** Monitorar em 7 dias — verificar impressões, CTR e se novos leads de hipoclorito chegam com mais frequência.
- **Status:** ✅ Concluído

---

## 📊 HIPÓTESES A TESTAR (backlog)

### Alta prioridade:
- [ ] Palavras-chave com grau analítico explícito (PA, PA-ACS) terão CTR maior que termos genéricos
- [ ] Segmentação por nicho (anatomia/patologia) terá CPL menor que campanha geral
- [ ] Anúncios mencionando "Fiocruz e USP" como clientes terão CTR maior
- [ ] Ajuste negativo de -20% em mobile reduzirá CPC sem perder conversões B2B

### Média prioridade:
- [ ] Horário comercial (8h-18h) gera conversões de qualidade superior ao resto do dia
- [ ] Extensões de callout com "Laudo Incluso" melhoram CTR
- [ ] Nicho análise de água tem CPC menor que nicho farmacêutico
- [ ] Phrase match performa melhor que broad match para reagentes analíticos

### Baixa prioridade:
- [ ] Remarketing para visitantes de /laudos converte melhor que visitantes gerais
- [ ] Anúncios com nome do produto + grau no título 1 têm QS maior

---

## 🚫 TESTES JÁ REALIZADOS — NÃO REPETIR

*Nenhum teste concluído ainda — conta em fase de setup*

---

## 📈 PALAVRAS-CHAVE TESTADAS

| Keyword | Data | Cliques | Conversões | CPC Médio | Decisão | Motivo |
|---|---|---|---|---|---|---|
| *Aguardando início das campanhas* | | | | | | |

---

## 🗑️ PALAVRAS NEGATIVADAS

| Termo | Data | Motivo | Campanha |
|---|---|---|---|
| *Aguardando início das campanhas* | | | |

---

## 📢 ANÚNCIOS TESTADOS

| Anúncio | Data | CTR | Conversões | Decisão |
|---|---|---|---|---|
| *Aguardando início das campanhas* | | | | |

---

## 💡 INSIGHTS ACUMULADOS

*Insights serão adicionados conforme campanhas rodarem.*

---

## ⚙️ REGRA DE ATUALIZAÇÃO AUTOMÁTICA

O gestor IA deve adicionar uma entrada neste arquivo **sempre que:**
- Criar ou pausar uma campanha
- Adicionar ou remover palavras-chave
- Negativar um termo de busca
- Testar uma variação de anúncio
- Identificar um padrão novo nos dados
- Rodar análise semanal ou mensal
- Receber aprovação para executar uma ação

**Nunca apagar registros antigos — apenas adicionar novos.**
