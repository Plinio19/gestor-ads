/**
 * Negativas — Grupos 2–6: Xileno/Hexano/Tolueno, Formaldeído, H2SO4, HCl, Acetona/Parafina/Metanol
 * Garimpo 06/05/2026 — 512 termos NONE analisados
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const CID = CUSTOMER_ID;
const PHRASE = enums.KeywordMatchType.PHRASE;

const CAMPS = [
  `customers/${CID}/campaigns/23769809419`,
  `customers/${CID}/campaigns/23769809422`,
];

function neg(camp, text) {
  return { campaign: camp, negative: true, keyword: { text, match_type: PHRASE } };
}

async function addLote(label, termos) {
  const batch = [];
  for (const camp of CAMPS) for (const t of termos) batch.push(neg(camp, t));
  console.log(`\n[${label}] ${termos.length} termos × 2 campanhas = ${batch.length} critérios...`);
  try {
    const r = await customer.campaignCriteria.create(batch);
    console.log(`  ✅ ${r.results.length} adicionados`);
  } catch (e) {
    console.error(`  ❌ Erro: ${e.message}`);
    if (e.errors) e.errors.forEach(err => console.error('   ', JSON.stringify(err)));
  }
  termos.forEach(t => console.log(`    ❌ "${t}"`));
}

async function main() {
  console.log('=== NEGATIVAR GRUPOS 2–6 (garimpo 06/05/2026) ===\n');

  // ── 2A: Hexano — informacional / idiomas ─────────────────────────────────
  await addLote('2A — Hexano informacional / idiomas', [
    'hexano para que serve',       // informativo
    'o que é hexano',              // informativo
    'hexano formula molecular',    // acadêmico
    'hexano ponto de ebulição',    // técnico informativo
    'fds hexano',                  // FDS = ficha de segurança
    'fispq hexano',                // FISPQ informativo
    'hexane',                      // inglês
    'n-hexane',                    // inglês
    'hexano cadeia carbonica',     // acadêmico
  ]);

  // ── 2B: Tolueno — informacional / idiomas ────────────────────────────────
  await addLote('2B — Tolueno informacional / idiomas', [
    'tolueno para que serve',      // informativo
    'o que é tolueno',             // informativo
    'tolueno toxicidade',          // informativo/acadêmico
    'tolueno fds',                 // FDS informativo
    'tolueno fispq',               // FISPQ informativo
    'toluene',                     // inglês
    'toluol',                      // inglês/alemão (grau industrial)
    'tolueno inflamável',          // informativo
    'tolueno estrutura molecular', // acadêmico
  ]);

  // ── 2C: Xileno/Xilol — uso industrial (não analítico) ───────────────────
  await addLote('2C — Xileno/Xilol industrial / doméstico', [
    'xileno industrial',           // industrial ≠ grau analítico
    'xilol industrial',            // industrial
    'xilol para pintura',          // tinta/construção
    'xileno para pintura',         // tinta/construção
    'xilol thinner',               // diluente industrial
    'xilol para limpeza',          // limpeza doméstica
  ]);

  // ── 3A: Formaldeído — doméstico / idiomas / informacional ────────────────
  await addLote('3A — Formaldeído doméstico / idiomas / informacional', [
    'formol farmácia',             // varejo
    'formol caseiro',              // doméstico
    'formaldehyde',                // inglês
    'formol para embalsamamento',  // funerária, não lab analítico
    'formol para que serve',       // informativo
    'formalina para que serve',    // informativo
    'formol 10 para que serve',    // informativo
    'formaldeído o que é',         // informativo
    'formol odor',                 // informativo
    'formol cheiro',               // informativo
  ]);

  // ── 4A: Ácido Sulfúrico — informacional / industrial / idiomas ───────────
  await addLote('4A — H2SO4 informacional / industrial / idiomas', [
    'sulfuric acid',               // inglês
    'ácido sulfúrico formula',     // informativo
    'ácido sulfúrico o que é',     // informativo
    'h2so4 o que é',              // informativo
    'ácido sulfúrico para baterias', // automotivo
    'ácido sulfúrico baterias',    // automotivo
    'acido sulfurico baterias',    // automotivo
    'ácido sulfúrico industrial',  // industrial ≠ grau analítico
    'fds ácido sulfúrico',         // FDS informativo
    'fispq ácido sulfúrico',       // FISPQ informativo
    'acido sulfurico sigma',       // concorrente
    'h2so4 sigma aldrich',         // concorrente
    'ácido sulfúrico sigma aldrich', // concorrente
  ]);

  // ── 5A: Ácido Clorídrico — informacional / industrial / idiomas ──────────
  await addLote('5A — HCl informacional / industrial / idiomas', [
    'hydrochloric acid',           // inglês genérico (já negado "fuming 37" específico)
    'ácido clorídrico formula',    // informativo
    'ácido clorídrico o que é',    // informativo
    'ácido muriático',             // doméstico/construção (HCl impuro)
    'acido muriatico',             // doméstico
    'hcl sigma aldrich',           // concorrente
    'ácido clorídrico sigma',      // concorrente
    'acido cloridrico na piscina', // piscina, não lab
    'ácido clorídrico piscina',    // piscina
    'hcl industrial',              // industrial ≠ analítico
    'ácido clorídrico industrial', // industrial
  ]);

  // ── 6A: Acetona — doméstico / idiomas ────────────────────────────────────
  await addLote('6A — Acetona doméstico / idiomas', [
    'acetona para unhas',          // esmalte doméstico
    'acetona remove esmalte',      // doméstico
    'acetona farmácia',            // varejo
    'acetone',                     // inglês
    'acetona caseira',             // doméstico
    'acetona para esmalte',        // doméstico
    'acetona beleza',              // cosmético
  ]);

  // ── 6B: Parafina — doméstico / cosmético ─────────────────────────────────
  await addLote('6B — Parafina doméstico / cosmético', [
    'parafina para velas',         // decoração
    'parafina corporal',           // cosmético/spa
    'parafina para cabelo',        // cosmético
    'parafina depilação',          // cosmético
    'parafina alimentar',          // uso alimentício ≠ histológico
    'vela de parafina',            // decoração
    'parafina para artesanato',    // artesanato
    'parafina liquida',            // produto diferente (óleo mineral)
  ]);

  // ── 6C: Metanol — combustível / idiomas ──────────────────────────────────
  await addLote('6C — Metanol combustível / idiomas', [
    'metanol combustível',         // combustível, não reagente
    'metanol para motor',          // combustível
    'methanol',                    // inglês
    'metanol biocombustível',      // combustível
    'metanol para carro',          // automotivo
    'alcool metilico combustivel', // combustível
  ]);

  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
