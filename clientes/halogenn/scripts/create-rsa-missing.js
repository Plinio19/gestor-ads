require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleAdsApi, enums } = require('google-ads-api');

const client = new GoogleAdsApi({
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  developer_token: process.env.DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: process.env.CUSTOMER_ID,
  refresh_token: process.env.REFRESH_TOKEN,
  login_customer_id: '6017081450',
});

const BASE_URL = 'https://www.halogenn.com.br';

// H = headline (max 30 chars), D = description (max 90 chars)
function H(t) {
  if (t.length > 30) throw new Error(`Headline too long (${t.length}): "${t}"`);
  return { text: t };
}
function D(t) {
  if (t.length > 90) throw new Error(`Description too long (${t.length}): "${t}"`);
  return { text: t };
}

function rsa(adGroupResourceName, headlines, descriptions) {
  return {
    ad_group: adGroupResourceName,
    status: enums.AdGroupAdStatus.ENABLED,
    ad: {
      final_urls: [BASE_URL],
      responsive_search_ad: {
        headlines: headlines.map(H),
        descriptions: descriptions.map(D),
      }
    }
  };
}

// Ad Groups — Produtos Secundários
const agAcSulf  = 'customers/7877031919/adGroups/195305603163';
const agAcClor  = 'customers/7877031919/adGroups/195305603203';
const agMetil   = 'customers/7877031919/adGroups/195305603243';
const agAcetato = 'customers/7877031919/adGroups/195305603403';
const agEter    = 'customers/7877031919/adGroups/195305603443';

// Ad Groups — Nichos Específicos
const agAnatom  = 'customers/7877031919/adGroups/195305604883';
const agAgua    = 'customers/7877031919/adGroups/195305604923';
const agFarma   = 'customers/7877031919/adGroups/195305605083';
const agCQ      = 'customers/7877031919/adGroups/195305605123';
const agUniv    = 'customers/7877031919/adGroups/195305605163';

