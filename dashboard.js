const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { fork } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    resizable: false,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'accex-icon.png')
  });

  mainWindow.loadFile('dasboard.html');
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.on('load-register-page', () => {
    mainWindow.loadFile('registro.html');
  });

  ipcMain.on('dashboard', () => {
    fork(path.join(__dirname, 'dashboard.js'));
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});