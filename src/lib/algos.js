import { Vector3, Line3 } from 'three';

/**
 * Splitting arrays into chunks
 * @param {Array} arr
 * @param {Number} chunkSize
 * @returns {Array}
 */
function chunk(arr, chunkSize) {
  if (chunkSize <= 0 || chunkSize > arr.length) {
    throw "Invalid chunk size";
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
    if (parseInt(vals[i]) > 0) {
      finalValue = parseTarget.substring(i, vals.length);
      break;
    } else {
      continue;
    }
  }

  return !finalValue ? 0 : parseInt(finalValue);
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
      parseInt(ticketValue),
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
    const current = parseInt(Math.sqrt(reversedChunks[i]));

    for (let y = i; y < reversedChunks.length - i; y++) {
      const nextValue = parseInt(Math.sqrt(reversedChunks[y]));
      piChunks.push(
        parseInt((current * nextValue) * Math.PI),
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
    const current = parseInt(Math.sqrt(filterParseInt(chunks[i])));

    for (let y = i; y < chunks.length - i; y++) {
      const nextValue = parseInt(Math.sqrt(filterParseInt(chunks[y])));
      piChunks.push(
        parseInt((current * nextValue) * Math.PI),
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
  const cubedChunks = smallerChunks.map((x) => parseInt(x * x * x));
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
    parseInt(xTally / vectorChunks.length),
    parseInt(yTally / vectorChunks.length),
    parseInt(zTally / vectorChunks.length),
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
    const qty = parseInt((currentLine.distanceSq() / maxDistance) * 999);
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
      const xAxis = (parseInt(nvArray[0]) + parseInt(cvArray[0])) / 2;
      const yAxis = (parseInt(nvArray[1]) + parseInt(cvArray[1])) / 2;

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
      qtyPicks: distance > 0 ? parseInt((distance / maxDistance) * 999) : 0,
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
 * Given a ticket algorithm and signature, return chosen tickets.
 * @param {String} algoType
 * @param {String} filtered_signature
 * @param {Array} leaderboardJSON
 * @returns {Array}
 */
function getTickets(algoType, filtered_signature, leaderboardJSON) {
  const initialChunks = chunk(filtered_signature, 9);

  const minVector = new Vector3(0, 0, 0);
  const maxVector = new Vector3(999, 999, 999);
  const maxDistance = minVector.distanceToSquared(maxVector);

  switch (algoType) {
    case "forward":
      return forward(initialChunks);
      break;
    case "reverse":
      return reverse(initialChunks);
      break;
    case "pi":
      return forward_pi(initialChunks);
      break;
    case "reverse_pi":
      return reverse_pi(initialChunks);
      break;
    case "cubed":
      return cubed(filtered_signature);
      break;
    case "avg_point_lines":
      return avg_point_lines(initialChunks, maxDistance);
      break;
    case "alien_blood":
      return alien_blood(filtered_signature);
      break;
    case "bouncing_ball":
      return bouncing_ball(initialChunks, maxDistance);
      break;
    case "freebie":
      return freebie(leaderboardJSON);
    default:
      console.log(`Unknown algo type: ${algoType}`);
  }
}

/**
 * Return winning tickets from multiple optional algorithms
 * @param {String} filtered_signature
 * @param {Array} distributions
 * @param {String} deduplicate
 * @param {String} alwaysWinning
 * @param {Array} leaderboardJSON
 * @returns {Object}
 */
function executeCalculation(
  filtered_signature,
  distributions,
  deduplicate,
  alwaysWinning,
  leaderboardJSON,
) {
  const generatedNumbers = {};
  let winningTickets = [];
  const winners = {};

  for (let i = 0; i < distributions.length; i++) {
    // Calculate winning tickets for each algo chosen, 1 at a time
    const algoType = distributions[i];
    let algoTickets = getTickets(algoType, filtered_signature, leaderboardJSON);

    if (deduplicate === "Yes") {
      // User chose to avoid unique tickets being chosen multiple times
      algoTickets = [...new Set(algoTickets)];
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
    const algoNums = value;

    for (let i = 0; i < algoNums.length; i++) {
      const currentNumber = algoNums[i];
      const search = leaderboardJSON.find((x) => currentNumber >= x.range.from && currentNumber <= x.range.to);

      if (search) {
        winners[search.id] = winners.hasOwnProperty(search.id)
          ? [...winners[search.id], { ticket: currentNumber, algo }]
          : [{ ticket: currentNumber, algo }];
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
      percent: currentPercent,
    });
  }

  // Return the following for storage in the zustand store
  return { summary, generatedNumbers };
}

export {
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
};
