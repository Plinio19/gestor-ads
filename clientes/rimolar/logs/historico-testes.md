# Histórico de Testes — Rimolar Química (Google Ads)

## 2026-08-28 — Removida do rodapé a frase inserida via código (gestor já colou pelo painel)

**Contexto:** gestor conseguiu colar manualmente pelo painel da Tray a mesma frase de vínculo Rimolar/Expresslab (CNPJ) que eu tinha inserido via API em 19/08. Pediu pra remover a versão que veio "pelo código".

**Ação:** removida a frase "Rimolar Química é uma marca operada por Expresslab Comércio e Importação de Equipamentos LTDA — CNPJ 61.682.943/0001-36 — Av. Fernando de Noronha, 522..." do `elements/footer.html` do tema 3525435 (rascunho "Alteração de Rodapé"), restaurando o texto original que ficava abaixo ("Ofertas válidas até o término de nossos estoques..."). Conferido por leitura de volta.

**Script:** `clientes/rimolar/scripts/remove-footer-code-text.mjs`

**Atualização mesma data:** gestor pediu pra remover também o texto "Ofertas válidas até o término de nossos estoques. Vendas sujeitas à análise e confirmação de dados. As fotos dos produtos exibidos em nosso site são meramente ilustrativas." — removido do mesmo `legal-info` do `footer.html` (tema 3525435), que agora fica vazio. Conferido por leitura de volta.

**Script:** `clientes/rimolar/scripts/remove-footer-oferta-text.mjs`


## 2026-08-28 — Nome fantasia do CNPJ não é "Rimolar" + divulgação recíproca ausente na ExpressLab

**Achado:** consultado o CNPJ 61.682.943/0001-36 na BrasilAPI (Receita Federal) — nome fantasia oficial registrado é **"EXPRESSLAB EQUIPAMENTOS"**, sem nenhuma menção à Rimolar. Não é ilegal (uma empresa pode operar múltiplas marcas sob um CNPJ), mas reforça exatamente o fator "dois sites no mesmo CNPJ" já apontado como contribuinte pra Deturpação.

**Verificado:** a divulgação hoje é **mão única** — o rodapé da Rimolar menciona a ExpressLab ("Rimolar Química é uma marca operada por Expresslab..."), mas o site expresslab.com.br **não menciona a Rimolar em lugar nenhum** (conferido ao vivo, sem ocorrências). Essa assimetria pode parecer tão suspeita quanto ausência total de disclosure pra um revisor manual.

**Recomendação:** tornar a divulgação recíproca — ExpressLab também declarar publicamente que opera a Rimolar Química como marca irmã do grupo.

**Decisão do gestor:** tratar isso no chat/sessão dedicado à ExpressLab (mantendo separação entre clientes), não aqui. Este achado fica registrado aqui só pra contexto — ação efetiva a ser feita do outro lado.


## 2026-08-28 — Reconstrução após perda de arquivos + página Empresa criada

**Incidente:** `clientes/rimolar/propostas/`, `site/` e `e-commerce/` sumiram do disco em algum momento desta sessão — provável `git clean -fd` rodado em outra parte do repositório (afetou tudo que não estava commitado; `.env` sobreviveu por estar gitignored). Reconstruí tudo a partir do histórico da conversa (ficha cadastral, 6 cotações, scripts de diagnóstico Merchant Center/Tray, HTMLs de correção do site) e **commitei no git** desta vez, a pedido do gestor, pra não repetir o incidente. Um PDF não foi recuperável (`Proposta-COT-2026-08-04-002-Ana-Furtado.pdf` original, feito em outra sessão, nunca tive o conteúdo bruto).

**Rodapé:** gestor duplicou o tema publicado (novo rascunho: código 3525435, referência 13, "Alteração de Rodapé - 28/08/2026") e colou manualmente pelo painel o mesmo texto de vínculo Rimolar/Expresslab que eu já tinha inserido via API antes. Conferi `footer.html` desse novo tema — só 1 ocorrência do texto, sem duplicação real no arquivo.

