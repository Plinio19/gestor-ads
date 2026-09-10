const fs = require('fs');
const path = require('path');

const dados = JSON.parse(fs.readFileSync(path.resolve(__dirname, '_mapeamento-categorias.json'), 'utf8'));

function parsePrecoBR(texto) {
  // formato: " R$  869,15 " -> 869.15
  if (!texto) return null;
  const limpo = texto.replace(/[^\d,.-]/g, '').trim();
  // formato BR: milhar com ponto, decimal com vírgula (aqui não deve ter milhar já que são poucos digitos, mas cobrimos)
  const normalizado = limpo.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(normalizado);
  return isNaN(n) ? null : n;
}

const MARGEM = 1.45;
let semPreco = 0;
let precoZero = 0;

for (const item of dados) {
  const custo = parsePrecoBR(item.precoTexto);
  item.precoCusto = custo;
  if (custo === null) { semPreco++; item.precoVenda = null; continue; }
  if (custo === 0) precoZero++;
  item.precoVenda = Math.round(custo * MARGEM * 100) / 100;
}

console.log('Total produtos:', dados.length);
console.log('Sem preço parseável:', semPreco);
console.log('Preço custo = 0:', precoZero);

console.log('\nAmostra (5 primeiros):');
dados.slice(0, 5).forEach(d => {
  console.log(` ${d.codigo} | ${d.produto} | custo R$${d.precoCusto} -> venda R$${d.precoVenda} | cat ${d.categoriaIdNivel1}/${d.categoriaIdNivel2}`);
});

if (semPreco > 0) {
  console.log('\n--- Itens sem preço parseável ---');
  dados.filter(d => d.precoCusto === null).slice(0, 20).forEach(d => console.log(' -', d.codigo, d.produto, '|', JSON.stringify(d.precoTexto)));
}

fs.writeFileSync(path.resolve(__dirname, '_mapeamento-categorias.json'), JSON.stringify(dados, null, 1));
console.log('\nAtualizado _mapeamento-categorias.json com precoCusto/precoVenda');
