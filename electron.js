const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const path = require("path");
const OpenAI = require("openai");
require("dotenv").config();

// Inicializar OpenAI con la clave de API desde las variables de entorno
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY, // Asegúrate de que la clave esté en tus variables de entorno
});

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

	// Crear la vista para mostrar los resultados (o la vista de Google)
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
		const navbarHeight = 50;
		const sidebarWidth = Math.floor(width * 1);
		sidebarView.setBounds({
			x: 0,
			y: 0,
			width: sidebarWidth,
			height: navbarHeight,
		});
		googleView.setBounds({
			x: 0,
			y: navbarHeight,
			width: width,
			height: height - navbarHeight,
		});
	}

	mainWindow.on("resize", adjustViews);
	adjustViews();

	// Manejar eventos IPC desde la sidebar para realizar la consulta a OpenAI
	ipcMain.on("search-query", async (event, query) => {
		try {
			// Hacer la solicitud a OpenAI utilizando tu GPT personalizado
			const response = await openai.chat.completions.create({
				model: "gpt-4o",
				messages: [
					{
						role: "system",
						content:
							"eres un navegador, tienes que buscar dentro de las primeras 6 opciones de google cuando alguien te pregunte algo, mostrando en primer lugar el link que mas se asemeje a lo que te preguntan, también haces un resumen de lo mas importante que se está preguntando y muestras posibles links que estén relacionado a la información que sacaste para hacer el resumen. El resumen debes dejarlo bien legible y que se entienda bien para todo tipo de personas",
					},
					{
						role: "user",
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

			sidebarView.webContents.send("loading-stopped"); // Detener indicador de carga en la sidebar
		} catch (error) {
			console.error("Error al hacer la búsqueda:", error);
			sidebarView.webContents.send("loading-stopped");
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

	// Manejar redirecciones dinámicas según los botones de la barra lateral
	ipcMain.on("navigate-to", (event, url) => {
		googleView.webContents.loadURL(url);
	});

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}

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
