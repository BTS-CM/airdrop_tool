const fs = require('fs');
const { humanReadableFloat } = require('./lib/common');

const writeToFile = (fileName, data) => {
  console.log(`Writing to ${fileName}`);
  fs.writeFileSync(fileName, JSON.stringify(data, null, 4));
};

/**
 * Retrieve a market's order book data & base/quote asset data
 * @param {String} baseSymbol
 * @param {String} quoteSymbol
 * @param {Number} limit
 * @returns {[Promise<Object>]}
 */
const getOrderBookData = async (baseSymbol, quoteSymbol, limit) => {
  let getBase;
  try {
    getBase = await fetch(`https://api.bitshares.ws/openexplorer/asset?asset_id=${baseSymbol}`);
  } catch (error) {
    console.log(error);
    return null;
  }

  const base = await getBase.json();

  let getQuote;
  try {
    getQuote = await fetch(`https://api.bitshares.ws/openexplorer/asset?asset_id=${quoteSymbol}`);
  } catch (error) {
    console.log(error);
    return null;
  }

  const quote = await getQuote.json();

  let getOrderBook;
  try {
    getOrderBook = await fetch(`https://api.bitshares.ws/openexplorer/order_book?base=${baseSymbol}&quote=${quoteSymbol}&limit=${limit}`);
  } catch (error) {
    console.log(error);
    return null;
  }

  const orderBook = await getOrderBook.json();

  return {
    base,
    quote,
    orderBook
  };
};

const main = async () => {
  let orderBookData;
  try {
    orderBookData = await getOrderBookData("BTS", "USD", 100);
  } catch (error) {
    console.log(error);
    return;
  }

  const { base, quote, orderBook } = orderBookData;

  if (quote.bitasset_data) {
    // Asset is a smartcoin - use CER
    const baseCerValue = humanReadableFloat(
      quote.options.core_exchange_rate.base.amount,
      quote.precision
    );
    const quoteCerValue = humanReadableFloat(
      quote.options.core_exchange_rate.quote.amount,
      base.precision
    );
    const calculatedCer = quoteCerValue / baseCerValue; // USD/BTS == 20.79002079

    const mergedAsksBids = [...orderBook.bids, ...orderBook.asks];
    const mappedOrders = mergedAsksBids.map((order) => ({
      value: 1 / Math.abs(
        parseFloat(parseFloat(order.price).toFixed(base.precision)) - calculatedCer
      ),
      id: order.owner_id,
      name: order.owner_name,
      qty: 1
    }));

    writeToFile(
      './airdrops/marketParticipants.json',
      mappedOrders.sort((a, b) => b.value - a.value)
    );
  }
};

main();
