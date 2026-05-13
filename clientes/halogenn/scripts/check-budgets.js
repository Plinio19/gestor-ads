require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const STATUS = { 2: 'ATIVA', 3: 'PAUSADA', 4: 'REMOVIDA' };

async function checkBudgets() {
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.id,
      campaign_budget.amount_micros,
      campaign_budget.explicitly_shared,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign_budget.amount_micros DESC
  `);

  console.log('\n=== ORÇAMENTOS E STATUS DAS CAMPANHAS ===\n');
  console.log(`${'Campanha'.padEnd(45)} | ${'Status'.padEnd(7)} | Orç/dia   | Orç/mês   | Impr(30d) | Clicks | Gasto`);
  console.log('-'.repeat(115));

  for (const r of rows) {
    const nome = r.campaign.name.substring(0, 44).padEnd(45);
    const status = (STATUS[r.campaign.status] ?? '?').padEnd(7);
    const diario = r.campaign_budget?.amount_micros
      ? 'R$' + (r.campaign_budget.amount_micros / 1_000_000).toFixed(0).padStart(5)
      : 'N/A'.padStart(7);
    const mensal = r.campaign_budget?.amount_micros
      ? 'R$' + ((r.campaign_budget.amount_micros / 1_000_000) * 30).toFixed(0).padStart(6)
      : 'N/A'.padStart(8);
    const impr = String(r.metrics.impressions).padStart(9);
    const clicks = String(r.metrics.clicks).padStart(6);
    const gasto = 'R$' + (r.metrics.cost_micros / 1_000_000).toFixed(2).padStart(7);
    console.log(`${nome} | ${status} | ${diario}     | ${mensal}    | ${impr} | ${clicks} | ${gasto}`);
  }

  const totalMensal = rows.reduce((s, r) => {
    if (r.campaign.status === 2) return s + (r.campaign_budget?.amount_micros ?? 0);
    return s;
  }, 0) / 1_000_000 * 30;

  const totalGasto = rows.reduce((s, r) => s + r.metrics.cost_micros, 0) / 1_000_000;

  console.log('\n' + '-'.repeat(115));
  console.log(`Total comprometido/mês (campanhas ativas): R$${totalMensal.toFixed(0)}`);
  console.log(`Total gasto (30d): R$${totalGasto.toFixed(2)}\n`);
}

checkBudgets().catch(e => { console.error(e.message); process.exit(1); });
