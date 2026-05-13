/**
 * Atualizar RSAs — 07/05/2026
 * Objetivo: elevar Ad Strength de POOR/AVERAGE para GOOD/EXCELLENT
 * Estratégia: todos os AGs vão para 15 headlines (máximo) + descriptions específicas
 * AGs atualizados: Formaldeído, Álcool Etílico, Hexano, Tolueno, IPA, Hipoclorito, Xileno
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

function H(t) {
  if (t.length > 30) throw new Error(`Headline muito longa (${t.length}): "${t}"`);
  return { text: t };
}
function D(t) {
  if (t.length > 90) throw new Error(`Description muito longa (${t.length}): "${t}"`);
  return { text: t };
}

// ── Copy novo por AG ──────────────────────────────────────────────────────────
// Todos os headlines somam 15 (máximo do RSA)
// Regra: manter headlines existentes bons + adicionar os que faltam

const UPDATES = {

  'Formaldeído PA': {
    headlines: [
      H('Formaldeído PA Halogenn'),         // 23 — existente
      H('Formol Grau Analítico Laudo'),     // 27 — existente
      H('Fabricante Nacional Reagentes'),   // 29 — existente
      H('Formalina PA Patologia'),          // 22 — existente
      H('Entrega Rápida Todo Brasil'),      // 26 — existente
      H('Solicite Cotação Agora'),          // 22 — existente
      H('Fornecedor Fiocruz e USP'),        // 24 — existente
      H('Formol PA Anatomia Patológica'),   // 29 — existente
      H('Reagente PA-ACS Certificado'),     // 27 — existente
      H('Peça Cotação pelo WhatsApp'),      // 26 — existente
      H('Formol 37% PA com Inibidor'),      // 25 — NOVO: produto específico
      H('Comprar Formol Analítico'),        // 24 — NOVO: intenção de compra
      H('Formaldeído PA Histologia'),       // 27 — NOVO: uso caso
      H('Formaldeído 37% Laudo e NF'),      // 26 — NOVO: benefício fiscal
      H('Formol PA Controle Qualidade'),    // 28 — NOVO: uso caso CQ
    ],
    descriptions: [
      D('Formaldeído grau PA para laboratório de anatomia patológica e controle de qualidade.'), // 84
      D('Formol PA com laudo de análise. Fabricante nacional. Entrega para todo o Brasil.'),      // 80
      D('Formalina grau analítico 37% PA com certificado. Fornecedor de hospitais e laboratórios.'), // 88
      D('Formaldeído PA para fixação de tecidos. Laudo incluso. Atendemos Fiocruz e Butantan.'), // 84
    ],
  },

  'Álcool Etílico PA-ACS': {
    headlines: [
      H('Álcool Etílico PA-ACS Laudo'),     // 27 — existente
      H('Fabricante Nacional Reagentes'),   // 29 — existente
      H('Entrega Rápida Todo Brasil'),      // 26 — existente
      H('Solicite Cotação Agora'),          // 22 — existente
      H('Álcool Grau Analítico PA'),        // 24 — existente
      H('Fornecedor Fiocruz e USP'),        // 24 — existente
      H('Reagente PA-ACS Halogenn'),        // 24 — existente
      H('Álcool Etílico PA Laboratório'),   // 29 — existente
      H('Peça Cotação pelo WhatsApp'),      // 26 — existente
      H('Álcool PA-ACS Certificado'),       // 25 — existente
      H('Álcool Etílico 96% e 99%'),        // 24 — NOVO: concentrações
      H('Etanol Anidro PA Analítico'),      // 26 — NOVO: variante anidro
      H('Comprar Álcool Etílico PA'),       // 25 — NOVO: intenção compra
      H('Etanol Absoluto Certificado'),     // 27 — NOVO: etanol absoluto
      H('Álcool PA para HPLC e CQ'),        // 22 — NOVO: uso técnico
    ],
    descriptions: [
      D('Álcool etílico PA-ACS com laudo de análise. Fabricante nacional. Atendemos Fiocruz e USP.'), // 89
      D('Reagente grau analítico com certificado. Entrega rápida para todo Brasil. Sem importação.'),  // 89
      D('Álcool etílico absoluto PA-ACS. Laudo incluso. Compra mensal ou emergencial. Peça cotação.'), // 90
      D('Fornecedor nacional de álcool etílico PA. Laudos e certificados para auditoria. Solicite.'),  // 89
    ],
  },

  'Xileno e Xilol PA': {
    headlines: [
      H('Xileno PA para Histologia'),       // 25 — existente
      H('Xilol Grau Analítico Laudo'),      // 26 — existente
      H('Fabricante Nacional Reagentes'),   // 29 — existente
      H('Xilol Especial Histologia'),       // 25 — existente
      H('Entrega Rápida Todo Brasil'),      // 26 — existente
      H('Solicite Cotação Agora'),          // 22 — existente
      H('Fornecedor Fiocruz e USP'),        // 24 — existente
      H('Xileno Anatomia Patológica'),      // 26 — existente
      H('Reagente PA-ACS Halogenn'),        // 24 — existente
      H('Peça Cotação pelo WhatsApp'),      // 26 — existente
      H('Xileno e Xilol Grau PA'),          // 22 — NOVO: produto
      H('Solvente Histológico Puro'),       // 25 — NOVO: diferenciador
      H('Xilol PA para Microscopia'),       // 25 — NOVO: uso caso
      H('Comprar Xileno Analítico'),        // 24 — NOVO: intenção compra
      H('Xileno PA Diafanização'),          // 22 — NOVO: uso histológico
    ],
    descriptions: [
      D('Xileno grau analítico PA com certificado. Ideal para histologia e anatomia patológica.'),   // 86
      D('Xilol especial para histologia com laudo de análise. Fabricante nacional. Entrega rápida.'), // 89
      D('Xileno PA 99,8% para laboratório de patologia. Certificado incluso. Solicite cotação.'),    // 85
      D('Fornecedor de xileno e xilol grau analítico. Atendemos hospitais, clínicas e laboratórios.'), // 90
    ],
  },

  'Hexano PA': {
    headlines: [
      H('Hexano PA'),                       //  9 — existente (mantido por keyword match)
      H('Hexano Grau Analítico'),           // 21 — existente
      H('n-Hexano PA-ACS'),                 // 15 — existente
      H('Solvente de Alta Pureza'),         // 24 — existente
      H('Laudo de Qualidade Incluso'),      // 26 — existente
      H('Entrega para Todo o Brasil'),      // 26 — existente
      H('Hexano para Laboratório'),         // 23 — existente
      H('Reagente de Alta Pureza'),         // 23 — existente
      H('Compra Segura Online'),            // 20 — existente
      H('Hexano PA Halogenn'),              // 18 — NOVO: brand
      H('Fabricante Nacional Reagentes'),   // 29 — NOVO: diferenciador
      H('Solicite Cotação Agora'),          // 22 — NOVO: CTA
      H('Fornecedor Fiocruz e USP'),        // 24 — NOVO: prova social
      H('Hexano PA para Cromatografia'),    // 28 — NOVO: uso caso
      H('Solvente Hexano Certificado'),     // 27 — NOVO: certificação
    ],
    descriptions: [
      D('Hexano PA-ACS para laboratório com laudo analítico incluso. Entrega para todo o Brasil.'),  // 87
      D('Solvente hexano grau analítico com certificado de pureza. Frete para todo o Brasil.'),      // 83
      D('Hexano PA para cromatografia e extração. Atendemos CNPJ e laboratórios. Solicite cotação.'), // 89
    ],
  },

  'Tolueno PA': {
    headlines: [
      H('Tolueno PA'),                      // 10 — existente (mantido por keyword match)
      H('Tolueno Grau Analítico'),          // 22 — existente
      H('Tolueno PA-ACS'),                  // 14 — existente
      H('Solvente Orgânico PA'),            // 20 — existente
      H('Laudo de Qualidade Incluso'),      // 26 — existente
      H('Entrega para Todo o Brasil'),      // 26 — existente
      H('Tolueno para Laboratório'),        // 24 — existente
      H('Reagente de Alta Pureza'),         // 23 — existente
      H('Compra Segura Online'),            // 20 — existente
      H('Tolueno PA Halogenn'),             // 19 — NOVO: brand
      H('Fabricante Nacional Reagentes'),   // 29 — NOVO: diferenciador
      H('Solicite Cotação Agora'),          // 22 — NOVO: CTA
      H('Fornecedor Fiocruz e USP'),        // 24 — NOVO: prova social
      H('Tolueno PA para Extração'),        // 24 — NOVO: uso caso
      H('Solvente Tolueno Certificado'),    // 28 — NOVO: certificação
    ],
    descriptions: [
      D('Tolueno PA-ACS para laboratório com laudo analítico incluso. Entrega para todo o Brasil.'), // 88
      D('Solvente tolueno grau analítico com certificado de pureza. Frete para todo o Brasil.'),     // 84
      D('Tolueno PA para extração orgânica e síntese. Atendemos CNPJ e laboratórios. Solicite.'),   // 83
    ],
  },

  'Álcool Isopropílico PA': {
    headlines: [
      H('Álcool Isopropílico PA'),          // 22 — existente
      H('Isopropanol Grau Analítico'),      // 26 — existente
      H('IPA 99,5% PA-ACS'),               // 16 — existente
      H('Laudo de Qualidade Incluso'),      // 26 — existente
      H('Entrega para Todo o Brasil'),      // 26 — existente
      H('Para Laboratório e Indústria'),    // 28 — existente
      H('Reagente de Alta Pureza'),         // 23 — existente
      H('Compra Segura Online'),            // 20 — existente
      H('Álcool Isopropílico 99%'),         // 23 — existente
      H('Álcool Isopropílico Puro'),        // 24 — NOVO: pureza
      H('Fabricante Nacional Halogenn'),    // 28 — NOVO: brand
      H('Solicite Cotação Agora'),          // 22 — NOVO: CTA
      H('Fornecedor Fiocruz e USP'),        // 24 — NOVO: prova social
      H('Isopropanol PA Solvente'),         // 23 — NOVO: variante
      H('IPA PA para Laboratório'),         // 23 — NOVO: uso + grau
    ],
    descriptions: [
      D('Álcool isopropílico PA 99,5% com laudo analítico. Ideal para laboratórios e indústrias.'), // 87
      D('Isopropanol grau analítico com certificado de pureza. Frete para todo o Brasil.'),          // 79
      D('IPA 99,5% PA para limpeza e síntese. Atendemos CNPJ e laboratórios. Solicite cotação.'),   // 83
    ],
  },

  'Hipoclorito de Sódio PA': {
    headlines: [
      H('Hipoclorito de Sódio PA'),         // 23 — existente
      H('NaOCl 10-12% Grau Analítico'),     // 27 — existente
      H('Hipoclorito PA-ACS Certificado'), // 30 — existente
      H('Laudo de Qualidade Incluso'),      // 26 — existente
      H('Para Laboratório e Indústria'),    // 28 — existente
      H('Entrega para Todo o Brasil'),      // 26 — existente
      H('Reagente de Alta Pureza'),         // 23 — existente
      H('Compra Segura Online'),            // 20 — existente
      H('Hipoclorito de Sódio 10%'),        // 24 — existente
      H('Hipoclorito de Sódio Puro'),       // 25 — NOVO: pureza
      H('Fabricante Nacional Halogenn'),    // 28 — NOVO: brand
      H('Solicite Cotação Agora'),          // 22 — NOVO: CTA
      H('Fornecedor Fiocruz e USP'),        // 24 — NOVO: prova social
      H('NaOCl PA Laudo Analítico'),        // 24 — NOVO: fórmula + grau
      H('Hipoclorito PA Analítico'),        // 24 — NOVO: variante concisa
    ],
    descriptions: [
      D('Hipoclorito de sódio PA 10-12% com laudo analítico. Para labs e indústria.'),             // 74
      D('NaOCl grau analítico com certificado de pureza. Frete nacional.'),                        // 63
      D('Hipoclorito PA para laboratório e indústria alimentícia. CNPJ e laudos disponíveis.'),    // 84
    ],
  },
};

// ── main ─────────────────────────────────────────────────────────────────────
// RSA headlines/descriptions são IMMUTABLE na API — não é possível UPDATE.
// Solução: remover ad antigo (REMOVED) + criar novo ad com copy completo.

async function main() {
  console.log('=== ATUALIZAR RSAs — Ad Strength POOR → GOOD ===');
  console.log('Estratégia: remover ad antigo + criar novo com 15 headlines\n');

  const rows = await customer.query(`
    SELECT
      ad_group_ad.resource_name,
      ad_group_ad.ad.final_urls,
      ad_group.resource_name,
      ad_group.name,
      ad_group_ad.ad_strength,
      ad_group_ad.policy_summary.approval_status
    FROM ad_group_ad
    WHERE campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
      AND ad_group_ad.status != 'REMOVED'
  `);

  const STRENGTH = { 0:'UNSPEC',1:'UNKNOWN',2:'PENDING',3:'NO_ADS',4:'POOR',5:'AVERAGE',6:'GOOD',7:'EXCELLENT' };
  const adMap = {};
  for (const r of rows) {
    adMap[r.ad_group.name] = {
      adRN:    r.ad_group_ad.resource_name,
      agRN:    r.ad_group.resource_name,
      url:     r.ad_group_ad.ad?.final_urls?.[0] ?? 'https://www.halogenn.com.br',
      strength: STRENGTH[r.ad_group_ad.ad_strength] ?? '?',
    };
  }

  let updated = 0;
  let errors  = 0;

  for (const [agName, copy] of Object.entries(UPDATES)) {
    const ad = adMap[agName];
    if (!ad) {
      console.log(`⚠️  AG não encontrado: "${agName}" — pulando`);
      continue;
    }

    console.log(`\n── ${agName} (strength: ${ad.strength}) ──`);

    // 1. Remover ad antigo
    try {
      await customer.adGroupAds.remove([ad.adRN]);
      console.log(`   🗑️  Ad antigo removido`);
    } catch (e) {
      console.error(`   ❌ Erro ao remover: ${e.message}`);
      if (e.errors) e.errors.forEach(err => console.error('     ', JSON.stringify(err)));
      errors++;
      continue;
    }

    // 2. Criar novo ad com copy atualizado
    try {
      const r = await customer.adGroupAds.create([{
        ad_group: ad.agRN,
        status: 2, // ENABLED
        ad: {
          final_urls: [ad.url],
          responsive_search_ad: {
            headlines:    copy.headlines,
            descriptions: copy.descriptions,
          }
        }
      }]);
      console.log(`   ✅ Novo ad criado: ${r.results[0].resource_name}`);
      console.log(`   📝 ${copy.headlines.length} headlines | ${copy.descriptions.length} descriptions | URL: ${ad.url}`);
      updated++;
    } catch (e) {
      console.error(`   ❌ Erro ao criar: ${e.message}`);
      if (e.errors) e.errors.forEach(err => console.error('     ', JSON.stringify(err)));
      errors++;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ Substituídos: ${updated} | ❌ Erros: ${errors}`);
  console.log('Ad Strength será recalculado pelo Google em até 24h.');
  console.log('=== CONCLUÍDO ===\n');
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
