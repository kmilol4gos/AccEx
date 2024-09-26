const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, "src", "preload.js"),
			contextIsolation: false,
			enableRemoteModule: true,
			nodeIntegration: true,
			webSecurity: false, // Esto deshabilita la seguridad de red para permitir las solicitudes externas
		},
	});

	mainWindow.loadFile(path.join(__dirname, "src", "pages", "index.html"));

	mainWindow.on("closed", function () {
		mainWindow = null;
	});
}

app.whenReady().then(createWindow);

app.on("window-all-closed", function () {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", function () {
	if (mainWindow === null) {
		createWindow();
	}
});
