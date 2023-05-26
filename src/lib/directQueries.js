import { Apis } from 'bitsharesjs-ws';
import { appStore } from './states';

/**
 * Search for an account, given 1.2.x or an account name.
 * @param {String} node
 * @param {String} search_string
 * @returns
 */
async function accountSearch(node, search_string) {
  return new Promise(async (resolve, reject) => {
    try {
      await Apis.instance(node, true).init_promise;
    } catch (error) {
      console.log(error);
      const { changeURL } = appStore.getState();
      changeURL();
      reject();
    }

    let object;
    try {
      object = await Apis.instance()
        .db_api()
        .exec('get_accounts', [[search_string]]);
    } catch (error) {
      console.log(error);
      reject();
    }

    resolve(object);
  });
}

export {
  accountSearch,
};
