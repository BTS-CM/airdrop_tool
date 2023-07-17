import { humanReadableFloat } from "./common";
import { lookupSymbols } from "./directQueries";

const _countDecimals = (value) => {
  if ((value % 1) !== 0) { return value.toString().split(".")[1].length; }
  return 0;
};

/**
 * Retrieve the valid rows from the tokenRows
 * @param {Object} valid
 * @param {Object} zustandSet
 * @returns {Array}
 */
function getValidRows(valid, zustandSet) {
  const { tokenRows, tokenDetails, totalAssignedTokens, leftAirdropCard } = valid;
  const { setLeftAirdropCard } = zustandSet;
  if (tokenRows && tokenRows.length && tokenDetails) {
    if (leftAirdropCard) {
      setLeftAirdropCard(null);
    }
    let validTokenRow = tokenRows.sort((a, b) => b.assignedTokens - a.assignedTokens);
    if (tokenDetails.precision > 0) {
      validTokenRow = validTokenRow.filter(
        (user) => user.assignedTokens > humanReadableFloat(1, tokenDetails.precision)
      );
    } else if (tokenDetails.precision === 0 && tokenDetails.readableMax === 1) {
      validTokenRow = validTokenRow.filter((user) => user.assignedTokens === 1);
    } else if (tokenDetails.precision === 0 && tokenDetails.readableMax > 1) {
      validTokenRow = validTokenRow.filter((user) => user.assignedTokens >= 1);
    }

    // redistribute the missing user assignedTokens to those above proportionally
    if (validTokenRow.length < tokenRows.length) {
      // Calculate the total assigned tokens
      const validAssignedTokens = validTokenRow.reduce((total, user) => total + user.assignedTokens, 0);

      const missingTokens = totalAssignedTokens - validAssignedTokens;
      if (validTokenRow && validTokenRow.length) {
        validTokenRow[0].assignedTokens += missingTokens;
      }
    }

    return validTokenRow;
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
        const currentWinner = validOutput[i];
        const assignedTokens = tokensPerTicket + (i < remainingTokensMod ? 1 : 0);

        tempRows.push({
          ...currentWinner,
          assignedTokens,
        });
      }
    } else {
      // Allocate assets (tokens) to the remaining valid ticket holders
      for (let i = 0; i < itrQty; i++) {
        if (distroMethod === "Proportionally") {
          const propValue = airdropTarget && airdropTarget === "ticketValue"
            ? validOutput[i].value
            : validOutput[i].qty;
          const proportionalAllocation = parseFloat(
            ((propValue / remainingTickets) * remainingTokens).toFixed(tokenDetails.precision)
          );
          remainingTokens -= proportionalAllocation;
          remainingTickets -= propValue;
          tempRows.push({ ...validOutput[i], assignedTokens: proportionalAllocation });
        } else if (distroMethod === "Equally") {
          const equalAllocation = parseFloat(
            ((1 / equalTally) * remainingTokens).toFixed(tokenDetails.precision)
          );
          remainingTokens -= equalAllocation;
          equalTally -= 1;
          tempRows.push({ ...validOutput[i], assignedTokens: equalAllocation });
        }
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
  const { invalidOutput, unassignedUsers, leftAirdropCard } = variables;
  const { setFinalInvalidOutput, setLeftAirdropCard } = zustandSet;
  if (leftAirdropCard) {
    setLeftAirdropCard(null);
  }
  const invalidOutputMap = new Map(invalidOutput.map((x) => [x.id, x]));
  const newInvalidOutput = unassignedUsers.map((current) => {
    const currentInvalid = invalidOutputMap.get(current.id);
    if (currentInvalid) {
      const updatedInvalid = {
        ...currentInvalid,
        reason: [...currentInvalid.reason, "minReward"]
      };
      return updatedInvalid;
    }
    return {
      ...current,
      reason: ["minReward"]
    };
  });
  setFinalInvalidOutput(newInvalidOutput);
}

export {
  fetchAirdropDetails,
  tokenQuantities,
  getTokenRows,
  getValidRows,
  filterMinRewards
};
