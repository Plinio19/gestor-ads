require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const PERF_LABEL = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'PENDING', 3: 'LEARNING', 4: 'LOW', 5: 'GOOD', 6: 'BEST' };

function perfIcon(label) {
  if (label === 'BEST') return '🏆';
  if (label === 'GOOD') return '✅';
  if (label === 'LOW') return '⚠️';
  if (label === 'LEARNING') return '🔍';
  if (label === 'PENDING') return '⏳';
  return '❓';
}

async function diagnosticoNivelAtivo() {
  console.log('\n=== DIAGNÓSTICO NÍVEL DE ATIVO — Produtos Prioritários ===\n');
  console.log(`Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

  const rows = await customer.query(`
    SELECT
      ad_group.name,
      asset.text_asset.text,
      ad_group_ad_asset_view.field_type,
      ad_group_ad_asset_view.performance_label,
      ad_group_ad_asset_view.enabled,
      ad_group_ad_asset_view.pinned_field
    FROM ad_group_ad_asset_view
    WHERE campaign.name = '[Busca] - Produtos Prioritários'
    ORDER BY ad_group.name ASC, ad_group_ad_asset_view.field_type ASC
  `);

  if (!rows.length) {
    console.log('Nenhum dado de ativo encontrado.\n');
    return;
  }

  // Agrupar por ad group
  const byGroup = {};
  for (const r of rows) {
    const ag = r.ad_group.name;
    if (!byGroup[ag]) byGroup[ag] = { headlines: [], descriptions: [] };

    const perf = PERF_LABEL[r.ad_group_ad_asset_view.performance_label] ?? 'UNKNOWN';
    const fieldType = r.ad_group_ad_asset_view.field_type; // 1=HEADLINE, 2=DESCRIPTION
    const text = r.asset?.text_asset?.text ?? '(sem texto)';
    const enabled = r.ad_group_ad_asset_view.enabled;
    const pinned = r.ad_group_ad_asset_view.pinned_field;

    const entry = { text, perf, enabled, pinned };

    if (fieldType === 1) byGroup[ag].headlines.push(entry);
    else byGroup[ag].descriptions.push(entry);
  }

  for (const [ag, data] of Object.entries(byGroup)) {
    console.log('='.repeat(65));
    console.log(`📦 ${ag}\n`);

    console.log('  HEADLINES:');
    for (const h of data.headlines) {
      const perfStr = (h.perf !== 'UNSPECIFIED' && h.perf !== 'UNKNOWN' && h.perf !== 'PENDING') ? ` [${h.perf}]` : '';
      const activeStr = !h.enabled ? ' [DESATIVADO]' : '';
      const pinStr = h.pinned ? ` [PIN:${h.pinned}]` : '';
      console.log(`    ${perfIcon(h.perf)} "${h.text}"${perfStr}${pinStr}${activeStr}`);
    }

    console.log('\n  DESCRIPTIONS:');
    for (const d of data.descriptions) {
      const perfStr = (d.perf !== 'UNSPECIFIED' && d.perf !== 'UNKNOWN' && d.perf !== 'PENDING') ? ` [${d.perf}]` : '';
      const activeStr = !d.enabled ? ' [DESATIVADO]' : '';
      console.log(`    ${perfIcon(d.perf)} "${d.text}"${perfStr}${activeStr}`);
    }

    // Contar ativos com problema
    const lowHeadlines = data.headlines.filter(h => h.perf === 'LOW');
    const disabledHeadlines = data.headlines.filter(h => !h.enabled);
    if (lowHeadlines.length || disabledHeadlines.length) {
      console.log(`\n  ⚠️  ${lowHeadlines.length} headlines com perf BAIXA | ${disabledHeadlines.length} desativados`);
    }

    console.log('');
  }

  // Resumo geral
  console.log('='.repeat(65));
  const allHeadlines = Object.values(byGroup).flatMap(g => g.headlines);
  const allDescs = Object.values(byGroup).flatMap(g => g.descriptions);

  const counts = { BEST: 0, GOOD: 0, LOW: 0, LEARNING: 0, PENDING: 0, other: 0 };
  for (const a of [...allHeadlines, ...allDescs]) {
    if (a.perf in counts) counts[a.perf]++;
    else counts.other++;
  }

  console.log('\n📋 RESUMO GERAL DE PERFORMANCE DOS ATIVOS:');
  console.log(`  🏆 BEST:     ${counts.BEST}`);
  console.log(`  ✅ GOOD:     ${counts.GOOD}`);
  console.log(`  🔍 LEARNING: ${counts.LEARNING}`);
  console.log(`  ⏳ PENDING:  ${counts.PENDING}`);
  console.log(`  ⚠️  LOW:      ${counts.LOW}`);
  console.log('');
  console.log('  (Performance PENDING/LEARNING = conta nova, Google ainda coletando dados)\n');
}

diagnosticoNivelAtivo().catch(e => {
  console.error('Erro:', e.message || e);
  process.exit(1);
});
