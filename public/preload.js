// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
// eslint-disable-next-line import/no-extraneous-dependencies
const { ipcRenderer } = require("electron");

// Note: Changes to this file will require a build before electron:start works

async function _openURL(target) {
  ipcRenderer.send('openURL', target);
}

window.electron = {
  // Misc
  openURL: async (target) => _openURL(target),
  getUUID: async () => await ipcRenderer.invoke('getUUID'),
  executeCalculation: async (
    filtered_signature,
    distributions,
    deduplicate,
    alwaysWinning,
    leaderboardJSON,
    relevantAssets,
    relevantTickets,
    bof_projectile,
    bof_splinter,
    freebieAsset,
    freebieAssetQty,
    witnessVoteData,
    committeeVoteData,
    workerVoteData
  ) => await ipcRenderer.invoke(
    'executeCalculation',
    filtered_signature,
    distributions,
    deduplicate,
    alwaysWinning,
    leaderboardJSON,
    relevantAssets,
    relevantTickets,
    bof_projectile,
    bof_splinter,
    freebieAsset,
    freebieAssetQty,
    witnessVoteData,
    committeeVoteData,
    workerVoteData
  ),
  // Queries
  lookupSymbols: async (node, env, asset_ids, apiConnection) => await ipcRenderer.invoke('lookupSymbols', node, env, asset_ids, apiConnection),
  fetchLeaderboardData: async (node, env, accounts) => await ipcRenderer.invoke('fetchLeaderboardData', node, env, accounts),
  accountSearch: async (node, env, search_string) => await ipcRenderer.invoke('accountSearch', node, env, search_string),
  getBlockedAccounts: async (node) => await ipcRenderer.invoke('getBlockedAccounts', node),
  getObjects: async (node, env, object_ids) => await ipcRenderer.invoke('getObjects', node, env, object_ids),
  getBlockchainFees: async (node, env) => await ipcRenderer.invoke('getBlockchainFees', node, env),
  // Generations
  getTrxBytes: async (opCost, chain, opType, operations) => await ipcRenderer.invoke('getTrxBytes', opCost, chain, opType, operations),
  generateDeepLink: async (appName, chain, node, opType, operations) => await ipcRenderer.invoke('generateDeepLink', appName, chain, node, opType, operations),
  generateQRContents: async (opType, opContents) => await ipcRenderer.invoke('generateQRContents', opType, opContents),
  // Beet
  checkBeet: async (enableSSL) => await ipcRenderer.invoke('checkBeet', enableSSL),
  connect: async (appName, browser, origin, existingBeetConnection, identity) => await ipcRenderer.invoke('connect', appName, browser, origin, existingBeetConnection, identity),
  link: async (chain, beetConnection) => await ipcRenderer.invoke('link', chain, beetConnection),
  beetBroadcast: async (
    chain,
    node,
    opType,
    operations,
    identity,
    beetObject
  ) => await ipcRenderer.invoke(
    'beetBroadcast',
    chain,
    node,
    opType,
    operations,
    identity,
    beetObject
  ),
};
