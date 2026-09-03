# Rimolar Química — Problema no Merchant Center (Deturpação) — Resumo completo

**Loja:** rimolar.com.br | **Plataforma:** Tray | **Merchant Center ID:** 5813715934 | **Google Ads:** 8358877005
**CNPJ atual:** 61.682.943/0001-36 (Expresslab Comercio e Importacao de Equipamentos LTDA — nome fantasia registrado: "EXPRESSLAB EQUIPAMENTOS", não "Rimolar")

---

## O PROBLEMA

Desde meados de agosto/2026, o Google Merchant Center vem sinalizando dois alertas que impedem os produtos da Rimolar de aparecerem no Google Shopping/Ads no Brasil:

1. **"A página de destino não está funcionando"** — Google alega que produtos estão vinculados a página corrompida. Requisitos citados: links funcionando, carregamento rápido, sem restrição por localização, loja sempre acessível, checkout sem erros.

2. **"Deturpação" (Misrepresentation)** — política mais grave. Texto do Google: *"temos motivos para acreditar que os clientes estão sendo enganados"*. Pede: transparência de identidade/modelo de negócio, avaliações/selos de confiança, design profissional com SSL, dados comerciais completos no Merchant Center, dados do produto batendo com a loja.

Em 28/08, a API do Merchant Center passou a mostrar a conta como `accountLevelIssues: "Account suspended due to policy violation: Misrepresentation"` — **severidade crítica**, ou seja, escalou de "aviso" para suspensão de fato.

Histórico de reanálises pedidas: 19/08 (falhou — "não resolvido"), 24/08 (falhou de novo, Deturpação ficou "em análise"). Próxima reanálise só é liberada em **03/09/2026**.

---

## TUDO QUE JÁ FOI DIAGNOSTICADO

### 1. Identidade da empresa não aparecia no site (causa raiz original, 19/08)
O site não mencionava CNPJ nem razão social em lugar nenhum, apesar de estar registrado no Merchant Center como Expresslab. **Corrigido**: rodapé passou a citar "Rimolar Química é uma marca operada por Expresslab Comércio e Importação de Equipamentos LTDA — CNPJ 61.682.943/0001-36 — [endereço]". Publicado em 20/08.
- Pedido de reanálise em 19/08 rodou **antes** dessa correção estar no ar — por isso falhou (não é bug, é sequência).
- Reanálise de 24/08 (já com a correção no ar) **também falhou** — indica que o problema é mais amplo que só essa frase.

### 2. Checagem técnica extensiva — sem achar página quebrada
- API do Merchant Center (accountstatus + productstatuses): checados os 2.675 produtos ativos, nenhuma issue de landing page/crawl na maior parte do período.
- Checagem HTTP direta de **todos os 2.675 links de produto** do feed: 100% retornaram status 2xx/3xx, zero quebrados.
- Google Search Console — "Testar URL ativo" (o teste mais confiável, usa a infraestrutura real do Googlebot) rodado em 2 URLs de produto em 28/08: **ambas passaram sem erro**, rastreamento e indexação permitidos.
- **Conclusão:** tecnicamente, o Google (via infraestrutura própria) consegue acessar as páginas normalmente. Não há evidência de página realmente quebrada.

### 3. Teoria alternativa levantada (não confirmada): bloqueio geográfico na CDN (Azion)
Um teste externo (rodado por outra ferramenta/consultoria, não pelo Google) testou as URLs de fora do Brasil (nós em Madri e Milão), simulando o User-Agent do Googlebot/AdsBot, e recebeu **403 Forbidden** nas 3 URLs testadas, inclusive no `robots.txt`. A resposta 403 aparentemente vinha da camada de CDN (Azion) na frente da loja, não da Tray.
- **Ressalva importante:** um User-Agent forjado não prova que a requisição veio de um IP real do Google — WAFs de geo-bloqueio decidem pela origem do IP, não pelo texto do User-Agent. O teste do Search Console (item 2 acima), que usa a infraestrutura de verdade do Google, **não confirmou bloqueio**.
- **Isso ainda não foi confirmado nem descartado de forma definitiva.** Precisa de alguém com acesso ao painel da Azion pra checar se existe regra de geo-bloqueio (WAF/Firewall) restringindo acesso de fora do Brasil, e se ela cobre as faixas de IP oficiais do Google:
  - Googlebot: `https://developers.google.com/static/search/apis/ipranges/googlebot.json`
  - Outros crawlers do Google (inclui AdsBot): `https://developers.google.com/static/search/apis/ipranges/special-crawlers.json`
