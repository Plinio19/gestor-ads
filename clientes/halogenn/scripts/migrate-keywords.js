/**
 * Migração de keywords da campanha antiga "Produtos Curva A" para as novas campanhas
 * + Pausa da campanha antiga
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

// Ad groups destino (novas campanhas)
const AG_FORMALDEIDO = 'customers/7877031919/adGroups/192585173741'; // Formaldeído PA
const AG_XILENO      = 'customers/7877031919/adGroups/192585173701'; // Xileno e Xilol PA

// Campanha antiga a pausar
const CAMP_ANTIGA = 'customers/7877031919/campaigns/23655823623';

function kw(adGroupResource, text, matchType) {
  return {
    ad_group: adGroupResource,
    status: enums.AdGroupCriterionStatus.ENABLED,
    keyword: { text, match_type: matchType },
  };
}

const EXACT  = enums.KeywordMatchType.EXACT;
const PHRASE = enums.KeywordMatchType.PHRASE;

// Keywords de Formaldeído — as que geraram tráfego real
const kwsFormaldeido = [
  kw(AG_FORMALDEIDO, 'formol 37',                    EXACT),
  kw(AG_FORMALDEIDO, 'formaldeido 37',               EXACT),
  kw(AG_FORMALDEIDO, 'formaldeido pa',               EXACT),
  kw(AG_FORMALDEIDO, 'formol pa',                    EXACT),
  kw(AG_FORMALDEIDO, 'formalina',                    EXACT),
  kw(AG_FORMALDEIDO, 'formol 37 pa',                 EXACT),
  kw(AG_FORMALDEIDO, 'formaldeido reagente',         PHRASE),
  kw(AG_FORMALDEIDO, 'comprar formaldeido',          PHRASE),
  kw(AG_FORMALDEIDO, 'formaldeido laboratorio',      PHRASE),
  kw(AG_FORMALDEIDO, 'formaldeído para histologia',  PHRASE),
  kw(AG_FORMALDEIDO, 'formol 37 para laboratório',   PHRASE),
  kw(AG_FORMALDEIDO, 'comprar formaldeído 37',       PHRASE),
  kw(AG_FORMALDEIDO, 'formol 37 onde comprar',       PHRASE),
  kw(AG_FORMALDEIDO, 'formaldeído 37 5 litros',      PHRASE),
  kw(AG_FORMALDEIDO, 'solução de formaldeído 37',    PHRASE),
];

// Keywords de Xileno — as que geraram tráfego real
const kwsXileno = [
  kw(AG_XILENO, 'xilol',                       EXACT),
  kw(AG_XILENO, 'xileno pa',                   EXACT),
  kw(AG_XILENO, 'xilol pa',                    EXACT),
  kw(AG_XILENO, 'xilol pa acs',                EXACT),
  kw(AG_XILENO, 'xileno pa acs',               EXACT),
  kw(AG_XILENO, 'xilol histologia',            EXACT),
  kw(AG_XILENO, 'xileno histologia',           EXACT),
  kw(AG_XILENO, 'xilol para histologia',       PHRASE),
  kw(AG_XILENO, 'xileno laboratório',          PHRASE),
  kw(AG_XILENO, 'xilol onde comprar',          PHRASE),
  kw(AG_XILENO, 'comprar xileno',              PHRASE),
  kw(AG_XILENO, 'xilol pa preço',              PHRASE),
  kw(AG_XILENO, 'xileno reagente',             PHRASE),
  kw(AG_XILENO, 'onde comprar xileno pa',      PHRASE),
];

async function main() {
  console.log('=== MIGRAÇÃO DE KEYWORDS + PAUSA DA CAMPANHA ANTIGA ===\n');

  // PASSO 1 — Adicionar keywords de Formaldeído
  console.log(`Passo 1: Adicionando ${kwsFormaldeido.length} keywords → AG Formaldeído PA...`);
  try {
    const r1 = await customer.adGroupCriteria.create(kwsFormaldeido);
    console.log(`  ✅ ${r1.results.length} keywords de Formaldeído adicionadas.`);
  } catch (e) {
    console.error('  ❌ Erro Formaldeído:', e.message);
  }

  // PASSO 2 — Adicionar keywords de Xileno
  console.log(`\nPasso 2: Adicionando ${kwsXileno.length} keywords → AG Xileno e Xilol PA...`);
  try {
    const r2 = await customer.adGroupCriteria.create(kwsXileno);
    console.log(`  ✅ ${r2.results.length} keywords de Xileno adicionadas.`);
  } catch (e) {
    console.error('  ❌ Erro Xileno:', e.message);
  }

  // PASSO 3 — Pausar campanha antiga
  console.log(`\nPasso 3: Pausando campanha antiga "Produtos Curva A – Reagentes PA"...`);
  try {
    await customer.campaigns.update([{
      resource_name: CAMP_ANTIGA,
      status: enums.CampaignStatus.PAUSED,
    }]);
    console.log('  ✅ Campanha antiga pausada com sucesso.');
  } catch (e) {
    console.error('  ❌ Erro ao pausar:', e.message);
  }

  console.log('\n=== CONCLUÍDO ===');
  console.log('Resumo:');
  console.log(`  • ${kwsFormaldeido.length} keywords → Formaldeído PA (Produtos Prioritários)`);
  console.log(`  • ${kwsXileno.length} keywords → Xileno e Xilol PA (Produtos Prioritários)`);
  console.log('  • Campanha "Produtos Curva A" pausada');
  console.log('\nPróximo passo: Monitorar tráfego nas novas campanhas nas próximas 24-48h.');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
