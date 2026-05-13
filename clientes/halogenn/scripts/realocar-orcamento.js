require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const CAMPANHAS_PAUSAR = [
  '[Busca] - Nichos Específicos',
  '[Busca] - Marca Halogenn',
];

const NOVOS_ORCAMENTOS = {
  '[Busca] - Produtos Prioritários': 43,  // R$/dia
  '[Busca] - Produtos Secundários': 17,   // R$/dia
};

async function executar() {
  console.log('\n=== REALOCAÇÃO DE ORÇAMENTO — Halogenn ===\n');
  console.log(`Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

  // Buscar todas as campanhas ativas com seus budget IDs
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.id,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `);

  const campanhas = {};
  for (const r of rows) {
    campanhas[r.campaign.name] = {
      campaignId: r.campaign.id,
      campaignRN: `customers/${CUSTOMER_ID}/campaigns/${r.campaign.id}`,
      budgetId: r.campaign_budget?.id,
      budgetRN: `customers/${CUSTOMER_ID}/campaignBudgets/${r.campaign_budget?.id}`,
      budgetAtual: (r.campaign_budget?.amount_micros ?? 0) / 1_000_000,
      status: r.campaign.status,
    };
  }

  // 1. PAUSAR campanhas
  console.log('--- 1. Pausando campanhas sem resultado ---\n');
  for (const nome of CAMPANHAS_PAUSAR) {
    const c = campanhas[nome];
    if (!c) { console.log(`  ⚠️  Campanha não encontrada: ${nome}`); continue; }
    if (c.status === 3) { console.log(`  ℹ️  ${nome} — já estava pausada`); continue; }

    await customer.campaigns.update([{
      resource_name: c.campaignRN,
      status: 3, // PAUSED
    }]);
    console.log(`  ✅ Pausada: ${nome}`);
  }

  // 2. ATUALIZAR orçamentos
  console.log('\n--- 2. Atualizando orçamentos ---\n');
  for (const [nome, novoDiario] of Object.entries(NOVOS_ORCAMENTOS)) {
    const c = campanhas[nome];
    if (!c) { console.log(`  ⚠️  Campanha não encontrada: ${nome}`); continue; }

    const novoMicros = novoDiario * 1_000_000;
    await customer.campaignBudgets.update([{
      resource_name: c.budgetRN,
      amount_micros: novoMicros,
    }]);

    const diferenca = novoDiario - c.budgetAtual;
    const sinal = diferenca > 0 ? '+' : '';
    console.log(`  ✅ ${nome}`);
    console.log(`     R$${c.budgetAtual.toFixed(0)}/dia → R$${novoDiario}/dia (${sinal}R$${diferenca.toFixed(0)}/dia | ${sinal}R$${(diferenca * 30).toFixed(0)}/mês)`);
  }

  // 3. Verificação final
  console.log('\n--- 3. Estado final das campanhas ativas ---\n');
  const rowsFinal = await customer.query(`
    SELECT campaign.name, campaign.status, campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign_budget.amount_micros DESC
  `);

  let totalMes = 0;
  for (const r of rowsFinal) {
    if (r.campaign.status !== 2) continue; // só ativas
    const diario = (r.campaign_budget?.amount_micros ?? 0) / 1_000_000;
    totalMes += diario * 30;
    console.log(`  ✅ ${r.campaign.name} — R$${diario.toFixed(0)}/dia (R$${(diario * 30).toFixed(0)}/mês)`);
  }

  console.log(`\n  Total comprometido/mês: R$${totalMes.toFixed(0)} de R$2.000 limite`);
  console.log(`  Buffer disponível: R$${(2000 - totalMes).toFixed(0)}/mês\n`);
  console.log('=== CONCLUÍDO ===\n');
}

executar().catch(e => {
  console.error('Erro:', e.message || e);
  process.exit(1);
});
