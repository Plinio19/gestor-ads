# Guia — Conectar Looker Studio à Planilha de Relatórios

## Acesse
https://lookerstudio.google.com

## Passo a passo (5 minutos)

### 1. Criar novo relatório
- Clique em **"+"** → **Relatório em branco**

### 2. Adicionar fonte de dados — Google Sheets
- Clique em **"Adicionar dados"**
- Selecione **Google Sheets**
- Escolha a planilha: **"Relatórios Halogenn Ads"**
- ID da planilha: `19EZHTT04fFQIMhY7GTCwEzV01FB_3sijqJhQcB4eY9w`
- Selecione a aba desejada (Semanal, Mensal, Campanhas)
- Clique em **"Adicionar"**

### 3. Adicionar fonte de dados — Google Ads (opcional)
- Clique em **"Adicionar dados"** novamente
- Selecione **Google Ads**
- Conta: **7877031919**
- Isso permite cruzar dados em tempo real

### 4. Adicionar fonte de dados — Google Analytics 4
- Clique em **"Adicionar dados"**
- Selecione **Google Analytics**
- Propriedade: **Halogenn Quimica Cientifica (442689165)**

### 5. Gráficos sugeridos para montar
| Gráfico | Fonte | Métricas |
|---|---|---|
| Série temporal | Sheets/Semanal | Custo, Cliques, Conversões por semana |
| Tabela | Sheets/Campanhas | Performance por campanha |
| Scorecard | Sheets/Resumo | Total gasto, Total conversões, CPC médio |
| Pizza | GA4 | Sessões por canal (Organic vs Paid) |
| Tabela | Sheets/Keywords | Top keywords por clique |
| Tabela | Sheets/Alertas | Alertas ativos |

### 6. Compartilhar
- Clique em **"Compartilhar"** → cole o e-mail do cliente
- Deixe como **"Pode visualizar"**

## URL da planilha
https://docs.google.com/spreadsheets/d/19EZHTT04fFQIMhY7GTCwEzV01FB_3sijqJhQcB4eY9w
