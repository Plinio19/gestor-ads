require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
const path = require('path');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  developer_token: DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: CUSTOMER_ID,
  login_customer_id: LOGIN_CUSTOMER_ID,
  refresh_token: REFRESH_TOKEN,
});

// Desde a fundação (julho/2025) até hoje
const DATE_FROM = '2025-07-01';
const DATE_TO   = new Date().toISOString().slice(0, 10);

const STATUS = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'ENABLED', 3: 'PAUSED', 4: 'REMOVED' };
const TIPO   = { 2: 'SEARCH', 3: 'DISPLAY', 4: 'SHOPPING', 9: 'SMART', 10: 'PERFORMANCE_MAX', 14: 'DEMAND_GEN' };

async function historico() {
  console.log('=================================================');
  console.log('  HISTÓRICO COMPLETO — ExpressLab Equipamentos');
  console.log(`  Conta: ${CUSTOMER_ID} | MCC: ${LOGIN_CUSTOMER_ID}`);
  console.log(`  Período: ${DATE_FROM} → ${DATE_TO} (fundação até hoje)`);
  console.log('=================================================\n');

  const report = { geradoEm: new Date().toISOString(), periodo: { de: DATE_FROM, ate: DATE_TO }, campanhas: [], conversoesPorMes: [], termosNegativados: [], resumoGeral: {} };

  // ── 1. PERFORMANCE POR CAMPANHA (histórico total) ────────────────────────────
  console.log('1. Performance histórica por campanha...');
  try {
    const rows = await customer.query(`
      SELECT
        campaign.id, campaign.name, campaign.status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign_budget.amount_micros,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.ctr, metrics.average_cpc, metrics.conversions,
        metrics.conversions_value, metrics.cost_per_conversion,
        metrics.all_conversions, metrics.view_through_conversions
      FROM campaign
      WHERE segments.date BETWEEN '${DATE_FROM}' AND '${DATE_TO}'
      ORDER BY metrics.cost_micros DESC
    `);

    const map = {};
    for (const row of rows) {
      const c = row.campaign;
      const m = row.metrics;
      const id = c.id;
      if (!map[id]) {
        map[id] = {
          id, nome: c.name,
          status: STATUS[c.status] ?? c.status,
          tipo: TIPO[c.advertising_channel_type] ?? c.advertising_channel_type,
          estrategiaLance: c.bidding_strategy_type,
          orcamentoDiarioAtual: row.campaign_budget?.amount_micros
            ? 'R$ ' + (row.campaign_budget.amount_micros / 1_000_000).toFixed(2) : 'N/A',
          totais: { impressoes: 0, cliques: 0, custo: 0, conversoes: 0, conversoes_value: 0, allConversoes: 0 },
        };
      }
      map[id].totais.impressoes       += Number(m.impressions ?? 0);
      map[id].totais.cliques          += Number(m.clicks ?? 0);
      map[id].totais.custo            += Number(m.cost_micros ?? 0) / 1_000_000;
      map[id].totais.conversoes       += Number(m.conversions ?? 0);
      map[id].totais.conversoes_value += Number(m.conversions_value ?? 0);
      map[id].totais.allConversoes    += Number(m.all_conversions ?? 0);
    }

    let totalGeral = { impressoes: 0, cliques: 0, custo: 0, conversoes: 0, conversoes_value: 0 };

    for (const camp of Object.values(map)) {
      const t = camp.totais;
      t.ctr      = t.impressoes > 0 ? ((t.cliques / t.impressoes) * 100).toFixed(2) + '%' : '0%';
      t.cpcMedio = t.cliques > 0 ? 'R$ ' + (t.custo / t.cliques).toFixed(2) : 'R$ 0,00';
      t.roas     = t.custo > 0 ? (t.conversoes_value / t.custo).toFixed(2) + 'x' : '0x';
      t.cpa      = t.conversoes > 0 ? 'R$ ' + (t.custo / t.conversoes).toFixed(2) : 'N/A';

      totalGeral.impressoes       += t.impressoes;
      totalGeral.cliques          += t.cliques;
      totalGeral.custo            += t.custo;
      totalGeral.conversoes       += t.conversoes;
      totalGeral.conversoes_value += t.conversoes_value;

      const custof = t.custo;
      t.custo = 'R$ ' + custof.toFixed(2);
      t.conversoes_value = 'R$ ' + t.conversoes_value.toFixed(2);

      report.campanhas.push(camp);
      const icon = camp.status === 'ENABLED' ? '✅' : '⏸️ ';
      console.log(`   ${icon} ${camp.nome}`);
      console.log(`      Impressões: ${t.impressoes.toLocaleString('pt-BR')} | Cliques: ${t.cliques} | Custo: ${t.custo} | Conv.: ${t.conversoes} | ROAS: ${t.roas}`);
    }

    if (Object.keys(map).length === 0) {
      console.log('   ℹ️  Sem dados de performance no período — conta sem gastos desde a fundação.');
    }

    const custoTotal = totalGeral.custo;
    report.resumoGeral = {
      periodo: `${DATE_FROM} → ${DATE_TO}`,
      impressoes: totalGeral.impressoes,
      cliques: totalGeral.cliques,
      custoTotal: 'R$ ' + custoTotal.toFixed(2),
      conversoes: totalGeral.conversoes,
      receita_conversoes: 'R$ ' + totalGeral.conversoes_value.toFixed(2),
      ctr: totalGeral.impressoes > 0 ? ((totalGeral.cliques / totalGeral.impressoes) * 100).toFixed(2) + '%' : '0%',
      cpcMedio: totalGeral.cliques > 0 ? 'R$ ' + (custoTotal / totalGeral.cliques).toFixed(2) : 'R$ 0,00',
      roas: custoTotal > 0 ? (totalGeral.conversoes_value / custoTotal).toFixed(2) + 'x' : '0x',
      cpa: totalGeral.conversoes > 0 ? 'R$ ' + (custoTotal / totalGeral.conversoes).toFixed(2) : 'N/A',
    };

  } catch (e) {
    console.log(`   ✗ Erro: ${e.message}`);
  }

  // ── 2. PERFORMANCE MENSAL (segmentado por mês) ───────────────────────────────
  console.log('\n2. Performance mensal detalhada...');
  try {
    const rows = await customer.query(`
      SELECT
        segments.month,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.conversions, metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${DATE_FROM}' AND '${DATE_TO}'
      ORDER BY segments.month ASC
    `);

    const meses = {};
    for (const row of rows) {
      const mes = row.segments?.month ?? 'unknown';
      if (!meses[mes]) meses[mes] = { impressoes: 0, cliques: 0, custo: 0, conversoes: 0, conversoes_value: 0 };
      const m = row.metrics;
      meses[mes].impressoes       += Number(m.impressions ?? 0);
      meses[mes].cliques          += Number(m.clicks ?? 0);
      meses[mes].custo            += Number(m.cost_micros ?? 0) / 1_000_000;
      meses[mes].conversoes       += Number(m.conversions ?? 0);
      meses[mes].conversoes_value += Number(m.conversions_value ?? 0);
    }

    for (const [mes, d] of Object.entries(meses)) {
      const linha = {
        mes,
        impressoes: d.impressoes,
        cliques: d.cliques,
        custo: 'R$ ' + d.custo.toFixed(2),
        conversoes: d.conversoes,
        receita: 'R$ ' + d.conversoes_value.toFixed(2),
        roas: d.custo > 0 ? (d.conversoes_value / d.custo).toFixed(2) + 'x' : '0x',
      };
      report.conversoesPorMes.push(linha);
      console.log(`   ${mes}: ${d.cliques} cliques | R$ ${d.custo.toFixed(2)} gasto | ${d.conversoes} conv. | ROAS ${linha.roas}`);
    }
    if (Object.keys(meses).length === 0) {
      console.log('   ℹ️  Sem dados mensais — conta sem impressões desde julho/2025');
    }
  } catch (e) {
    console.log(`   ✗ Erro: ${e.message}`);
  }

  // ── 3. TERMOS DE BUSCA HISTÓRICOS ────────────────────────────────────────────
  console.log('\n3. Termos de busca históricos (top 30 por cliques)...');
  try {
    const rows = await customer.query(`
      SELECT
        search_term_view.search_term,
        search_term_view.status,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.conversions, metrics.ctr
      FROM search_term_view
      WHERE segments.date BETWEEN '${DATE_FROM}' AND '${DATE_TO}'
        AND metrics.clicks > 0
      ORDER BY metrics.clicks DESC
      LIMIT 30
    `);

    report.termosNegativados = rows.map(r => ({
      termo: r.search_term_view?.search_term,
      status: r.search_term_view?.status,
      impressoes: r.metrics?.impressions,
      cliques: r.metrics?.clicks,
      custo: r.metrics?.cost_micros ? 'R$ ' + (r.metrics.cost_micros / 1_000_000).toFixed(2) : 'R$ 0,00',
      conversoes: r.metrics?.conversions,
    }));

    if (rows.length === 0) {
      console.log('   ℹ️  Sem termos de busca registrados — conta sem tráfego no período');
    } else {
      for (const r of report.termosNegativados.slice(0, 10)) {
        console.log(`   "${r.termo}" — ${r.cliques} cliques | ${r.custo} | ${r.conversoes} conv.`);
      }
      if (report.termosNegativados.length > 10) {
        console.log(`   ... e mais ${report.termosNegativados.length - 10} termos no JSON`);
      }
    }
  } catch (e) {
    console.log(`   ✗ Erro: ${e.message}`);
  }

  // ── 4. MERCHANT CENTER ────────────────────────────────────────────────────────
  console.log('\n4. Google Merchant Center...');
  try {
    const rows = await customer.query(`
      SELECT
        merchant_center_link.merchant_center_id,
        merchant_center_link.status
      FROM merchant_center_link
    `);
    if (rows.length === 0) {
      report.merchantCenter = { vinculado: false };
      console.log('   ✗ Merchant Center NÃO vinculado');
    } else {
      report.merchantCenter = {
        vinculado: true,
        contas: rows.map(r => ({
          id: r.merchant_center_link?.merchant_center_id,
          status: r.merchant_center_link?.status,
        })),
      };
      console.log(`   ✓ Merchant Center vinculado:`);
      for (const r of rows) {
        console.log(`     ID: ${r.merchant_center_link?.merchant_center_id} | Status: ${r.merchant_center_link?.status}`);
      }
    }
  } catch (e) {
    report.merchantCenter = { erro: e.message };
    console.log(`   ✗ Erro ao verificar Merchant Center: ${e.message}`);
  }

  // ── 5. SALVAR ─────────────────────────────────────────────────────────────────
  const reportsDir = path.resolve(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const filename = path.join(reportsDir, `historico-completo-${DATE_TO}.json`);
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));

  console.log('\n=================================================');
  console.log('  RESUMO GERAL — DESDE A FUNDAÇÃO');
  console.log('=================================================');
  const r = report.resumoGeral;
  if (r && r.custoTotal) {
    console.log(`  Período:       ${r.periodo}`);
    console.log(`  Impressões:    ${(r.impressoes ?? 0).toLocaleString('pt-BR')}`);
    console.log(`  Cliques:       ${(r.cliques ?? 0).toLocaleString('pt-BR')}`);
    console.log(`  Custo Total:   ${r.custoTotal}`);
    console.log(`  Conversões:    ${r.conversoes}`);
    console.log(`  Receita:       ${r.receita_conversoes}`);
    console.log(`  ROAS:          ${r.roas}`);
    console.log(`  CPA:           ${r.cpa}`);
  } else {
    console.log('  Sem dados de performance desde a fundação.');
  }

  console.log(`\n📁 Relatório salvo em: ${filename}`);
  return report;
}

historico().catch(err => {
  console.error('\n❌ ERRO:', err.message || err);
  process.exit(1);
});
