/**
 * CRIAR ad group Hipoclorito de Sódio PA — 07/05/2026
 * Produto HL100.133 (NaOCl 10-12% PA-ACS). 4 leads acumulados sem cobertura.
 * Campanha: Produtos Secundários.
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
  console.log('=== CRIAR AD GROUP — Hipoclorito de Sódio PA ===\n');

  // ─── 1. Criar o ad group ────────────────────────────────────────────────────
  console.log('1. Criando ad group...');
  let agId, agRN;
  try {
    const r = await customer.adGroups.create([{
      campaign: CAMP_SECUNDARIOS,
      name: 'Hipoclorito de Sódio PA',
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

  // ─── 2. Criar RSA ───────────────────────────────────────────────────────────
  console.log('2. Criando RSA...');
  try {
    const r = await customer.adGroupAds.create([{
      ad_group: agRN,
      status: enums.AdGroupAdStatus.ENABLED,
      ad: {
        final_urls: [BASE_URL],
        responsive_search_ad: {
          headlines: [
            H('Hipoclorito de Sódio PA'),        // 25
            H('NaOCl 10-12% Grau Analítico'),    // 28
            H('Hipoclorito PA-ACS Certificado'), // 30
            H('Laudo de Qualidade Incluso'),     // 26
            H('Para Laboratório e Indústria'),   // 28
            H('Entrega para Todo o Brasil'),     // 26
            H('Reagente de Alta Pureza'),        // 23
            H('Compra Segura Online'),           // 20
            H('Hipoclorito de Sódio 10%'),       // 26
          ],
          descriptions: [
            D('Hipoclorito de sódio PA 10-12% com laudo analítico. Para labs e indústria.'),
            D('NaOCl grau analítico com certificado de pureza. Frete nacional.'),
            D('Reagente de alta pureza com laudo incluso. Atendemos CNPJ e laboratórios.'),
          ],
        }
      }
    }]);
    console.log(`  ✅ RSA criado: ${r.results[0].resource_name}\n`);
  } catch (e) {
    console.error('  ❌ Erro ao criar RSA:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }

  // ─── 3. Adicionar keywords ──────────────────────────────────────────────────
  console.log('3. Adicionando keywords...');
  const termos = [
    'hipoclorito de sódio pa',
    'hipoclorito de sodio pa',
    'hipoclorito de sódio pa-acs',
    'hipoclorito de sódio grau analítico',
    'hipoclorito de sódio analítico',
    'hipoclorito de sódio para laboratório',
    'hipoclorito de sódio laboratorial',
    'naocl pa',
    'naocl grau analítico',
    'hipoclorito de sódio 10',
    'hipoclorito de sódio 12',
    'hipoclorito 10 pa',
    'comprar hipoclorito de sódio pa',
    'onde comprar hipoclorito de sódio pa',
    'hipoclorito de sódio puro',
    'solução hipoclorito pa',
    'hipoclorito de sodio analitico',
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
