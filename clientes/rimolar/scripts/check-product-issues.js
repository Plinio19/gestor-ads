/**
 * Lista productstatuses procurando por issues relacionadas a landing page / crawl / página corrompida.
 * Uso: node clientes/rimolar/scripts/check-product-issues.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { google } = require('googleapis');

const { MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET, MERCHANT_REFRESH_TOKEN, MERCHANT_ID } = process.env;

const oauth2Client = new google.auth.OAuth2(MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: MERCHANT_REFRESH_TOKEN });
const content = google.content({ version: 'v2.1', auth: oauth2Client });

async function run() {
  let pageToken;
  let count = 0;
  const foundCodes = new Map();
  const examples = [];
  do {
    const r = await content.productstatuses.list({
      merchantId: MERCHANT_ID,
      maxResults: 250,
      pageToken,
    });
    for (const p of r.data.resources || []) {
      count++;
      for (const issue of p.itemLevelIssues || []) {
        foundCodes.set(issue.code, (foundCodes.get(issue.code) || 0) + 1);
        if (/land|crawl|page|url|corrupt|corrompid/i.test(issue.code + ' ' + issue.description)) {
          if (examples.length < 10) {
            examples.push({ productId: p.productId, title: p.title, link: p.link, code: issue.code, description: issue.description, detail: issue.detail });
          }
        }
      }
    }
    pageToken = r.data.nextPageToken;
  } while (pageToken);

  console.log('Total produtos verificados:', count);
  console.log('\nCódigos de issue encontrados:');
  for (const [code, n] of foundCodes) console.log(` - ${code}: ${n}`);
  console.log('\nExemplos relacionados a landing page/crawl:');
  console.log(JSON.stringify(examples, null, 2));
}
run().catch(e => console.error('ERRO:', e.message, e.response?.data ? JSON.stringify(e.response.data).slice(0, 500) : ''));
