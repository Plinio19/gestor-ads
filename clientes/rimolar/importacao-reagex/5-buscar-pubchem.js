// Busca dados químicos reais no PubChem (PUG REST) para cada CAS único do catálogo.
// Salva um cache incremental em _pubchem-cache.json (permite retomar se interromper).
const fs = require('fs');
const path = require('path');

const dados = JSON.parse(fs.readFileSync(path.resolve(__dirname, '_mapeamento-categorias.json'), 'utf8'));
const exodoRaw = fs.readFileSync(path.resolve(__dirname, 'exodo-nao-controlados.csv'), 'utf8');

function parseCsv(text, delimiter) {
  const rows = []; let row = []; let field = ''; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; } else field += c; }
    else { if (c === '"') inQuotes = true; else if (c === delimiter) { row.push(field); field = ''; } else if (c === '\r') {} else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; } else field += c; }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1);
}

const exRows = parseCsv(exodoRaw, ',');
const exHeader = exRows[0];
const idxCas = exHeader.indexOf('CAS');
const casList = [...new Set(exRows.slice(1).map(r => (r[idxCas] || '').trim()).filter(c => c && c !== '-'))];

console.log('CAS únicos a buscar:', casList.length);

const cachePath = path.resolve(__dirname, '_pubchem-cache.json');
let cache = {};
if (fs.existsSync(cachePath)) {
  cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  console.log('Cache existente:', Object.keys(cache).length, 'CAS já resolvidos');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Retorna { status, data } — status 404 = genuinamente não encontrado; outro erro = transitório (retry)
async function fetchJsonComRetry(url, tentativas = 4) {
  for (let i = 0; i < tentativas; i++) {
    let res;
    try {
      res = await fetch(url);
    } catch (e) {
      await sleep(800 * (i + 1));
      continue;
    }
    if (res.status === 404) return { status: 404, data: null };
    if (res.ok) return { status: 200, data: await res.json() };
    // 429/503/500 etc — espera crescente e tenta de novo
    await sleep(800 * (i + 1));
  }
  return { status: 'falhou_apos_retries', data: null };
}

async function buscarCas(cas) {
  const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cas)}/property/IUPACName,MolecularFormula,MolecularWeight,Title/JSON`;
  const { status, data: propData } = await fetchJsonComRetry(propUrl);

  if (status === 404) return { cas, encontrado: false, motivo: 'nao_existe_pubchem' };
  if (status !== 200 || !propData?.PropertyTable?.Properties?.length) {
    return { cas, encontrado: false, motivo: 'erro_transitorio', statusFinal: status };
  }

  const prop = propData.PropertyTable.Properties[0];
  const cid = prop.CID;

  let descricao = null;
  await sleep(300);
  const descUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/description/JSON`;
  const descResult = await fetchJsonComRetry(descUrl, 2);
  if (descResult.status === 200) {
    const entry = descResult.data?.InformationList?.Information?.find(i => i.Description);
    if (entry) descricao = entry.Description;
  }

  return {
    cas,
    encontrado: true,
    cid,
    nomeIupac: prop.IUPACName || null,
    formulaMolecular: prop.MolecularFormula || null,
    pesoMolecular: prop.MolecularWeight || null,
    tituloPubchem: prop.Title || null,
    descricao,
  };
}

async function run() {
  // Reprocessa: nunca buscados OU que falharam por erro transitório (não os genuinamente 404)
  const pendentes = casList.filter(c => !cache[c] || (cache[c].encontrado === false && cache[c].motivo !== 'nao_existe_pubchem'));
  console.log('Pendentes de busca (novos + retry de erro transitório):', pendentes.length);
  let contador = 0;
  for (const cas of pendentes) {
    const resultado = await buscarCas(cas);
    cache[cas] = resultado;
    contador++;
    if (contador % 20 === 0) {
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 1));
      console.log(`  ...${contador}/${pendentes.length} processados (salvando checkpoint)`);
    }
    await sleep(500); // mais conservador que antes, pra evitar throttling
  }
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 1));

  const encontrados = Object.values(cache).filter(c => c.encontrado).length;
  const naoEncontrados = Object.values(cache).filter(c => !c.encontrado).length;
  console.log('\n=== RESULTADO FINAL ===');
  console.log('Total no cache:', Object.keys(cache).length);
  console.log('Encontrados no PubChem:', encontrados);
  console.log('Não encontrados:', naoEncontrados);
}

run().catch(e => { console.error('ERRO FATAL:', e.message); fs.writeFileSync(cachePath, JSON.stringify(cache, null, 1)); });
