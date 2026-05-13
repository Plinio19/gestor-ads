require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const CAMPAIGN_ID   = '22137404594';
const ASSET_GROUP_ATIVO = '6561502364'; // Interesses Otimizados (ATIVO)

async function run() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Configurando CTA "Comprar agora" — Linklab PMAX');
  console.log('═══════════════════════════════════════════════\n');

  // Passo 1: verificar se já existe CTA no asset group
  const assets = await customer.query(`
    SELECT asset.id, asset.type, asset.call_to_action_asset.call_to_action,
           asset_group_asset.field_type, asset_group_asset.status
    FROM asset_group_asset
    WHERE asset_group.id = '${ASSET_GROUP_ATIVO}'
      AND asset_group_asset.field_type = 'CALL_TO_ACTION_SELECTION'
      AND asset_group_asset.status != 'REMOVED'
  `);

  if (assets.length > 0) {
    console.log('  CTA atual no asset group:');
    assets.forEach(a => {
      console.log(`  → [${a.asset?.id}] ${a.asset?.call_to_action_asset?.call_to_action || '(sem valor definido)'}`);
    });
    console.log('\n  Removendo CTA existente para substituir...\n');

    // Remover CTAs existentes
    const removes = assets.map(a => ({
      remove: `customers/${CUSTOMER_ID}/assetGroupAssets/${ASSET_GROUP_ATIVO}~${a.asset.id}~CALL_TO_ACTION_SELECTION`,
    }));
    try {
      await customer.assetGroupAssets.mutate(removes);
      console.log('  ✅ CTA anterior removido.\n');
    } catch(e) {
      console.log(`  ⚠️  Não foi possível remover CTA anterior: ${e?.message?.split('\n')[0]}`);
    }
  } else {
    console.log('  (Nenhum CTA configurado atualmente — adicionando pela primeira vez)\n');
  }

  // Passo 2: criar asset de CTA
  console.log('  Criando asset CTA "SHOP_NOW" (Comprar agora)...');
  let assetResourceName;
  try {
    const res = await customer.assets.create([{
      call_to_action_asset: {
        call_to_action: 'SHOP_NOW', // "Comprar agora" em PT-BR
      },
    }]);
    assetResourceName = res.results?.[0]?.resource_name || res[0]?.resource_name;
    console.log(`  ✅ Asset criado: ${assetResourceName}\n`);
  } catch(e) {
    console.error(`  ❌ Erro ao criar asset: ${e?.message?.split('\n')[0]}`);
    process.exit(1);
  }

  // Passo 3: vincular ao asset group
  console.log('  Vinculando CTA ao asset group "Interesses Otimizados"...');
  try {
    await customer.assetGroupAssets.create([{
      asset_group: `customers/${CUSTOMER_ID}/assetGroups/${ASSET_GROUP_ATIVO}`,
      asset: assetResourceName,
      field_type: 'CALL_TO_ACTION_SELECTION',
    }]);
    console.log('  ✅ CTA vinculado com sucesso!\n');
  } catch(e) {
    console.error(`  ❌ Erro ao vincular: ${e?.message?.split('\n')[0]}`);
    process.exit(1);
  }

  // Passo 4: confirmar
  const confirmacao = await customer.query(`
    SELECT asset.id, asset.type, asset.call_to_action_asset.call_to_action,
           asset_group_asset.field_type
    FROM asset_group_asset
    WHERE asset_group.id = '${ASSET_GROUP_ATIVO}'
      AND asset_group_asset.field_type = 'CALL_TO_ACTION_SELECTION'
      AND asset_group_asset.status != 'REMOVED'
  `);

  console.log('  Verificação final:');
  if (confirmacao.length > 0) {
    confirmacao.forEach(a => {
      console.log(`  ✅ CTA ativo: ${a.asset?.call_to_action_asset?.call_to_action}`);
    });
    console.log('\n  Google vai exibir "Comprar agora" nos anúncios da PMAX.');
  } else {
    console.log('  ⚠️  Não foi possível confirmar via API — verificar no Google Ads UI');
    console.log('  Caminho: Campanhas → PMAX → Asset groups → Interesses Otimizados → CTA');
  }

  console.log('\n═══════════════════════════════════════════════\n');
}

run().catch(e => { console.error('ERRO:', e?.message || e); process.exit(1); });
