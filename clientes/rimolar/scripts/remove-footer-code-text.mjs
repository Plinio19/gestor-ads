import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Sdk from '@tray-tecnologia/theme-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const themeId = 3525435;
const assetId = 533317507;
const assetPath = '/elements/footer.html';

const client = new Sdk({
  token: process.env.TRAY_THEME_TOKEN,
  themeId,
});

const current = await client.getThemeAsset(assetId);
const content = (current.data || current).content;

const sentenceToRemove = 'Rimolar Química é uma marca operada por Expresslab Comércio e Importação de Equipamentos LTDA — CNPJ 61.682.943/0001-36 — Av. Fernando de Noronha, 522, Jardim Margarida, Vargem Grande Paulista - SP, CEP 06739-020. ';

if (!content.includes(sentenceToRemove)) {
  console.error('ATENÇÃO: frase esperada não encontrada no conteúdo atual — abortando.');
  const idx = content.indexOf('legal-info');
  console.error('Contexto atual (legal-info):', content.slice(idx, idx + 500));
  process.exit(1);
}

const newContent = content.replace(sentenceToRemove, '');

const result = await client.updateThemeAsset(assetPath, assetId, Buffer.from(newContent, 'utf8').toString('base64'));
console.log('Atualizado com sucesso.');

// Confirma lendo de volta
const check = await client.getThemeAsset(assetId);
const idx = (check.data || check).content.indexOf('legal-info');
console.log('--- trecho legal-info após remoção ---');
console.log((check.data || check).content.slice(idx, idx + 500));
