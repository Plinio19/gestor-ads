/**
 * CRIAR ad group Álcool Isopropílico PA — 06/05/2026
 * Produto confirmado pelo gestor. Campanha: Produtos Secundários.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const CID = CUSTOMER_ID;
const BASE_URL = 'https://www.halogenn.com.br';
const CAMP_SECUNDARIOS = `customers/${CID}/campaigns/23769809422`;

const PHRASE = enums.KeywordMatchType.PHRASE;
const ENABLED_KW = enums.AdGroupCriterionStatus.ENABLED;

function H(t) {
  if (t.length > 30) throw new Error(`Headline muito longa (${t.length}): "${t}"`);
  return { text: t };
}
function D(t) {
  if (t.length > 90) throw new Error(`Description muito longa (${t.length}): "${t}"`);
  return { text: t };
}

async function main() {
  console.log('=== CRIAR AD GROUP — Álcool Isopropílico PA ===\n');

  // ─── 1. Criar o ad group ────────────────────────────────────────────────
  console.log('1. Criando ad group...');
  let agId, agRN;
  try {
    const r = await customer.adGroups.create([{
      campaign: CAMP_SECUNDARIOS,
      name: 'Álcool Isopropílico PA',
      status: enums.AdGroupStatus.ENABLED,
      type: enums.AdGroupType.SEARCH_STANDARD,
    }]);
    agRN = r.results[0].resource_name;
    agId = agRN.split('/').pop();
    console.log(`  ✅ Ad group criado: ${agRN}\n`);
  } catch (e) {
    console.error('  ❌ Erro ao criar ad group:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
    process.exit(1);
  }

  // ─── 2. Criar RSA ───────────────────────────────────────────────────────
  console.log('2. Criando RSA...');
  try {
    const r = await customer.adGroupAds.create([{
      ad_group: agRN,
      status: enums.AdGroupAdStatus.ENABLED,
      ad: {
        final_urls: [BASE_URL],
        responsive_search_ad: {
          headlines: [
            H('Álcool Isopropílico PA'),       // 22
            H('Isopropanol Grau Analítico'),    // 26
            H('IPA 99,5% PA-ACS'),             // 16
            H('Laudo de Qualidade Incluso'),   // 26
            H('Entrega para Todo o Brasil'),   // 26
            H('Para Laboratório e Indústria'), // 28
            H('Reagente de Alta Pureza'),      // 23
            H('Compra Segura Online'),         // 20
            H('Álcool Isopropílico 99%'),      // 23
          ],
          descriptions: [
            D('Álcool isopropílico PA 99,5% com laudo analítico. Ideal para laboratórios e indústrias.'), // 88
            D('Isopropanol grau analítico com certificado de pureza. Frete para todo o Brasil.'),          // 80
            D('Reagente de alta pureza com laudo incluso. Compre agora com segurança e qualidade.'),       // 83
          ],
        }
      }
    }]);
    console.log(`  ✅ RSA criado: ${r.results[0].resource_name}\n`);
  } catch (e) {
    console.error('  ❌ Erro ao criar RSA:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }

  // ─── 3. Adicionar keywords ──────────────────────────────────────────────
  console.log('3. Adicionando keywords...');
  const termos = [
    'álcool isopropílico',
    'alcool isopropilico',
    'álcool isopropílico pa',
    'isopropanol pa',
    'álcool isopropílico 99',
    'isopropanol grau analítico',
    'comprar álcool isopropílico',
    'onde comprar álcool isopropílico',
    'isopropanol 99',
    'isopropanol 99 5',
    'isopropanol acs',
    'ipa pa',
    'álcool isopropílico grau analítico',
  ];

  try {
    const batch = termos.map(t => ({
      ad_group: agRN,
      status: ENABLED_KW,
      keyword: { text: t, match_type: PHRASE },
    }));
    const r = await customer.adGroupCriteria.create(batch);
    console.log(`  ✅ ${r.results.length} keywords adicionadas.\n`);
    termos.forEach(t => console.log(`    ✓ "${t}" [PHRASE]`));
  } catch (e) {
    console.error('  ❌ Erro ao adicionar keywords:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }

  console.log('\n=== CONCLUÍDO ===\n');
  console.log(`Ad group ID: ${agId}`);
  console.log(`Resource name: ${agRN}`);
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
