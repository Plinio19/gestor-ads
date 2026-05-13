require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, login_customer_id: LOGIN_CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

// IDs confirmados pela auditoria
const PMAX_EXPRESSLAB = { id: '22818696932', nome: 'PMAX EXPRESSLAB',  roasAlvo: 10.0 };
const PMAX_SHOPPING   = { id: '22820186807', nome: 'PMAX-SHOPPING',    roasAlvo: 8.0  };
const LEADS_PESQUISA  = { id: '22899949667', nome: '[Google] Leads Pesquisa' };

// Negativos confirmados pelos dados históricos + BRIEFING
const NEGATIVOS = [
  // Fora do portfólio (termos reais encontrados nos dados históricos)
  'béquer', 'becker', 'vidraria', 'vidrarias', 'erlenmeyer', 'proveta',
  'pipeta', 'tubo de ensaio', 'reagente químico', 'reagentes',
  'produto químico', 'kit educacional', 'material escolar',
  // Intenção errada
  'aluguel', 'locação', 'alugar',
  'manutenção', 'reparo', 'conserto', 'assistência técnica', 'calibração',
  'peça de reposição', 'peças',
  // Produto errado
  'usado', 'seminovo', 'segunda mão',
  'monitor cardíaco', 'desfibrilador', 'cirúrgico', 'hospitalar',
  // Concorrentes (confirmado: "loja netlab" teve 5 cliques nos dados)
  'netlab', 'loja netlab', 'splabor', 'interlab', 'kasvi',
  'qualividros', 'nalgon', 'insumos laboratoriais',
];

async function step(descricao, fn) {
  process.stdout.write(`\n${descricao}... `);
  try {
    const result = await fn();
    console.log('✅');
    return result;
  } catch (e) {
    console.log(`❌\n   Erro: ${e.message ?? JSON.stringify(e)}`);
    return null;
  }
}

