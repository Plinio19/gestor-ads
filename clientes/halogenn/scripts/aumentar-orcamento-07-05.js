/**
 * Aumento de orçamento — 07/05/2026
 * IS perdido por orçamento: 32%. CPL real ~R$82. +R$600/mês distribuídos proporcionalmente.
 * Prioritários: R$43 → R$57/dia (+R$420/mês)
 * Secundários:  R$17 → R$23/dia (+R$180/mês)
 * Total: +R$20/dia = +R$600/mês
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const NOVOS_ORCAMENTOS = {
  '[Busca] - Produtos Prioritários': 57,
  '[Busca] - Produtos Secundários':  23,
};

async function main() {
  console.log('=== AUMENTO DE ORÇAMENTO — 07/05/2026 ===\n');

  const rows = await customer.query(`
    SELECT campaign.name, campaign.status, campaign_budget.id, campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `);

  const campanhas = {};
  for (const r of rows) {
    campanhas[r.campaign.name] = {
      budgetRN: `customers/${CUSTOMER_ID}/campaignBudgets/${r.campaign_budget?.id}`,
      atual: (r.campaign_budget?.amount_micros ?? 0) / 1_000_000,
    };
  }

  for (const [nome, novo] of Object.entries(NOVOS_ORCAMENTOS)) {
    const c = campanhas[nome];
    if (!c) { console.log(`  ⚠️  Não encontrada: ${nome}`); continue; }

    await customer.campaignBudgets.update([{
      resource_name: c.budgetRN,
      amount_micros: novo * 1_000_000,
    }]);

    const diff = novo - c.atual;
    console.log(`✅ ${nome}`);
    console.log(`   R$${c.atual.toFixed(0)}/dia → R$${novo}/dia  (+R$${diff.toFixed(0)}/dia | +R$${(diff * 30).toFixed(0)}/mês)\n`);
  }

  // Confirmação final
  const final = await customer.query(`
    SELECT campaign.name, campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status = 'ENABLED'
    ORDER BY campaign_budget.amount_micros DESC
  `);

  let totalMes = 0;
  console.log('── Estado final (campanhas ativas) ──────────────────');
  for (const r of final) {
    const diario = (r.campaign_budget?.amount_micros ?? 0) / 1_000_000;
    totalMes += diario * 30;
    console.log(`  ${r.campaign.name.padEnd(38)} R$${diario.toFixed(0)}/dia  (R$${(diario * 30).toFixed(0)}/mês)`);
  }
  console.log(`\n  Total comprometido/mês: R$${totalMes.toFixed(0)}`);
  console.log('=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
