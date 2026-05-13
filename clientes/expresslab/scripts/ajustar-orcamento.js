require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

// R$ 1.500/mês ÷ 30,4 dias = R$ 49/dia
// PMAX-SHOPPING  (estrela — gerou R$207k, ROAS 44x): R$ 30/dia → R$ 912/mês  (61%)
// PMAX EXPRESSLAB (ROAS 55x histórico):              R$ 19/dia → R$ 578/mês  (39%)
// TOTAL:                                             R$ 49/dia → R$ 1.490/mês ≈ R$ 1.500

const AJUSTES = [
  { budgetId: '14779454856', nome: 'PMAX-SHOPPING',    novoValor: 30, antigo: 72 },
  { budgetId: '14770725791', nome: 'PMAX EXPRESSLAB',  novoValor: 19, antigo: 50 },
];

async function ajustarOrcamento() {
  console.log('=================================================');
  console.log('  AJUSTE DE ORÇAMENTO — ExpressLab');
  console.log(`  Meta: R$ 1.500/mês (R$ 49/dia)`);
  console.log('=================================================\n');

  for (const a of AJUSTES) {
    const resourceName = `customers/${CUSTOMER_ID}/campaignBudgets/${a.budgetId}`;
    try {
      await customer.campaignBudgets.update([{
        resource_name: resourceName,
        amount_micros: a.novoValor * 1_000_000,
      }]);
      console.log(`✅ ${a.nome}: R$ ${a.antigo}/dia → R$ ${a.novoValor}/dia`);
    } catch (e) {
      console.log(`❌ ${a.nome}: ${e.message ?? JSON.stringify(e)}`);
    }
  }

  // Verificação final
  console.log('\n─── Verificação pós-ajuste ───\n');
  const rows = await customer.query(`
    SELECT campaign.name, campaign.status, campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.name ASC
  `);

  let totalAtivo = 0;
  for (const r of rows) {
    const diario  = r.campaign_budget.amount_micros / 1_000_000;
    const mensal  = (diario * 30.4).toFixed(0);
    const ativo   = r.campaign.status === 2;
    const icon    = ativo ? '✅' : '⏸️ ';
    if (ativo) totalAtivo += diario;
    console.log(`${icon} ${r.campaign.name}`);
    console.log(`   R$ ${diario.toFixed(2)}/dia  →  R$ ${mensal}/mês`);
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`  TOTAL ATIVO:  R$ ${totalAtivo.toFixed(2)}/dia`);
  console.log(`  TOTAL MENSAL: R$ ${(totalAtivo * 30.4).toFixed(0)}/mês`);
  console.log(`─────────────────────────────────────────\n`);
}

ajustarOrcamento().catch(err => {
  console.error('\n❌ ERRO:', err.message ?? JSON.stringify(err, null, 2));
  process.exit(1);
});
