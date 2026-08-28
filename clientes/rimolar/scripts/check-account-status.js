/**
 * Consulta o accountstatus atual do Merchant Center (Content API for Shopping).
 * Uso: node clientes/rimolar/scripts/check-account-status.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { google } = require('googleapis');

const { MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET, MERCHANT_REFRESH_TOKEN, MERCHANT_ID } = process.env;

const oauth2Client = new google.auth.OAuth2(MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: MERCHANT_REFRESH_TOKEN });
const content = google.content({ version: 'v2.1', auth: oauth2Client });

async function run() {
  const r = await content.accountstatuses.get({
    merchantId: MERCHANT_ID,
    accountId: MERCHANT_ID,
  });
  console.log(JSON.stringify(r.data, null, 2));
}
run().catch(e => {
  console.error('ERRO:', e.message);
  if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
});
