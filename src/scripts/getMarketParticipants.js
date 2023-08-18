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
  { base: "BTS", quote: "CNY" },
  { base: "BTS", quote: "CNY1.0" },
  { base: "BTS", quote: "USD1.0" },
  { base: "BTS", quote: "EUR" },
  { base: "BTS", quote: "EUR1.0" },
  { base: "BTS", quote: "BTC1.0" },
  { base: "BTS", quote: "JPY" },
  { base: "BTS", quote: "GBP" },
  { base: "BTS", quote: "ARS" },
  { base: "BTS", quote: "AUD" },
  { base: "BTS", quote: "CAD" },
  { base: "BTS", quote: "SILVER" },
  { base: "BTS", quote: "GOLD" },
  { base: "BTS", quote: "BTC" },
  { base: "BTS", quote: "TWENTIX" },
  { base: "BTS", quote: "HERO" },
  { base: "BTS", quote: "HONEST.GBP" },
  { base: "BTS", quote: "HONEST.EUR" },
  { base: "BTS", quote: "HONEST.USDSHORT" },
  { base: "BTS", quote: "HONEST.BTCSHORT" },
  { base: "BTS", quote: "HONEST.EOS" },
  { base: "BTS", quote: "HONEST.XRP" },
  { base: "BTS", quote: "HONEST.ADA" },
  { base: "BTS", quote: "HONEST.XAU" },
  { base: "BTS", quote: "HONEST.EOSSHORT" },
  { base: "BTS", quote: "HONEST.XMRSHORT" },
  { base: "BTS", quote: "HONEST.XRPSHORT" },
  { base: "BTS", quote: "HONEST.JPYSHORT" },
  { base: "BTS", quote: "HONEST.CNYSHORT" },
  { base: "BTS", quote: "HONEST.DOTSHORT" },
  { base: "BTS", quote: "HONEST.ETHSHORT" },
  { base: "BTS", quote: "URTHR" },
  { base: "BTS", quote: "SKULD" },
  { base: "BTS", quote: "VERTHANDI" }
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
    }, 333);
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
  let calculatedValue;
  if (diff === 0) {
    calculatedValue = parseFloat(order.base);
  } else if (diff > 0.001 * avgPrice) {
    calculatedValue = (1 / diff) * parseFloat(order.base);
  } else {
    calculatedValue = (1 / (diff + humanReadableFloat((avgPrice * 0.001), basePrecision))) * parseFloat(order.base);
  }

  return {
    value: calculatedValue,
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

    let orderBookData;
    try {
      orderBookData = await getOrderBookData(inputBaseSymbol, inputQuoteSymbol, 300);
    } catch (error) {
      console.log(error);
      continue;
    }

    if (!orderBookData) {
      console.log("Query failure");
      continue;
    }

    const { base, quote, orderBook } = orderBookData;

    if (
      quote.bitasset_data_id
      && (quote.options.core_exchange_rate.base.asset_id === base.id || quote.options.core_exchange_rate.quote.asset_id === base.id)
    ) {
      console.log(`Processing smartcoin market: ${inputBaseSymbol}_${inputQuoteSymbol}`);

      // Market pair is a smartcoin market - use CER
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

    console.log(`Processing UIA market: ${inputBaseSymbol}_${inputQuoteSymbol}`);
    // Use avg of the top bid & lowest ask instead of cer
    let mergedOrders = [];
    if (orderBook.bids.length && orderBook.asks.length) {
      const topBid = orderBook.bids[0];
      const lowestAsk = orderBook.asks[0];
      const avgPrice = (parseFloat(topBid.price) + parseFloat(lowestAsk.price)) / 2;

      const parsedBids = processOrders(orderBook.bids, base.precision, avgPrice ?? topBid.price);
      const parsedAsks = processOrders(orderBook.asks, base.precision, avgPrice ?? lowestAsk.price);

      mergedOrders = [...parsedBids, ...parsedAsks];
    } else if (orderBook.bids.length) {
      const topBid = orderBook.bids[0];
      const parsedBids = processOrders(orderBook.bids, base.precision, topBid.price);
      mergedOrders = [...parsedBids];
    } else if (orderBook.asks.length) {
      const lowestAsk = orderBook.asks[0];
      const parsedAsks = processOrders(orderBook.asks, base.precision, lowestAsk.price);
      mergedOrders = [...parsedAsks];
    } else {
      console.log(`No market orders found for ${inputBaseSymbol}_${inputQuoteSymbol}`);
      continue;
    }

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
