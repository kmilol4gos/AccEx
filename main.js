const {
  app,
  BaseWindow,
  WebContentsView,
  ipcMain,
  Menu,
  MenuItem,
  globalShortcut,
} = require('electron');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

// Inicializar OpenAI con la clave de API desde las variables de entorno
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Asegúrate de que la clave esté en tus variables de entorno
});

let mainWindow;
let googleView;
let sidebarView;
let frameView;

let keyboardNavigation = false;

//#region Crear la ventana app
function createWindow() {
  //#region Crear ventana principal
  mainWindow = new BaseWindow({
    width: 1280,
    frame: true,
    minHeight: 800,
    minWidth: 1200,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: false,
      enableRemoteModule: false,
      nodeIntegration: true,
      webSecurity: true,
    },
  });
  //#endregion

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
      nodeIntegration: true,
      contextIsolation: false,
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

  //#region Manejar eventos para realizar la consulta a OpenAI
  ipcMain.on('search-query', async (event, query) => {
    try {
      // Hacer la solicitud a OpenAI utilizando tu GPT personalizado
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'eres un navegador, tienes que buscar dentro de las primeras 6 opciones de google cuando alguien te pregunte algo, mostrando en primer lugar el link que mas se asemeje a lo que te preguntan, también haces un resumen de lo mas importante que se está preguntando y muestras posibles links que estén relacionado a la información que sacaste para hacer el resumen. El resumen debes dejarlo bien legible y que se entienda bien para todo tipo de personas',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 1,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const result = response.choices[0].message.content.trim();

      // Mostrar los resultados en la vista de Google
      googleView.webContents.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Resultados de la búsqueda</title>
                    <meta charset="utf-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f9;
                            padding: 20px;
                        }
                        h1 {
                            font-size: 24px;
                            color: #333;
                        }
                        .result {
                            margin-bottom: 20px;
                            padding: 10px;
                            background-color: #e0f7fa;
                            border-radius: 10px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        }
                        .result a {
                            color: #0077cc;
                            text-decoration: none;
                            font-weight: bold;
                        }
                        .result a:hover {
                            text-decoration: underline;
                        }
                        pre {
                            font-size: 16px;
                            color: #333;
                        }
                    </style>
                </head>
                <body>
                    <h1>Resumen y Resultados</h1>
                    <div class="result">${result}</div>
                </body>
                </html>
            `)}`
      );

      sidebarView.webContents.send('loading-stopped'); // Detener indicador de carga en la sidebar
    } catch (error) {
      console.error('Error al hacer la búsqueda:', error);
      sidebarView.webContents.send('loading-stopped');
      googleView.webContents.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Error en la búsqueda</title>
                    <meta charset="utf-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 20px;
                            background-color: #f4f4f4;
                        }
                        h1 {
                            font-size: 24px;
                            color: #ff0000;
                        }
                    </style>
                </head>
                <body>
                    <h1>Error al realizar la búsqueda</h1>
                    <p>Hubo un problema al conectar con la API de OpenAI.</p>
                </body>
                </html>
            `)}`
      );
    }
  });

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

  //#region Swipe gestures
  googleView.webContents.on('did-finish-load', () => {
    googleView.webContents.executeJavaScript(`
      const { ipcRenderer } = require('electron');
      let lastDeltaX = 0;
      window.addEventListener('wheel', (event) => {
        // Detectar gestos horizontales significativos
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX - lastDeltaX) > 50) {
          if (event.deltaX > 0) {
            ipcRenderer.send('wheel-swipe', 'right');
          } else {
            ipcRenderer.send('wheel-swipe', 'left');
          }
          lastDeltaX = event.deltaX;
        }
      });
      document.addEventListener('keydown', (event) => {
        // Detectar si el foco está en un campo de texto o textarea
        const activeElement = document.activeElement;
        const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable;

        if (!isInput) {
          // Si no está en un input, las flechas harán scroll
          if (event.key === 'ArrowUp') {
            window.scrollBy(0, -100); // Scroll hacia arriba
            event.preventDefault(); // Evitar que el evento se propague
          }
          if (event.key === 'ArrowDown') {
            window.scrollBy(0, 100); // Scroll hacia abajo
            event.preventDefault(); // Evitar que el evento se propague
          }
        }
      });
    `);
  });

  ipcMain.on('wheel-swipe', (event, direction) => {
    if (direction === 'right') {
      if (googleView.webContents.navigationHistory.canGoForward()) {
        googleView.webContents.navigationHistory.goForward();
      }
    } else if (direction === 'left') {
      if (googleView.webContents.navigationHistory.canGoBack()) {
        googleView.webContents.navigationHistory.goBack();
      }
    }
  });
  //#endregion
}

async function registerShortcuts() {
  try {
    await googleView.webContents.executeJavaScript(`
    let currentElementIndex = 0;
    let interactiveElements = Array.from(document.querySelectorAll('a, button, [role="button"], [role="link"], div[onclick], span[onclick]'));

    if (interactiveElements.length > 0) {
      // Resaltar el primer elemento interactivo
      interactiveElements[currentElementIndex].focus();
    }

    document.addEventListener('keydown', handleNavigation);

    function handleNavigation(event) {
      if (!['ArrowUp', 'ArrowDown', 'ArrowRight'].includes(event.key)) return;

      if (event.key === 'ArrowDown') {
        // Moverse al siguiente elemento interactivo
        currentElementIndex = (currentElementIndex + 1) % interactiveElements.length;
        interactiveElements[currentElementIndex].focus();
        event.preventDefault();
      }

      if (event.key === 'ArrowUp') {
        // Moverse al elemento interactivo anterior
        currentElementIndex = (currentElementIndex - 1 + interactiveElements.length) % interactiveElements.length;
        interactiveElements[currentElementIndex].focus();
        event.preventDefault();
      }

      if (event.key === 'ArrowRight') {
        // Simular un clic en el elemento seleccionado
        const currentElement = interactiveElements[currentElementIndex];
        if (typeof currentElement.click === 'function') {
          currentElement.click();
        } else {
          // Intentar simular clic en caso de que no tenga un método 'click'
          let event = new MouseEvent('click', { bubbles: true, cancelable: true });
          currentElement.dispatchEvent(event);
        }
        event.preventDefault();
      }

      if (event.key === 'ArrowLeft') {
      }
    }
    `);
  } catch (error) {
    console.error('Error al registrar atajos de teclado:', error);
  }
}

async function deactivateShortcuts() {
  await googleView.webContents.executeJavaScript(`
    document.removeEventListener('keydown', (event) => {}); // Remover el listener de keydown
  `);
}

//#endregion

//#region Funciones de scraping
function scrapeCurrent() {
  const html = googleView.webContents.executeJavaScript(
    'document.body.innerHTML'
  ); // Obtener el HTML de la página actual
}
//#endregion

//#region Manejo de eventos de la app
app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('Shift+Z+X', () => {
    keyboardNavigation = !keyboardNavigation;
    if (keyboardNavigation) {
      registerShortcuts();
    } else {
      deactivateShortcuts();
    }
  });

  //#region Funciones de teclado

  //#endregion

  //#region Handling shortcuts
  globalShortcut.register('CommandOrControl+W', () => {
    mainWindow.close();
  });
  globalShortcut.register('CommandOrControl+Q', () => {
    app.quit();
  });
  globalShortcut.register('CommandOrControl+M', () => {
    mainWindow.minimize();
  });

  //#endregion
});

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

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
//#endregion
