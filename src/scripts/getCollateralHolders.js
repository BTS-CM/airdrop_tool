/* eslint-disable max-len */
const fs = require('fs').promises;
const { Apis } = require('bitsharesjs-ws');
const { humanReadableFloat } = require('./lib/common');
// CONFIGURE THE FOLLOWING:

const inputs = [
  "CNY",
  "CNY1.0",
  "USD",
  "USD1.0",
  "EUR",
  "EUR1.0",
  "BTC1.0",
  "JPY",
  "GBP",
  "ARS",
  "AUD",
  "CAD",
  "SILVER",
  "GOLD",
  "BTC",
  "TWENTIX",
  "HERTZ",
  "HERO",
  "HONEST.USD",
  "HONEST.GBP",
  "HONEST.EUR",
  "HONEST.USDSHORT",
  "HONEST.BTCSHORT",
  "HONEST.EOS",
  "HONEST.XRP",
  "HONEST.ADA",
  "HONEST.XAU",
  "HONEST.EOSSHORT",
  "HONEST.XMRSHORT",
  "HONEST.XRPSHORT",
  "HONEST.JPYSHORT",
  "HONEST.CNYSHORT",
  "HONEST.DOTSHORT",
  "HONEST.ETHSHORT",
  "URTHR",
  "SKULD",
  "VERTHANDI",
];

// END CONFIGURATION

const writeToFile = async (fileName, data) => {
  console.log(`Writing to ${fileName}`);
  await fs.writeFile(fileName, JSON.stringify(data, null, 4));
};

/**
 * Get the call orders for each asset
 * @param {Array} assetIDs
 * @returns {[Promise<Object>]}
 */
const getCallOrders = async (assetIDs) => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 333);
  });

  try {
    await Apis.instance("wss://node.xbts.io/ws", true).init_promise;
  } catch (error) {
    console.log(error);
    return [];
  }

  let assetSymbols;
  try {
    assetSymbols = await Apis.instance().db_api().exec('lookup_asset_symbols', [assetIDs]);
  } catch (error) {
    console.log(error);
  }

  const backingSymbolIDs = assetSymbols.map((x) => x.options.core_exchange_rate.quote.asset_id);
  const backingAssetIDs = [...new Set(backingSymbolIDs)];

  let backingSymbols;
  try {
    backingSymbols = await Apis.instance().db_api().exec('lookup_asset_symbols', [backingAssetIDs]);
  } catch (error) {
    console.log(error);
  }

  let responses = [];
  for (let i = 0; i < assetIDs.length; i++) {
    const currentID = assetIDs[i];
    let callOrderResponse;
    try {
      callOrderResponse = await Apis.instance().db_api().exec("get_call_orders", [currentID, 300]);
    } catch (error) {
      console.log(error);
    }

    console.log(`${currentID}: ${callOrderResponse.length}`);

    if (callOrderResponse && callOrderResponse.length > 0) {
      const baseAssetID = callOrderResponse[0].call_price.base.asset_id;
      const currentSymbol = backingSymbols.find((symbol) => symbol.id === baseAssetID);

      const readableCollateral = callOrderResponse.map((obj) => ({
        id: obj.borrower,
        qty: 1,
        value: humanReadableFloat(obj.collateral, currentSymbol.precision)
      }));
      responses = [...responses, ...readableCollateral];
    }
  }

  return responses;
};

const getCollateralHolders = async () => {
  let callOrders;
  try {
    callOrders = await getCallOrders(inputs); // Change these values for your own airdrop!
  } catch (error) {
    console.log(error);
  }

  if (!callOrders || !callOrders.length) {
    console.log("Fetching call orders failed");
    process.exit(0);
  }

  const finalResultValues = [];
  callOrders.forEach((callOrder) => {
    const existingUserIndex = finalResultValues.findIndex((user) => user.id === callOrder.id);
    if (existingUserIndex !== -1) {
      const newValue = { ...finalResultValues[existingUserIndex] };
      newValue.value += callOrder.value;
      newValue.qty += 1;
      finalResultValues[existingUserIndex] = newValue;
    } else {
      finalResultValues.push(callOrder);
    }
  });

  await writeToFile(
    './airdrops/collateralHolders.json',
    finalResultValues.sort((a, b) => b.value - a.value)
  );

  // exit script
  process.exit(0);
};

getCollateralHolders();
