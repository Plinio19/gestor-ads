require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

async function listar() {
  console.log('\n=== KEYWORDS ATIVAS — HALOGENN ===\n');
  console.log(`Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

  const rows = await customer.query(`
    SELECT
      campaign.name,
      ad_group.name,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status
    FROM ad_group_criterion
    WHERE ad_group_criterion.type = KEYWORD
      AND ad_group_criterion.negative = FALSE
      AND ad_group_criterion.status = ENABLED
      AND campaign.status = ENABLED
      AND campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
    ORDER BY ad_group.name, ad_group_criterion.keyword.text
  `);

  if (!rows.length) {
    console.log('Nenhuma keyword ativa encontrada.\n');
    return;
  }

  // Agrupar por ad group
  const grupos = {};
  for (const r of rows) {
    const ag = r.ad_group.name;
    if (!grupos[ag]) grupos[ag] = [];
    grupos[ag].push({
      texto: r.ad_group_criterion.keyword.text,
      tipo: r.ad_group_criterion.keyword.match_type,
      camp: r.campaign.name.replace('[Busca] - ', ''),
    });
  }

  let total = 0;
  for (const [ag, kws] of Object.entries(grupos).sort()) {
    console.log(`\n📁 ${ag} (${kws[0].camp})`);
    for (const k of kws) {
      const tipo = k.tipo === 2 ? 'EXACT' : k.tipo === 3 ? 'PHRASE' : 'BROAD';
      console.log(`   ${tipo.padEnd(7)} "${k.texto}"`);
      total++;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Total: ${total} keywords ativas em ${Object.keys(grupos).length} ad groups\n`);
}

listar().catch(e => { console.error('Erro:', e.message || e); process.exit(1); });
