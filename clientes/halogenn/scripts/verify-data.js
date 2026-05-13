/**
 * Verificação direta da API — compara dados brutos com o que o relatório exibiu
 */
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

async function main() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10).replace(/-/g, '');

  console.log(`\n=== VERIFICAÇÃO DE DADOS — Halogenn Química ===`);
  console.log(`Ontem: ${yesterday.toISOString().slice(0, 10)}\n`);

  // 1. Dados por campanha ONTEM
  console.log('--- 1. Dados por campanha (YESTERDAY) ---');
  const camps = await customer.query(`
    SELECT campaign.name, campaign.id, campaign.status, campaign.serving_status,
           metrics.impressions, metrics.clicks, metrics.ctr,
           metrics.cost_micros, metrics.average_cpc, metrics.conversions
    FROM campaign
    WHERE campaign.id IN (23769809419, 23769809422, 23769809425, 23769809428)
      AND segments.date DURING YESTERDAY
  `);

  let totImpr = 0, totClicks = 0, totCost = 0, totConv = 0;
  for (const c of camps) {
    const m = c.metrics;
    totImpr   += m.impressions || 0;
    totClicks += m.clicks || 0;
    totCost   += m.cost_micros || 0;
    totConv   += m.conversions || 0;
    console.log(`  [${c.campaign.id}] ${c.campaign.name}`);
    console.log(`    Status: ${c.campaign.status} | Serving: ${c.campaign.serving_status}`);
    console.log(`    Impressões: ${m.impressions} | Cliques: ${m.clicks} | CTR: ${(m.ctr*100).toFixed(2)}%`);
    console.log(`    Custo: R$ ${(m.cost_micros/1e6).toFixed(2)} | CPC: R$ ${(m.average_cpc/1e6).toFixed(2)} | Conv: ${m.conversions}`);
  }
  console.log(`\n  TOTAIS: Impr=${totImpr} | Cliques=${totClicks} | Custo=R$${(totCost/1e6).toFixed(2)} | Conv=${totConv}`);

  // 2. Dados dos últimos 7 dias (para ver se tem histórico)
  console.log('\n--- 2. Dados últimos 7 dias (LAST_7_DAYS) ---');
  const week = await customer.query(`
    SELECT campaign.name, campaign.id,
           metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
    FROM campaign
    WHERE campaign.id IN (23769809419, 23769809422, 23769809425, 23769809428)
      AND segments.date DURING LAST_7_DAYS
  `);

  let w_impr = 0, w_clicks = 0, w_cost = 0;
  for (const c of week) {
    w_impr   += c.metrics.impressions || 0;
    w_clicks += c.metrics.clicks || 0;
    w_cost   += c.metrics.cost_micros || 0;
  }
  console.log(`  7 dias: Impr=${w_impr} | Cliques=${w_clicks} | Custo=R$${(w_cost/1e6).toFixed(2)}`);

  // 3. Verificar orçamentos reais das campanhas
  console.log('\n--- 3. Orçamentos configurados na API ---');
  const budgets = await customer.query(`
    SELECT campaign.name, campaign.id,
           campaign_budget.amount_micros, campaign_budget.delivery_method
    FROM campaign
    WHERE campaign.id IN (23769809419, 23769809422, 23769809425, 23769809428)
  `);
  let totalBudget = 0;
  for (const c of budgets) {
    const budget = c.campaign_budget?.amount_micros || 0;
    totalBudget += budget;
    console.log(`  ${c.campaign.name}: R$ ${(budget/1e6).toFixed(2)}/dia`);
  }
  console.log(`  TOTAL ORÇAMENTO DIÁRIO: R$ ${(totalBudget/1e6).toFixed(2)}`);

  // 4. Status dos anúncios (verificar se estão aprovados)
  console.log('\n--- 4. Status dos anúncios ---');
  const ads = await customer.query(`
    SELECT campaign.name, ad_group.name, ad_group_ad.status,
           ad_group_ad.policy_summary.approval_status,
           ad_group_ad.policy_summary.review_status
    FROM ad_group_ad
    WHERE campaign.id IN (23769809419, 23769809422, 23769809425, 23769809428)
  `);
  const byStatus = {};
  for (const a of ads) {
    const key = `${a.ad_group_ad.policy_summary?.approval_status}/${a.ad_group_ad.policy_summary?.review_status}`;
    byStatus[key] = (byStatus[key] || 0) + 1;
  }
  console.log(`  Total de anúncios: ${ads.length}`);
  for (const [k, v] of Object.entries(byStatus)) {
    console.log(`  approval/review ${k}: ${v} anúncios`);
  }

  console.log('\n=== FIM DA VERIFICAÇÃO ===\n');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
