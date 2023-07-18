const fs = require('fs');
const { humanReadableFloat } = require('./lib/common');

const url = 'https://api.bitshares.ws/openexplorer/witnesses?status=all';
const outputFile = './airdrops/witnesses.json';

const getWitnesses = async () => {
  const response = await fetch(url);
  return response.json();
};

const writeToFile = (data) => {
  console.log(`Writing to ${outputFile}`);
  fs.writeFileSync(outputFile, JSON.stringify(data));
};

/**
 * Convert the token's blockchain representation into a human readable quantity
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
function humanReadableFloat(satoshis, precision) {
  return parseFloat((satoshis / 10 ** precision).toFixed(precision));
}

const main = async () => {
  const witnesses = await getWitnesses();
  const witnessesAirdrop = witnesses.map((witness) => ({
    id: witness.witness_account,
    qty: 1,
    value: humanReadableFloat(witness.total_votes, 5)
  }));
  //console.log({ witnessesAirdrop });
  writeToFile(witnessesAirdrop);
};

main();