**Página Empresa:** gestor pediu conteúdo limpo pra `/empresa`, focado em facilitar a identificação pelo Google (transparência de identidade/modelo de negócio, exigida pela política de Deturpação). Criado com: identificação legal em destaque (razão social/CNPJ/endereço), modelo de negócio explícito ("não somos fabricantes, somos loja distribuidora"), links pras políticas (Termos de uso, Privacidade, Trocas e devoluções) e pros passos de compra/pagamento/envio.
- **Arquivo:** `clientes/rimolar/site/pagina-empresa-2026-08-28.html`


> Reconstruído em 07/08/2026: a pasta original foi excluída pelo próprio gestor humano por engano (achava que era só a parte de orçamentos/cotações, mas também continha todo o histórico de Ads). Reconstruído a partir do histórico desta conversa. A partir de agora esta pasta é commitada no git.

> **Nota de 28/08/2026:** este arquivo sofreu um segundo incidente — reverteu pra este estado (o de logo após a reconstrução de 07/08) em algum momento da sessão, provavelmente por um `git reset --hard` pra um commit antigo (junto com o `git clean -fd` que apagou `propostas/`, `site/` e `e-commerce/`, registrado na entrada de 28/08 "Reconstrução após perda de arquivos"). As entradas de 12/08, 18/08, 19/08 e 21/08 abaixo foram reconstruídas a partir do histórico da conversa.

## 2026-08-21 — Correção de conteúdo: página "Pagamento" genérica demais

**Achado:** página `/pagamento` só dizia "trabalhamos com diversas formas de pagamento", sem citar nenhum método — mesmo tipo de gap de transparência apontado pelo Google na Deturpação. Gestor confirmou os métodos reais: Mercado Pago, Pix, cartão de crédito (até 4x sem juros) e boleto (à vista, com desconto).

**Ação:** gerei o HTML corrigido (mesmo padrão visual da página de Envio — lista com cores da marca) detalhando as 3 formas de pagamento. Não apliquei diretamente — mesma limitação: é conteúdo de CMS da Tray, sem acesso via API, precisa colar manualmente em Painel Tray → Configurações → Páginas → Pagamento.

**Arquivo salvo em:** `clientes/rimolar/site/pagina-pagamento-2026-08-21.html`

## 2026-08-21 — Correção de conteúdo: páginas "Como comprar" e "Envio" citavam só Correios

**Achado (continuação da auditoria de consistência institucional):** confirmei via HTML bruto (fetch direto, não só WebFetch) que as páginas `/como-comprar` e `/envio` são **conteúdo de CMS da Tray** (bloco `board_htm description`, editável em Painel Tray → Configurações → Páginas), não arquivos de tema — por isso não aparecem via Theme SDK.

**Bloqueio técnico descoberto:** tentei listar assets do tema (`getThemeAssets`) usando o `TRAY_THEME_ID` salvo no `.env` (3514815) e recebi erro `SDK::0002 — "Tema está publicado"`. Confirmado via `getThemes()`: esse tema (id 3514815, theme_id 9) está com `date_published: 2026-08-19 15:11:23`, `published_by: "Vanessa Gonçalves Reghini"`, `default: true`. **Uma vez publicado, o Theme SDK não permite mais ler/editar os assets desse tema pela API** — só dá pra editar temas em rascunho. Pra eu voltar a editar arquivos de tema via API, alguém precisa duplicar o tema publicado num novo rascunho pelo painel da Tray e me passar o novo `id` (`TRAY_THEME_ID`).

**Ação:** como as páginas em questão são conteúdo de CMS (não tema), consegui puxar o HTML bruto direto via HTTP e gerei o texto corrigido das duas páginas, substituindo a menção exclusiva a "Correio (sedex ou encomenda simples)" pela lista real das 7 transportadoras do checkout (Correios PAC/SEDEX, Jadlog .Package/.Com/.Package Centralizado, Loggi Express, Jet Standard, Total Express). Entreguei o HTML pronto pro gestor colar no editor de páginas da Tray — não apliquei diretamente (sem acesso de API a essas páginas de CMS).
- **Arquivos salvos em:** `clientes/rimolar/site/pagina-como-comprar-2026-08-21.html` e `clientes/rimolar/site/pagina-envio-2026-08-21.html`

