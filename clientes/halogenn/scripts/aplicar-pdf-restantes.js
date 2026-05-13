/**
 * PDF Restantes — negativas + keywords identificadas no relatório de 438 termos NONE
 * Garimpo 06/05/2026 — termos não cobertos pelos scripts anteriores
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const CID = CUSTOMER_ID;
const PHRASE = enums.KeywordMatchType.PHRASE;
const ENABLED = enums.AdGroupCriterionStatus.ENABLED;

const CAMPS = [
  `customers/${CID}/campaigns/23769809419`,
  `customers/${CID}/campaigns/23769809422`,
];

// ── helpers ──────────────────────────────────────────────────────────────────

function neg(camp, text) {
  return { campaign: camp, negative: true, keyword: { text, match_type: PHRASE } };
}

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
  if (!rows.length) throw new Error(`AG não encontrado: ${agName} (camp: ${campName})`);
  return `customers/${CID}/adGroups/${rows[0].ad_group.id}`;
}

async function addNegs(label, termos) {
  const batch = [];
  for (const camp of CAMPS) for (const t of termos) batch.push(neg(camp, t));
  console.log(`\n[NEG ${label}] ${termos.length} termos × 2 campanhas = ${batch.length} critérios...`);
  try {
    const r = await customer.campaignCriteria.create(batch);
    console.log(`  ✅ ${r.results.length} adicionados`);
  } catch (e) {
    console.error(`  ❌ Erro: ${e.message}`);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }
  termos.forEach(t => console.log(`    ❌ "${t}"`));
}

async function addKws(label, agRN, termos) {
  console.log(`\n[KW ${label}] ${termos.length} keywords...`);
  try {
    const r = await customer.adGroupCriteria.create(termos.map(t => kw(agRN, t)));
    console.log(`  ✅ ${r.results.length} adicionadas`);
  } catch (e) {
    console.error(`  ❌ Erro: ${e.message}`);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }
  termos.forEach(t => console.log(`    ✓ "${t}" [PHRASE]`));
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== APLICAR PDF RESTANTES (garimpo 06/05/2026) ===\n');

  // ── NEGATIVAS ─────────────────────────────────────────────────────────────

  // Álcool — concentrações inexistentes / uso hospitalar / doméstico / variantes
  await addNegs('Álcool — concentrações/uso indevido', [
    'álcool etílico 98',          // concentração 98% não existe para etanol PA
    'álcool 98',                  // idem
    'álcool butílico',            // butanol = produto diferente
    'álcool combustível',         // automotivo
    'alcool etilico 70',          // 70% (variante sem acento não coberta por álcool 70)
    'álcool hospitalar 96',       // hospitalar = varejo/farmácia
    'alcool benzilico',           // benzyl alcohol = produto diferente
    'alcool benzilico usp',       // idem
    'álcool 54',                  // concentração inexistente
    'alcool propilico',           // sem acento, não coberto por álcool propílico PHRASE
  ]);

  // Formaldeído — informativo / FISPQ / diluição
  await addNegs('Formaldeído — informativo / diluição', [
    'densidade formol 37',        // informativo (R$3.46 gasto)
    'fispq formol 37',            // FISPQ informativo
    'diluição formol 37 para 10', // instrução de diluição, não compra
  ]);

  // H2SO4 — FDS informativo
  await addNegs('H2SO4 — FDS informativo', [
    'acido sulfurico fds',        // FDS informativo (R$3.19 gasto)
    'ácido sulfuroso',            // H2SO3 ≠ H2SO4 (ácido diferente)
    'cas7664 93 9',               // número CAS = informativo/acadêmico
  ]);

  // HCl — informativo / idiomas
  await addNegs('HCl — informativo / idiomas', [
    'ph ácido clorídrico',        // informativo
    'ph acido cloridrico',        // variante sem acento
    'acido clorhidrico',          // espanhol
  ]);

  // ── KEYWORDS ──────────────────────────────────────────────────────────────

  // Formaldeído PA [Prioritários]
  const agFormol = await getAgRN('[Busca] - Produtos Prioritários', 'Formaldeído PA');
  await addKws('Formaldeído PA', agFormol, [
    'litro de formol',            // CTR 100%, 2 clicks, R$6.98 — intenção compra clara
    'venda de formol',            // intenção compra
    'formaldeido pa',             // variante sem acento (produto específico)
  ]);

  // Ácido Clorídrico PA-ACS [Secundários]
  const agHCl = await getAgRN('[Busca] - Produtos Secundários', 'Ácido Clorídrico PA-ACS');
  await addKws('Ácido Clorídrico PA-ACS', agHCl, [
    'ácido clorídrico hcl',       // query explícita com fórmula
    'ácido clorídrico venda',     // intenção compra direta
    'hcl fumegante',              // grau fumegante = qualificado (37%)
  ]);

  // Álcool Etílico PA-ACS [Prioritários]
  const agAlcool = await getAgRN('[Busca] - Produtos Prioritários', 'Álcool Etílico PA-ACS');
  await addKws('Álcool Etílico PA-ACS', agAlcool, [
    'fabricante de alcool',       // intenção B2B / volume
    'fornecedor de alcool',       // intenção B2B / volume
    'álcool etílico 96 onde comprar', // intenção compra + concentração específica
    'alcool 99 comprar',          // anidro / alta pureza, intenção compra
    'alcool 99 liquido',          // 43 impressões observadas no PDF
  ]);

  // Ácido Sulfúrico PA-ACS [Secundários]
  const agH2SO4 = await getAgRN('[Busca] - Produtos Secundários', 'Ácido Sulfúrico PA-ACS');
  await addKws('Ácido Sulfúrico PA-ACS', agH2SO4, [
    'ácido sulfúrico preço',      // CTR 40%, R$6.36 — intenção compra
    'preço ácido sulfúrico',      // variante de ordem
  ]);

  // Xileno e Xilol PA [Prioritários]
  const agXileno = await getAgRN('[Busca] - Produtos Prioritários', 'Xileno e Xilol PA');
  await addKws('Xileno e Xilol PA', agXileno, [
    'compra de reagentes quimicos', // intenção B2B ampla — xileno é reagente PA
  ]);

  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
