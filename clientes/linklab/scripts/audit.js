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

const STATUS = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'ENABLED', 3: 'PAUSED', 4: 'REMOVED' };
const TIPO   = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'SEARCH', 3: 'DISPLAY', 4: 'SHOPPING', 5: 'HOTEL', 6: 'VIDEO', 7: 'MULTI_CHANNEL', 8: 'LOCAL', 9: 'SMART', 10: 'PERFORMANCE_MAX', 11: 'LOCAL_SERVICES', 12: 'DISCOVERY', 13: 'TRAVEL', 14: 'DEMAND_GEN' };
const MATCH  = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'EXACT', 3: 'PHRASE', 4: 'BROAD' };

const TODAY = new Date();
const DATE_TO = TODAY.toISOString().slice(0, 10);
const d30 = new Date(TODAY); d30.setDate(d30.getDate() - 30);
const DATE_FROM = d30.toISOString().slice(0, 10);

async function audit() {
  console.log('=================================================');
  console.log('  AUDITORIA COMPLETA — Linklab Científica');
  console.log(`  Conta: ${CUSTOMER_ID} | MCC: ${LOGIN_CUSTOMER_ID}`);
  console.log(`  Período: ${DATE_FROM} → ${DATE_TO}`);
  console.log('=================================================\n');

  const report = {
    geradoEm: new Date().toISOString(),
    conta: CUSTOMER_ID,
    mcc: LOGIN_CUSTOMER_ID,
    periodo: { de: DATE_FROM, ate: DATE_TO },
    campanhas: [],
    conversoes: [],
    resumo30dias: {},
    alertasCriticos: [],
  };

  // 1. INFO DA CONTA
  console.log('1. Verificando dados da conta...');
  try {
    const contaInfo = await customer.query(`
      SELECT customer.id, customer.descriptive_name, customer.currency_code,
             customer.time_zone, customer.status, customer.auto_tagging_enabled
      FROM customer LIMIT 1
    `);
    if (contaInfo.length > 0) {
      const c = contaInfo[0].customer;
      report.conta_info = {
        id: c.id,
        nome: c.descriptive_name,
        moeda: c.currency_code,
        timezone: c.time_zone,
        status: STATUS[c.status] || c.status,
        auto_tagging: c.auto_tagging_enabled,
      };
      console.log(`   ✅ Conta: ${c.descriptive_name} (${STATUS[c.status] || c.status})`);
      console.log(`   Moeda: ${c.currency_code} | Timezone: ${c.time_zone}`);
      console.log(`   Auto-tagging: ${c.auto_tagging_enabled ? '✅ Ativo' : '⚠️ INATIVO'}`);
    }
  } catch (e) {
    console.log(`   ❌ Erro ao buscar dados da conta: ${e.message}`);
    report.alertasCriticos.push({ tipo: 'API_ERROR', descricao: e.message });
  }

  // 2. CAMPANHAS
  console.log('\n2. Buscando campanhas...');
  try {
    const campanhas = await customer.query(`
      SELECT
        campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign.target_roas.target_roas,
        campaign_budget.amount_micros,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
    `);

    if (campanhas.length === 0) {
      console.log('   ⚠️ Nenhuma campanha encontrada nos últimos 30 dias.');
      report.campanhas = [];
    } else {
      campanhas.forEach(row => {
        const c = row.campaign;
        const b = row.campaign_budget;
        const m = row.metrics;
        const gasto = (m.cost_micros / 1e6);
        const receita = m.conversions_value || 0;
        const roas = gasto > 0 ? (receita / gasto).toFixed(2) : 'N/A';
        const cpa = m.conversions > 0 ? (gasto / m.conversions).toFixed(2) : 'N/A';

        const campData = {
          id: c.id,
          nome: c.name,
          status: STATUS[c.status] || c.status,
          tipo: TIPO[c.advertising_channel_type] || c.advertising_channel_type,
          estrategia: c.bidding_strategy_type,
          orcamento_diario: b ? (b.amount_micros / 1e6).toFixed(2) : 'N/A',
          impressoes: m.impressions,
          cliques: m.clicks,
          gasto: gasto.toFixed(2),
          conversoes: m.conversions,
          receita: receita.toFixed(2),
          roas,
          cpa,
          ctr: (m.ctr * 100).toFixed(2) + '%',
          cpc_medio: (m.average_cpc / 1e6).toFixed(2),
        };
        report.campanhas.push(campData);

        const statusIcon = STATUS[c.status] === 'ENABLED' ? '🟢' : STATUS[c.status] === 'PAUSED' ? '🟡' : '🔴';
        console.log(`   ${statusIcon} [${c.id}] ${c.name}`);
        console.log(`      Tipo: ${TIPO[c.advertising_channel_type]} | Lance: ${c.bidding_strategy_type}`);
        console.log(`      Gasto: R$${gasto.toFixed(2)} | Cliques: ${m.clicks} | Conv: ${m.conversions}`);
        console.log(`      ROAS: ${roas}x | CPA: R$${cpa}`);
      });
    }
  } catch (e) {
    console.log(`   ❌ Erro ao buscar campanhas: ${e.message}`);
    report.alertasCriticos.push({ tipo: 'CAMPANHAS_ERROR', descricao: e.message });
  }

  // 3. TAGS DE CONVERSÃO
  console.log('\n3. Verificando tags de conversão...');
  try {
    const conversoes = await customer.query(`
      SELECT
        conversion_action.id, conversion_action.name, conversion_action.status,
        conversion_action.category, conversion_action.type,
        conversion_action.primary_for_goal,
        conversion_action.counting_type
      FROM conversion_action
      WHERE conversion_action.status != 'REMOVED'
    `);

    if (conversoes.length === 0) {
      console.log('   ⚠️ Nenhuma tag de conversão configurada!');
      report.alertasCriticos.push({ tipo: 'SEM_CONVERSOES', descricao: 'Nenhuma tag de conversão configurada' });
    } else {
      conversoes.forEach(row => {
        const cv = row.conversion_action;
        const isPrimary = cv.primary_for_goal;
        report.conversoes.push({
          id: cv.id,
          nome: cv.name,
          status: cv.status,
          categoria: cv.category,
          tipo: cv.type,
          primaria: isPrimary,
        });
        const icon = isPrimary ? '⭐' : '  ';
        console.log(`   ${icon} [${cv.id}] ${cv.name}`);
        console.log(`      Categoria: ${cv.category} | Tipo: ${cv.type} | Primária: ${isPrimary ? 'SIM' : 'NÃO'}`);
      });
    }
  } catch (e) {
    console.log(`   ❌ Erro ao buscar conversões: ${e.message}`);
  }

  // 4. RESUMO GERAL
  console.log('\n4. Calculando resumo...');
  const totalGasto = report.campanhas.reduce((s, c) => s + parseFloat(c.gasto), 0);
  const totalCliques = report.campanhas.reduce((s, c) => s + c.cliques, 0);
  const totalConversoes = report.campanhas.reduce((s, c) => s + c.conversoes, 0);
  const totalReceita = report.campanhas.reduce((s, c) => s + parseFloat(c.receita), 0);
  const roasGeral = totalGasto > 0 ? (totalReceita / totalGasto).toFixed(2) : 'N/A';
  const cpaGeral = totalConversoes > 0 ? (totalGasto / totalConversoes).toFixed(2) : 'N/A';

  report.resumo30dias = {
    gasto_total: totalGasto.toFixed(2),
    cliques_total: totalCliques,
    conversoes_total: totalConversoes,
    receita_total: totalReceita.toFixed(2),
    roas_geral: roasGeral,
    cpa_geral: cpaGeral,
    campanhas_ativas: report.campanhas.filter(c => c.status === 'ENABLED').length,
    campanhas_pausadas: report.campanhas.filter(c => c.status === 'PAUSED').length,
  };

  console.log(`\n   📊 RESUMO 30 DIAS:`);
  console.log(`   Gasto Total: R$ ${totalGasto.toFixed(2)}`);
  console.log(`   Cliques: ${totalCliques} | Conversões: ${totalConversoes}`);
  console.log(`   Receita: R$ ${totalReceita.toFixed(2)}`);
  console.log(`   ROAS Geral: ${roasGeral}x | CPA Médio: R$ ${cpaGeral}`);
  console.log(`   Campanhas ativas: ${report.resumo30dias.campanhas_ativas} | Pausadas: ${report.resumo30dias.campanhas_pausadas}`);

  // 5. ALERTAS CRÍTICOS
  console.log('\n5. Analisando alertas críticos...');
  if (report.conversoes.length === 0) {
    report.alertasCriticos.push({ nivel: 'CRÍTICO', descricao: 'Nenhuma tag de conversão configurada — impossível medir ROAS' });
  }
  if (report.campanhas.length === 0) {
    report.alertasCriticos.push({ nivel: 'CRÍTICO', descricao: 'Conta sem campanhas ativas — conta nova ou tudo pausado' });
  }
  if (report.conta_info && !report.conta_info.auto_tagging) {
    report.alertasCriticos.push({ nivel: 'ATENÇÃO', descricao: 'Auto-tagging desativado — pode impactar rastreamento de conversões' });
  }

  if (report.alertasCriticos.length > 0) {
    console.log(`   ⚠️ ${report.alertasCriticos.length} alerta(s) encontrado(s):`);
    report.alertasCriticos.forEach(a => console.log(`   - [${a.nivel || 'INFO'}] ${a.descricao}`));
  } else {
    console.log('   ✅ Nenhum alerta crítico encontrado.');
  }

  // SALVAR RELATÓRIO
  const reportsDir = path.resolve(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const filename = path.join(reportsDir, `audit-${DATE_TO}.json`);
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));

  console.log('\n=================================================');
  console.log(`✅ Auditoria concluída. Relatório salvo em: ${filename}`);
  console.log('=================================================');
}

audit().catch(e => {
  console.error('ERRO FATAL:', e.message);
  process.exit(1);
});
