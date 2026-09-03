# Projeto: Resolver bloqueio no Google Merchant Center (Deturpação + Página de Destino) — E-commerce Tray

## Contexto

E-commerce brasileiro (plataforma Tray) que vende reagentes químicos/produtos de laboratório, com CDN Azion na frente da loja. A conta do Google Merchant Center está **suspensa** por dois motivos, impedindo os produtos de aparecerem no Google Shopping/Ads no Brasil.

## O problema

O Merchant Center sinaliza dois alertas, ambos bloqueando **todos** os produtos (não é um produto específico):

1. **"A página de destino não está funcionando"** — Google alega que produtos estão vinculados a página corrompida/indisponível. Requisitos citados pelo Google: links funcionando (sem erro/página em branco), carregamento rápido, loja não restringindo acesso por localização geográfica, loja sempre acessível (nunca "em manutenção"), checkout sem erros.

2. **"Deturpação" (Misrepresentation policy)** — o mais grave dos dois. Mensagem do Google: *"temos motivos para acreditar que os clientes estão sendo enganados"*. Exige: transparência sobre identidade e modelo de negócio, avaliações/selos de confiança, design profissional com certificado SSL, dados comerciais completos e corretos no Merchant Center, e que os dados do produto no feed batam exatamente com os da loja.

A API do Merchant Center já mostra a conta com `accountLevelIssues` de severidade **crítica** ("Account suspended due to policy violation: Misrepresentation").

Duas solicitações de reanálise já foram feitas (19/08 e 24/08) e **ambas falharam**. A próxima só é liberada em **03/09/2026** — ou seja, não há margem para tentativa e erro; a próxima reanálise precisa ter alta chance de sucesso.

## O que já foi investigado e DESCARTADO (não repetir)

Para não gastar tempo redescobrindo o que já sabemos:

- **Produtos/links individuais não estão quebrados.** Todos os ~2.675 produtos do feed tiveram seus links testados via requisição HTTP direta — 100% retornaram status 2xx/3xx, nenhum erro. A API do Merchant Center (`accountstatus`/`productstatuses`) também não mostra nenhum item específico com `landing_page_error` de forma consistente.
- **O Googlebot "oficial" consegue acessar a loja.** Testado via Google Search Console, opção "Testar URL ativo" (que usa a infraestrutura real de rastreamento do Google, não uma simulação) — passou sem erro em mais de uma URL de produto testada.
- **Identidade legal já foi adicionada ao rodapé do site** (razão social, CNPJ, endereço) e outras páginas institucionais (Termos de uso, Como comprar, Envio, Pagamento) já foram corrigidas para bater com a operação real da loja — mesmo assim a reanálise de 24/08 (já com essas correções no ar) voltou negativa. Ou seja, **o problema não é só conteúdo textual do site** — precisa investigar mais fundo.

## Hipótese ainda não confirmada — ponto de partida sugerido

Um teste feito de fora do Brasil (nós de teste em Madri e Milão), simulando o User-Agent do Googlebot/AdsBot-Google, recebeu **403 Forbidden** em todas as URLs testadas, inclusive no `robots.txt`. A resposta parecia vir da camada de **CDN (Azion)** na frente da loja Tray, não da própria Tray.

Isso **não foi confirmado de forma definitiva** (User-Agent forjado não garante que a requisição veio de um IP oficial do Google — e o teste do Search Console, que usa infraestrutura real do Google, não reproduziu o bloqueio). Mas é a pista mais concreta que temos, e ninguém da equipe atual tem acesso técnico de administrador à conta da Azion pra investigar a fundo.

**Ponto de partida recomendado:** investigar a configuração de WAF/Firewall/regras de bloqueio geográfico na Azion. Se houver bloqueio por país/região, é necessário garantir exceção para as faixas de IP oficiais do Google:
- Googlebot: `https://developers.google.com/static/search/apis/ipranges/googlebot.json`
- Outros rastreadores do Google, incluindo AdsBot: `https://developers.google.com/static/search/apis/ipranges/special-crawlers.json`

Mas essa é só a hipótese mais provável — o escopo do projeto é **resolver o problema**, não necessariamente confirmar essa hipótese específica. Se a causa for outra, o profissional deve investigar e resolver da mesma forma.

## Escopo do trabalho

