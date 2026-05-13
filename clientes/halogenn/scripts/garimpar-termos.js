require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
const path = require('path');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

// Já adicionados como negativos em 22/04 — não recomendar novamente
const JA_NEGATIVADOS = new Set([
  'o que é xilol', 'o xilol', 'o xilene', 'o xileno',
  'densidade ácido clorídrico 37', 'álcool etílico absoluto estéril 10ml', 'sigma'
]);

// Já adicionados como keywords positivas em 22/04
const JA_ADICIONADOS = new Set([
  'etanol pa', 'etanol p.a', 'hcl pa', 'hcl 37', 'metanol pa', 'metanol p.a', 'xileno'
]);

// Sinais de negativar
const NEGATIVAR_CONTÉM = [
  'industrial', 'barato', 'mais barato', 'preço baixo', 'econômico', 'desconto',
  'promoção', 'oferta', 'tonelada', 'container', 'granel', '1000 litros', '5000',
  'uso doméstico', 'para casa', 'uso pessoal', '500ml', 'uso próprio',
  'êxodo', 'exodo', 'neon comercial', 'acs científica', 'sinfe', 'sigma aldrich',
  'importado', 'china', 'exterior', 'download', 'curso', 'apostila', 'receita',
  'distribuidor', 'revenda', 'representante', 'fórmula caseira',
  'caminhão', 'caminhão tanque', 'atacado', 'frete grátis'
];

// Sinais de adicionar
const ADICIONAR_CONTÉM = [
  'pa-acs', 'pa acs', 'p.a.-acs', 'grau analítico', 'grau analitico',
  'laboratório', 'laboratorio', 'lab ', ' lab', 'laboratorial',
  'controle de qualidade', 'análise', 'analise', 'analítico', 'analitico',
  'certificado', 'laudo', 'certificação', 'certificacao',
  'hplc', 'pa-cs', ' pa ', ' pa,', ' pa.', ',pa', 'p.a.'
];

function classificar(termo, ctr, clicks, conversions) {
  const t = termo.toLowerCase();

  // Já tratado
  if (JA_NEGATIVADOS.has(t)) return { rec: 'JÁ NEGATIVADO', motivo: 'Adicionado em 22/04' };
  if (JA_ADICIONADOS.has(t)) return { rec: 'JÁ ADICIONADO', motivo: 'Keyword adicionada em 22/04' };

  // Negativar
  for (const sinal of NEGATIVAR_CONTÉM) {
    if (t.includes(sinal)) return { rec: '❌ NEGATIVAR', motivo: `Contém "${sinal}"` };
  }

  // Adicionar
  for (const sinal of ADICIONAR_CONTÉM) {
    if (t.includes(sinal)) return { rec: '✅ ADICIONAR', motivo: `Sinal positivo: "${sinal.trim()}"` };
  }

  // CTR alto e cliques = boa intenção
  if (ctr > 0.05 && clicks >= 2) return { rec: '✅ ADICIONAR', motivo: `CTR ${(ctr*100).toFixed(0)}% alto — público qualificado` };

  // Zero cliques em muitas impressões = ruído
  if (clicks === 0 && conversions === 0) return { rec: '⚠️ MONITORAR', motivo: 'Sem cliques ainda — aguardar mais dados' };

  return { rec: '⚠️ MONITORAR', motivo: 'Ambíguo — avaliar manualmente' };
}

