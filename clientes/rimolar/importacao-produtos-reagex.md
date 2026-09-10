# Importação de produtos — Reagex Produtos Químicos (Tray)

Documento de handoff. Resume o que já foi levantado nesta conversa sobre a importação em massa do catálogo da Reagex na Tray, para continuar em outra sessão (Claude Code) com acesso a arquivos locais.

## Contexto da loja

- **Loja:** Reagex Produtos Químicos, e-commerce na plataforma Tray (`reagex.com.br`, domínio definitivo já ativo — o link `reagexprodutosquimicos.commercesuite.com.br` era provisório).
- **Razão social:** Reagex Comércio de Artigos Médicos e Ortopédicos LTDA
- **CNPJ:** 69.031.313/0001-03
- **Endereço:** Av. Paulista, 91 - Conj. 905, Bela Vista, São Paulo/SP - CEP 01311-000
- **Telefone:** (11) 5125-0755
- **E-mail:** vendas@reagex.com.br
- **DPO/LGPD:** Guilherme Lima de Sousa
- Marca independente — não mencionar vínculo com a Halogenn.
- Público: B2B (laboratórios/indústria) + varejo geral.
- Páginas institucionais (Sobre a empresa, Como comprar, Segurança, Envio, Pagamento, Tempo de Garantia, Política de Privacidade, Termos de uso) já estão publicadas na loja. Falta só "Trocas e devoluções" (não faz parte desta tarefa de importação).

## A tarefa

Preencher a planilha de importação de produtos da Tray com o catálogo completo vindo do fornecedor Exodo: **2.599 produtos**.

### Arquivos-fonte (Google Drive do Reagex)

Pasta: `[Reagex] Produtos` — `https://drive.google.com/drive/folders/18O6G8qGLffcXgx3hAbqwT3bslz4cUD6C`

| Arquivo | Descrição | Drive file ID |
|---|---|---|
| `Exodo Lista de precos 13-08-2026 - NAO CONTROLADOS` | Lista de preços da Exodo já filtrada (produtos não controlados), **já traz o NCM de cada produto** e **já traz a categoria a que cada produto pertence** | `1cxIxLH2aN7V4fSergnaC84pUGbbHHPnIAVOeZUu3iyI` |
| `Exodo Lista de precos 13-08-2026.xlsx` | Lista completa da Exodo (inclui controlados — provavelmente não é a base a usar, confirmar) | `1YLG8s53hTzzLkI0qr0A--lE4BkD_WALX` |
| `categorias_1559048_a759ff91-896f-40c9-9ccc-4bf7dea6b352.csv` | Categorias já exportadas da própria Tray (o dev já cadastrou categorias e subcategorias na loja) — usar como referência de ID/nome de categoria | `1fwrWcIwvF2vvhk4gDLiTu6vOP8IfkWVB` |
| `Categorias_Site_Exodo.xlsx` | Mapeamento de categorias do site (provavelmente redundante com o CSV acima — checar) | `1ldSU9p-lOkfuws0Thu7Z1LHCe-xAlyh3` |
| `1559048_131277_Importacao de Produtos.xlsx` | Template oficial de importação da Tray (vazio, só cabeçalho) | `1ITXUwAc4919zc98velzdw0pYNnfN0ifU` |

Pasta de imagens: `[Reagex] Identidade Visual` — `https://drive.google.com/drive/folders/1VoThuZcge9adKl4sNhkU4VQ7fFt4mifJ` — contém as fotos dos produtos, organizadas em três tipos: **sólidos**, **soluções** e **líquidos**. Ainda não inventariada nesta conversa (não foi possível abrir por instabilidade do navegador).

> Nesta sessão (Claude em Chrome + Cowork), não foi possível baixar/ler de forma confiável os arquivos grandes (lista de preços 817KB, CSV de categorias) via navegador — a extensão ficou muito instável. O template pequeno (6KB) foi lido com sucesso. Recomendo, na sessão do Claude Code, baixar os arquivos localmente (Google Drive Desktop, export manual, ou `gdown`/API do Drive) em vez de depender de automação de navegador.

