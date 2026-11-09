'use strict';

const { app, BrowserWindow, Menu, protocol, shell, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const APP_ORIGIN = 'app://voidweaver';
const ROOT = __dirname;
let mainWindow = null;
let allowClose = false;

// The game is a local, fully offline app. Disabling Chromium's OS sandbox
// avoids launch failures on Windows configurations where the sandbox helper
// cannot start (common for portable unsigned builds).
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');

app.setName('Void Weaver');
try {
  const portableRoot = process.env.PORTABLE_EXECUTABLE_DIR;
  const userData = process.env.VW_USER_DATA ||
    (portableRoot
      ? path.join(portableRoot, 'Void Weaver Data')
      : path.join(app.getPath('appData'), 'Void Weaver'));
  fs.mkdirSync(userData, { recursive: true });
  app.setPath('userData', userData);
} catch (_) {}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true
    }
  }
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 960,
    minHeight: 600,
    show: false,
    center: true,
    fullscreen: true,
    backgroundColor: '#03020a',
    title: 'Void Weaver',
    autoHideMenuBar: true,
    icon: path.join(ROOT, 'icon.png'),
    webPreferences: {
      preload: path.join(ROOT, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: true
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();
  mainWindow.loadURL(`${APP_ORIGIN}/index.html`);

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) return;
    mainWindow.setFullScreen(true);
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) return;
    mainWindow.webContents.insertCSS(`
      *, *::before, *::after {
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
      }
      ::selection { background: transparent !important; color: inherit !important; }
      html, body { overscroll-behavior: none; }
    `).catch(() => {});
  });

  mainWindow.webContents.on('context-menu', event => {
    event.preventDefault();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_ORIGIN)) event.preventDefault();
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      event.preventDefault();
      if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
    if (input.key === 'F12' && input.control && input.shift) {
      event.preventDefault();
      if (mainWindow) mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.on('close', event => {
    if (allowClose || !mainWindow) return;
    event.preventDefault();
    const finish = () => {
      allowClose = true;
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
    };
    Promise.race([
      mainWindow.webContents.executeJavaScript(
        '(()=>{try{window.VoidWeaver?.game?.saveRun?.();}catch(e){}return true;})()',
        true
      ),
      new Promise(resolve => setTimeout(resolve, 700))
    ]).then(finish, finish);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    protocol.handle('app', async request => {
      const url = new URL(request.url);
      let relative = decodeURIComponent(url.pathname || '/index.html').replace(/^\/+/, '');
      if (!relative) relative = 'index.html';
      const file = path.resolve(ROOT, relative);
      if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
        return new Response('Not found', { status: 404 });
      }
      try {
        const data = await fs.promises.readFile(file);
        const ext = path.extname(file).toLowerCase();
        const mime = ext === '.html' ? 'text/html; charset=utf-8'
          : ext === '.js' ? 'text/javascript; charset=utf-8'
            : ext === '.png' ? 'image/png'
              : ext === '.ico' ? 'image/x-icon'
                : 'application/octet-stream';
        return new Response(data, { headers: { 'content-type': mime } });
      } catch (_) {
        return new Response('Not found', { status: 404 });
      }
    });

    Menu.setApplicationMenu(null);

    ipcMain.on('desktop:quit', () => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
      else app.quit();
    });

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => app.quit());
}
