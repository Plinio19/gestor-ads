/**
 * Aplicar negativas + keywords — garimpo 28/04/2026 (2ª rodada, análise PDF todo período)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const CID = CUSTOMER_ID;
const PHRASE = enums.KeywordMatchType.PHRASE;

const CAMPS_ATIVAS = [
  `customers/${CID}/campaigns/23769809419`, // [Busca] - Produtos Prioritários
  `customers/${CID}/campaigns/23769809422`, // [Busca] - Produtos Secundários
];

function neg(campaignRN, text) {
  return { campaign: campaignRN, negative: true, keyword: { text, match_type: PHRASE } };
}

function kw(adGroupRN, text) {
  return { ad_group: adGroupRN, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: PHRASE } };
}

async function main() {
  console.log('=== NEGATIVAS + KEYWORDS — 28/04/2026 (2ª RODADA) ===\n');

  const agRows = await customer.query(`
    SELECT ad_group.id, ad_group.name, campaign.name
    FROM ad_group
    WHERE campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
      AND ad_group.status = 'ENABLED'
  `);

  const AG = {};
  for (const r of agRows) {
    AG[r.ad_group.name] = `customers/${CID}/adGroups/${r.ad_group.id}`;
  }

  // 1. NEGATIVAS
  const negativaTermos = [
    'etanol merck',                       // marca concorrente Merck/Sigma-Aldrich
    'alcool absoluto prolink',            // marca Prolink
    'rialcool absoluto',                  // marca
    'álcool absoluto para que serve',     // informativo
    'álcool absoluto 70',                 // 70% = sanitizante, não PA absoluto
    'álcool 99 para que serve',           // informativo
    'álcool absoluto 99 3 para que serve',// informativo
    'o que é alcool absoluto',            // informativo
    'alcool absoluto ampola',             // uso médico/hospitalar
    'xileno densidade',                   // informativo técnico
  ];

  const negativas = [];
  for (const camp of CAMPS_ATIVAS) {
    for (const text of negativaTermos) {
      negativas.push(neg(camp, text));
    }
  }

  console.log(`Passo 1: Adicionando ${negativaTermos.length} negativas × 2 campanhas = ${negativas.length} critérios...`);
  try {
    const r = await customer.campaignCriteria.create(negativas);
    console.log(`  ✅ ${r.results.length} negativas adicionadas.\n`);
  } catch (e) {
    console.error('  ❌ Erro negativas:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
    console.log('');
  }

  // 2. KEYWORDS
  const novasKws = [];

  const agAlcool = AG['Álcool Etílico PA-ACS'];
  if (agAlcool) {
    novasKws.push(kw(agAlcool, 'alcool anidro 99'));
  } else console.warn('⚠️  "Álcool Etílico PA-ACS" não encontrado');

  const agH2SO4 = AG['Ácido Sulfúrico PA-ACS'];
  if (agH2SO4) {
    novasKws.push(kw(agH2SO4, 'acido sulfurico 95 98'));
  } else console.warn('⚠️  "Ácido Sulfúrico PA-ACS" não encontrado');

  const agXilol = AG['Xileno e Xilol PA'];
  if (agXilol) {
    novasKws.push(kw(agXilol, 'comprar xilol'));
  } else console.warn('⚠️  "Xileno e Xilol PA" não encontrado');

  const agParafina = AG['Parafina Histológica'];
  if (agParafina) {
    novasKws.push(kw(agParafina, 'parafina patologia'));
  } else console.warn('⚠️  "Parafina Histológica" não encontrado');

  const agEter = AG['Éter de Petróleo PA'];
  if (agEter) {
    novasKws.push(kw(agEter, 'eter pa'));
  } else console.warn('⚠️  "Éter de Petróleo PA" não encontrado');

  console.log(`Passo 2: Adicionando ${novasKws.length} keywords...`);
  try {
    const r = await customer.adGroupCriteria.create(novasKws);
    console.log(`  ✅ ${r.results.length} keywords adicionadas.\n`);
  } catch (e) {
    console.error('  ❌ Erro keywords:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`✅ NEGATIVAS (${negativaTermos.length} × 2 campanhas):`);
  negativaTermos.forEach(t => console.log(`  ❌ "${t}" [PHRASE]`));
  console.log('\n✅ KEYWORDS ADICIONADAS:');
  console.log('  ✅ alcool anidro 99 [PHRASE] → Álcool Etílico PA-ACS');
  console.log('  ✅ acido sulfurico 95 98 [PHRASE] → Ácido Sulfúrico PA-ACS');
  console.log('  ✅ comprar xilol [PHRASE] → Xileno e Xilol PA');
  console.log('  ✅ parafina patologia [PHRASE] → Parafina Histológica');
  console.log('  ✅ eter pa [PHRASE] → Éter de Petróleo PA');
  console.log('\n⚠️  MONITORAR: xilol xileno (decisão do gestor)');
  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
