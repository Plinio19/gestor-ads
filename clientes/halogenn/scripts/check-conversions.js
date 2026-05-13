require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');

const { CLIENT_ID, CLIENT_SECRET, DEVELOPER_TOKEN, REFRESH_TOKEN, CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, developer_token: DEVELOPER_TOKEN });
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: REFRESH_TOKEN });

async function checkConversions() {
  console.log('\n=== Verificação de Conversões ===\n');

  const conversions = await customer.query(`
    SELECT
      conversion_action.id,
      conversion_action.name,
      conversion_action.status,
      conversion_action.type,
      conversion_action.category,
      conversion_action.counting_type,
      conversion_action.tag_snippets,
      conversion_action.value_settings.default_value,
      conversion_action.value_settings.always_use_default_value
    FROM conversion_action
    ORDER BY conversion_action.name ASC
  `);

  if (conversions.length === 0) {
    console.log('ALERTA: Nenhuma conversão configurada na conta!');
    return;
  }

  const STATUS = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'ENABLED', 3: 'REMOVED', 4: 'HIDDEN' };
  const TYPE = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'AD_CALL', 3: 'CLICK_TO_CALL', 4: 'GOOGLE_PLAY_DOWNLOAD', 5: 'GOOGLE_PLAY_IN_APP_PURCHASE', 6: 'UPLOAD_CALLS', 7: 'UPLOAD_CLICKS', 8: 'WEBPAGE', 9: 'WEBSITE_CALL', 10: 'STORE_SALES_DIRECT_UPLOAD', 11: 'STORE_SALES', 12: 'FIREBASE_ANDROID_FIRST_OPEN', 13: 'FIREBASE_ANDROID_IN_APP_PURCHASE', 14: 'FIREBASE_ANDROID_CUSTOM', 15: 'FIREBASE_IOS_FIRST_OPEN', 16: 'FIREBASE_IOS_IN_APP_PURCHASE', 17: 'FIREBASE_IOS_CUSTOM', 18: 'THIRD_PARTY_APP_ANALYTICS_ANDROID_FIRST_OPEN', 19: 'THIRD_PARTY_APP_ANALYTICS_ANDROID_IN_APP_PURCHASE', 20: 'THIRD_PARTY_APP_ANALYTICS_ANDROID_CUSTOM', 21: 'THIRD_PARTY_APP_ANALYTICS_IOS_FIRST_OPEN', 22: 'THIRD_PARTY_APP_ANALYTICS_IOS_IN_APP_PURCHASE', 23: 'THIRD_PARTY_APP_ANALYTICS_IOS_CUSTOM', 24: 'ANDROID_APP_PRE_REGISTRATION', 25: 'ANDROID_INSTALLS_ALL_OTHER_APPS', 26: 'FLOODLIGHT_ACTION', 27: 'FLOODLIGHT_TRANSACTION', 28: 'GOOGLE_HOSTED', 29: 'LEAD_FORM_SUBMIT', 30: 'SALESFORCE', 31: 'SEARCH_ADS_360', 32: 'SMART_CAMPAIGN_AD_CLICKS_TO_CALL', 33: 'SMART_CAMPAIGN_MAP_CLICKS_TO_CALL', 34: 'SMART_CAMPAIGN_MAP_DIRECTIONS', 35: 'SMART_CAMPAIGN_TRACKED_CALLS', 36: 'STORE_VISITS', 37: 'WEBPAGE_CODELESS' };
  const CATEGORY = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'DEFAULT', 3: 'PAGE_VIEW', 4: 'PURCHASE', 5: 'SIGNUP', 6: 'LEAD', 7: 'DOWNLOAD', 8: 'ADD_TO_CART', 9: 'BEGIN_CHECKOUT', 10: 'SUBSCRIBE_PAID', 11: 'PHONE_CALL_LEAD', 12: 'IMPORTED_LEAD', 13: 'SUBMIT_LEAD_FORM', 14: 'BOOK_APPOINTMENT', 15: 'REQUEST_QUOTE', 16: 'GET_DIRECTIONS', 17: 'OUTBOUND_CLICK', 18: 'CONTACT', 19: 'ENGAGEMENT', 20: 'STORE_VISIT', 21: 'STORE_SALE', 22: 'QUALIFIED_LEAD', 23: 'CONVERTED_LEAD' };

  console.log(`${conversions.length} conversão(ões) encontrada(s):\n`);

  for (const row of conversions) {
    const cv = row.conversion_action;
    console.log(`Nome:      ${cv.name}`);
    console.log(`Status:    ${STATUS[cv.status] ?? cv.status}`);
    console.log(`Tipo:      ${TYPE[cv.type] ?? cv.type}`);
    console.log(`Categoria: ${CATEGORY[cv.category] ?? cv.category}`);
    console.log(`Contagem:  ${cv.counting_type === 1 ? 'ONE_PER_CLICK' : cv.counting_type === 2 ? 'MANY_PER_CLICK' : cv.counting_type}`);

    if (cv.tag_snippets && cv.tag_snippets.length > 0) {
      const tag = cv.tag_snippets[0];
      console.log(`Tag ID:    ${tag.global_site_tag ? 'Global Site Tag presente' : 'Sem global site tag'}`);
    }

    console.log('─'.repeat(50));
  }
}

checkConversions().catch(err => {
  console.error('Erro:', err.message || err);
  process.exit(1);
});
