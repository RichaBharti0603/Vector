const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const waitOn = require('wait-on');

let mainWindow;

async function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Wait for Next.js to start
  const url = 'http://localhost:3000';
  await waitOn({ resources: [url], timeout: 30000 });

  mainWindow.loadURL(url + '/overlay');

  // Open the dashboard in a separate window
  const dashboardWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  dashboardWindow.loadURL(url + '/dashboard');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
