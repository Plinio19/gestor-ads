require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { getAuthClient } = require('../../../lib/auth-client');

async function testGTM() {
  console.log('\n=== Teste de Conexão — Google Tag Manager ===\n');

  const containerId = process.env.GTM_CONTAINER_ID;
  if (!containerId) {
    console.error('Erro: GTM_CONTAINER_ID não definido no .env');
    process.exit(1);
  }

  const auth = getAuthClient();
  const tagmanager = google.tagmanager({ version: 'v2', auth });

  // Listar contas GTM acessíveis
  const accountsRes = await tagmanager.accounts.list();
  const accounts = accountsRes.data.account || [];

  if (accounts.length === 0) {
    console.log('Nenhuma conta GTM encontrada.');
    return;
  }

  console.log(`${accounts.length} conta(s) GTM encontrada(s):\n`);

  for (const account of accounts) {
    console.log(`Conta: ${account.name} (ID: ${account.accountId})`);

    const containersRes = await tagmanager.accounts.containers.list({
      parent: `accounts/${account.accountId}`,
    });

    const containers = containersRes.data.container || [];
    for (const container of containers) {
      console.log(`  Container: ${container.name}`);
      console.log(`  ID Público: ${container.publicId}`);
      console.log(`  Domínio: ${container.domainName?.join(', ') || 'Não configurado'}`);

      // Listar tags do container
      const workspacesRes = await tagmanager.accounts.containers.workspaces.list({
        parent: `accounts/${account.accountId}/containers/${container.containerId}`,
      });

      const workspaces = workspacesRes.data.workspace || [];
      if (workspaces.length > 0) {
        const ws = workspaces[0];
        const tagsRes = await tagmanager.accounts.containers.workspaces.tags.list({
          parent: `accounts/${account.accountId}/containers/${container.containerId}/workspaces/${ws.workspaceId}`,
        });

        const tags = tagsRes.data.tag || [];
        console.log(`  Tags configuradas: ${tags.length}`);
        tags.forEach(tag => {
          console.log(`    • [${tag.type}] ${tag.name}`);
        });
      }
    }
    console.log('─'.repeat(50));
  }

  console.log('\nConexão com GTM OK!');
}

testGTM().catch(err => {
  console.error('\nErro:', err.message || err);
  process.exit(1);
});
