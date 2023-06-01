const path = require('path');
const url = require("url");

const {
  app, BrowserWindow, ipcMain, shell,
// eslint-disable-next-line import/no-extraneous-dependencies
} = require('electron');

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
      partition: 'persist:nft_airdrop_tool',
    },
  });

  const indexURL = app.isPackaged
    ? url.format({
      pathname: path.join(__dirname, './index.html'),
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
