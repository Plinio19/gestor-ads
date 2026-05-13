require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

async function listar() {
  console.log('\n=== TERMOS NONE — 24/04 a 28/04/2026 ===\n');
  console.log(`Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

  const rows = await customer.query(`
    SELECT
      campaign.name,
      ad_group.name,
      search_term_view.search_term,
      search_term_view.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr
    FROM search_term_view
    WHERE segments.date BETWEEN '2026-04-24' AND '2026-04-28'
      AND search_term_view.status = NONE
      AND campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
    ORDER BY metrics.impressions DESC
  `);

  if (!rows.length) {
    console.log('Nenhum termo com status NONE encontrado.\n');
    return;
  }

  console.log(`Total de termos NONE: ${rows.length}\n`);
  console.log('-'.repeat(100));
  console.log(`${'#'.padEnd(4)} ${'TERMO'.padEnd(45)} ${'AD GROUP'.padEnd(28)} ${'IMPR'.padStart(5)} ${'CLI'.padStart(4)} ${'CTR'.padStart(7)} ${'CUSTO'.padStart(8)} ${'CONV'.padStart(5)}`);
  console.log('-'.repeat(100));

  rows.forEach((r, i) => {
    const termo = r.search_term_view.search_term;
    const ag = r.ad_group.name.substring(0, 27);
    const impr = r.metrics.impressions;
    const clicks = r.metrics.clicks;
    const ctr = (r.metrics.ctr * 100).toFixed(1) + '%';
    const custo = 'R$' + (r.metrics.cost_micros / 1_000_000).toFixed(2);
    const conv = r.metrics.conversions;

    console.log(`${String(i+1).padEnd(4)} ${termo.padEnd(45)} ${ag.padEnd(28)} ${String(impr).padStart(5)} ${String(clicks).padStart(4)} ${ctr.padStart(7)} ${custo.padStart(8)} ${String(conv).padStart(5)}`);
  });

  console.log('-'.repeat(100));
  const totalImpr = rows.reduce((s, r) => s + r.metrics.impressions, 0);
  const totalClicks = rows.reduce((s, r) => s + r.metrics.clicks, 0);
  const totalCusto = rows.reduce((s, r) => s + r.metrics.cost_micros, 0) / 1_000_000;
  const totalConv = rows.reduce((s, r) => s + r.metrics.conversions, 0);
  console.log(`\nTOTAL: ${rows.length} termos | ${totalImpr} impr | ${totalClicks} clicks | R$${totalCusto.toFixed(2)} | ${totalConv} conv\n`);
}

listar().catch(e => { console.error('Erro:', e.message || e); process.exit(1); });