### Estrutura exata do template de importação da Tray

Confirmada abrindo o arquivo `1559048_131277_Importacao de Produtos.xlsx` (linha de cabeçalho, 23 colunas, nesta ordem):

1. Referência (código fornecedor)
2. Nome do produto
3. Exibir na loja
4. Exibir produto ativo
5. Código da categoria principal (ID)
6. Nome da categoria - nível 1
7. Nome da categoria - nível 2
8. HTML da descrição completa
9. Estoque do produto
10. Prazo de disponibilidade
11. Endereço da imagem principal do produto
12. Marca
13. Mensagem adicional
14. NCM do produto
15. Altura (cm)
16. Largura (cm)
17. Comprimento (cm)
18. Peso do produto (gramas)
19. Preço de custo em reais
20. Preço de venda em reais
21. SEO - Descrição simplificada
22. SEO - Palavras chaves do produto
23. SEO - Titulo do produto

**Importante:** a Tray recomenda checar, dentro do próprio painel admin (tela de importação → "Veja informações detalhadas de cada coluna"), as regras detalhadas de cada campo antes de gerar o arquivo final, para evitar erro na importação — isso não foi possível checar nesta sessão. Doc oficial: https://basedeconhecimento.tray.com.br/hc/pt-br/articles/6739426359323-Como-importar-produtos-via-Excel

### Regras de negócio definidas pelo Plinio

- **Referência/identificador:** verificar/confirmar os códigos de produto exatamente como estão na lista da Exodo (o usuário pediu para "verificar todos os códigos exatamente").
- **Descrição (HTML):** descrição **única por produto**, pensada especificamente para cada item — não usar texto genérico do fornecedor. Aplicar técnicas de SEO (ver seção abaixo).
- **Preço de custo:** usar o preço da lista da Exodo como está.
- **Preço de venda:** custo × 1,45 (margem de 45% em cima do custo).
- **Categorias:** já cadastradas na Tray pelo dev — usar o arquivo `categorias_1559048_...csv` como fonte de verdade para nome/ID de categoria nível 1 e 2. Não inventar categoria nova.
- **Estoque:** 999 para todos os produtos.
- **Prazo de disponibilidade:** 6 dias úteis — **ainda não confirmado qual o formato exato que a Tray espera nesse campo** (número puro? texto? dias corridos vs úteis?). Checar na tela de importação da Tray antes de gerar o arquivo final.
- **Marca:** `EXODO` para todos os produtos.
- **Endereço da imagem principal:** **não pode ser link do Google Drive** — confirmado na documentação oficial da Tray que links do Drive não são aceitos. Precisa ser URL pública direta, imagem até 2000×2000px, recomendado até ~350KB. Ainda **sem solução definida** de onde hospedar as imagens (opções: subir direto pela Tray produto a produto depois da importação; hospedar em algum storage público; etc.) — isso preocupa o Plinio porque em um e-commerce anterior a imagem perdeu qualidade.
- **Fotos:** existem três categorias de foto — produtos sólidos, soluções e líquidos — provavelmente uma foto "padrão" por tipo, não necessariamente uma foto única por produto (confirmar com o Plinio se é isso mesmo).
- **Mensagem adicional:** usar o e-mail de contato (vendas@reagex.com.br) ou outra informação de contato relevante.
- **NCM do produto:** já vem preenchido na lista da Exodo (coluna já existe na planilha "NAO CONTROLADOS") — só precisa ser mapeado para a coluna certa do template.
- **Dimensões da embalagem (fixas para todos os produtos, aparentemente):**
  - Largura (frente): 9,3 cm
  - Comprimento (lateral/profundidade): 9,3 cm
  - Altura: 22 cm
  - Peso: 1 kg = 1000 g (atenção: o campo do template pede peso em **gramas**, não kg)

  > Confirmar com o Plinio se essa dimensão/peso vale para todos os 2.599 produtos igual, ou se varia por tipo/tamanho de embalagem — parece meio improvável que reagentes de volumes muito diferentes (ex.: 100ml vs 5L) tenham a mesma caixa, vale checar.

