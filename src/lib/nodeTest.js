import Socket from "simple-websocket";

/**
 * Call an async function with a maximum time limit (in milliseconds) for the timeout
 * @param {Promise} asyncPromise An asynchronous promise to resolve
 * @param {number} timeLimit Time limit to attempt function in milliseconds
 * @returns {Promise | undefined}
 * Resolved promise for async function call, or an error if time limit reached
 */
const asyncCallWithTimeout = async (asyncPromise, timeLimit) => {
  let timeoutHandle;

  const timeoutPromise = new Promise((_resolve, reject) => {
    timeoutHandle = setTimeout(
      () => _resolve(null),
      timeLimit,
    );
  });

  return Promise.race([asyncPromise, timeoutPromise]).then((result) => {
    clearTimeout(timeoutHandle);
    return result;
  });
};

/**
 * Test a wss url for successful connection.
 * @param {String} url
 * @returns {Object}
 */
async function _testConnection(url) {
  return new Promise(async (resolve, reject) => {
    const before = new Date();
    const beforeTS = before.getTime();
    let closing;

    /**
         * Exiting the url connection
         * @param {Boolean} connected
         * @param {WebSocket} socket
         * @returns
         */
    function _exitTest(connected, socket) {
      if (closing || (!connected && !socket)) {
        return;
      }

      if (socket) {
        socket.destroy();
      }

      closing = true;
      if (!connected) {
        resolve(null);
      }

      const now = new Date();
      const nowTS = now.getTime();
      resolve({ url, lag: nowTS - beforeTS });
    }

    const socket = new Socket(url);

    socket.on('connect', () => _exitTest(true, socket));

    socket.on('error', (error) => _exitTest(false, socket));

    socket.on('close', () => _exitTest());
  });
}

/**
 * Test a connection with a timeout
 * @param {String} url 
 * @param timeout
 * @returns {Object}
 */
async function testConnection (url, timeout) {
  await asyncCallWithTimeout(
    _testConnection(url),
    timeout ?? 3000,
  )
};

export {
  testConnection
};
