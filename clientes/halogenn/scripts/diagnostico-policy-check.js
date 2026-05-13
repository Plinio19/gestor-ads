require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const APPROVAL_MAP = {
  0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'APPROVED',
  3: 'APPROVED_LIMITED', 4: 'DISAPPROVED', 5: 'AREA_OF_INTEREST_ONLY'
};
const REVIEW_MAP = {
  0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'REVIEW_IN_PROGRESS',
  3: 'REVIEWED', 4: 'UNDER_APPEAL', 5: 'ELIGIBLE_MAY_SERVE'
};

async function policyCheck() {
  console.log('\n=== VERIFICAÇÃO DE POLÍTICA — Todas as Campanhas ===\n');
  console.log(`Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

  // Query 1: status de policy por anúncio + métricas dos últimos 30 dias
  const ads = await customer.query(`
    SELECT
      campaign.name,
      ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.final_urls,
      ad_group_ad.status,
      ad_group_ad.policy_summary.approval_status,
      ad_group_ad.policy_summary.review_status,
      ad_group_ad.policy_summary.policy_topic_entries,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr
    FROM ad_group_ad
    WHERE ad_group_ad.status != 'REMOVED'
      AND segments.date DURING LAST_30_DAYS
    ORDER BY campaign.name ASC, ad_group.name ASC
  `);

  // Agrupar por campanha
  const byCampaign = {};
  for (const r of ads) {
    const camp = r.campaign.name;
    if (!byCampaign[camp]) byCampaign[camp] = [];

    const approval = APPROVAL_MAP[r.ad_group_ad.policy_summary?.approval_status] ?? r.ad_group_ad.policy_summary?.approval_status;
    const review = REVIEW_MAP[r.ad_group_ad.policy_summary?.review_status] ?? r.ad_group_ad.policy_summary?.review_status;
    const topics = r.ad_group_ad.policy_summary?.policy_topic_entries ?? [];

    byCampaign[camp].push({
      adGroup: r.ad_group.name,
      adId: r.ad_group_ad.ad?.id,
      url: r.ad_group_ad.ad?.final_urls?.[0] ?? '',
      adStatus: r.ad_group_ad.status,
      approval,
      review,
      topics,
      impressions: r.metrics.impressions,
      clicks: r.metrics.clicks,
      ctr: (r.metrics.ctr * 100).toFixed(2) + '%'
    });
  }

  let problemCount = 0;

  for (const [camp, rows] of Object.entries(byCampaign)) {
    console.log(`\n📣 Campanha: ${camp}`);
    console.log('-'.repeat(70));

    for (const r of rows) {
      const icon = r.approval === 'APPROVED' ? '✅'
        : r.approval === 'APPROVED_LIMITED' ? '🔄'
        : r.approval === 'DISAPPROVED' ? '❌'
        : r.approval === 'REVIEW_IN_PROGRESS' ? '⏳'
        : '❓';

      // Mostrar apenas os que têm problema real (DISAPPROVED com topics, ou APPROVED_LIMITED)
      const hasRealIssue = (r.approval === 'DISAPPROVED' && r.topics.length > 0) || r.approval === 'APPROVED_LIMITED';
      const isApiGhost = r.approval === 'DISAPPROVED' && r.topics.length === 0;

      const statusNote = isApiGhost ? ' [API ghost — sem tópico real]' : '';

      console.log(`  ${icon} ${r.adGroup}${statusNote}`);
      console.log(`     Status: ${r.approval} | Revisão: ${r.review} | Impr: ${r.impressions} | Cliques: ${r.clicks} | CTR: ${r.ctr}`);

      if (r.topics.length > 0) {
        problemCount++;
        for (const t of r.topics) {
          const tipo = t.type === 1 ? 'PROIBIDO' : t.type === 2 ? 'LIMITADO' : `tipo ${t.type}`;
          console.log(`     ⚠️  Tópico: ${t.topic} [${tipo}]`);
          if (t.evidences?.length) {
            for (const ev of t.evidences) {
              const txts = ev.text_list?.texts ?? [];
              if (txts.length) console.log(`        Evidência: "${txts.join('", "')}"`);
            }
          }
          if (t.constraints?.length) {
            for (const c of t.constraints) {
              console.log(`        Restrição: ${JSON.stringify(c)}`);
            }
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n📋 CONCLUSÃO:`);
  console.log(`  Anúncios com tópico de política REAL: ${problemCount}`);
  console.log(`  Anúncios com DISAPPROVED sem tópico (API artifact): provavelmente falso positivo\n`);
  console.log(`  LEGENDA:`);
  console.log(`  ✅ APPROVED           = Ativo normal, sem restrições`);
  console.log(`  🔄 APPROVED_LIMITED   = Ativo mas com restrição geográfica/audiência`);
  console.log(`  ❌ DISAPPROVED        = Reprovado (verificar se tem tópico real ou é ghost)`);
  console.log(`  ⏳                    = Em revisão\n`);
}

policyCheck().catch(e => {
  console.error('Erro:', e.message || e);
  process.exit(1);
});
