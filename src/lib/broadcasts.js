import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from 'bitsharesjs-ws';
import { appStore } from './states';

/**
 * broadcast the create asset operation
 * @param {String} wsURL
 * @param {String} operationType
 * @param {Object} operationJSON
 */
async function generateObject(operationType, operationJSON) {
  return new Promise(async (resolve, reject) => {
    const tr = new TransactionBuilder();

    try {
      tr.add_type_operation(operationType, operationJSON);
    } catch (error) {
      console.error(error);
      reject();
    }

    try {
      await tr.update_head_block();
    } catch (error) {
      console.error(error);
      reject();
    }

    try {
      await tr.set_expire_seconds(1024);
    } catch (error) {
      console.log(error);
      reject();
    }

    try {
      await tr.set_required_fees();
    } catch (error) {
      console.error(error);
      reject();
    }

    resolve(tr.toObject());
  });
}

/**
 * Broadcast a Bitshares blockchain operation through Beet
 * @param {Object} connection
 * @param {String} wsURL
 * @param {String} operationType
 * @param {Object} operationJSON
 */
async function broadcastOperation(connection, wsURL, operationType, operationJSON) {
  return new Promise(async (resolve, reject) => {
    let TXBuilder;
    try {
      TXBuilder = connection.inject(TransactionBuilder, { sign: true, broadcast: true });
    } catch (error) {
      console.log(error);
      reject();
    }

    const { changeURL } = appStore.getState();

    try {
      await Apis.instance(
        wsURL,
        true,
        10000,
        { enableCrypto: false, enableOrders: true },
        (error) => console.log(error),
      ).init_promise;
    } catch (error) {
      console.log(`api instance: ${error}`);
      changeURL();
      reject();
    }

    const tr = new TXBuilder();

    try {
      tr.add_type_operation(operationType, operationJSON);
    } catch (error) {
      console.log({ error, operationJSON });
      reject();
    }

    try {
      await tr.update_head_block();
    } catch (error) {
      console.log({ error, operationJSON });
      reject();
    }

    try {
      await tr.set_expire_seconds(1024);
    } catch (error) {
      console.log({ error, operationJSON });
      reject();
    }

    try {
      await tr.set_required_fees();
    } catch (error) {
      console.log({ error, operationJSON });
      reject();
    }

    try {
      tr.add_signer('inject_wif');
    } catch (error) {
      console.log({ error, operationJSON });
      reject();
    }

    let result;
    try {
      result = await tr.broadcast();
    } catch (error) {
      console.log({ error, operationJSON });
      reject();
    }

    resolve(result);
  });
}

export { generateObject, broadcastOperation };
