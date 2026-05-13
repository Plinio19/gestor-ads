# Regras de Prospecção — NETLAB

## Contexto
Extraímos dados de notas fiscais de clientes da NETLAB para montar listas de prospecção.
**Nosso negócio:** Venda de produtos químicos.

**Escala total estimada:** ~60.000 NFs para processar
**Arquivos ignorados:** `*procEventoNFe.pdf` (cartas de correção e eventos) — focar apenas em `*-nfe.pdf`
**Pasta de origem:** `prospecção/notas_brutas/`

---

## Prioridade de Classificação

### 🔴 PRIORIDADE ALTA — Recorrentes com Produtos Químicos
Clientes que compraram produtos químicos em **2 ou mais meses diferentes**.
São o alvo principal: já consomem, já têm frequência, alto potencial de carteira recorrente.

### 🟠 PRIORIDADE ALTA-B — Compradores Únicos de Químicos

Clientes que compraram produtos químicos **apenas uma vez**.
Potencial de reativação — podem ter migrado para concorrente.

### 🟡 PRIORIDADE MÉDIA — Recorrentes sem Químicos

Clientes de setores que consomem químicos (indústrias, laboratórios, construtoras, clínicas, oficinas, etc.) que aparecem em **2 ou mais meses** mas não compraram químicos nessas notas.
Oportunidade de introduzir nosso portfólio.

### 🟢 PRIORIDADE BAIXA — Demais Clientes
Clientes sem conexão aparente com consumo de produtos químicos e sem recorrência.

---

## Identificação de Recorrência

Para cada cliente (identificado pelo CNPJ), verificar em quantos meses distintos aparecem nas notas:

| Aparições | Classificação |
|---|---|
| 1 mês | Comprador pontual |
| 2 a 3 meses | Recorrente em desenvolvimento |
| 4+ meses | Recorrente consolidado ⭐ |

Campos adicionais a registrar:

- **Meses que comprou:** ex: `Jun/22, Jul/22, Set/22`
- **Frequência:** Pontual / Recorrente em desenvolvimento / Recorrente consolidado
- **Ticket médio:** Média do valor total das notas do cliente

---

## Campos a Extrair de Cada Nota Fiscal

| Campo | Descrição |
|---|---|
| **Nome / Razão Social** | Nome completo do cliente (PF ou PJ) |
| **CNPJ / CPF** | Documento do cliente |
| **Endereço** | Rua, número, bairro, cidade, estado |
| **Telefone / Celular** | Se disponível na nota |
| **E-mail** | Se disponível na nota |
| **Item(ns) Comprado(s)** | Descrição do produto |
| **Quantidade** | Quantidade de cada item |
| **Preço Unitário** | Valor unitário |
| **Valor Total** | Valor total da nota |
| **Data da Nota** | Data de emissão |
| **Setor / Ramo** | Identificar o setor de atuação do cliente (quando possível) |
| **Prioridade** | ALTA / MÉDIA / BAIXA (conforme critério acima) |
| **Observações** | Qualquer info relevante para abordagem comercial |

---

## Ritmo de Trabalho

- **10 clientes por lote** (ritmo de prospecção diária)
- Cada lote gera um arquivo separado: `lote-01.md`, `lote-02.md`, etc.
- Numeração contínua — nunca reiniciar do zero
- Registrar sempre qual foi a última NF processada para retomar sem perder o ponto
- Ao final de cada lote, compilar em PDF para abordagem comercial
- Clientes DUPLICADOS (mesmo CNPJ em notas diferentes) → manter apenas a entrada mais recente

## Controle de Progresso

- Arquivo `prospecção/progresso.md` registra:
  - Último lote gerado
  - Última NF processada (nome do arquivo)
  - Total de clientes extraídos até o momento
  - Total de clientes ALTA / MÉDIA / BAIXA acumulados

---

## Estrutura de Pastas

```
prospecção/
├── regras-prospecção.md        ← este arquivo
├── lotes/
│   ├── lote-01.md              ← 10 clientes
│   ├── lote-02.md
│   └── ...
└── pdfs/
    └── (PDFs gerados para abordagem)
```

---

## Formato de Saída por Cliente

```
---
### Cliente #N — [PRIORIDADE: ALTA / MÉDIA / BAIXA]

- **Nome:** 
- **CNPJ/CPF:** 
- **Endereço:** 
- **Telefone:** 
- **E-mail:** 
- **Setor:** 
- **O que comprou:** 
- **Quantidade:** 
- **Valor total:** 
- **Data da nota:** 
- **Observações para prospecção:** 
---
```

---

## Abordagem Comercial Sugerida (por prioridade)

**ALTA:** Cliente já consome químicos → oferecer produtos equivalentes ou complementares com vantagem competitiva (preço, entrega, qualidade).

**MÉDIA:** Cliente do setor industrial/técnico → apresentar portfólio focado na dor do segmento.

**BAIXA:** Avaliar caso a caso se há oportunidade de cross-sell.
