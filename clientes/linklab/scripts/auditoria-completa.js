require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
const path = require('path');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const STATUS  = { 0:'UNSPECIFIED',1:'UNKNOWN',2:'ENABLED',3:'PAUSED',4:'REMOVED' };
const TIPO    = { 0:'UNSPECIFIED',1:'UNKNOWN',2:'SEARCH',3:'DISPLAY',4:'SHOPPING',5:'HOTEL',6:'VIDEO',7:'MULTI_CHANNEL',8:'LOCAL',9:'SMART',10:'PERFORMANCE_MAX',11:'LOCAL_SERVICES',12:'DISCOVERY',13:'TRAVEL',14:'DEMAND_GEN' };
const MATCH   = { 0:'UNSPECIFIED',1:'UNKNOWN',2:'EXACT',3:'PHRASE',4:'BROAD' };
const DEVICE  = { 0:'UNSPECIFIED',1:'UNKNOWN',2:'MOBILE',3:'TABLET',4:'DESKTOP',5:'CONNECTED_TV',6:'OTHER' };

const TODAY  = new Date();
const D_TO   = TODAY.toISOString().slice(0,10);
const d90    = new Date(TODAY); d90.setDate(d90.getDate()-90);
const D_FROM90 = d90.toISOString().slice(0,10);
const d30    = new Date(TODAY); d30.setDate(d30.getDate()-30);
const D_FROM30 = d30.toISOString().slice(0,10);
const d7     = new Date(TODAY); d7.setDate(d7.getDate()-7);
const D_FROM7  = d7.toISOString().slice(0,10);

const fmt = (micros) => (micros/1e6).toFixed(2);
const roas = (receita, gasto) => gasto > 0 ? (receita/gasto).toFixed(2) : 'N/A';
const cpa  = (gasto, conv)    => conv > 0  ? (gasto/conv).toFixed(2)   : 'N/A';

const sep = () => console.log('─'.repeat(70));

