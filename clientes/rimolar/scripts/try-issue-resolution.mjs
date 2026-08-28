import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { google, merchantapi_issueresolution_v1 as issueApi } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET, MERCHANT_REFRESH_TOKEN, MERCHANT_ID } = process.env;
const oauth2Client = new google.auth.OAuth2(MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: MERCHANT_REFRESH_TOKEN });

const client = new issueApi.Merchantapi({ auth: oauth2Client });

try {
  const r = await client.issueresolution.renderaccountissues({
    name: `accounts/${MERCHANT_ID}`,
    languageCode: 'pt-BR',
    timeZone: 'America/Sao_Paulo',
  });
  console.log(JSON.stringify(r.data, null, 2));
} catch (e) {
  console.error('ERRO:', e.message);
  if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
}
