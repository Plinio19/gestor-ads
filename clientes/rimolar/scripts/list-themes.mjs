import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Sdk from '@tray-tecnologia/theme-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const client = new Sdk({
  token: process.env.TRAY_THEME_TOKEN,
  themeId: null,
});

const data = await client.getThemes();
console.log(JSON.stringify(data, null, 2));
