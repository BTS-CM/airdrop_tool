import { TransactionBuilder } from 'bitsharesjs';
import { Apis } from "bitsharesjs-ws";
import DeepLink from './DeepLink';

/**
 * Returns deeplink contents
 * @param {String} chain
 * @param {String} node
 * @param {String} opType
 * @param {Object} opContents
 * @returns {Object}
 */
async function generateDeepLink(chain, node, opType, opContents) {
  console.log({
    chain, node, opType, opContents
  })
  
  const beetLink = new DeepLink(
    'creating_ticket',
    chain,
    'airdrop_tool',
    'localhost'
  );

  let TXBuilder;
  try {
    TXBuilder = await beetLink.inject(
      TransactionBuilder,
      { sign: true, broadcast: true }
    );
  } catch (error) {
    console.log(error);
    return;
  }

  try {
    await Apis.instance(
      node,
      true,
      10000,
      { enableCrypto: false, enableOrders: true },
      (error) => console.log(error),
    ).init_promise;
  } catch (error) {
    console.log(`api instance: ${error}`);
    return;
  }

  const tr = new TXBuilder();
  tr.add_type_operation(opType, opContents);

  try {
    await tr.update_head_block();
  } catch (error) {
    console.error(error);
    return;
  }

  try {
    await tr.set_required_fees();
  } catch (error) {
    console.error(error);
    return;
  }

  try {
    tr.set_expire_seconds(7200);
  } catch (error) {
    console.error(error);
    return;
  }

  try {
    tr.add_signer("inject_wif");
  } catch (error) {
    console.error(error);
    return;
  }

  try {
    tr.finalize();
  } catch (error) {
    console.error(error);
    return;
  }

  let encryptedPayload;
  try {
    encryptedPayload = await tr.encrypt();
  } catch (error) {
    console.error(error);
    return;
  }

  return encryptedPayload;
}

export {
  generateDeepLink
};
