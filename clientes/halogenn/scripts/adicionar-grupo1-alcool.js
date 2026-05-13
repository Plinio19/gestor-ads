/**
 * Keywords — Grupo 1: Álcool Etílico (1E + 96% confirmado + anidro + IPA extras)
 * Garimpo 06/05/2026
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

async function getAgRN(campName, agName) {
  const rows = await customer.query(`
    SELECT ad_group.id, ad_group.name
    FROM ad_group
    WHERE campaign.name = '${campName}'
      AND ad_group.name = '${agName}'
      AND ad_group.status = 'ENABLED'
  `);
  if (!rows.length) throw new Error(`AG não encontrado: ${agName} em ${campName}`);
  return `customers/${CID}/adGroups/${rows[0].ad_group.id}`;
}

async function addKws(label, agRN, termos) {
  console.log(`\n[${label}] ${termos.length} keywords para ${agRN}...`);
  try {
    const r = await customer.adGroupCriteria.create(termos.map(t => kw(agRN, t)));
    console.log(`  ✅ ${r.results.length} adicionadas`);
  } catch (e) {
    console.error(`  ❌ Erro: ${e.message}`);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }
  termos.forEach(t => console.log(`    ✓ "${t}" [PHRASE]`));
}

async function main() {
  console.log('=== ADICIONAR KEYWORDS GRUPO 1 — ÁLCOOL (garimpo 06/05/2026) ===\n');

  // ── 1E + 96% confirmado: Álcool Etílico PA-ACS ────────────────────────────
  const agEtilico = await getAgRN('[Busca] - Produtos Prioritários', 'Álcool Etílico PA-ACS');
  console.log(`  AG Álcool Etílico PA-ACS: ${agEtilico}`);

  await addKws('1E — Álcool Etílico / 95-96 / Anidro / Laboratorial', agEtilico, [
    // 96% PA — confirmado que Halogenn vende
    // 'alcool etilico 96' removido: bloqueia lote por ALCOHOL_SALE (sem acento)
    'alcool 96',
    'álcool 96',
    'álcool etílico 96',
    // 95%
    'alcool 95',
    'álcool 95',
    'álcool 95 onde comprar',
    'etanol 95',
    // Etanol 96
    'etanol 96',
    'alcool 96 gl',
    'álcool 96 gl',
    'alcool 96 gl preço',
    'álcool 96 graus',
    'álcool 96 inpm',
    // Anidro — Halogenn vende
    'álcool etílico anidro',
    'alcool anidro preço',
    'álcool anidro onde comprar',
    'onde comprar etanol anidro',
    // Laboratorial / PA
    'alcool etilico p a',
    'acs ethanol',
    'etoh pa',
    'etoh 96',
    // Comprar etanol
    'comprar etanol',
    'etanol comprar',
    'alcool etanol onde comprar',
    'etanol farmaceutico onde comprar',
    'onde comprar etanol puro',
  ]);

  // ── 1F: Álcool Isopropílico PA — keywords extras ──────────────────────────
  const agIPA = await getAgRN('[Busca] - Produtos Secundários', 'Álcool Isopropílico PA');
  console.log(`\n  AG Álcool Isopropílico PA: ${agIPA}`);

  await addKws('1F — IPA extras', agIPA, [
    'isopropanol',
    'álcool isopropílico 5l',
    'álcool isopropílico 5 litros',
    'álcool isopropílico puro',
    'álcool isopropílico p a',
    'álcool isopropílico 99 8',
    'onde comprar álcool isopropílico 99',
    'onde vende álcool isopropílico',
  ]);

  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
