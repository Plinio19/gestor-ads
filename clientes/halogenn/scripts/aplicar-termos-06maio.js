/**
 * Negativas + Keywords — 06/05/2026 (análise termos de pesquisa)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const CID = CUSTOMER_ID;
const PHRASE = enums.KeywordMatchType.PHRASE;
const ENABLED = enums.AdGroupCriterionStatus.ENABLED;

const CAMPS = [
  `customers/${CID}/campaigns/23769809419`,
  `customers/${CID}/campaigns/23769809422`,
];

function neg(camp, text) {
  return { campaign: camp, negative: true, keyword: { text, match_type: PHRASE } };
}

function kw(agRN, text) {
  return { ad_group: agRN, status: ENABLED, keyword: { text, match_type: PHRASE } };
}

async function main() {
  console.log('=== NEGATIVAR + KEYWORDS — 06/05/2026 ===\n');

  // ─── 1. Negativas ────────────────────────────────────────────────────────
  const negativaTermos = [
    'álcool 70',              // cobre álcool 70 atacado, álcool 70 1 litro, distribuidora álcool 70
    'distribuidora de álcool', // quer distribuidor, não comprador direto
    'etanol sigma aldrich',   // concorrente Sigma-Aldrich
    'sigma aldrich merck',    // concorrentes
    'lab alley ethanol',      // marca americana, não buyer BR
    'alcool etilico 500ml',   // 500ml = varejo/farmácia, não B2B
    'formol para desinfecção', // uso doméstico, não PA laboratorial
    'fispq ácido clorídrico', // FISPQ = ficha de segurança, informacional
    'álcool propílico',       // 1-propanol — produto diferente, Halogenn não vende
  ];

  const negativas = [];
  for (const camp of CAMPS) {
    for (const text of negativaTermos) negativas.push(neg(camp, text));
  }

  console.log(`Adicionando ${negativaTermos.length} negativas × 2 campanhas = ${negativas.length} critérios...`);
  try {
    const r = await customer.campaignCriteria.create(negativas);
    console.log(`  ✅ ${r.results.length} negativas adicionadas.\n`);
  } catch (e) {
    console.error('  ❌ Erro:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }

  negativaTermos.forEach(t => console.log(`  ❌ "${t}" [PHRASE]`));

  // ─── 2. Keywords novas ───────────────────────────────────────────────────
  console.log('\nBuscando ad group Álcool Etílico PA-ACS...');
  const agRows = await customer.query(`
    SELECT ad_group.id, ad_group.name
    FROM ad_group
    WHERE campaign.name = '[Busca] - Produtos Prioritários'
      AND ad_group.name = 'Álcool Etílico PA-ACS'
      AND ad_group.status = 'ENABLED'
  `);

  if (!agRows.length) { console.error('  ❌ Ad group não encontrado'); process.exit(1); }
  const agRN = `customers/${CID}/adGroups/${agRows[0].ad_group.id}`;

  const novasKws = [
    'etanol grau hplc',      // grau HPLC = comprador técnico de alta pureza
    'etanol para laboratorio', // laboratorial + etanol = qualificado
  ];

  console.log(`\nAdicionando ${novasKws.length} keywords em Álcool Etílico PA-ACS...`);
  try {
    const r = await customer.adGroupCriteria.create(novasKws.map(t => kw(agRN, t)));
    console.log(`  ✅ ${r.results.length} keywords adicionadas.`);
  } catch (e) {
    console.error('  ❌ Erro:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }

  novasKws.forEach(t => console.log(`  ✓ "${t}" [PHRASE]`));
  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
