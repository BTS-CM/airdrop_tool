const fs = require('fs');
const assetHolders = require('./fetchedData/assetHolders.json');

/**
 * Convert the token's blockchain representation into a human readable quantity
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
function humanReadableFloat(satoshis, precision) {
  return parseFloat((satoshis / 10 ** precision).toFixed(precision));
}

const output = assetHolders.map((holder) => ({
  name: holder.name,
  id: holder.account_id,
  qty: 1,
  value: humanReadableFloat(holder.amount, 5)
}));

fs.writeFileSync('./airdrops/processedAssetHolders.json', JSON.stringify(output));

const csv = output.map(({
  name, id, qty, value
}) => `${name},${id},${qty},${value}`).join('\n');
fs.writeFileSync('./exports/processedAssetHolders.csv', `Name,ID,Quantity,Value\n${csv}`);

console.log('CSV file created successfully');
