const { Apis } = require('bitsharesjs-ws');
const { Apis: tuscApis } = require('tuscjs-ws');

/**
 * Convert the token's blockchain representation into a human readable quantity
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
function humanReadableFloat(satoshis, precision) {
  return parseFloat((satoshis / 10 ** precision).toFixed(precision));
}

function sliceIntoChunks(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    chunks.push(chunk);
  }
  return chunks;
}

/**
 * Search for an account, given 1.2.x or an account name.
 * @param {String} node
 * @param {String} env
 * @param {String} search_string
 * @returns
 */
async function accountSearch(node, env, search_string) {
  return new Promise(async (resolve, reject) => {
    try {
      if (env === 'tusc') {
        await tuscApis.instance(node, true).init_promise;
      } else {
        await Apis.instance(node, true).init_promise;
      }
    } catch (error) {
      console.log(error);
      reject(error);
      return;
    }

    if (
      (env === 'tusc' && !tuscApis.instance().db_api())
      || ((env === 'bitshares' || env === 'bitshares-testnet') && !Apis.instance().db_api())
    ) {
      console.log("no db_api");
      reject(new Error("no db_api"));
      return;
    }

    let object;
    try {
      object = await Apis.instance().db_api().exec("get_accounts", [[search_string]]);
    } catch (error) {
      console.log(error);
      reject(error);
    }

    resolve(object);
  });
}

/**
 * Fetch the user's NFT balances from the blockchain
 * @param {String} node
 * @param {String} env
 * @param {Array} accounts
 */
async function fetchLeaderboardData(node, env, accounts) {
  return new Promise(async (resolve, reject) => {
    try {
      if (env === 'tusc') {
        await tuscApis.instance(node, true).init_promise;
      } else {
        await Apis.instance(node, true).init_promise;
      }
    } catch (error) {
      console.log(error);
      reject(error);
      return;
    }

    if (
      (env === 'tusc' && !tuscApis.instance().db_api())
      || ((env === 'bitshares' || env === 'bitshares-testnet') && !Apis.instance().db_api())
    ) {
      console.log("no db_api");
      reject(new Error("no db_api"));
      return;
    }

    const finalLeaderboard = [];
    for (let i = 0; i < accounts.length; i++) {
      const accountID = accounts[i].id;

      let response;
      try {
        response = env === 'tusc'
          ? await tuscApis.instance().db_api().exec("get_account_balances", [accountID, []]) // TUSC
          : await Apis.instance().db_api().exec("get_account_balances", [accountID, []]); // BTS && BTS_TEST
      } catch (error) {
        console.log(error);
        reject();
        return;
      }

      if (!response) {
        finalLeaderboard.push(accounts[i]);
        continue;
      }

      if (!response.length) {
        // user has no balances..
        finalLeaderboard.push(accounts[i]);
        continue;
      }

      const asset_ids = response.map((x) => x.asset_id);

      let symbols;
      try {
        if (env === 'tusc') {
          symbols = await tuscApis.instance().db_api().exec('lookup_asset_symbols', [asset_ids]);
        } else {
          symbols = await Apis.instance().db_api().exec('lookup_asset_symbols', [asset_ids]);
        }
      } catch (error) {
        console.log(error);
        finalLeaderboard.push(accounts[i]);
        continue;
      }

      if (env === 'tusc') {
        tuscApis.close();
      } else {
        Apis.close();
      }

      const filteredSymbols = symbols.filter((x) => x !== null);

      const finalData = response.map((x) => {
        const currentSymbol = filteredSymbols.find((y) => y.id === x.asset_id);
        return {
          symbol: currentSymbol.symbol,
          precision: currentSymbol.precision,
          amount: x.amount,
          id: x.asset_id,
        };
      }).filter(
        (x) => humanReadableFloat(x.amount, x.precision) >= humanReadableFloat(1, x.precision)
      );

      finalLeaderboard.push({ ...accounts[i], balances: finalData });
    }

    resolve(finalLeaderboard);
  });
}

/**
 * Fetch one/many asset symbol data
 * @param {String} node
 * @param {String} env
 * @param {Array} asset_ids
 * @param {Bool} apiConnection
 * @returns {Array}
 */
async function lookupSymbols(node, env, asset_ids, apiConnection = null) {
  return new Promise(async (resolve, reject) => {
    if (!apiConnection) {
      try {
        if (env === 'tusc') {
          await tuscApis.instance(node, true).init_promise;
        } else {
          await Apis.instance(node, true).init_promise;
        }
      } catch (error) {
        console.log(error);
        reject(error);
        return;
      }
    }

    if (
      (env === 'tusc' && !tuscApis.instance().db_api())
      || ((env === 'bitshares' || env === 'bitshares-testnet') && !Apis.instance().db_api())
    ) {
      console.log("no db_api");
      reject(new Error("no db_api"));
      return;
    }

    let symbols;
    try {
      if (env === 'tusc') {
        symbols = await tuscApis.instance().db_api().exec('lookup_asset_symbols', [asset_ids]);
      } else {
        symbols = await Apis.instance().db_api().exec('lookup_asset_symbols', [asset_ids]);
      }
    } catch (error) {
      console.log(error);
      reject(error);
      return;
    }

    const filtered = symbols.filter((x) => x !== null);
    if (!filtered || !filtered.length) {
      reject(new Error("No symbol data"));
      return;
    }

    resolve(filtered);
  });
}

