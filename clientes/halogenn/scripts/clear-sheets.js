require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { getAuthClient } = require('../../../lib/auth-client');

async function clearSheets() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const id = process.env.SHEETS_ID;

  const ranges = [
    'Resumo!A2:Z1000',
    'Semanal!A2:Z1000',
    'Mensal!A2:Z1000',
    'Campanhas!A2:Z1000',
    'Keywords!A2:Z1000',
    'Alertas!A2:Z1000',
  ];

  await sheets.spreadsheets.values.batchClear({
    spreadsheetId: id,
    requestBody: { ranges },
  });

  console.log('Dados de teste removidos. Cabeçalhos mantidos.');
}

clearSheets().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
