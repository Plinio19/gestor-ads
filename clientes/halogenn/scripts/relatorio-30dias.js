/**
 * Relatório 30 dias — Halogenn Química
 * Extrai: campanhas, ad groups, top keywords, top termos de busca, tendência semanal
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID, LOGIN_CUSTOMER_ID } = process.env;
const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN, login_customer_id: LOGIN_CUSTOMER_ID });

const START = '2026-04-07';
const END   = '2026-05-07';
const PERIOD = `${START} a ${END}`;

function fmt(micros) { return 'R$' + (micros / 1_000_000).toFixed(2); }
function pct(v) { return (v * 100).toFixed(2) + '%'; }

async function main() {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  RELATÓRIO 30 DIAS — HALOGENN QUÍMICA`);
  console.log(`  Período: ${PERIOD}`);
  console.log(`${'═'.repeat(80)}\n`);

  // ── 1. RESUMO GERAL ──────────────────────────────────────────────────────────
  const totalRows = await customer.query(`
    SELECT
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.ctr, metrics.average_cpc, metrics.conversions,
      metrics.cost_per_conversion, metrics.search_impression_share,
      metrics.search_budget_lost_impression_share
    FROM customer
    WHERE segments.date BETWEEN '${START}' AND '${END}'
  `);

  const t = totalRows[0]?.metrics ?? {};
  console.log('── 1. RESUMO GERAL DA CONTA ─────────────────────────────────────────────────');
  console.log(`  Impressões:          ${t.impressions ?? 0}`);
  console.log(`  Cliques:             ${t.clicks ?? 0}`);
  console.log(`  CTR:                 ${pct(t.ctr ?? 0)}`);
  console.log(`  CPC Médio:           ${fmt(t.average_cpc ?? 0)}`);
  console.log(`  Custo Total:         ${fmt(t.cost_micros ?? 0)}`);
  console.log(`  Conversões:          ${t.conversions ?? 0}`);
  console.log(`  CPL (custo/conv):    ${t.conversions > 0 ? fmt(t.cost_per_conversion ?? 0) : '-'}`);
  console.log(`  IS (share imp.):     ${pct(t.search_impression_share ?? 0)}`);
  console.log(`  IS perdido orçamento:${pct(t.search_budget_lost_impression_share ?? 0)}`);

  // ── 2. POR CAMPANHA ──────────────────────────────────────────────────────────
  const camps = await customer.query(`
    SELECT
      campaign.name, campaign.status,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.ctr, metrics.average_cpc, metrics.conversions,
      metrics.cost_per_conversion, metrics.search_impression_share
    FROM campaign
    WHERE segments.date BETWEEN '${START}' AND '${END}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
  `);

  console.log('\n── 2. PERFORMANCE POR CAMPANHA ──────────────────────────────────────────────');
  console.log('Campanha                          | Impr  | Cli | CTR%  | CPC    | Custo    | Conv | CPL      | IS%');
  console.log('─'.repeat(115));
  for (const r of camps) {
    const c = r.campaign; const m = r.metrics;
    if (m.impressions === 0 && m.clicks === 0) continue;
    const name = c.name.replace('[Busca] - ', '').padEnd(32);
    const impr = String(m.impressions).padStart(6);
    const cli  = String(m.clicks).padStart(4);
    const ctr  = pct(m.ctr).padStart(6);
    const cpc  = fmt(m.average_cpc).padStart(7);
    const cost = fmt(m.cost_micros).padStart(9);
    const conv = String(m.conversions).padStart(5);
    const cpl  = m.conversions > 0 ? fmt(m.cost_per_conversion).padStart(9) : '        -';
    const is   = pct(m.search_impression_share).padStart(5);
    console.log(`${name} | ${impr} | ${cli} | ${ctr} | ${cpc} | ${cost} | ${conv} | ${cpl} | ${is}`);
  }

  // ── 3. POR AD GROUP ──────────────────────────────────────────────────────────
  const ags = await customer.query(`
    SELECT
      ad_group.name, campaign.name,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.ctr, metrics.average_cpc, metrics.conversions
    FROM ad_group
    WHERE segments.date BETWEEN '${START}' AND '${END}'
      AND campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
      AND ad_group.status = 'ENABLED'
    ORDER BY metrics.cost_micros DESC
  `);

  console.log('\n── 3. PERFORMANCE POR AD GROUP (top 20 por custo) ───────────────────────────');
  console.log('AG                                | Camp        | Impr  | Cli | CTR%  | CPC    | Custo    | Conv');
  console.log('─'.repeat(110));
  let count = 0;
  for (const r of ags) {
    if (count++ >= 20) break;
    const ag   = r.ad_group.name.padEnd(32);
    const camp = r.campaign.name.replace('[Busca] - Produtos ', '').padEnd(12);
    const m = r.metrics;
    if (m.impressions === 0) continue;
    const impr = String(m.impressions).padStart(6);
    const cli  = String(m.clicks).padStart(4);
    const ctr  = pct(m.ctr).padStart(6);
    const cpc  = fmt(m.average_cpc).padStart(7);
    const cost = fmt(m.cost_micros).padStart(9);
    const conv = String(m.conversions).padStart(4);
    console.log(`${ag} | ${camp} | ${impr} | ${cli} | ${ctr} | ${cpc} | ${cost} | ${conv}`);
  }

  // ── 4. TOP 25 KEYWORDS (por custo) ───────────────────────────────────────────
  const kws = await customer.query(`
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group.name,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.ctr, metrics.average_cpc, metrics.conversions
    FROM keyword_view
    WHERE segments.date BETWEEN '${START}' AND '${END}'
      AND campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
      AND ad_group_criterion.status = 'ENABLED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 25
  `);

  console.log('\n── 4. TOP 25 KEYWORDS POR CUSTO ─────────────────────────────────────────────');
  console.log('Keyword                              | Tipo   | AG                     | Impr  | Cli | CTR%  | CPC    | Custo');
  console.log('─'.repeat(130));
  for (const r of kws) {
    const kw   = r.ad_group_criterion.keyword;
    const m    = r.metrics;
    if (m.impressions === 0) continue;
    const text = kw.text.padEnd(36);
    const tipo = (kw.match_type === 4 ? 'PHRASE' : kw.match_type === 2 ? 'BROAD' : 'EXACT').padEnd(7);
    const ag   = r.ad_group.name.padEnd(23);
    const impr = String(m.impressions).padStart(6);
    const cli  = String(m.clicks).padStart(4);
    const ctr  = pct(m.ctr).padStart(6);
    const cpc  = fmt(m.average_cpc).padStart(7);
    const cost = fmt(m.cost_micros).padStart(9);
    console.log(`${text} | ${tipo} | ${ag} | ${impr} | ${cli} | ${ctr} | ${cpc} | ${cost}`);
  }

  // ── 5. TOP 20 TERMOS DE BUSCA (por custo, com conversões destacadas) ─────────
  const terms = await customer.query(`
    SELECT
      search_term_view.search_term,
      campaign.name,
      ad_group.name,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.ctr, metrics.conversions
    FROM search_term_view
    WHERE segments.date BETWEEN '${START}' AND '${END}'
      AND campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
    ORDER BY metrics.cost_micros DESC
    LIMIT 20
  `);

  console.log('\n── 5. TOP 20 TERMOS DE BUSCA POR CUSTO ──────────────────────────────────────');
  console.log('Termo                                    | AG                     | Impr  | Cli | CTR%  | Custo    | Conv');
  console.log('─'.repeat(118));
  for (const r of terms) {
    const m    = r.metrics;
    const term = r.search_term_view.search_term.padEnd(40);
    const ag   = r.ad_group.name.padEnd(23);
    const impr = String(m.impressions).padStart(6);
    const cli  = String(m.clicks).padStart(4);
    const ctr  = pct(m.ctr).padStart(6);
    const cost = fmt(m.cost_micros).padStart(9);
    const conv = m.conversions > 0 ? `  ✅ ${m.conversions}` : '     0';
    console.log(`${term} | ${ag} | ${impr} | ${cli} | ${ctr} | ${cost} | ${conv}`);
  }

  // ── 6. TERMOS COM CONVERSÃO (período completo) ───────────────────────────────
  const convTerms = await customer.query(`
    SELECT
      search_term_view.search_term,
      ad_group.name,
      campaign.name,
      metrics.clicks, metrics.cost_micros, metrics.conversions
    FROM search_term_view
    WHERE segments.date BETWEEN '${START}' AND '${END}'
      AND campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
      AND metrics.conversions > 0
    ORDER BY metrics.conversions DESC
  `);

  console.log('\n── 6. TERMOS QUE GERARAM CONVERSÃO ──────────────────────────────────────────');
  if (!convTerms.length) {
    console.log('  Nenhum termo com conversão registrada no período (verificar tag de conversão).');
  } else {
    for (const r of convTerms) {
      const m = r.metrics;
      console.log(`  Conv: ${m.conversions} | ${fmt(m.cost_micros)} | "${r.search_term_view.search_term}" → ${r.ad_group.name}`);
    }
  }

  // ── 7. TENDÊNCIA SEMANAL ─────────────────────────────────────────────────────
  const weeks = [
    { label: 'Sem 1 (07–13/04)', start: '2026-04-07', end: '2026-04-13' },
    { label: 'Sem 2 (14–20/04)', start: '2026-04-14', end: '2026-04-20' },
    { label: 'Sem 3 (21–27/04)', start: '2026-04-21', end: '2026-04-27' },
    { label: 'Sem 4 (28/04–04/05)', start: '2026-04-28', end: '2026-05-04' },
    { label: 'Sem 5 (05–07/05)', start: '2026-05-05', end: '2026-05-07' },
  ];

  console.log('\n── 7. TENDÊNCIA SEMANAL ─────────────────────────────────────────────────────');
  console.log('Semana              | Impr  | Cli | CTR%  | CPC    | Custo    | Conv');
  console.log('─'.repeat(80));
  for (const w of weeks) {
    const rows = await customer.query(`
      SELECT metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.ctr, metrics.average_cpc, metrics.conversions
      FROM customer
      WHERE segments.date BETWEEN '${w.start}' AND '${w.end}'
    `);
    const m = rows[0]?.metrics ?? {};
    const label = w.label.padEnd(19);
    const impr  = String(m.impressions ?? 0).padStart(6);
    const cli   = String(m.clicks ?? 0).padStart(4);
    const ctr   = pct(m.ctr ?? 0).padStart(6);
    const cpc   = fmt(m.average_cpc ?? 0).padStart(7);
    const cost  = fmt(m.cost_micros ?? 0).padStart(9);
    const conv  = String(m.conversions ?? 0).padStart(4);
    console.log(`${label} | ${impr} | ${cli} | ${ctr} | ${cpc} | ${cost} | ${conv}`);
  }

  // ── 8. STATUS ATUAL DOS ADs ──────────────────────────────────────────────────
  const ads = await customer.query(`
    SELECT
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.policy_summary.approval_status,
      ad_group_ad.status,
      ad_group.name,
      campaign.name
    FROM ad_group_ad
    WHERE campaign.name IN ('[Busca] - Produtos Prioritários', '[Busca] - Produtos Secundários')
      AND ad_group_ad.status != 'REMOVED'
    ORDER BY campaign.name, ad_group.name
  `);

  console.log('\n── 8. STATUS DOS ANÚNCIOS (RSAs) ────────────────────────────────────────────');
  const statusMap = { 0: 'UNSPEC', 1: 'UNKNOWN', 2: 'ENABLED', 3: 'PAUSED', 4: 'REMOVED' };
  const approvalMap = { 0: 'UNSPEC', 1: 'UNKNOWN', 2: 'APPROVED', 3: 'APPROVED_LIMITED', 4: 'AREA_OF_INTEREST_ONLY', 5: 'DISAPPROVED', 6: 'UNDER_REVIEW' };
  for (const r of ads) {
    const ag     = r.ad_group.name.padEnd(35);
    const status = (statusMap[r.ad_group_ad.status] ?? r.ad_group_ad.status).padEnd(8);
    const appr   = approvalMap[r.ad_group_ad.policy_summary?.approval_status] ?? '?';
    console.log(`  ${ag} | ${status} | ${appr}`);
  }

  console.log(`\n${'═'.repeat(80)}\n`);
}

main().catch(e => { console.error('ERRO:', e.message); if (e.errors) e.errors.forEach(x => console.error(JSON.stringify(x))); process.exit(1); });
