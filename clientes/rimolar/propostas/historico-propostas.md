# Histórico de Propostas/Cotações — Rimolar Química

> Pasta recriada em 28/08/2026 após perda de arquivos não commitados (provável `git clean`/`reset` rodado em outra parte do repositório, atingindo tudo que não estava versionado em `clientes/rimolar/`). Reconstruída a partir do histórico desta conversa. **A partir de agora, commitar no git.** Um arquivo não pôde ser recuperado: `Proposta-COT-2026-08-04-002-Ana-Furtado.pdf` (original com logo, feito em outra sessão — nunca tive o conteúdo bruto).

## 2026-08-26 — COT-2026-08-26-001 — JR Hidroquímica (contato Geni Marin)

**Cliente:** CNPJ 85.314.086/0001-80 (isento de IE), contato Geni Marin, (48) 99115-1443, laboratorio@jrhidroquimica.com.br. Nome da empresa não veio no formulário — gestor perguntou "não puxou pelo CNPJ?" e consultei a BrasilAPI (base pública da Receita Federal, `brasilapi.com.br/api/cnpj/v1/{cnpj}`): razão social real é **WV Hidroanálise LTDA** (nome fantasia "JR Hidroquímica", que é o que aparecia no e-mail do cliente) — e trouxe o endereço completo também: Rua Santa Luzia, 75, Trindade, Florianópolis/SC, CEP 88036-540 (situação ATIVA, Simples Nacional). Corrigi o PDF com os dados reais em vez da inferência anterior.

**Item:** Spectroquant DQO (25-1500mg/L COD) 25 testes Merck, código 1145410001 — R$601,40/emb. **Cliente confirmou 2 unidades** = R$1.202,80. Frete "a combinar" (endereço já completo, só falta calcular a tarifa da transportadora).

**Nota pra próximas cotações:** sempre que vier CNPJ, consultar a BrasilAPI primeiro em vez de inferir dados por e-mail/domínio — é mais confiável e traz endereço completo de graça.

**PDF:** `clientes/rimolar/propostas/Proposta-COT-2026-08-26-001-JRHidroquimica.pdf`
**Script:** `clientes/rimolar/propostas/gerar-proposta-jrhidroquimica-2026-08-26.js`

## 2026-08-20 — COT-2026-08-20-003 — Fundação Octacílio Gualberto (UNIFASE-RJ)

**Cliente:** Fundação Octacílio Gualberto, CNPJ 34.034.959/0001-60 (isento de IE), Av. Barão do Rio Branco 1003, Centro, CEP 25680-120 — contato compras.luis@unifase-rj.edu.br, (24) 98828-0021.

**Item:** Cloreto de Potássio Sol. 3M Eletrolítica 250ml — R$11,96 (unidade) + R$36,27 (frete) = **R$48,23**. Quantidade não informada pelo cliente — cotei 1 unidade por padrão, sinalizado nas observações do PDF.

**PDF:** `clientes/rimolar/propostas/Proposta-COT-2026-08-20-003-Octacilio.pdf`
**Script:** `clientes/rimolar/propostas/gerar-proposta-octacilio-2026-08-20.js`

## 2026-08-20 — COT-2026-08-20-002 — Fundação Faculdade de Medicina (FMUSP, LIM 44)

**Cliente:** e-mail pedindo orçamento de **50L** de Paraformaldeído 4% Tamponado. Faturamento: Fundação Faculdade de Medicina, CNPJ 56.577.059/0001-00, IE 112.495.960.114, Av. Reboucas 381, São Paulo/SP — isenta de ICMS (Art. 153, Anexo I, Decreto 45.490/00, Convênio 120/2011). Entrega: LIM 44, Av. Dr. Enéas Carvalho de Aguiar 250, sala 4113/4º andar FMUSP, só seg-qui 13h-17h, combinar data antes.

**Decisão do gestor (confirmada explicitamente após eu perguntar, via pergunta direta):** cotar **100L a R$35,00/L** (R$3.500,00), não os 50L pedidos pelo cliente — volume/preço veio como instrução direta do gestor, não do e-mail do cliente (a linha "FAZER 100L A 35 REAIS" destoava do resto do e-mail colado, então confirmei antes de gerar).

**Pendências no PDF:** código do produto no catálogo Rimolar não confirmado (marcado "A CONFIRMAR"); valor exato do ICMS isento a confirmar com contabilidade antes de emitir a NF de verdade.