## 2026-08-21 — Correção de nome: "RIMOLAR Produtos Químicos" → "Rimolar Química" na Política de Privacidade

**Achado:** conferido o HTML bruto da página `/privacidade` — exatamente 2 ocorrências de "RIMOLAR Produtos Químicos", inconsistente com "Rimolar Química" usado no resto do site/rodapé. Resto da página (CNPJ, razão social Expresslab, endereço) já estava correto.

**Ação:** passei instrução de find-and-replace pontual (não reescrevi a política inteira, pra não arriscar corromper texto legal) — 2 trechos exatos de antes/depois pro gestor colar no editor de HTML da Tray.

**Arquivo:** `clientes/rimolar/site/pagina-privacidade-correcao-nome-2026-08-21.md`

## 2026-08-21 — Texto revisado: "Trocas e devoluções" separa arrependimento (CDC Art.49) de defeito (CDC Art.18)

**Contexto:** gestor pediu pra eu já montar o texto corrigido do ponto de revisão jurídica sinalizado antes — página exigia "produto não pode ter sido usado" para toda troca/devolução em 7 dias, misturando dois direitos distintos do CDC.

**Ação:** reescrevi separando: (1) **Direito de arrependimento** (Art. 49, compra à distância) — 7 dias corridos, sem justificativa, reembolso integral incl. frete; mantive a exigência de lacre intacto/embalagem original como condição razoável específica pra produtos químicos (segurança/rastreabilidade/revenda), mas com abertura pra avaliação caso a caso se o lacre já tiver sido rompido. (2) **Troca por defeito/vício** (Art. 18) — 30 dias, **explicitamente não exige produto não usado/lacrado** — a análise de defeito é técnica, não de embalagem. Mantive as seções de reembolso (cartão/boleto/Pix) como estavam, só ajustando a linguagem de recusa pra distinguir os dois casos.

**⚠️ Não é parecer jurídico:** é uma tentativa de alinhar o texto com a leitura comum do CDC Art. 49 e 18, mas recomendo revisão por advogado antes de publicar — a exigência de lacre intacto mesmo pro arrependimento (produtos químicos) é uma área cinzenta que não tenho certeza de que resiste a questionamento (Procon/juizado), especialmente se a violação do lacre for só para inspeção do produto sem uso efetivo.

**Arquivo:** `clientes/rimolar/site/pagina-trocas-devolucoes-2026-08-21.html`

## 2026-08-21 — Merchant Center: "página de destino" + Deturpação ainda não resolvida (re-análise só em 23/08)

**Contexto:** gestor reportou problema no Merchant Center. Print mostrou 2 alertas: "A página de destino não está funcionando" (bloqueando todos os produtos no Brasil) e "Deturpação" com resultado da análise solicitada em 19/08 — **ainda não resolvido**, próxima reavaliação só liberada em **23/08/2026**.

**Diagnóstico:**
- Rodei `check-account-status.js` e `check-product-issues.js` (accountstatus + productstatuses de todos os 2.675 produtos ativos): **nenhuma issue de landing page/crawl encontrada** — só os problemas antigos (title_all_caps, imagem pequena, price_updated). 0 disapproved em Shopping/SurfacesAcrossGoogle.
- Confirmei ao vivo (WebFetch) que o rodapé do site **já mostra** "Rimolar Química é uma marca operada por Expresslab Comércio e Importação de Equipamentos LTDA — CNPJ 61.682.943/0001-36" — a correção de 19/08 está publicada (gestor confirmou ter publicado em 20/08).
- **Causa-raiz do "não resolvido":** a análise da Deturpação foi solicitada em 19/08, **antes** da publicação do tema (20/08) — por isso rodou sobre o site ainda sem CNPJ/razão social. Não é um problema novo, é sequência esperada. Só dá pra pedir nova análise em 23/08.
- Business information no Merchant Center (`accounts.get`) já está preenchida (endereço, telefone, e-mail, customerService.url).
- Rodando `check-broken-links.js` (checagem HTTP real de todos os 2.675 links de produto do feed) para confirmar se existe link literalmente quebrado — resultado pendente.

