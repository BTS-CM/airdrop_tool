import { Apis } from 'bitsharesjs-ws';
import { Apis as tuscApis} from 'tuscjs-ws';
import { appStore } from './states';

function humanReadableFloat(satoshis, precision) {
  return satoshis / 10 ** precision;
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

    let finalLeaderboard = [];
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

      finalLeaderboard.push({...accounts[i], balances: finalData});
    }

    resolve(finalLeaderboard);
  });
}

/**
 * Fetch one/many asset symbol data
 * @param {String} node
 * @param {Array} accountID
 * @returns {Array}
 */
async function lookupSymbols(node, env, asset_ids) {
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
    return;

    /*
    const finalData = filtered.map((x) => {
      const currentSymbol = filtered.find((y) => y.id === x.asset_id);

      console.log({currentSymbol})
      return {
        symbol: currentSymbol.symbol,
        precision: currentSymbol.precision,
        amount: x.amount,
        id: x.asset_id,
      };
    })
    */

    // .filter((x) => humanReadableFloat(x.amount, x.precision) >= humanReadableFloat(1, x.precision));
  });
}

export {
  lookupSymbols,
  fetchLeaderboardData,
};
