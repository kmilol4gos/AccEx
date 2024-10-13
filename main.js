const {
  app,
  BaseWindow,
  WebContentsView,
  ipcMain,
  Menu,
  MenuItem,
} = require('electron');
const path = require('path');

let mainWindow;
let googleView;
let sidebarView;
let frameView;

//#region Crear la ventana principal
function createWindow() {
  mainWindow = new BaseWindow({
    width: 1280,
    frame: true,
    minHeight: 800,
    minWidth: 1200,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  //#region Crear la vista del frame
  frameView = new WebContentsView({
    webPreferences: {
      height: 30,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.contentView.addChildView(frameView);
  frameView.webContents.loadFile(
    path.join(__dirname, 'src', 'pages', 'frame.html')
  );
  //#endregion

  //#region Crear la vista de la sidebar
  sidebarView = new WebContentsView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.contentView.addChildView(sidebarView);
  sidebarView.webContents.loadFile(
    path.join(__dirname, 'src', 'pages', 'sidebar.html')
  );
  //#endregion

  //#region Crear vista para cuadro de busqueda
  searchView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.contentView.addChildView(searchView);
  searchView.webContents.loadFile(
    path.join(__dirname, 'src', 'pages', 'search.html')
  );
  //#endregion

  //#region Crear la vista para Google
  googleView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.contentView.addChildView(googleView);
  googleView.webContents.loadURL('https://www.google.com');
  //#endregion

  //#region Ajustar las vistas al tamaño de la ventana
  function adjustViews() {
    const { width, height } = mainWindow.getBounds();
    const sidebarWidth = 150;
    const frameHeight = 0;
    sidebarView.setBounds({ x: 0, y: 0, width: sidebarWidth, height: height });
    googleView.setBounds({
      x: sidebarWidth,
      y: frameHeight,
      width: width - sidebarWidth,
      height: height - 30,
    });
    frameView.setBounds({
      x: 0,
      y: 0,
      width: width,
      height: 30,
    });
  }

  mainWindow.on('resize', adjustViews);
  adjustViews();
  //#endregion

  //Escuchar los eventos de carga de Google y notificar a la sidebar
  googleView.webContents.on('did-start-loading', () => {
    sidebarView.webContents.send('loading-started');
  });

  //Notificar termino de carga y realizar scrape
  googleView.webContents.on('did-stop-loading', () => {
    sidebarView.webContents.send('loading-stopped');
    scrapeCurrent();
  });

  //#region Manejar eventos IPC desde la sidebar para navegar a diferentes URLs
  ipcMain.on('navigate-to', (event, url) => {
    if (googleView && googleView.webContents) {
      googleView.webContents.loadURL(url);
    }
  });

  //#endregion

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  //#region Menú de la aplicación
  const menu = Menu();
  menu.append(
    new MenuItem({
      label: 'Electron',
      submenu: [
        {
          label: 'Exit',
          click: () => {
            app.quit();
          },
        },
      ],
    })
  );
  menu.append(
    new MenuItem({
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: 'Toggle DevTools',
          click: () => {
            mainWindow.toggleDevTools();
          },
        },
      ],
    })
  );
  Menu.setApplicationMenu(menu);
  //#endregion
}

//#endregion

//#region Funciones de teclado

//#region Funciones de scraping
async function scrapeCurrent() {
  const html = await googleView.webContents.executeJavaScript(
    'document.body.innerHTML'
  ); // Obtener el HTML de la página actual
}
//#endregion

//#region Manejo de eventos de la app
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
//#endregion
