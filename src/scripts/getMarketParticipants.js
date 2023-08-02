/* eslint-disable max-len */
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

/**
 * process orders, return airdrop data
 * @param {Array} orders
 * @param {Number} basePrecision
 * @param {Float} avgPrice
 * @returns {Array}
 */
const processOrders = (orders, basePrecision, avgPrice) => orders.map((order) => ({
  value: 1 / (
    Math.abs(
      parseFloat(parseFloat(order.price).toFixed(basePrecision)) - parseFloat(parseFloat(avgPrice).toFixed(basePrecision))
    ) + humanReadableFloat(1, basePrecision)
  ),
  id: order.owner_id,
  name: order.owner_name,
  qty: 1
}));

const getMarketParticipants = async () => {
  let orderBookData;
  try {
    orderBookData = await getOrderBookData("BTS", "XBTSX.USDT", 100);
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
    const mappedOrders = processOrders(mergedAsksBids, base.precision, calculatedCer);

    writeToFile(
      './airdrops/smartcoinMarketParticipants.json',
      mappedOrders.sort((a, b) => b.value - a.value)
    );
    return;
  }

  // Non smartcoin - use top bid & lowest ask instead of cer
  const topBid = orderBook.bids[0];
  const lowestAsk = orderBook.asks[0];

  const avgPrice = (parseFloat(topBid.price) + parseFloat(lowestAsk.price)) / 2;

  const parsedBids = processOrders(orderBook.bids, base.precision, avgPrice);
  const parsedAsks = processOrders(orderBook.asks, base.precision, avgPrice);

  const mergedOrders = [...parsedBids, ...parsedAsks];
  const finalResultValues = [];

  // iterate through mergedOrders and tally the sum of values for each unique user id
  mergedOrders.forEach((order) => {
    const existingUserIndex = finalResultValues.findIndex((user) => user.id === order.id);
    if (existingUserIndex !== -1) {
      const newValue = { ...finalResultValues[existingUserIndex] };
      newValue.value += order.value;
      finalResultValues[existingUserIndex] = newValue;
    } else {
      finalResultValues.push(order);
    }
  });

  console.log({ bids: parsedBids.find((acc) => acc.id === "1.2.1799499"), asks: parsedAsks.find((acc) => acc.id === "1.2.1799499") });

  writeToFile(
    './airdrops/marketParticipants.json',
    finalResultValues.sort((a, b) => b.value - a.value)
  );
};

getMarketParticipants();
