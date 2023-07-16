export function sliceIntoChunks(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    chunks.push(chunk);
  }
  return chunks;
}

/**
 * Convert the token's blockchain representation into a human readable quantity
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
export function humanReadableFloat(satoshis, precision) {
  return parseFloat((satoshis / 10 ** precision).toFixed(precision));
}

/**
 * Convert human readable quantity into the token's blockchain representation
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
export function blockchainFloat(satoshis, precision) {
  return satoshis * 10 ** precision;
}

/**
 * Given flag mask, return an object with booleans indicating which flags are set
 * @param {String} mask
 * @param {Boolean} isBitAsset
 * @returns Object
 */
export function getFlagBooleans(mask, isBitAsset = false) {
  const permission_flags = {
    /** < an issuer-specified percentage of all market trades in this asset is paid to the issuer */
    charge_market_fee: 0x01,
    white_list: 0x02 /** < accounts must be whitelisted in order to hold this asset */,
    override_authority: 0x04 /** < issuer may transfer asset back to himself */,
    transfer_restricted: 0x08 /** < require the issuer to be one party to every transfer */,
    disable_force_settle: 0x10 /** < disable force settling */,
    /**
     * allow the bitasset issuer to force a global settling
     * this may be set in permissions, but not flags
     * */
    global_settle: 0x20,
    disable_confidential: 0x40 /** < allow the asset to be used with confidential transactions */,
    witness_fed_asset: 0x80 /** < allow the asset to be fed by witnesses */,
    committee_fed_asset: 0x100 /** < allow the asset to be fed by the committee */,
    lock_max_supply: 0x200, /// < the max supply of the asset can not be updated
    disable_new_supply: 0x400, /// < unable to create new supply for the asset
    disable_mcr_update: 0x800, /// < the bitasset owner can not update MCR, permission only
    disable_icr_update: 0x1000, /// < the bitasset owner can not update ICR, permission only
    disable_mssr_update: 0x2000, /// < the bitasset owner can not update MSSR, permission only
    disable_bsrm_update: 0x4000, /// < the bitasset owner can not update BSRM, permission only
    disable_collateral_bidding: 0x8000, /// < Can not bid collateral after a global settlement
  };

  const uia_permission_mask = [
    'charge_market_fee',
    'white_list',
    'override_authority',
    'transfer_restricted',
    'disable_confidential',
  ];

  const booleans = {
    charge_market_fee: false,
    white_list: false,
    override_authority: false,
    transfer_restricted: false,
    disable_force_settle: false,
    global_settle: false,
    disable_confidential: false,
    witness_fed_asset: false,
    committee_fed_asset: false,
    lock_max_supply: false,
    disable_new_supply: false,
    disable_mcr_update: false,
    disable_icr_update: false,
    disable_mssr_update: false,
    disable_bsrm_update: false,
    disable_collateral_bidding: false,
  };

  if (mask === 'all') {
    Object.keys(booleans).forEach((flag) => {
      if (!isBitAsset && uia_permission_mask.indexOf(flag) === -1) {
        delete booleans[flag];
      } else {
        booleans[flag] = true;
      }
    });
    return booleans;
  }

  Object.keys(booleans).forEach((flag) => {
    if (!isBitAsset && uia_permission_mask.indexOf(flag) === -1) {
      delete booleans[flag];
    } else if (mask && permission_flags[flag]) {
      booleans[flag] = true;
    }
  });

  return booleans;
}
