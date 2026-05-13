require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { getAuthClient } = require('../../../lib/auth-client');

async function publishGTM() {
  console.log('\n=== Publicando versão GTM ===\n');

  const auth = getAuthClient();
  const tagmanager = google.tagmanager({ version: 'v2', auth });

  const accountsRes = await tagmanager.accounts.list();
  const account = accountsRes.data.account[0];
  const accountId = account.accountId;

  const containersRes = await tagmanager.accounts.containers.list({
    parent: `accounts/${accountId}`,
  });
  const container = containersRes.data.container[0];
  const containerId = container.containerId;

  const workspacesRes = await tagmanager.accounts.containers.workspaces.list({
    parent: `accounts/${accountId}/containers/${containerId}`,
  });
  const ws = workspacesRes.data.workspace[0];
  const wsId = ws.workspaceId;
  const parent = `accounts/${accountId}/containers/${containerId}/workspaces/${wsId}`;

  // Verificar estado atual do workspace
  const [tagsRes, triggersRes] = await Promise.all([
    tagmanager.accounts.containers.workspaces.tags.list({ parent }),
    tagmanager.accounts.containers.workspaces.triggers.list({ parent }),
  ]);

  const triggers = triggersRes.data.trigger || [];
  const tags = tagsRes.data.tag || [];
  const triggerMap = {};
  triggers.forEach(t => { triggerMap[t.triggerId] = t.name; });

  console.log('Estado atual do workspace:');
  tags.forEach(tag => {
    const gatilhos = tag.firingTriggerId?.map(id => triggerMap[id] ?? `ID:${id}`).join(', ') || 'SEM GATILHO';
    console.log(`  [${tag.paused ? 'PAUSADA' : 'ATIVA'}] "${tag.name}" → ${gatilhos}`);
  });
  console.log('');

  // Criar versão
  console.log('Criando versão...');
  const version = await tagmanager.accounts.containers.workspaces.create_version({
    path: parent,
    requestBody: {
      name: `Correções - ${new Date().toLocaleDateString('pt-BR')}`,
      notes: 'Gestor IA: All Pages, WhatsApp e Formulário de Contato corrigidos.',
    },
  });

  const versionId = version.data.containerVersion?.containerVersionId;
  console.log(`  ✓ Versão ${versionId} criada\n`);

  // Publicar
  console.log('Publicando...');
  await tagmanager.accounts.containers.versions.publish({
    path: `accounts/${accountId}/containers/${containerId}/versions/${versionId}`,
  });

  console.log('  ✓ Publicado com sucesso!\n');
  console.log('=== GTM atualizado e no ar! ===');
  console.log(`\nVerifique em: https://tagmanager.google.com`);
}

publishGTM().catch(err => {
  console.error('\nErro:', err.message || err);
  if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
