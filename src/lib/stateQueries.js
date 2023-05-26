import config from '../config/config.json';
import { testConnection } from './nodeTest';

const _nodes = {
  bitshares: config.bitshares.nodeList.map((node) => node.url),
  bitshares_testnet: config.bitshares_testnet.nodeList.map((node) => node.url),
  tusc: config.tusc.nodeList.map((node) => node.url)
};

/**
 * Test the wss nodes, return latencies and fastest url.
 * @returns {Promise}
 */
async function testNodes(target, itr = 0) {
  return new Promise(async (resolve, reject) => {
    const urlPromises = _nodes[target].map(
      (url) => testConnection(url, itr > 0 ? itr * 3000 : 3000),
    );
    Promise.all(urlPromises)
      .then((validNodes) => {
        const filteredNodes = validNodes.filter((x) => x);
        if (filteredNodes.length) {
          const sortedNodes = filteredNodes.sort((a, b) => a.lag - b.lag).map((node) => node.url);
          return resolve(sortedNodes);
        }
        if (itr > 2) {
          console.error(
            'No valid BTS WSS connections established; Please check your internet connection.',
          );
          reject();
        }
        console.log(
          "Couldn't establish network connections; trying again with greater timeout durations. Apologies for the delay.",
        );
        return resolve(testNodes(target, itr + 1));
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

export {
  testNodes
};
