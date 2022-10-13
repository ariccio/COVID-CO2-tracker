import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../../public/locales/en/translation.json'

// export const i18nTestConfig = 
i18n
  .use(initReactI18next)
  .init({
    lng: 'en-us',
    fallbackLng: 'en',

    // // have a common namespace used around the full app
    // ns: ['translationsNS'],
    // defaultNS: 'translationsNS',

    debug: true,

    interpolation: {
      escapeValue: false, // not needed for react!!
    },

    resources: {
        "en-us": {
            en
        }
    },
  });

export default i18n;
