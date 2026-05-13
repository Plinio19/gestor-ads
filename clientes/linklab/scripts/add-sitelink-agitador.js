require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const ASSET_GROUP = '6561502364';
const PRODUTO_URL = 'https://www.lojalinklab.com.br/equipamentos/agitador-para-frascos/agitador-eletromagnetico-para-6-peneiras-timer-digital-ate-99-minutos';

async function run() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  Adicionando Sitelink — Agitador de Peneiras');
  console.log('══════════════════════════════════════════════════\n');

  // Verificar sitelinks já existentes no asset group
  const existentes = await customer.query(`
    SELECT asset.id, asset.sitelink_asset.link_text,
           asset_group_asset.field_type, asset_group_asset.status
    FROM asset_group_asset
    WHERE asset_group.id = '${ASSET_GROUP}'
      AND asset_group_asset.field_type = 'SITELINK'
      AND asset_group_asset.status != 'REMOVED'
  `);

  if (existentes.length) {
    console.log(`  Sitelinks já existentes (${existentes.length}):`);
    existentes.forEach(a => {
      const sl = a.asset?.sitelink_asset;
      console.log(`  → [${a.asset?.id}] "${sl?.link_text}"`);
    });
    console.log();
  } else {
    console.log('  (Nenhum sitelink configurado ainda)\n');
  }

  // Criar asset sitelink
  console.log('  Criando sitelink...');
  let assetRN;
  try {
    const res = await customer.assets.create([{
      sitelink_asset: {
        link_text: 'Agitador de Peneiras',
        description1: 'Timer Digital até 99 min',
        description2: 'Parcele em até 12x',
        final_urls: [PRODUTO_URL],
      },
    }]);
    assetRN = res.results?.[0]?.resource_name || res[0]?.resource_name;
    console.log(`  ✅ Asset criado: ${assetRN}\n`);
  } catch (e) {
    console.error(`  ❌ Erro ao criar: ${e?.message?.split('\n')[0]}`);
    process.exit(1);
  }

  // Vincular ao asset group
  console.log('  Vinculando ao asset group "Interesses Otimizados"...');
  try {
    await customer.assetGroupAssets.create([{
      asset_group: `customers/${CUSTOMER_ID}/assetGroups/${ASSET_GROUP}`,
      asset: assetRN,
      field_type: 'SITELINK',
    }]);
    console.log('  ✅ Sitelink vinculado!\n');
  } catch (e) {
    console.error(`  ❌ Erro ao vincular: ${e?.message?.split('\n')[0]}`);
    process.exit(1);
  }

  // Confirmar
  const conf = await customer.query(`
    SELECT asset.id, asset.sitelink_asset.link_text,
           asset_group_asset.field_type
    FROM asset_group_asset
    WHERE asset_group.id = '${ASSET_GROUP}'
      AND asset_group_asset.field_type = 'SITELINK'
      AND asset_group_asset.status != 'REMOVED'
  `);

  console.log(`  Sitelinks ativos no asset group (${conf.length}):`);
  conf.forEach(a => {
    const sl = a.asset?.sitelink_asset;
    console.log(`  ✅ "${sl?.link_text}"`);
  });

  console.log('\n  O Google agora pode rotear buscas de "agitador peneiras"');
  console.log('  direto para a página do produto, sem passar pela homepage.');
  console.log('\n══════════════════════════════════════════════════\n');
}

run().catch(e => { console.error('ERRO:', e?.message || e); process.exit(1); });
