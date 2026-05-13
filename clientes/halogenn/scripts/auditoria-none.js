/**
 * Auditoria — termos de pesquisa com status NONE (não adicionado, não excluído)
 * Período completo desde o início da conta
 * Ordenado por custo desc para priorizar o que está desperdiçando mais verba
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

async function main() {
  console.log('=== TERMOS DE PESQUISA — STATUS NONE (todo o período) ===\n');

  const rows = await customer.query(`
    SELECT
      search_term_view.search_term,
      search_term_view.status,
      campaign.name,
      ad_group.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.ctr,
      metrics.conversions
    FROM search_term_view
    WHERE search_term_view.status = 'NONE'
      AND campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
      AND segments.date BETWEEN '2024-01-01' AND '2026-12-31'
    ORDER BY metrics.cost_micros DESC
  `);

  if (!rows.length) {
    console.log('Nenhum termo NONE encontrado.');
    return;
  }

  console.log(`Total: ${rows.length} termos NONE\n`);
  console.log('Custo(R$) | Impr | Clicks | CTR%  | Conv | Campanha | AG | Termo');
  console.log('─'.repeat(120));

  for (const r of rows) {
    const custo = (r.metrics.cost_micros / 1_000_000).toFixed(2).padStart(9);
    const impr  = String(r.metrics.impressions).padStart(5);
    const cli   = String(r.metrics.clicks).padStart(6);
    const ctr   = (r.metrics.ctr * 100).toFixed(1).padStart(5);
    const conv  = String(r.metrics.conversions).padStart(4);
    const camp  = r.campaign.name.replace('[Busca] - ', '').padEnd(22);
    const ag    = r.ad_group.name.padEnd(28);
    const termo = r.search_term_view.search_term;
    console.log(`${custo} | ${impr} | ${cli} | ${ctr}% | ${conv} | ${camp} | ${ag} | ${termo}`);
  }

  // Resumo agrupado por faixa de custo
  const comCusto    = rows.filter(r => r.metrics.cost_micros > 0);
  const semCusto    = rows.filter(r => r.metrics.cost_micros === 0);
  const totalGasto  = rows.reduce((s, r) => s + r.metrics.cost_micros, 0) / 1_000_000;

  console.log('\n─'.repeat(120));
  console.log(`\n📊 RESUMO:`);
  console.log(`  Total NONE: ${rows.length} termos`);
  console.log(`  Com gasto:  ${comCusto.length} termos`);
  console.log(`  Sem gasto:  ${semCusto.length} termos (só impressão)`);
  console.log(`  Gasto total nesses termos: R$ ${totalGasto.toFixed(2)}`);

  const top10 = rows.slice(0, 10);
  const gastoTop10 = top10.reduce((s, r) => s + r.metrics.cost_micros, 0) / 1_000_000;
  console.log(`  Top 10 por custo somam: R$ ${gastoTop10.toFixed(2)}`);
}

main().catch(e => { console.error('ERRO:', e.message); if(e.errors) e.errors.forEach(x => console.error(JSON.stringify(x))); process.exit(1); });
