import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Sdk from '@tray-tecnologia/theme-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const themeId = Number(process.argv[2]);
const client = new Sdk({
  token: process.env.TRAY_THEME_TOKEN,
  themeId,
});

const data = await client.getThemeAssets();
const list = data.data || data;
for (const a of list) {
  console.log(a.id, a.path || a.name);
}
