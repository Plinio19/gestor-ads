import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Sdk from '@tray-tecnologia/theme-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const themeId = 3517625;
const assetId = 531778493;
const assetPath = '/elements/head-metas.html';

const client = new Sdk({
  token: process.env.TRAY_THEME_TOKEN,
  themeId,
});

const original = `{% spaceless %}

    {% set custom_page = false %}
    {% set page_details = null %}
    {% for page in pages.custom %}
        {% if ('empresa' in page.slug and pages.current == 'company') or (pages.current == page.slug) %}
            {% set custom_page = true %}
            {% set page_details = {
                title : page.name,
                description : page.conteudo | striptags | split('.') | first ~ '.'
            } %}
        {% endif %}
    {% endfor %}

    {% if custom_page %}

        {{ tray.meta }}

        <meta property="og:type" content="website"/>
        <meta property="og:title" content="{{ page_details.title }}" />
        <meta property="og:description" content="{{ page_details.description }}" />

    {% else %}

        {{ tray.meta }}
        <meta property="og:type" content="website"/>

    {% endif %}

{% endspaceless %}`;

const lgpdSnippet = `<meta name="adopt-website-id" content="140f3b9d-4e3b-41ac-b6f2-0ef1f7e21332" />
<script src="//tag.goadopt.io/injector.js?website_code=140f3b9d-4e3b-41ac-b6f2-0ef1f7e21332" class="adopt-injector"></script>

`;

const newContent = lgpdSnippet + original;

// Confirma que o conteúdo atual bate com o esperado antes de sobrescrever
const current = await client.getThemeAsset(assetId);
const currentContent = (current.data || current).content;
if (currentContent.trim() !== original.trim()) {
  console.error('ATENÇÃO: conteúdo atual difere do esperado — abortando para não sobrescrever algo inesperado.');
  console.error('--- ATUAL ---');
  console.error(currentContent);
  process.exit(1);
}

const result = await client.updateThemeAsset(assetPath, assetId, Buffer.from(newContent, 'utf8').toString('base64'));
console.log('Atualizado com sucesso:', JSON.stringify(result.data || result, null, 2).slice(0, 500));
