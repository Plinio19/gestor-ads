/**
 * Keywords — Grupos 2–6: Xileno, Formaldeído, H2SO4, HCl, Acetona, Parafina, Metanol
 * Garimpo 06/05/2026 — apenas termos NOVOS (não duplicar o que já foi adicionado)
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

async function getAgRN(campName, agName) {
  const rows = await customer.query(`
    SELECT ad_group.id, ad_group.name
    FROM ad_group
    WHERE campaign.name = '${campName}'
      AND ad_group.name = '${agName}'
      AND ad_group.status = 'ENABLED'
  `);
  if (!rows.length) throw new Error(`AG não encontrado: ${agName}`);
  return `customers/${CID}/adGroups/${rows[0].ad_group.id}`;
}

async function addKws(label, agRN, termos) {
  console.log(`\n[${label}] ${termos.length} keywords...`);
  try {
    const r = await customer.adGroupCriteria.create(termos.map(t => kw(agRN, t)));
    console.log(`  ✅ ${r.results.length} adicionadas`);
  } catch (e) {
    console.error(`  ❌ Erro: ${e.message}`);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }
  termos.forEach(t => console.log(`    ✓ "${t}" [PHRASE]`));
}

async function main() {
  console.log('=== ADICIONAR KEYWORDS GRUPOS 2–6 (garimpo 06/05/2026) ===\n');

  // ── Grupo 2: Xileno e Xilol PA ───────────────────────────────────────────
  const agXileno = await getAgRN('[Busca] - Produtos Prioritários', 'Xileno e Xilol PA');

  await addKws('2 — Xileno e Xilol PA', agXileno, [
    'xilol pa',
    'xilol pa-acs',
    'xileno pa',
    'xileno pa-acs',
    'xilol grau analítico',
    'xileno grau analítico',
    'xilol p a',
    'xileno p a',
    'xileno 1 litro',
    'xilol 5 litros',
    'xileno para laboratorio',
    'xilol para laboratorio',
    'xileno diluente',             // uso como diluente em lab histológico
  ]);

  // ── Grupo 3: Formaldeído PA ───────────────────────────────────────────────
  const agFormol = await getAgRN('[Busca] - Produtos Prioritários', 'Formaldeído PA');

  await addKws('3 — Formaldeído PA', agFormol, [
    'formol para histologia',      // histologia = lab qualificado
    'formol para patologia',       // patologia = lab qualificado
    'formol para anatomia',        // anatomia = lab qualificado
    'formol 37 granel',            // granel = volume B2B
    'formaldeído puro',            // pureza = qualificado
    'formol inibido preço',        // intenção de compra
    'formol 37 preço',             // intenção de compra
    'formol 20 litros',            // volume B2B
    'formol 200 litros',           // volume grande B2B
    'formaldeído 37',              // produto específico
    'formaldeído 37 comprar',      // intenção compra
  ]);

  // ── Grupo 4: Ácido Sulfúrico PA-ACS ──────────────────────────────────────
  const agH2SO4 = await getAgRN('[Busca] - Produtos Secundários', 'Ácido Sulfúrico PA-ACS');

  await addKws('4 — Ácido Sulfúrico PA-ACS', agH2SO4, [
    'ácido sulfúrico concentrado', // concentrado = 98%, qualificado
    'h2so4 concentrado',           // qualificado
    'h2so4 grau analítico',        // qualificado
    'ácido sulfúrico 98 onde comprar', // intenção compra
    'comprar ácido sulfúrico',     // intenção compra
    'onde comprar ácido sulfúrico', // intenção compra
    'h2so4 98',                    // concentração específica
    'ácido sulfúrico para laboratório', // qualificado
    'ácido sulfúrico p a',         // grafia alternativa
    'h2so4 acs',                   // grau ACS
    'acido sulfurico 98',          // grafia sem acento
  ]);

  // ── Grupo 5: Ácido Clorídrico PA-ACS ─────────────────────────────────────
  const agHCl = await getAgRN('[Busca] - Produtos Secundários', 'Ácido Clorídrico PA-ACS');

  await addKws('5 — Ácido Clorídrico PA-ACS', agHCl, [
    'ácido clorídrico concentrado', // qualificado
    'hcl concentrado',             // qualificado
    'hcl 37 pa',                   // concentração + grau
    'hcl grau analítico',          // qualificado
    'ácido clorídrico grau analítico', // qualificado
    'comprar ácido clorídrico',    // intenção compra
    'onde comprar ácido clorídrico', // intenção compra
    'ácido clorídrico para laboratório', // qualificado
    'hcl para laboratório',        // qualificado
    'acido cloridrico pa preço',   // intenção compra
  ]);

  // ── Grupo 6A: Acetona PA-ACS ──────────────────────────────────────────────
  const agAcetona = await getAgRN('[Busca] - Produtos Prioritários', 'Acetona PA-ACS');

  await addKws('6A — Acetona PA-ACS', agAcetona, [
    'acetona pa',
    'acetona pa-acs',
    'acetona pura',
    'acetona grau analítico',
    'comprar acetona pa',
    'acetona para laboratório',
    'acetona p a',
    'acetona laboratorial',
  ]);

  // ── Grupo 6B: Parafina Histológica ───────────────────────────────────────
  const agParafina = await getAgRN('[Busca] - Produtos Prioritários', 'Parafina Histológica');

  await addKws('6B — Parafina Histológica', agParafina, [
    'parafina para inclusão',      // histologia
    'parafina em bloco',           // forma do produto lab
    'parafina para microscopia',   // uso qualificado
    'parafina grau histológico',   // qualificado
    'parafina para embebição',     // técnico histológico
  ]);

  // ── Grupo 6C: Álcool Metílico PA-ACS ─────────────────────────────────────
  const agMetanol = await getAgRN('[Busca] - Produtos Secundários', 'Álcool Metílico PA-ACS');

  await addKws('6C — Álcool Metílico PA-ACS', agMetanol, [
    'metanol 99',
    'metanol 99 5',
    'metanol anidro pa',
    'metanol grau hplc',
    'metanol para laboratório',
    'alcool metilico pa preço',
    'metanol preço',
    'metanol puro',
  ]);

  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
