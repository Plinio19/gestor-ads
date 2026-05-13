/**
 * Adiciona palavras negativas e novas keywords identificadas na varredura de 21/04/2026
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const client = new GoogleAdsApi({
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  developer_token: process.env.DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: process.env.CUSTOMER_ID,
  refresh_token: process.env.REFRESH_TOKEN,
  login_customer_id: '6017081450',
});

// Campanhas ativas
const CAMPS = {
  prioritarios:  'customers/7877031919/campaigns/23769809419',
  secundarios:   'customers/7877031919/campaigns/23769809422',
  nichos:        'customers/7877031919/campaigns/23769809425',
  marca:         'customers/7877031919/campaigns/23769809428',
};

// Ad groups destino para novas keywords
const AG = {
  alcoolEtilico:  'customers/7877031919/adGroups/192585173501',
  xileno:         'customers/7877031919/adGroups/192585173701',
  acidoCloridrico:'customers/7877031919/adGroups/195305603203',
  alcoolMetilico: 'customers/7877031919/adGroups/195305603243',
};

const EXACT  = enums.KeywordMatchType.EXACT;
const PHRASE = enums.KeywordMatchType.PHRASE;

function neg(campaignResource, text) {
  return {
    campaign: campaignResource,
    negative: true,
    keyword: { text, match_type: EXACT },
  };
}

function kw(adGroupResource, text, matchType) {
  return {
    ad_group: adGroupResource,
    status: enums.AdGroupCriterionStatus.ENABLED,
    keyword: { text, match_type: matchType },
  };
}

async function main() {
  console.log('=== NEGATIVAS + NOVAS KEYWORDS — 21/04/2026 ===\n');

  // PASSO 1 — Negativas em nível de campanha (todas as campanhas)
  const allCamps = Object.values(CAMPS);
  const negativas = [];
  for (const camp of allCamps) {
    negativas.push(neg(camp, 'o que é xilol'));
    negativas.push(neg(camp, 'o xilol'));
    negativas.push(neg(camp, 'o xilene'));
    negativas.push(neg(camp, 'densidade ácido clorídrico 37'));
    negativas.push(neg(camp, 'álcool etílico absoluto estéril 10ml'));
  }

  console.log(`Passo 1: Adicionando ${negativas.length} negativas (5 termos × 4 campanhas)...`);
  try {
    const r1 = await customer.campaignCriteria.create(negativas);
    console.log(`  ✅ ${r1.results.length} negativas adicionadas.`);
  } catch (e) {
    console.error('  ❌ Erro negativas:', e.message);
    if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
  }

  // PASSO 2 — Novas keywords (sinônimos técnicos)
  const novasKws = [
    // Álcool Etílico — sinônimos técnicos
    kw(AG.alcoolEtilico, 'etanol pa',   EXACT),
    kw(AG.alcoolEtilico, 'etanol p.a.', EXACT),
    kw(AG.alcoolEtilico, 'etanol pa',   PHRASE),

    // Ácido Clorídrico — nomenclatura química
    kw(AG.acidoCloridrico, 'hcl pa',  EXACT),
    kw(AG.acidoCloridrico, 'hcl 37',  EXACT),

    // Álcool Metílico — sinônimo técnico
    kw(AG.alcoolMetilico, 'metanol pa',   EXACT),
    kw(AG.alcoolMetilico, 'metanol p.a.', EXACT),

    // Xileno — adicionar como EXACT
    kw(AG.xileno, 'xileno', EXACT),
    kw(AG.xileno, 'xileno', PHRASE),
  ];

  console.log(`\nPasso 2: Adicionando ${novasKws.length} novas keywords...`);
  try {
    const r2 = await customer.adGroupCriteria.create(novasKws);
    console.log(`  ✅ ${r2.results.length} keywords adicionadas.`);
  } catch (e) {
    console.error('  ❌ Erro keywords:', e.message);
    if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
  }

  console.log('\n=== CONCLUÍDO ===');
  console.log('Negativas adicionadas:');
  console.log('  • "o que é xilol"');
  console.log('  • "o xilol"');
  console.log('  • "o xilene"');
  console.log('  • "densidade ácido clorídrico 37"');
  console.log('  • "álcool etílico absoluto estéril 10ml"');
  console.log('Novas keywords:');
  console.log('  • etanol pa / etanol p.a. → Álcool Etílico PA-ACS');
  console.log('  • hcl pa / hcl 37 → Ácido Clorídrico PA-ACS');
  console.log('  • metanol pa / metanol p.a. → Álcool Metílico PA-ACS');
  console.log('  • xileno (EXACT + PHRASE) → Xileno e Xilol PA');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
