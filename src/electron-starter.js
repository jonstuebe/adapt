const electron = require('electron');
const { app, BrowserWindow, ipcMain } = electron;

const path = require('path');
const url = require('url');

const xlsx = require('xlsx');
const fs = require('fs');
const knex = require('knex');
const { download } = require('electron-dl');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {

    if (process.env.NODE_ENV !== 'production') {
      BrowserWindow.addDevToolsExtension(
        '/Users/jon.stuebe/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/0.15.6_0'
      );
    }

    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 680,
      height: 695,
      minHeight: 695,
    });

    ipcMain.on('save-file', (event, args) => {
      const url = `${app.getPath('downloads')}/${args.fileName}`;
      fs.writeFile(url, args.data, 'utf-8', () => {
        app.dock.downloadFinished(url);
      });
    });

    // ipcMain.on('download-file', (e, args) => {
    //   console.log('download file');
    //   download(mainWindow, args.url)
    //     .then(dl => console.log(dl.getSavePath()))
    //     .catch(console.error);
    // });

    // and load the index.html of the app.
    const startUrl = process.env.ELECTRON_START_URL || url.format({
            pathname: path.join(__dirname, '/../build/index.html'),
            protocol: 'file:',
            slashes: true
        });
    mainWindow.loadURL(startUrl);
    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
