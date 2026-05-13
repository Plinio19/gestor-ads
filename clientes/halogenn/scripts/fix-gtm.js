require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { getAuthClient } = require('../../../lib/auth-client');

async function fixGTM() {
  console.log('\n=== Corrigindo configurações do GTM ===\n');

  const auth = getAuthClient();
  const tagmanager = google.tagmanager({ version: 'v2', auth });

  // Obter IDs
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

  console.log(`Conta: ${account.name}`);
  console.log(`Container: ${container.name} (${container.publicId})`);
  console.log(`Workspace: ${ws.name}\n`);

  // Carregar tags e triggers atuais
  const [tagsRes, triggersRes] = await Promise.all([
    tagmanager.accounts.containers.workspaces.tags.list({ parent }),
    tagmanager.accounts.containers.workspaces.triggers.list({ parent }),
  ]);
  const tags = tagsRes.data.tag || [];
  const triggers = triggersRes.data.trigger || [];

  const tagMap = {};
  tags.forEach(t => { tagMap[t.name] = t; });
  const triggerMap = {};
  triggers.forEach(t => { triggerMap[t.name] = t; });

  // ─── CORREÇÃO 1: Criar trigger "All Pages" ───────────────────────────────
  console.log('1. Criando trigger "All Pages"...');
  const allPagesTrigger = await tagmanager.accounts.containers.workspaces.triggers.create({
    parent,
    requestBody: {
      name: 'All Pages',
      type: 'PAGEVIEW',
    },
  });
  const allPagesId = allPagesTrigger.data.triggerId;
  console.log(`   ✓ Trigger "All Pages" criado (ID: ${allPagesId})\n`);

  // ─── CORREÇÃO 2: Vincular All Pages às 3 tags órfãs ──────────────────────
  const tagsToFix = ['Google Tag AW-11402544358', 'Tag_Google', 'Conversion Linker'];
  console.log('2. Vinculando "All Pages" às tags sem gatilho...');

  for (const tagName of tagsToFix) {
    const tag = tagMap[tagName];
    if (!tag) {
      console.log(`   ⚠ Tag "${tagName}" não encontrada, pulando.`);
      continue;
    }

    await tagmanager.accounts.containers.workspaces.tags.update({
      path: tag.path,
      requestBody: {
        ...tag,
        firingTriggerId: [allPagesId],
      },
    });
    console.log(`   ✓ "${tagName}" → dispara em "All Pages"`);
  }
  console.log('');

  // ─── CORREÇÃO 3: Corrigir trigger do WhatsApp ─────────────────────────────
  console.log('3. Corrigindo trigger do WhatsApp...');
  const waTrigger = triggerMap['Click WhatsApp'];
  if (waTrigger) {
    await tagmanager.accounts.containers.workspaces.triggers.update({
      path: waTrigger.path,
      requestBody: {
        ...waTrigger,
        type: 'LINK_CLICK',
        waitForTags: { type: 'boolean', key: 'waitForTags', value: 'true' },
        checkValidation: { type: 'boolean', key: 'checkValidation', value: 'true' },
        filter: [
          {
            type: 'CSS_SELECTOR',
            parameter: [
              { type: 'template', key: 'arg0', value: '{{Click Element}}' },
              { type: 'template', key: 'arg1', value: '[href*="wa.me"],[href*="whatsapp"],[class*="whatsapp"]' },
            ],
          },
        ],
      },
    });
    console.log('   ✓ Trigger WhatsApp corrigido → verifica href com "wa.me" ou "whatsapp"\n');
  } else {
    console.log('   ⚠ Trigger "Click WhatsApp" não encontrado.\n');
  }

  // ─── CORREÇÃO 4: Corrigir trigger do Formulário de Contato ───────────────
  console.log('4. Corrigindo trigger do Formulário de Contato...');
  const contactTrigger = triggerMap['Event_contato'];
  if (contactTrigger) {
    await tagmanager.accounts.containers.workspaces.triggers.update({
      path: contactTrigger.path,
      requestBody: {
        ...contactTrigger,
        type: 'FORM_SUBMISSION',
        waitForTags: { type: 'boolean', key: 'waitForTags', value: 'true' },
        checkValidation: { type: 'boolean', key: 'checkValidation', value: 'true' },
        filter: [
          {
            type: 'CONTAINS',
            parameter: [
              { type: 'template', key: 'arg0', value: '{{Page URL}}' },
              { type: 'template', key: 'arg1', value: 'halogenn.com.br' },
            ],
          },
        ],
      },
    });
    console.log('   ✓ Trigger Formulário de Contato corrigido → dispara em qualquer submit em halogenn.com.br\n');
  } else {
    console.log('   ⚠ Trigger "Event_contato" não encontrado.\n');
  }

  // ─── PUBLICAR versão ─────────────────────────────────────────────────────
  console.log('5. Criando versão do container com as correções...');
  const version = await tagmanager.accounts.containers.workspaces.create_version({
    path: parent,
    requestBody: {
      name: `Correções automáticas - ${new Date().toLocaleDateString('pt-BR')}`,
      notes: 'Criado pelo gestor IA: corrigido trigger All Pages, WhatsApp e Formulário de Contato.',
    },
  });

  const versionId = version.data.containerVersion?.containerVersionId;
  console.log(`   ✓ Versão ${versionId} criada\n`);

  // Publicar
  console.log('6. Publicando no container...');
  await tagmanager.accounts.containers.versions.publish({
    path: `accounts/${accountId}/containers/${containerId}/versions/${versionId}`,
  });
  console.log('   ✓ Publicado com sucesso!\n');

  console.log('=== Todas as correções aplicadas e publicadas! ===');
  console.log(`\nVerifique em: https://tagmanager.google.com/#/container/accounts/${accountId}/containers/${containerId}/workspaces/${wsId}`);
}

fixGTM().catch(err => {
  console.error('\nErro:', err.message || err);
  if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
