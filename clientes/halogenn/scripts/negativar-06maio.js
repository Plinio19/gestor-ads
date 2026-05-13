/**
 * Negativas — 06/05/2026
 * Termos sem relação com os produtos (álcool benzílico, hidratado, alcool 96 liquido)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const CID = CUSTOMER_ID;
const PHRASE = enums.KeywordMatchType.PHRASE;

const CAMPS_ATIVAS = [
  `customers/${CID}/campaigns/23769809419`,
  `customers/${CID}/campaigns/23769809422`,
];

function neg(campaignRN, text) {
  return { campaign: campaignRN, negative: true, keyword: { text, match_type: PHRASE } };
}

async function main() {
  console.log('=== NEGATIVAS — 06/05/2026 ===\n');

  const negativaTermos = [
    'álcool benzílico',  // produto completamente diferente (álcool aromático)
    'álcool hidratado',  // 92,8% hidratado — doméstico, não PA absoluto
    'alcool 96 liquido', // qualificação doméstica, sem intenção analítica
  ];

  const negativas = [];
  for (const camp of CAMPS_ATIVAS) {
    for (const text of negativaTermos) {
      negativas.push(neg(camp, text));
    }
  }

  console.log(`Adicionando ${negativaTermos.length} negativas × 2 campanhas = ${negativas.length} critérios...`);
  try {
    const r = await customer.campaignCriteria.create(negativas);
    console.log(`  ✅ ${r.results.length} negativas adicionadas.\n`);
  } catch (e) {
    console.error('  ❌ Erro:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }

  console.log('Termos negativados:');
  negativaTermos.forEach(t => console.log(`  ❌ "${t}" [PHRASE]`));
  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
