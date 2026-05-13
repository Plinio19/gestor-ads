/**
 * CRIAR ad group Tolueno PA — 06/05/2026
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
  if (t.length > 30) throw new Error(`Headline longa (${t.length}): "${t}"`);
  return { text: t };
}
function D(t) {
  if (t.length > 90) throw new Error(`Description longa (${t.length}): "${t}"`);
  return { text: t };
}

async function main() {
  console.log('=== CRIAR AD GROUP — Tolueno PA ===\n');

  // ─── 1. Ad group ────────────────────────────────────────────────────────
  console.log('1. Criando ad group...');
  let agRN, agId;
  try {
    const r = await customer.adGroups.create([{
      campaign: CAMP_SECUNDARIOS,
      name: 'Tolueno PA',
      status: enums.AdGroupStatus.ENABLED,
      type: enums.AdGroupType.SEARCH_STANDARD,
    }]);
    agRN = r.results[0].resource_name;
    agId = agRN.split('/').pop();
    console.log(`  ✅ Ad group criado: ${agRN}\n`);
  } catch (e) {
    console.error('  ❌ Erro:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
    process.exit(1);
  }

  // ─── 2. RSA ─────────────────────────────────────────────────────────────
  console.log('2. Criando RSA...');
  try {
    const r = await customer.adGroupAds.create([{
      ad_group: agRN,
      status: enums.AdGroupAdStatus.ENABLED,
      ad: {
        final_urls: [BASE_URL],
        responsive_search_ad: {
          headlines: [
            H('Tolueno PA'),                     // 10
            H('Tolueno Grau Analítico'),          // 22
            H('Tolueno PA-ACS'),                  // 14
            H('Solvente Orgânico PA'),            // 20
            H('Laudo de Qualidade Incluso'),      // 26
            H('Entrega para Todo o Brasil'),      // 26
            H('Tolueno para Laboratório'),        // 24
            H('Reagente de Alta Pureza'),         // 23
            H('Compra Segura Online'),            // 20
          ],
          descriptions: [
            D('Tolueno PA-ACS para laboratório com laudo analítico incluso. Entrega para todo o Brasil.'), // 88
            D('Solvente tolueno grau analítico com certificado de pureza. Frete para todo o Brasil.'),     // 84
            D('Reagente de alta pureza com laudo incluso. Compre agora com segurança e qualidade.'),       // 83
          ],
        }
      }
    }]);
    console.log(`  ✅ RSA criado: ${r.results[0].resource_name}\n`);
  } catch (e) {
    console.error('  ❌ Erro RSA:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }

  // ─── 3. Keywords ────────────────────────────────────────────────────────
  console.log('3. Adicionando keywords...');
  const termos = [
    'tolueno pa',
    'tolueno pa-acs',
    'tolueno grau analítico',
    'tolueno puro',
    'comprar tolueno',
    'onde comprar tolueno',
    'tolueno para laboratório',
    'tolueno p a',
    'tolueno acs',
    'tolueno analítico',
    'solvente tolueno pa',
    'toluol pa',
  ];
  try {
    const r = await customer.adGroupCriteria.create(
      termos.map(t => ({ ad_group: agRN, status: ENABLED_KW, keyword: { text: t, match_type: PHRASE } }))
    );
    console.log(`  ✅ ${r.results.length} keywords adicionadas.`);
    termos.forEach(t => console.log(`    ✓ "${t}" [PHRASE]`));
  } catch (e) {
    console.error('  ❌ Erro keywords:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }

  console.log(`\nAG ID: ${agId} | RN: ${agRN}`);
  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