### Diretrizes de SEO para as descrições (resumo do que o Plinio mandou)

O Plinio colou dois textos de referência: o "Guia de SEO para iniciantes" do Google (Search Central) e um artigo da Vindi sobre SEO para página de produto. Resumo prático do que aplicar em cada descrição/meta:

- Cada descrição precisa ser **exclusiva** — nunca copiar texto do fabricante/fornecedor. Reescrever com conhecimento próprio do produto.
- Texto bem estruturado: parágrafos curtos, natural, sem erros, sem "recheio" de palavra-chave repetida.
- Usar heading tags dentro da descrição quando fizer sentido (ex.: um H2/H3 para "Aplicações", "Especificações técnicas" se o HTML permitir).
- Antecipar termos de busca reais do usuário (ex.: tanto o nome técnico/IUPAC quanto termos populares, quando aplicável).
- **Meta description** (`SEO - Descrição simplificada`): curta (1–2 frases), única por produto, resume o principal benefício/uso — é o que aparece como snippet no Google.
- **SEO - Titulo do produto:** título único, claro, que descreva bem o produto (pode incluir marca/uso principal).
- **SEO - Palavras chaves do produto:** não é prioridade — na config de meta keywords das páginas institucionais o Plinio já pediu para pular esse campo (não estava funcionando bem via automação); nas colunas do template pode preencher já que é campo próprio da Tray, mas sem forçar demais.
- Não inventar número mínimo/máximo de palavras — só evitar textos genéricos ou vazios.
- Evitar qualquer coisa que pareça "penalidade" de conteúdo duplicado: cada um dos 2.599 produtos precisa ter texto realmente diferente, mesmo que a estrutura/template da descrição seja parecida entre produtos da mesma categoria.

## Status / onde parou

- [x] Confirmado o schema exato do template de importação da Tray (23 colunas, ver acima).
- [x] Confirmado que imagem via Google Drive não funciona na importação da Tray.
- [x] Confirmado que a lista da Exodo (NAO CONTROLADOS) já traz NCM e categoria.
- [x] Confirmado volume: 2.599 produtos.
- [ ] Não foi possível ler o conteúdo real da lista de preços da Exodo nem do CSV de categorias (só os nomes/IDs dos arquivos foram confirmados) — a extensão do navegador não deu conta de arquivos desse tamanho nesta sessão.
- [ ] Não foi inventariada a pasta de imagens (sólidos/soluções/líquidos).
- [ ] Não foi resolvido onde hospedar as imagens publicamente para a importação.
- [ ] Não foi confirmado o formato exato esperado pela Tray para "Prazo de disponibilidade" (6 dias úteis).
- [ ] Não foi confirmado se a dimensão/peso fixos (9,3×9,3×22cm, 1kg) valem para todos os produtos ou variam.
- [ ] Nenhuma descrição/SEO foi gerada ainda — é o grosso do trabalho que falta.

## Próximos passos sugeridos

1. Baixar localmente os 3 arquivos-fonte (lista de preços, categorias CSV, template) — mais confiável que puxar via navegador.
2. Ler e validar a lista da Exodo: conferir colunas disponíveis (nome, código/referência, NCM, categoria, preço), conferir se bate com os 2.599 produtos esperados.
3. Cruzar categoria de cada produto com o `categorias_1559048_...csv` (ID da Tray) — não inventar categoria nova.
4. Calcular preço de venda = preço de custo × 1,45.
5. Gerar descrição HTML + SEO (título, meta description) única por produto — via script, em lote, usando os atributos reais de cada item (nome, categoria, uso típico) — não manualmente um por um.
6. Resolver hospedagem de imagem (fora do Drive) antes de preencher a coluna de imagem.
7. Confirmar com o Plinio: formato do "Prazo de disponibilidade", se dimensão/peso é igual para todos, e o esquema de fotos por tipo (sólido/solução/líquido) vs. foto por produto.
8. Montar o arquivo final batendo exatamente com as 23 colunas do template, validar linha a linha, e só então importar na Tray.
