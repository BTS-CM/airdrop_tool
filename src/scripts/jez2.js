const fs = require('fs');
const assetHolders = require('./fetchedData/JEZ.json');
const { humanReadableFloat } = require('./lib/common');

console.log(`Processing ${assetHolders.length} asset holders`)

const output = assetHolders.map((holder) => ({
  name: holder.name,
  id: holder.account_id,
  qty: 1,
  value: humanReadableFloat(holder.amount, 8)
}));

fs.writeFileSync('./airdrops/JEZ_Upload.json', JSON.stringify(output));

/*
  Airdrop #1/1
  1199 accounts (from 1.2.1207813 to 1.2.1819428)
  11990.00000000 HONEST.AGORISM being distributed
  1041.55931 BTS full fee
  208.31186 BTS fee for lifetime members
  33564 / 409600 bytes (8.19 %)
*/