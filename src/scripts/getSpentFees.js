const fs = require('fs');
const inputUsers = require('./fetchedData/assetHolders.json'); // [{"name":"accountName","account_id":"1.2.x","amount":"12345"}]

const outputFile = './airdrops/fee_distro.json';

const fromDate = '2023-01-01'; // YYYY-MM-DD
const targetSymbol = 'BTS';
const targetPrecision = 5; // 5 for BTS

const getUserFees = async (accountName) => {
  console.log(`Fetching fees for ${accountName}`);
  let feeRes;
  try {
    feeRes = await fetch(`https://api.bitshares.ws/history/paidfees?account=${accountName}&from_date=${fromDate}&to_date=now&show_ops=false`);
  } catch (error) {
    console.log(error);
    return null;
  }

  const responseJSON = await feeRes.json();

  return responseJSON ?? null;
};

const writeToFile = (data) => {
  console.log(`Writing to ${outputFile}`);
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 4));
};

const main = async () => {
  const retrievedFeeData = [];
  for (let i = 0; i < inputUsers.slice(0, 10).length; i++) {
    const currentUser = inputUsers[i];
    let thisRes;
    try {
      thisRes = await getUserFees(currentUser.name);
    } catch (error) {
      console.log(error);
      continue;
    }

    if (thisRes) {
      const userPaidFees = thisRes[currentUser.name].paid_fees;
      if (userPaidFees.length) {
        const foundFees = userPaidFees.find((fee) => fee.symbol === targetSymbol);
        if (foundFees) {
          retrievedFeeData.push({
            id: currentUser.account_id,
            name: currentUser.name,
            qty: 1,
            value: parseFloat((foundFees.float).toFixed(targetPrecision))
          });
        }
      } else {
        retrievedFeeData.push({
          id: currentUser.account_id,
          name: currentUser.name,
          qty: 1,
          value: 0
        });
      }
    } else {
      retrievedFeeData.push({
        id: currentUser.account_id,
        name: currentUser.name,
        qty: 1,
        value: 0
      });
    }
  }

  writeToFile(retrievedFeeData.sort((a, b) => b.value - a.value));
};

main();
