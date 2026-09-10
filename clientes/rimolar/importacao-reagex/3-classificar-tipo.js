const fs = require('fs');
const path = require('path');

const dados = JSON.parse(fs.readFileSync(path.resolve(__dirname, '_mapeamento-categorias.json'), 'utf8'));

function classificar(codigo, produto) {
  // Sufixo "SO" no código = Solução (confirmado no padrão da lista Exodo)
  if (/SO$/.test(codigo)) return 'solucao';
  // Unidade de volume no nome = Líquido
  if (/\b\d+([.,]\d+)?\s*(ML|L)\b/i.test(produto)) return 'liquido';
  // Unidade de massa no nome = Sólido
  if (/\b\d+([.,]\d+)?\s*(MG|GR|G|KG)\b/i.test(produto)) return 'solido';
  return 'indefinido';
}

const contagem = { solido: 0, solucao: 0, liquido: 0, indefinido: 0 };
const indefinidos = [];

for (const item of dados) {
  const tipo = classificar(item.codigo, item.produto);
  item.tipoFoto = tipo;
  contagem[tipo]++;
  if (tipo === 'indefinido') indefinidos.push(item);
}

console.log('Contagem por tipo:', contagem);
console.log('\nAmostra de indefinidos (até 30):');
indefinidos.slice(0, 30).forEach(d => console.log(' -', d.codigo, '|', d.produto));

fs.writeFileSync(path.resolve(__dirname, '_mapeamento-categorias.json'), JSON.stringify(dados, null, 1));
console.log('\nAtualizado com tipoFoto.');