const ads = [
  // ---- PRODUTOS SECUNDÁRIOS ----

  rsa(agAcSulf, [
    'Acido Sulfurico PA-ACS',          // 22
    'H2SO4 Grau Analitico Laudo',      // 26
    'Reagente Analitico Halogenn',     // 27
    'Fabricante Nacional Halogenn',    // 28
    'Solicite Cotacao Agora',          // 22
    'Entrega Rapida Todo Brasil',      // 26
    'Acido Sulfurico p/ Lab',          // 22
    'Reagente PA-ACS Certificado',     // 27
    'Fornecedor Fiocruz e USP',        // 24
    'Acido Sulfurico PA c/ NF',        // 24
  ], [
    'Acido sulfurico PA-ACS com laudo. Fabricante nacional. Cotacao rapida.',      // 70
    'Reagentes PA-ACS para lab. Acido sulfurico certificado. Entrega Brasil.',     // 72
    'Fornecedor Fiocruz, USP e Petrobras. H2SO4 PA com laudo. Sem burocracia.',   // 73
    'Acido sulfurico PA-ACS p/ titracao e CQ. Laudo incluso. Orcamento ja.',      // 72
  ]),

  rsa(agAcClor, [
    'Acido Cloridrico PA-ACS',         // 23
    'HCl 37 Analitico c/ Laudo',       // 25
    'HCl PA-ACS Certificado',          // 22
    'Fabricante Nacional Halogenn',    // 28
    'Solicite Cotacao Agora',          // 22
    'Acido Cloridrico Lab PA',         // 23
    'Entrega Rapida Todo Brasil',      // 26
    'Fornecedor Fiocruz e USP',        // 24
    'HCl PA sem Importacao',           // 21
    'Reagente Analitico Halogenn',     // 27
  ], [
    'HCl 37 PA-ACS com laudo. Fabricante nacional. Solicite cotacao agora.',       // 71
    'HCl PA-ACS para titracao e analise. Certificado incluso. Entrega Brasil.',    // 73
    'Fornecedor Fiocruz e USP. Acido cloridrico PA sem burocracia. Orcamento.',    // 73
    'Reagentes acidos PA-ACS para lab. Certificados disponiveis. Via WhatsApp.',   // 73
  ]),

  rsa(agMetil, [
    'Alcool Metilico PA-ACS',          // 22
    'Metanol Grau Analitico Laudo',    // 28
    'Metanol HPLC Halogenn',           // 21
    'Fabricante Nacional Halogenn',    // 28
    'Solicite Cotacao Agora',          // 22
    'Metanol PA-ACS Certificado',      // 26
    'Metanol para HPLC Extracao',      // 26
    'Entrega Rapida Todo Brasil',      // 26
    'Fornecedor Fiocruz e USP',        // 24
    'Alcool Metilico PA Nacional',     // 27
  ], [
    'Metanol PA-ACS com laudo. Ideal para HPLC e extracao. Solicite cotacao.',     // 72
    'Alcool metilico PA-ACS para lab. Fabricante nacional. Sem burocracia.',       // 71
    'Metanol PA-ACS para HPLC e sintese. Certificado incluso. Entrega Brasil.',    // 73
    'Fornecedor Fiocruz e USP. Metanol grau analitico PA-ACS com laudo.',          // 67
  ]),

  rsa(agAcetato, [
    'Acetato de Etila PA',             // 19
    'AcOEt Grau Analitico Laudo',      // 26
    'Reagente PA Laboratorio',         // 23
    'Fabricante Nacional Halogenn',    // 28
    'Solicite Cotacao Agora',          // 22
    'Acetato Etila PA Certificado',    // 28
    'Solvente PA Cromatografia',       // 25
    'Entrega Rapida Todo Brasil',      // 26
    'Fornecedor Fiocruz e USP',        // 24
    'Acetato Etila PA Analitico',      // 26
  ], [
    'Acetato de etila PA com laudo. Para extracao e cromatografia. Cotacao.',      // 71
    'Fabricante nacional de reagentes PA. Acetato etila certificado. Brasil.',     // 71
    'Acetato etila PA para extracao e sintese. Laudo incluso. Solicite ja.',       // 70
    'Fornecedor Fiocruz e USP. Acetato de etila PA grau analitico certificado.',   // 73
  ]),

  rsa(agEter, [
    'Eter de Petroleo PA',             // 19
    'Eter 30-60 Grau Analitico',       // 25
    'Eter Etilico PA Halogenn',        // 24
    'Fabricante Nacional Halogenn',    // 28
    'Solicite Cotacao Agora',          // 22
    'Solvente PA Extracao Lab',        // 24
    'Eter PA Laudo Analitico',         // 23
    'Entrega Rapida Todo Brasil',      // 26
    'Fornecedor Fiocruz e USP',        // 24
    'Eter de Petroleo PA Cert.',       // 25
  ], [
    'Eter de petroleo 30-60 PA com laudo. Para extracao de gorduras e cromatog.',  // 73
    'Eter etilico PA para lab. Fabricante nacional. Sem importacao. Cotacao.',     // 72
    'Solventes eter grau analitico PA com certificado. Entrega todo o Brasil.',    // 72
    'Fornecedor Fiocruz e USP. Eter de petroleo PA e eter etilico PA.',            // 65
  ]),

  // ---- NICHOS ESPECÍFICOS ----

  rsa(agAnatom, [
    'Reagentes Anatomia Patolog.',     // 27
    'Formol e Parafina PA Halogenn',   // 30
    'Xileno PA para Histologia',       // 25
    'Fabricante Nacional Halogenn',    // 28
    'Solicite Cotacao Agora',          // 22
    'Reagentes Histologia Laudo',      // 26
    'Kit Histologia PA Cert.',         // 22
    'Entrega Rapida Todo Brasil',      // 26
    'Fornecedor Fiocruz Butantan',     // 27
    'Reagentes Patologia PA Puro',     // 27
  ], [
    'Formol, xileno e parafina PA para anatomia patologica. Laudos incluso.',      // 71
    'Reagentes PA para histologia e patologia. Fornecedor Fiocruz e Butantan.',    // 73
    'Kit anat. patologica: formol PA, xileno PA, parafina histologica. Cotacao.',  // 73
    'Reagentes analiticos certificados p/ lab de patologia. Entrega rapida.',      // 70
  ]),

  rsa(agAgua, [
    'Reagentes PA Analise Agua',       // 25
    'Reagentes Grau Analitico Lab',    // 28
    'Reagentes Controle Qualidade',    // 28
    'Fabricante Nacional Halogenn',    // 28
    'Solicite Cotacao Agora',          // 22
    'Reagentes PA Lab de Agua',        // 24
    'Reagentes com Laudo Cert.',       // 25
    'Entrega Rapida Todo Brasil',      // 26
    'Fornecedor Fiocruz e USP',        // 24
    'Reagentes PA sem Importacao',     // 27
  ], [
    'Reagentes grau analitico PA para analise de agua. Laudo incluso. Cotacao.',   // 73
    'Fabricante nacional de reagentes PA para controle de qualidade de agua.',     // 71
    'Reagentes analiticos certificados para analise fisico-quimica de agua.',      // 70
    'Fornecedor Fiocruz e Embrapa. Reagentes PA para analise de agua.',            // 64
  ]),

  rsa(agFarma, [
    'Solventes HPLC Analitico',        // 24
    'Metanol HPLC Halogenn',           // 21
    'Reagentes Farmaceuticos PA',      // 26
    'Fabricante Nacional Halogenn',    // 28
    'Solicite Cotacao Agora',          // 22
    'Reagentes HPLC Certificado',      // 26
    'Solventes HPLC Nacional',         // 23
    'Entrega Rapida Todo Brasil',      // 26
    'Fornecedor Fiocruz e USP',        // 24
    'Reagentes PA-ACS Farma',          // 22
  ], [
    'Solventes HPLC PA-ACS com laudo. Para lab farmaceutico. Cotacao rapida.',     // 72
    'Reagentes para industria farmaceutica. Fabricante nacional. Sem burocracia.', // 74
    'Metanol e solventes HPLC PA-ACS certificados. Entrega rapida no Brasil.',     // 72
    'Fornecedor Fiocruz e USP. Reagentes farmaceuticos PA-ACS com laudo.',         // 67
  ]),

  rsa(agCQ, [
    'Reagentes PA Controle Qual.',     // 27
    'Reagentes Analiticos Laudo',      // 26
    'Fornecedor Certificado CQ',       // 25
    'Fabricante Nacional Halogenn',    // 28
    'Solicite Cotacao Agora',          // 22
    'Reagentes PA-ACS Lab CQ',         // 22
    'Reagentes Laudo Auditavel',       // 25
    'Entrega Rapida Todo Brasil',      // 26
    'Fornecedor Petrobras e USP',      // 26
    'Reagentes PA Homologados',        // 24
  ], [
    'Reagentes PA e PA-ACS para controle de qualidade. Laudo incluso.',            // 65
    'Fabricante nacional de reagentes PA para lab CQ. Certificados auditaveis.',   // 73
    'Reagentes com laudo para auditorias. Fornecedor de Petrobras e USP.',         // 67
    'Reagentes PA-ACS para controle de qualidade. Sem importacao.',                // 60
  ]),

  rsa(agUniv, [
    'Reagentes PA Pesquisa',           // 21
    'Reagentes Analiticos PA',         // 23
    'Solventes PA Universidade',       // 25
    'Fabricante Nacional Halogenn',    // 28
    'Solicite Cotacao Agora',          // 22
    'Reagentes PA Lab USP',            // 20
    'Reagentes PA Laudo Incluso',      // 26
    'Entrega Rapida Todo Brasil',      // 26
    'Fornecedor USP UNICAMP UFRJ',     // 27
    'Reagentes PA Cientificos',        // 24
  ], [
    'Reagentes PA para laboratorios de pesquisa e universidades. Laudo incluso.',  // 74
    'Fabricante nacional de reagentes PA. Fornecedor USP, Fiocruz e UFRJ.',        // 69
    'Alcool, acetona e solventes PA para pesquisa. Certificados. Entrega Brasil.', // 75
    'Reagentes analiticos para pesquisa. Sem burocracia de importacao.',           // 65
  ]),
];

(async () => {
  console.log(`Criando ${ads.length} RSAs...`);
  const result = await customer.adGroupAds.create(ads);
  console.log('\n=== RESULTADO ===');
  result.results.forEach((r, i) => {
    console.log(`${i+1}. ${r.resource_name}`);
  });
  console.log(`\n✅ ${result.results.length} RSAs criados com sucesso!`);
})().catch(e => {
  console.error('ERRO:', e.message);
  if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
  process.exit(1);
});
