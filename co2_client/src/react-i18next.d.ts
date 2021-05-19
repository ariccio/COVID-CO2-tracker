// https://react.i18next.com/latest/typescript

// import the original type declarations
import 'react-i18next';

import * as en from '../public/locales/en/translation.json';

declare module 'react-i18n-next' {
    interface Resources {
        en: typeof en;
    }
}