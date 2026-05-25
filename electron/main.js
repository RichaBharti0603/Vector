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

  const url = 'http://localhost:3000';

  // Wait for Next.js to start with error handling
  try {
    await waitOn({ resources: [url], timeout: 30000 });
  } catch (err) {
    console.error("Connection to Next.js timed out:", err);
    const errWindow = new BrowserWindow({
      width: 500,
      height: 350,
      title: "Vector System Error",
      backgroundColor: "#030303",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    errWindow.loadURL(`data:text/html,<html>
      <body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; background:#030303; color:#f43f5e; padding:40px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; height:80vh;">
        <h2 style="margin-bottom:10px; font-weight:800; letter-spacing:1px; color:#ef4444;">SYSTEM OFFLINE</h2>
        <p style="color:#a1a1aa; font-size:14px; max-width:350px; line-height:1.6; margin-bottom:20px;">Could not connect to Next.js Control Tower at <strong>${url}</strong>. Please ensure the dev server is running.</p>
        <div style="font-family:monospace; background:#18181b; padding:10px 20px; border-radius:6px; border:1px border #27272a; font-size:12px; color:#e4e4e7;">npm run dev</div>
      </body>
    </html>`);
    return;
  }

  mainWindow.loadURL(url + '/overlay');

  // Open the dashboard in a separate window
  const dashboardWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#000000",
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
