/**
 * Lista copy completo de todos os RSAs ativos (headlines + descriptions + ad strength + policy)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const APPROVAL = { 0:'UNSPEC', 1:'UNKNOWN', 2:'APPROVED', 3:'APPROVED_LIMITED', 4:'AREA_OF_INTEREST_ONLY', 5:'DISAPPROVED', 6:'UNDER_REVIEW' };
const STRENGTH = { 0:'UNSPEC', 1:'UNKNOWN', 2:'PENDING', 3:'NO_ADS', 4:'POOR', 5:'AVERAGE', 6:'GOOD', 7:'EXCELLENT' };

async function main() {
  const rows = await customer.query(`
    SELECT
      ad_group.name,
      campaign.name,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.ad.final_urls,
      ad_group_ad.ad_strength,
      ad_group_ad.policy_summary.approval_status,
      ad_group_ad.policy_summary.policy_topic_entries,
      ad_group_ad.status
    FROM ad_group_ad
    WHERE campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
      AND ad_group_ad.status != 'REMOVED'
    ORDER BY campaign.name, ad_group.name
  `);

  console.log(`\n${'═'.repeat(80)}\n  RSAs — COPY COMPLETO + POLICY\n${'═'.repeat(80)}\n`);

  for (const r of rows) {
    const ag      = r.ad_group.name;
    const camp    = r.campaign.name.replace('[Busca] - Produtos ', '');
    const ad      = r.ad_group_ad;
    const rsa     = ad.ad.responsive_search_ad;
    const appr    = APPROVAL[ad.policy_summary?.approval_status] ?? '?';
    const strength = STRENGTH[ad.ad_strength] ?? '?';

    console.log(`── ${ag} [${camp}]`);
    console.log(`   Policy: ${appr} | Ad Strength: ${strength}`);

    if (ad.policy_summary?.policy_topic_entries?.length) {
      ad.policy_summary.policy_topic_entries.forEach(e =>
        console.log(`   ⚠️  Topic: ${e.topic} | Type: ${e.type}`)
      );
    }

    console.log(`   URL: ${ad.ad.final_urls?.[0] ?? '-'}`);
    console.log(`   Headlines (${rsa.headlines?.length ?? 0}):`);
    rsa.headlines?.forEach((h, i) =>
      console.log(`     H${i+1} [${h.text?.length ?? 0}]: ${h.text}`)
    );
    console.log(`   Descriptions (${rsa.descriptions?.length ?? 0}):`);
    rsa.descriptions?.forEach((d, i) =>
      console.log(`     D${i+1} [${d.text?.length ?? 0}]: ${d.text}`)
    );
    console.log('');
  }
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
