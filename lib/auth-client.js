require('dotenv').config();
const { google } = require('googleapis');

function getAuthClient() {
  const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error('CLIENT_ID, CLIENT_SECRET e REFRESH_TOKEN devem estar no .env');
  }

  const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost:3000/callback');
  client.setCredentials({ refresh_token: REFRESH_TOKEN });
  return client;
}

module.exports = { getAuthClient };
