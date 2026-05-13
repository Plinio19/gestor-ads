require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const client = new GoogleAdsApi({
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  developer_token: process.env.DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: process.env.CUSTOMER_ID,
  login_customer_id: '6017081450', // MCC
  refresh_token: process.env.REFRESH_TOKEN,
});

const keywords = [
  // Álcool
  'álcool etílico PA',
  'álcool etílico PA-ACS',
  'etanol grau analítico',
  'álcool etílico absoluto PA',
  'etanol PA laboratório',
  'álcool anidro PA',
  // Acetona
  'acetona PA',
  'acetona grau analítico',
  'acetona PA-ACS laboratório',
  'acetona para laboratório',
  // Xileno
  'xileno PA histologia',
  'xilol grau analítico',
  'xileno para histologia',
  'xilol especial histologia',
  'xileno PA laboratório',
  // Formaldeído
  'formol PA laboratório',
  'formaldeído PA anatomia patológica',
  'formalina grau analítico',
  'formol histológico',
  'formaldeído 37% PA',
  // Parafina
  'parafina histológica',
  'parafina para histologia',
  'parafina anatomia patológica',
  'parafina laboratorial',
  // Gerais
  'reagentes analíticos fornecedor',
  'reagentes PA-ACS',
  'reagentes para laboratório PA',
  'comprar reagentes analíticos',
];

async function runKeywordPlanner() {
  console.log('=== KEYWORD PLANNER — Halogenn Química ===\n');
  console.log('Consultando Google Ads Keyword Planner API...\n');

  try {
    const results = await customer.keywordPlanIdeas.generateKeywordIdeas({
      language: 'languageConstants/1014', // Português
      geo_target_constants: ['geoTargetConstants/2076'], // Brasil
      keyword_seed: { keywords },
      include_adult_keywords: false,
    });

    const sorted = results
      .filter(r => r.keyword_idea_metrics?.avg_monthly_searches > 0)
      .sort((a, b) =>
        (b.keyword_idea_metrics?.avg_monthly_searches || 0) -
        (a.keyword_idea_metrics?.avg_monthly_searches || 0)
      );

    console.log(`${'KEYWORD'.padEnd(45)} ${'VOL/MÊS'.padStart(10)} ${'COMP'.padStart(8)} ${'CPC EST'.padStart(10)}`);
    console.log('-'.repeat(75));

    for (const r of sorted) {
      const kw = r.text || '';
      const vol = r.keyword_idea_metrics?.avg_monthly_searches || 0;
      const comp = r.keyword_idea_metrics?.competition || 'N/A';
      const cpcLow = ((r.keyword_idea_metrics?.low_top_of_page_bid_micros || 0) / 1e6).toFixed(2);
      const cpcHigh = ((r.keyword_idea_metrics?.high_top_of_page_bid_micros || 0) / 1e6).toFixed(2);
      console.log(
        `${kw.padEnd(45)} ${String(vol).padStart(10)} ${String(comp).padStart(8)} R$${cpcLow}-${cpcHigh}`
      );
    }

    console.log(`\nTotal de keywords analisadas: ${sorted.length}`);
  } catch (err) {
    console.error('Erro:', err.message || JSON.stringify(err, null, 2));
  }
}

runKeywordPlanner();
