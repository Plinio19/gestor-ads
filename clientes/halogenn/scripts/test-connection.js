require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;

const missingVars = ['CLIENT_ID', 'CLIENT_SECRET', 'DEVELOPER_TOKEN', 'REFRESH_TOKEN', 'CUSTOMER_ID']
  .filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.error(`Erro: variáveis faltando no .env: ${missingVars.join(', ')}`);
  process.exit(1);
}

const client = new GoogleAdsApi({
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  developer_token: DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: CUSTOMER_ID,
  refresh_token: REFRESH_TOKEN,
});

const STATUS = {
  0: 'UNSPECIFIED',
  1: 'UNKNOWN',
  2: 'ENABLED',
  3: 'PAUSED',
  4: 'REMOVED',
};

const TIPO = {
  0: 'UNSPECIFIED',
  1: 'UNKNOWN',
  2: 'SEARCH',
  3: 'DISPLAY',
  4: 'SHOPPING',
  5: 'HOTEL',
  6: 'VIDEO',
  7: 'MULTI_CHANNEL',
  8: 'LOCAL',
  9: 'SMART',
  10: 'PERFORMANCE_MAX',
  11: 'LOCAL_SERVICES',
  12: 'DISCOVERY',
  13: 'TRAVEL',
  14: 'DEMAND_GEN',
};

async function listarCampanhas() {
  console.log(`\nConectando à conta ${CUSTOMER_ID}...\n`);

  const campanhas = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros
    FROM campaign
    ORDER BY campaign.name ASC
  `);

  if (campanhas.length === 0) {
    console.log('Nenhuma campanha encontrada na conta.');
    return;
  }

  console.log(`${campanhas.length} campanha(s) encontrada(s):\n`);
  console.log('─'.repeat(70));

  for (const row of campanhas) {
    const { campaign, metrics } = row;
    const custo = (metrics.cost_micros / 1_000_000).toFixed(2);

    console.log(`Nome:       ${campaign.name}`);
    console.log(`ID:         ${campaign.id}`);
    console.log(`Status:     ${STATUS[campaign.status] ?? campaign.status}`);
    console.log(`Tipo:       ${TIPO[campaign.advertising_channel_type] ?? campaign.advertising_channel_type}`);
    console.log(`Impressões: ${metrics.impressions}`);
    console.log(`Cliques:    ${metrics.clicks}`);
    console.log(`Custo:      R$ ${custo}`);
    console.log('─'.repeat(70));
  }
}

listarCampanhas().catch(err => {
  console.error('\nErro ao conectar:', err.message || err);
  process.exit(1);
});
