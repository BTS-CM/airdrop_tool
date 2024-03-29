const { Vector3, Line3 } = require('three');

/**
 * Convert the token's blockchain representation into a human readable quantity
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
function humanReadableFloat(satoshis, precision) {
  return parseFloat((satoshis / 10 ** precision).toFixed(precision));
}

/**
 * Splitting arrays into chunks
 * @param {Array} arr
 * @param {Number} chunkSize
 * @returns {Array}
 */
function chunk(arr, chunkSize) {
  if (chunkSize <= 0 || chunkSize > arr.length) {
    throw new Error("Invalid chunk size");
  }

  const refArr = (arr).toLocaleString('fullwide', { useGrouping: false });

  const producedChunks = [];
  for (let i = 0; i < refArr.length; i += chunkSize) {
    producedChunks.push(refArr.slice(i, i + chunkSize));
  }

  return producedChunks.filter((x) => x.length === chunkSize);
}

/**
 * Filter 0's then parseInt to avoid "010" -> 8 issue
 * @param {String} parseTarget
 */
function filterParseInt(parseTarget) {
  const vals = parseTarget.split("");

  let finalValue;
  for (let i = 0; i < vals.length; i++) {
    if (parseInt(vals[i], 10) > 0) {
      finalValue = parseTarget.substring(i, vals.length);
      break;
    } else {
      continue;
    }
  }

  return !finalValue ? 0 : parseInt(finalValue, 10);
}

/**
 * Util for generating ranges of numbers
 * @param {Number} start
 * @param {Number} end
 * @returns
 */
function range(start, end) {
  return new Array(end - start).fill().map((d, i) => i + start);
}

/**
 * Extract ticket numbers from multiple points along a line
 * @param {Number} quantity
 * @param {Line3} targetLine
 * @param {Number} increment
 * @returns {Array}
 */
function extractTickets(quantity, targetLine, increment) {
  const chosenTickets = [];
  for (let i = 1; i <= quantity; i++) {
    const resultPlaceholder = new Vector3(0, 0, 0);
    const calculated = targetLine.at(increment * i, resultPlaceholder);
    const computed = calculated.toArray();
    let ticketValue = 0;

    const x = computed[0];
    const y = computed[1];
    const z = computed[2];
    ticketValue = (z * 1000000) + ((y * 1000) + x);

    chosenTickets.push(
      parseInt(ticketValue, 10),
    );
  }
  return chosenTickets;
}

/**
 * // 0 - 999,999,999
 * // 24 draws
 * @param {Array} chunks
 * @returns {Array}
 */
function forward(chunks) {
  return chunks.map((x) => filterParseInt(x));
}

/**
 * // 0 - 999,999,999
 * // 24 draws
 * @param {Array} chunks
 * @returns {Array}
 */
function reverse(chunks) {
  return chunks.map((x) => filterParseInt(x.split("").reverse().join("")));
}

/**
 * Reverse chunks then do a PI-like calculation
 * Draws 24 tickets
 * @param {Array} chunks
 * @returns {Array}
 */
function reverse_pi(chunks) {
  const piChunks = [];
  const reversedChunks = chunks.map((x) => filterParseInt(x.split("").reverse().join("")));

  for (let i = 0; i < reversedChunks.length; i++) {
    const current = parseInt(Math.sqrt(reversedChunks[i]), 10);

    for (let y = i; y < reversedChunks.length - i; y++) {
      const nextValue = parseInt(Math.sqrt(reversedChunks[y]), 10);
      piChunks.push(
        parseInt((current * nextValue) * Math.PI, 10),
      );
    }
  }

  return piChunks;
}

/**
 * Does a PI-like calculation to chunks
 * Draws 24 tickets
 * @param {Array} chunks
 * @returns {Array}
 */
function forward_pi(chunks) {
  const piChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    const current = parseInt(Math.sqrt(filterParseInt(chunks[i])), 10);

    for (let y = i; y < chunks.length - i; y++) {
      const nextValue = parseInt(Math.sqrt(filterParseInt(chunks[y])), 10);
      piChunks.push(
        parseInt((current * nextValue) * Math.PI, 10),
      );
    }
  }
  return piChunks;
}

