/**
 * ADICIONAR keywords — análise todo o período 28/04/2026
 * Separado por ad group para isolar erros
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const CID = CUSTOMER_ID;
const PHRASE = enums.KeywordMatchType.PHRASE;
const ENABLED = enums.AdGroupCriterionStatus.ENABLED;

function kw(agRN, text) {
  return { ad_group: agRN, status: ENABLED, keyword: { text, match_type: PHRASE } };
}

async function addGroup(label, agRN, termos) {
  if (!agRN) { console.warn(`  ⚠️  Ad group "${label}" não encontrado — pulando\n`); return; }
  const batch = termos.map(t => kw(agRN, t));
  console.log(`\n[${label}] Adicionando ${batch.length} keywords...`);
  try {
    const r = await customer.adGroupCriteria.create(batch);
    console.log(`  ✅ ${r.results.length} adicionadas`);
  } catch (e) {
    console.error(`  ❌ Erro: ${e.message}`);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }
}

async function main() {
  console.log('=== ADICIONAR KEYWORDS — TODO O PERÍODO (28/04/2026) ===\n');

  const agRows = await customer.query(`
    SELECT ad_group.id, ad_group.name
    FROM ad_group
    WHERE campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
      AND ad_group.status = 'ENABLED'
  `);

  const AG = {};
  for (const r of agRows) AG[r.ad_group.name] = `customers/${CID}/adGroups/${r.ad_group.id}`;

  // ─── Álcool Etílico PA-ACS ───────────────────────────────────────────────
  await addGroup('Álcool Etílico PA-ACS', AG['Álcool Etílico PA-ACS'], [
    // intenção de compra
    'álcool absoluto 99 onde comprar',
    'álcool absoluto comprar',
    'álcool absoluto onde comprar',
    'onde comprar álcool absoluto',
    'onde comprar alcool anidro',
    'preço alcool absoluto',
    // absoluto + PA
    'álcool absoluto pa',
    'alcool absoluto pa',
    // absoluto + concentração
    'álcool absoluto 99',
    'álcool absoluto 99 3',
    'álcool absoluto 99 5',
    'álcool absoluto 99 8',
    'alcool absoluto 99',
    'alcool absoluto 99 3',
    // álcool PA direto
    'alcool pa',
    'alcool p a',
    // etílico + concentração
    'álcool etílico 99',
    'álcool etílico 99 5',
    'álcool etílico 99 9',
    'álcool etílico absoluto 99 5',
    'álcool etílico p a',
    'alcool etílico 99',
    'alcool etílico absoluto',
    'alcool etílico pa',
    'alcool etilico 99',
    'alcool etilico 99 3',
    'alcool etilico 99 5',
    'alcool etilico p a',
    // etanol
    'etanol 99',
    'etanol 99 5',
    'etanol 99.9',
    'etanol absoluto',
    'etanol p a',
    'etanol pa preço',
    // álcool 99 genérico com intenção ou concentração
    'álcool 99 5',
    'álcool 99 9',
    'álcool 99 onde comprar',
    // resgatados pelo gestor
    'alcool 99 gl',
    'alcool absoluto 92',
    'alcool absoluto 96',
    'álcool 100 por cento',
  ]);

  // ─── Formaldeído PA ──────────────────────────────────────────────────────
  await addGroup('Formaldeído PA', AG['Formaldeído PA'], [
    'formol 1 litro',
    'formol 37 1 litro',
    'formol 37 5 litros',
    'formalina tamponada',
  ]);

  // ─── Xileno e Xilol PA ───────────────────────────────────────────────────
  await addGroup('Xileno e Xilol PA', AG['Xileno e Xilol PA'], [
    'xilol puro',
    'solvente xilol',
    'xilol 1 litro',
    'xileno solvente',
    'xileno preço',
  ]);

  // ─── Ácido Sulfúrico PA-ACS ──────────────────────────────────────────────
  await addGroup('Ácido Sulfúrico PA-ACS', AG['Ácido Sulfúrico PA-ACS'], [
    'ácido sulfúrico 98',
    'ácido sulfúrico pa',
    'ácido sulfurico pa',
    'acido sulfurico p a',
    'ácido sulfurico pa preço',
    'ácido sulfúrico 98 preço',
    'ácido sulfúrico pa preço',
  ]);

  // ─── Ácido Clorídrico PA-ACS ─────────────────────────────────────────────
  await addGroup('Ácido Clorídrico PA-ACS', AG['Ácido Clorídrico PA-ACS'], [
    'ácido clorídrico p a',
    'acido cloridrico 37',
    'ácido cloridrico pa',
    'hcl p a',
    'ácido clorídrico pa preço',
    'ácido clorídrico 37 preço',
    'ácido clorídrico fumegante',
    'acido cloridrico fumegante',
    'hci 37',
  ]);

  // ─── Álcool Metílico PA-ACS ──────────────────────────────────────────────
  await addGroup('Álcool Metílico PA-ACS', AG['Álcool Metílico PA-ACS'], [
    'metanol p a',
    'álcool metílico pa',
    'methanol p a',
  ]);

  // ─── Parafina Histológica ─────────────────────────────────────────────────
  await addGroup('Parafina Histológica', AG['Parafina Histológica'], [
    'parafina histologia',
    'parafina histologica',
  ]);

  console.log('\n' + '='.repeat(60));
  console.log('=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
