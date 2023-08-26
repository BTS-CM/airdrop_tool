import i18next from 'i18next';
import { initReactI18next } from "react-i18next";
import resources from 'virtual:i18next-loader'
import { localePreferenceStore } from '../lib/states';

const pages = [
  'account',
  'airdrop',
  'airdropCard',
  'analyze',
  'calculate',
  'calculatedAirdrops',
  'create',
  'faq',
  'fetch',
  'home',
  'leaderboard',
  'links',
  'nodes',
  'performAirdrop',
  'plannedAirdrop',
  'ticket',
  'tickets',
];

const oldLocale = localePreferenceStore.getState().locale;
const locale = oldLocale || 'en';

i18next
  .use(initReactI18next)
  .init({
    resources: resources,
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