/**
 * Does a PI-like calculation to chunks
 * 0 - 997,002,999
 * 72 draws
 * @param {String} filtered_signature
 * @returns {Array}
 */
function cubed(filtered_signature) {
  const smallerChunks = chunk(filtered_signature, 3).map((x) => filterParseInt(x));
  const cubedChunks = smallerChunks.map((x) => parseInt(x * x * x, 10));
  return cubedChunks;
}

/**
 * Calculate the avg x/y/z coordinates -> draw lines to this from each vector => reward those on line
 * 0 - 997,002,999 (extend via z axis)
 * @param {Array} chunks
 * @param {Number} maxDistance
 * @returns {Array}
 */
function avg_point_lines(chunks, maxDistance) {
  const vectorChunks = chunks.map((initialChunk) => chunk(initialChunk, 3));

  let xTally = 0;
  let yTally = 0;
  let zTally = 0;
  for (let i = 0; i < vectorChunks.length; i++) {
    const current = vectorChunks[i];
    xTally += filterParseInt(current[0]);
    yTally += filterParseInt(current[1]);
    zTally += filterParseInt(current[2]);
  }

  const avgVector = new Vector3(
    parseInt(xTally / vectorChunks.length, 10),
    parseInt(yTally / vectorChunks.length, 10),
    parseInt(zTally / vectorChunks.length, 10),
  );

  const avg_lines = vectorChunks.map((vector) => {
    const current = new Vector3(
      filterParseInt(vector[0]),
      filterParseInt(vector[1]),
      filterParseInt(vector[2]),
    );
    return new Line3(current, avgVector);
  });

  let chosenTickets = [];
  for (let i = 0; i < avg_lines.length; i++) {
    const currentLine = avg_lines[i];
    const qty = parseInt((currentLine.distanceSq() / maxDistance) * 999, 10);
    const currentChosenTickets = extractTickets(qty, currentLine, 0.001);
    chosenTickets = [...chosenTickets, ...currentChosenTickets];
  }

  console.log(`avg_point_lines: ${chosenTickets.length} tickets chosen`);
  return chosenTickets;
}

/**
 * Picks alien blood splatter spots; it burns directly down through the hull
 * 0 - 997,002,999 (extend via z axis)
 * @param {String} filtered_signature
 * @returns {Array}
 */
function alien_blood(filtered_signature) {
  const initHullChunks = chunk(filtered_signature, 6);

  let corrasionTickets = [];
  for (let i = 0; i < initHullChunks.length; i++) {
    const currentHullChunk = initHullChunks[i];

    const hullFragments = chunk(currentHullChunk, 3);
    const splatX = filterParseInt(hullFragments[0]);
    const splatY = filterParseInt(hullFragments[1]);

    const splatterPoint = new Vector3(splatX, splatY, 0);
    const coolingZone = new Vector3(splatX, splatY, 999);
    const corrasion = new Line3(splatterPoint, coolingZone);

    const currentChosenTickets = extractTickets(999, corrasion, 0.001);
    corrasionTickets = [...corrasionTickets, ...currentChosenTickets];
  }

  console.log(`The alien bled on ${initHullChunks.length} hull tiles, resulting in ${corrasionTickets.length} melted tickets.`);
  return corrasionTickets;
}

/**
 * path of ball bouncing in matrix -> pick tickets along path
 * 0 - 997,002,999 (extend via z axis)
 * @param {Array} initialChunks
 * @param {Number} maxDistance
 * @returns {Array}
 */
