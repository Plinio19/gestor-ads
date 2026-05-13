# Skill: negative-keywords

## Objetivo
Gerenciar lista de palavras-chave negativas para evitar cliques irrelevantes na Linklab.

## Lista negativa obrigatória — aplicar em TODAS as campanhas

### Manutenção e reparo (não vendemos serviço)
- manutenção
- reparo
- conserto
- assistência técnica
- calibração
- revisão
- peças de reposição

### Aluguel e locação
- aluguel
- alugar
- locação
- locar

### Produto usado
- usado
- seminovo
- segunda mão
- recondicionado

### Uso doméstico / pessoal
- para casa
- uso doméstico
- uso pessoal
- receita caseira
- doméstico

### Volume industrial (sem contexto lab)
- tonelada
- container
- granel
- 1000 litros
- 5000 litros
- big bag
- industrial (adicionar com cuidado — verificar se não bloqueia "laboratório industrial")

### Reagentes sem contexto lab
- álcool combustível
- álcool etanol combustível
- solvente industrial
- produto químico granel

### Concorrentes (não pagar por marca alheia)
- êxodo científica
- exodo cientifica
- neon comercial
- netlab
- interlab
- splabor
- kasvi
- prolab

### Irrelevante
- download
- curso
- apostila
- tutorial
- fórmula caseira
- receita
- importado direto
- china

### Médico/hospitalar pesado (fora do portfólio)
- monitor cardíaco
- desfibrilador
- equipamento cirúrgico
- UTI

## Processo de adição de negativos
1. Identificar termo via `mine-search-terms`
2. Confirmar com `search-term-methodology`
3. Decidir nível: campanha ou grupo de anúncios
4. **Sempre pedir aprovação antes de aplicar**
5. Registrar no log de mudanças

## Atenção — negativos que podem bloquear tráfego bom
- "industrial" — pode bloquear "laboratório industrial de controle de qualidade"
  → Adicionar como frase negativa "uso industrial" ou "solvente industrial" em vez de só "industrial"
- "doméstico" — pode bloquear "laboratório doméstico de pesquisa"
  → Adicionar como frase "uso doméstico"

## Revisão
- Semanal: checar novos termos irrelevantes nos relatórios de busca
- Mensal: revisar lista completa e remover negativos que possam estar bloqueando tráfego bom
