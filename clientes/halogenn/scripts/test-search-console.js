require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { getAuthClient } = require('../../../lib/auth-client');

async function testSearchConsole() {
  console.log('\n=== Teste de Conexão — Google Search Console ===\n');

  const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
  if (!siteUrl) {
    console.error('Erro: SEARCH_CONSOLE_SITE_URL não definido no .env');
    process.exit(1);
  }

  const auth = getAuthClient();
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  // Listar propriedades verificadas
  const sitesRes = await searchconsole.sites.list();
  const sites = sitesRes.data.siteEntry || [];

  console.log(`Propriedades verificadas: ${sites.length}`);
  sites.forEach(s => console.log(`  • ${s.siteUrl} [${s.permissionLevel}]`));
  console.log('');

  // Top 10 queries dos últimos 28 dias
  const queryRes = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() - 28);
        return d.toISOString().slice(0, 10);
      })(),
      endDate: new Date().toISOString().slice(0, 10),
      dimensions: ['query'],
      rowLimit: 10,
      orderBys: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
    },
  });

  const rows = queryRes.data.rows || [];
  console.log(`Top 10 termos orgânicos (últimos 28 dias):\n`);
  console.log('─'.repeat(60));

  rows.forEach((row, i) => {
    console.log(`${i + 1}. "${row.keys[0]}"`);
    console.log(`   Cliques: ${row.clicks} | Impressões: ${row.impressions} | CTR: ${(row.ctr * 100).toFixed(1)}% | Posição: ${row.position.toFixed(1)}`);
  });

  console.log('\nConexão com Search Console OK!');
}

testSearchConsole().catch(err => {
  console.error('\nErro:', err.message || err);
  process.exit(1);
});