**Recomendação:** não pedir reavaliação antes de 23/08/2026 (Google bloqueia). Aguardar resultado da checagem de links quebrados antes de decidir se há algo técnico adicional a corrigir.

**Resultado `check-broken-links.js` (checagem HTTP real, todos os 2.675 links do feed):** 0 links quebrados (100% retornaram 2xx/3xx). 5 páginas um pouco lentas (5,2-5,9s) mas nada crítico: Leucina-L (ISO) 1KG, Floxina B, Indigo Carmin, Dióxido de Silício Coloidal (Aerosil-200), Guaiacol Sol.1% Alcoólica.

**Conclusão:** nenhuma evidência técnica de página quebrada/corrompida — nem via API do Merchant Center, nem via checagem HTTP direta de todos os links. O alerta "página de destino não está funcionando" muito provavelmente é parte do mesmo cluster de checagem automática de confiança/transparência que gerou a Deturpação (ambos citam a mesma data de reavaliação, 23/08), não um problema técnico separado de fato. Ação: aguardar 23/08/2026 e pedir reavaliação de ambos ao mesmo tempo — site já está com CNPJ/razão social visíveis e sem links quebrados.

## 2026-08-19 — Deturpação no Merchant Center: causa raiz encontrada e corrigida (rascunho)

**Contexto:** gestor reportou aviso "Deturpação — Limita a visibilidade de todos os produtos em Brasil" no Merchant Center. Token do Merchant Center também tinha expirado nesse dia (app OAuth em modo "Teste" no Google Cloud, expira refresh token em 7 dias — reautorizado, token novo salvo em `.env`; ainda falta publicar o app pra parar de expirar).

**Diagnóstico:** comparei as informações comerciais cadastradas no Merchant Center (Content API) com o conteúdo público do site (via WebFetch em rimolar.com.br, página "Empresa" e "Política de Privacidade") — **o site não menciona CNPJ nem razão social em nenhum lugar**, nem a ligação com "Expresslab Comercio e Importacao de Equipamentos LTDA" (que é quem está registrado no Google Ads/Merchant Center). Essa divergência de identidade é o gatilho mais provável da política de Deturpação — e também uma exigência legal (CDC/LGPD) que o site não cumpria.

**Acesso configurado:** Tray Theme SDK (`@tray-tecnologia/theme-sdk`, instalado no projeto) — autenticação via Token gerado em Configurações → Minha Loja → Editar Layout (não é a mesma API de pedidos/produtos, é específica pra tema/código). Token salvo em `clientes/rimolar/.env` (`TRAY_THEME_TOKEN`, `TRAY_THEME_ID`).
- Descoberto que já existia um **rascunho de tema não publicado** criado no mesmo dia pelo próprio gestor/equipe: "Alteração de Informação Para Merchant Center - 19/08/2026" (id 3514815, theme_id 9) — usei esse rascunho em vez de criar um novo.
- **Nota técnica:** o SDK espera o campo `id` (ex: 3514815) como `themeId` na config, não o `theme_id` (9) que aparece no nome/UI. `updateThemeAsset(path, assetId, content)` exige o `content` em **base64**.

**Ação (com aprovação do gestor):** editado `/elements/footer.html` do rascunho — adicionada uma linha com a razão social completa, CNPJ e endereço logo abaixo do texto de copyright existente (`{{ Translation('ag_mensagem_rodape') }}`). Verificado por leitura de volta que a alteração foi salva corretamente.

**Status:** ✅ alteração feita **só no rascunho** (id 3514815) — **ainda não publicada**. Aguardando decisão do gestor sobre publicar (botão "Publicar" no painel da Tray, ou eu publico via API mediante confirmação).

**Pendências:**
- Publicar o rascunho pra valer
- Depois de publicado, ir no Merchant Center e pedir revisão do problema de Deturpação (não usar "Discordo desse problema" — o problema era real)
- Publicar o app OAuth do Merchant Center no Google Cloud (Tela de permissão OAuth → Publicar) pra parar de expirar o token a cada 7 dias
- Confirmar se as Informações Comerciais do Merchant Center também precisam ser atualizadas com a razão social (a API não mostra um campo de "nome legal" explícito — conferir direto na UI)

