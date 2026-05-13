require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { getAuthClient } = require('../../../lib/auth-client');
const fs = require('fs');

const SPREADSHEET_NAME = 'Relatórios Halogenn Ads';

async function setupSheets() {
  console.log('\n=== Criando Planilha: ' + SPREADSHEET_NAME + ' ===\n');

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  // Criar a planilha com todas as abas necessárias
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: SPREADSHEET_NAME },
      sheets: [
        { properties: { title: 'Resumo', sheetId: 0, index: 0 } },
        { properties: { title: 'Semanal', sheetId: 1, index: 1 } },
        { properties: { title: 'Mensal', sheetId: 2, index: 2 } },
        { properties: { title: 'Campanhas', sheetId: 3, index: 3 } },
        { properties: { title: 'Keywords', sheetId: 4, index: 4 } },
        { properties: { title: 'Alertas', sheetId: 5, index: 5 } },
      ],
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId;
  const spreadsheetUrl = spreadsheet.data.spreadsheetUrl;

  console.log(`Planilha criada com sucesso!`);
  console.log(`ID: ${spreadsheetId}`);
  console.log(`URL: ${spreadsheetUrl}\n`);

  // Cabeçalhos de cada aba
  const headers = {
    Resumo: [['Métrica', 'Última Semana', 'Último Mês', 'Total Histórico', 'Atualizado em']],
    Semanal: [['Semana', 'Campanhas Ativas', 'Impressões', 'Cliques', 'CTR', 'CPC Médio', 'Custo (R$)', 'Conversões', 'Custo/Conv (R$)']],
    Mensal: [['Mês', 'Campanhas Ativas', 'Impressões', 'Cliques', 'CTR', 'CPC Médio', 'Custo (R$)', 'Conversões', 'Custo/Conv (R$)', 'Observações']],
    Campanhas: [['Data', 'Campanha', 'Status', 'Tipo', 'Orçamento Diário (R$)', 'Impressões', 'Cliques', 'CTR', 'CPC Médio (R$)', 'Custo (R$)', 'Conversões', 'Custo/Conv (R$)']],
    Keywords: [['Data', 'Campanha', 'Grupo', 'Palavra-chave', 'Match Type', 'Status', 'Quality Score', 'Impressões', 'Cliques', 'CTR', 'CPC Médio (R$)']],
    Alertas: [['Data/Hora', 'Tipo', 'Campanha', 'Descrição', 'Valor', 'Limite', 'Ação Tomada']],
  };

  const batchData = [];
  for (const [sheet, rows] of Object.entries(headers)) {
    batchData.push({ range: `${sheet}!A1`, values: rows });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'RAW', data: batchData },
  });

  // Formatar cabeçalhos (negrito + fundo escuro)
  const sheetIds = { Resumo: 0, Semanal: 1, Mensal: 2, Campanhas: 3, Keywords: 4, Alertas: 5 };
  const formatRequests = Object.entries(sheetIds).map(([, id]) => ({
    repeatCell: {
      range: { sheetId: id, startRowIndex: 0, endRowIndex: 1 },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.13, green: 0.13, blue: 0.13 },
          textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 10 },
          horizontalAlignment: 'CENTER',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
    },
  }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: formatRequests },
  });

  console.log('Abas criadas: Resumo, Semanal, Mensal, Campanhas, Keywords, Alertas');
  console.log('Cabeçalhos configurados.\n');

  // Salvar o ID no .env
  const envContent = fs.readFileSync(require('path').resolve(__dirname, '../.env'), 'utf-8');
  if (!envContent.includes('SHEETS_ID=')) {
    fs.appendFileSync(require('path').resolve(__dirname, '../.env'), `\nSHEETS_ID=${spreadsheetId}\n`);
    console.log(`SHEETS_ID salvo no .env: ${spreadsheetId}`);
  } else {
    const updated = envContent.replace(/SHEETS_ID=.*/, `SHEETS_ID=${spreadsheetId}`);
    fs.writeFileSync(require('path').resolve(__dirname, '../.env'), updated);
    console.log(`SHEETS_ID atualizado no .env: ${spreadsheetId}`);
  }

  console.log(`\nAcesse a planilha em:\n${spreadsheetUrl}`);
  return spreadsheetId;
}

setupSheets().catch(err => {
  console.error('\nErro:', err.message || err);
  process.exit(1);
});
