/**
 * Negativas — Grupo 1: Álcool Etílico (512 termos NONE — garimpo 06/05/2026)
 * 4 categorias: concorrentes, informacional/FDS, doméstico/bebidas/perfumaria, idiomas
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
  console.log('=== NEGATIVAR GRUPO 1 — ÁLCOOL (garimpo 06/05/2026) ===\n');

  // ── 1A: Concorrentes e marcas ─────────────────────────────────────────────
  await addLote('1A — Concorrentes / Marcas', [
    'álcool santa cruz ltda',      // Santa Cruz = distribuidora concorrente (1 click, R$3,43)
    'alcool santa cruz ltda',
    'etanol absoluto merck',        // Merck = concorrente
    'isopropanol quimidrol',        // Quimidrol = distribuidor
    'alcool isopropilico cda',      // CDA = marca/distribuidor
    'implastec alcool isopropilico', // Implastec = fabricante IPA
    'alcohol absoluto farmatodo',   // Farmatodo = rede farmácias Venezuela
    'alcool ferreira s a',          // Álcool Ferreira = produtora
    'alcool uzuclean',              // Uzuclean = marca limpeza
    'amazon alcool 99',             // Quer Amazon
    'etanol al 96',                 // AL 96 = marca
    '64 17 5',                      // Número CAS do etanol (1 click, R$3,50)
    'cas 64 17 5',
    'etanol absoluto cas',
    '7897780207162',                // Código EAN/barcode
  ]);

  // ── 1B: Informacional / FDS / FISPQ / regulatório ────────────────────────
  await addLote('1B — Informacional / FDS / FISPQ', [
    'fds alcool etilico',
    'fds alcool 70',
    'fds etanol 96',
    'fds álcool etílico',
    'fds álcool isopropílico',
    'fds alcool isopropilico',
    'fispq alcool etilico',
    'fispq álcool etílico',
    'fispq álcool etílico 96',
    'o que é álcool absoluto',
    'o que é álcool etílico hidratado',
    'o que é álcool neutro',
    'o álcool etílico 96 gl é uma substância pura',
    'qual é o álcool etílico',
    'existe alcool 100',
    'existe álcool 100',
    'composição do álcool 96',
    'o que significa alcool 96 gl',
    'ncm alcool 70',
    'ncm do álcool',
    'ncm álcool etílico',
    'onu 1219',
    'inpm alcool',
    '92 8 inpm',
    'para que serve o álcool absoluto',
    'para que serve o álcool isopropílico',
    'álcool etílico densidade',
    'alcool etilico cas',
  ]);

  // ── 1C: Doméstico / Bebidas / Perfumaria ─────────────────────────────────
  await addLote('1C — Doméstico / Bebidas / Perfumaria', [
    'alcool gel sao paulo',                       // gel = consumidor
    'etanol para perfumes',                       // perfumes (1 click, R$2,66)
    'alcool de perfumaria',
    'alcool neutro',                              // extra neutro = perfumaria/bebidas
    'álcool neutro',
    'etanol neutro',
    'álcool etílico extra neutro',
    'álcool extra neutro',
    'álcool etílico potável',                     // potável = bebida
    'álcool etílico potável de origem agrícola',
    'álcool etílico de origem agrícola',
    'alcool desnaturado',                         // desnaturado = não PA
    'álcool etílico desnaturado',
    'álcool etílico para bebidas',
    'alcool de cereais 96',                       // cereais = bebida/perfumaria
    'álcool de cereais 100 puro',
    'etanol etilico',                             // redundante/confuso
    'etanol etílico',
    'alcool esteril',                             // estéril = hospitalar/farmácia
    'álcool absoluto estéril ampola',
    'alcool institucional',                       // limpeza institucional
    'álcool hidrofílico',                         // produto diferente
    'álcool 92 onde comprar porto alegre',        // 92% = hidratado, não PA
    'álcool 92 5',
    'álcool 92 8 inpm',
    'alcool 92 5 litros',
    'alcool 92 5l',
    'alcool 92 serve',
    'alcool 92º',
    'álcool 90 farmácia',                         // 90% = farmácia/limpeza
    'alcool etilico hidratado',                   // hidratado ≠ PA absoluto
    'alcool etilico hidratado 70',
    'alcool etilico hidratado 70 1 litro',
    'álcool etilico hidratado',
    'álcool etílico hidratado',
    'álcool etílico hidratado 92',
    'álcool etílico hidratado 92 8',
    'álcool etílico hidratado 96',
    'álcool etílico hidratado extra neutro',
    'etílico hidratado',
  ]);

  // ── 1D: Idiomas estrangeiros ──────────────────────────────────────────────
  await addLote('1D — Idiomas estrangeiros', [
    'ethanol',            // inglês, 6 impr 0 clicks
    'ethanol puro',
    'ethyl alcohol',
    'alcohol etilico',    // espanhol
    'alcohol etilico 96',
    'etanolo',            // italiano
    'benzyl alcohol',     // inglês + produto diferente
    'denatured ethanol',  // inglês + desnaturado
  ]);

  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
