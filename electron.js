const { app, BrowserWindow, BrowserView } = require('electron');
const path = require('path');

let mainWindow;
let view;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true,
      webSecurity: false, // Esto deshabilita la seguridad de red para permitir las solicitudes externas
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'pages', 'index.html'));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setBrowserView(view);

  view.setBounds({ x: 90, y: 0, width: 1200, height: 800 });

  view.webContents.loadURL('https://www.google.com');
}

function navigate(url) {
  if (view) {
    view.webContents.loadURL(url);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

module.exports = { navigate };