function bouncing_ball(initialChunks, maxDistance) {
  const vectors = initialChunks.map((nineDigits) => {
    const vectorChunks = chunk(nineDigits, 3);
    return new Vector3(
      filterParseInt(vectorChunks[0]),
      filterParseInt(vectorChunks[1]),
      filterParseInt(vectorChunks[2]),
    );
  });

  const bouncingVectors = [];
  for (let i = 0; i < vectors.length; i++) {
    const currentVector = vectors[i];
    const cvArray = currentVector.toArray();

    const nextVector = vectors[i + 1];
    if (!nextVector) {
      continue;
    }

    const nvArray = nextVector.toArray();
    if (nvArray[2] <= cvArray[2]) {
      // going down
      const xAxis = (parseInt(nvArray[0], 10) + parseInt(cvArray[0], 10)) / 2;
      const yAxis = (parseInt(nvArray[1], 10) + parseInt(cvArray[1], 10)) / 2;

      bouncingVectors.push(
        new Vector3(xAxis, yAxis, 0),
      );
    }

    bouncingVectors.push(nextVector);
  }

  const lastVector = bouncingVectors.slice(-1)[0].toArray();
  lastVector[2] = 0;
  const finalVector = new Vector3(lastVector[0], lastVector[1], lastVector[2]);
  bouncingVectors.push(finalVector); // ball falls to the ground at the end

  const pathOfBall = [];
  for (let i = 0; i < bouncingVectors.length - 1; i++) {
    // Create lines between each bounce
    const currentVector = bouncingVectors[i];
    const nextVector = bouncingVectors[i + 1];

    const distance = currentVector.distanceToSquared(nextVector);
    pathOfBall.push({
      line: new Line3(currentVector, nextVector),
      distance,
      qtyPicks: distance > 0 ? parseInt((distance / maxDistance) * 999, 10) : 0,
    });
  }

  let chosenTickets = [];
  for (let i = 0; i < pathOfBall.length; i++) {
    const currentLine = pathOfBall[i];
    const currentChosenTickets = extractTickets(currentLine.qtyPicks, currentLine.line, 0.001);
    chosenTickets = [...chosenTickets, ...currentChosenTickets];
  }

  console.log(`The ball bounced ${pathOfBall.length - 1} times, resulting in ${chosenTickets.length} chosen tickets.`);
  return chosenTickets;
}

/**
 * Give each ticket holding account a free ticket
 * @param {Array} leaderboardJSON
 * @returns {Array}
 */
function freebie(leaderboardJSON) {
  return leaderboardJSON.map((user) => user.range.from);
}

/**
 * Give each account which holds a ticket with forever duration a free ticket
 * Require a minimum of 1 BTS locked forever to avoid dust locks
 * @param {Array} leaderboardJSON
 * @param {Array} relevantTickets
 * @returns {Array}
 */
function forever_freebie(leaderboardJSON, relevantTickets) {
  const foreverTickets = relevantTickets
    .filter((ticket) => ticket.target_type === "lock_forever" && humanReadableFloat(ticket.amount.amount, 5) >= 1)
    .map((validTicket) => validTicket.account);

  const uniqueAccounts = [...new Set(foreverTickets)]
    .map((user) => (leaderboardJSON.find((x) => x.id === user)?.range?.from ?? null))
    .filter((user) => user !== null);

  return uniqueAccounts;
}

/**
 * Provides a free ticket to LTM holders
 * @param {Array} initialChunks
 * @returns {Number}
 */
function ltm_freebie(leaderboardJSON) {
  const ltm_tickets = leaderboardJSON
    .filter((user) => user.account.ltm)
    .map((user) => (user.range.from));
  return ltm_tickets;
}

/**
 * Provides a free ticket to asset holders
 * @param {Array} leaderboardJSON
 * @param {String} freebieAsset
 * @returns {Array}
 */
function asset_freebie(leaderboardJSON, freebieAsset) {
  const asset_tickets = leaderboardJSON
    .filter((user) => user.balances.find((asset) => asset.asset_id === freebieAsset))
    .map((user) => user.range.from);
  return asset_tickets;
}

/**
 * Converts the filtered hash into a single ticket
 * TODO: Use smaller chunks to avoid too large a drawn ticket number
 * @param {Array} initialChunks
 * @returns {Number}
 */