## 2026-08-18 — Troca de PC: acessos recuperados + ambiente reconstruído

**Contexto:** gestor trocou de computador. Verificado que credenciais (`clientes/rimolar/.env`, `clientes/linklab/.env`) sobreviveram intactas (provavelmente sincronizadas via nuvem), mas Node.js não estava disponível na máquina nova e `node_modules` do projeto não veio (não sincroniza).

**Ação:** baixado Node.js v24.19.0 (LTS) portátil (zip, sem instalador) do site oficial, extraído em `%LOCALAPPDATA%\node-portable\`, adicionado ao PATH do usuário permanentemente (via `[Environment]::SetEnvironmentVariable`, só afeta o perfil do usuário, não o sistema). Rodado `npm install` na raiz do projeto (388 pacotes). Confirmado acesso funcionando: Google Ads API (lista as 2 campanhas) e Merchant Center API (conta "Rimolar Quimica").

## 2026-08-18 — Orçamento subiu de novo (R$62→R$92,51/dia) — resultado ainda não confirmável no Ads

**Contexto:** gestor aumentou orçamento novamente (fora deste chat) e relatou "deu super certo, ontem saíram 8 pedidos" (17/08).

**Checagem:** Google Ads mostra só **2 conversões** em 17/08 (custo R$97,17, receita atribuída R$377,56). 14 dias: ROAS 1,57x, CPA R$128,64, 9 de 14 dias com zero conversão registrada apesar de tráfego normal — mesmo padrão de sempre, não houve melhora visível nos números do Ads após o aumento de orçamento.

**Diagnóstico reforçado:** o "sucesso" percebido é muito provavelmente real do lado do negócio, mas não comprovável pelo lado do Ads por causa da lacuna de rastreamento já identificada — não há evidência de que o aumento de orçamento por si só melhorou a eficiência da campanha.

## 2026-08-18 — Export de pedidos da Tray confirma lacuna de rastreamento com dado bruto

**Contexto:** gestor perguntou como corrigir a tag de conversão, dado que é a própria Tray que criou a campanha PMax e fornece a integração automática. Também perguntou se eu tinha acesso ao Google Drive da Rimolar — não tenho (testado via MCP, conta conectada não tem acesso à pasta compartilhada); orientei compartilhar com a conta certa ou colocar arquivos localmente.

**Ação:** gestor colocou export de pedidos da Tray (CSV, loja 1515853, 155 pedidos, 20/06 a 18/08/2026) em `clientes/rimolar/e-commerce/`. Analisado com script Node (encoding Latin-1, parser CSV com aspas).

**Achados:**
- 2 pedidos de teste identificados e excluídos (229, 227 — "Tray Sistemas", teste@tray.com.br, ambos CANCELADO)
- Coluna **"UTM Source"** existe e identifica origem: valores "1-Google Ads" (88 pedidos totais) e "4-Google Ads" (20 pedidos totais) — 108 de 155 pedidos (69,7%) atribuídos ao Google Ads pela própria Tray
- **17/08/2026 (o dia dos "8 pedidos"):** 12 pedidos no total, **8 válidos** (não cancelados/aguardando pagamento) — bate exatamente com o relato do gestor. Desses 8, **7 têm UTM Source = Google Ads** (pedidos 297, 293, 291, 289, 287, 285, 283) — mas o Google Ads só contou **2 conversões** no dia. Gap confirmado com número de pedido específico, não só estimativa.
- **Período completo (07/07-18/08):** 76 pedidos válidos com UTM Google Ads, R$15.937,99 em receita
- **Cruzamento com período já auditado (01-12/08):** Tray mostra 27 pedidos válidos/R$3.817,09 com UTM Google Ads nesse intervalo — Ads reportou só 9 conversões/R$1.843,53 no mesmo período. Confirma (com fonte de dado independente) a proporção de ~30-48% de captura que já havíamos estimado antes via comparação de dashboards.
- A venda outlier de 25/07 (~R$5.022,93 no Ads) corresponde a um pedido real de R$4.113,45 no export da Tray — confirma que era uma venda real vinda de Ads, não erro de atribuição.

**Recomendação/pendência:** montar chamado atualizado pra Tray com os números de pedido específicos de 17/08 como evidência concreta. Alternativa técnica identificada (não implementada): usar "Conversões Otimizadas" do Google Ads (casamento por e-mail/telefone hash, não precisa de gclid) pra recuperar parte das vendas não rastreadas — o export da Tray tem e-mail e telefone por pedido, mas não tem gclid, então importação de conversão por clique (GCLID) não é viável com esse dado; conversões otimizadas seria o caminho.

**Atualização de infraestrutura:** CLAUDE.md corrigido — não reflete mais "sem acesso à Tray"/"sem .env próprio" (desatualizado desde a configuração do Merchant Center em 12/08).

## 2026-08-12 — Acesso ao Merchant Center configurado (Content API) + diagnóstico de tracking

**Contexto:** gestor pediu diagnóstico da PMax visando aumentar orçamento (achava ROAS em 8x). Auditoria mostrou ROAS real em queda: 7d=2,08x, 14d=2,51x, 30d=5,11x (puxado por outlier). 8 de 14 dias com zero conversão apesar de tráfego normal. Comparação com relatório da Tray (fornecido pelo gestor) mostrou que a loja vendeu R$6.686,60 (34 vendas) entre 01-12/08, mas o Ads só atribuiu R$1.843,53 (9 conversões) no mesmo período — gestor informou que a Tray mostra "canal de venda: googleshop" em 100% dos pedidos.

**Ação:** configurado acesso via API ao Google Merchant Center (Content API for Shopping v2.1), usando projeto Google Cloud dedicado "Claude-Rimolar" (OAuth Client "Claude-Rimolar-Plinio", tipo Desktop). Fluxo de autorização feito via servidor local temporário (loopback OAuth). Credenciais salvas em `clientes/rimolar/.env` (MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET, MERCHANT_REFRESH_TOKEN, MERCHANT_ID=5813715934) — gitignored.

**Achados:**
- Free Listings e Shopping Ads **ambos ATIVOS e APROVADOS para BR** no Merchant Center
- Relatório `MerchantPerformanceView` (01-12/08) segmentado por `segments.program`: **Shopping Ads (pago) = 884 cliques (91,8%) | Free Product Listing (grátis) = 79 cliques (8,2%)**
- Cliques pagos (884) batem de perto com o total do Google Ads API pro mesmo período (858) — consistência entre os dois sistemas no lado de cliques
- **Conclusão: listagens gratuitas NÃO explicam a lacuna de conversão** (só 8% do tráfego) — a explicação mais provável continua sendo falha intermitente na tag de conversão "Conversão automática tray"
- Bônus: o próprio Merchant Center reportou "conversões: 0" nos dois programas pro período — sinal de que o rastreamento de conversão dentro do Merchant Center também está desconectado (separado do problema da tag do Ads)

**Ferramenta criada:** `clientes/rimolar/scripts/merchant-center-paid-vs-free.js` — reutilizável pra checar a divisão pago×grátis em qualquer período (`node merchant-center-paid-vs-free.js YYYY-MM-DD YYYY-MM-DD`)

**Recomendação:** não aumentar orçamento da PMax ainda. Prioridade agora é auditar a tag de conversão no site (por que ela não dispara em toda compra) antes de qualquer decisão de escala — o problema é rastreamento, não falta de demanda.

## 2026-07-07 — Setup inicial do gestor + auditoria de conta

**Ação:** Configuração inicial do escopo do gestor de tráfego para a Rimolar Química. Estrutura criada e briefing preenchido com identidade de marca fornecida pelo gestor humano.

**Auditoria da conta Google Ads (customer_id 8358877005, via MCC 6017081450):**
- 1 campanha ativa: PMax "Campanha PMax tray - Não Remover" (ID 23972573458), integrada ao Merchant Center (5813715934) via Tray
- Orçamento diário: R$40 | Atividade real: apenas 3 dias no período observado até então — indicava campanha recém-criada/reativada
- Resultado inicial: 87 cliques, R$239,36 investidos, 0 conversões
- Conversão primária "Conversão automática tray" corretamente configurada (Webpage/Purchase, primary_for_goal=true, ENABLED)
- **Diagnóstico:** sem erro estrutural aparente. Zero conversões esperado nesta fase inicial.

## 2026-07-07 — Decisão: não criar 2ª PMax ainda

**Pergunta do gestor:** manter só a campanha PMax atual até sair da fase de aprendizado, ou já criar uma PMax "geral" em paralelo?

**Recomendação dada:** manter só 1 campanha. Motivos: (1) dado insuficiente ainda; (2) risco de self-competition — 2 PMax com o mesmo feed/catálogo brigam no mesmo leilão, a menos que segmentadas por listing groups (catálogo não mapeado); (3) orçamento enxuto — dividir atrasaria a saída da fase de aprendizado.
**Status:** Gestor confirmou aguardar ~10 dias antes de reavaliar.

## 2026-07-15 — Reavaliação de performance (ROAS real)

**Correção:** entradas anteriores tinham data incorreta — a campanha rodou continuamente desde 04/07, sem parar.

**Performance real — 30 dias:**
- Custo: R$561,63 | Conversões: 4,00 | Receita: R$608,85 | **ROAS: 1,08x** ⚠️ | CPA: R$140,41 | Ticket médio implícito: R$152,21 | CTR: 2,36%

**Diagnóstico:** CTR bom, mas ROAS de 1,08x é receita bruta — depois de custo de produto, frete, impostos (Simples Nacional) e taxa de pagamento, a operação provavelmente estava no zero a zero ou no prejuízo.

## 2026-07-28 — Auditoria de verificação (só leitura)

**Resultado:**
- Orçamento diário: R$62/dia (subiu de R$40 em 21/07 — alterado fora deste chat por administrativo@rimolar.com.br, ~55% de aumento)
- 30 dias: custo R$1.238,76, receita R$6.946,05, **ROAS 5,61x**, CPA R$103,23, 12 conversões, CTR 2,54%
- 7 dias: ROAS 13,23x, CPA R$73,88
- Asset group ELIGIBLE, sem bloqueios. Atividade diária contínua, sem gaps.
- **Diagnóstico:** melhora expressiva frente a 15/07 — sem necessidade de ação corretiva.

## 2026-07-29 — Checagem: "pedidos pararam"

**Contexto:** gestor relatou queda de 1-3 pedidos/dia para quase zero, perguntou se eu tinha mexido em algo.

**Confirmado:** nenhuma ação minha na conta (só queries de leitura). Único change_event nos últimos 14 dias: alteração de orçamento em 21/07 por administrativo@rimolar.com.br via UI (não é pausa/mudança estrutural).
- Tráfego seguia normal (impressões/cliques constantes), conversão primária ativa, asset group ELIGIBLE.
- **Diagnóstico:** tráfego chegando mas não convertendo em alguns dias — problema provavelmente fora do Ads (site/checkout/estoque, sem visibilidade via API do Ads).
- Confirmado: não tenho acesso à Tray (painel/API da loja).

## 2026-07-29 — Recomendação estratégica: Search de Marca vs. 2ª PMax

**Achado:** conta tinha 0 campanhas de Search. PMax com `search_impression_share` de ~20%, 80% perdido por Rank (não por orçamento) — demanda de busca não capturada.

**Recomendação:** priorizar Search de Marca antes de 2ª PMax (risco de self-competition sem catálogo segmentado). Estrutura completa proposta: campanha Search-only, orçamento R$15/dia, Maximizar conversões, 1 grupo "Marca Rimolar" com ~9 keywords de marca, 4 negativas, RSA com 15 headlines + 4 descriptions, sitelinks e callouts.
**Bloqueio identificado:** URL do site não estava disponível em nenhum lugar do projeto.

## 2026-08-05 — Criação da campanha Search — Rimolar Marca (via API, PAUSADA)

**Ação:** Gestor confirmou a direção, passou a URL do site (`https://www.rimolar.com.br/`) e pediu para eu criar a campanha de verdade, só isso, sem mexer em mais nada. Confirmou: criar **pausada**.

