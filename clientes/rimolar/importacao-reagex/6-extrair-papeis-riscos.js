const fs = require('fs');
const path = require('path');

const lista = JSON.parse(fs.readFileSync(path.resolve(__dirname, '_pubchem-descricoes-en.json'), 'utf8'));

const rolesSet = new Set();
const hazardOrgsSet = new Set();
const hazardTypesSet = new Set();

const resultado = [];

for (const item of lista) {
  const desc = item.descricao;

  // Padrão de risco: "X can cause A, B and C according to ORG."
  const hazardMatch = desc.match(/can cause ([^.]+?) according to (.+?)\./);
  let hazard = null;
  if (hazardMatch) {
    const tipos = hazardMatch[1].split(/,| and /).map(s => s.trim()).filter(Boolean);
    const org = hazardMatch[2].trim();
    tipos.forEach(t => hazardTypesSet.add(t));
    hazardOrgsSet.add(org);
    hazard = { tipos, org };
  }

  // Padrão de papel: "It has a role as a X, a Y and a Z."
  const roleMatch = desc.match(/[Ii]t has a role as ([^.]+)\./);
  let roles = [];
  if (roleMatch) {
    roles = roleMatch[1]
      .replace(/ and /g, ', ')
      .split(',')
      .map(s => s.trim().replace(/^(a|an)\s+/i, '').trim())
      .filter(Boolean);
    roles.forEach(r => rolesSet.add(r));
  }

  resultado.push({ cas: item.cas, titulo: item.titulo, hazard, roles });
}

fs.writeFileSync(path.resolve(__dirname, '_papeis-riscos-extraidos.json'), JSON.stringify(resultado, null, 1));
fs.writeFileSync(path.resolve(__dirname, '_vocabulario-roles.json'), JSON.stringify([...rolesSet].sort(), null, 1));
fs.writeFileSync(path.resolve(__dirname, '_vocabulario-hazard-tipos.json'), JSON.stringify([...hazardTypesSet].sort(), null, 1));
fs.writeFileSync(path.resolve(__dirname, '_vocabulario-hazard-orgs.json'), JSON.stringify([...hazardOrgsSet].sort(), null, 1));

console.log('Total processados:', resultado.length);
console.log('Com hazard (risco):', resultado.filter(r => r.hazard).length);
console.log('Com roles (papel/função):', resultado.filter(r => r.roles.length).length);
console.log('Vocabulário único de roles:', rolesSet.size);
console.log('Vocabulário único de tipos de hazard:', hazardTypesSet.size);
console.log('Vocabulário único de orgs de hazard:', hazardOrgsSet.size);
