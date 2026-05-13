/**
 * Atualiza final_urls de todos os anúncios para as páginas específicas dos produtos
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

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

// Mapeamento: ad_group_id → URL do produto
const URL_MAP = {
  '192585173501': 'https://www.halogenn.com.br/produtos/HL100.006', // Álcool Etílico PA-ACS
  '192585173701': 'https://www.halogenn.com.br/produtos/HL100.024', // Xileno e Xilol PA
  '192585173661': 'https://www.halogenn.com.br/produtos/HL100.085', // Acetona PA-ACS
  '192585173741': 'https://www.halogenn.com.br/produtos/HL100.059', // Formaldeído PA
  '192585173901': 'https://www.halogenn.com.br/produtos/HL100.062', // Parafina Histológica
  '195305603163': 'https://www.halogenn.com.br/produtos/HL100.095', // Ácido Sulfúrico PA-ACS
  '195305603203': 'https://www.halogenn.com.br/produtos/HL100.105', // Ácido Clorídrico PA-ACS
  '195305603243': 'https://www.halogenn.com.br/produtos/HL100.117', // Álcool Metílico PA-ACS
  '195305603403': 'https://www.halogenn.com.br/produtos/HL100.134', // Acetato de Etila PA
  '195305603443': 'https://www.halogenn.com.br/produtos/HL100.136', // Éter de Petróleo PA
};

async function main() {
  console.log('=== ATUALIZAÇÃO DE FINAL URLs ===\n');

  const ads = await customer.query(`
    SELECT ad_group_ad.ad.resource_name, ad_group_ad.ad.final_urls,
           ad_group.id, ad_group.name, campaign.name
    FROM ad_group_ad
    WHERE campaign.id IN (23769809419, 23769809422)
      AND ad_group_ad.status != REMOVED
  `);

  console.log(`Total de anúncios encontrados: ${ads.length}\n`);

  const updates = [];

  for (const a of ads) {
    const agId   = String(a.ad_group.id);
    const url    = URL_MAP[agId];
    const adRN   = a.ad_group_ad.ad.resource_name;
    const curUrl = (a.ad_group_ad.ad.final_urls || [])[0];

    if (!url) {
      console.log(`  ⚠️  Sem URL mapeada para AG "${a.ad_group.name}" — pulando`);
      continue;
    }
    if (curUrl === url) {
      console.log(`  ✔  Já correto: "${a.ad_group.name}"`);
      continue;
    }

    console.log(`  → "${a.ad_group.name}"`);
    console.log(`     de:   ${curUrl || '(vazio)'}`);
    console.log(`     para: ${url}`);
    updates.push({ resource_name: adRN, final_urls: [url] });
  }

  if (updates.length === 0) {
    console.log('\nNenhum anúncio precisou de atualização.');
    return;
  }

  console.log(`\nAtualizando ${updates.length} anúncio(s)...`);
  await customer.ads.update(updates);
  console.log(`\n✅ ${updates.length} anúncio(s) atualizados com sucesso.`);
  console.log('\n=== CONCLUÍDO ===');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
