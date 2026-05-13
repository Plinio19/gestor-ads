require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

async function main() {
  console.log('=== Adicionando keyword: formol 37 inibido ===\n');

  const agRows = await customer.query(`
    SELECT ad_group.id, ad_group.name
    FROM ad_group
    WHERE ad_group.name = 'Formaldeído PA'
      AND ad_group.status = 'ENABLED'
  `);

  if (!agRows.length) {
    console.error('Ad group "Formaldeído PA" não encontrado.');
    process.exit(1);
  }

  const agRN = `customers/${CUSTOMER_ID}/adGroups/${agRows[0].ad_group.id}`;
  console.log(`Ad group encontrado: ${agRows[0].ad_group.name} (${agRN})\n`);

  const r = await customer.adGroupCriteria.create([{
    ad_group: agRN,
    status: enums.AdGroupCriterionStatus.ENABLED,
    keyword: { text: 'formol 37 inibido', match_type: enums.KeywordMatchType.PHRASE },
  }]);

  console.log(`✅ ${r.results.length} keyword adicionada: "formol 37 inibido" [PHRASE] → Formaldeído PA\n`);
  console.log('=== CONCLUÍDO ===');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
