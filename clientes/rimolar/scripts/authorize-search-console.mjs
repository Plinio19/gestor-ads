import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import dotenv from 'dotenv';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const { MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET } = process.env;
const PORT = 51789;
const redirectUri = `http://localhost:${PORT}/callback`;

const oauth2Client = new google.auth.OAuth2(MERCHANT_CLIENT_ID, MERCHANT_CLIENT_SECRET, redirectUri);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
});

console.log('\nAbra este link no navegador e faça login com a conta admin do Search Console:\n');
console.log(authUrl);
console.log('\nAguardando autorização...\n');

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/callback')) return;
  const url = new URL(req.url, redirectUri);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.end('Erro na autorização: ' + error);
    console.error('Erro na autorização:', error);
    server.close();
    process.exit(1);
  }

  res.end('Autorizado! Pode fechar esta aba e voltar pro terminal.');

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\nRefresh token obtido:\n');
    console.log(tokens.refresh_token);

    const fs = await import('fs');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent += `\n# Credencial Search Console (Google Search Console API)\nSEARCH_CONSOLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('\nSalvo em', envPath);
  } catch (e) {
    console.error('Erro ao trocar code por token:', e.message);
  }
  server.close();
  process.exit(0);
});

server.listen(PORT, () => {});
