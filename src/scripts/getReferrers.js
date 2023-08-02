const fs = require('fs');
const inputUsers = require('./fetchedData/assetHolders.json'); // [{"name":"accountName","account_id":"1.2.x","amount":"12345"}]

const { getObjects } = require('./lib/directQueries');

const getUserReferralQty = async (accountName) => {
  console.log(`Fetching refferral qty for ${accountName}`);
  let referralQty;
  try {
    referralQty = await fetch(`https://api.bitshares.ws/openexplorer/referrer_count?account_id=${accountName}`);
  } catch (error) {
    console.log(error);
    return null;
  }

  const responseJSON = await referralQty.json();

  return responseJSON ?? null;
};

const writeToFile = (fileName, data) => {
  console.log(`Writing to ${fileName}`);
  fs.writeFileSync(fileName, JSON.stringify(data, null, 4));
};

const main = async () => {
  const retrievedReferralQtyData = [];
  for (let i = 0; i < inputUsers.slice(0, 10).length; i++) {
    const currentUser = inputUsers[i];
    let referralQty;
    try {
      referralQty = await getUserReferralQty(currentUser.name);
    } catch (error) {
      console.log(error);
      continue;
    }

    if (!referralQty) {
      continue;
    }

    retrievedReferralQtyData.push({
      id: currentUser.account_id,
      name: currentUser.name,
      qty: 1,
      value: referralQty
    });
  }

  writeToFile(
    './airdrops/asset_holder_referral_quantities.json',
    retrievedReferralQtyData.sort((a, b) => b.value - a.value)
  );

  const userIDs = inputUsers.slice(0, 10).map((user) => user.account_id);

  let retrievedUserObjects;
  try {
    retrievedUserObjects = await getObjects("wss://node.xbts.io/ws", "bitshares", userIDs);
  } catch (error) {
    console.log({ error, location: "getObjects", userIDs });
  }

  if (!retrievedUserObjects) {
    return;
  }

  const accountReferralAccounts = retrievedUserObjects.map((user) => user.referrer);
  const tallyReferralAccounts = (referralAccounts) => {
    const tally = {};
    referralAccounts.forEach((account) => {
      tally[account] = (tally[account] || 0) + 1;
    });
    return tally;
  };

  const referralAccountTally = tallyReferralAccounts(accountReferralAccounts);
  const referralAirdrop = Object.entries(referralAccountTally)
    .map(([account, qty]) => ({
      id: account,
      qty: 1,
      value: qty
    }));

  writeToFile(
    './airdrops/referrers_of_asset_holders.json',
    referralAirdrop.sort((a, b) => b.value - a.value)
  );

  // exit script
  process.exit(0);
};

main();
