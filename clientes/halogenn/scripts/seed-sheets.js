require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { getAuthClient } = require('../../../lib/auth-client');

async function seedSheets() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const id = process.env.SHEETS_ID;

  const data = [
    {
      range: 'Semanal!A2',
      values: [['2026-04-14', 0, 0, 0, '0%', 'R$ 0,00', 'R$ 0,00', 0, 'R$ 0,00']],
    },
    {
      range: 'Mensal!A2',
      values: [['2026-04', 0, 0, 0, '0%', 'R$ 0,00', 'R$ 0,00', 0, 'R$ 0,00', 'Aguardando início das campanhas']],
    },
    {
      range: 'Campanhas!A2',
      values: [['2026-04-17', 'Aguardando campanhas', 'PAUSADA', 'Search', 'R$ 0,00', 0, 0, '0%', 'R$ 0,00', 'R$ 0,00', 0, 'R$ 0,00']],
    },
    {
      range: 'Keywords!A2',
      values: [['2026-04-17', 'Aguardando campanhas', '-', '-', '-', '-', '-', 0, 0, '0%', 'R$ 0,00']],
    },
    {
      range: 'Alertas!A2',
      values: [['2026-04-17 00:00', 'INFO', '-', 'Aguardando início das campanhas', '-', '-', '-']],
    },
    {
      range: 'Resumo!A2',
      values: [
        ['Custo Total', 'R$ 0,00', 'R$ 0,00', 'R$ 0,00', '2026-04-17'],
        ['Cliques', '0', '0', '0', '2026-04-17'],
        ['Conversões', '0', '0', '0', '2026-04-17'],
        ['CTR', '0%', '0%', '0%', '2026-04-17'],
        ['CPC Médio', 'R$ 0,00', 'R$ 0,00', 'R$ 0,00', '2026-04-17'],
      ],
    },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: id,
    requestBody: { valueInputOption: 'RAW', data },
  });

  console.log('Dados de exemplo inseridos em todas as abas.');
  console.log('Agora o Looker Studio consegue reconhecer os campos.');
}

seedSheets().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
