require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');
const client = new GoogleAdsApi({
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  developer_token: process.env.DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.CUSTOMER_ID,
  refresh_token: process.env.REFRESH_TOKEN,
  login_customer_id: '6017081450',
});

const MATCH = { 2: 'BROAD', 3: 'PHRASE', 4: 'EXACT' };

async function main() {
  // Termos de busca — TODO O PERÍODO (todas campanhas, inclusive pausadas)
  const terms = await customer.query(`
    SELECT search_term_view.search_term, search_term_view.status,
           campaign.name, campaign.status, ad_group.name,
           metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
    FROM search_term_view
    ORDER BY metrics.cost_micros DESC
    LIMIT 200
  `);

  console.log('=== TERMOS DE BUSCA — TODO O PERÍODO (todas campanhas) ===');
  console.log(`Total: ${terms.length} termos\n`);

  let totalCusto = 0, totalCliques = 0, totalImpr = 0;
  for (const t of terms) {
    const m = t.metrics;
    const statusLabel = { 2: 'ADDED', 3: 'EXCLUDED', 4: 'NONE', 5: 'NONE' }[t.search_term_view.status] || t.search_term_view.status;
    const campStatus = t.campaign.status === 2 ? 'ATIVA' : 'PAUSADA';
    totalCusto  += m.cost_micros || 0;
    totalCliques += m.clicks || 0;
    totalImpr   += m.impressions || 0;
    console.log(`[${statusLabel}][${campStatus}] "${t.search_term_view.search_term}" | camp="${t.campaign.name}" | ag="${t.ad_group.name}" | impr=${m.impressions} clicks=${m.clicks} custo=R$${(m.cost_micros/1e6).toFixed(2)} conv=${m.conversions}`);
  }
  console.log(`\nTOTAL: impr=${totalImpr} clicks=${totalCliques} custo=R$${(totalCusto/1e6).toFixed(2)}`);

  // Keywords ativas — todo período
  const kws = await customer.query(`
    SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
           ad_group_criterion.status, campaign.name, campaign.status, ad_group.name,
           metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions,
           metrics.ctr, metrics.average_cpc
    FROM ad_group_criterion
    WHERE ad_group_criterion.type = KEYWORD
      AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC
  `);

  console.log('\n=== KEYWORDS COM IMPRESSÕES — TODO O PERÍODO ===');
  for (const k of kws) {
    const m = k.metrics;
    const match = MATCH[k.ad_group_criterion.keyword.match_type] || k.ad_group_criterion.keyword.match_type;
    const status = { 2: 'ENABLED', 3: 'PAUSED', 4: 'REMOVED' }[k.ad_group_criterion.status] || k.ad_group_criterion.status;
    const campStatus = k.campaign.status === 2 ? 'ATIVA' : 'PAUSADA';
    console.log(`[${match}][${status}][camp:${campStatus}] "${k.ad_group_criterion.keyword.text}" | ag="${k.ad_group.name}" | impr=${m.impressions} clicks=${m.clicks} custo=R$${(m.cost_micros/1e6).toFixed(2)} ctr=${(m.ctr*100).toFixed(1)}% conv=${m.conversions}`);
  }
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
