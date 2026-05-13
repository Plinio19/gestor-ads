require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const { getAuthClient } = require('../../../lib/auth-client');

async function checkGTMTriggers() {
  console.log('\n=== Diagnóstico GTM — Tags e Gatilhos ===\n');

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

  // Buscar tags, triggers e variáveis
  const [tagsRes, triggersRes, variablesRes] = await Promise.all([
    tagmanager.accounts.containers.workspaces.tags.list({ parent }),
    tagmanager.accounts.containers.workspaces.triggers.list({ parent }),
    tagmanager.accounts.containers.workspaces.variables.list({ parent }),
  ]);

  const tags = tagsRes.data.tag || [];
  const triggers = triggersRes.data.trigger || [];
  const variables = variablesRes.data.variable || [];

  // Mapear triggers por ID
  const triggerMap = {};
  for (const t of triggers) triggerMap[t.triggerId] = t;

  console.log(`=== TAGS (${tags.length}) ===\n`);
  for (const tag of tags) {
    console.log(`Tag: "${tag.name}" [${tag.type}]`);
    console.log(`  Pausa: ${tag.paused ? 'SIM ⚠' : 'Não'}`);

    if (tag.firingTriggerId?.length) {
      console.log(`  Dispara em:`);
      for (const tid of tag.firingTriggerId) {
        const tr = triggerMap[tid];
        if (tr) {
          console.log(`    ✓ [${tr.type}] "${tr.name}"`);
          if (tr.filter?.length) {
            tr.filter.forEach(f => {
              console.log(`      Condição: ${f.parameter?.find(p => p.key === 'arg0')?.value} ${f.type} ${f.parameter?.find(p => p.key === 'arg1')?.value}`);
            });
          }
        } else {
          console.log(`    ? Trigger ID ${tid} não encontrado`);
        }
      }
    } else {
      console.log(`  Dispara em: NENHUM GATILHO ⚠`);
    }

    if (tag.blockingTriggerId?.length) {
      console.log(`  Bloqueada por: ${tag.blockingTriggerId.join(', ')}`);
    }

    // Parâmetros da tag
    if (tag.parameter?.length) {
      const convLabel = tag.parameter.find(p => p.key === 'conversionLabel');
      const convId = tag.parameter.find(p => p.key === 'conversionId');
      const eventName = tag.parameter.find(p => p.key === 'eventName');
      const measurementId = tag.parameter.find(p => p.key === 'measurementId');
      if (convLabel) console.log(`  Conversion Label: ${convLabel.value}`);
      if (convId) console.log(`  Conversion ID: ${convId.value}`);
      if (eventName) console.log(`  Event Name: ${eventName.value}`);
      if (measurementId) console.log(`  Measurement ID: ${measurementId.value}`);
    }

    console.log('');
  }

  console.log(`=== TRIGGERS (${triggers.length}) ===\n`);
  for (const tr of triggers) {
    console.log(`Trigger: "${tr.name}" [${tr.type}]`);
    if (tr.filter?.length) {
      tr.filter.forEach(f => {
        const arg0 = f.parameter?.find(p => p.key === 'arg0')?.value;
        const arg1 = f.parameter?.find(p => p.key === 'arg1')?.value;
        console.log(`  Condição: ${arg0} ${f.type} ${arg1}`);
      });
    }
    if (tr.type === 'CLICK' || tr.type === 'LINK_CLICK') {
      const waitForTags = tr.parameter?.find(p => p.key === 'waitForTags')?.value;
      console.log(`  Wait for tags: ${waitForTags ?? 'não configurado'}`);
    }
    console.log('');
  }

  console.log(`=== VARIÁVEIS (${variables.length}) ===\n`);
  for (const v of variables) {
    console.log(`  [${v.type}] ${v.name}`);
  }
}

checkGTMTriggers().catch(err => {
  console.error('\nErro:', err.message || err);
  process.exit(1);
});
