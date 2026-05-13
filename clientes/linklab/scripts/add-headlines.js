require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const ASSET_GROUP_ATIVO = '6561502364'; // Interesses Otimizados

// Headlines baseados nos top termos convertendo (varredura 23/04/2026):
// proveta plástico (13 conv), peneira granulométrica (13 conv), bombona 20L (6 conv/7 clicks),
// colilert ROAS 241x, inox ROAS 378x, centrifuga (alto volume)
const NOVOS_HEADLINES = [
  'Peneiras Granulométricas Inox',   // 29 chars — top converter 13 conv
  'Provetas Graduadas em Estoque',   // 29 chars — top converter 13 conv
  'Bombonas Graduadas até 20 L',     // 27 chars — CR absurda: 6 conv / 7 clicks
  'Colilert para Análise de Água',   // 29 chars — ROAS 241x Merchant Center
  'Equipamentos Inox para Lab',      // 26 chars — nicho estrela da conta
  'Vidraria e Plásticos para Lab',   // 29 chars — cobre béqueres, frascos, vidros
  'Béqueres e Frascos Reagentes',    // 28 chars — cobre buscas de vidraria genérica
  'Centrífugas Científicas',         // 23 chars — 304 cliques, alto volume
];

function verificarChars(headlines) {
  let ok = true;
  for (const h of headlines) {
    if (h.length > 30) {
      console.log(`  ❌ Muito longo (${h.length} chars): "${h}"`);
      ok = false;
    }
  }
  return ok;
}

async function run() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Adicionando Headlines de Produto — Linklab PMAX');
  console.log('═══════════════════════════════════════════════\n');

  // Validar tamanhos
  console.log('  Validando headlines (máx 30 chars cada):');
  NOVOS_HEADLINES.forEach(h => {
    const ok = h.length <= 30 ? '✅' : '❌';
    console.log(`  ${ok} "${h}" (${h.length} chars)`);
  });

  if (!verificarChars(NOVOS_HEADLINES)) {
    console.log('\n  ❌ Corrija os headlines acima antes de continuar.');
    process.exit(1);
  }

  // Verificar headlines existentes para não duplicar
  const existentes = await customer.query(`
    SELECT asset.text_asset.text
    FROM asset_group_asset
    WHERE asset_group.id = '${ASSET_GROUP_ATIVO}'
      AND asset_group_asset.field_type = 'HEADLINE'
      AND asset_group_asset.status != 'REMOVED'
  `);
  const textos = new Set(existentes.map(a => a.asset?.text_asset?.text?.toLowerCase().trim()));

  const paraAdicionar = NOVOS_HEADLINES.filter(h => !textos.has(h.toLowerCase().trim()));
  const jaExistem    = NOVOS_HEADLINES.filter(h =>  textos.has(h.toLowerCase().trim()));

  if (jaExistem.length) {
    console.log(`\n  (${jaExistem.length} já existem — pulando): ${jaExistem.join(', ')}`);
  }

  if (!paraAdicionar.length) {
    console.log('\n  ✅ Todos os headlines já estão no asset group!');
    process.exit(0);
  }

  console.log(`\n  Adicionando ${paraAdicionar.length} headlines novos...\n`);

  let ok = 0;
  let erros = 0;

  for (const texto of paraAdicionar) {
    try {
      // Criar asset de texto
      const criado = await customer.assets.create([{
        text_asset: { text: texto },
      }]);
      const assetRN = criado.results?.[0]?.resource_name || criado[0]?.resource_name;

      // Vincular ao asset group como HEADLINE
      await customer.assetGroupAssets.create([{
        asset_group: `customers/${CUSTOMER_ID}/assetGroups/${ASSET_GROUP_ATIVO}`,
        asset: assetRN,
        field_type: 'HEADLINE',
      }]);

      console.log(`  ✅ "${texto}"`);
      ok++;
    } catch (e) {
      console.log(`  ❌ "${texto}" — ${e?.message?.split('\n')[0] || e}`);
      erros++;
    }
  }

  // Resultado final
  const todos = await customer.query(`
    SELECT asset.text_asset.text
    FROM asset_group_asset
    WHERE asset_group.id = '${ASSET_GROUP_ATIVO}'
      AND asset_group_asset.field_type = 'HEADLINE'
      AND asset_group_asset.status != 'REMOVED'
  `);

  console.log(`\n  ─────────────────────────────────────────────`);
  console.log(`  Total de headlines no asset group: ${todos.length}/15`);
  console.log(`  Adicionados agora: ${ok} | Erros: ${erros}`);
  console.log(`  ─────────────────────────────────────────────\n`);
  todos.forEach(a => console.log(`  • ${a.asset?.text_asset?.text}`));
  console.log('\n═══════════════════════════════════════════════\n');
}

run().catch(e => { console.error('ERRO:', e?.message || e); process.exit(1); });
