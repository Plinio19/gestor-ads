require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const CAMPAIGN_ID = '22137404594';
const TARGET_ROAS = 8.0; // 8x = 800%

async function run() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Configurando Target ROAS — Linklab PMAX');
  console.log('═══════════════════════════════════════════════\n');

  // Verificar estado atual
  const [antes] = await customer.query(`
    SELECT
      campaign.id, campaign.name,
      campaign.bidding_strategy_type,
      campaign.maximize_conversion_value.target_roas
    FROM campaign
    WHERE campaign.id = '${CAMPAIGN_ID}'
  `);

  const roasAtual = antes.campaign.maximize_conversion_value?.target_roas;
  console.log(`  Campanha: ${antes.campaign.name}`);
  console.log(`  Target ROAS atual: ${roasAtual ? roasAtual + 'x (' + (roasAtual * 100).toFixed(0) + '%)' : 'Não definido (maximize sem piso)'}`);
  console.log(`  → Aplicando Target ROAS: ${TARGET_ROAS}x (${TARGET_ROAS * 100}%)\n`);

  // Aplicar
  await customer.campaigns.update([{
    resource_name: `customers/${CUSTOMER_ID}/campaigns/${CAMPAIGN_ID}`,
    maximize_conversion_value: {
      target_roas: TARGET_ROAS,
    },
  }]);

  // Verificar resultado
  const [depois] = await customer.query(`
    SELECT
      campaign.id, campaign.name,
      campaign.bidding_strategy_type,
      campaign.maximize_conversion_value.target_roas
    FROM campaign
    WHERE campaign.id = '${CAMPAIGN_ID}'
  `);

  const roasNovo = depois.campaign.maximize_conversion_value?.target_roas;
  if (roasNovo && Math.abs(roasNovo - TARGET_ROAS) < 0.01) {
    console.log(`  ✅ Target ROAS configurado: ${roasNovo}x (${(roasNovo * 100).toFixed(0)}%)`);
    console.log('\n  A PMAX agora não vai aceitar semanas abaixo de 8x ROAS.');
    console.log('  Google vai otimizar para manter o piso — pode reduzir volume');
    console.log('  em períodos fracos, mas protege o orçamento.\n');
  } else {
    console.log(`  ⚠️  Valor retornado: ${roasNovo} — verificar manualmente no Google Ads UI`);
  }

  console.log('═══════════════════════════════════════════════\n');
}

run().catch(e => { console.error('ERRO:', e?.message || e); process.exit(1); });
