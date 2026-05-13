# Skill: search-term-methodology

## Objetivo
Avaliar cada termo de busca e decidir: ADICIONAR, NEGATIVAR ou MONITORAR.

## Regras de Avaliação

### ✅ ADICIONAR como palavra-chave positiva se:
- Contém grau analítico: "PA", "PA-ACS", "PA-CS", "HPLC", "grau analítico"
- Menciona laboratório: "laboratório", "lab", "laboratorial"
- Indica uso profissional: "controle de qualidade", "análise", "analítico"
- Menciona certificado/laudo: "certificado", "laudo", "certificação"
- É um produto específico da Halogenn com grau correto
- Tem CTR > 3% e pelo menos 1 conversão

### ❌ NEGATIVAR imediatamente se:
- Contém "industrial" sem especificação de grau analítico
- Contém "barato", "preço baixo", "mais barato", "economico"
- Contém "granel", "tonelada", "container"
- Contém "atacado" sem contexto laboratorial
- É busca por pessoa física: "uso doméstico", "para casa", "pequena quantidade"
- Produto completamente fora do portfólio
- Concorrente específico: "Êxodo", "Neon Comercial", "ACS Científica" (não queremos pagar por busca de marca concorrente)
- Contém "importado", "China", "exterior"
- Volume excessivo: "1000 litros", "5000kg", "container"

### ⚠️ MONITORAR (aguardar mais dados) se:
- Termo ambíguo sem grau especificado mas com contexto laboratorial
- Menos de 30 cliques ainda (dados insuficientes)
- CTR muito baixo (< 1%) mas sem conversões negativas claras
- Produto do portfólio sem grau especificado

## Exemplos práticos

| Termo de busca | Decisão | Razão |
|---|---|---|
| "álcool etílico PA laboratório" | ✅ ADICIONAR | Grau PA + contexto lab |
| "álcool etílico barato" | ❌ NEGATIVAR | Indica comprador de preço, não qualidade |
| "acetona industrial 200 litros" | ❌ NEGATIVAR | Grau industrial, volume alto |
| "reagente para análise de água" | ✅ ADICIONAR | Contexto laboratorial claro |
| "comprar acetona" | ⚠️ MONITORAR | Ambíguo, aguardar mais dados |
| "xileno grau analítico SP" | ✅ ADICIONAR | Grau analítico + localização |
| "formaldeído pa controle qualidade" | ✅ ADICIONAR | PA + uso profissional |
| "álcool 99 tonelada" | ❌ NEGATIVAR | Volume industrial |
