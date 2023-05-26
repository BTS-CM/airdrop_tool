import i18next from 'i18next';
import { initReactI18next } from "react-i18next";
import { localePreferenceStore } from '../lib/states';

const pages = [
  'beet',
  'blockchain',
  'setup',
];

const oldLocale = localePreferenceStore.getState().locale;
const locale = oldLocale || 'en';

function fetchLocales () {
  const translations = {};
  //const languages = ['en', 'da', 'de', 'et', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'th'];
  const languages = ['en'];
  const pages = [
    'beet',
    'blockchain',
    'setup',
  ];
  languages.forEach((language) => {
    const localPages = {};
    pages.forEach((page) => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const pageContents = require(`./locales/${language}/${page}.json`);
      localPages[page] = pageContents;
    });
    translations[language] = localPages;
  });
  return translations;
}

i18next
  .use(initReactI18next)
  .init({
    resources: fetchLocales(),
    lng: locale,
    defaultNS: pages,
    fallbackLng: ['en'],
    ns: pages,
  }, (err, t) => {
    if (err) {
      console.log('something went wrong loading', err);
    }
  });

export default i18next;
