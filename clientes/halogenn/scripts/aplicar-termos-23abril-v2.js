/**
 * Aplicar negativas + keywords — garimpo 23/04/2026 (2ª rodada, após análise PDF)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const CID = CUSTOMER_ID;
const EXACT  = enums.KeywordMatchType.EXACT;
const PHRASE = enums.KeywordMatchType.PHRASE;
const BROAD  = enums.KeywordMatchType.BROAD;

const CAMPS_ATIVAS = [
  `customers/${CID}/campaigns/23769809419`, // [Busca] - Produtos Prioritários
  `customers/${CID}/campaigns/23769809422`, // [Busca] - Produtos Secundários
];

function neg(campaignRN, text, matchType = PHRASE) {
  return { campaign: campaignRN, negative: true, keyword: { text, match_type: matchType } };
}

function kw(adGroupRN, text, matchType = PHRASE) {
  return { ad_group: adGroupRN, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: matchType } };
}

async function main() {
  console.log('=== NEGATIVAS + KEYWORDS — 2ª Rodada 23/04/2026 ===\n');

  // Buscar IDs dos ad groups dinamicamente
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

  console.log('Ad groups encontrados:');
  for (const [nome] of Object.entries(AG)) console.log(`  • ${nome}`);
  console.log('');

  // 1. NEGATIVAS
  const negativaTermos = [
    { text: 'xileno o que é',           match: PHRASE },
    { text: 'cola xilol',               match: PHRASE },
    { text: 'xileno sulfonato de sódio',match: PHRASE },
    { text: 'para xileno',              match: PHRASE },
    { text: 'ksilen',                   match: BROAD  },
    { text: 'cas 1330 20 7',            match: PHRASE },
    { text: 'formol 37 mercado livre',  match: PHRASE },
    { text: 'parafina leica',           match: PHRASE },
    { text: 'densidade hcl 37',         match: PHRASE },
  ];

  const negativas = [];
  for (const camp of CAMPS_ATIVAS) {
    for (const t of negativaTermos) {
      negativas.push(neg(camp, t.text, t.match));
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
    novasKws.push(kw(agAlcool, 'alcool etilico pa', PHRASE));
  } else console.warn('  ⚠️  Ad group "Álcool Etílico PA-ACS" não encontrado');

  const agHCl = AG['Ácido Clorídrico PA-ACS'];
  if (agHCl) {
    novasKws.push(kw(agHCl, 'ácido clorídrico pa', PHRASE));
  } else console.warn('  ⚠️  Ad group "Ácido Clorídrico PA-ACS" não encontrado');

  const agH2SO4 = AG['Ácido Sulfúrico PA-ACS'];
  if (agH2SO4) {
    novasKws.push(kw(agH2SO4, 'acido sulfurico pa', PHRASE));
  } else console.warn('  ⚠️  Ad group "Ácido Sulfúrico PA-ACS" não encontrado');

  const agMetanol = AG['Álcool Metílico PA-ACS'];
  if (agMetanol) {
    novasKws.push(kw(agMetanol, 'alcool metilico pa', PHRASE));
    novasKws.push(kw(agMetanol, 'metanol acs',        PHRASE));
  } else console.warn('  ⚠️  Ad group "Álcool Metílico PA-ACS" não encontrado');

  const agXilol = AG['Xileno e Xilol PA'];
  if (agXilol) {
    novasKws.push(kw(agXilol, 'onde comprar xilol', PHRASE));
    novasKws.push(kw(agXilol, 'xilol venda',        PHRASE));
  } else console.warn('  ⚠️  Ad group "Xileno e Xilol PA" não encontrado');

  const agFormol = AG['Formaldeído PA'];
  if (agFormol) {
    novasKws.push(kw(agFormol, 'onde comprar formol 37', PHRASE));
    novasKws.push(kw(agFormol, 'comprar formol 37',      PHRASE));
  } else console.warn('  ⚠️  Ad group "Formaldeído PA" não encontrado');

  console.log(`Passo 2: Adicionando ${novasKws.length} keywords...`);
  try {
    const r = await customer.adGroupCriteria.create(novasKws);
    console.log(`  ✅ ${r.results.length} keywords adicionadas.\n`);
  } catch (e) {
    console.error('  ❌ Erro keywords:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
    console.log('');
  }

  // Resumo
  console.log('='.repeat(55));
  console.log('✅ NEGATIVAS APLICADAS (ambas campanhas ativas):');
  negativaTermos.forEach(t => console.log(`  ❌ "${t.text}" [${t.match === BROAD ? 'BROAD' : 'PHRASE'}]`));
  console.log('\n✅ KEYWORDS ADICIONADAS:');
  const kwSummary = [
    'alcool etilico pa [PHRASE] → Álcool Etílico PA-ACS',
    'ácido clorídrico pa [PHRASE] → Ácido Clorídrico PA-ACS',
    'acido sulfurico pa [PHRASE] → Ácido Sulfúrico PA-ACS',
    'alcool metilico pa [PHRASE] → Álcool Metílico PA-ACS',
    'metanol acs [PHRASE] → Álcool Metílico PA-ACS',
    'onde comprar xilol [PHRASE] → Xileno e Xilol PA',
    'xilol venda [PHRASE] → Xileno e Xilol PA',
    'onde comprar formol 37 [PHRASE] → Formaldeído PA',
    'comprar formol 37 [PHRASE] → Formaldeído PA',
  ];
  kwSummary.forEach(s => console.log(`  ✅ ${s}`));
  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