**Processo:** rodei `validate_only: true` primeiro (2 rodadas até zerar erros — corrigi `explicitly_shared: false` no orçamento e `contains_eu_political_advertising` obrigatório na campanha, e removi `resource_name` manual dos critérios de local/idioma) antes da mutação real.

**Criado (customer_id 8358877005):**
- Campanha `Search — Rimolar Marca` (ID 24107119847) — status PAUSADA inicialmente, Search-only, Maximizar conversões, orçamento R$15,00/dia
- Grupo de anúncios "Marca Rimolar" (ID 202053039594), 9 palavras-chave de marca, 4 negativas
- Segmentação: Brasil + Português
- 1 anúncio RSA (15 headlines, 4 descriptions, final URL correta) + 4 callouts

**Verificado por query após criação:** tudo conferiu com o especificado.

**Atualização mesma data:** change_event mostrou administrativo@rimolar.com.br atualizando a campanha ~40min depois — cliente ativou manualmente (status passou a ENABLED). Sitelinks não foram criados (sem URLs de subpáginas confirmadas).

## 2026-08-07 — Relatório semanal completo + diagnóstico

**Acumulado PMax (04/07 a 06/08, ~5 semanas):** R$1.824,68 investido, 19 conversões, R$8.180,02 receita, **ROAS 4,48x**, CPA R$96,04, CTR 2,55%.

