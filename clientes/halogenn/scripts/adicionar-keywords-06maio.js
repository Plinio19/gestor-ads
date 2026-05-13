/**
 * ADICIONAR keywords — análise NONE 06/05/2026 (20 termos em 3 ad groups)
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
  console.log('=== ADICIONAR KEYWORDS — 06/05/2026 ===\n');

  const agRows = await customer.query(`
    SELECT ad_group.id, ad_group.name
    FROM ad_group
    WHERE campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
      AND ad_group.status = 'ENABLED'
  `);

  const AG = {};
  for (const r of agRows) AG[r.ad_group.name] = `customers/${CID}/adGroups/${r.ad_group.id}`;

  // ─── Ácido Sulfúrico PA-ACS (4 termos) ──────────────────────────────────
  await addGroup('Ácido Sulfúrico PA-ACS', AG['Ácido Sulfúrico PA-ACS'], [
    'h2so4',           // fórmula química = comprador técnico qualificado, CTR 4%
    'ácido sulfúrico',  // nome do produto, B2B-only, CTR 3,5%, 115 impr
    'acido sulfúrico',  // variante sem acento no á
    'acido sulfurico',  // sem acentos — cobre digitação comum
  ]);

  // ─── Ácido Clorídrico PA-ACS (5 termos) ─────────────────────────────────
  await addGroup('Ácido Clorídrico PA-ACS', AG['Ácido Clorídrico PA-ACS'], [
    'ácido clorídrico pa',    // PA explícito = qualificado, CTR 3,8%
    'ácido clorídrico',        // nome do produto, 288 impr, CTR 1,4%
    'acido clorídrico',        // variante com ó mas sem á
    'acido cloridrico',        // sem acentos
    'ácido hidroclorídrico',   // nome IUPAC alternativo para HCl
  ]);

  // ─── Álcool Etílico PA-ACS (11 termos) ──────────────────────────────────
  await addGroup('Álcool Etílico PA-ACS', AG['Álcool Etílico PA-ACS'], [
    'álcool etílico',   // nome do produto, 350 impr, R$16,32 gasto — maior volume
    'álcool etilico',   // variante sem í, CTR 5,3%
    'alcool etilico',   // sem acentos, 60 impr
    'alcool etílico',   // sem á mas com í, 34 impr
    'álcool 99',        // concentração = qualificado, 62 impr, CTR 1,6%
    'álcool 100',       // absoluto implícito, CTR 5,9%
    'alcool 100',       // variante sem acento
    'álcool anidro',    // anidro = sinônimo técnico de absoluto, muito qualificado
    'álcool 100 puro',  // qualificado por "puro"
    'alcohol absoluto', // escrita espanhol/BR informal, CTR 5,6%
    'alcool 99 9',      // 99,9% = pureza extrema, super qualificado
  ]);

  console.log('\n' + '='.repeat(60));
  console.log('=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
