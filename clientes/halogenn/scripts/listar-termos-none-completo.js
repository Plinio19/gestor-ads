/**
 * Termos NONE — Todo o período até hoje, sem filtro de impressões
 * Espelha o export "Todo o período / Sem classificação" do UI
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

async function listar() {
  const hoje = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log('\n=== TERMOS NONE — TODO O PERÍODO (até hoje) ===\n');
  console.log(`Data: ${hoje}\n`);

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
    WHERE segments.date BETWEEN '2024-01-01' AND '2026-05-06'
      AND search_term_view.status = NONE
      AND campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
    ORDER BY metrics.cost_micros DESC
  `);

  if (!rows.length) {
    console.log('Nenhum termo NONE encontrado.\n');
    return;
  }

  console.log(`Total de termos NONE: ${rows.length}\n`);
  console.log('-'.repeat(120));
  console.log(
    `${'#'.padEnd(4)} ${'TERMO DE BUSCA'.padEnd(50)} ${'AD GROUP'.padEnd(28)} ${'IMPR'.padStart(6)} ${'CLI'.padStart(4)} ${'CTR'.padStart(7)} ${'CUSTO'.padStart(9)} ${'CONV'.padStart(5)}`
  );
  console.log('-'.repeat(120));

  let totalImpr = 0, totalClicks = 0, totalCusto = 0, totalConv = 0;

  rows.forEach((r, i) => {
    const termo  = r.search_term_view.search_term.substring(0, 49);
    const ag     = r.ad_group.name.substring(0, 27);
    const impr   = r.metrics.impressions;
    const clicks = r.metrics.clicks;
    const ctr    = (r.metrics.ctr * 100).toFixed(1) + '%';
    const custo  = 'R$' + (r.metrics.cost_micros / 1_000_000).toFixed(2);
    const conv   = r.metrics.conversions;

    totalImpr   += impr;
    totalClicks += clicks;
    totalCusto  += r.metrics.cost_micros / 1_000_000;
    totalConv   += conv;

    console.log(
      `${String(i + 1).padEnd(4)} ${termo.padEnd(50)} ${ag.padEnd(28)} ${String(impr).padStart(6)} ${String(clicks).padStart(4)} ${ctr.padStart(7)} ${custo.padStart(9)} ${String(conv).padStart(5)}`
    );
  });

  console.log('-'.repeat(120));
  console.log(`\nTOTAL: ${rows.length} termos | ${totalImpr} impr | ${totalClicks} clicks | R$${totalCusto.toFixed(2)} | ${totalConv} conv\n`);
}

listar().catch(e => { console.error('Erro:', e.message || e); process.exit(1); });