async function run() {
  const report = {
    geradoEm: new Date().toISOString(),
    conta: CUSTOMER_ID,
    periodos: { d7: D_FROM7, d30: D_FROM30, d90: D_FROM90, ate: D_TO },
    campanhas: [], adGroups: [], keywords: [], conversoes: [],
    dispositivos: [], geografico: [], searchTerms: [], historico: [],
    alertas: [], recomendacoes: []
  };

  console.log('');
  console.log('═'.repeat(70));
  console.log('  AUDITORIA COMPLETA — Linklab Científica');
  console.log(`  Conta: ${CUSTOMER_ID} | MCC: ${LOGIN_CUSTOMER_ID}`);
  console.log(`  Data: ${D_TO}`);
  console.log('═'.repeat(70));

  // ════════════════════════════════════════════════
  // 1. CONTA
  // ════════════════════════════════════════════════
  console.log('\n【1】 DADOS DA CONTA');
  sep();
  try {
    const r = await customer.query(`
      SELECT customer.id, customer.descriptive_name, customer.currency_code,
             customer.time_zone, customer.status, customer.auto_tagging_enabled,
             customer.pay_per_conversion_eligibility_failure_reasons
      FROM customer LIMIT 1
    `);
    const c = r[0].customer;
    report.conta = { id:c.id, nome:c.descriptive_name, moeda:c.currency_code,
      tz:c.time_zone, status:STATUS[c.status], autoTag:c.auto_tagging_enabled };
    console.log(`   Nome:        ${c.descriptive_name}`);
    console.log(`   Status:      ${STATUS[c.status]}`);
    console.log(`   Moeda:       ${c.currency_code}`);
    console.log(`   Timezone:    ${c.time_zone}`);
    console.log(`   Auto-tag:    ${c.auto_tagging_enabled ? '✅ ATIVO' : '🚨 INATIVO'}`);
    if (!c.auto_tagging_enabled) report.alertas.push({ nivel:'CRÍTICO', area:'Conta', msg:'Auto-tagging desativado — rastreamento de conversões comprometido' });
  } catch(e) { console.log(`   ERRO: ${e.message}`); }

  // ════════════════════════════════════════════════
  // 2. TAGS DE CONVERSÃO
  // ════════════════════════════════════════════════
  console.log('\n【2】 TAGS DE CONVERSÃO');
  sep();
  try {
    const r = await customer.query(`
      SELECT conversion_action.id, conversion_action.name, conversion_action.status,
             conversion_action.category, conversion_action.type,
             conversion_action.primary_for_goal, conversion_action.counting_type,
             conversion_action.value_settings.default_value,
             conversion_action.value_settings.always_use_default_value
      FROM conversion_action
      WHERE conversion_action.status != 'REMOVED'
      ORDER BY conversion_action.primary_for_goal DESC
    `);

    const catMap = { 1:'CLIQUE_WEB', 2:'ENGAJAMENTO', 3:'VISUALIZACAO_PAGINA', 4:'COMPRA', 5:'INSCRICAO',
      7:'APP_INSTALL', 8:'DOWNLOAD', 9:'CHECKOUT', 10:'CONTATO', 11:'CHAMADA_TELEFONE',
      18:'CONTATO_WHATSAPP', 19:'INSCRICAO_YT', 25:'INSTALL_APP' };

    const primarias = [], secundarias = [];
    r.forEach(row => {
      const cv = row.conversion_action;
      const obj = { id:cv.id, nome:cv.name, status:cv.status,
        categoria: catMap[cv.category] || `cat_${cv.category}`,
        tipo: cv.type, primaria:cv.primary_for_goal,
        valorPadrao: cv.value_settings?.default_value,
        sempreUsarValorPadrao: cv.value_settings?.always_use_default_value };
      report.conversoes.push(obj);
      if (cv.primary_for_goal) primarias.push(obj); else secundarias.push(obj);
    });

    console.log(`\n   ⭐ PRIMÁRIAS (${primarias.length}):`);
    primarias.forEach(cv => console.log(`      [${cv.id}] ${cv.nome}  →  ${cv.categoria} | tipo:${cv.tipo}`));
    console.log(`\n      SECUNDÁRIAS (${secundarias.length}):`);
    secundarias.forEach(cv => console.log(`      [${cv.id}] ${cv.nome}  →  ${cv.categoria}`));

    // Diagnóstico
    const compras = primarias.filter(cv => cv.categoria === 'COMPRA' || cv.categoria === 'CHECKOUT');
    const yts     = primarias.filter(cv => cv.categoria === 'INSCRICAO_YT' || cv.nome.toLowerCase().includes('youtube'));
    const carros  = primarias.filter(cv => cv.nome.toLowerCase().includes('carrinho') || cv.nome.toLowerCase().includes('cart'));
    const calls   = primarias.filter(cv => cv.categoria === 'CHAMADA_TELEFONE');

    console.log('\n   📋 DIAGNÓSTICO DAS TAGS:');
    if (primarias.length > 3) {
      console.log(`   🚨 ${primarias.length} tags PRIMÁRIAS — ideal é 1-2 (apenas compra). Isso distorce ROAS/CPA.`);
      report.alertas.push({ nivel:'CRÍTICO', area:'Conversões', msg:`${primarias.length} tags primárias — ROAS reportado pode estar distorcido` });
    }
    if (yts.length > 0) {
      console.log(`   🚨 YouTube subscriptions/views marcados como PRIMÁRIO — deve ser SECUNDÁRIO.`);
      yts.forEach(cv => report.alertas.push({ nivel:'CRÍTICO', area:'Conversões', msg:`Tag "${cv.nome}" deve ser SECUNDÁRIA, não primária` }));
    }
    if (carros.length > 0) {
      console.log(`   ⚠️  "Adicionar ao Carrinho" marcado como PRIMÁRIO — deve ser SECUNDÁRIO.`);
      carros.forEach(cv => report.alertas.push({ nivel:'ATENÇÃO', area:'Conversões', msg:`Tag "${cv.nome}" (carrinho) deve ser SECUNDÁRIA` }));
    }
    if (compras.length > 0) console.log(`   ✅ ${compras.length} tag(s) de compra configurada(s) como primária — correto.`);
    if (compras.length === 0) {
      console.log(`   🚨 NENHUMA tag de compra/compra como primária encontrada!`);
      report.alertas.push({ nivel:'CRÍTICO', area:'Conversões', msg:'Nenhuma tag de COMPRA como primária — otimização errada' });
    }

  } catch(e) { console.log(`   ERRO: ${e.message}`); }

  // ════════════════════════════════════════════════
  // 3. CAMPANHAS — COMPARATIVO 7/30/90 DIAS
  // ════════════════════════════════════════════════
  console.log('\n【3】 CAMPANHAS — PERFORMANCE COMPARATIVA');
  sep();

  for (const [label, periodo] of [['7d', D_FROM7],['30d', D_FROM30],['90d', D_FROM90]]) {
    try {
      const r = await customer.query(`
        SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
               campaign.bidding_strategy_type, campaign.target_roas.target_roas,
               campaign_budget.amount_micros, campaign_budget.has_recommended_budget,
               metrics.impressions, metrics.clicks, metrics.cost_micros,
               metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc,
               metrics.search_impression_share, metrics.search_budget_lost_impression_share
        FROM campaign
        WHERE segments.date BETWEEN '${periodo}' AND '${D_TO}'
          AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
      `);
      if (label === '30d') {
        r.forEach(row => {
          const c = row.campaign; const m = row.metrics; const b = row.campaign_budget;
          const g = parseFloat(fmt(m.cost_micros));
          const rv = m.conversions_value || 0;
          report.campanhas.push({
            periodo: label, id:c.id, nome:c.nome||c.name, status:STATUS[c.status],
            tipo:TIPO[c.advertising_channel_type], estrategia:c.bidding_strategy_type,
            roas_alvo: c.target_roas?.target_roas || 'N/A',
            orcamento_diario: b ? fmt(b.amount_micros) : 'N/A',
            impressoes:m.impressions, cliques:m.clicks, gasto:g,
            conversoes:m.conversions, receita:rv.toFixed(2),
            roas:roas(rv,g), cpa:cpa(g,m.conversions),
            ctr:(m.ctr*100).toFixed(2)+'%', cpc:fmt(m.average_cpc)
          });
        });
      }
      console.log(`\n   ── ${label} (${periodo} → ${D_TO}) ──`);
      r.forEach(row => {
        const c = row.campaign; const m = row.metrics;
        const g = parseFloat(fmt(m.cost_micros)); const rv = m.conversions_value||0;
        const icon = STATUS[c.status]==='ENABLED'?'🟢':STATUS[c.status]==='PAUSED'?'🟡':'🔴';
        console.log(`   ${icon} ${c.name}`);
        console.log(`      Gasto:R$${g.toFixed(2)} | Clicks:${m.clicks} | Conv:${m.conversions} | Receita:R$${rv.toFixed(2)} | ROAS:${roas(rv,g)}x | CPA:R$${cpa(g,m.conversions)}`);
      });
    } catch(e) { console.log(`   ERRO ${label}: ${e.message}`); }
  }

  // ════════════════════════════════════════════════
  // 4. GRUPOS DE ANÚNCIOS
  // ════════════════════════════════════════════════
  console.log('\n【4】 GRUPOS DE ANÚNCIOS (últimos 30 dias)');
  sep();
  try {
    const r = await customer.query(`
      SELECT campaign.name, ad_group.id, ad_group.name, ad_group.status,
             ad_group.type, ad_group.cpc_bid_micros,
             metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc
      FROM ad_group
      WHERE segments.date DURING LAST_30_DAYS
        AND ad_group.status != 'REMOVED'
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 30
    `);
    if (r.length === 0) console.log('   Nenhum grupo com dados nos últimos 30 dias (apenas PMAX).');
    r.forEach(row => {
      const ag = row.ad_group; const m = row.metrics; const c = row.campaign;
      const g = parseFloat(fmt(m.cost_micros)); const rv = m.conversions_value||0;
      const icon = STATUS[ag.status]==='ENABLED'?'🟢':'🟡';
      console.log(`   ${icon} [${c.name}] → ${ag.name}`);
      console.log(`      Gasto:R$${g.toFixed(2)} | Clicks:${m.clicks} | Conv:${m.conversions} | ROAS:${roas(rv,g)}x | CPC:R$${fmt(m.average_cpc)}`);
      report.adGroups.push({ campanha:c.name, nome:ag.name, status:STATUS[ag.status],
        gasto:g, cliques:m.clicks, conversoes:m.conversions, receita:rv.toFixed(2), roas:roas(rv,g) });
    });
  } catch(e) { console.log(`   ERRO: ${e.message}`); }

  // ════════════════════════════════════════════════
  // 5. ANÚNCIOS — STATUS E PERFORMANCE
  // ════════════════════════════════════════════════
  console.log('\n【5】 ANÚNCIOS RSA / SHOPPING (últimos 30 dias)');
  sep();
  try {
    const r = await customer.query(`
      SELECT campaign.name, ad_group.name, ad_group_ad.ad.id,
             ad_group_ad.ad.name, ad_group_ad.status, ad_group_ad.ad.type,
             ad_group_ad.policy_summary.approval_status,
             metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.ctr, ad_group_ad.ad.responsive_search_ad.headlines,
             ad_group_ad.ad.responsive_search_ad.descriptions
      FROM ad_group_ad
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 20
    `);
    if (r.length === 0) console.log('   Nenhum anúncio RSA com dados — conta usa PMAX (sem RSAs individuais).');
    r.forEach(row => {
      const ad = row.ad_group_ad; const m = row.metrics;
      const status = ad.policy_summary?.approval_status;
      const icon = status==='APPROVED'?'✅':status==='DISAPPROVED'?'❌':'⏳';
      console.log(`   ${icon} [${row.campaign.name}] ${row.ad_group.name} → tipo:${ad.ad.type} | status:${ad.status}`);
      console.log(`      Impressões:${m.impressions} | Clicks:${m.clicks} | CTR:${(m.ctr*100).toFixed(2)}% | Conv:${m.conversions}`);
    });
  } catch(e) { console.log(`   Nenhum anúncio individual (conta usa PMAX): ${e.message}`); }

  // ════════════════════════════════════════════════
  // 6. KEYWORDS
  // ════════════════════════════════════════════════
  console.log('\n【6】 KEYWORDS (últimos 30 dias)');
  sep();
  try {
    const r = await customer.query(`
      SELECT campaign.name, ad_group.name,
             ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
             ad_group_criterion.status, ad_group_criterion.quality_info.quality_score,
             metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc
      FROM keyword_view
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 30
    `);
    if (r.length === 0) console.log('   Nenhuma keyword individual (conta usa PMAX sem keywords manuais).');
    r.forEach(row => {
      const kw = row.ad_group_criterion; const m = row.metrics;
      const qs = kw.quality_info?.quality_score || '?';
      const qsIcon = qs>=7?'✅':qs>=5?'⚠️':'🚨';
      const g = parseFloat(fmt(m.cost_micros)); const rv = m.conversions_value||0;
      console.log(`   ${qsIcon} "${kw.keyword.text}" [${MATCH[kw.keyword.match_type]}] QS:${qs}`);
      console.log(`      Gasto:R$${g.toFixed(2)} | Clicks:${m.clicks} | Conv:${m.conversions} | CPC:R$${fmt(m.average_cpc)} | CTR:${(m.ctr*100).toFixed(2)}%`);
      report.keywords.push({ campanha:row.campaign.name, grupo:row.ad_group.name,
        kw:kw.keyword.text, match:MATCH[kw.keyword.match_type], qs, gasto:g,
        cliques:m.clicks, conversoes:m.conversions, roas:roas(rv,g), cpc:fmt(m.average_cpc) });
    });
  } catch(e) { console.log(`   ERRO: ${e.message}`); }

  // ════════════════════════════════════════════════
  // 7. TERMOS DE BUSCA
  // ════════════════════════════════════════════════
  console.log('\n【7】 TERMOS DE BUSCA — TOP 30 POR GASTO (últimos 30 dias)');
  sep();
  try {
    const r = await customer.query(`
      SELECT campaign.name, ad_group.name, search_term_view.search_term,
             search_term_view.status, metrics.impressions, metrics.clicks,
             metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.ctr
      FROM search_term_view
      WHERE segments.date DURING LAST_30_DAYS
        AND metrics.impressions > 5
      ORDER BY metrics.cost_micros DESC
      LIMIT 30
    `);
    if (r.length === 0) console.log('   Nenhum search term disponível (PMAX não expõe termos individuais via API).');
    r.forEach(row => {
      const st = row.search_term_view; const m = row.metrics;
      const g = parseFloat(fmt(m.cost_micros)); const rv = m.conversions_value||0;
      const cv = m.conversions;
      const icon = cv>0?'✅':g>2?'⚠️':'  ';
      console.log(`   ${icon} "${st.search_term}" | Gasto:R$${g.toFixed(2)} | Clicks:${m.clicks} | Conv:${cv} | ROAS:${roas(rv,g)}x`);
      report.searchTerms.push({ campanha:row.campaign.name, termo:st.search_term,
        status:st.status, gasto:g, cliques:m.clicks, conversoes:cv, receita:(rv||0).toFixed(2), roas:roas(rv,g) });
    });
  } catch(e) { console.log(`   Termos não disponíveis via API para PMAX: ${e.message}`); }

  // ════════════════════════════════════════════════
  // 8. DISPOSITIVOS
  // ════════════════════════════════════════════════
  console.log('\n【8】 PERFORMANCE POR DISPOSITIVO (últimos 30 dias)');
  sep();
  try {
    const r = await customer.query(`
      SELECT segments.device, metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status = 'ENABLED'
    `);
    const agg = {};
    r.forEach(row => {
      const d = DEVICE[row.segments.device] || row.segments.device;
      const m = row.metrics;
      if (!agg[d]) agg[d] = { impressoes:0, cliques:0, gasto:0, conversoes:0, receita:0 };
      agg[d].impressoes  += m.impressions;
      agg[d].cliques     += m.clicks;
      agg[d].gasto       += m.cost_micros/1e6;
      agg[d].conversoes  += m.conversions;
      agg[d].receita     += (m.conversions_value||0);
    });
    const totalGasto = Object.values(agg).reduce((s,d)=>s+d.gasto,0);
    Object.entries(agg).sort((a,b)=>b[1].gasto-a[1].gasto).forEach(([dev,d]) => {
      const pct = totalGasto>0 ? ((d.gasto/totalGasto)*100).toFixed(1) : '0';
      console.log(`   📱 ${dev.padEnd(10)} Gasto:R$${d.gasto.toFixed(2)} (${pct}%) | Conv:${d.conversoes.toFixed(1)} | ROAS:${roas(d.receita,d.gasto)}x | CPA:R$${cpa(d.gasto,d.conversoes)}`);
      report.dispositivos.push({ dispositivo:dev, gasto:d.gasto.toFixed(2), pct,
        conversoes:d.conversoes.toFixed(1), roas:roas(d.receita,d.gasto), cpa:cpa(d.gasto,d.conversoes) });
    });
  } catch(e) { console.log(`   ERRO: ${e.message}`); }

  // ════════════════════════════════════════════════
  // 9. GEOGRÁFICO
  // ════════════════════════════════════════════════
  console.log('\n【9】 PERFORMANCE GEOGRÁFICA — TOP 15 ESTADOS (últimos 30 dias)');
  sep();
  try {
    const r = await customer.query(`
      SELECT geographic_view.country_criterion_id, geographic_view.location_type,
             segments.geo_target_state, metrics.impressions, metrics.clicks,
             metrics.cost_micros, metrics.conversions, metrics.conversions_value
      FROM geographic_view
      WHERE segments.date DURING LAST_30_DAYS
        AND metrics.clicks > 0
      ORDER BY metrics.cost_micros DESC
      LIMIT 15
    `);
    if (r.length === 0) console.log('   Dados geográficos não disponíveis.');
    r.forEach(row => {
      const m = row.metrics; const g = m.cost_micros/1e6; const rv = m.conversions_value||0;
      const geo = row.segments?.geo_target_state || row.geographic_view?.country_criterion_id || 'N/A';
      console.log(`   📍 ${String(geo).padEnd(30)} Gasto:R$${g.toFixed(2)} | Clicks:${m.clicks} | Conv:${m.conversions.toFixed(1)} | ROAS:${roas(rv,g)}x`);
      report.geografico.push({ local:geo, gasto:g.toFixed(2), cliques:m.clicks,
        conversoes:m.conversions.toFixed(1), roas:roas(rv,g) });
    });
  } catch(e) { console.log(`   ERRO geo: ${e.message}`); }

  // ════════════════════════════════════════════════
  // 10. HISTÓRICO MENSAL
  // ════════════════════════════════════════════════
  console.log('\n【10】 HISTÓRICO MENSAL (últimos 6 meses)');
  sep();
  try {
    const r = await customer.query(`
      SELECT segments.month, metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.conversions_value, metrics.average_cpc, metrics.ctr
      FROM campaign
      WHERE segments.date DURING LAST_180_DAYS
        AND campaign.status != 'REMOVED'
      ORDER BY segments.month DESC
    `);
    const byMonth = {};
    r.forEach(row => {
      const m = row.metrics; const mes = row.segments.month;
      if (!byMonth[mes]) byMonth[mes] = { impressoes:0, cliques:0, gasto:0, conversoes:0, receita:0, cpc_sum:0, n:0 };
      byMonth[mes].impressoes  += m.impressions;
      byMonth[mes].cliques     += m.clicks;
      byMonth[mes].gasto       += m.cost_micros/1e6;
      byMonth[mes].conversoes  += m.conversions;
      byMonth[mes].receita     += (m.conversions_value||0);
    });
    Object.entries(byMonth).sort((a,b)=>a[0]<b[0]?1:-1).forEach(([mes,d]) => {
      const roasMes = d.gasto>0 ? (d.receita/d.gasto).toFixed(2) : 'N/A';
      const cpaMes  = d.conversoes>0 ? (d.gasto/d.conversoes).toFixed(2) : 'N/A';
      console.log(`   📅 ${mes}  Gasto:R$${d.gasto.toFixed(2)} | Clicks:${d.cliques} | Conv:${d.conversoes.toFixed(0)} | Receita:R$${d.receita.toFixed(0)} | ROAS:${roasMes}x | CPA:R$${cpaMes}`);
      report.historico.push({ mes, gasto:d.gasto.toFixed(2), cliques:d.cliques,
        conversoes:d.conversoes.toFixed(0), receita:d.receita.toFixed(0), roas:roasMes, cpa:cpaMes });
    });
  } catch(e) { console.log(`   ERRO histórico: ${e.message}`); }

  // ════════════════════════════════════════════════
  // 11. CAMPANHAS PAUSADAS — HISTÓRICO
  // ════════════════════════════════════════════════
  console.log('\n【11】 CAMPANHAS PAUSADAS — HISTÓRICO COMPLETO (90 dias)');
  sep();
  try {
    const r = await customer.query(`
      SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
             metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${D_FROM90}' AND '${D_TO}'
        AND campaign.status = 'PAUSED'
      ORDER BY metrics.cost_micros DESC
    `);
    if (r.length === 0) console.log('   Nenhuma campanha pausada com histórico nos últimos 90 dias.');
    r.forEach(row => {
      const c = row.campaign; const m = row.metrics;
      const g = m.cost_micros/1e6; const rv = m.conversions_value||0;
      console.log(`   🟡 ${c.name} [${TIPO[c.advertising_channel_type]}]`);
      console.log(`      Gasto:R$${g.toFixed(2)} | Clicks:${m.clicks} | Conv:${m.conversions.toFixed(1)} | ROAS:${roas(rv,g)}x`);
    });
  } catch(e) { console.log(`   ERRO: ${e.message}`); }

  // ════════════════════════════════════════════════
  // 12. MERCHANT CENTER
  // ════════════════════════════════════════════════
  console.log('\n【12】 MERCHANT CENTER / SHOPPING');
  sep();
  try {
    const r = await customer.query(`
      SELECT shopping_performance_view.resource_name,
             segments.product_title, segments.product_store_id,
             metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.conversions_value
      FROM shopping_performance_view
      WHERE segments.date DURING LAST_30_DAYS
        AND metrics.impressions > 0
      ORDER BY metrics.conversions_value DESC
      LIMIT 20
    `);
    if (r.length === 0) console.log('   Sem dados de Shopping (campanhas pausadas ou sem feed ativo).');
    r.forEach(row => {
      const m = row.metrics; const g = m.cost_micros/1e6; const rv = m.conversions_value||0;
      const titulo = row.segments?.product_title || 'Produto';
      console.log(`   🛍️  ${titulo.substring(0,55)}`);
      console.log(`       Clicks:${m.clicks} | Conv:${m.conversions.toFixed(1)} | Receita:R$${rv.toFixed(2)} | ROAS:${roas(rv,g)}x`);
    });
  } catch(e) { console.log(`   Merchant Center: ${e.message}`); }

  // ════════════════════════════════════════════════
  // RESUMO FINAL E PLANO DE AÇÃO
  // ════════════════════════════════════════════════
  const totalGasto30   = report.campanhas.reduce((s,c)=>s+parseFloat(c.gasto||0),0);
  const totalConv30    = report.campanhas.reduce((s,c)=>s+parseFloat(c.conversoes||0),0);
  const totalReceita30 = report.campanhas.reduce((s,c)=>s+parseFloat(c.receita||0),0);

  console.log('\n');
  console.log('═'.repeat(70));
  console.log('  RESUMO EXECUTIVO — 30 DIAS');
  console.log('═'.repeat(70));
  console.log(`  Investimento:  R$ ${totalGasto30.toFixed(2)}`);
  console.log(`  Receita:       R$ ${totalReceita30.toFixed(2)}`);
  console.log(`  Conversões:    ${totalConv30.toFixed(0)} vendas`);
  console.log(`  ROAS Geral:    ${roas(totalReceita30, totalGasto30)}x`);
  console.log(`  CPA Médio:     R$ ${cpa(totalGasto30, totalConv30)}`);
  if (totalConv30 > 0) {
    const ticketMedio = totalReceita30 / totalConv30;
    console.log(`  Ticket Médio:  R$ ${ticketMedio.toFixed(2)}`);
  }

  // ALERTAS FINAIS
  if (report.alertas.length > 0) {
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('  🚨 ALERTAS ENCONTRADOS');
    console.log('═'.repeat(70));
    report.alertas.forEach((a,i) => console.log(`  [${a.nivel}] ${a.area}: ${a.msg}`));
  }

  // SALVAR
  const dir = path.resolve(__dirname,'../reports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
  const file = path.join(dir, `auditoria-completa-${D_TO}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log(`\n  ✅ Relatório JSON salvo: ${file}`);
  console.log('═'.repeat(70));
}

run().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1); });
