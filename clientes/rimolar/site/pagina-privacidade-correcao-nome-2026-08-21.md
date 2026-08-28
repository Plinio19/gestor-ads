# Correção de nome — Política de Privacidade

Página `/privacidade` usa "RIMOLAR Produtos Químicos" em 2 pontos, inconsistente com "Rimolar Química" usado no resto do site. Localizar e trocar no editor de HTML da Tray (Painel Tray → Configurações → Páginas → Política de Privacidade):

## Ocorrência 1 — abertura da política

Antes:
```html
<p style="font-size:14px;color:#444444;line-height:1.8;margin:0 0 12px 0;">A <strong style="color:#222222;">RIMOLAR Produtos Químicos</strong> respeita a privacidade de todos os seus clientes, parceiros e visitantes. Esta Política descreve como coletamos, utilizamos, armazenamos e protegemos seus dados pessoais ao acessar nosso site ou realizar compras.</p>
```

Depois:
```html
<p style="font-size:14px;color:#444444;line-height:1.8;margin:0 0 12px 0;">A <strong style="color:#222222;">Rimolar Química</strong> respeita a privacidade de todos os seus clientes, parceiros e visitantes. Esta Política descreve como coletamos, utilizamos, armazenamos e protegemos seus dados pessoais ao acessar nosso site ou realizar compras.</p>
```

## Ocorrência 2 — bloco "Empresa" no rodapé de contato da política

Antes:
```html
<div style="font-size:14px;font-weight:600;color:#ffffff;">RIMOLAR Produtos Químicos</div>
```

Depois:
```html
<div style="font-size:14px;font-weight:600;color:#ffffff;">Rimolar Química</div>
```

Apenas o texto muda — `style` e estrutura ao redor permanecem idênticos. Não há outras ocorrências no restante da página (razão social/CNPJ da Expresslab, endereço, etc. já estão corretos e consistentes).

## Atualização 28/08 — revisão completa

Nota: em 28/08, o gestor pediu pra deixar essa política igual à da Loja Netlab (https://www.lojanetlab.com.br/politicadeprivacidade) em estrutura/nível de detalhe — ver `pagina-privacidade-completa-2026-08-28.html`, que já inclui essa correção de nome dentro do texto completo reescrito (18 seções de Política de Privacidade + 17 de Política de Cookies). Esse arquivo find-and-replace pontual fica como registro histórico, mas o arquivo completo substitui a necessidade dele caso o gestor opte por trocar a página inteira.
