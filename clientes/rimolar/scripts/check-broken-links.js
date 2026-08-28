/**
 * Checa o status HTTP de todos os links de produto do feed do Merchant Center.
 * Uso: node clientes/rimolar/scripts/check-broken-links.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { google } = require('googleapis');

const { MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET, MERCHANT_REFRESH_TOKEN, MERCHANT_ID } = process.env;

const oauth2Client = new google.auth.OAuth2(MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: MERCHANT_REFRESH_TOKEN });
const content = google.content({ version: 'v2.1', auth: oauth2Client });

const CONCURRENCY = 15;
const TIMEOUT_MS = 15000;

async function fetchAllLinks() {
  let pageToken;
  const links = [];
  do {
    const r = await content.products.list({ merchantId: MERCHANT_ID, maxResults: 250, pageToken });
    for (const p of r.data.resources || []) {
      if (p.link) links.push({ productId: p.productId, title: p.title, link: p.link });
    }
    pageToken = r.data.nextPageToken;
  } while (pageToken);
  return links;
}

async function checkLink(item) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(item.link, { method: 'GET', redirect: 'follow', signal: controller.signal });
    clearTimeout(t);
    return { ...item, status: res.status, ms: Date.now() - start, ok: res.status >= 200 && res.status < 400 };
  } catch (e) {
    clearTimeout(t);
    return { ...item, status: 'ERROR', error: e.message, ms: Date.now() - start, ok: false };
  }
}

async function run() {
  console.log('Buscando links do feed...');
  const links = await fetchAllLinks();
  console.log(`Total de produtos com link: ${links.length}\n`);

  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < links.length) {
      const item = links[idx++];
      const r = await checkLink(item);
      results.push(r);
      if (results.length % 250 === 0) console.log(`  ...${results.length}/${links.length} verificados`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const broken = results.filter(r => !r.ok);
  const slow = results.filter(r => r.ok && r.ms > 5000);

  console.log(`\nVerificados: ${results.length}`);
  console.log(`Com erro (não 2xx/3xx): ${broken.length}`);
  console.log(`Lentos (>5s): ${slow.length}`);

  if (broken.length) {
    console.log('\n=== LINKS COM ERRO ===');
    for (const b of broken) console.log(`[${b.status}] ${b.title} — ${b.link} ${b.error ? '(' + b.error + ')' : ''}`);
  }
  if (slow.length) {
    console.log('\n=== LINKS LENTOS (>5s) ===');
    for (const s of slow) console.log(`[${s.ms}ms] ${s.title} — ${s.link}`);
  }

  require('fs').writeFileSync(
    require('path').resolve(__dirname, '..', '_tmp-link-check.json'),
    JSON.stringify({ total: results.length, broken, slow }, null, 2)
  );
}
run().catch(e => console.error('ERRO FATAL:', e.message));
