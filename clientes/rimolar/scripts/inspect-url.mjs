import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET, SEARCH_CONSOLE_REFRESH_TOKEN } = process.env;
const oauth2Client = new google.auth.OAuth2(MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: SEARCH_CONSOLE_REFRESH_TOKEN });
const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

const url = process.argv[2] || 'https://www.rimolar.com.br/reagentes/outros/butanodiol-1-4-ps-1l';

try {
  const r = await searchconsole.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: url,
      siteUrl: 'sc-domain:rimolar.com.br',
    },
  });
  console.log(JSON.stringify(r.data, null, 2));
} catch (e) {
  console.error('ERRO:', e.message);
  if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
}
