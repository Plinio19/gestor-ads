# Skill: search-term-methodology

## Objetivo
Avaliar cada termo de busca e decidir: ADICIONAR, NEGATIVAR ou MONITORAR.

## Regras de Avaliação

### ✅ ADICIONAR como palavra-chave positiva se:
- Menciona laboratório: "laboratório", "lab", "laboratorial"
- Indica uso profissional: "controle de qualidade", "análise", "clínica", "veterinário"
- Para reagentes: contém grau analítico (PA, PA-ACS, analítico)
- Indica intenção de compra: "comprar", "preço", "onde comprar", "online"
- É produto específico do portfólio Linklab
- Tem CTR > 3% e pelo menos 1 conversão

### ❌ NEGATIVAR imediatamente se:
- Manutenção/reparo: "conserto", "manutenção", "assistência técnica", "calibração", "reparo"
- Aluguel: "aluguel", "locação", "alugar"
- Produto usado: "usado", "seminovo", "segunda mão"
- Volume industrial sem contexto lab: "tonelada", "container", "granel"
- Uso doméstico: "para casa", "uso doméstico", "uso pessoal"
- Equipamento hospitalar pesado fora do portfólio: "monitor cardíaco", "desfibrilador"
- Concorrente específico: "Êxodo", "Neon Comercial", "Netlab", "Interlab"
- Reagente sem contexto lab: "álcool combustível", "solvente industrial a granel"

### ⚠️ MONITORAR (aguardar mais dados) se:
- Produto do portfólio mas sem contexto laboratorial claro
- Menos de 30 cliques ainda (dados insuficientes)
- CTR muito baixo (< 1%) mas sem conversões negativas claras
- Termo de nicho não mapeado ainda (ex: "reagente para cosmético")

## Exemplos práticos para Linklab

| Termo de busca | Decisão | Razão |
|---|---|---|
| "estufa laboratorial comprar" | ✅ ADICIONAR | Produto + intenção de compra |
| "conserto de estufa laboratorial" | ❌ NEGATIVAR | Manutenção — não vendemos serviço |
| "béquer laboratório" | ✅ ADICIONAR | Produto do portfólio + contexto lab |
| "álcool etílico PA laboratório" | ✅ ADICIONAR | Reagente PA + contexto lab |
| "álcool para uso doméstico" | ❌ NEGATIVAR | Uso doméstico sem contexto lab |
| "centrífuga seminova" | ❌ NEGATIVAR | Produto usado |
| "aluguel de centrífuga" | ❌ NEGATIVAR | Aluguel — não é nosso modelo |
| "produtos para laboratório" | ✅ ADICIONAR | Portfólio completo — alinhado |
| "reagente para cosméticos" | ⚠️ MONITORAR | Nicho não mapeado — pode ser relevante |
| "estufa" (sem "laboratório") | ⚠️ MONITORAR | Ambíguo — pode ser estufa de cozinha |
