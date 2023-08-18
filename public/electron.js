const {
  app, BrowserWindow, ipcMain, shell,
// eslint-disable-next-line import/no-extraneous-dependencies
} = require('electron');
const path = require('path');
const url = require("url");
const { v4: uuidv4 } = require('uuid');

const {
  beetBroadcast,
  getTrxBytes,
  generateDeepLink,
  generateQRContents
} = require('./lib/generate');

const { executeCalculation } = require('./lib/algos');

const {
  lookupSymbols,
  fetchLeaderboardData,
  accountSearch,
  getBlockedAccounts,
  getObjects,
  getBlockchainFees
} = require('./lib/queries');

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      partition: 'persist:nft_airdrop_tool',
    }
  });

  const indexURL = app.isPackaged
    ? url.format({
      pathname: path.join(__dirname, '/index.html'),
      protocol: 'file:',
      slashes: true,
    })
    : "http://localhost:3001";

  mainWindow.loadURL(indexURL);

  // Automatically open Chrome's DevTools in development mode.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

const allowed = {
  beetGithub: "https://github.com/bitshares/beet/releases",
  toolGithub: "https://github.com/BTS-CM/airdrop_tool",
  gallery: "https://nftea.gallery/gallery",
};

ipcMain.on('openURL', (event, arg) => {
  if (Object.prototype.hasOwnProperty.call(allowed, arg)) {
    event.returnValue = 'Opening url!';
    shell.openExternal(allowed[arg]);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    // On certificate error we disable default behaviour (stop loading the page)
    // and we then say "it is all fine - true" to the callback
    event.preventDefault();
    callback(true);
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('getUUID', async (event, arg) => await uuidv4());

ipcMain.handle('executeCalculation', async (event, ...args) => await executeCalculation(...args));

ipcMain.handle('lookupSymbols', async (event, args) => await lookupSymbols(...args));
ipcMain.handle('fetchLeaderboardData', async (event, args) => await fetchLeaderboardData(...args));
ipcMain.handle('accountSearch', async (event, args) => await accountSearch(...args));
ipcMain.handle('getBlockedAccounts', async (event, args) => await getBlockedAccounts(...args));
ipcMain.handle('getObjects', async (event, args) => await getObjects(...args));
ipcMain.handle('getBlockchainFees', async (event, args) => await getBlockchainFees(...args));

import('beet-js').then((beet) => {
  ipcMain.handle('checkBeet', async (event, ...args) => {
    console.log('checkBeet');
    return await beet.checkBeet(...args);
  });

  ipcMain.handle('connect', async (event, ...args) => {
    console.log('connect');
    const connection = await beet.connect(...args);
    return JSON.stringify(connection, (key, value) => {
      if (key === 'io' || key === 'socket' || key === 'nsp') {
        return undefined;
      }
      return value;
    });
  });

  ipcMain.handle('link', async (event, ...args) => {
    if (!args.length) {
      console.log(new Error('No arguments provided'));
      return;
    }

    const beetOnline = await beet.checkBeet(true);
    if (!beetOnline) {
      console.log('Beet is not online');
      return;
    }

    const connection = await beet.connect(
      "NFT Viewer",
      "Application",
      "localhost",
      null,
      null
    );

    const chain = args[0] ?? null;
    let linkage;
    try {
      linkage = await beet.link(chain, connection);
    } catch (error) {
      console.log(error);
      return;
    }

    return JSON.stringify(connection, (key, value) => {
      if (key === 'io' || key === 'socket' || key === 'nsp') {
        return undefined;
      }
      return value;
    });
  });

  ipcMain.handle('beetBroadcast', async (event, ...args) => {
    const chain = args[0] ?? null;
    const node = args[1] ?? null;
    const opType = args[2] ?? null;
    const operations = args[3] ?? null;
    const identity = args[4] ?? null;
    const {
      beetkey,
      next_identification,
      secret
    } = args[5] ?? null;

    const connection = await beet.connect(
      "NFT Viewer",
      "Application",
      "localhost",
      null,
      identity
    );

    if (!connection) {
      console.log('No connection');
      return;
    }

    connection.beetkey = beetkey;
    connection.next_identification = next_identification;
    connection.secret = secret;
    connection.id = next_identification;

    return await beetBroadcast(
      connection,
      chain,
      node,
      opType,
      operations
    );
  });

  ipcMain.handle('generateDeepLink', async (event, ...args) => await generateDeepLink(...args));

  ipcMain.handle('generateQRContents', async (event, ...args) => await generateQRContents(...args));

  ipcMain.handle('getTrxBytes', async (event, ...args) => await getTrxBytes(...args));
}).catch((err) => {
  console.error(err);
});
