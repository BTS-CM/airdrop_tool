const fs = require('fs');
const assetHolders = require('./fetchedData/assetHolders.json');
const { humanReadableFloat } = require('./lib/common');

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