- Ninguém na equipe sabe ao certo quem administra a conta da Azion — **isso é uma pendência de investigação**.

### 4. Auditoria de consistência do conteúdo institucional do site
Página por página, comparando o que estava escrito com o que a loja realmente faz (o tipo de coisa que a política de Deturpação cobra):

| Página | Problema encontrado | Status |
|---|---|---|
| Como comprar / Envio | Diziam que só trabalha com Correios; checkout real oferece 7 transportadoras (Correios PAC/SEDEX, Jadlog x3, Loggi, Jet, Total Express) | ✅ Corrigido e publicado |
| Pagamento | Só dizia "diversas formas de pagamento" sem citar nenhuma | ✅ Corrigido e publicado |
| Termos de uso | **Não existia** — todas as variações de URL caíam em "produto não encontrado" (404 disfarçado) | ✅ Criada e publicada |
| Política de Privacidade | Nome "RIMOLAR Produtos Químicos" inconsistente com "Rimolar Química" usado no resto do site | ⚠️ Corrigido em versão nova, **ainda não publicado** |
| Trocas e devoluções | Misturava "direito de arrependimento" (CDC Art.49) com "troca por defeito" (CDC Art.18), exigindo produto lacrado em ambos os casos indevidamente | ⚠️ Reescrito, **ainda não publicado** |
| Empresa | Reescrita com identificação legal em destaque, modelo de negócio explícito ("não somos fabricantes"), links pras políticas | ⚠️ Escrita hoje, **ainda não publicado** |

### 5. CNPJ da empresa não tem "Rimolar" no nome fantasia oficial
Consultado o CNPJ na Receita Federal (BrasilAPI): nome fantasia registrado é **"EXPRESSLAB EQUIPAMENTOS"**, nada de Rimolar. Não é ilegal (uma empresa pode operar várias marcas), mas reforça o padrão "duas lojas no mesmo CNPJ" que o Google pode estar penalizando.
- **Agravante encontrado:** a divulgação da relação entre as marcas é **mão única** — o site da Rimolar menciona a Expresslab, mas o site expresslab.com.br **não menciona a Rimolar em lugar nenhum**. Recomendado tornar recíproco (pendente, tratado em outro chat/setor).

### 6. Pagamento não cai na conta da própria empresa
Os pagamentos dos clientes vão pro Mercado Pago de um **sócio pessoa física**, não da conta da empresa (CNPJ). Isso é uma bandeira vermelha tanto fiscal (risco de omissão de receita/Receita Federal cruzando dados do Mercado Pago) quanto possivelmente de confiança pro Google. **Recomendação: contador urgente**, corrigir antes de qualquer outra ação.

### 7. Script de consentimento de cookies (LGPD/Adopt.io)
Inserido no `<head>` do tema (posição correta, antes de qualquer outro script de rastreamento). Está num rascunho de tema, **ainda não publicado**.

---

## DECISÃO EM DISCUSSÃO: abrir CNPJ novo, só pra Rimolar

Considerando abrir uma empresa própria (CNPJ dedicado) só pra Rimolar, separada da Expresslab — resolveria de forma definitiva o problema "duas lojas mesmo CNPJ". Isso ainda depende de conversa com contador (custo, enquadramento tributário, se compensa) e não tem prazo definido (abertura de empresa no Brasil leva de 1 a 4 semanas).

---

## O QUE PRECISA DE AÇÃO TÉCNICA (pro rapaz que for ajudar)

1. **Confirmar quem administra a conta da Azion (CDN) e checar se existe regra de geo-bloqueio/WAF** restringindo acesso de fora do Brasil — isso pode estar impedindo o Google de rastrear a loja corretamente, mesmo que os testes oficiais do Google (Search Console) não tenham confirmado ainda.
2. **Publicar o rascunho de tema pendente** com: correção da Política de Privacidade, texto novo de Trocas e Devoluções, página Empresa nova, e o script de consentimento de cookies (Adopt.io) no `<head>`.
3. Depois de tudo publicado, **aguardar até 03/09/2026** pra pedir nova reanálise de Deturpação e "página de destino" (Google bloqueia pedido antes dessa data).
