require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

// ─────────────────────────────────────────────────────────────
// DECISÃO: quais tags ficam PRIMÁRIAS
//
// PRIMÁRIAS (2 tags de compra, métodos diferentes):
//   [7071767914] Conversão automática tray  → nativa Tray (mais confiável)
//   [6779785893] Loja Linklab (web) purchase → GA4 import (padrão Google)
//
// SECUNDÁRIAS (todas as demais):
//   [6660035646] [AO5] Compra - Site         → tag antiga de agência anterior
//   [6779678797] ADICIONAR CARRINHO (DINO)   → micro-conversão, não venda
//   [6782454419] FINALIZAÇÃO COMPRA (DINO)   → checkout, não venda finalizada
//   [6813104769] Calls from ads              → ligação, não compra
//   [7002361134] YouTube channel subscriptions → irrelevante para e-commerce
//   [7126493443] YouTube follow-on views     → irrelevante para e-commerce
// ─────────────────────────────────────────────────────────────

const MANTER_PRIMARIAS = [7071767914, 6779785893];

const MOVER_SECUNDARIAS = [
  { id: 6660035646, nome: '[AO5] Compra - Site (tag agência anterior)' },
  { id: 6779678797, nome: 'ADICIONAR CARRINHO | DINO' },
  { id: 6782454419, nome: 'FINALIZAÇÃO COMPRA | DINO' },
  { id: 6813104769, nome: 'Calls from ads' },
  { id: 7002361134, nome: 'YouTube channel subscriptions' },
  { id: 7126493443, nome: 'YouTube follow-on views' },
];

async function corrigirTags() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('  CORREÇÃO DE TAGS DE CONVERSÃO — Linklab Científica');
  console.log('═'.repeat(60));

  console.log('\n📋 PLANO DE EXECUÇÃO:');
  console.log('\n  ⭐ Manter PRIMÁRIAS:');
  console.log('     [7071767914] Conversão automática tray');
  console.log('     [6779785893] Loja Linklab (web) purchase (GA4)');
  console.log('\n  ↓  Mover para SECUNDÁRIAS:');
  MOVER_SECUNDARIAS.forEach(t => console.log(`     [${t.id}] ${t.nome}`));

  console.log('\n⚡ Executando...\n');

  let sucessos = 0;
  let erros = 0;

  for (const tag of MOVER_SECUNDARIAS) {
    try {
      await customer.conversionActions.update(
        [{
          resource_name: `customers/${CUSTOMER_ID}/conversionActions/${tag.id}`,
          primary_for_goal: false,
        }],
        { validate_only: false }
      );
      console.log(`  ✅ [${tag.id}] ${tag.nome} → SECUNDÁRIA`);
      sucessos++;
    } catch (e) {
      // Tentar via mutate se update direto não funcionar
      try {
        await customer.mutateConversionActions([{
          update_mask: { paths: ['primary_for_goal'] },
          update: {
            resource_name: `customers/${CUSTOMER_ID}/conversionActions/${tag.id}`,
            primary_for_goal: false,
          }
        }]);
        console.log(`  ✅ [${tag.id}] ${tag.nome} → SECUNDÁRIA (via mutate)`);
        sucessos++;
      } catch (e2) {
        console.log(`  ❌ [${tag.id}] ${tag.nome} → ERRO: ${e2.message}`);
        erros++;
      }
    }
  }

  // Verificar resultado final
  console.log('\n🔍 Verificando estado final das tags...\n');
  try {
    const r = await customer.query(`
      SELECT conversion_action.id, conversion_action.name,
             conversion_action.status, conversion_action.category,
             conversion_action.primary_for_goal
      FROM conversion_action
      WHERE conversion_action.status != 'REMOVED'
      ORDER BY conversion_action.primary_for_goal DESC
    `);

    const primarias   = r.filter(x => x.conversion_action.primary_for_goal);
    const secundarias = r.filter(x => !x.conversion_action.primary_for_goal);

    console.log(`  ⭐ PRIMÁRIAS (${primarias.length}):`);
    primarias.forEach(x => {
      const cv = x.conversion_action;
      const ok = MANTER_PRIMARIAS.includes(Number(cv.id)) ? '✅' : '⚠️ ';
      console.log(`     ${ok} [${cv.id}] ${cv.name}`);
    });

    console.log(`\n     SECUNDÁRIAS (${secundarias.length}):`);
    secundarias.forEach(x => {
      const cv = x.conversion_action;
      console.log(`        [${cv.id}] ${cv.name}`);
    });

    if (primarias.length <= 2) {
      console.log('\n  ✅ RESULTADO: Tags corrigidas com sucesso!');
      console.log('     A PMAX agora vai otimizar exclusivamente para COMPRA.');
    } else {
      console.log(`\n  ⚠️  Ainda há ${primarias.length} tags primárias. Verificar manualmente no Google Ads.`);
    }

  } catch(e) {
    console.log(`  Erro na verificação: ${e.message}`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`  Resultado: ${sucessos} alterações OK | ${erros} erros`);
  console.log('═'.repeat(60));

  if (erros > 0) {
    console.log('\n  ⚠️  AÇÃO MANUAL NECESSÁRIA para as tags com erro:');
    console.log('  Google Ads → Ferramentas → Conversões → editar cada tag');
    console.log('  Desmarcar "Usar como conversão principal" nas tags listadas.');
  }
}

corrigirTags().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1); });