**PDF:** `clientes/rimolar/propostas/Proposta-COT-2026-08-20-002-FMUSP.pdf`
**Script:** `clientes/rimolar/propostas/gerar-proposta-fmusp-2026-08-20.js`

## 2026-08-20 — COT-2026-08-20-001 — Prof. Emanuel Maltempi de Souza (UFPR/UFMS, verba CNPq)

**Cliente:** pedido urgente vindo por e-mail, com print do carrinho da loja anexo (Eritritol Purex 25g, Ref. E04683RA, marca Êxodo, R$233,07). Faturamento e entrega em endereços diferentes:
- **NF em nome de:** Emanuel Maltempi de Souza, CPF 536.438.109-97, endereço UFPR (Curitiba/PR) — NF deve citar Processo CNPq nº 408680/2024-5 e instituição destinatária UFMS.
- **Entrega:** Laboratório de Microbiologia/Genética, CPAN/UFMS, Corumbá/MS (mesmo endereço que já aparecia no print do carrinho, CEP 79304-902).
- **Pagamento:** direto pelo professor, boleto (15 dias) ou depósito, preferencialmente Banco do Brasil.

**Total:** R$233,07 (produto) + R$32,16 (frete Correios PAC, 12-14 dias) = **R$265,23**. Cliente sinalizou urgência — sinalizei no PDF a opção SEDEX (9-10 dias, R$57,93) como alternativa mais rápida, mas não decidi por conta própria; fica para o gestor/cliente confirmar.

**PDF:** `clientes/rimolar/propostas/Proposta-COT-2026-08-20-001-UFMS.pdf`
**Script:** `clientes/rimolar/propostas/gerar-proposta-ufms-2026-08-20.js`

## 2026-08-07 — COT-2026-08-07-001 — 2A2 Comércio e Serviços Ltda.

**Cliente:** 2A2 Comércio e Serviços Ltda. — CNPJ `03.176.698/000-99` (⚠️ formato incompleto, só 12 dígitos, falta 1 dígito — confirmar com o cliente antes de enviar/faturar) — contato Donilio Cal, (71) 3033-3520 / WhatsApp (71) 99310-2081.

**Item:** Formol a 10%, embalagem 1000ml com identificação do produto, marca do fabricante e prazo de validade — 120 unidades a R$12,00/L.
**Total:** R$1.440,00
**Condições:** pagamento e frete "a combinar" (não informados pelo cliente)

**PDF:** `clientes/rimolar/propostas/Proposta-COT-2026-08-07-001-2A2.pdf`
**Script:** `clientes/rimolar/propostas/gerar-proposta-2a2-2026-08-07.js`

**Pendências:** logo da Rimolar perdida na exclusão da pasta (proposta saiu só com texto) — pedir reenvio se quiser voltar a incluir.

## 2026-08-07 — COT-2026-08-04-002-R1 — Ana Lucia Furtado da Costa (revisão)

**Origem:** gestor salvou manualmente `Proposta-COT-2026-08-04-002-Ana-Furtado.pdf` na pasta (feita em outro chat/sessão, 04/08/2026, com logo — arquivo usado como padrão de layout de referência). Cliente: Ana Lucia Furtado da Costa, CPF 296.052.453-53, Caucaia/CE.

**Revisão pedida:** ajustar para 2 unidades do produto (Arginina-L 98% PA — 100g, código A07855RA) e adicionar frete de R$40,00.

**Cotação revisada:** COT-2026-08-04-002-R1 — 2 × R$57,50 = R$115,00 (subtotal) + R$40,00 (frete) = **TOTAL: R$155,00**. Pagamento Pix ou Boleto, prazo de envio até 6 dias úteis (mantidos da original).

**PDF:** `clientes/rimolar/propostas/Proposta-COT-2026-08-04-002-R1-Ana-Furtado.pdf`
**Script:** `clientes/rimolar/propostas/gerar-proposta-anafurtado-rev1-2026-08-07.js`

**Padrão confirmado:** layout do arquivo original (Solicitante/Destinatário, tabela de item, condições comerciais, observações, rodapé de contato) segue como modelo padrão — já é essencialmente o mesmo template usado nas cotações anteriores. Logo ainda pendente de reenvio (script atual gera só com texto).
