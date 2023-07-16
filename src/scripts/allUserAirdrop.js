const fs = require('fs');

const arr = [];
const userQuantity = 6000;

for (let i = 1; i <= userQuantity; i++) {
  arr.push({ id: `1.2.${i}`, qty: 1, value: 1 });
}

fs.writeFileSync('./airdrops/allUserAirdrop.json', JSON.stringify(arr));