/*
function single_winner(initialChunks) {
  let chunkSum = initialChunks.reduce((accumulator, chunk) => accumulator + filterParseInt(chunk), 0);
  return [((filterParseInt(chunkSum) / 3600570502) % 1) * 3600570502];
}
*/

/**
 * Shooting fish in a barrel is totally fair & we can prove it.
 * The bullet hits the barrel and breaks into multiple fragments which each damage fish in their way
 * 0 to 997,002,999
 * Could increase to 0 to 9,979,011,999 if we increase the z axis to 4 digits from 3.
 * Many draws
 * @param {Array} initialChunks
 * @param {String} projectile
 * @param {String} splinter
 * @returns {Array}
 */
function barrel_of_fish(initialChunks, maxDistance, projectile, splinter) {
  const pointOfImpact = chunk(initialChunks[0], 3);

  const poiVector = new Vector3(
    filterParseInt(pointOfImpact[0]),
    filterParseInt(pointOfImpact[1]),
    filterParseInt(pointOfImpact[2])
  );

  const endVectors = splinter === 'yes'
    ? initialChunks.slice(1)
    : [initialChunks.slice(1)[0]];

  const projectileDepth = projectile === 'beam'
    ? 999
    : 333;

  let obliteratedFish = [];
  for (let y = 0; y < endVectors.length; y++) {
    const end = chunk(endVectors[y], 3);

    const endPoint = new Vector3(
      filterParseInt(end[0]),
      filterParseInt(end[1]),
      filterParseInt(end[2])
    );
    const path = new Line3(poiVector, endPoint);

    const fishInWay = parseInt((path.distanceSq() / maxDistance) * projectileDepth, 10);

    const currentChosenTickets = extractTickets(fishInWay, path, 0.001);
    obliteratedFish = [...obliteratedFish, ...currentChosenTickets];
  }

  console.log(`1 entry point, ${endVectors.length} shards, ${obliteratedFish.length} fish obliterated 🐟🎣🍴`);
  return [...obliteratedFish];
}

/**
 * Assigning tokens to ticket holders who have voted for the specified witnesses
 * @param {Array} leaderboardJSON
 * @param {Object} witnessVoteData
 */
function witness_vote(leaderboardJSON, witnessVoteData) {
  const { validWitnessVotes, chosenWitnessAccounts, chosenWitnessType } = witnessVoteData;

  const matchingVotes = validWitnessVotes
    .filter((vote) => chosenWitnessAccounts.includes(vote.witness_account))
    .map((validVote) => {
      const { total_votes, userID, witness_account } = validVote;
      const { from, to } = leaderboardJSON.find((user) => user.id === userID).range;
      return from;
    });

  return [...new Set(matchingVotes)];
}

/**
 * Assigning tokens to ticket holders who have voted for the specified committee members
 * @param {Object} committeeVoteData
 */
function committee_vote(leaderboardJSON, committeeVoteData) {
  const { validCommitteeVotes, chosenCommitteeAccounts, chosenCommitteeType } = committeeVoteData;

  const matchingVotes = validCommitteeVotes
    .filter((vote) => chosenCommitteeAccounts.includes(vote.committee_member_account))
    .map((validVote) => {
      const { userID } = validVote;
      const { from } = leaderboardJSON.find((user) => user.id === userID).range;
      return from;
    });

  return [...new Set(matchingVotes)];
}

/**
 * Assigning tokens to ticket holders who have voted for the specified workers
 * @param {Object} workerVoteData
 */
function worker_vote(leaderboardJSON, workerVoteData) {
  const { validWorkerVotes, chosenWorkers } = workerVoteData;

  const matchingVotes = validWorkerVotes
    .filter((vote) => chosenWorkers.includes(vote.id))
    .map((validVote) => {
      const { userID } = validVote;
      const { from } = leaderboardJSON.find((user) => user.id === userID).range;
      return from;
    });

  return [...new Set(matchingVotes)];
}

