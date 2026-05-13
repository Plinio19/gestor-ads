require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const { URL } = require('url');

const { CLIENT_ID, CLIENT_SECRET } = process.env;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Erro: CLIENT_ID e CLIENT_SECRET devem estar preenchidos no .env');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:3000/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  'https://www.googleapis.com/auth/tagmanager.publish',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

console.log('\n=== Gerador de REFRESH_TOKEN (todos os escopos) ===\n');
console.log('Escopos incluídos:');
SCOPES.forEach(s => console.log('  •', s));
console.log('\n1. Abra o link abaixo no navegador:');
console.log('\n' + authUrl + '\n');
console.log('2. Faça login e autorize o acesso.');
console.log('3. Aguardando callback em http://localhost:3000/callback...\n');

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, 'http://localhost:3000');

  if (parsedUrl.pathname !== '/callback') {
    res.end('Aguardando autenticação...');
    return;
  }

  const code = parsedUrl.searchParams.get('code');

  if (!code) {
    res.writeHead(400);
    res.end('Código de autorização não encontrado.');
    return;
  }

  try {
    const { tokens } = await client.getToken(code);

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h2>Autenticação concluída! Pode fechar esta aba.</h2>');

    console.log('=== REFRESH_TOKEN gerado com sucesso! ===\n');
    console.log('Substitua o REFRESH_TOKEN no seu .env pelo valor abaixo:\n');
    console.log(`REFRESH_TOKEN=${tokens.refresh_token}\n`);

    server.close();
  } catch (err) {
    res.writeHead(500);
    res.end('Erro ao trocar o código pelo token.');
    console.error('Erro:', err.message);
    server.close();
  }
});

server.listen(3000);
