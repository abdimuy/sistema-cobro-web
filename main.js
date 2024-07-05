import { app, BrowserWindow } from "electron";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import getPort from "get-port";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const server = express();

// Configura el servidor para servir los archivos estáticos
server.use(express.static(path.join(__dirname, "dist")));

async function startServer() {
  // Intenta encontrar un puerto disponible, comenzando por el 3000
  const port = await getPort({ port: 3000 });

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    createWindow(`http://localhost:${port}`);
  });
}

function createWindow(url) {
  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Sistema Muebles San Pablo",
  });

  // Carga la URL del servidor local
  mainWindow.loadURL(url);

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    console.log("Ventana cerrada");
    mainWindow = null;
  });
}

app.whenReady().then(startServer);

app.on("window-all-closed", () => {
  console.log("Todas las ventanas cerradas");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  console.log("Aplicación activada");
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow(`http://localhost:${port}`); // Asegúrate de que el puerto esté accesible aquí si es necesario
  }
});
