/* eslint-disable max-len */
const fs = require('fs').promises;
const { humanReadableFloat } = require('./lib/common');

// CONFIGURE THE FOLLOWING:

const inputs = [
  { base: "BTS", quote: "XBTSX.USDT" },
  { base: "BTS", quote: "USD" },
  { base: "BTS", quote: "GDEX.USDT" },
  { base: "BTS", quote: "HONEST.USD" },
  { base: "BTS", quote: "HERTZ" },
];

// END CONFIGURATION

const writeToFile = async (fileName, data) => {
  console.log(`Writing to ${fileName}`);
  await fs.writeFile(fileName, JSON.stringify(data, null, 4));
};

/**
 * Retrieve a market's order book data & base/quote asset data
 * @param {String} baseSymbol
 * @param {String} quoteSymbol
 * @param {Number} limit
 * @returns {[Promise<Object>]}
 */
const getOrderBookData = async (baseSymbol, quoteSymbol, limit) => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
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
 * @param {Float} avgPrice // also for CER
 * @returns {Array}
 */
const processOrders = (orders, basePrecision, avgPrice) => orders.map((order) => {
  const diff = Math.abs(
    parseFloat(parseFloat(order.price).toFixed(basePrecision)) - parseFloat(parseFloat(avgPrice).toFixed(basePrecision))
  );
  return {
    value: diff > 0.001 * avgPrice
      ? 1 / diff
      : 1 / (diff + humanReadableFloat((avgPrice * 0.001), basePrecision)),
    id: order.owner_id,
    name: order.owner_name,
    qty: 1
  };
});

const getMarketParticipants = async () => {
  let multipleMergedOrders = [];
  for (let j = 0; j < inputs.length; j += 1) {
    const inputBaseSymbol = inputs[j].base;
    const inputQuoteSymbol = inputs[j].quote;

    console.log(`Processing ${inputBaseSymbol}_${inputQuoteSymbol}`);

    let orderBookData;
    try {
      orderBookData = await getOrderBookData(inputBaseSymbol, inputQuoteSymbol, 100); // Change these values for your own airdrop!
    } catch (error) {
      console.log(error);
      continue;
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
      multipleMergedOrders = [...multipleMergedOrders, ...mappedOrders];
      continue;
    }

    // Non smartcoin - use top bid & lowest ask instead of cer
    const topBid = orderBook.bids[0];
    const lowestAsk = orderBook.asks[0];

    const avgPrice = (parseFloat(topBid.price) + parseFloat(lowestAsk.price)) / 2;

    const parsedBids = processOrders(orderBook.bids, base.precision, avgPrice);
    const parsedAsks = processOrders(orderBook.asks, base.precision, avgPrice);

    const mergedOrders = [...parsedBids, ...parsedAsks];
    multipleMergedOrders = [...multipleMergedOrders, ...mergedOrders];
  }

  const finalResultValues = [];
  multipleMergedOrders.forEach((order) => {
    const existingUserIndex = finalResultValues.findIndex((user) => user.id === order.id);
    if (existingUserIndex !== -1) {
      const newValue = { ...finalResultValues[existingUserIndex] };
      newValue.value += order.value;
      newValue.qty += 1;
      finalResultValues[existingUserIndex] = newValue;
    } else {
      finalResultValues.push(order);
    }
  });

  await writeToFile(
    './airdrops/marketParticipants.json',
    finalResultValues.sort((a, b) => b.value - a.value)
  );

  // exit script
  process.exit(0);
};

getMarketParticipants();
