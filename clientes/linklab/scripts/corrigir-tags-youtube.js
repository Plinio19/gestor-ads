require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });

// Tags YouTube que falharam
const YT_TAGS = [
  { id: 7002361134, nome: 'YouTube channel subscriptions' },
  { id: 7126493443, nome: 'YouTube follow-on views' },
];

async function tryUpdate(customerObj, tagId, tagNome, label) {
  try {
    await customerObj.conversionActions.update([{
      resource_name: `customers/${CUSTOMER_ID}/conversionActions/${tagId}`,
      primary_for_goal: false,
    }]);
    console.log(`  ✅ [${tagId}] ${tagNome} → SECUNDÁRIA (via ${label})`);
    return true;
  } catch (e) {
    // Tentar com updateMask explícito
    try {
      const { services } = require('google-ads-api');
      const op = {
        update_mask: { paths: ['primary_for_goal'] },
        update: {
          resource_name: `customers/${CUSTOMER_ID}/conversionActions/${tagId}`,
          primary_for_goal: false,
        }
      };
      const svc = customerObj.conversionActions;
      if (svc && typeof svc.mutate === 'function') {
        await svc.mutate([op]);
        console.log(`  ✅ [${tagId}] ${tagNome} → SECUNDÁRIA (via ${label} mutate)`);
        return true;
      }
    } catch (e2) {}
    console.log(`  ❌ [${tagId}] ${tagNome} via ${label}: ${e.message.split('\n')[0]}`);
    return false;
  }
}

async function run() {
  console.log('\n  🔧 Tentando corrigir tags YouTube...\n');

  // Tentativa 1: via conta direta
  const customerDireto = client.Customer({
    customer_id: CUSTOMER_ID,
    login_customer_id: LOGIN_CUSTOMER_ID,
    refresh_token: REFRESH_TOKEN,
  });

  // Tentativa 2: via MCC como cliente
  const customerMCC = client.Customer({
    customer_id: LOGIN_CUSTOMER_ID,
    refresh_token: REFRESH_TOKEN,
  });

  let todasOk = true;
  for (const tag of YT_TAGS) {
    let ok = await tryUpdate(customerDireto, tag.id, tag.nome, 'conta direta');
    if (!ok) ok = await tryUpdate(customerMCC, tag.id, tag.nome, 'MCC');
    if (!ok) todasOk = false;
  }

  // Verificar resultado
  console.log('\n  🔍 Estado final das tags primárias:\n');
  const r = await customerDireto.query(`
    SELECT conversion_action.id, conversion_action.name, conversion_action.primary_for_goal
    FROM conversion_action WHERE conversion_action.status != 'REMOVED'
    ORDER BY conversion_action.primary_for_goal DESC
  `);
  const primarias = r.filter(x => x.conversion_action.primary_for_goal);
  primarias.forEach(x => {
    const cv = x.conversion_action;
    const isYT = String(cv.name).toLowerCase().includes('youtube');
    console.log(`  ${isYT ? '⚠️ ' : '✅'} [${cv.id}] ${cv.name}`);
  });

  if (!todasOk) {
    console.log('\n  ─────────────────────────────────────────────────');
    console.log('  ⚠️  AÇÃO MANUAL NECESSÁRIA (2 min):');
    console.log('  ─────────────────────────────────────────────────');
    console.log('  As tags YouTube são geradas automaticamente pelo');
    console.log('  Google e podem ser read-only via API.');
    console.log('');
    console.log('  Para desmarcar manualmente:');
    console.log('  1. Acesse: ads.google.com');
    console.log('  2. Ferramentas → Medição → Conversões');
    console.log('  3. Clique em "YouTube channel subscriptions"');
    console.log('  4. Clique em "Editar configurações"');
    console.log('  5. Em "Incluir nos objetivos de conversão", selecione');
    console.log('     "Não usar como conversão principal"');
    console.log('  6. Repetir para "YouTube follow-on views"');
  }
}

run().catch(e => console.error('ERRO:', e.message));
