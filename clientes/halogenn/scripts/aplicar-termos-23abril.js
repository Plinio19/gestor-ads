/**
 * Aplicar negativas + keywords identificadas no garimpo de 23/04/2026
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

// Campanhas ativas (nichos e marca foram pausadas hoje)
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
  console.log('=== NEGATIVAS + KEYWORDS — Garimpo 23/04/2026 ===\n');

  // 1. Buscar IDs dos ad groups dinamicamente
  console.log('Buscando IDs dos ad groups...');
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
  for (const [nome, rn] of Object.entries(AG)) console.log(`  • ${nome}`);
  console.log('');

  // 2. NEGATIVAS — termos identificados no garimpo
  const negativaTermos = [
    // Inglês / estrangeiro
    { text: 'xylene',                                       match: BROAD  },
    { text: 'xylol',                                        match: BROAD  },
    { text: 'xylene chemical',                              match: PHRASE },
    { text: 'hydrochloric acid fuming 37',                  match: PHRASE },
    { text: 'acido clorhidrico 37',                         match: PHRASE },
    { text: 'solvente xilol precio',                        match: PHRASE },
    // Busca técnica (FISPQ, FDS, CAS) — não compradores
    { text: 'fds xilol',                                    match: PHRASE },
    { text: 'xilol fispq',                                  match: PHRASE },
    { text: 'cas xilol',                                    match: PHRASE },
    { text: 'xilol molecula',                               match: PHRASE },
    { text: 'fds hcl 37',                                   match: PHRASE },
    // Concorrentes
    { text: 'hcl 37 sigma',                                 match: PHRASE },
    { text: 'paraplast plus',                               match: PHRASE },
    { text: 'dilutec industria e comercio de produtos quimicos', match: PHRASE },
    { text: 'quimica zew',                                  match: PHRASE },
  ];

  const negativas = [];
  for (const camp of CAMPS_ATIVAS) {
    for (const t of negativaTermos) {
      negativas.push(neg(camp, t.text, t.match));
    }
  }

  console.log(`Passo 1: Adicionando ${negativaTermos.length} negativas × ${CAMPS_ATIVAS.length} campanhas = ${negativas.length} critérios...`);
  try {
    const r = await customer.campaignCriteria.create(negativas);
    console.log(`  ✅ ${r.results.length} negativas adicionadas.\n`);
  } catch (e) {
    console.error('  ❌ Erro negativas:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
    console.log('');
  }

  // 3. KEYWORDS — novas keywords por ad group
  const novasKws = [];

  // Formaldeído PA
  const agFormol = AG['Formaldeído PA'];
  if (agFormol) {
    novasKws.push(kw(agFormol, 'formaldeído pa',      EXACT));
    novasKws.push(kw(agFormol, 'formalina',           PHRASE));
    novasKws.push(kw(agFormol, 'formol 37',           PHRASE));
    novasKws.push(kw(agFormol, 'formol inibido 37',   PHRASE));
  } else console.warn('  ⚠️  Ad group "Formaldeído PA" não encontrado');

  // Xileno e Xilol PA
  const agXileno = AG['Xileno e Xilol PA'];
  if (agXileno) {
    novasKws.push(kw(agXileno, 'xilol para histologia', PHRASE));
    novasKws.push(kw(agXileno, 'xilol comprar',         PHRASE));
    novasKws.push(kw(agXileno, 'xileno comprar',        PHRASE));
  } else console.warn('  ⚠️  Ad group "Xileno e Xilol PA" não encontrado');

  // Acetona PA-ACS
  const agAcetona = AG['Acetona PA-ACS'];
  if (agAcetona) {
    novasKws.push(kw(agAcetona, 'acetona acs', PHRASE));
  } else console.warn('  ⚠️  Ad group "Acetona PA-ACS" não encontrado');

  // Álcool Etílico PA-ACS
  const agAlcool = AG['Álcool Etílico PA-ACS'];
  if (agAlcool) {
    novasKws.push(kw(agAlcool, 'álcool etílico absoluto', PHRASE));
  } else console.warn('  ⚠️  Ad group "Álcool Etílico PA-ACS" não encontrado');

  // Ácido Clorídrico PA-ACS
  const agHCl = AG['Ácido Clorídrico PA-ACS'];
  if (agHCl) {
    novasKws.push(kw(agHCl, 'ácido clorídrico 37', PHRASE));
  } else console.warn('  ⚠️  Ad group "Ácido Clorídrico PA-ACS" não encontrado');

  console.log(`Passo 2: Adicionando ${novasKws.length} novas keywords...`);
  try {
    const r = await customer.adGroupCriteria.create(novasKws);
    console.log(`  ✅ ${r.results.length} keywords adicionadas.\n`);
  } catch (e) {
    console.error('  ❌ Erro keywords:', e.message);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
    console.log('');
  }

  // 4. Resumo
  console.log('='.repeat(55));
  console.log('✅ NEGATIVAS APLICADAS (ambas campanhas ativas):');
  negativaTermos.forEach(t => console.log(`  ❌ "${t.text}" [${t.match === BROAD ? 'BROAD' : 'PHRASE'}]`));
  console.log('\n✅ KEYWORDS ADICIONADAS:');
  const kwSummary = [
    'formaldeído pa [EXACT] → Formaldeído PA',
    'formalina [PHRASE] → Formaldeído PA',
    'formol 37 [PHRASE] → Formaldeído PA',
    'formol inibido 37 [PHRASE] → Formaldeído PA',
    'xilol para histologia [PHRASE] → Xileno e Xilol PA',
    'xilol comprar [PHRASE] → Xileno e Xilol PA',
    'xileno comprar [PHRASE] → Xileno e Xilol PA',
    'acetona acs [PHRASE] → Acetona PA-ACS',
    'álcool etílico absoluto [PHRASE] → Álcool Etílico PA-ACS',
    'ácido clorídrico 37 [PHRASE] → Ácido Clorídrico PA-ACS',
  ];
  kwSummary.forEach(s => console.log(`  ✅ "${s}"`));
  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
