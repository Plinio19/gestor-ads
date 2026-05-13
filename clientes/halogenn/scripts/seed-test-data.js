require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { getAuthClient } = require('../../../lib/auth-client');

async function seedTestData() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const id = process.env.SHEETS_ID;

  console.log('Inserindo dados de teste realistas...\n');

  const data = [
    // RESUMO
    {
      range: 'Resumo!A1',
      values: [
        ['Métrica', 'Última Semana', 'Último Mês', 'Total Histórico', 'Atualizado em'],
        ['Custo Total', 487.32, 1843.90, 1843.90, '17/04/2026'],
        ['Cliques', 143, 521, 521, '17/04/2026'],
        ['Impressões', 4820, 18340, 18340, '17/04/2026'],
        ['CTR', 2.97, 2.84, 2.84, '17/04/2026'],
        ['CPC Médio', 3.41, 3.54, 3.54, '17/04/2026'],
        ['Conversões', 8, 29, 29, '17/04/2026'],
        ['Custo por Conversão', 60.92, 63.58, 63.58, '17/04/2026'],
      ],
    },

    // SEMANAL
    {
      range: 'Semanal!A1',
      values: [
        ['Semana', 'Campanhas Ativas', 'Impressões', 'Cliques', 'CTR', 'CPC Médio', 'Custo (R$)', 'Conversões', 'Custo/Conv (R$)'],
        ['2026-03-23', 3, 3820, 98, 2.57, 3.89, 381.22, 6, 63.54],
        ['2026-03-30', 3, 4210, 112, 2.66, 3.72, 416.64, 7, 59.52],
        ['2026-04-06', 4, 4650, 131, 2.82, 3.58, 469.00, 8, 58.63],
        ['2026-04-14', 4, 4820, 143, 2.97, 3.41, 487.32, 8, 60.92],
      ],
    },

    // MENSAL
    {
      range: 'Mensal!A1',
      values: [
        ['Mês', 'Campanhas Ativas', 'Impressões', 'Cliques', 'CTR', 'CPC Médio', 'Custo (R$)', 'Conversões', 'Custo/Conv (R$)', 'Observações'],
        ['2026-03', 3, 14280, 381, 2.67, 3.73, 1421.13, 22, 64.60, 'Primeiro mês — resultado acima do esperado'],
        ['2026-04', 4, 18340, 521, 2.84, 3.54, 1843.90, 29, 63.58, 'Expansão para 4 campanhas — CPC caindo bem'],
      ],
    },

    // CAMPANHAS
    {
      range: 'Campanhas!A1',
      values: [
        ['Data', 'Campanha', 'Status', 'Tipo', 'Orçamento Diário', 'Impressões', 'Cliques', 'CTR', 'CPC Médio', 'Custo (R$)', 'Conversões', 'Custo/Conv'],
        ['2026-04-17', '[Busca] - Alcool Etilico PA', 'ATIVA', 'Search', 25.00, 6420, 198, 3.08, 3.12, 617.76, 11, 56.16],
        ['2026-04-17', '[Busca] - Acetona PA', 'ATIVA', 'Search', 20.00, 4830, 141, 2.92, 3.38, 476.58, 8, 59.57],
        ['2026-04-17', '[Busca] - Xileno PA', 'ATIVA', 'Search', 18.00, 4210, 112, 2.66, 3.71, 415.52, 6, 69.25],
        ['2026-04-17', '[Busca] - Formaldeido PA', 'ATIVA', 'Search', 15.00, 2880, 70, 2.43, 4.78, 334.60, 4, 83.65],
      ],
    },

    // KEYWORDS
    {
      range: 'Keywords!A1',
      values: [
        ['Data', 'Campanha', 'Grupo', 'Palavra-chave', 'Match Type', 'Status', 'Quality Score', 'Impressões', 'Cliques', 'CTR', 'CPC Médio'],
        ['2026-04-17', '[Busca] - Alcool Etilico PA', 'Álcool Analítico', 'álcool etílico PA', 'Phrase', 'ATIVA', 8, 2840, 91, 3.20, 2.98],
        ['2026-04-17', '[Busca] - Alcool Etilico PA', 'Álcool Analítico', 'álcool etílico PA-ACS', 'Exact', 'ATIVA', 9, 1980, 72, 3.64, 2.81],
        ['2026-04-17', '[Busca] - Alcool Etilico PA', 'Álcool Analítico', 'álcool etílico grau analítico', 'Phrase', 'ATIVA', 7, 1600, 35, 2.19, 3.62],
        ['2026-04-17', '[Busca] - Acetona PA', 'Acetona Analítica', 'acetona PA laboratório', 'Phrase', 'ATIVA', 8, 2210, 68, 3.08, 3.21],
        ['2026-04-17', '[Busca] - Acetona PA', 'Acetona Analítica', 'acetona grau analítico', 'Exact', 'ATIVA', 7, 1420, 42, 2.96, 3.54],
        ['2026-04-17', '[Busca] - Xileno PA', 'Xileno Analítico', 'xileno PA laboratório', 'Phrase', 'ATIVA', 7, 1980, 54, 2.73, 3.69],
        ['2026-04-17', '[Busca] - Formaldeido PA', 'Formaldeído', 'formaldeído PA anatomia', 'Phrase', 'ATIVA', 6, 1420, 38, 2.68, 4.61],
        ['2026-04-17', '[Busca] - Formaldeido PA', 'Formaldeído', 'formol PA laboratório', 'Phrase', 'PAUSADA', 5, 890, 18, 2.02, 5.12],
      ],
    },

    // ALERTAS
    {
      range: 'Alertas!A1',
      values: [
        ['Data/Hora', 'Tipo', 'Campanha', 'Descrição', 'Valor', 'Limite', 'Ação Tomada'],
        ['2026-04-17 09:15', 'AVISO', '[Busca] - Formaldeido PA', 'CPC médio acima do limite', 4.78, 4.00, 'Monitorando — aguardar mais dados'],
        ['2026-04-16 14:30', 'ALERTA', '[Busca] - Formaldeido PA', 'Keyword "formol PA laboratório" com QS baixo (5)', 5, 6, 'Keyword pausada'],
        ['2026-04-15 10:00', 'INFO', 'Todas', 'Relatório semanal gerado com sucesso', 0, 0, 'Enviado para planilha'],
        ['2026-04-14 08:45', 'INFO', '[Busca] - Alcool Etilico PA', 'CTR acima de 3% — campanha performando bem', 3.20, 2.00, 'Nenhuma — manter configuração'],
      ],
    },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: id,
    requestBody: { valueInputOption: 'RAW', data },
  });

  console.log('✅ Dados de teste inseridos com sucesso!');
  console.log('\nResumo dos dados inseridos:');
  console.log('  - Resumo: 7 métricas');
  console.log('  - Semanal: 4 semanas (mar/abr 2026)');
  console.log('  - Mensal: 2 meses (mar e abr 2026)');
  console.log('  - Campanhas: 4 campanhas ativas');
  console.log('  - Keywords: 8 palavras-chave');
  console.log('  - Alertas: 4 registros');
  console.log('\nAbra o Looker Studio e atualize a página para ver os dados.');
}

seedTestData().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
