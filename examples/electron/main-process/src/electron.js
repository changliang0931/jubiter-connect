const { app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { initJuBiterConnect, callJuBiterConnect } = require('./jubiter-connect-ipc');

let mainWindow;

function init() {
    // create browser window
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 775,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true,
        }),
    );

    // emitted when the window is closed.
    mainWindow.on('closed', () => {
        app.quit();
        mainWindow = null;
    });
}

app.on('ready', init);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        init();
    }
});

app.on('browser-window-focus', (event, win) => {
    if (!win.isDevToolsOpened()) {
        win.openDevTools();
    }
});

// handle messages from renderer
ipcMain.on('jubiter-connect', (event, message) => {
    if (message === 'init') {
        initJuBiterConnect(event.sender);
    } else {
        callJuBiterConnect(event.sender, message);
    }
});
