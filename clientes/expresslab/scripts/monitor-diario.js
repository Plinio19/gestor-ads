require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
const path = require('path');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const METAS = {
  roas_minimo:     8.0,   // abaixo disso → alerta vermelho
  roas_alvo:      10.0,   // acima disso → sinal verde
  roas_escala:    20.0,   // acima disso → propor escala
  cpa_maximo:    150.0,   // acima disso → alerta vermelho
  cpa_bom:        80.0,   // abaixo disso → sinal verde
};

const STATUS = { 2: 'ATIVA', 3: 'PAUSADA', 4: 'REMOVIDA' };

const TODAY = new Date().toISOString().slice(0,10);
const d7 = new Date(); d7.setDate(d7.getDate()-7);
const FROM_7D = d7.toISOString().slice(0,10);
const d1 = new Date(); d1.setDate(d1.getDate()-1);
const FROM_1D = d1.toISOString().slice(0,10);

function fmt(valor) { return valor > 0 ? `R$ ${valor.toFixed(2)}` : 'R$ 0,00'; }
function roas(value, cost) { return cost > 0 ? (value / cost).toFixed(2) + 'x' : '0x'; }
function cpa(cost, conv) { return conv > 0 ? fmt(cost / conv) : 'N/A'; }

async function monitorDiario() {
  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   MONITOR DIÁRIO — ExpressLab Equipamentos        ║');
  console.log(`║   ${agora.padEnd(48)}║`);
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const alertas = [];
  const sinaisVerdes = [];
  const relatorio = { data: TODAY, campanhas: {}, resumo_hoje: {}, resumo_7dias: {}, alertas: [], sinaisVerdes: [] };

  // ── HOJE ────────────────────────────────────────────────────────────────────
  console.log('📅 HOJE:');
  try {
    const rows = await customer.query(`
      SELECT
        campaign.id, campaign.name, campaign.status,
        campaign_budget.amount_micros,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.conversions, metrics.conversions_value, metrics.ctr
      FROM campaign
      WHERE segments.date BETWEEN '${FROM_1D}' AND '${TODAY}'
        AND campaign.status != 'REMOVED'
      ORDER BY campaign.name ASC
    `);

    let tImpr=0, tCliques=0, tCusto=0, tConv=0, tValue=0;
    const porCampanha = {};

    for (const r of rows) {
      const id = r.campaign.id;
      if (!porCampanha[id]) porCampanha[id] = { nome: r.campaign.name, status: r.campaign.status, orcamento: r.campaign_budget?.amount_micros/1e6||0, impr:0, cliques:0, custo:0, conv:0, value:0 };
      porCampanha[id].impr   += Number(r.metrics.impressions||0);
      porCampanha[id].cliques += Number(r.metrics.clicks||0);
      porCampanha[id].custo  += Number(r.metrics.cost_micros||0)/1e6;
      porCampanha[id].conv   += Number(r.metrics.conversions||0);
      porCampanha[id].value  += Number(r.metrics.conversions_value||0);
    }

    for (const [id, c] of Object.entries(porCampanha)) {
      tImpr+=c.impr; tCliques+=c.cliques; tCusto+=c.custo; tConv+=c.conv; tValue+=c.value;
      const roasC = c.custo > 0 ? c.value/c.custo : 0;
      const icon = c.impr > 0 ? '🟢' : (STATUS[c.status]==='ATIVA' ? '🟡' : '⏸️ ');
      console.log(`   ${icon} ${c.nome}`);
      console.log(`      Impressões: ${c.impr.toLocaleString('pt-BR')} | Cliques: ${c.cliques} | Gasto: ${fmt(c.custo)} | Conv: ${c.conv.toFixed(0)} | ROAS: ${roas(c.value,c.custo)}`);

      relatorio.campanhas[id] = { ...c, roas: roas(c.value,c.custo), cpa: cpa(c.custo,c.conv) };

      // Alertas por campanha
      if (STATUS[c.status]==='ATIVA' && c.impr === 0) {
        alertas.push(`🔴 "${c.nome}" ATIVA mas com 0 impressões hoje — Merchant Center com problema ou período de aprendizado`);
      }
      if (c.custo > (c.orcamento || 999) * 1.5) {
        alertas.push(`🔴 "${c.nome}" gastou ${fmt(c.custo)} — acima de 150% do orçamento diário (${fmt(c.orcamento)})`);
      }
      if (c.custo > 0 && roasC < METAS.roas_minimo && c.conv > 0) {
        alertas.push(`🟡 "${c.nome}" com ROAS ${roasC.toFixed(1)}x — abaixo do mínimo de ${METAS.roas_minimo}x`);
      }
      if (roasC >= METAS.roas_escala) {
        sinaisVerdes.push(`🚀 "${c.nome}" com ROAS ${roasC.toFixed(1)}x — ACIMA DE ${METAS.roas_escala}x — AVALIAR ESCALA DE ORÇAMENTO`);
      } else if (roasC >= METAS.roas_alvo && c.conv > 0) {
        sinaisVerdes.push(`✅ "${c.nome}" com ROAS ${roasC.toFixed(1)}x — acima da meta de ${METAS.roas_alvo}x`);
      }
    }

    const roasTotal = tCusto > 0 ? tValue/tCusto : 0;
    console.log(`\n   TOTAL HOJE → Impressões: ${tImpr.toLocaleString('pt-BR')} | Cliques: ${tCliques} | Gasto: ${fmt(tCusto)} | Conv: ${tConv.toFixed(0)} | ROAS: ${roas(tValue,tCusto)} | CPA: ${cpa(tCusto,tConv)}`);
    relatorio.resumo_hoje = { impressoes: tImpr, cliques: tCliques, custo: fmt(tCusto), conversoes: tConv.toFixed(0), roas: roas(tValue,tCusto), cpa: cpa(tCusto,tConv) };

    // Alerta orçamento esgotando cedo
    const hora = new Date().getHours();
    if (hora < 14 && tCusto > 0) {
      const orcamentoTotal = Object.values(porCampanha).reduce((s,c) => s+c.orcamento,0);
      if (tCusto >= orcamentoTotal * 0.8) {
        alertas.push(`🔴 ${hora}h e já ${fmt(tCusto)} gastos de ${fmt(orcamentoTotal)} — orçamento pode esgotar antes das 18h`);
      }
    }

  } catch(e) { console.log('   Erro ao buscar dados de hoje:', e.message); }

  // ── ÚLTIMOS 7 DIAS ──────────────────────────────────────────────────────────
  console.log('\n📊 ÚLTIMOS 7 DIAS:');
  try {
    const rows = await customer.query(`
      SELECT
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.conversions, metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${FROM_7D}' AND '${TODAY}'
        AND campaign.status != 'REMOVED'
    `);

    let impr=0, cliques=0, custo=0, conv=0, value=0;
    for (const r of rows) {
      impr   += Number(r.metrics.impressions||0);
      cliques += Number(r.metrics.clicks||0);
      custo  += Number(r.metrics.cost_micros||0)/1e6;
      conv   += Number(r.metrics.conversions||0);
      value  += Number(r.metrics.conversions_value||0);
    }

    const roasS = custo > 0 ? value/custo : 0;
    const cpaS  = conv > 0 ? custo/conv : 0;
    console.log(`   Impressões: ${impr.toLocaleString('pt-BR')} | Cliques: ${cliques} | Gasto: ${fmt(custo)}`);
    console.log(`   Conversões: ${conv.toFixed(0)} | Receita: ${fmt(value)} | ROAS: ${roas(value,custo)} | CPA: ${cpa(custo,conv)}`);

    relatorio.resumo_7dias = { impressoes: impr, cliques, custo: fmt(custo), conversoes: conv.toFixed(0), receita: fmt(value), roas: roas(value,custo), cpa: cpa(custo,conv) };

    // Alertas baseados em 7 dias
    if (roasS > 0 && roasS < METAS.roas_minimo) {
      alertas.push(`🔴 ROAS 7 dias: ${roasS.toFixed(1)}x — abaixo do mínimo de ${METAS.roas_minimo}x por mais de 3 dias → revisar estratégia`);
    }
    if (cpaS > METAS.cpa_maximo && conv > 0) {
      alertas.push(`🔴 CPA 7 dias: ${fmt(cpaS)} — acima do máximo de ${fmt(METAS.cpa_maximo)}`);
    }
    if (roasS >= METAS.roas_escala) {
      sinaisVerdes.push(`🚀 ROAS 7 dias: ${roasS.toFixed(1)}x — CONDIÇÃO DE ESCALA ATINGIDA`);
    }

  } catch(e) { console.log('   Erro ao buscar 7 dias:', e.message); }

  // ── TERMOS DE BUSCA SUSPEITOS HOJE ──────────────────────────────────────────
  console.log('\n🔍 TERMOS DE BUSCA (hoje, top suspeitos):');
  try {
    const rows = await customer.query(`
      SELECT
        search_term_view.search_term,
        metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
      FROM search_term_view
      WHERE segments.date BETWEEN '${FROM_1D}' AND '${TODAY}'
        AND metrics.clicks > 0
      ORDER BY metrics.cost_micros DESC
      LIMIT 20
    `);

    const suspeitos = ['vidraria', 'vidrarias', 'béquer', 'becker', 'reagente', 'aluguel', 'locação',
      'manutenção', 'conserto', 'usado', 'seminovo', 'netlab', 'splabor', 'interlab'];

    let encontrouSuspeito = false;
    for (const r of rows) {
      const termo = r.search_term_view?.search_term ?? '';
      const custo = Number(r.metrics.cost_micros||0)/1e6;
      const isSusp = suspeitos.some(s => termo.toLowerCase().includes(s));
      if (isSusp) {
        alertas.push(`⚠️  Termo suspeito escapou dos negativos: "${termo}" — ${r.metrics.clicks} cliques, ${fmt(custo)}`);
        console.log(`   ⚠️  SUSPEITO: "${termo}" — ${r.metrics.clicks} cliques | ${fmt(custo)}`);
        encontrouSuspeito = true;
      }
    }
    if (!encontrouSuspeito && rows.length > 0) {
      console.log('   ✅ Nenhum termo suspeito nos top termos de hoje');
    } else if (rows.length === 0) {
      console.log('   ℹ️  Sem dados de termos ainda');
    }
  } catch(e) { console.log('   ℹ️  Sem dados de termos ainda (normal no início)'); }

  // ── ALERTAS E SINAIS VERDES ─────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(52));

  if (sinaisVerdes.length > 0) {
    console.log('\n🚀 SINAIS VERDES:');
    sinaisVerdes.forEach(s => console.log('   ' + s));
  }

  if (alertas.length > 0) {
    console.log('\n🚨 ALERTAS:');
    alertas.forEach(a => console.log('   ' + a));
  } else {
    console.log('\n✅ Sem alertas críticos — tudo dentro do esperado');
  }

  // ── SALVAR LOG ──────────────────────────────────────────────────────────────
  relatorio.alertas = alertas;
  relatorio.sinaisVerdes = sinaisVerdes;

  const logsDir = path.resolve(__dirname, '../logs');
  const logFile = path.join(logsDir, 'daily-monitor.log');
  const entry = `\n[${TODAY}] ROAS-hoje=${relatorio.resumo_hoje.roas} | ROAS-7d=${relatorio.resumo_7dias.roas} | Cliques=${relatorio.resumo_hoje.cliques} | Alertas=${alertas.length} | Sinais=${sinaisVerdes.length}`;
  fs.appendFileSync(logFile, entry);

  const jsonDir = path.resolve(__dirname, '../reports');
  fs.writeFileSync(path.join(jsonDir, `monitor-${TODAY}.json`), JSON.stringify(relatorio, null, 2));

  console.log(`\n📁 Log salvo | Próxima verificação: amanhã (ou rode a qualquer hora)`);
  console.log('═'.repeat(52) + '\n');
}

monitorDiario().catch(err => {
  console.error('❌ ERRO:', err.message ?? err);
  process.exit(1);
});
