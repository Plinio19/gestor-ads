/**
 * Reenvio Álcool Etílico PA-ACS — removidos 2 termos com policy ALCOHOL_SALE
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const CID = CUSTOMER_ID;
const PHRASE = enums.KeywordMatchType.PHRASE;
const ENABLED = enums.AdGroupCriterionStatus.ENABLED;

function kw(agRN, text) {
  return { ad_group: agRN, status: ENABLED, keyword: { text, match_type: PHRASE } };
}

async function main() {
  console.log('=== KEYWORDS ÁLCOOL — REENVIO SEM POLICY VIOLATIONS ===\n');

  const agRows = await customer.query(`
    SELECT ad_group.id, ad_group.name
    FROM ad_group
    WHERE campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
      AND ad_group.status = 'ENABLED'
  `);

  const AG = {};
  for (const r of agRows) AG[r.ad_group.name] = `customers/${CID}/adGroups/${r.ad_group.id}`;

  const agAlcool = AG['Álcool Etílico PA-ACS'];
  if (!agAlcool) { console.error('Ad group não encontrado'); process.exit(1); }

  // Removidos os 2 que causaram ALCOHOL_SALE policy:
  //   ❌ 'alcool etílico 99'    → coberto por 'álcool etílico 99' (com acento)
  //   ❌ 'alcool etilico 99 5'  → coberto por 'álcool etílico 99 5' (com acento)
  const termos = [
    'álcool absoluto 99 onde comprar',
    'álcool absoluto comprar',
    'álcool absoluto onde comprar',
    'onde comprar álcool absoluto',
    'onde comprar alcool anidro',
    'preço alcool absoluto',
    'álcool absoluto pa',
    'alcool absoluto pa',
    'álcool absoluto 99',
    'álcool absoluto 99 3',
    'álcool absoluto 99 5',
    'álcool absoluto 99 8',
    'alcool absoluto 99',
    'alcool absoluto 99 3',
    'alcool pa',
    'alcool p a',
    'álcool etílico 99',
    'álcool etílico 99 5',
    'álcool etílico 99 9',
    'álcool etílico absoluto 99 5',
    'álcool etílico p a',
    'alcool etílico absoluto',
    'alcool etílico pa',
    'alcool etilico 99',
    'alcool etilico 99 3',
    'alcool etilico p a',
    'etanol 99',
    'etanol 99 5',
    'etanol 99.9',
    'etanol absoluto',
    'etanol p a',
    'etanol pa preço',
    'álcool 99 5',
    'álcool 99 9',
    'álcool 99 onde comprar',
    'alcool 99 gl',
    'alcool absoluto 92',
    'alcool absoluto 96',
    'álcool 100 por cento',
  ];

  console.log(`Adicionando ${termos.length} keywords em Álcool Etílico PA-ACS...`);
  try {
    const batch = termos.map(t => kw(agAlcool, t));
    const r = await customer.adGroupCriteria.create(batch);
    console.log(`  ✅ ${r.results.length} keywords adicionadas.\n`);
  } catch (e) {
    console.error('  ❌ Erro:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }

  console.log('=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