async function setupReativacao() {
  console.log('=====================================================');
  console.log('  SETUP REATIVAÇÃO — ExpressLab Equipamentos');
  console.log(`  Conta: ${CUSTOMER_ID} | MCC: ${LOGIN_CUSTOMER_ID}`);
  console.log('=====================================================');

  // ── PASSO 1: Criar lista de negativos compartilhada ────────────────────────
  console.log('\n── PASSO 1: Lista de palavras negativas ──');

  let sharedSetResourceName = null;

  const sharedSetResult = await step(
    `  Criando lista "Expresslab — Negativos Globais" (${NEGATIVOS.length} termos)`,
    async () => {
      const res = await customer.sharedSets.create([{
        name: 'Expresslab — Negativos Globais',
        type: enums.SharedSetType.NEGATIVE_KEYWORDS,
        status: enums.SharedSetStatus.ENABLED,
      }]);
      sharedSetResourceName = res[0].resource_name;
      return res;
    }
  );

  if (sharedSetResourceName) {
    await step(
      `  Adicionando ${NEGATIVOS.length} termos à lista`,
      () => customer.sharedCriteria.create(
        NEGATIVOS.map(kw => ({
          shared_set: sharedSetResourceName,
          negative: true,
          keyword: {
            text: kw,
            match_type: enums.KeywordMatchType.BROAD,
          },
        }))
      )
    );
  }

  // ── PASSO 2: Vincular lista às campanhas PMAX ──────────────────────────────
  console.log('\n── PASSO 2: Vincular negativos às campanhas ──');

  for (const camp of [PMAX_EXPRESSLAB, PMAX_SHOPPING]) {
    if (!sharedSetResourceName) {
      // Fallback: adicionar negativos direto na campanha (campaign-level)
      await step(
        `  Negativos diretos na campanha "${camp.nome}" (fallback)`,
        () => customer.campaignCriteria.create(
          NEGATIVOS.map(kw => ({
            campaign: `customers/${CUSTOMER_ID}/campaigns/${camp.id}`,
            negative: true,
            keyword: {
              text: kw,
              match_type: enums.KeywordMatchType.PHRASE,
            },
          }))
        )
      );
    } else {
      await step(
        `  Vinculando lista à campanha "${camp.nome}"`,
        () => customer.campaignSharedSets.create([{
          campaign: `customers/${CUSTOMER_ID}/campaigns/${camp.id}`,
          shared_set: sharedSetResourceName,
        }])
      );
    }
  }

  // ── PASSO 3: Definir ROAS alvo nas PMAX ────────────────────────────────────
  console.log('\n── PASSO 3: Configurar ROAS alvo ──');

  // PMAX EXPRESSLAB → já usa maximize_conversion_value → só adiciona target_roas
  await step(
    `  PMAX EXPRESSLAB → ROAS alvo ${PMAX_EXPRESSLAB.roasAlvo}x`,
    () => customer.campaigns.update([{
      resource_name: `customers/${CUSTOMER_ID}/campaigns/${PMAX_EXPRESSLAB.id}`,
      maximize_conversion_value: {
        target_roas: PMAX_EXPRESSLAB.roasAlvo,
      },
    }])
  );

  // PMAX-SHOPPING → estava em maximize_conversions → migrar para maximize_conversion_value com ROAS alvo
  await step(
    `  PMAX-SHOPPING → migrar para maximize_conversion_value + ROAS alvo ${PMAX_SHOPPING.roasAlvo}x`,
    () => customer.campaigns.update([{
      resource_name: `customers/${CUSTOMER_ID}/campaigns/${PMAX_SHOPPING.id}`,
      maximize_conversion_value: {
        target_roas: PMAX_SHOPPING.roasAlvo,
      },
    }])
  );

  // ── PASSO 4: Confirmar campanha Leads Pesquisa PAUSADA ─────────────────────
  console.log('\n── PASSO 4: Garantir Leads Pesquisa pausada ──');

  await step(
    `  Pausando "[Google] Leads Pesquisa" (objetivo errado para e-commerce)`,
    () => customer.campaigns.update([{
      resource_name: `customers/${CUSTOMER_ID}/campaigns/${LEADS_PESQUISA.id}`,
      status: enums.CampaignStatus.PAUSED,
    }])
  );

  // ── PASSO 5: Verificar estado final das campanhas ──────────────────────────
  console.log('\n── PASSO 5: Verificação final ──\n');

  const campanhas = await customer.query(`
    SELECT
      campaign.id, campaign.name, campaign.status,
      campaign.bidding_strategy_type,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.name ASC
  `);

  const STATUS = { 2: '✅ ATIVA', 3: '⏸️  PAUSADA', 4: '🗑️  REMOVIDA' };
  const BIDS   = { 10: 'Maximizar Conversões', 11: 'Maximizar Valor de Conversão', 9: 'ROAS alvo' };

  console.log('  Campanha                          | Status       | Estratégia                   | Orçamento/dia');
  console.log('  ----------------------------------|--------------|------------------------------|---------------');
  for (const row of campanhas) {
    const c   = row.campaign;
    const bud = row.campaign_budget?.amount_micros
      ? 'R$ ' + (row.campaign_budget.amount_micros / 1e6).toFixed(2)
      : '—';
    const st  = STATUS[c.status]  ?? c.status;
    const bid = BIDS[c.bidding_strategy_type] ?? c.bidding_strategy_type;
    console.log(`  ${c.name.padEnd(33)} | ${st.padEnd(12)} | ${bid.padEnd(28)} | ${bud}`);
  }

  console.log('\n=====================================================');
  console.log('  REATIVAÇÃO CONCLUÍDA');
  console.log('  Próximos eventos esperados:');
  console.log('  • 0-24h   → Primeiras impressões voltando');
  console.log('  • 1-3 dias → Primeiros cliques e custos');
  console.log('  • 5-7 dias → ROAS estabilizando (alvo 8x-10x)');
  console.log('  • 14 dias  → Algoritmo re-calibrado — avaliar escala');
  console.log('=====================================================\n');
}

setupReativacao().catch(err => {
  console.error('\n❌ ERRO FATAL:', err.message ?? JSON.stringify(err, null, 2));
  process.exit(1);
});
