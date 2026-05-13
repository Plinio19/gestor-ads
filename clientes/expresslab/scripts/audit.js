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
const DATE_TO = TODAY.toISOString().slice(0, 10).replace(/-/g, '-');
const d30 = new Date(TODAY); d30.setDate(d30.getDate() - 30);
const DATE_FROM = d30.toISOString().slice(0, 10).replace(/-/g, '-');

async function audit() {
  console.log('=================================================');
  console.log('  AUDITORIA COMPLETA — ExpressLab Equipamentos');
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
    merchantCenter: null,
    alertasCriticos: [],
  };

  // ── 1. INFO DA CONTA ────────────────────────────────────────────────────────
  console.log('1. Verificando dados da conta...');
  try {
    const contaInfo = await customer.query(`
      SELECT customer.id, customer.descriptive_name, customer.currency_code,
             customer.time_zone, customer.status, customer.auto_tagging_enabled
      FROM customer
      LIMIT 1
    `);
    if (contaInfo.length > 0) {
      const c = contaInfo[0].customer;
      report.conta_info = {
        id: c.id,
        nome: c.descriptive_name,
        moeda: c.currency_code,
        timezone: c.time_zone,
        status: STATUS[c.status] ?? c.status,
        autoTagging: c.auto_tagging_enabled,
      };
      console.log(`   ✓ Conta: ${c.descriptive_name} | ${c.currency_code} | AutoTag: ${c.auto_tagging_enabled}`);
      if (!c.auto_tagging_enabled) {
        report.alertasCriticos.push('⚠️  AUTO-TAGGING DESATIVADO — conversões do GA4 podem não rastrear corretamente');
      }
    }
  } catch (e) {
    console.log(`   ✗ Erro ao buscar info da conta: ${e.message}`);
  }

  // ── 2. CONVERSÕES ───────────────────────────────────────────────────────────
  console.log('\n2. Verificando conversões configuradas...');
  try {
    const convRows = await customer.query(`
      SELECT
        conversion_action.id,
        conversion_action.name,
        conversion_action.status,
        conversion_action.type,
        conversion_action.category,
        conversion_action.counting_type,
        conversion_action.tag_snippets,
        conversion_action.value_settings.default_value,
        conversion_action.value_settings.always_use_default_value
      FROM conversion_action
      WHERE conversion_action.status != 'REMOVED'
    `);

    if (convRows.length === 0) {
      report.alertasCriticos.push('🚨 CRÍTICO: Nenhuma conversão configurada na conta — impossível otimizar para ROAS/CPA');
      console.log('   ✗ NENHUMA CONVERSÃO ENCONTRADA — conta cega para resultados!');
    } else {
      console.log(`   ✓ ${convRows.length} conversão(ões) encontrada(s):`);
      for (const row of convRows) {
        const ca = row.conversion_action;
        const conv = {
          id: ca.id,
          nome: ca.name,
          status: ca.status,
          tipo: ca.type,
          categoria: ca.category,
          contagem: ca.counting_type,
          valorPadrao: ca.value_settings?.default_value ?? 0,
          sempreUsarValorPadrao: ca.value_settings?.always_use_default_value,
        };
        report.conversoes.push(conv);
        const statusIcon = ca.status === 'ENABLED' ? '✅' : '⚠️ ';
        console.log(`      ${statusIcon} [${ca.status}] ${ca.name} (${ca.category})`);
      }
    }
  } catch (e) {
    console.log(`   ✗ Erro ao buscar conversões: ${e.message}`);
    report.alertasCriticos.push(`Erro ao verificar conversões: ${e.message}`);
  }

  // ── 3. CAMPANHAS + PERFORMANCE 30 DIAS ──────────────────────────────────────
  console.log('\n3. Buscando campanhas e performance dos últimos 30 dias...');
  try {
    const campanhasRows = await customer.query(`
      SELECT
        campaign.id, campaign.name, campaign.status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign_budget.amount_micros,
        campaign_budget.explicitly_shared,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.ctr, metrics.average_cpc, metrics.conversions,
        metrics.conversions_value, metrics.cost_per_conversion,
        metrics.search_impression_share, metrics.search_budget_lost_impression_share,
        metrics.search_rank_lost_impression_share
      FROM campaign
      WHERE segments.date BETWEEN '${DATE_FROM}' AND '${DATE_TO}'
      ORDER BY metrics.cost_micros DESC
    `);

    if (campanhasRows.length === 0) {
      // tenta sem filtro de data (conta pode não ter dados no período)
      const semDados = await customer.query(`
        SELECT campaign.id, campaign.name, campaign.status,
               campaign.advertising_channel_type, campaign.bidding_strategy_type,
               campaign_budget.amount_micros
        FROM campaign
        ORDER BY campaign.name ASC
      `);
      if (semDados.length === 0) {
        console.log('   ℹ️  Nenhuma campanha encontrada na conta.');
        report.alertasCriticos.push('ℹ️  Conta sem campanhas — setup não foi iniciado');
      } else {
        console.log(`   ✓ ${semDados.length} campanha(s) encontradas (sem dados de performance ainda):`);
        for (const row of semDados) {
          const c = row.campaign;
          report.campanhas.push({
            id: c.id,
            nome: c.nome,
            status: STATUS[c.status] ?? c.status,
            tipo: TIPO[c.advertising_channel_type] ?? c.advertising_channel_type,
            orcamentoDiario: row.campaign_budget?.amount_micros
              ? 'R$ ' + (row.campaign_budget.amount_micros / 1_000_000).toFixed(2)
              : 'N/A',
            metricas: { impressoes: 0, cliques: 0, custo: 'R$ 0,00', conversoes: 0 },
          });
          const icon = STATUS[c.status] === 'ENABLED' ? '✅' : '⏸️ ';
          console.log(`      ${icon} [${STATUS[c.status] ?? c.status}] ${c.name} | ${TIPO[c.advertising_channel_type] ?? c.advertising_channel_type}`);
        }
      }
    } else {
      let totalImpr = 0, totalCliques = 0, totalCusto = 0, totalConv = 0, totalConvValue = 0;

      console.log(`   ✓ ${campanhasRows.length} linha(s) de performance encontradas:`);
      const campanhasMap = {};

      for (const row of campanhasRows) {
        const c = row.campaign;
        const m = row.metrics;
        const id = c.id;

        totalImpr      += Number(m.impressions ?? 0);
        totalCliques   += Number(m.clicks ?? 0);
        totalCusto     += Number(m.cost_micros ?? 0);
        totalConv      += Number(m.conversions ?? 0);
        totalConvValue += Number(m.conversions_value ?? 0);

        if (!campanhasMap[id]) {
          campanhasMap[id] = {
            id,
            nome: c.name,
            status: STATUS[c.status] ?? c.status,
            tipo: TIPO[c.advertising_channel_type] ?? c.advertising_channel_type,
            estrategiaLance: c.bidding_strategy_type,
            orcamentoDiario: row.campaign_budget?.amount_micros
              ? 'R$ ' + (row.campaign_budget.amount_micros / 1_000_000).toFixed(2)
              : 'N/A',
            metricas: { impressoes: 0, cliques: 0, custo: 0, conversoes: 0, conversoes_value: 0 },
          };
        }
        campanhasMap[id].metricas.impressoes      += Number(m.impressions ?? 0);
        campanhasMap[id].metricas.cliques         += Number(m.clicks ?? 0);
        campanhasMap[id].metricas.custo           += Number(m.cost_micros ?? 0) / 1_000_000;
        campanhasMap[id].metricas.conversoes      += Number(m.conversions ?? 0);
        campanhasMap[id].metricas.conversoes_value += Number(m.conversions_value ?? 0);
        campanhasMap[id].metricas.impressionShare  = m.search_impression_share
          ? (m.search_impression_share * 100).toFixed(1) + '%' : 'N/A';
      }

      for (const camp of Object.values(campanhasMap)) {
        const m = camp.metricas;
        m.ctr    = m.cliques > 0 && m.impressoes > 0 ? ((m.cliques / m.impressoes) * 100).toFixed(2) + '%' : '0%';
        m.cpcMedio = m.cliques > 0 ? 'R$ ' + (m.custo / m.cliques).toFixed(2) : 'R$ 0,00';
        m.roas   = m.custo > 0 ? (m.conversoes_value / m.custo).toFixed(2) + 'x' : '0x';
        m.custo  = 'R$ ' + m.custo.toFixed(2);
        report.campanhas.push(camp);
        const icon = camp.status === 'ENABLED' ? '✅' : '⏸️ ';
        console.log(`      ${icon} [${camp.status}] ${camp.nome} | ${camp.tipo} | ${m.custo} gasto | ${m.cliques} cliques | ${m.conversoes} conv.`);
      }

      const custoTotal = totalCusto / 1_000_000;
      report.resumo30dias = {
        impressoes: totalImpr,
        cliques: totalCliques,
        custo: 'R$ ' + custoTotal.toFixed(2),
        conversoes: totalConv,
        conversoes_value: 'R$ ' + totalConvValue.toFixed(2),
        ctr: totalImpr > 0 ? ((totalCliques / totalImpr) * 100).toFixed(2) + '%' : '0%',
        cpcMedio: totalCliques > 0 ? 'R$ ' + (custoTotal / totalCliques).toFixed(2) : 'R$ 0,00',
        roas: custoTotal > 0 ? (totalConvValue / custoTotal).toFixed(2) + 'x' : '0x',
        cpa: totalConv > 0 ? 'R$ ' + (custoTotal / totalConv).toFixed(2) : 'N/A',
      };
    }
  } catch (e) {
    console.log(`   ✗ Erro ao buscar campanhas: ${e.message}`);
    report.alertasCriticos.push(`Erro campanhas: ${e.message}`);
  }

  // ── 4. PALAVRAS-CHAVE NEGATIVAS DA CONTA ────────────────────────────────────
  console.log('\n4. Verificando listas de palavras negativas...');
  try {
    const negLists = await customer.query(`
      SELECT shared_set.id, shared_set.name, shared_set.type, shared_set.member_count
      FROM shared_set
      WHERE shared_set.type = NEGATIVE_KEYWORDS
        AND shared_set.status = ENABLED
    `);
    report.listasNegativas = negLists.map(r => ({
      id: r.shared_set.id,
      nome: r.shared_set.name,
      qtd: r.shared_set.member_count,
    }));
    if (negLists.length === 0) {
      console.log('   ⚠️  Nenhuma lista de negativos criada');
      report.alertasCriticos.push('⚠️  Sem listas de palavras negativas — tráfego irrelevante não está sendo bloqueado');
    } else {
      console.log(`   ✓ ${negLists.length} lista(s) de negativos encontrada(s)`);
    }
  } catch (e) {
    console.log(`   ✗ Erro ao buscar negativos: ${e.message}`);
  }

  // ── 5. MERCHANT CENTER (SHOPPING) ───────────────────────────────────────────
  console.log('\n5. Verificando vinculação com Google Merchant Center...');
  try {
    const merchantRows = await customer.query(`
      SELECT merchant_center_link.id, merchant_center_link.merchant_center_id,
             merchant_center_link.status
      FROM merchant_center_link
    `);
    if (merchantRows.length === 0) {
      report.merchantCenter = { vinculado: false };
      report.alertasCriticos.push('🚨 CRÍTICO: Google Merchant Center NÃO vinculado — campanhas Shopping/PMAX impossíveis sem isso');
      console.log('   ✗ Merchant Center NÃO vinculado');
    } else {
      report.merchantCenter = {
        vinculado: true,
        contas: merchantRows.map(r => ({
          id: r.merchant_center_link.merchant_center_id,
          status: r.merchant_center_link.status,
        })),
      };
      console.log(`   ✓ Merchant Center vinculado: ${merchantRows.map(r => r.merchant_center_link.merchant_center_id).join(', ')}`);
    }
  } catch (e) {
    report.merchantCenter = { vinculado: false, erro: e.message };
    console.log(`   ✗ Erro ao verificar Merchant Center: ${e.message}`);
    report.alertasCriticos.push(`Não foi possível verificar Merchant Center: ${e.message}`);
  }

  // ── 6. EXTENSÕES DE ANÚNCIO ─────────────────────────────────────────────────
  console.log('\n6. Verificando extensões de anúncio (Assets)...');
  try {
    const assets = await customer.query(`
      SELECT asset.id, asset.type, asset.name
      FROM asset
      WHERE asset.type IN (SITELINK, CALLOUT, CALL, STRUCTURED_SNIPPET, IMAGE)
      LIMIT 50
    `);
    const tiposPresentes = [...new Set(assets.map(r => r.asset.type))];
    report.extensoes = { total: assets.length, tipos: tiposPresentes };
    if (assets.length === 0) {
      report.alertasCriticos.push('⚠️  Sem extensões de anúncio — sitelinks, callouts e telefone aumentam CTR');
      console.log('   ⚠️  Nenhuma extensão configurada');
    } else {
      console.log(`   ✓ ${assets.length} asset(s) encontrado(s): ${tiposPresentes.join(', ')}`);
    }
  } catch (e) {
    console.log(`   ✗ Erro ao verificar extensões: ${e.message}`);
  }

  // ── 7. SALVAR RELATÓRIO ──────────────────────────────────────────────────────
  const reportsDir = path.resolve(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const filename = path.join(reportsDir, `audit-${DATE_TO}.json`);
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));

  // ── 8. IMPRIMIR RESUMO FINAL ─────────────────────────────────────────────────
  console.log('\n=================================================');
  console.log('  RESUMO EXECUTIVO — ÚLTIMOS 30 DIAS');
  console.log('=================================================');
  if (report.resumo30dias && report.resumo30dias.impressoes !== undefined) {
    const r = report.resumo30dias;
    console.log(`  Impressões:    ${r.impressoes.toLocaleString('pt-BR')}`);
    console.log(`  Cliques:       ${r.cliques.toLocaleString('pt-BR')}`);
    console.log(`  CTR:           ${r.ctr}`);
    console.log(`  CPC Médio:     ${r.cpcMedio}`);
    console.log(`  Custo Total:   ${r.custo}`);
    console.log(`  Conversões:    ${r.conversoes}`);
    console.log(`  Valor Conv.:   ${r.conversoes_value}`);
    console.log(`  ROAS:          ${r.roas}`);
    console.log(`  CPA:           ${r.cpa}`);
  } else {
    console.log('  Sem dados de performance no período.');
  }

  console.log('\n=================================================');
  console.log('  ALERTAS CRÍTICOS');
  console.log('=================================================');
  if (report.alertasCriticos.length === 0) {
    console.log('  ✅ Nenhum alerta crítico identificado');
  } else {
    for (const a of report.alertasCriticos) console.log('  ' + a);
  }

  console.log(`\n📁 Relatório JSON salvo em: ${filename}`);
  return report;
}

audit().catch(err => {
  console.error('\n❌ ERRO NA AUDITORIA:', err.message || err);
  process.exit(1);
});
