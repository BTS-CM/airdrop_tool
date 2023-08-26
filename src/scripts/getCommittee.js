const fs = require('fs');
const { humanReadableFloat } = require('./lib/common');

const url = 'https://api.bitshares.ws/openexplorer/committee_members';
const outputFile = './airdrops/committee_members.json';

const getCommittee = async () => {
  const response = await fetch(url);
  return response.json();
};

const writeToFile = (data) => {
  console.log(`Writing to ${outputFile}`);
  fs.writeFileSync(outputFile, JSON.stringify(data));
};

const main = async () => {
  const committee = await getCommittee();
  const committeeAirdrop = committee.map((member) => ({
    id: member.committee_member_account,
    qty: 1,
    value: humanReadableFloat(member.total_votes, 5)
  }));
  writeToFile(committeeAirdrop);
};

main();
