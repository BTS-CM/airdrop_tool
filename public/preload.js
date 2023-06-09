// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
// eslint-disable-next-line import/no-extraneous-dependencies
const { ipcRenderer } = require("electron");

// Note: Changes to this file will require a build before electron:start works

async function _openURL(target) {
  ipcRenderer.send('openURL', target);
}

window.electron = {
  openURL: async (target) => _openURL(target),
  fetchLocales: () => {
    const translations = {};
    const languages = ['en', 'da', 'de', 'et', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'th'];
    const pages = [
      'account',
      'airdropCard',
      'analyze',
      'app',
      'airdropPrep',
      'customAirdropPrep',
      'asset',
      'beetModal',
      'calculate',
      'beet',
      'calculatedAirdrops',
      'lookupAccount',
      'lookupAsset',
      'getAccount',
      'accountSearch',
      'create',
      'upgrade',
      'faq',
      'blockAccounts',
      'customAirdrop',
      'fetch',
      'modal',
      'home',
      'leaderboard',
      'nodes',
      'overrideTransfer',
      'performAirdrop',
      'plannedAirdrop',
      'ticket',
      'tickets',
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
  },
};