/**
 * Get multiple objects such as accounts, assets, etc
 * @param {String} node
 * @param {String} env
 * @param {Array} object_ids
 */
async function getObjects(node, env, object_ids) {
  return new Promise(async (resolve, reject) => {
    try {
      if (env === 'tusc') {
        await tuscApis.instance(node, true).init_promise;
      } else {
        await Apis.instance(node, true).init_promise;
      }
    } catch (error) {
      console.log(error);
      reject(error);
      return;
    }

    if (
      (env === 'tusc' && !tuscApis.instance().db_api())
      || ((env === 'bitshares' || env === 'bitshares-testnet') && !Apis.instance().db_api())
    ) {
      console.log("no db_api");
      reject(new Error("no db_api"));
      return;
    }

    let retrievedObjects = [];
    const chunksOfInputs = sliceIntoChunks(object_ids, 100);
    for (let i = 0; i < chunksOfInputs.length; i++) {
      const currentChunk = chunksOfInputs[i];
      // console.log(`Fetching chunk ${i + 1} of ${chunksOfInputs.length}`);

      let got_objects;
      try {
        if (env === 'tusc') {
          got_objects = await tuscApis.instance().db_api().exec("get_objects", [currentChunk, false]);
        } else {
          got_objects = await Apis.instance().db_api().exec("get_objects", [currentChunk, false]);
        }
      } catch (error) {
        console.log(error);
        reject(error);
        return;
      }

      if (got_objects && got_objects.length) {
        retrievedObjects = retrievedObjects.concat(got_objects.filter((x) => x !== null));
      }
    }

    if (retrievedObjects && retrievedObjects.length) {
      resolve(retrievedObjects);
    }
  });
}

/*
* Fetch account/address list to warn users about
* List is maintained by the Bitshares committee
* @param {String} node
* @returns {Array}
*/
async function getBlockedAccounts(node) {
  return new Promise(async (resolve, reject) => {
    try {
      await Apis.instance(node, true).init_promise;
    } catch (error) {
      console.log(error);
      reject(error);
      return;
    }

    if (!Apis.instance().db_api()) {
      console.log("no db_api");
      reject(new Error("no db_api"));
      return;
    }

    let object;
    try {
      object = await Apis.instance().db_api().exec("get_accounts", [['committee-blacklist-manager']]);
    } catch (error) {
      console.log(error);
      reject(error);
    }

    if (!object) {
      reject(new Error('Committee account details not found'));
      return;
    }

    resolve(object);
  });
}

/**
 * Retrieves blockchain vote lock tickets
 * @param {String} node
 * @param {String} env
 * @param {Number} lastID
 * @param {Array} currentTickets
 * @returns {Array}
 */
async function getTickets(node, env, lastID, currentTickets) {
  return new Promise(async (resolve, reject) => {
    try {
      if (env === 'tusc') {
        await tuscApis.instance(node, true).init_promise;
      } else {
        await Apis.instance(node, true).init_promise;
      }
    } catch (error) {
      console.log(error);
      reject(error);
    }

    if (
      (env === 'tusc' && !tuscApis.instance().db_api())
      || ((env === 'bitshares' || env === 'bitshares-testnet') && !Apis.instance().db_api())
    ) {
      console.log("no db_api");
      reject(new Error("no db_api"));
      return;
    }

    const ids = [];
    const updatedTickets = [];
    for (let i = 0; i < 100; i++) {
      let response;
      try {
        if (env === 'tusc') {
          response = await tuscApis.instance().db_api().exec("list_tickets", [100, `1.18.${lastID + (i * 100)}`]);
        } else {
          response = await Apis.instance().db_api().exec("list_tickets", [100, `1.18.${lastID + (i * 100)}`]);
        }
      } catch (error) {
        console.log(error);
        break;
      }

      if (!response || !response.length) {
        console.log("no response");
        break;
      }

      for (let k = 0; k < response.length; k++) {
        if (!currentTickets.find((x) => x.id === response[k].id)) {
          if (!ids.includes(response[k].id)) {
            ids.push(response[k].id);
            updatedTickets.push(response[k]);
          }
        }
      }

      if (response.length < 100) {
        console.log(`Finished fetching ${updatedTickets.length} tickets!`);
        break;
      }
    }

    resolve(updatedTickets);
  });
}

/**
 * Fetch account details
 * @param {Array} leaderboard
 * @param {String} env
 * @param {String} node
 * @returns {Array}
 */
