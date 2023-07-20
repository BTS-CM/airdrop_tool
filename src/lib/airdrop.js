import { sort } from 'fast-sort';
import { humanReadableFloat } from "./common";
import { lookupSymbols } from "./directQueries";

const _countDecimals = (value) => {
  if ((value % 1) !== 0) { return value.toString().split(".")[1].length; }
  return 0;
};

/**
 * Retrieve the valid rows from the tokenRows
 * @param {Object} valid
 * @returns {Array}
 */
function getValidRows(valid) {
  const {
    tokenRows, tokenDetails, totalAssignedTokens
  } = valid;
  if (tokenRows && tokenRows.length && tokenDetails) {
    const filteredTokenRows = [];
    const minReadable = humanReadableFloat(1, tokenDetails.precision);
    for (let i = 0; i < tokenRows.length; i++) {
      const user = tokenRows[i];
      if (tokenDetails.precision > 0) {
        if (user.assignedTokens > minReadable) {
          filteredTokenRows.push(user);
        }
      } else if (tokenDetails.precision === 0 && tokenDetails.readableMax === 1) {
        if (user.assignedTokens === 1) {
          filteredTokenRows.push(user);
        }
      } else if (tokenDetails.precision === 0 && tokenDetails.readableMax > 1) {
        if (user.assignedTokens >= 1) {
          filteredTokenRows.push(user);
        }
      }
    }

    // redistribute the missing user assignedTokens to those above proportionally
    if (filteredTokenRows.length < tokenRows.length) {
      // Calculate the total assigned tokens
      let validAssignedTokens = 0;
      for (let i = 0; i < filteredTokenRows.length; i++) {
        const user = filteredTokenRows[i];
        validAssignedTokens += user.assignedTokens;
      }

      const missingTokens = totalAssignedTokens - validAssignedTokens;
      if (filteredTokenRows && filteredTokenRows.length) {
        filteredTokenRows[0].assignedTokens += missingTokens;
      }
    }

    const sortedTokenRows = sort(filteredTokenRows).desc((u) => u.assignedTokens);
    return sortedTokenRows;
  }
  return [];
}

/**
 * Process the input quantity of tokens
 * @param {Object} variables
 * @param {Object} zustandSet
 */
function tokenQuantities(variables, zustandSet) {
  const delayDebounceFn = setTimeout(async () => {
    const { tokenQuantity, tokenDetails } = variables;
    const { onTokenQuantity, setFinalTokenQuantity } = zustandSet;
    if (tokenQuantity && tokenQuantity > 0 && tokenDetails) {
      if (tokenDetails && tokenQuantity > tokenDetails.readableMax) {
        console.log("Max supply reached");
        onTokenQuantity(parseFloat(tokenDetails.readableMax));
        return;
      }
      if (tokenDetails && tokenQuantity < humanReadableFloat(1, tokenDetails.precision)) {
        console.log("Less than min supply");
        onTokenQuantity(humanReadableFloat(1, tokenDetails.precision));
        return;
      }
      if (_countDecimals(tokenQuantity) > tokenDetails.precision) {
        console.log("Too many decimals");
        onTokenQuantity(tokenQuantity.toFixed(tokenDetails.precision));
        return;
      }
      setFinalTokenQuantity(tokenQuantity); // store new
    }
  }, 1000);

  return () => clearTimeout(delayDebounceFn);
}

/**
 * Get the airdrop token details
 * @param {Object} variables
 * @param {Object} zustandSet
 */
async function fetchAirdropDetails(variables, zustandSet) {
  const delayDebounceFn = setTimeout(async () => {
    const {
      account, finalTokenName, cachedAssets, currentNodes, env
    } = variables;
    const {
      addOne, changeURL, setTokenDetails, setInProgress
    } = zustandSet;
    if (account && account.length && finalTokenName && finalTokenName.length) {
      setTokenDetails(); // erase last search
      setInProgress(true);

      const foundCachedAsset = cachedAssets.find((asset) => asset.symbol === finalTokenName);
      if (foundCachedAsset) {
        setTokenDetails({
          id: foundCachedAsset.id,
          precision: foundCachedAsset.precision,
          max_supply: foundCachedAsset.options.max_supply,
          readableMax: humanReadableFloat(
            foundCachedAsset.options.max_supply,
            foundCachedAsset.precision
          ),
        });
        setInProgress(false);
        return;
      }

      let assetDetails;
      try {
        assetDetails = await lookupSymbols(currentNodes[0], env, [finalTokenName]);
      } catch (error) {
        console.log(error);
        changeURL(env);
        setInProgress(false);
        return;
      }

      if (!assetDetails || !assetDetails.length) {
        setInProgress(false);
        return;
      }

      const assetData = assetDetails.map((q) => ({
        id: q.id,
        symbol: q.symbol,
        precision: q.precision,
        issuer: q.issuer,
        options: {
          max_supply: q.options.max_supply
        },
        dynamic_asset_data_id: q.dynamic_asset_data_id
      }));

      addOne(env, assetData[0]);

      setTokenDetails({
        id: assetDetails[0].id,
        precision: assetDetails[0].precision,
        max_supply: assetDetails[0].options.max_supply,
        readableMax: humanReadableFloat(
          assetDetails[0].options.max_supply,
          assetDetails[0].precision
        ),
      }); // store new

      setInProgress(false);
    }
  }, 1000);

  return () => clearTimeout(delayDebounceFn);
}

