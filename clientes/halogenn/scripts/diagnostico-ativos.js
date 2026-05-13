require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const APPROVAL = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'APPROVED', 3: 'APPROVED_LIMITED', 4: 'DISAPPROVED', 5: 'AREA_OF_INTEREST_ONLY' };
const REVIEW = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'REVIEW_IN_PROGRESS', 3: 'REVIEWED', 4: 'UNDER_APPEAL', 5: 'ELIGIBLE_MAY_SERVE' };
const FIELD = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'HEADLINE', 3: 'DESCRIPTION', 4: 'HEADLINE_1', 5: 'HEADLINE_2', 6: 'HEADLINE_3' };

async function diagnosticoAtivos() {
  console.log('\n=== DIAGNÓSTICO DE ATIVOS RSA — Produtos Prioritários ===\n');
  console.log(`Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

  const ads = await customer.query(`
    SELECT
      ad_group.name,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.policy_summary.approval_status,
      ad_group_ad.policy_summary.review_status,
      ad_group_ad.policy_summary.policy_topic_entries,
      ad_group_ad.ad.final_urls
    FROM ad_group_ad
    WHERE campaign.name = '[Busca] - Produtos Prioritários'
      AND ad_group_ad.status != 'REMOVED'
    ORDER BY ad_group.name ASC
  `);

  for (const row of ads) {
    const ag = row.ad_group.name;
    const ad = row.ad_group_ad;
    const rsa = ad.ad?.responsive_search_ad;
    const approval = APPROVAL[ad.policy_summary?.approval_status] ?? ad.policy_summary?.approval_status;
    const review = REVIEW[ad.policy_summary?.review_status] ?? ad.policy_summary?.review_status;
    const topics = ad.policy_summary?.policy_topic_entries ?? [];
    const icon = approval === 'APPROVED' ? '✅' : approval === 'APPROVED_LIMITED' ? '🔄' : '❌';

    console.log(`${'='.repeat(60)}`);
    console.log(`${icon} ${ag}`);
    console.log(`   Aprovação: ${approval} | Revisão: ${review}`);
    console.log(`   URL: ${ad.ad?.final_urls?.[0] ?? 'N/A'}`);

    if (topics.length > 0) {
      console.log('\n   Tópicos de política:');
      for (const t of topics) {
        const topicType = t.type === 1 ? 'PROHIBITED' : t.type === 2 ? 'LIMITED' : t.type?.toString();
        console.log(`     • ${t.topic} [${topicType}]`);
        if (t.evidences?.length) {
          for (const ev of t.evidences) {
            if (ev.text_list?.texts?.length) {
              console.log(`       Evidências: ${ev.text_list.texts.join(', ')}`);
            }
          }
        }
      }
    }

    if (rsa) {
      console.log('\n   HEADLINES:');
      for (const h of (rsa.headlines ?? [])) {
        const pin = h.pinned_field ? ` [PIN: ${FIELD[h.pinned_field] ?? h.pinned_field}]` : '';
        const policyIcon = h.asset_performance_label === 4 ? ' 🛑' : '';
        console.log(`     "${h.text}"${pin}${policyIcon}`);
      }

      console.log('\n   DESCRIPTIONS:');
      for (const d of (rsa.descriptions ?? [])) {
        const pin = d.pinned_field ? ` [PIN: ${FIELD[d.pinned_field] ?? d.pinned_field}]` : '';
        console.log(`     "${d.text}"${pin}`);
      }
    }

    console.log('');
  }

  // Resumo executivo
  console.log(`${'='.repeat(60)}`);
  console.log('\n📋 RESUMO EXECUTIVO:\n');
  const contagem = { APPROVED: 0, APPROVED_LIMITED: 0, DISAPPROVED: 0, REVIEW_IN_PROGRESS: 0, outros: 0 };
  for (const row of ads) {
    const ap = APPROVAL[row.ad_group_ad.policy_summary?.approval_status] ?? 'outros';
    if (ap in contagem) contagem[ap]++;
    else contagem.outros++;
  }
  console.log(`  ✅ Aprovados: ${contagem.APPROVED}`);
  console.log(`  🔄 Aprovados c/ limitação: ${contagem.APPROVED_LIMITED}`);
  console.log(`  ❌ Reprovados: ${contagem.DISAPPROVED}`);
  console.log(`  🔍 Em revisão: ${contagem.REVIEW_IN_PROGRESS}`);
  console.log('');
}

diagnosticoAtivos().catch(e => {
  console.error('Erro:', e.message || e);
  process.exit(1);
});
