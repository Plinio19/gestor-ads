require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { getAuthClient } = require('../../../lib/auth-client');

async function testGA4() {
  console.log('\n=== Teste de Conexão — Google Analytics 4 ===\n');

  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    console.error('Erro: GA4_PROPERTY_ID não definido no .env');
    process.exit(1);
  }

  const auth = getAuthClient();
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

  // Relatório dos últimos 30 dias
  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'conversions' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    },
  });

  const rows = response.data.rows || [];
  console.log(`Property: ${propertyId}`);
  console.log(`Período: últimos 30 dias\n`);
  console.log('Sessões por canal:\n');
  console.log('─'.repeat(70));

  for (const row of rows) {
    const canal = row.dimensionValues[0].value;
    const sessions = row.metricValues[0].value;
    const users = row.metricValues[1].value;
    const bounce = (parseFloat(row.metricValues[2].value) * 100).toFixed(1);
    const duration = parseInt(row.metricValues[3].value);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const conversions = row.metricValues[4].value;

    console.log(`Canal:       ${canal}`);
    console.log(`Sessões:     ${sessions} | Usuários: ${users}`);
    console.log(`Rejeição:    ${bounce}% | Duração média: ${mins}m${secs}s`);
    console.log(`Conversões:  ${conversions}`);
    console.log('─'.repeat(70));
  }

  console.log('\nConexão com GA4 OK!');
}

testGA4().catch(err => {
  console.error('\nErro:', err.message || err);
  process.exit(1);
});
