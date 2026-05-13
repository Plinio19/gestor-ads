/**
 * Garimpo API — 359 termos NONE reais (07/05/2026)
 * Fonte: search_term_view API filtrado por campanhas ativas, período completo
 * Ordenado por impacto: custo > impressões
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

function neg(camp, text) {
  return { campaign: camp, negative: true, keyword: { text, match_type: PHRASE } };
}
function kw(agRN, text) {
  return { ad_group: agRN, status: ENABLED, keyword: { text, match_type: PHRASE } };
}

async function getAgRN(campName, agName) {
  const rows = await customer.query(`
    SELECT ad_group.id FROM ad_group
    WHERE campaign.name = '${campName}'
      AND ad_group.name = '${agName}'
      AND ad_group.status = 'ENABLED'
  `);
  if (!rows.length) throw new Error(`AG não encontrado: ${agName}`);
  return `customers/${CID}/adGroups/${rows[0].ad_group.id}`;
}

async function addNegs(label, termos) {
  const batch = [];
  for (const camp of CAMPS) for (const t of termos) batch.push(neg(camp, t));
  console.log(`\n[NEG ${label}] ${termos.length} × 2 = ${batch.length}...`);
  try {
    const r = await customer.campaignCriteria.create(batch);
    console.log(`  ✅ ${r.results.length} adicionados`);
  } catch (e) {
    console.error(`  ❌ ${e.message}`);
    if (e.errors) e.errors.forEach(x => console.error('  ', JSON.stringify(x)));
  }
  termos.forEach(t => console.log(`    ❌ "${t}"`));
}

async function addKws(label, agRN, termos) {
  console.log(`\n[KW ${label}] ${termos.length} termos...`);
  try {
    const r = await customer.adGroupCriteria.create(termos.map(t => kw(agRN, t)));
    console.log(`  ✅ ${r.results.length} adicionadas`);
  } catch (e) {
    console.error(`  ❌ ${e.message}`);
    if (e.errors) e.errors.forEach(x => console.error('  ', JSON.stringify(x)));
  }
  termos.forEach(t => console.log(`    ✓ "${t}" [PHRASE]`));
}

async function main() {
  console.log('=== GARIMPO API — 359 NONE (07/05/2026) ===\n');

  // ══════════════════════════════════════════════════════════════════
  // NEGATIVAS
  // ══════════════════════════════════════════════════════════════════

  // Álcool — doméstico 70% (variantes sem acento não cobertas pela negativa `álcool 70`)
  await addNegs('Álcool 70% doméstico — variantes sem acento', [
    'alcool 70',                           // base — cobre: alcool 70 bombona/inpm/liquido/litro/5l etc.
    'distribuidora de alcool 70',
    'distribuidora de álcool 70',
    'fornecedor de alcool 70',
    'fornecedor alcool 70',
    'indústria de álcool 70',
    'formula alcool 70',
    'tipos de alcool 70',
    'galão de alcool 70',
    'alcool 70 inpm liquido',              // R$3.44 gasto
  ]);

  // Álcool — concentrações domésticas / hidratado
  await addNegs('Álcool hidratado / concentrações indevidas', [
    'alcool etilico 1 litro',              // R$3.45 gasto — varejo
    'álcool etílico 96 onde comprar',      // R$2.76 gasto — ALCOHOL_SALE bloqueia keyword
    'álcool etileno',                      // R$2.73 gasto — produto diferente (etileno glicol / etoxilado)
    'álcool etílico tipo hidratado teor alcoólico 70 _ 70 gl apresentação líquido', // R$2.67 gasto
    'alcool hidratado',                    // hidratado = 92.8% industrial, não PA
    'alcool hidratado 96',
    'alcool 90',                           // 90% = hidratado
    'alcool 92',                           // 92.8% = hidratado
    'alcool etilico 90',
    'alcool etilico 92',
    'alcool etilico 92 8 inpm',
    'alcool etilico 92.8',
    'alcool etilico hidratado 70',
    'alcool etilico denaturato',           // desnaturado = produto diferente
    'álcool etílico 90',
    'álcool etílico 92 8',
    'álcool etílico 70 inpm',
    'álcool etílico 46 inpm',
    'álcool 46 inpm',
    'álcool 70 isopropílico',             // IPA 70% doméstico
    'alcool 40',                           // 40° = cachaça
    'álcool 95 para bebida',              // uso alimentar
  ]);

  // Álcool — cosmético / marcas / idiomas estrangeiros
  await addNegs('Álcool cosmético / marcas / estrangeiro', [
    'alcool para cosmeticos',
    'alcool extra fino',                   // perfumaria
    'alcool tupi 92',                      // marca de hidratado
    'alcool ferreira s a',                 // marca/distribuidora
    'álcool etílico absoluto synth',       // marca Synth (concorrente)
    'álcool absoluto ampola',             // uso médico/hospitalar
    'alcohol etilico 5l',                  // espanhol
    'alcohol isopropilico',               // espanhol
    'alcohol isopropílico',               // espanhol
    'alcool 100 pour cent',               // francês
    'alcool puro 96 gradi',              // italiano
    'acido isopropílico',                  // não existe — busca errada
  ]);

  // Álcool — informativo / fragmentos
  await addNegs('Álcool — informativo / genérico demais', [
    'o que é álcool etílico',
    'o álcool etílico',
    'densidade alcool 96',
    'etílico',                             // 5 impr — fragmento sem intenção
    'etilico',                             // 3 impr — idem
    'etilico alcool',
    'álcool para',                         // fragmento
    'álcool',                              // genérico demais
    'álcooletílico',                       // typo concatenado
    'alcool absoluto para que serve',
    'alcool mais puro',                    // sem intenção qualificada
    'alco puro',                           // typo/fragmento
    'isopropan',                           // fragmento
  ]);

  // H2SO4 — informativo / produto diferente
  await addNegs('H2SO4 — informativo / produto diferente', [
    'densidade acido sulfurico',
    'densidade do acido sulfurico 98',
    'densidade do acido sulfúrico',
    'densidade ácido sulfúrico 98',
    'densidad del acido sulfurico al 98',  // espanhol
    'acido sulfurico ficha tecnica',
    'fds ácido sulfúrico 98',
    'ph ácido sulfúrico 98',
    'o que é ácido sulfúrico',
    'o ácido sulfúrico',
    'basf chemistry',                      // marca concorrente
    'acido sulfenico',                     // ácido sulfênico = diferente
    'acido sulfhidrico',                   // H2S = gás, diferente
    'acido sul',                           // fragmento
    'h2so4 1n',                            // solução 1N preparada, não reagente PA
    'mm acido sulfúrico',                  // milimolar = informativo
    'ácido sulfúrico fispq',
    'ácido sulfúrico ph',
    'sulfurico',                           // genérico demais (4 impr)
    'sulfúrico',                           // genérico demais (7 impr)
    'empresa de acido sulfurico',
    'reagentes',                           // genérico demais (aparece em H2SO4 e HCl)
    'acido sulfurico 50',                  // 50% = diluído, produto diferente
    'acido sulfúrico 50',
  ]);

  // HCl — informativo / concentrações muito diluídas / produto diferente
  await addNegs('HCl — informativo / diluído / produto diferente', [
    'acido cloridrico fispq',
    'fispq ácido clorídrico 37',
    'cas 7647 01 0',                       // número CAS = informativo
    'densidade acido cloridrico',
    'densidade do ácido cloridrico',
    'densidade do ácido clorídrico 37',
    'densidade hcl pa',
    'ficha técnica hcl',
    'hcl 1 m',                             // 1 molar = solução diluída preparada
    'hcl 10',                              // HCl 10% = muito diluído
    'hcl peso molecular',
    'o que é hcl',
    'o que é hcl na quimica',
    'o que é ácido clorídrico e para que serve',
    'para que serve acido cloridrico',
    'gás clorídrico',                      // HCl gasoso ≠ ácido
    'hci quimica',                         // provável marca HCI
    'chemicals',                           // inglês genérico
    'ácido muriático concentração',        // doméstico
    'pureza hcl',                          // informativo
    'solução de ácido clorídrico',         // solução preparada, não reagente
    'ph do ácido clorídrico',
    'acido cloridrico 4',                  // HCl 4% = diluído
    'ácido clorídrico 4',
    'acido cloridrico 10',                 // HCl 10% = diluído
    'ácido clorídrico 10',
    'ácido clorídrico 32',                 // 32% = concentração diferente (Halogenn = 37%)
    'hcl 33',                              // HCl 33% = diferente de 37%
    'ácido clorídrico características',
    'ácido clorídrico estrutura',
    'àcido clorídrico',                    // typo (à em vez de á)
    'hcl 37 densidade',                    // informativo
    'hcl 1 m',
  ]);

  // Formaldeído — informativo / concentração diluída
  await addNegs('Formaldeído — informativo / diluído', [
    'densidade formaldeido',
    'formaldehyde liquid',                 // inglês
    'formol 37 como diluir',
    'o que formaldeido',
    'lifemold',                            // marca/produto diferente
    'formaldeído 10',                      // 10% = diluído, produto diferente de 37%
  ]);

  // Xileno — informativo / CAS
  await addNegs('Xileno — informativo / CAS', [
    'xilol o que é',
    '1330 20 7',                           // número CAS do xileno
  ]);

  // Parafina — produto diferente
  await addNegs('Parafina — produto diferente', [
    'parafina liquida laboratorio',        // parafina líquida = óleo mineral ≠ parafina histológica
  ]);


  // ══════════════════════════════════════════════════════════════════
  // KEYWORDS
  // ══════════════════════════════════════════════════════════════════

  // ── H2SO4 ────────────────────────────────────────────────────────
  const agH2SO4 = await getAgRN('[Busca] - Produtos Secundários', 'Ácido Sulfúrico PA-ACS');
  await addKws('Ácido Sulfúrico PA-ACS', agH2SO4, [
    'acido sulfurico pa',                  // R$3.02 — sem acento, forma mais buscada
    'acido sulfurico p a',                 // 7 impr — com espaço
    'acido sulfurico preco',               // intenção compra
    'acido sulfurico comprar',
    'acido sulfurico concentrado',         // sem acento
    'acido sulfurico 95',                  // 95% = concentração PA válida
    'acido sulfurico 98 comprar',
    'acido sulfurico puro',
    'acido sulfurico venda',
    'acido sulfurico onde comprar',
    'ácido sulfurico',                     // misto (ácido com acento, sulfurico sem)
    'acido sulfúrico 98',                  // misto
    'acido sulfúrico venda',
    'acido sulfúrico concentrado',
    'ácido sulfúrico comprar',
    'ácido sulfúrico onde comprar',
    'ácido sulfúrico onde encontrar',
    'ácido sulfúrico p a',                 // 2 impr — com espaço
    'ácido sulfúrico h2 so4',              // fórmula + nome = técnico comprando
    'ácido sulfúrico h2so4',
    'onde comprar acido sulfúrico',
    'onde comprar ácido sulfurico',
    'preço do acido sulfurico',
    'preço do ácido sulfúrico',
    'valor acido sulfurico',               // "valor" = intenção compra
    'valor do ácido sulfúrico',
    'como comprar acido sulfurico',
    'como comprar ácido sulfúrico',
  ]);

  // ── HCl ──────────────────────────────────────────────────────────
  const agHCl = await getAgRN('[Busca] - Produtos Secundários', 'Ácido Clorídrico PA-ACS');
  await addKws('Ácido Clorídrico PA-ACS', agHCl, [
    'ácido clorídrico p a',                // R$3.98 — com espaço, dado mais quente
    'acido cloridrico p a',                // sem acento
    'acido cloridrico comprar',
    'acido cloridrico puro',
    'acido clorídrico 37',                 // 5 impr — concentração correta
    'comprar acido cloridrico',
    'acido hcl',                           // 6 impr
    'acido hidroclorico',                  // nome alternativo correto
    'acido hidrocloridrico',               // idem
    'hcl p a',                             // 3 impr — com espaço
    'onde encontrar ácido clorídrico',
    'clorídrico',                          // 11 impr — curto mas específico do produto
    'ácido cloridrico',                    // misto
  ]);

  // ── Álcool Etílico — batch A (sem termos arriscados ALCOHOL_SALE) ─
  const agAlcool = await getAgRN('[Busca] - Produtos Prioritários', 'Álcool Etílico PA-ACS');
  await addKws('Álcool Etílico PA-ACS — batch A', agAlcool, [
    'alcool etílico 99',                   // R$2.80 (á+til = álcool, etílico)
    'alcool p a',                          // R$2.74
    'etanol p a',                          // 16 impr — mais variante de "etanol pa"
    'alcool absoluto preço',               // 6 impr
    'alcool anidro',                       // 5 impr
    'alcool absoluto 99 5',               // 4 impr
    'alcool a 96',                         // 4 impr
    'comprar alcool etilico',              // 4 impr
    'alcool 99 preço',                     // 3 impr
    'alcool 99 3 inpm',                    // 3 impr — grau INPM = qualificado
    'alcool 99 5',                         // 3 impr
    'alcool absoluto 99',                  // 3 impr
    'alcool etilico pa',                   // 3 impr
    'alcool etilico absoluto',             // 5 impr
    'alcool absoluto onde comprar',        // 2 impr
    'onde comprar alcool absoluto',        // 7 impr
    'onde comprar alcool 99',              // 3 impr
    'onde comprar alcool 96',              // 1 impr
    'comprar alcool 96',                   // 3 impr
    'alcool 96 onde comprar',              // 2 impr
    'alcool 96 5l',                        // 2 impr
    'alcool 95 graus',
    'alcool 95 puro',
    'alcool 96 graus',                     // 3 impr
    'alcool 96 1l',
    'preço alcool absoluto',
    'preço álcool absoluto',
    'preço do alcool anidro',
    'alcool etilico preço',                // 2 impr
    'alcool etilico puro',
    'alcool etilico 96 puro',
    'alcool 99.5',
    'alcool etilico 95',
    'alcool etilico absoluto',             // 5 impr
    'alcool etanol',                       // 2 impr
    'etanol anidro',
    'etanol anidro onde comprar',
    'etanol 100',
    'etanol álcool etílico',
    'álcool etílico absoluto',             // 3 impr
    'álcool etílico etanol',               // 3 impr
    'álcool etílico p a',                  // 3 impr (com espaço)
    'álcool absoluto pa',                  // 5 impr
    'álcool de cereais 96',               // cereais = fermentado = etanol
    'alcool de cereais',                   // 2 impr
    'álcool etanol',
    'álcool etilico absoluto',             // 3 impr
    'álcool etilico 100',
    'álcool etilico 99',                   // 2 impr
    'álcool etílico 100',                  // 5 impr
    'álcool 100 puro onde comprar',        // 3 impr
    'alcool liquido 5 litros',             // 5 impr — 5L = B2B
    'alcool etilico 5 litros',
    'fornecedor de alcool etilico',
    'alcool 99 3',                         // 1 impr
    'alcool etilico puro',
    'alcool etilico 1l',                   // 2 impr — 1L pode ser teste B2B
    'reagentes quimicos',                  // 2 impr — genérico mas presente no AG
  ]);

  // ── Álcool Etílico — batch B (risco ALCOHOL_SALE — lote separado) ─
  // Termos com "etilico" sem acento + número são mais propensos a disparar
  await addKws('Álcool Etílico PA-ACS — batch B', agAlcool, [
    'alcool etilico 99 5',                 // 4 impr
    'alcool 99 8',                         // 1 impr — anidro grau
    'alcool 96 onde encontrar',            // 3 impr
    'onde comprar etanol',
    'alcool absoluto 100',                 // 1 impr
    'álcool anidro absoluto',
    'álcool anidro preço',                 // 2 impr
  ]);

  // ── Álcool Metílico ───────────────────────────────────────────────
  const agMetanol = await getAgRN('[Busca] - Produtos Secundários', 'Álcool Metílico PA-ACS');
  await addKws('Álcool Metílico PA-ACS', agMetanol, [
    'metanol 99 pureza',                   // R$2.70 — 1 click
    'metanol p a',                         // 6 impr — variante espaçada
    'methanol p a',
    'álcool metílico',                     // 1 impr
    'alcool metílico',                     // 2 impr
    'álcool metílico preço',               // 2 impr
  ]);

  // ── Acetona ───────────────────────────────────────────────────────
  const agAcetona = await getAgRN('[Busca] - Produtos Prioritários', 'Acetona PA-ACS');
  await addKws('Acetona PA-ACS', agAcetona, [
    'acetona 100',                         // 2 impr
    'acetona 100 pura onde comprar',
    'acetona p a',                         // 2 impr — com espaço
    'como comprar acetona pura',
    'onde comprar acetona 100 pura',
    'onde comprar acetona pura',
  ]);

  // ── Formaldeído ───────────────────────────────────────────────────
  const agFormol = await getAgRN('[Busca] - Produtos Prioritários', 'Formaldeído PA');
  await addKws('Formaldeído PA', agFormol, [
    'formaldeido',                         // 1 impr
    'formaldeido 37',                      // 6 impr
    'formaldeido comprar',
    'formaldeido preço',                   // 3 impr
    'formalina 37',                        // 3 impr
    'formalina preço',                     // 2 impr
    'formol 37 1000ml',
    'formol 5 l',                          // 2 impr
    'formol 5 litros',                     // 2 impr
    'formol a 37',                         // 2 impr
    'formol estabilizado',                 // 4 impr — formol com estabilizador = produto
    'formol inibido',                      // 6 impr — com inibidor de polimerização
    'formol litro',
    'formol liquido puro',
    'formol preço 1 litro',               // 4 impr
    'quanto custa um litro de formol',     // 2 impr — intenção compra
  ]);

  // ── Parafina Histológica ──────────────────────────────────────────
  const agParafina = await getAgRN('[Busca] - Produtos Prioritários', 'Parafina Histológica');
  await addKws('Parafina Histológica', agParafina, [
    'parafina histologica',                // 8 impr — variante sem acento
    'bloco de parafina biopsia',
    'bloco histologico',                   // 2 impr
    'blocos de parafina',                  // 2 impr
  ]);

  // ── Xileno e Xilol ───────────────────────────────────────────────
  const agXileno = await getAgRN('[Busca] - Produtos Prioritários', 'Xileno e Xilol PA');
  await addKws('Xileno e Xilol PA', agXileno, [
    'solvente xileno',                     // 4 impr
    'xilenos',                             // 7 impr — plural
    'xileno quimica',                      // 10 impr
    'xileno produto quimico',
    'tolueno e xileno',                    // ambos produtos Halogenn
    'xileno tolueno',
    'm p xileno',                          // isômeros m/p-xileno = técnico qualificado
    'empresas de reagentes quimicos',
  ]);

  // ── Hexano PA ─────────────────────────────────────────────────────
  const agHexano = await getAgRN('[Busca] - Produtos Secundários', 'Hexano PA');
  await addKws('Hexano PA', agHexano, [
    'hexano p a',                          // 2 impr no Xileno AG — espaçado
  ]);

  // ── Acetato de Etila PA ───────────────────────────────────────────
  const agAcetato = await getAgRN('[Busca] - Produtos Secundários', 'Acetato de Etila PA');
  await addKws('Acetato de Etila PA', agAcetato, [
    'acetato de etila p a',               // 1 impr — com espaço
  ]);

  console.log('\n=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
