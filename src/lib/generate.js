/* eslint-disable consistent-return */
import { TransactionBuilder } from 'bitsharesjs';
import { TransactionBuilder as TuscTB } from 'tuscjs';
import { Apis } from 'bitsharesjs-ws';
import { Apis as tuscApis } from 'tuscjs-ws';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate QR code contents for purchasing an NFT
 * @param {String} opType
 * @param {Array} opContents
 * @returns {Object}
 */
async function generateQRContents(opType, opContents) {
  return new Promise(async (resolve, reject) => {
    const tr = new TransactionBuilder();

    for (let i = 0; i < opContents.length; i++) {
      tr.add_type_operation(opType, opContents[i]);
    }

    try {
      await tr.set_required_fees();
    } catch (error) {
      console.error(error);
      reject(error);
      return;
    }

    try {
      await tr.update_head_block();
    } catch (error) {
      console.error(error);
      reject(error);
      return;
    }

    try {
      await tr.set_expire_seconds(4000);
    } catch (error) {
      console.error(error);
      reject(error);
      return;
    }

    resolve(tr.toObject());
  });
}

/**
 * Returns deeplink contents
 * @param {String} appName
 * @param {String} chain
 * @param {String} node
 * @param {String} opType
 * @param {Array} operations
 * @returns {Object}
 */
async function generateDeepLink(appName, chain, node, opType, operations) {
  return new Promise(async (resolve, reject) => {
    // eslint-disable-next-line no-unused-expressions
    try {
      if (chain === "TUSC") {
        await tuscApis.instance(
          node,
          true,
          10000,
          { enableCrypto: false, enableOrders: true },
          (error) => console.log(error),
        ).init_promise;
      } else {
        await Apis.instance(
          node,
          true,
          10000,
          { enableCrypto: false, enableOrders: true },
          (error) => console.log(error),
        ).init_promise;
      }
    } catch (error) {
      console.log(error);
      reject();
      return;
    }

    const tr = chain === "TUSC" ? new TuscTB() : new TransactionBuilder();
    for (let i = 0; i < operations.length; i++) {
      tr.add_type_operation(opType, operations[i]);
    }

    try {
      await tr.update_head_block();
    } catch (error) {
      console.error(error);
      reject();
      return;
    }

    try {
      await tr.set_required_fees();
    } catch (error) {
      console.error(error);
      reject();
      return;
    }

    try {
      tr.set_expire_seconds(7200);
    } catch (error) {
      console.error(error);
      reject();
      return;
    }

    try {
      tr.finalize();
    } catch (error) {
      console.error(error);
      reject();
      return;
    }

    const request = {
      type: 'api',
      id: await uuidv4(),
      payload: {
        method: 'injectedCall',
        params: [
          "signAndBroadcast",
          JSON.stringify(tr.toObject()),
          [],
        ],
        appName,
        chain,
        browser: 'airdrop_tool',
        origin: 'localhost'
      }
    };

    let encodedPayload;
    try {
      encodedPayload = encodeURIComponent(
        JSON.stringify(request),
      );
    } catch (error) {
      console.log(error);
      reject();
      return;
    }

    resolve(encodedPayload);
  });
}

/**
 * Submit request to BEET to broadcast operations
 * @param {BeetConnection} connection
 * @param {String} chain
 * @param {String} node
 * @param {String} opType
 * @param {Array} operations
 * @returns {Object}
 */
async function beetBroadcast(
  connection,
  chain,
  node,
  opType,
  operations
) {
  return new Promise(async (resolve, reject) => {
    const TXBuilder = chain === "TUSC"
      ? connection.inject(TuscTB, { sign: true, broadcast: true })
      : connection.inject(TransactionBuilder, { sign: true, broadcast: true });

    try {
      if (chain === "TUSC") {
        await tuscApis.instance(
          node,
          true,
          10000,
          { enableCrypto: false, enableOrders: true },
          (error) => console.log(error),
        ).init_promise;
      } else {
        await Apis.instance(
          node,
          true,
          10000,
          { enableCrypto: false, enableOrders: true },
          (error) => console.log(error),
        ).init_promise;
      }
    } catch (error) {
      console.log(error);
      reject();
      return;
    }

    const tr = new TXBuilder();

    for (let i = 0; i < operations.length; i++) {
      tr.add_type_operation(opType, operations[i]);
    }

    try {
      await tr.set_required_fees();
    } catch (error) {
      console.error(error);
      reject();
      return;
    }

    try {
      await tr.update_head_block();
    } catch (error) {
      console.error(error);
      reject();
      return;
    }

    try {
      await tr.set_expire_seconds(4000);
    } catch (error) {
      console.error(error);
      reject();
      return;
    }

    try {
      tr.add_signer("inject_wif");
    } catch (error) {
      console.error(error);
      reject();
      return;
    }

    let result;
    try {
      result = await tr.broadcast(); // broadcasting request to beet
    } catch (error) {
      console.error(error);
      reject();
      return;
    }

    console.log(result);
    resolve(result);
  });
}

export {
  beetBroadcast,
  generateDeepLink,
  generateQRContents
};
