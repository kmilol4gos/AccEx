const { app, BrowserWindow } = require("electron");
const path = require("path");

const createWindow = () => {
	const wind = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: true, // Habilita la integración con Node.js
			contextIsolation: false, // Permite el uso de Electron APIs en renderer.js
		},
	});

	wind.loadFile("index.html");
};

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
