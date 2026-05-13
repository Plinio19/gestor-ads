require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { GoogleAdsApi } = require('google-ads-api');
const { getAuthClient } = require('../../../lib/auth-client');

const STATUS = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'ENABLED', 3: 'PAUSED', 4: 'REMOVED' };

function getWeekRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const fmt = d => d.toISOString().slice(0, 10);
  const label = `${fmt(start)} a ${fmt(end)}`;
  return { start: fmt(start), end: fmt(end), label };
}

async function runWeeklyReport() {
  const { start, end, label } = getWeekRange();
  console.log(`\n=== Relatório Semanal: ${label} ===\n`);

  // --- Google Ads ---
  const adsClient = new GoogleAdsApi({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    developer_token: process.env.DEVELOPER_TOKEN,
  });
  const customer = adsClient.Customer({
    customer_id: process.env.CUSTOMER_ID,
    refresh_token: process.env.REFRESH_TOKEN,
  });

  const campanhas = await customer.query(`
    SELECT
      campaign.id, campaign.name, campaign.status,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.ctr, metrics.average_cpc, metrics.conversions,
      metrics.cost_per_conversion
    FROM campaign
    WHERE segments.date BETWEEN '${start}' AND '${end}'
    ORDER BY metrics.cost_micros DESC
  `);

  let totalImpressions = 0, totalClicks = 0, totalCost = 0, totalConversions = 0;
  const rows = [];

  for (const row of campanhas) {
    const c = row.campaign;
    const m = row.metrics;
    totalImpressions += m.impressions;
    totalClicks += m.clicks;
    totalCost += m.cost_micros / 1_000_000;
    totalConversions += m.conversions;

    rows.push([
      label,
      c.name,
      STATUS[c.status] ?? c.status,
      m.impressions,
      m.clicks,
      m.ctr ? (m.ctr * 100).toFixed(2) + '%' : '0%',
      m.average_cpc ? 'R$ ' + (m.average_cpc / 1_000_000).toFixed(2) : 'R$ 0,00',
      'R$ ' + (m.cost_micros / 1_000_000).toFixed(2),
      m.conversions,
      m.cost_per_conversion ? 'R$ ' + (m.cost_per_conversion / 1_000_000).toFixed(2) : '-',
    ]);
  }

  const ctrGeral = totalClicks > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0%';
  const cpcMedio = totalClicks > 0 ? 'R$ ' + (totalCost / totalClicks).toFixed(2) : 'R$ 0,00';
  const custoPorConv = totalConversions > 0 ? 'R$ ' + (totalCost / totalConversions).toFixed(2) : '-';

  console.log(`Impressões:   ${totalImpressions}`);
  console.log(`Cliques:      ${totalClicks}`);
  console.log(`CTR Geral:    ${ctrGeral}`);
  console.log(`CPC Médio:    ${cpcMedio}`);
  console.log(`Custo Total:  R$ ${totalCost.toFixed(2)}`);
  console.log(`Conversões:   ${totalConversions}`);
  console.log(`Custo/Conv:   ${custoPorConv}`);

  // Alertas do briefing
  const alertas = [];
  for (const row of campanhas) {
    const m = row.metrics;
    const c = row.campaign;
    if (STATUS[c.status] === 'ENABLED') {
      if (m.ctr < 0.02 && m.impressions > 100) {
        alertas.push(`CTR abaixo de 2%: ${c.name} (${(m.ctr * 100).toFixed(2)}%)`);
      }
      if (m.average_cpc / 1_000_000 > 8 && m.conversions === 0) {
        alertas.push(`CPC > R$8 sem conversões: ${c.name} (CPC: R$ ${(m.average_cpc / 1_000_000).toFixed(2)})`);
      }
    }
  }

  if (alertas.length > 0) {
    console.log('\n⚠ ALERTAS:');
    alertas.forEach(a => console.log('  •', a));
  }

  // --- Gravar no Google Sheets ---
  const sheetsId = process.env.SHEETS_ID;
  if (!sheetsId) {
    console.log('\nSHEETS_ID não configurado no .env. Execute setup-sheets.js primeiro.');
    return;
  }

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Aba Semanal — linha por campanha
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetsId,
    range: 'Semanal!A:J',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });

  // Aba Resumo — totais
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetsId,
    range: 'Resumo!A2:E6',
    valueInputOption: 'RAW',
    requestBody: {
      values: [
        ['Período', label, '-', '-', now],
        ['Impressões', totalImpressions, '-', '-', now],
        ['Cliques', totalClicks, '-', '-', now],
        ['Custo (R$)', totalCost.toFixed(2), '-', '-', now],
        ['Conversões', totalConversions, '-', '-', now],
      ],
    },
  });

  // Aba Alertas
  if (alertas.length > 0) {
    const alertRows = alertas.map(a => [now, 'Performance', '-', a, '-', '-', 'Pendente']);
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: 'Alertas!A:G',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: alertRows },
    });
  }

  console.log(`\nRelatório semanal gravado na planilha com sucesso!`);
  console.log(`Planilha: https://docs.google.com/spreadsheets/d/${sheetsId}`);
}

runWeeklyReport().catch(err => {
  console.error('\nErro:', err.message || err);
  process.exit(1);
});
