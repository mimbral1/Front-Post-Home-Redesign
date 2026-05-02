const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');

const isDev = process.env.ELECTRON_DEV === 'true';

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 760,
    title: 'POS Mimbral',
    autoHideMenuBar: true,
    backgroundColor: '#f3f5f7',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  window.once('ready-to-show', () => {
    window.maximize();
    window.show();
  });

  if (isDev) {
    window.loadURL('http://127.0.0.1:5173');
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && ['+', '-', '0'].includes(input.key)) {
      event.preventDefault();
    }
  });

  return window;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  ipcMain.handle('print-receipt', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    await window.webContents.print({ silent: false, printBackground: true });
  });
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