async function fetchAccounts(leaderboard, env, node) {
  return new Promise(async (resolve, reject) => {
    try {
      if (env === 'tusc') {
        await tuscApis.instance(node, true).init_promise;
      } else {
        await Apis.instance(node, true).init_promise;
      }
    } catch (error) {
      console.log(error);
      reject(error);
    }

    if (
      (env === 'tusc' && !tuscApis.instance().db_api())
      || ((env === 'bitshares' || env === 'bitshares-testnet') && !Apis.instance().db_api())
    ) {
      console.log("no db_api");
      reject(new Error("no db_api"));
      return;
    }

    let assetsToFetch = [];
    const accountResults = [];
    const leaderboardBatches = sliceIntoChunks(
      leaderboard,
      env === 'bitshares'
        ? 50
        : 10
    );
    for (let i = 0; i < leaderboardBatches.length; i++) {
      let currentBatch = leaderboardBatches[i];
      const accountIDs = currentBatch.map((user) => user.id);
      let fetchedAccounts;
      try {
        if (env === 'tusc') {
          fetchedAccounts = await tuscApis.instance().db_api().exec("get_full_accounts", [accountIDs, false]).then((results) => {
            if (results && results.length) {
              return results;
            }
          });
        } else {
          fetchedAccounts = await Apis.instance().db_api().exec("get_full_accounts", [accountIDs, false]).then((results) => {
            if (results && results.length) {
              return results;
            }
          });
        }
      } catch (error) {
        console.log(error);
        continue;
      }

      // eslint-disable-next-line no-loop-func
      currentBatch = currentBatch.map((user) => {
        const foundAccount = fetchedAccounts.find((acc) => acc[0] === user.id)[1];
        const foundAssets = foundAccount.balances.map((balance) => balance.asset_type);
        assetsToFetch = assetsToFetch.concat(foundAssets);
        return {
          ...user,
          balances: foundAccount.balances.map((balance) => ({
            amount: balance.balance, asset_id: balance.asset_type
          })),
          account: {
            name: foundAccount.account.name,
            ltm: foundAccount.account.id === foundAccount.account.lifetime_referrer,
            creation_time: foundAccount.account.creation_time,
            assets: foundAccount.assets,
            votes: foundAccount.votes && foundAccount.votes.length
              ? foundAccount.votes.map((vote) => {
                if (vote.id.includes("1.14.")) {
                  return {
                    id: vote.id,
                    name: vote.name,
                    worker_account: vote.worker_account
                  };
                }

                if (vote.id.includes("1.5.")) {
                  return {
                    id: vote.id,
                    committee_member_account: vote.committee_member_account
                  };
                }

                if (vote.id.includes("1.6.")) {
                  return {
                    id: vote.id,
                    witness_account: vote.witness_account
                  };
                }

                return null;
              }).filter((x) => x)
              : []
          }
        };
      });

      if (fetchedAccounts && fetchedAccounts.length) {
        accountResults.push(...currentBatch);
      }
    }

    // assetsToFetch
    let fetchedAssets = [];
    const fetchableAssetChunks = sliceIntoChunks([...new Set(assetsToFetch)], 50);
    for (let i = 0; i < fetchableAssetChunks.length; i++) {
      const currentChunk = fetchableAssetChunks[i];
      let symbols;
      try {
        if (env === 'tusc') {
          symbols = await tuscApis.instance().db_api().exec('lookup_asset_symbols', [currentChunk]);
        } else {
          symbols = await Apis.instance().db_api().exec('lookup_asset_symbols', [currentChunk]);
        }
      } catch (error) {
        console.log(error);
        continue;
      }

      const filtered = symbols.filter((x) => x !== null);

      if (!filtered || !filtered.length) {
        return;
      }

      const requiredInfo = filtered
        .map((q) => ({
          id: q.id,
          symbol: q.symbol,
          precision: q.precision,
          issuer: q.issuer,
          isBitasset: !!q.bitasset_data_id,
          options: {
            max_supply: q.options.max_supply,
            flags: q.options.flags,
            issuer_permissions: q.options.issuer_permissions
          },
          dynamic_asset_data_id: q.dynamic_asset_data_id
        }));
      fetchedAssets = fetchedAssets.concat(requiredInfo);
    }

    let retrievedGlobalParameters;
    try {
      if (env === 'tusc') {
        retrievedGlobalParameters = await tuscApis.instance().db_api().exec('get_objects', [['2.0.0']]);
      } else {
        retrievedGlobalParameters = await Apis.instance().db_api().exec('get_objects', [['2.0.0']]);
      }
    } catch (error) {
      console.log(error);
      reject(error);
      return;
    }

    const feeResponse = {};
    if (retrievedGlobalParameters && retrievedGlobalParameters.length) {
      const transferCost = humanReadableFloat(
        retrievedGlobalParameters[0].parameters.current_fees.parameters[0][1].fee,
        5
      );
      feeResponse.fee = transferCost;
      feeResponse.maxBytes = retrievedGlobalParameters[0].parameters.maximum_transaction_size;
    }

    resolve({ feeResponse, fetchedAssets, accountResults });
  });
}

module.exports = {
  lookupSymbols,
  fetchLeaderboardData,
  accountSearch,
  getBlockedAccounts,
  getObjects,
  getTickets,
  fetchAccounts,
};
