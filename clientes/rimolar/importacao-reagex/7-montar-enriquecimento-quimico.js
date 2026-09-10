const fs = require('fs');
const path = require('path');
const vocab = require('./vocabulario-traducao.js');

const extraido = JSON.parse(fs.readFileSync(path.resolve(__dirname, '_papeis-riscos-extraidos.json'), 'utf8'));
const cache = JSON.parse(fs.readFileSync(path.resolve(__dirname, '_pubchem-cache.json'), 'utf8'));

// Prioridade: funcional/industrial > farmacológico > toxicológico (já coberto no hazard) > biológico/metabólito
function prioridade(roleEn) {
  const funcional = ['solvent', 'buffer', 'chelator', 'dye', 'reagent', 'catalyst', 'detergent', 'surfactant',
    'antioxidant', 'antimicrobial agent', 'disinfectant', 'antiseptic drug', 'fertilizer', 'herbicide', 'fungicide',
    'insecticide', 'food acidity regulator', 'food preservative', 'food additive', 'fragrance', 'flavouring agent',
    'reducing agent', 'oxidising agent', 'acid-base indicator', 'colour indicator', 'histological dye',
    'fluorescent dye', 'colorimetric reagent', 'cross-linking reagent', 'plant hormone', 'plant growth retardant',
    'sweetening agent', 'chromophore', 'fluorochrome', 'mordant', 'bleaching agent', 'plasticiser', 'flame retardant',
    'fuel additive', 'refrigerant', 'nutrient', 'micronutrient', 'macronutrient'];
  const farmaco = ['analgesic', 'antipyretic', 'antibacterial agent', 'antifungal agent', 'antiviral agent',
    'anti-inflammatory agent', 'antioxidant', 'vasodilator agent', 'diuretic', 'anticoagulant', 'antidote',
    'antidepressant', 'anticonvulsant', 'coenzyme', 'cofactor', 'neurotransmitter'];
  if (funcional.includes(roleEn)) return 0;
  if (farmaco.includes(roleEn)) return 1;
  if (roleEn.includes('metabolite')) return 3;
  return 2;
}

function traduzirRole(roleEn) {
  return vocab.roles[roleEn] || null;
}

const extraidoByCas = new Map(extraido.map(e => [e.cas, e]));
const resultado = {};

// Itera sobre TODOS os CAS resolvidos no PubChem (894), não só os 516 com descrição —
// senão os 378 sem texto descritivo perdem até a fórmula/massa molecular, que já temos.
for (const [cas, pubchemInfo] of Object.entries(cache)) {
  if (!pubchemInfo.encontrado) continue;
  const item = extraidoByCas.get(cas); // pode ser undefined se não tinha "descricao"

  const partes = [];

  if (item?.hazard) {
    const tiposPt = item.hazard.tipos.map(t => vocab.hazardTipos[t] || t).join(', ');
    const orgPt = vocab.hazardOrgs[item.hazard.org] || item.hazard.org;
    partes.push(`<p style="color:#8a1f11;"><strong>Atenção:</strong> segundo ${orgPt}, esta substância pode estar associada a ${tiposPt}. Consulte a FISPQ e observe rigorosamente as normas de segurança no manuseio.</p>`);
  }

  const rolesValidos = (item?.roles || [])
    .filter(r => !/^ec\s/i.test(r))
    .map(r => ({ en: r, pt: traduzirRole(r.toLowerCase()), prio: prioridade(r.toLowerCase()) }))
    .filter(r => r.pt)
    .sort((a, b) => a.prio - b.prio)
    .slice(0, 4);

  if (rolesValidos.length) {
    const lista = rolesValidos.map(r => r.pt);
    const listaTexto = lista.length > 1
      ? lista.slice(0, -1).join(', ') + ' e ' + lista[lista.length - 1]
      : lista[0];
    partes.push(`<p>Na literatura química, este composto é referenciado com papel de ${listaTexto}.</p>`);
  }

  const dadosMoleculares = [];
  if (pubchemInfo.tituloPubchem && pubchemInfo.tituloPubchem.length < 80) dadosMoleculares.push(`<li><strong>Nome de referência (PubChem):</strong> ${pubchemInfo.tituloPubchem}</li>`);
  if (pubchemInfo.formulaMolecular) dadosMoleculares.push(`<li><strong>Fórmula molecular:</strong> ${pubchemInfo.formulaMolecular}</li>`);
  if (pubchemInfo.pesoMolecular) dadosMoleculares.push(`<li><strong>Massa molecular:</strong> ${pubchemInfo.pesoMolecular} g/mol</li>`);

  resultado[cas] = {
    temHazard: !!item?.hazard,
    htmlPapeis: partes.join('\n'),
    dadosMolecularesHtml: dadosMoleculares.length ? `<ul>${dadosMoleculares.join('')}</ul>` : '',
    rolesPt: rolesValidos.map(r => r.pt),
    // só papéis funcionais/farmacológicos (prio 0 ou 1) servem de "Aplicação" de verdade;
    // "metabólito de X" (prio 3) é fato biológico, não uso prático do reagente.
    rolesAplicaveis: rolesValidos.filter(r => r.prio <= 1).map(r => r.pt),
  };
}

fs.writeFileSync(path.resolve(__dirname, '_enriquecimento-quimico-por-cas.json'), JSON.stringify(resultado, null, 1));

const total = Object.keys(resultado).length;
const comHazard = Object.values(resultado).filter(r => r.temHazard).length;
const comPapeis = Object.values(resultado).filter(r => r.htmlPapeis && !r.temHazard).length;
console.log('CAS com enriquecimento:', total);
console.log('Com alerta de segurança:', comHazard);
console.log('Com papéis funcionais (sem hazard):', comPapeis);

console.log('\n--- Exemplo com hazard ---');
const exemploHazard = Object.entries(resultado).find(([, v]) => v.temHazard);
if (exemploHazard) console.log(exemploHazard[0], '\n' + exemploHazard[1].htmlPapeis + '\n' + exemploHazard[1].dadosMolecularesHtml);

console.log('\n--- Exemplo sem hazard ---');
const exemploSemHazard = Object.entries(resultado).find(([, v]) => !v.temHazard && v.htmlPapeis);
if (exemploSemHazard) console.log(exemploSemHazard[0], '\n' + exemploSemHazard[1].htmlPapeis + '\n' + exemploSemHazard[1].dadosMolecularesHtml);