/**
 * Given a ticket algorithm and signature, return chosen tickets.
 * @param {String} algoType
 * @param {String} filtered_signature
 * @param {Array} leaderboardJSON
 * @param {Array} relevantTickets
 * @param {String} bof_projectile
 * @param {String} bof_splinter
 * @param {String} freebieAsset
 * @param {Object} witnessVoteData
 * @param {Object} committeeVoteData
 * @param {Object} workerVoteData
 * @returns {Array}
 */
function getTickets(
  algoType,
  filtered_signature,
  leaderboardJSON,
  relevantTickets,
  bof_projectile = null,
  bof_splinter = null,
  freebieAsset = null,
  witnessVoteData = null,
  committeeVoteData = null,
  workerVoteData = null
) {
  const initialChunks = chunk(filtered_signature, 9);

  const minVector = new Vector3(0, 0, 0);
  const maxVector = new Vector3(999, 999, 999);
  const maxDistance = minVector.distanceToSquared(maxVector);

  switch (algoType) {
    case "forward":
      return forward(initialChunks);
    case "reverse":
      return reverse(initialChunks);
    case "pi":
      return forward_pi(initialChunks);
    case "reverse_pi":
      return reverse_pi(initialChunks);
    case "cubed":
      return cubed(filtered_signature);
    case "avg_point_lines":
      return avg_point_lines(initialChunks, maxDistance);
    case "alien_blood":
      return alien_blood(filtered_signature);
    case "bouncing_ball":
      return bouncing_ball(initialChunks, maxDistance);
    case "freebie":
      return freebie(leaderboardJSON);
    case "ltm_freebie":
      return ltm_freebie(leaderboardJSON);
    case "forever_freebie":
      return forever_freebie(leaderboardJSON, relevantTickets);
    case "barrel_of_fish":
      return barrel_of_fish(initialChunks, maxDistance, bof_projectile, bof_splinter);
    case "asset_freebie":
      return asset_freebie(leaderboardJSON, freebieAsset);
    case "witness_vote_freebie":
      return witness_vote(leaderboardJSON, witnessVoteData);
    case "committee_vote_freebie":
      return committee_vote(leaderboardJSON, committeeVoteData);
    case "worker_vote_freebie":
      return worker_vote(leaderboardJSON, workerVoteData);
    default:
      console.log(`Unknown algo type: ${algoType}`);
      return [];
  }
}

/**
 * Return winning tickets from multiple optional algorithms
 * @param {String} filtered_signature
 * @param {Array} distributions
 * @param {String} deduplicate
 * @param {String} alwaysWinning
 * @param {Array} leaderboardJSON
 * @param {Array} relevantAssets
 * @param {Array} relevantTickets
 * @param {String} bof_projectile
 * @param {String} bof_splinter
 * @param {String} freebieAsset
 * @param {String} freebieAssetQty
 * @param {Object} witnessVoteData
 * @param {Object} committeeVoteData
 * @param {Object} workerVoteData
 * @returns {Object}
 */
