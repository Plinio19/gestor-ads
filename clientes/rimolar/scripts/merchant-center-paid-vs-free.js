/**
 * Consulta o Merchant Center (Content API for Shopping) e separa cliques/impressões
 * por programa: SHOPPING_ADS (pago) vs FREE_PRODUCT_LISTING (grátis).
 * Uso: node clientes/rimolar/scripts/merchant-center-paid-vs-free.js [YYYY-MM-DD] [YYYY-MM-DD]
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { google } = require('googleapis');

const { MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET, MERCHANT_REFRESH_TOKEN, MERCHANT_ID } = process.env;

const oauth2Client = new google.auth.OAuth2(MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: MERCHANT_REFRESH_TOKEN });
const content = google.content({ version: 'v2.1', auth: oauth2Client });

const [, , dataInicio, dataFim] = process.argv;
const fim = dataFim || new Date().toISOString().split('T')[0];
const inicioDefault = new Date(); inicioDefault.setDate(inicioDefault.getDate() - 12);
const inicio = dataInicio || inicioDefault.toISOString().split('T')[0];

async function run() {
  const r = await content.reports.search({
    merchantId: MERCHANT_ID,
    requestBody: {
      query: `SELECT segments.program, metrics.clicks, metrics.impressions, metrics.conversions
              FROM MerchantPerformanceView
              WHERE segments.date BETWEEN '${inicio}' AND '${fim}'`,
    },
  });
  console.log(`Período: ${inicio} a ${fim}\n`);
  let totalClicks = 0;
  for (const row of r.data.results || []) {
    const m = row.metrics;
    totalClicks += Number(m.clicks || 0);
    console.log(`${row.segments.program}: cliques=${m.clicks} impressões=${m.impressions} conversões(MC)=${m.conversions}`);
  }
  if (r.data.results?.length === 2) {
    const paid = Number(r.data.results.find(x => x.segments.program === 'SHOPPING_ADS')?.metrics.clicks || 0);
    console.log(`\n% pago: ${((paid / totalClicks) * 100).toFixed(1)}%`);
  }
}
run().catch(e => console.error('ERRO:', e.message, e.response?.data ? JSON.stringify(e.response.data).slice(0, 500) : ''));
