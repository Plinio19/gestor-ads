require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const fmt  = n => Number(n||0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hoje = new Date();
const sub  = (n) => { const x = new Date(hoje); x.setDate(x.getDate() - n); return x.toISOString().split('T')[0]; };
const CAMP = '22137404594';
const sep  = '═'.repeat(62);
const sep2 = '─'.repeat(62);

const GEO = {
  'geoTargetConstants/20106': 'São Paulo',
  'geoTargetConstants/20094': 'Rio de Janeiro',
  'geoTargetConstants/20104': 'Minas Gerais',
  'geoTargetConstants/20101': 'Paraná',
  'geoTargetConstants/20091': 'Bahia',
  'geoTargetConstants/20102': 'Rio Grande do Sul',
  'geoTargetConstants/20105': 'Santa Catarina',
  'geoTargetConstants/20093': 'Goiás',
  'geoTargetConstants/20092': 'Espírito Santo',
  'geoTargetConstants/20088': 'Ceará',
  'geoTargetConstants/20087': 'Pernambuco',
  'geoTargetConstants/20103': 'Pará',
  'geoTargetConstants/20096': 'Mato Grosso do Sul',
  'geoTargetConstants/20095': 'Mato Grosso',
};

const DEV = { 2: 'Mobile', 3: 'Tablet', 4: 'Desktop', 6: 'TV/Outros' };

async function run() {
  console.log('\n' + sep);
  console.log('  VARREDURA COMPLETA — Linklab Científica');
  console.log('  ' + new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
  console.log(sep);

  // ── 1. Performance multi-período ──────────────────────────────
  console.log('\n📈 1. PERFORMANCE\n');

  for (const [lbl, dias] of [['7 dias', 7], ['30 dias', 30], ['90 dias', 90]]) {
    const rows = await customer.query(`
      SELECT metrics.cost_micros, metrics.conversions_value, metrics.conversions,
             metrics.clicks, metrics.impressions
      FROM campaign
      WHERE campaign.id = '${CAMP}'
        AND segments.date BETWEEN '${sub(dias)}' AND '${sub(1)}'
    `);
    const m = rows.reduce((a, x) => ({
      cost: a.cost + Number(x.metrics.cost_micros) / 1e6,
      rev:  a.rev  + Number(x.metrics.conversions_value),
      conv: a.conv + Number(x.metrics.conversions),
      clk:  a.clk  + Number(x.metrics.clicks),
      imp:  a.imp  + Number(x.metrics.impressions),
    }), { cost: 0, rev: 0, conv: 0, clk: 0, imp: 0 });

    const r   = m.cost > 0 ? (m.rev / m.cost).toFixed(1) : '—';
    const cpa = m.conv > 0 ? (m.cost / m.conv).toFixed(2) : '—';
    const ctr = m.imp  > 0 ? ((m.clk / m.imp) * 100).toFixed(2) : '—';
    const ok  = m.cost > 0 && (m.rev / m.cost) >= 8 ? '✅' : '⚠️ ';
    console.log(`  ${lbl.padEnd(9)} Invest: R$${fmt(m.cost).padStart(9)} | Receita: R$${fmt(m.rev).padStart(11)} | ROAS: ${(r + 'x').padStart(6)} ${ok} | Conv: ${Math.round(m.conv).toString().padStart(3)} | CPA: R$${cpa} | CTR: ${ctr}%`);
  }

  // ── 2. Tendência semanal ───────────────────────────────────────
  console.log('\n' + sep2);
  console.log('📅 2. TENDÊNCIA SEMANAL (últimas 10 semanas)\n');

  const wkRows = await customer.query(`
    SELECT segments.week, metrics.cost_micros, metrics.conversions_value, metrics.conversions
    FROM campaign
    WHERE campaign.id = '${CAMP}'
      AND segments.date BETWEEN '${sub(70)}' AND '${sub(1)}'
  `);

  const sw = {};
  wkRows.forEach(d => {
    const w = d.segments.week;
    if (!sw[w]) sw[w] = { cost: 0, rev: 0, conv: 0 };
    sw[w].cost += Number(d.metrics.cost_micros) / 1e6;
    sw[w].rev  += Number(d.metrics.conversions_value);
    sw[w].conv += Number(d.metrics.conversions);
  });

  Object.keys(sw).sort().forEach(w => {
    const s  = sw[w];
    const r  = s.cost > 0 ? (s.rev / s.cost).toFixed(1) : '—';
    const ok = s.cost > 0 && (s.rev / s.cost) >= 8 ? '✅' : '⚠️ ';
    console.log(`  ${w}  R$${fmt(s.cost).padStart(8)} → R$${fmt(s.rev).padStart(11)}  ROAS: ${(r + 'x').padStart(6)} ${ok}  Conv: ${s.conv.toFixed(1)}`);
  });

  // ── 3. Search Term Insights ────────────────────────────────────
  console.log('\n' + sep2);
  console.log('🔍 3. TERMOS DE PESQUISA — top 40 por conversão\n');

  try {
    const ins = await customer.query(`
      SELECT campaign_search_term_insight.category_label,
             metrics.clicks, metrics.impressions, metrics.conversions
      FROM campaign_search_term_insight
      WHERE campaign.id = '${CAMP}'
      ORDER BY metrics.conversions DESC
      LIMIT 40
    `);

    if (!ins.length) {
      console.log('  (dados não disponíveis)');
    } else {
      console.log('  ' + 'TERMO'.padEnd(47) + 'CLIQUES'.padStart(8) + 'CONV'.padStart(7) + 'CTR%'.padStart(7));
      console.log('  ' + '-'.repeat(69));
      ins.forEach(i => {
        const lbl  = i.campaign_search_term_insight?.category_label || '(outros / sem rótulo)';
        const conv = Number(i.metrics.conversions);
        const clk  = Number(i.metrics.clicks);
        const imp  = Number(i.metrics.impressions);
        const ctr  = imp > 0 ? ((clk / imp) * 100).toFixed(1) : '—';
        const icon = conv >= 10 ? '🏆' : conv >= 5 ? '✅' : conv >= 2 ? '  ' : '  ';
        console.log(`  ${icon} ${lbl.slice(0, 44).padEnd(45)} ${String(Math.round(clk)).padStart(7)} ${conv.toFixed(1).padStart(7)} ${(ctr + '%').padStart(7)}`);
      });
    }
  } catch (e) {
    console.log('  Erro: ' + (e?.message?.split('\n')[0] || e));
  }

  // ── 4. Geo ──────────────────────────────────────────────────────
  console.log('\n' + sep2);
  console.log('🗺️  4. ESTADOS — 30 dias\n');

  try {
    const geo = await customer.query(`
      SELECT campaign.id, segments.geo_target_state,
             metrics.cost_micros, metrics.conversions_value, metrics.conversions, metrics.clicks
      FROM geographic_view
      WHERE campaign.id = '${CAMP}'
        AND segments.date BETWEEN '${sub(30)}' AND '${sub(1)}'
      ORDER BY metrics.cost_micros DESC
      LIMIT 20
    `);

    console.log('  ' + 'ESTADO'.padEnd(22) + 'INVEST'.padStart(10) + 'RECEITA'.padStart(12) + 'ROAS'.padStart(8) + 'CONV'.padStart(6));
    console.log('  ' + '-'.repeat(58));

    geo.forEach(g => {
      const cost = Number(g.metrics.cost_micros) / 1e6;
      const rev  = Number(g.metrics.conversions_value);
      const conv = Number(g.metrics.conversions);
      const r    = cost > 0 ? (rev / cost).toFixed(1) : '—';
      const ok   = cost > 50 && (rev / cost) < 5 ? '⚠️ ' : cost > 0 && (rev / cost) >= 8 ? '✅ ' : '   ';
      const nome = (GEO[g.segments?.geo_target_state] || g.segments?.geo_target_state || '?').slice(0, 20);
      console.log(`  ${ok}${nome.padEnd(20)} ${'R$' + fmt(cost).padStart(9)} ${'R$' + fmt(rev).padStart(11)} ${(r + 'x').padStart(7)} ${conv.toFixed(0).padStart(5)}`);
    });
  } catch (e) {
    console.log('  Erro: ' + (e?.message?.split('\n')[0] || e));
  }

  // ── 5. Dispositivos ─────────────────────────────────────────────
  console.log('\n' + sep2);
  console.log('📱 5. DISPOSITIVOS — 30 dias\n');

  const devRows = await customer.query(`
    SELECT segments.device,
           metrics.cost_micros, metrics.conversions_value, metrics.conversions, metrics.clicks
    FROM campaign
    WHERE campaign.id = '${CAMP}'
      AND segments.date BETWEEN '${sub(30)}' AND '${sub(1)}'
  `);

  const bd = {};
  devRows.forEach(d => {
    const dv = d.segments.device;
    if (!bd[dv]) bd[dv] = { cost: 0, rev: 0, conv: 0, clk: 0 };
    bd[dv].cost += Number(d.metrics.cost_micros) / 1e6;
    bd[dv].rev  += Number(d.metrics.conversions_value);
    bd[dv].conv += Number(d.metrics.conversions);
    bd[dv].clk  += Number(d.metrics.clicks);
  });

  Object.entries(bd).forEach(([dv, m]) => {
    const r  = m.cost > 0 ? (m.rev / m.cost).toFixed(1) : '—';
    const ok = m.cost > 5 && (m.rev / m.cost) < 1 ? '⚠️ ' : m.cost > 0 && (m.rev / m.cost) >= 8 ? '✅ ' : '   ';
    console.log(`  ${ok}${(DEV[dv] || dv).padEnd(12)} R$${fmt(m.cost).padStart(9)} → R$${fmt(m.rev).padStart(11)}  ROAS: ${(r + 'x').padStart(6)}  Conv: ${m.conv.toFixed(0)}  Cliques: ${Math.round(m.clk)}`);
  });

  // ── 6. Asset Groups ──────────────────────────────────────────────
  console.log('\n' + sep2);
  console.log('🎨 6. ASSET GROUPS\n');

  const ags = await customer.query(`
    SELECT asset_group.id, asset_group.name, asset_group.status, asset_group.primary_status,
           metrics.impressions, metrics.clicks, metrics.conversions,
           metrics.cost_micros, metrics.conversions_value
    FROM asset_group
    WHERE campaign.id = '${CAMP}'
  `);

  ags.forEach(ag => {
    const a    = ag.asset_group;
    const m    = ag.metrics;
    const cost = Number(m.cost_micros) / 1e6;
    const r    = cost > 0 ? (Number(m.conversions_value) / cost).toFixed(1) + 'x' : '—';
    const icon = a.status === 2 ? '🟢' : '🟡';
    const stat = a.status === 2 ? 'ATIVO' : 'PAUSADO';
    console.log(`  ${icon} [${a.id}] ${a.name} (${stat})`);
    console.log(`     Impr: ${Number(m.impressions).toLocaleString('pt-BR')} | Cliques: ${Number(m.clicks).toLocaleString('pt-BR')} | Conv: ${Number(m.conversions).toFixed(1)} | ROAS: ${r} | Custo: R$${fmt(cost)}`);
  });

  console.log('\n' + sep);
  console.log('  FIM DA VARREDURA');
  console.log(sep + '\n');
}

run().catch(e => { console.error('ERRO:', e?.message || e); process.exit(1); });
