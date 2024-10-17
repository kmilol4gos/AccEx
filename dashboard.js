const { BrowserWindow, BrowserView, ipcMain } = require('electron');
const path = require('path');

let googleView;
let sidebarView;

function createDashboardWindow(mainWindow) {
  // Crear la vista de la sidebar
  sidebarView = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.setBrowserView(sidebarView);
  sidebarView.webContents.loadFile(
    path.join(__dirname, 'src', 'pages', 'sidebar.html')
  );

  // Crear vista para cuadro de búsqueda
  const searchView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.addBrowserView(searchView);
  searchView.webContents.loadFile(
    path.join(__dirname, 'src', 'pages', 'search.html')
  );

  // Crear la vista para Google
  googleView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.addBrowserView(googleView);
  googleView.webContents.loadURL('https://www.google.com');

  // Ajustar las vistas al tamaño de la ventana
  function adjustViews() {
    const { width, height } = mainWindow.getBounds();
    const sidebarWidth = 75;
    sidebarView.setBounds({ x: 0, y: 0, width: sidebarWidth, height: height });
    googleView.setBounds({
      x: sidebarWidth,
      y: 0,
      width: width - sidebarWidth,
      height: height,
    });
  }

  mainWindow.on('resize', adjustViews);
  adjustViews();

  // Escuchar los eventos de carga de Google y notificar a la sidebar
  googleView.webContents.on('did-start-loading', () => {
    sidebarView.webContents.send('loading-started');
  });

  googleView.webContents.on('did-stop-loading', () => {
    sidebarView.webContents.send('loading-stopped');
  });

  // Manejar eventos IPC desde la sidebar para navegar a diferentes URLs
  ipcMain.on('navigate-to', (event, url) => {
    if (googleView && googleView.webContents) {
      googleView.webContents.loadURL(url);
    }
  });
}

module.exports = { createDashboardWindow };