**Semana a semana:**
| Semana | Custo | Conv. | Receita | ROAS |
|---|---|---|---|---|
| 06/07 | R$309,08 | 3 | R$524,27 | 1,70x |
| 13/07 | R$278,75 | 3 | R$562,15 | 2,02x |
| 20/07 | R$431,30 | 5 | R$5.675,87 | 13,16x |
| 27/07 | R$396,92 | 7 | R$1.138,02 | 2,87x |
| 03/08 | R$248,95 | 1 | R$279,71 | 1,12x |

**Diagnóstico:** ROAS acumulado (4,48x) enganoso — carregado quase todo por 1 venda outlier de R$5.022,93 (25/07). Sem ela, ROAS semanal real fica entre 1,12x-2,87x. Padrão de "zero conversão" recorrente identificado em 6 de 10 dias analisados, com tráfego constante — sugeriu problema fora do Ads.

**Comparação com Tray (mesma janela 09/07-07/08, dados trazidos pelo gestor via print):**
- Tray (loja toda): R$14.109,88 em 55 pedidos, 1.400 visitas, conversão 6,50%
- Ads: R$8.032,03 em 18 conversões, 2.034 cliques — **56,9% da receita total, 32,7% dos pedidos**
- ⚠️ Cliques do Ads (2.034) **excedem** visitas totais da loja (1.400) — discrepância de medição/atribuição não resolvida entre Ads e Tray.
- 2º print: Total Pedidos R$21.450,14, Vendas Realizadas R$14.109,88, **Pedidos Cancelados R$4.593,44** (~21,4% do valor total), conversão de vendas 57,29%.

