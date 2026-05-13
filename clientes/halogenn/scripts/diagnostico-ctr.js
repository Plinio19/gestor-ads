require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const POLICY_APPROVAL = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'APPROVED', 3: 'APPROVED_LIMITED', 4: 'DISAPPROVED', 5: 'AREA_OF_INTEREST_ONLY' };
const REVIEW_STATUS = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'REVIEW_IN_PROGRESS', 3: 'REVIEWED', 4: 'UNDER_APPEAL', 5: 'ELIGIBLE_MAY_SERVE' };

async function diagnostico() {
  console.log('\n=== DIAGNÓSTICO CTR — [Busca] - Produtos Prioritários ===\n');
  console.log(`Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

  // 1. CTR por ad group na campanha de Produtos Prioritários (últimos 30 dias)
  console.log('--- 1. CTR por Grupo de Anúncio (últimos 30 dias) ---\n');
  const adGroups = await customer.query(`
    SELECT
      ad_group.name,
      ad_group.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros
    FROM ad_group
    WHERE campaign.name = '[Busca] - Produtos Prioritários'
      AND segments.date DURING LAST_30_DAYS
    ORDER BY metrics.impressions DESC
  `);

  if (!adGroups.length) {
    console.log('Nenhum dado encontrado para essa campanha no período.\n');
  } else {
    const rows = adGroups.map(r => ({
      grupo: r.ad_group.name,
      status: r.ad_group.status === 2 ? 'ATIVO' : r.ad_group.status === 3 ? 'PAUSADO' : 'REMOVIDO',
      impressoes: r.metrics.impressions,
      cliques: r.metrics.clicks,
      ctr: (r.metrics.ctr * 100).toFixed(2) + '%',
      cpcMedio: 'R$ ' + (r.metrics.average_cpc / 1_000_000).toFixed(2),
      custo: 'R$ ' + (r.metrics.cost_micros / 1_000_000).toFixed(2),
      alerta: r.metrics.ctr < 0.02 ? '⚠️' : '✅'
    }));

    // Cabeçalho
    console.log('  Grupo de Anúncio                          | Status  | Impr  | Cliques | CTR    | CPC Méd | Custo     | OK?');
    console.log('  ' + '-'.repeat(105));
    for (const r of rows) {
      const nome = r.grupo.padEnd(42);
      const status = r.status.padEnd(7);
      const impr = String(r.impressoes).padStart(5);
      const cliq = String(r.cliques).padStart(7);
      const ctr = r.ctr.padStart(6);
      const cpc = r.cpcMedio.padStart(7);
      const custo = r.custo.padStart(9);
      console.log(`  ${nome} | ${status} | ${impr} | ${cliq} | ${ctr} | ${cpc} | ${custo} | ${r.alerta}`);
    }

    // Totais
    const totalImpr = rows.reduce((s, r) => s + r.impressoes, 0);
    const totalCliq = rows.reduce((s, r) => s + r.cliques, 0);
    const ctrTotal = totalImpr > 0 ? ((totalCliq / totalImpr) * 100).toFixed(2) + '%' : '0%';
    console.log('\n  Total campanha: ' + totalImpr + ' impressões / ' + totalCliq + ' cliques / CTR ' + ctrTotal);
  }

  // 2. Status dos anúncios na campanha (policy review)
  console.log('\n--- 2. Status de Aprovação dos Anúncios ---\n');
  const ads = await customer.query(`
    SELECT
      ad_group.name,
      ad_group_ad.ad.name,
      ad_group_ad.status,
      ad_group_ad.policy_summary.approval_status,
      ad_group_ad.policy_summary.review_status,
      ad_group_ad.policy_summary.policy_topic_entries
    FROM ad_group_ad
    WHERE campaign.name = '[Busca] - Produtos Prioritários'
      AND ad_group_ad.status != 'REMOVED'
    ORDER BY ad_group.name ASC
  `);

  if (!ads.length) {
    console.log('Nenhum anúncio encontrado.\n');
  } else {
    for (const r of ads) {
      const approval = POLICY_APPROVAL[r.ad_group_ad.policy_summary?.approval_status] ?? r.ad_group_ad.policy_summary?.approval_status;
      const review = REVIEW_STATUS[r.ad_group_ad.policy_summary?.review_status] ?? r.ad_group_ad.policy_summary?.review_status;
      const topics = r.ad_group_ad.policy_summary?.policy_topic_entries?.map(t => t.topic).join(', ') || 'nenhum';
      const icon = approval === 'APPROVED' ? '✅' : approval === 'DISAPPROVED' ? '❌' : '🔄';

      console.log(`  ${icon} Grupo: ${r.ad_group.name}`);
      console.log(`     Aprovação: ${approval} | Revisão: ${review}`);
      if (approval !== 'APPROVED') {
        console.log(`     Tópicos de política: ${topics}`);
      }
      console.log('');
    }
  }

  // 3. CTR diário últimos 14 dias (tendência)
  console.log('--- 3. Evolução do CTR — Últimos 14 dias ---\n');
  const diario = await customer.query(`
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr
    FROM campaign
    WHERE campaign.name = '[Busca] - Produtos Prioritários'
      AND segments.date DURING LAST_14_DAYS
    ORDER BY segments.date ASC
  `);

  if (!diario.length) {
    console.log('Sem dados diários.\n');
  } else {
    for (const r of diario) {
      if (r.metrics.impressions === 0) continue;
      const ctr = (r.metrics.ctr * 100).toFixed(2);
      const icon = r.metrics.ctr < 0.02 ? '⚠️' : '✅';
      console.log(`  ${r.segments.date} | ${String(r.metrics.impressions).padStart(4)} impr | ${String(r.metrics.clicks).padStart(3)} cliques | CTR ${ctr}% ${icon}`);
    }
  }

  console.log('\n=== FIM DO DIAGNÓSTICO ===\n');
}

diagnostico().catch(e => {
  console.error('Erro:', e.message || e);
  process.exit(1);
});
