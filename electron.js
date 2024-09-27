const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const path = require("path");

let mainWindow;
let googleView;
let sidebarView;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, "src", "preload.js"),
			contextIsolation: true,
			enableRemoteModule: false,
			nodeIntegration: false,
			webSecurity: true,
		},
	});

	// Crear la vista de la sidebar
	sidebarView = new BrowserView({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});
	mainWindow.setBrowserView(sidebarView);
	sidebarView.webContents.loadFile(
		path.join(__dirname, "src", "pages", "sidebar.html")
	);

	// Crear la vista para Google
	googleView = new BrowserView({
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
	});
	mainWindow.addBrowserView(googleView);
	googleView.webContents.loadURL("https://www.google.com");

	// Ajustar las vistas al tamaño de la ventana
	function adjustViews() {
		const { width, height } = mainWindow.getBounds();
		const sidebarWidth = Math.floor(width * 0.25);
		sidebarView.setBounds({ x: 0, y: 0, width: sidebarWidth, height: height });
		googleView.setBounds({
			x: sidebarWidth,
			y: 0,
			width: width - sidebarWidth,
			height: height,
		});
	}

	mainWindow.on("resize", adjustViews);
	adjustViews();

	// Manejar el evento de cierre de la ventana
	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}

// Escuchar eventos IPC desde la sidebar para navegar a diferentes URLs
ipcMain.on("navigate-to", (event, url) => {
	if (googleView && googleView.webContents) {
		googleView.webContents.loadURL(url);
	}
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (mainWindow === null) {
		createWindow();
	}
});
