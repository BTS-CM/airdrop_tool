function sliceIntoChunks(arr, size) {
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
function humanReadableFloat(satoshis, precision) {
    return parseFloat((satoshis / 10 ** precision).toFixed(precision));
}

/**
 * Convert human readable quantity into the token's blockchain representation
 * @param {Float} satoshis
 * @param {Number} precision
 * @returns {Number}
 */
function blockchainFloat(satoshis, precision) {
    return satoshis * 10 ** precision;
}

export {
    sliceIntoChunks,
    humanReadableFloat,
    blockchainFloat
};