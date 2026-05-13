require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const sep = '═'.repeat(65);
const sep2 = '─'.repeat(65);

function fmt(n) { return Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtInt(n) { return Number(n || 0).toLocaleString('pt-BR'); }
function roas(r, c) { return c > 0 ? (r / c).toFixed(2) : '—'; }
function cpa(c, conv) { return conv > 0 ? (c / conv).toFixed(2) : '—'; }

async function run() {
  console.log('\n' + sep);
  console.log('  VARREDURA PMAX — Linklab Científica');
  console.log(sep);

  // ── 1. Campanha ──────────────────────────────────────────────
  console.log('\n📊 1. CONFIGURAÇÕES DA CAMPANHA\n');
  const [camp] = await customer.query(`
    SELECT
      campaign.id, campaign.name, campaign.status,
      campaign.bidding_strategy_type,
      campaign.target_roas.target_roas,
      campaign.maximize_conversion_value.target_roas,
      campaign_budget.amount_micros,
      campaign_budget.delivery_method,
      campaign.advertising_channel_type
    FROM campaign
    WHERE campaign.advertising_channel_type = 'PERFORMANCE_MAX'
      AND campaign.status = 'ENABLED'
  `);

  if (!camp) { console.log('  ❌ Nenhuma campanha PMAX ativa encontrada.'); process.exit(1); }
  const c = camp.campaign;
  const budget = camp.campaign_budget;
  const targetRoas = c.maximize_conversion_value?.target_roas || c.target_roas?.target_roas;
  console.log(`  Nome:     ${c.name}`);
  console.log(`  ID:       ${c.id}`);
  console.log(`  Status:   ${c.status}`);
  console.log(`  Estratégia: ${c.bidding_strategy_type}`);
  console.log(`  Target ROAS: ${targetRoas ? (targetRoas * 100).toFixed(0) + '%' : 'Não definido (maximizar conversões)'}`);
  console.log(`  Orçamento diário: R$ ${fmt(budget.amount_micros / 1e6)}`);
  console.log(`  Entrega: ${budget.delivery_method}`);

  const campId = c.id;

  // ── 2. Performance por período ────────────────────────────────
  console.log('\n' + sep2);
  console.log('📈 2. PERFORMANCE POR PERÍODO\n');

  const hoje = new Date();
  const dataFmt = (d) => d.toISOString().split('T')[0].replace(/-/g, '');
  const subDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() - n); return x; };

  const periodos = [
    { label: '7 dias',  inicio: dataFmt(subDays(hoje, 7)),  fim: dataFmt(subDays(hoje, 1)) },
    { label: '30 dias', inicio: dataFmt(subDays(hoje, 30)), fim: dataFmt(subDays(hoje, 1)) },
    { label: '90 dias', inicio: dataFmt(subDays(hoje, 90)), fim: dataFmt(subDays(hoje, 1)) },
  ];

  for (const p of periodos) {
    const r = await customer.query(`
      SELECT
        metrics.cost_micros, metrics.conversions_value,
        metrics.conversions, metrics.impressions, metrics.clicks,
        metrics.average_cpc
      FROM campaign
      WHERE campaign.id = '${campId}'
        AND segments.date BETWEEN '${p.inicio.slice(0,4)+'-'+p.inicio.slice(4,6)+'-'+p.inicio.slice(6)}' AND '${p.fim.slice(0,4)+'-'+p.fim.slice(4,6)+'-'+p.fim.slice(6)}'
    `);
    const m = r.reduce((acc, x) => {
      acc.cost += Number(x.metrics.cost_micros) / 1e6;
      acc.revenue += Number(x.metrics.conversions_value);
      acc.conv += Number(x.metrics.conversions);
      acc.impr += Number(x.metrics.impressions);
      acc.clicks += Number(x.metrics.clicks);
      return acc;
    }, { cost: 0, revenue: 0, conv: 0, impr: 0, clicks: 0 });

    const roasVal = m.cost > 0 ? (m.revenue / m.cost).toFixed(2) : '—';
    const cpaVal  = m.conv > 0 ? (m.cost / m.conv).toFixed(2) : '—';
    const ctr     = m.impr > 0 ? ((m.clicks / m.impr) * 100).toFixed(2) : '—';

    const roasEmoji = m.cost > 0 && (m.revenue / m.cost) >= 8 ? '✅' : '⚠️ ';
    console.log(`  ${p.label.padEnd(10)} Invest: R$${fmt(m.cost).padStart(10)} | Receita: R$${fmt(m.revenue).padStart(12)} | ROAS: ${String(roasVal+'x').padStart(7)} ${roasEmoji} | Conversões: ${fmtInt(m.conv).padStart(5)} | CPA: R$${cpaVal} | CTR: ${ctr}%`);
  }

  // ── 3. Asset Groups ───────────────────────────────────────────
  console.log('\n' + sep2);
  console.log('🎨 3. ASSET GROUPS\n');

  const assetGroups = await customer.query(`
    SELECT
      asset_group.id, asset_group.name, asset_group.status,
      asset_group.primary_status, asset_group.primary_status_reasons,
      asset_group.final_urls, asset_group.path1, asset_group.path2,
      metrics.impressions, metrics.clicks, metrics.conversions, metrics.cost_micros, metrics.conversions_value
    FROM asset_group
    WHERE campaign.id = '${campId}'
  `);

  if (assetGroups.length === 0) {
    console.log('  (Nenhum asset group retornado — permissão pode ser limitada)');
  } else {
    for (const ag of assetGroups) {
      const a = ag.asset_group;
      const m = ag.metrics;
      const cost = Number(m.cost_micros) / 1e6;
      const roasVal = cost > 0 ? (Number(m.conversions_value) / cost).toFixed(2) + 'x' : '—';
      const statusIcon = a.status === 'ENABLED' ? '🟢' : '🟡';
      console.log(`  ${statusIcon} [${a.id}] ${a.name}`);
      console.log(`     Status: ${a.status} | Primary: ${a.primary_status || '—'}`);
      if (a.primary_status_reasons?.length) console.log(`     Razões: ${a.primary_status_reasons.join(', ')}`);
      console.log(`     URL: ${(a.final_urls || []).join(', ')}`);
      console.log(`     Impr: ${fmtInt(m.impressions)} | Cliques: ${fmtInt(m.clicks)} | Conv: ${m.conversions} | ROAS: ${roasVal} | Custo: R$${fmt(cost)}`);
      if (a.path1 || a.path2) console.log(`     Path: /${a.path1 || ''}/${a.path2 || ''}`);
      console.log();
    }
  }

  // ── 4. Assets individuais (headlines/descriptions) ───────────
  console.log(sep2);
  console.log('📝 4. ASSETS (desempenho dos textos)\n');

  try {
    const assets = await customer.query(`
      SELECT
        asset.id, asset.name, asset.type,
        asset.text_asset.text,
        asset_group_asset.field_type,
        asset_group_asset.performance_label,
        asset_group_asset.status
      FROM asset_group_asset
      WHERE campaign.id = '${campId}'
        AND asset_group_asset.status != 'REMOVED'
      ORDER BY asset_group_asset.performance_label DESC
    `);

    const byPerf = {};
    for (const a of assets) {
      const label = a.asset_group_asset?.performance_label || 'UNRATED';
      if (!byPerf[label]) byPerf[label] = [];
      byPerf[label].push(a);
    }

    const perfOrder = ['BEST', 'GOOD', 'LOW', 'LEARNING', 'UNRATED', 'PENDING'];
    const perfEmoji = { BEST: '🏆', GOOD: '✅', LOW: '⚠️ ', LEARNING: '🔄', UNRATED: '⬜', PENDING: '⏳' };

    for (const label of perfOrder) {
      if (!byPerf[label]?.length) continue;
      console.log(`  ${perfEmoji[label] || '  '} ${label} (${byPerf[label].length} assets):`);
      for (const a of byPerf[label].slice(0, 8)) {
        const texto = a.asset?.text_asset?.text || a.asset?.name || '(sem texto)';
        const tipo = a.asset_group_asset?.field_type || a.asset?.type || '';
        console.log(`     [${tipo}] ${texto.slice(0, 80)}`);
      }
      console.log();
    }
  } catch (e) {
    console.log(`  (Assets não disponíveis: ${(e?.message || String(e)).split('\n')[0]})\n`);
  }

  // ── 5. Audience Signals ───────────────────────────────────────
  console.log(sep2);
  console.log('🎯 5. AUDIENCE SIGNALS\n');

  try {
    const audiences = await customer.query(`
      SELECT
        asset_group_signal.asset_group,
        asset_group_signal.audience.audience
      FROM asset_group_signal
      WHERE campaign.id = '${campId}'
    `);
    if (audiences.length === 0) {
      console.log('  (Nenhum audience signal configurado — PMAX rodando sem sinal de audiência)');
      console.log('  ⚠️  Isso pode causar aprendizado mais lento e menor precisão de targeting.');
    } else {
      console.log(`  ${audiences.length} audience signal(s) configurado(s):`);
      for (const a of audiences) {
        console.log(`  → ${a.asset_group_signal?.audience?.audience || JSON.stringify(a.asset_group_signal)}`);
      }
    }
  } catch (e) {
    console.log(`  (Audience signals não disponíveis: ${e.message.split('\n')[0]})`);
  }

  // ── 6. Listing Groups (produtos) ──────────────────────────────
  console.log('\n' + sep2);
  console.log('🛒 6. LISTING GROUPS (segmentação de produtos)\n');

  try {
    const listings = await customer.query(`
      SELECT
        listing_group_filter.id,
        listing_group_filter.type,
        listing_group_filter.case_value.product_category.level,
        listing_group_filter.case_value.product_category.category_id,
        listing_group_filter.case_value.product_brand.value,
        listing_group_filter.case_value.product_item_id.value,
        listing_group_filter.case_value.product_type.level,
        listing_group_filter.case_value.product_type.value,
        listing_group_filter.vertical
      FROM listing_group_filter
      WHERE campaign.id = '${campId}'
      LIMIT 30
    `);

    if (listings.length === 0) {
      console.log('  (Todos os produtos em um único grupo — sem segmentação)');
      console.log('  ⚠️  Sem segmentação, não é possível dar mais orçamento a produtos estrela.');
    } else {
      console.log(`  ${listings.length} listing group(s):`);
      for (const l of listings.slice(0, 15)) {
        const lg = l.listing_group_filter;
        const cv = lg.case_value;
        const desc = cv?.product_brand?.value || cv?.product_item_id?.value || cv?.product_type?.value || lg.type;
        console.log(`  → [${lg.type}] ${desc || '(todos produtos)'}`);
      }
    }
  } catch(e) {
    console.log(`  (Listing groups não disponíveis: ${e.message.split('\n')[0]})`);
  }

  // ── 7. Performance por dia (tendência) ───────────────────────
  console.log('\n' + sep2);
  console.log('📅 7. TENDÊNCIA SEMANAL (últimas 8 semanas)\n');

  try {
    const daily = await customer.query(`
      SELECT
        segments.week,
        metrics.cost_micros, metrics.conversions_value, metrics.conversions,
        metrics.impressions, metrics.clicks
      FROM campaign
      WHERE campaign.id = '${campId}'
        AND segments.date BETWEEN '${subDays(hoje, 56).toISOString().split('T')[0]}' AND '${subDays(hoje, 1).toISOString().split('T')[0]}'
    `);

    const semanas = {};
    for (const d of daily) {
      const w = d.segments.week;
      if (!semanas[w]) semanas[w] = { cost: 0, rev: 0, conv: 0, impr: 0, clicks: 0 };
      semanas[w].cost   += Number(d.metrics.cost_micros) / 1e6;
      semanas[w].rev    += Number(d.metrics.conversions_value);
      semanas[w].conv   += Number(d.metrics.conversions);
      semanas[w].impr   += Number(d.metrics.impressions);
      semanas[w].clicks += Number(d.metrics.clicks);
    }

    const keys = Object.keys(semanas).sort();
    for (const w of keys) {
      const s = semanas[w];
      const roasVal = s.cost > 0 ? (s.rev / s.cost).toFixed(1) : '—';
      const trend = s.cost > 0 && (s.rev / s.cost) >= 8 ? '✅' : '⚠️ ';
      console.log(`  Semana ${w}  Invest: R$${fmt(s.cost).padStart(8)} | Receita: R$${fmt(s.rev).padStart(10)} | ROAS: ${(roasVal+'x').padStart(6)} ${trend} | Conv: ${s.conv.toFixed(0).padStart(3)}`);
    }
  } catch(e) {
    console.log(`  (Tendência não disponível: ${e.message.split('\n')[0]})`);
  }

  // ── 8. Geo performance ────────────────────────────────────────
  console.log('\n' + sep2);
  console.log('🗺️  8. PERFORMANCE POR ESTADO (30 dias)\n');

  try {
    const geo = await customer.query(`
      SELECT
        geographic_view.location_type,
        geographic_view.country_criterion_id,
        segments.geo_target_state,
        metrics.cost_micros, metrics.conversions_value,
        metrics.conversions, metrics.impressions
      FROM geographic_view
      WHERE campaign.id = '${campId}'
        AND segments.date BETWEEN '${subDays(hoje, 30).toISOString().split('T')[0]}' AND '${subDays(hoje, 1).toISOString().split('T')[0]}'
      ORDER BY metrics.cost_micros DESC
      LIMIT 20
    `);

    if (geo.length === 0) {
      console.log('  (Dados geo não disponíveis)');
    } else {
      for (const g of geo) {
        const m = g.metrics;
        const cost = Number(m.cost_micros) / 1e6;
        const rev = Number(m.conversions_value);
        const roasVal = cost > 0 ? (rev / cost).toFixed(1) : '—';
        const emoji = cost > 0 && (rev / cost) >= 5 ? '✅' : (cost > 10 ? '⚠️ ' : '  ');
        const state = g.segments?.geo_target_state || g.geographic_view?.country_criterion_id || '?';
        console.log(`  ${emoji} ${String(state).padEnd(30)} Invest: R$${fmt(cost).padStart(8)} | Receita: R$${fmt(rev).padStart(10)} | ROAS: ${(roasVal+'x').padStart(6)} | Conv: ${Number(m.conversions).toFixed(0)}`);
      }
    }
  } catch(e) {
    console.log(`  (Geo não disponível: ${e.message.split('\n')[0]})`);
  }

  // ── 9. Dispositivos ───────────────────────────────────────────
  console.log('\n' + sep2);
  console.log('📱 9. PERFORMANCE POR DISPOSITIVO (30 dias)\n');

  try {
    const devs = await customer.query(`
      SELECT
        segments.device,
        metrics.cost_micros, metrics.conversions_value,
        metrics.conversions, metrics.clicks, metrics.impressions
      FROM campaign
      WHERE campaign.id = '${campId}'
        AND segments.date BETWEEN '${subDays(hoje, 30).toISOString().split('T')[0]}' AND '${subDays(hoje, 1).toISOString().split('T')[0]}'
    `);

    const byDev = {};
    for (const d of devs) {
      const dev = d.segments.device;
      if (!byDev[dev]) byDev[dev] = { cost: 0, rev: 0, conv: 0, clicks: 0, impr: 0 };
      byDev[dev].cost   += Number(d.metrics.cost_micros) / 1e6;
      byDev[dev].rev    += Number(d.metrics.conversions_value);
      byDev[dev].conv   += Number(d.metrics.conversions);
      byDev[dev].clicks += Number(d.metrics.clicks);
      byDev[dev].impr   += Number(d.metrics.impressions);
    }

    for (const [dev, m] of Object.entries(byDev)) {
      const roasVal = m.cost > 0 ? (m.rev / m.cost).toFixed(1) : '—';
      const emoji = m.cost > 0 && (m.rev / m.cost) >= 5 ? '✅' : (m.cost > 5 ? '⚠️ ' : '  ');
      const ctr = m.impr > 0 ? ((m.clicks / m.impr) * 100).toFixed(2) : '—';
      console.log(`  ${emoji} ${dev.padEnd(10)} Invest: R$${fmt(m.cost).padStart(8)} | Receita: R$${fmt(m.rev).padStart(10)} | ROAS: ${(roasVal+'x').padStart(6)} | Conv: ${m.conv.toFixed(0).padStart(3)} | CTR: ${ctr}%`);
    }
  } catch(e) {
    console.log(`  (Dispositivos não disponível: ${e.message.split('\n')[0]})`);
  }

  // ── 10. Search Category Insights ─────────────────────────────
  console.log('\n' + sep2);
  console.log('🔍 10. SEARCH TERM INSIGHTS (categorias de busca)\n');

  try {
    const insights = await customer.query(`
      SELECT
        campaign_search_term_insight.category_label,
        metrics.clicks, metrics.impressions,
        metrics.conversions, metrics.cost_micros, metrics.conversions_value
      FROM campaign_search_term_insight
      WHERE campaign.id = '${campId}'
      ORDER BY metrics.cost_micros DESC
      LIMIT 25
    `);

    if (insights.length === 0) {
      console.log('  (Search insights não disponíveis — pode requerer período maior ou permissão adicional)');
    } else {
      console.log(`  ${insights.length} categorias de busca identificadas:\n`);
      for (const i of insights) {
        const m = i.metrics;
        const cost = Number(m.cost_micros) / 1e6;
        const roasVal = cost > 0 ? (Number(m.conversions_value) / cost).toFixed(1) + 'x' : '—';
        const label = i.campaign_search_term_insight?.category_label || '(sem rótulo)';
        const emoji = cost > 0 && (Number(m.conversions_value) / cost) >= 8 ? '✅' : (cost > 20 ? '⚠️ ' : '  ');
        console.log(`  ${emoji} ${label.padEnd(45)} Cliques: ${fmtInt(m.clicks).padStart(5)} | Conv: ${Number(m.conversions).toFixed(0).padStart(3)} | ROAS: ${roasVal.padStart(6)} | Custo: R$${fmt(cost)}`);
      }
    }
  } catch(e) {
    console.log(`  (Search insights não disponíveis: ${e.message.split('\n')[0]})`);
  }

  // ── 11. Diagnóstico e Recomendações ──────────────────────────
  console.log('\n' + sep);
  console.log('🩺 11. DIAGNÓSTICO E PLANO DE AÇÃO');
  console.log(sep);

  console.log(`
  SITUAÇÃO ATUAL:
  ─────────────────────────────────────────────────────────────
  ROAS Tendência: 90d=~39x → 30d=~25x → 7d=~14x  ⚠️  QUEDA

  CAUSAS PROVÁVEIS DA QUEDA DE ROAS:
  1. Sazonalidade — verificar se há padrão anual
  2. Concorrência aumentou lances no leilão
  3. Tags de conversão (antes 8 primárias) inflavam ROAS artificialmente
     → Agora corrigidas para 4 → o ROAS "real" pode ser mais baixo que o histórico
  4. Feed de produtos pode ter problemas (produtos sem imagem, título, preço)
  5. Orçamento diário muito baixo → PMAX não consegue explorar escala

  O QUE PRECISA SER VERIFICADO AGORA (sem custo):
  ─────────────────────────────────────────────────────────────
  ✅ 1. Merchant Center: verificar se há produtos reprovados ou com
        baixa qualidade de feed (títulos ruins, sem imagem, preço desatualizado)
  ✅ 2. Asset Groups: verificar se há assets com performance BAIXA
        → Remover headlines/descriptions com label LOW
        → Garantir mínimo: 3-5 headlines, 2 descrições longas, logo, imagem
  ✅ 3. Audience Signals: se não tiver configurado, é urgente adicionar
        → Customer match list (emails de compradores anteriores)
        → In-market: Equipamentos laboratoriais, Suprimentos científicos
  ✅ 4. Final URLs: verificar se as URLs dos asset groups levam para
        páginas relevantes (categorias corretas, não só homepage)
  ✅ 5. Budget: R$/dia suficiente? PMAX precisa de pelo menos 10-20x CPA

  O QUE AGUARDAR ATÉ R$80k/mês:
  ─────────────────────────────────────────────────────────────
  ⏸️  Ajustes geográficos (RJ -30%, MG -40%)
  ⏸️  Novas campanhas (Search Água, Search Inox)
  ⏸️  Reativar campanhas pausadas
  ⏸️  YouTube tags (deixar como está)
`);

  console.log(sep);
  console.log('  FIM DA VARREDURA');
  console.log(sep + '\n');
}

run().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