**Causa confirmada pelo gestor:** problema no meio de pagamento, ocorrido 2x no período — explica boa parte dos cancelamentos e dos dias de zero conversão. **Não é falha da campanha/mídia, é operacional.**

**Diagnóstico final revisado:** a campanha PMax está performando melhor do que os números brutos de conversão sugeriam — o gargalo real (parcialmente) é o meio de pagamento, fora do controle do Ads. Recomendações: (1) não aumentar orçamento da PMax até a conversão estabilizar; (2) resolver estabilidade do meio de pagamento (fora do meu escopo/acesso); (3) investigar a discrepância cliques×visitas com a equipe da Tray; (4) monitorar a Search de Marca (sem dado de veiculação nos primeiros dias, verificar se voltou a girar).

## 2026-08-07 — Pasta excluída e reconstruída

**Incidente:** gestor excluiu a pasta `clientes/rimolar/` inteira por engano, achando que era só a parte de propostas comerciais/cotações — na verdade continha todo esse histórico de Ads também. Reconstruído a partir do histórico da conversa (este arquivo, `CLAUDE.md` e `BRIEFING.md`). **Desta vez commitado direto no git** para não perder de novo. Propostas/cotações (pasta `propostas/`) permanecem fora — eram intencionalmente excluídas e não fazem mais parte do escopo deste chat.
