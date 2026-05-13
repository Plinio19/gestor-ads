/**
 * Aplicar negativas + keywords — garimpo 28/04/2026
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const CID = CUSTOMER_ID;
const EXACT  = enums.KeywordMatchType.EXACT;
const PHRASE = enums.KeywordMatchType.PHRASE;

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
  console.log('=== NEGATIVAS + KEYWORDS — 28/04/2026 ===\n');

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
    // Álcool — perfil errado
    { text: 'alcool absoluto esteril',           match: PHRASE },
    // Xileno/Xilol — informativos e técnicos sem intenção de compra
    { text: 'fispq xileno',                      match: PHRASE },
    { text: 'fispq xilol',                       match: PHRASE },
    { text: 'xileno fispq',                      match: PHRASE },
    { text: 'xileno fds',                        match: PHRASE },
    { text: 'o que e xilol',                     match: PHRASE },
    { text: 'o que e xileno',                    match: PHRASE },
    { text: 'o que é xileno',                    match: PHRASE },
    { text: 'para que serve o xilol',            match: PHRASE },
    { text: 'para que serve xilol',              match: PHRASE },
    { text: 'xilol para que serve',              match: PHRASE },
    { text: 'xileno bula',                       match: PHRASE },
    { text: 'xileno toxicidade',                 match: PHRASE },
    { text: 'xileno molecula',                   match: PHRASE },
    { text: 'xileno quimica organica',           match: PHRASE },
    { text: 'uso de xileno',                     match: PHRASE },
    { text: 'xilene',                            match: EXACT  },
    { text: 'xileni',                            match: EXACT  },
    { text: 'xilou',                             match: EXACT  },
    { text: 'cas xileno',                        match: PHRASE },
    { text: 'cas1330 20 7',                      match: PHRASE },
    { text: 'densidade do xilol',                match: PHRASE },
    { text: 'xileno sulfonato de sodio',         match: PHRASE }, // já negativado 23/04, reapareceu
    // Formaldeído — informativos
    { text: 'formol 37 para que serve',          match: PHRASE },
    { text: 'formalina o que é',                 match: PHRASE },
    { text: 'o que é formalina',                 match: PHRASE },
    { text: 'formol inibido 37 para que serve',  match: PHRASE },
    // Ácido Sulfúrico / HCl — informativos técnicos
    { text: 'ph acido sulfurico 98',             match: PHRASE },
    { text: 'densidade do hcl 37',               match: PHRASE },
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
    novasKws.push(kw(agAlcool, 'etanol absoluto pa',   PHRASE));
    novasKws.push(kw(agAlcool, 'álcool 99 farmácia',   PHRASE)); // farmácias compram álcool PA
  } else console.warn('  ⚠️  Ad group "Álcool Etílico PA-ACS" não encontrado');

  const agHCl = AG['Ácido Clorídrico PA-ACS'];
  if (agHCl) {
    novasKws.push(kw(agHCl, 'acido cloridrico 37 pa', PHRASE));
  } else console.warn('  ⚠️  Ad group "Ácido Clorídrico PA-ACS" não encontrado');

  const agH2SO4 = AG['Ácido Sulfúrico PA-ACS'];
  if (agH2SO4) {
    novasKws.push(kw(agH2SO4, 'ácido sulfúrico 98 comprar', PHRASE));
  } else console.warn('  ⚠️  Ad group "Ácido Sulfúrico PA-ACS" não encontrado');

  const agFormol = AG['Formaldeído PA'];
  if (agFormol) {
    novasKws.push(kw(agFormol, 'formol estabilizado 37', PHRASE));
  } else console.warn('  ⚠️  Ad group "Formaldeído PA" não encontrado');

  const agXilol = AG['Xileno e Xilol PA'];
  if (agXilol) {
    novasKws.push(kw(agXilol, 'venda de xilol', PHRASE));
  } else console.warn('  ⚠️  Ad group "Xileno e Xilol PA" não encontrado');

  const agParafina = AG['Parafina Histológica'];
  if (agParafina) {
    novasKws.push(kw(agParafina, 'bloco de parafina histológica', PHRASE));
    novasKws.push(kw(agParafina, 'parafina de laboratorio',       PHRASE));
  } else console.warn('  ⚠️  Ad group "Parafina Histológica" não encontrado');

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
  console.log('='.repeat(60));
  console.log(`✅ NEGATIVAS APLICADAS (${negativaTermos.length} × 2 campanhas):`);
  negativaTermos.forEach(t => console.log(`  ❌ "${t.text}" [${t.match === EXACT ? 'EXACT' : 'PHRASE'}]`));
  console.log('\n✅ KEYWORDS ADICIONADAS:');
  const kwSummary = [
    'etanol absoluto pa [PHRASE] → Álcool Etílico PA-ACS',
    'álcool 99 farmácia [PHRASE] → Álcool Etílico PA-ACS',
    'acido cloridrico 37 pa [PHRASE] → Ácido Clorídrico PA-ACS',
    'ácido sulfúrico 98 comprar [PHRASE] → Ácido Sulfúrico PA-ACS',
    'formol estabilizado 37 [PHRASE] → Formaldeído PA',
    'venda de xilol [PHRASE] → Xileno e Xilol PA',
    'bloco de parafina histológica [PHRASE] → Parafina Histológica',
    'parafina de laboratorio [PHRASE] → Parafina Histológica',
  ];
  kwSummary.forEach(s => console.log(`  ✅ ${s}`));
  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
