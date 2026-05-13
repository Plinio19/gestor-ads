require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { GoogleAdsApi } = require('google-ads-api');
const { getAuthClient } = require('../../../lib/auth-client');

const STATUS = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'ENABLED', 3: 'PAUSED', 4: 'REMOVED' };

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = d => d.toISOString().slice(0, 10);
  const label = start.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  return { start: fmt(start), end: fmt(end), label };
}

async function runMonthlyReport() {
  const { start, end, label } = getMonthRange();
  console.log(`\n=== Relatório Mensal: ${label} ===\n`);

  const adsClient = new GoogleAdsApi({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    developer_token: process.env.DEVELOPER_TOKEN,
  });
  const customer = adsClient.Customer({
    customer_id: process.env.CUSTOMER_ID,
    refresh_token: process.env.REFRESH_TOKEN,
  });

  // Performance por campanha no mês
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

  // Top keywords do mês (Search campaigns only)
  const keywordsRaw = await customer.query(`
    SELECT
      campaign.name,
      ad_group.name,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.ctr
    FROM keyword_view
    WHERE segments.date BETWEEN '${start}' AND '${end}'
      AND metrics.clicks > 0
    ORDER BY metrics.clicks DESC
    LIMIT 20
  `);

  let totalImpressions = 0, totalClicks = 0, totalCost = 0, totalConversions = 0;
  const campRows = [];
  const kwRows = [];

  for (const row of campanhas) {
    const c = row.campaign;
    const m = row.metrics;
    totalImpressions += m.impressions;
    totalClicks += m.clicks;
    totalCost += m.cost_micros / 1_000_000;
    totalConversions += m.conversions;

    campRows.push([
      label,
      c.name,
      STATUS[c.status] ?? c.status,
      m.impressions,
      m.clicks,
      m.ctr ? (m.ctr * 100).toFixed(2) + '%' : '0%',
      'R$ ' + (m.average_cpc / 1_000_000).toFixed(2),
      'R$ ' + (m.cost_micros / 1_000_000).toFixed(2),
      m.conversions,
      m.cost_per_conversion ? 'R$ ' + (m.cost_per_conversion / 1_000_000).toFixed(2) : '-',
      '',
    ]);
  }

  for (const row of keywordsRaw) {
    const m = row.metrics;
    const kw = row.ad_group_criterion;
    const MATCH = { 2: 'EXACT', 3: 'PHRASE', 4: 'BROAD' };
    kwRows.push([
      label,
      row.campaign.name,
      row.ad_group.name,
      kw.keyword?.text,
      MATCH[kw.keyword?.match_type] ?? kw.keyword?.match_type,
      STATUS[kw.status] ?? kw.status,
      kw.quality_info?.quality_score ?? 'N/A',
      m.impressions,
      m.clicks,
      m.ctr ? (m.ctr * 100).toFixed(2) + '%' : '0%',
      'R$ ' + (m.cost_micros / 1_000_000).toFixed(2),
    ]);
  }

  const ctrGeral = totalClicks > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0%';
  const cpcMedio = totalClicks > 0 ? 'R$ ' + (totalCost / totalClicks).toFixed(2) : 'R$ 0,00';
  const custoPorConv = totalConversions > 0 ? 'R$ ' + (totalCost / totalConversions).toFixed(2) : '-';

  console.log(`Período:      ${start} a ${end}`);
  console.log(`Impressões:   ${totalImpressions}`);
  console.log(`Cliques:      ${totalClicks}`);
  console.log(`CTR Geral:    ${ctrGeral}`);
  console.log(`CPC Médio:    ${cpcMedio}`);
  console.log(`Custo Total:  R$ ${totalCost.toFixed(2)}`);
  console.log(`Conversões:   ${totalConversions}`);
  console.log(`Custo/Conv:   ${custoPorConv}`);

  // Gravar no Sheets
  const sheetsId = process.env.SHEETS_ID;
  if (!sheetsId) {
    console.log('\nSHEETS_ID não configurado no .env. Execute setup-sheets.js primeiro.');
    return;
  }

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Aba Mensal
  if (campRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: 'Mensal!A:K',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: campRows },
    });
  }

  // Aba Campanhas (histórico detalhado)
  if (campRows.length > 0) {
    const campDetailRows = campRows.map(r => [now, ...r.slice(1)]);
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: 'Campanhas!A:L',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: campDetailRows },
    });
  }

  // Aba Keywords
  if (kwRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: 'Keywords!A:K',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: kwRows },
    });
  }

  console.log(`\nRelatório mensal gravado na planilha com sucesso!`);
  console.log(`Planilha: https://docs.google.com/spreadsheets/d/${sheetsId}`);
}

runMonthlyReport().catch(err => {
  console.error('\nErro:', err.message || err);
  process.exit(1);
});
