require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const client = new GoogleAdsApi({
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  developer_token: process.env.DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: process.env.CUSTOMER_ID,
  login_customer_id: '6017081450',
  refresh_token: process.env.REFRESH_TOKEN,
});

const NEGATIVES = [
  'industrial', 'grau industrial', 'uso industrial', 'solvente industrial',
  'barato', 'mais barato', 'preço baixo', 'econômico', 'desconto', 'promoção',
  'tonelada', 'container', 'granel', '1000 litros', '5000 litros', 'big bag',
  'uso doméstico', 'para casa', 'uso pessoal', 'pequena quantidade', 'uso próprio',
  'importado', 'china', 'exterior', 'download', 'curso', 'fórmula caseira',
  'distribuidor', 'revenda', 'representante',
  'êxodo científica', 'neon comercial', 'acs científica', 'sinfe', 'exel científica',
];

async function createCampaigns() {
  console.log('=== CRIANDO CAMPANHAS — Halogenn Química ===\n');
  console.log('✅ 1-5 já concluídos (campanhas, grupos, negativos, dispositivos existem)');

  // Resource names já existentes na conta
  const agAlcool  = 'customers/7877031919/adGroups/192585173501';
  const agAcetona = 'customers/7877031919/adGroups/192585173661';
  const agXileno  = 'customers/7877031919/adGroups/192585173701';
  const agFormol  = 'customers/7877031919/adGroups/192585173741';
  const agParafina= 'customers/7877031919/adGroups/192585173901';
  const agAcSulf  = 'customers/7877031919/adGroups/195305603163';
  const agAcClor  = 'customers/7877031919/adGroups/195305603203';
  const agMetil   = 'customers/7877031919/adGroups/195305603243';
  const agAcetato = 'customers/7877031919/adGroups/195305603403';
  const agEter    = 'customers/7877031919/adGroups/195305603443';
  const agAnatom  = 'customers/7877031919/adGroups/195305604883';
  const agAgua    = 'customers/7877031919/adGroups/195305604923';
  const agFarma   = 'customers/7877031919/adGroups/195305605083';
  const agCQ      = 'customers/7877031919/adGroups/195305605123';
  const agUniv    = 'customers/7877031919/adGroups/195305605163';
  const agMarca   = 'customers/7877031919/adGroups/192585175101';

  // ── 6. KEYWORDS ────────────────────────────────────────────────────
  console.log('6. Adicionando palavras-chave...');
  const P = enums.KeywordMatchType.PHRASE;
  const E = enums.KeywordMatchType.EXACT;
  const kw = (ag, text, type) => ({ ad_group: ag, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: type } });

  const keywords = [
    // Álcool
    kw(agAlcool, 'álcool etílico PA', P),
    kw(agAlcool, 'álcool etílico PA-ACS', E),
    kw(agAlcool, 'álcool etílico absoluto PA', P),
    kw(agAlcool, 'etanol grau analítico', P),
    kw(agAlcool, 'etanol anidro PA laboratório', P),
    kw(agAlcool, 'álcool etílico PA laboratório', P),
    // Acetona
    kw(agAcetona, 'acetona PA laboratório', P),
    kw(agAcetona, 'acetona PA-ACS', E),
    kw(agAcetona, 'acetona grau analítico', P),
    kw(agAcetona, 'acetona para laboratório PA', P),
    // Xileno
    kw(agXileno, 'xileno PA histologia', P),
    kw(agXileno, 'xilol grau analítico', E),
    kw(agXileno, 'xilol especial histologia', P),
    kw(agXileno, 'xileno para anatomia patológica', P),
    kw(agXileno, 'xileno PA laboratório', P),
    // Formaldeído
    kw(agFormol, 'formol PA laboratório', P),
    kw(agFormol, 'formaldeído PA anatomia patológica', E),
    kw(agFormol, 'formalina PA patologia', P),
    kw(agFormol, 'formaldeído 37 PA', P),
    kw(agFormol, 'formol histológico', P),
    // Parafina
    kw(agParafina, 'parafina histológica', P),
    kw(agParafina, 'parafina para histologia', E),
    kw(agParafina, 'parafina anatomia patológica', P),
    // Secundários
    kw(agAcSulf,  'ácido sulfúrico PA-ACS', P),
    kw(agAcSulf,  'ácido sulfúrico grau analítico', P),
    kw(agAcSulf,  'ácido sulfúrico PA laboratório', P),
    kw(agAcClor,  'ácido clorídrico PA-ACS', P),
    kw(agAcClor,  'ácido clorídrico 37 PA', P),
    kw(agAcClor,  'HCl grau analítico laboratório', P),
    kw(agMetil,   'álcool metílico PA-ACS', P),
    kw(agMetil,   'metanol grau analítico', P),
    kw(agMetil,   'metanol PA HPLC', P),
    kw(agAcetato, 'acetato de etila PA', P),
    kw(agAcetato, 'acetato de etila grau analítico', P),
    kw(agEter,    'éter de petróleo PA', P),
    kw(agEter,    'éter etílico PA laboratório', P),
    // Nichos
    kw(agAnatom,  'reagentes anatomia patológica', P),
    kw(agAnatom,  'reagentes histologia laboratório', P),
    kw(agAgua,    'reagentes análise de água laboratório', P),
    kw(agAgua,    'reagentes controle qualidade água', P),
    kw(agFarma,   'reagentes HPLC fornecedor nacional', P),
    kw(agFarma,   'solvente HPLC grau analítico', P),
    kw(agCQ,      'reagentes controle de qualidade PA', P),
    kw(agCQ,      'reagentes analíticos fornecedor nacional', P),
    kw(agUniv,    'reagentes para pesquisa laboratorial', P),
    kw(agUniv,    'reagentes PA universidade laboratório', P),
    // Marca
    kw(agMarca,   'halogenn', E),
    kw(agMarca,   'halogenn química', E),
    kw(agMarca,   'halogenn reagentes', P),
  ];

  await customer.adGroupCriteria.create(keywords);
  console.log(`   ✅ ${keywords.length} keywords criadas`);

  // ── 7. RSAs ────────────────────────────────────────────────────────
  console.log('7. Criando anúncios responsivos (RSA)...');
  const rsa = (agId, headlines, descriptions) => ({
    ad_group: agId,
    status: enums.AdGroupAdStatus.ENABLED,
    ad: {
      final_urls: ['https://www.halogenn.com.br'],
      responsive_search_ad: {
        headlines: headlines.map(text => ({ text })),
        descriptions: descriptions.map(text => ({ text })),
      },
    },
  });

  await customer.adGroupAds.create([
    rsa(agAlcool, [
      'Álcool Etílico PA-ACS Laudo',
      'Fabricante Nacional Reagentes',
      'Entrega Rápida Todo Brasil',
      'Solicite Cotação Agora',
      'Álcool Grau Analítico PA',
      'Fornecedor Fiocruz e USP',
      'Reagente PA-ACS Halogenn',
      'Álcool Etílico PA Laboratório',
      'Peça Cotação pelo WhatsApp',
      'Álcool PA-ACS Certificado',
    ], [
      'Álcool etílico PA-ACS com laudo de análise. Fabricante nacional. Atendemos Fiocruz e USP.',
      'Reagente grau analítico com certificado. Entrega rápida para todo Brasil. Sem importação.',
      'Álcool etílico absoluto PA-ACS. Laudo incluso. Compra mensal ou emergencial. Peça cotação.',
      'Fornecedor nacional de álcool etílico PA. Laudos e certificados para auditoria. Solicite.',
    ]),
    rsa(agAcetona, [
      'Acetona PA-ACS com Certificado',
      'Reagente Analítico Halogenn',
      'Peça Cotação pelo WhatsApp',
      'Acetona Grau Analítico PA',
      'Fabricante Nacional Reagentes',
      'Entrega Rápida Todo Brasil',
      'Fornecedor Fiocruz e USP',
      'Solicite Cotação Agora',
      'Acetona PA Laboratório',
      'Laudo Incluso no Pedido',
    ], [
      'Acetona grau PA-ACS para laboratório. Laudo incluso. Entrega para todo o Brasil.',
      'Acetona analítica PA-ACS com certificado de análise. Fabricante nacional Halogenn.',
      'Reagente acetona PA para laboratório químico e farmacêutico. Solicite cotação agora.',
      'Acetona PA-ACS com laudo. Fornecedor de Fiocruz, USP e Petrobras. Peça seu orçamento.',
    ]),
    rsa(agXileno, [
      'Xileno PA para Histologia',
      'Xilol Grau Analítico Laudo',
      'Fabricante Nacional Reagentes',
      'Xilol Especial Histologia',
      'Entrega Rápida Todo Brasil',
      'Solicite Cotação Agora',
      'Fornecedor Fiocruz e USP',
      'Xileno Anatomia Patológica',
      'Reagente PA-ACS Halogenn',
      'Peça Cotação pelo WhatsApp',
    ], [
      'Xileno grau analítico PA com certificado. Ideal para histologia e anatomia patológica.',
      'Xilol especial para histologia com laudo de análise. Fabricante nacional. Entrega rápida.',
      'Xileno PA 99,8% para laboratório de patologia. Certificado incluso. Solicite cotação.',
      'Fornecedor de xileno e xilol grau analítico. Atendemos hospitais, clínicas e laboratórios.',
    ]),
    rsa(agFormol, [
      'Formaldeído PA Halogenn',
      'Formol Grau Analítico Laudo',
      'Fabricante Nacional Reagentes',
      'Formalina PA Patologia',
      'Entrega Rápida Todo Brasil',
      'Solicite Cotação Agora',
      'Fornecedor Fiocruz e USP',
      'Formol PA Anatomia Patológica',
      'Reagente PA-ACS Certificado',
      'Peça Cotação pelo WhatsApp',
    ], [
      'Formaldeído grau PA para laboratório de anatomia patológica e controle de qualidade.',
      'Formol PA com laudo de análise. Fabricante nacional. Entrega para todo o Brasil.',
      'Formalina grau analítico 37% PA com certificado. Fornecedor de hospitais e laboratórios.',
      'Formaldeído PA para fixação de tecidos. Laudo incluso. Atendemos Fiocruz e Butantan.',
    ]),
    rsa(agParafina, [
      'Parafina Histológica Halogenn',
      'Para Laboratório de Patologia',
      'Solicite Cotação Agora',
      'Fabricante Nacional Reagentes',
      'Entrega Rápida Todo Brasil',
      'Fornecedor Fiocruz e USP',
      'Parafina Anatomia Patológica',
      'Reagente PA Certificado',
      'Peça Cotação pelo WhatsApp',
      'Laudo Incluso no Pedido',
    ], [
      'Parafina para laboratório de anatomia patológica. Qualidade analítica com laudo incluso.',
      'Parafina histológica com certificado. Fabricante nacional. Entrega rápida para o Brasil.',
      'Parafina para inclusão histológica. Fornecedor de hospitais e laboratórios. Peça cotação.',
      'Parafina histológica com laudo de análise. Atendemos Fiocruz, USP e Butantan.',
    ]),
    rsa(agMarca, [
      'Halogenn Química',
      'Reagentes Analíticos PA-ACS',
      'Fabricante Nacional Reagentes',
      'Site Oficial Halogenn',
      'Solicite Cotação Agora',
      'Entrega Rápida Todo Brasil',
      'Fornecedor Fiocruz e USP',
      'Laudos e Certificados PA',
    ], [
      'Site oficial da Halogenn Química. Reagentes analíticos PA e PA-ACS com laudo de análise.',
      'Halogenn — fabricante nacional de reagentes grau analítico. Fornecedor de Fiocruz e USP.',
    ]),
  ]);
  console.log('   ✅ 6 anúncios responsivos (RSA) criados');

  // ── RESUMO ─────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log('         SETUP CONCLUÍDO              ');
  console.log('══════════════════════════════════════\n');
  console.log('✅ 4 campanhas criadas (PAUSADAS)');
  console.log('   [Busca] - Produtos Prioritários  → R$ 30/dia');
  console.log('   [Busca] - Produtos Secundários   → R$ 10/dia');
  console.log('   [Busca] - Nichos Específicos     → R$ 13/dia');
  console.log('   [Busca] - Marca Halogenn         → R$ 3,30/dia');
  console.log('✅ 16 grupos de anúncios');
  console.log(`✅ ${keywords.length} keywords (Phrase + Exact match)`);
  console.log('✅ 6 anúncios responsivos (RSA)');
  console.log(`✅ ${NEGATIVES.length * 4} palavras negativas`);
  console.log('✅ Mobile -20% | Tablet -10%');
  console.log('\nPróximo passo: acesse o Google Ads e ative as campanhas.');
  console.log('Ou diga "ativar campanhas" para eu ativar pela API.');
}

createCampaigns().catch(err => {
  console.error('\n❌ Erro:', err.message || JSON.stringify(err, null, 2));
  process.exit(1);
});
