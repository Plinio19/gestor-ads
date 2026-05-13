require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

const STATUS = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'ENABLED', 3: 'PAUSED', 4: 'REMOVED' };
const TIPO = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'SEARCH', 3: 'DISPLAY', 4: 'SHOPPING', 5: 'HOTEL', 6: 'VIDEO', 7: 'MULTI_CHANNEL', 8: 'LOCAL', 9: 'SMART', 10: 'PERFORMANCE_MAX', 11: 'LOCAL_SERVICES', 12: 'DISCOVERY', 13: 'TRAVEL', 14: 'DEMAND_GEN' };
const MATCH = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'EXACT', 3: 'PHRASE', 4: 'BROAD' };
const AD_TYPE = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'TEXT', 3: 'EXPANDED_TEXT', 13: 'RESPONSIVE_SEARCH' };

async function audit() {
  const report = { geradoEm: new Date().toISOString(), conta: CUSTOMER_ID, campanhas: [] };

  // 1. Campanhas
  console.log('Buscando campanhas...');
  const campanhas = await customer.query(`
    SELECT
      campaign.id, campaign.name, campaign.status,
      campaign.advertising_channel_type,
      campaign.bidding_strategy_type,
      campaign_budget.amount_micros,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.ctr, metrics.average_cpc, metrics.conversions,
      metrics.cost_per_conversion
    FROM campaign
    ORDER BY campaign.name ASC
  `);

  console.log(`  ${campanhas.length} campanhas encontradas.`);

  for (const row of campanhas) {
    const c = row.campaign;
    const m = row.metrics;
    const budget = row.campaign_budget;

    const campanha = {
      id: c.id,
      nome: c.name,
      status: STATUS[c.status] ?? c.status,
      tipo: TIPO[c.advertising_channel_type] ?? c.advertising_channel_type,
      estrategiaLance: c.bidding_strategy_type,
      orcamentoDiario: budget?.amount_micros ? (budget.amount_micros / 1_000_000).toFixed(2) : 'N/A',
      metricas: {
        impressoes: m.impressions,
        cliques: m.clicks,
        custo: (m.cost_micros / 1_000_000).toFixed(2),
        ctr: m.ctr ? (m.ctr * 100).toFixed(2) + '%' : '0%',
        cpcMedio: m.average_cpc ? 'R$ ' + (m.average_cpc / 1_000_000).toFixed(2) : 'R$ 0,00',
        conversoes: m.conversions,
        custoPorConversao: m.cost_per_conversion ? 'R$ ' + (m.cost_per_conversion / 1_000_000).toFixed(2) : 'N/A',
      },
      gruposDeAnuncio: [],
    };

    // 2. Grupos de anúncio
    const grupos = await customer.query(`
      SELECT
        ad_group.id, ad_group.name, ad_group.status,
        ad_group.type,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.ctr, metrics.average_cpc, metrics.conversions
      FROM ad_group
      WHERE campaign.id = ${c.id}
      ORDER BY ad_group.name ASC
    `);

    for (const gr of grupos) {
      const g = gr.ad_group;
      const gm = gr.metrics;

      const grupo = {
        id: g.id,
        nome: g.name,
        status: STATUS[g.status] ?? g.status,
        metricas: {
          impressoes: gm.impressions,
          cliques: gm.clicks,
          custo: (gm.cost_micros / 1_000_000).toFixed(2),
          ctr: gm.ctr ? (gm.ctr * 100).toFixed(2) + '%' : '0%',
          cpcMedio: gm.average_cpc ? 'R$ ' + (gm.average_cpc / 1_000_000).toFixed(2) : 'R$ 0,00',
          conversoes: gm.conversions,
        },
        palavrasChave: [],
        anuncios: [],
      };

      // 3. Palavras-chave
      if (c.advertising_channel_type !== 10) { // não é Performance Max
        const keywords = await customer.query(`
          SELECT
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            ad_group_criterion.status,
            ad_group_criterion.quality_info.quality_score
          FROM ad_group_criterion
          WHERE campaign.id = ${c.id}
            AND ad_group.id = ${g.id}
            AND ad_group_criterion.type = KEYWORD
        `);

        for (const krow of keywords) {
          const kw = krow.ad_group_criterion;
          grupo.palavrasChave.push({
            texto: kw.keyword?.text,
            matchType: MATCH[kw.keyword?.match_type] ?? kw.keyword?.match_type,
            status: STATUS[kw.status] ?? kw.status,
            qualityScore: kw.quality_info?.quality_score ?? 'N/A',
          });
        }

        // 4. Anúncios
        const ads = await customer.query(`
          SELECT
            ad_group_ad.ad.id,
            ad_group_ad.ad.type,
            ad_group_ad.status,
            ad_group_ad.ad.final_urls,
            ad_group_ad.ad.responsive_search_ad.headlines,
            ad_group_ad.ad.responsive_search_ad.descriptions,
            ad_group_ad.ad.expanded_text_ad.headline_part1,
            ad_group_ad.ad.expanded_text_ad.headline_part2,
            ad_group_ad.ad.expanded_text_ad.headline_part3,
            ad_group_ad.ad.expanded_text_ad.description,
            ad_group_ad.ad.expanded_text_ad.description2,
            metrics.impressions, metrics.clicks, metrics.ctr
          FROM ad_group_ad
          WHERE campaign.id = ${c.id}
            AND ad_group.id = ${g.id}
          ORDER BY metrics.clicks DESC
        `);

        for (const arow of ads) {
          const ad = arow.ad_group_ad.ad;
          const am = arow.metrics;
          const tipo_ad = AD_TYPE[ad.type] ?? ad.type;

          let conteudo = {};
          if (ad.responsive_search_ad) {
            conteudo = {
              titulos: ad.responsive_search_ad.headlines?.map(h => h.text) ?? [],
              descricoes: ad.responsive_search_ad.descriptions?.map(d => d.text) ?? [],
            };
          } else if (ad.expanded_text_ad) {
            conteudo = {
              titulo1: ad.expanded_text_ad.headline_part1,
              titulo2: ad.expanded_text_ad.headline_part2,
              titulo3: ad.expanded_text_ad.headline_part3,
              descricao1: ad.expanded_text_ad.description,
              descricao2: ad.expanded_text_ad.description2,
            };
          }

          grupo.anuncios.push({
            id: ad.id,
            tipo: tipo_ad,
            status: STATUS[arow.ad_group_ad.status] ?? arow.ad_group_ad.status,
            finalUrls: ad.final_urls,
            conteudo,
            metricas: {
              impressoes: am.impressions,
              cliques: am.clicks,
              ctr: am.ctr ? (am.ctr * 100).toFixed(2) + '%' : '0%',
            },
          });
        }
      }

      campanha.gruposDeAnuncio.push(grupo);
    }

    report.campanhas.push(campanha);
    process.stdout.write(`  ✓ ${c.name}\n`);
  }

  // 5. Salvar relatório
  const filename = `audit-${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\nRelatório salvo em: ${filename}`);

  return report;
}

audit().catch(err => {
  console.error('Erro na auditoria:', err.message || err);
  process.exit(1);
});
