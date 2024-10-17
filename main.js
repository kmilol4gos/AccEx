const path = require('path');
const { fork } = require('child_process');
const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');

// Importar la lógica de dashboard.js
const { createDashboardWindow } = require('./dashboard');

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

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  // Escucha el evento "open-dashboard" para cargar el contenido del dashboard
  ipcMain.on('open-dashboard', () => {
    createDashboardWindow(mainWindow); // Cargar el contenido del dashboard en la misma ventana
  });

  ipcMain.on('load-register-page', () => {
    mainWindow.loadFile('registro.html');
  });

  ipcMain.on('dashboard', () => {
    exec('node dashboard.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al iniciar dashboard.js: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  });

  ipcMain.on('run-dashboard-script', () => {
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
