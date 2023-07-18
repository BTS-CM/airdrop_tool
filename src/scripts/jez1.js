const fs = require('fs');

const assetId = '1.3.6301'; // Replace with your asset id
const limit = 100; // Max limit on the asset holders API
const totalHolders = 5000; // How many holders you want to fetch
const outputFile = './fetchedData/JEZ.json';

const getAssetHolders = async (start) => {
  const url = `https://api.bitshares.ws/openexplorer/asset_holders?asset_id=${assetId}&start=${start}&limit=${limit}`;
  const response = await fetch(url);
  return response.json();
};

const getAllAssetHolders = async () => {
  const allHolders = [];
  for (let i = 0; i < totalHolders / limit; i++) {
    console.log(`Fetching ${i * limit} to ${(i + 1) * limit}`);
    let assetHolders;
    try {
      assetHolders = await getAssetHolders(i * limit);
    } catch (error) {
      console.log(error);
      break;
    }
    allHolders.push(...assetHolders);
  }
  return allHolders;
};

const writeToFile = (data) => {
  console.log(`Writing to ${outputFile}`);
  fs.writeFileSync(outputFile, JSON.stringify(data));
};

const main = async () => {
  const allHolders = await getAllAssetHolders();
  writeToFile(allHolders);
};

main();