function executeCalculation(
  filtered_signature,
  distributions,
  deduplicate,
  alwaysWinning,
  leaderboardJSON,
  relevantAssets,
  relevantTickets,
  bof_projectile,
  bof_splinter,
  freebieAsset,
  freebieAssetQty,
  witnessVoteData,
  committeeVoteData,
  workerVoteData
) {
  const generatedNumbers = {};
  let winningTickets = [];
  const winners = {};

  for (let i = 0; i < distributions.length; i++) {
    // Calculate winning tickets for each algo chosen, 1 at a time
    const algoType = distributions[i];
    let algoTickets = getTickets(
      algoType,
      filtered_signature,
      leaderboardJSON,
      relevantTickets,
      bof_projectile,
      bof_splinter,
      freebieAsset,
      witnessVoteData,
      committeeVoteData,
      workerVoteData
    );

    if (deduplicate === "Yes") {
      // User chose to avoid unique tickets being chosen multiple times
      algoTickets = [...new Set(algoTickets)];
      // eslint-disable-next-line no-loop-func
      algoTickets = algoTickets.filter((item) => !winningTickets.includes(item));
    }

    if (alwaysWinning === "Yes") {
      // User chose for tickets to always find a winner
      const lastTicketVal = leaderboardJSON.at(-1).range.to;
      algoTickets = algoTickets.map((num) => {
        if (num <= lastTicketVal) {
          return num;
        }

        const adjustedNum = num - (Math.floor(num / lastTicketVal) * lastTicketVal);

        return adjustedNum;
      });
    }

    winningTickets = winningTickets.concat(algoTickets);
    generatedNumbers[algoType] = algoTickets;
  }

  // Iterate through
  for (const [key, value] of Object.entries(generatedNumbers)) {
    const algo = key;
    const ticketNumbers = value;

    const foundAsset = algo === "asset_freebie"
      ? relevantAssets.find((x) => x.id === freebieAsset)
      : null;

    for (let i = 0; i < ticketNumbers.length; i++) {
      const currentNumber = ticketNumbers[i];
      const foundUser = leaderboardJSON
        .find((x) => currentNumber >= x.range.from && currentNumber <= x.range.to);

      if (foundUser) {
        const assetBalance = algo === "asset_freebie"
          ? foundUser.balances.find((x) => x.asset_id === freebieAsset)
          : null;

        let ticketValue = 1;
        if (algo === "asset_freebie" && freebieAssetQty === "balance" && assetBalance && foundAsset) {
          ticketValue = humanReadableFloat(
            assetBalance.amount,
            foundAsset.precision
          );
        } else if (algo === "witness_vote_freebie") {
          const { validWitnessVotes, chosenWitnessAccounts, chosenWitnessType } = witnessVoteData;
          const userVotes = validWitnessVotes
            .filter(
              (vote) => vote.userID === foundUser.id
                        && chosenWitnessAccounts.includes(vote.witness_account)
            )
            .map((vote) => (chosenWitnessType === "balance" ? foundUser.amount : 1))
            .reduce((a, b) => a + b, 0);

          ticketValue = userVotes;
        } else if (algo === "committee_vote_freebie") {
          const {
            validCommitteeVotes,
            chosenCommitteeAccounts,
            chosenCommitteeType
          } = committeeVoteData;
          const userVotes = validCommitteeVotes
            .filter(
              (vote) => vote.userID === foundUser.id
                        && chosenCommitteeAccounts.includes(vote.committee_member_account)
            )
            .map((vote) => (chosenCommitteeType === "balance" ? foundUser.amount : 1))
            .reduce((a, b) => a + b, 0);
          ticketValue = userVotes;
        } else if (algo === "worker_vote_freebie") {
          const { validWorkerVotes, chosenWorkers, chosenWorkersType } = workerVoteData;
          const userVotes = validWorkerVotes
            .filter(
              (vote) => vote.userID === foundUser.id
                        && chosenWorkers.includes(vote.id)
            )
            .map((vote) => (chosenWorkersType === "balance" ? foundUser.amount : 1))
            .reduce((a, b) => a + b, 0);
          ticketValue = userVotes;
        }

        const winningTicket = {
          ticket: currentNumber,
          algo,
          value: ticketValue
        };

        winners[foundUser.id] = Object.prototype.hasOwnProperty.call(winners, foundUser.id)
          ? [...winners[foundUser.id], winningTicket]
          : [winningTicket];
      }
    }
  }

  const summary = [];
  for (const [key, value] of Object.entries(winners)) {
    const currentPercent = ((value.length / winningTickets.length) * 100).toFixed(5);
    summary.push({
      id: key,
      tickets: value.sort((a, b) => a.ticket - b.ticket),
      qty: value.length,
      ticketsValue: value.reduce((a, b) => a + b.value, 0),
      percent: currentPercent,
    });
  }

  // Return the following for storage in the zustand store
  return { summary, generatedNumbers };
}

module.exports = {
  executeCalculation, // main calculation
  forward,
  reverse,
  forward_pi,
  reverse_pi,
  cubed,
  avg_point_lines,
  alien_blood,
  bouncing_ball,
  freebie,
  asset_freebie,
  // single_winner,
};