1. Investigar a fundo a causa técnica real do bloqueio (CDN/WAF, DNS, configuração de servidor, certificado SSL, ou qualquer outra causa de infraestrutura que impeça o Google de avaliar a loja corretamente).
2. Corrigir o que for encontrado.
3. Revisar e confirmar que a loja atende a todos os requisitos técnicos e de conteúdo citados pelo Google nas duas políticas (ver seção "O problema" acima) antes da próxima janela de reanálise.
4. Deixar documentado o que foi encontrado e corrigido, com evidências (prints, logs, testes) que possam ser usados para justificar a reanálise junto ao Google.
5. Acompanhar/orientar a solicitação de reanálise em 03/09/2026 (ou orientar a equipe a fazê-la).

## Acessos que serão fornecidos após contratação

- Painel da Azion (CDN/WAF) — a definir nível de acesso necessário
- Google Merchant Center (usuário convidado)
- Painel administrativo da Tray (loja e tema)
- Google Search Console (se necessário)

## Entregáveis / critério de sucesso

- Relatório técnico da causa raiz encontrada, com evidências
- Correções aplicadas e documentadas
- Reanálise do Google aprovada (ou, no mínimo, todos os requisitos técnicos comprovadamente atendidos, com evidência, caso a aprovação dependa de prazo do próprio Google)

## Checklist técnico — "Página de destino não está funcionando" (já verificado, 28/08)

Um checklist de correção técnica foi levantado e já testamos boa parte antes de publicar este projeto — segue o resultado, pra você não perder tempo revalidando o que já está confirmado:

1. **Testar a loja com VPN dos EUA / IP estrangeiro.** ⬜ Não confirmado — nossos próprios testes automatizados (rodando de infraestrutura fora do Brasil) sempre retornaram 200 normal, mas não é um teste de VPN de verdade nem cobre todas as faixas de IP que um WAF poderia filtrar. **Este é o item mais importante a investigar.**
2. **Liberar no robots.txt: Googlebot, Googlebot-Image, AdsBot-Google e Storebot-Google com Disallow vazio.** ✅ Confirmado — já está correto, todos com `Allow: /`, sem bloqueio.
3. **Se tiver Cloudflare ou qualquer WAF, colocar os crawlers do Google na allowlist e desligar o "Bot Fight Mode".** ⬜ Não verificável sem acesso ao painel da Azion (que é o CDN usado, não Cloudflare) — **item central do escopo deste projeto.**
4. **Nenhuma URL de produto do feed retorna 404/403/500 ou redirecionamento em cadeia.** ✅ Confirmado — os ~2.675 links de produto do feed foram testados via HTTP direto, 100% retornaram 2xx/3xx. Testamos redirects também: só 1 redirect simples (`rimolar.com.br` → `www.rimolar.com.br`), nada em cadeia.
5. **PageSpeed abaixo de 3s no mobile.** ⚠️ **Achado real** — 5 páginas de produto ficaram entre 5,2s e 5,9s no teste (bem acima do recomendado): Leucina-L (ISO) 1KG, Floxina B (CI.45410) 25G, Indigo Carmin Sol.0,3% Aquosa 1L, Dióxido de Silício Coloidal (Aerosil-200) 100G, Guaiacol Sol.1% Alcoólica 1L. Vale investigar essas especificamente.
6. **Nenhuma URL de produto com parâmetro bloqueado (?sku=, ?variant=).** ✅ Confirmado — robots.txt não bloqueia nenhum padrão de query string usado nos produtos.
7. **Testar o checkout inteiro de ponta a ponta.** ✅ Confirmado pelo cliente — pedido de teste finalizado com sucesso.
8. **Nenhum popup, captcha ou modal de idade travando o carregamento.** ✅ Confirmado — existem modais no HTML (vídeo, termos), mas ocultos por padrão, só aparecem com clique do usuário. Não bloqueiam carregamento nem crawler.
9. **SSL válido e sem conteúdo misto.** ✅ Confirmado — certificado Let's Encrypt válido até 06/11/2026. Zero referências `http://` em página https.
10. **Depois de tudo corrigido, forçar recrawl no Merchant Center em Produtos > Diagnóstico.** ⬜ Ação a ser feita depois que o item 1 e 3 (Azion) forem resolvidos.

**Resumo:** 7 de 10 itens já confirmados OK. Restam praticamente só os itens de infraestrutura/CDN (1, 3, 10) e o achado de performance (5) — é basicamente o escopo real deste projeto.

## Informações técnicas de referência

- Site: https://www.rimolar.com.br/
- Plataforma: Tray (TrayCommerce)
- CDN: Azion
- Merchant Center ID: 5813715934
- Catálogo: ~2.675 produtos ativos