/**
 * Allocate tokens to the winners
 * @param {Number} finalTokenQuantity
 * @param {Number} itrQty
 * @param {String} distroMethod
 * @param {Array} validOutput
 * @param {Object} tokenDetails
 * @param {String} airdropTarget
 * @param {Number} ticketQty
 * @param {Number} totalTicketValue
 * @returns {Array}
 */
async function getTokenRows(
  finalTokenQuantity,
  itrQty,
  distroMethod,
  validOutput,
  tokenDetails,
  airdropTarget,
  ticketQty,
  totalTicketValue
) {
  if (finalTokenQuantity && ticketQty && itrQty && validOutput.length && tokenDetails) {
    const tempRows = [];
    let remainingTokens = finalTokenQuantity ?? 0;
    let remainingTickets = airdropTarget && airdropTarget === "ticketValue"
      ? totalTicketValue
      : ticketQty;
    let equalTally = validOutput.length ?? 0;

    if (distroMethod === "RoundRobin") {
      const tokensPerTicket = Math.floor(finalTokenQuantity / validOutput.length);
      const remainingTokensMod = finalTokenQuantity % validOutput.length;

      for (let i = 0; i < validOutput.length; i++) {
        const assignedTokens = tokensPerTicket + (i < remainingTokensMod ? 1 : 0);
        validOutput[i].assignedTokens = assignedTokens;
        tempRows.push(validOutput[i]);
      }
    } else if (distroMethod === "Proportionally") {
      // Allocate assets (tokens) to the remaining valid ticket holders
      for (let i = 0; i < itrQty; i++) {
        const propValue = airdropTarget && airdropTarget === "ticketValue"
          ? validOutput[i].value
          : validOutput[i].qty;

        const proportionalAllocation = parseFloat(
          ((propValue / remainingTickets) * remainingTokens).toFixed(tokenDetails.precision)
        );

        if (!proportionalAllocation || Number.isNaN(proportionalAllocation)) {
          //validOutput[i].assignedTokens = 0;
          //tempRows.push(validOutput[i]);
          continue;
        }

        remainingTokens -= proportionalAllocation;
        remainingTickets -= propValue;

        validOutput[i].assignedTokens = proportionalAllocation;
        tempRows.push(validOutput[i]);
      }
    } else if (distroMethod === "Equally") {
      for (let i = 0; i < itrQty; i++) {
        const equalAllocation = parseFloat(
          ((1 / equalTally) * remainingTokens).toFixed(tokenDetails.precision)
        );
        remainingTokens -= equalAllocation;
        equalTally -= 1;
        validOutput[i].assignedTokens = equalAllocation;
        tempRows.push(validOutput[i]);
      }
    }

    return tempRows;
  }
  return [];
}

/**
 * Remove users with less than min reward
 * @param {Object} variables
 * @param {Object} zustandSet
 */
function filterMinRewards(variables, zustandSet) {
  const { invalidOutput, unassignedUsers } = variables;
  const { setFinalInvalidOutput } = zustandSet;

  // console.log({ invalidOutput, unassignedUsers })
  const invalidOutputMap = new Map(Array.from(invalidOutput, (x) => [x.id, x]));
  const newInvalidOutput = unassignedUsers.reduce((acc, current) => {
    const currentInvalid = invalidOutputMap.get(current.id);
    if (currentInvalid) {
      currentInvalid.reason = currentInvalid.reason.concat("minReward");
      acc.push(currentInvalid);
    } else {
      acc.push({ ...current, reason: ["minReward"] });
    }
    return acc;
  }, []);
  setFinalInvalidOutput(newInvalidOutput);
}

export {
  fetchAirdropDetails,
  tokenQuantities,
  getTokenRows,
  getValidRows,
  filterMinRewards
};
