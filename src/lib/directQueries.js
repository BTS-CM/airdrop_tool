import { Apis } from 'bitsharesjs-ws';
import { Apis as tuscApis } from 'tuscjs-ws';
import { humanReadableFloat, sliceIntoChunks } from './common';

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

    let retrievedObjects = [];
    const chunksOfInputs = sliceIntoChunks(object_ids, 100);
    for (let i = 0; i < chunksOfInputs.length; i++) {
      const currentChunk = chunksOfInputs[i];
      //console.log(`Fetching chunk ${i + 1} of ${chunksOfInputs.length}`);

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

export {
  lookupSymbols,
  fetchLeaderboardData,
  accountSearch,
  getBlockedAccounts,
  getObjects
};