async function garimpar() {
  console.log('\n=== GARIMPO DE TERMOS DE BUSCA — Todo o período ===\n');
  console.log(`Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

  const rows = await customer.query(`
    SELECT
      campaign.name,
      ad_group.name,
      search_term_view.search_term,
      search_term_view.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr
    FROM search_term_view
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY metrics.impressions DESC
  `);

  if (!rows.length) {
    console.log('Nenhum termo de busca encontrado.\n');
    return;
  }

  const MATCH = { 2: 'EXACT', 3: 'PHRASE', 4: 'BROAD' };
  const STATUS_MAP = { 2: 'ADDED', 3: 'EXCLUDED', 4: 'NONE' };

  const resultados = [];
  const porRecomendacao = { '✅ ADICIONAR': [], '❌ NEGATIVAR': [], '⚠️ MONITORAR': [], 'JÁ NEGATIVADO': [], 'JÁ ADICIONADO': [] };

  for (const r of rows) {
    const termo = r.search_term_view.search_term;
    const impr = r.metrics.impressions;
    const clicks = r.metrics.clicks;
    const custo = (r.metrics.cost_micros / 1_000_000).toFixed(2);
    const ctr = r.metrics.ctr;
    const conv = r.metrics.conversions;
    const status = STATUS_MAP[r.search_term_view.status] ?? r.search_term_view.status;
    const match = MATCH[r.ad_group_criterion?.keyword?.match_type] ?? '?';
    const { rec, motivo } = classificar(termo, ctr, clicks, conv);

    const entrada = { termo, campanha: r.campaign.name, adGroup: r.ad_group.name, impr, clicks, custo, ctr: (ctr*100).toFixed(2)+'%', conv, status, rec, motivo };
    resultados.push(entrada);
    if (porRecomendacao[rec]) porRecomendacao[rec].push(entrada);
    else porRecomendacao['⚠️ MONITORAR'].push(entrada);
  }

  // Imprimir por categoria
  for (const [rec, lista] of Object.entries(porRecomendacao)) {
    if (!lista.length || rec === 'JÁ NEGATIVADO' || rec === 'JÁ ADICIONADO') continue;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`${rec} (${lista.length} termos)`);
    console.log('='.repeat(70));

    for (const e of lista) {
      console.log(`\n  Termo: "${e.termo}"`);
      console.log(`  Motivo: ${e.motivo}`);
      console.log(`  Campanha: ${e.campanha} → ${e.adGroup}`);
      console.log(`  Status no Google: ${e.status}`);
      console.log(`  Impr: ${e.impr} | Clicks: ${e.clicks} | CTR: ${e.ctr} | Custo: R$${e.custo} | Conv: ${e.conv}`);
    }
  }

  // Já tratados
  const jaNeg = porRecomendacao['JÁ NEGATIVADO'];
  const jaAdd = porRecomendacao['JÁ ADICIONADO'];
  if (jaNeg.length || jaAdd.length) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`ℹ️ JÁ TRATADOS ANTERIORMENTE (22/04) — ${jaNeg.length + jaAdd.length} termos`);
    console.log('='.repeat(70));
    for (const e of [...jaNeg, ...jaAdd]) {
      console.log(`  ${e.rec}: "${e.termo}" | Impr: ${e.impr} | Clicks: ${e.clicks}`);
    }
  }

  // Salvar CSV
  const csvPath = path.join(__dirname, `../logs/search-terms-${new Date().toISOString().split('T')[0]}.csv`);
  const linhas = resultados.map(e =>
    `"${e.termo}","${e.campanha}","${e.adGroup}",${e.impr},${e.clicks},${e.custo},${e.ctr},${e.conv},"${e.status}","${e.rec}","${e.motivo}"`
  ).join('\n');
  const header = 'termo,campanha,ad_group,impr,clicks,custo,ctr,conv,status,recomendacao,motivo\n';
  fs.writeFileSync(csvPath, header + linhas, 'utf8');

  console.log(`\n${'='.repeat(70)}`);
  console.log(`\n📊 RESUMO:`);
  console.log(`  Total de termos: ${resultados.length}`);
  console.log(`  ✅ Para ADICIONAR: ${porRecomendacao['✅ ADICIONAR'].length}`);
  console.log(`  ❌ Para NEGATIVAR: ${porRecomendacao['❌ NEGATIVAR'].length}`);
  console.log(`  ⚠️  Para MONITORAR: ${porRecomendacao['⚠️ MONITORAR'].length}`);
  console.log(`  ℹ️  Já tratados: ${jaNeg.length + jaAdd.length}`);
  console.log(`\n  CSV salvo em: ${csvPath}\n`);
}

garimpar().catch(e => { console.error('Erro:', e.message || e); process.exit(1); });
