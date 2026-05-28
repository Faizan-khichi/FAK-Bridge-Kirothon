const { app, BrowserWindow, Tray, Menu, nativeImage, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const multer = require('multer');
const fs = require('fs');
const ip = require('ip');

let tray = null;
let mainWindow = null;
let server = null;
let wss = null;
let PORT = 8080;
const RECEIVED_DIR = path.join(app.getPath('userData'), 'received');
const clients = new Map(); // ws -> { ip, name, connectedAt }
let receivedFiles = [];

// Ensure received directory
if (!fs.existsSync(RECEIVED_DIR)) {
  fs.mkdirSync(RECEIVED_DIR, { recursive: true });
}

// Load existing files
function loadReceivedFiles() {
  try {
    const files = fs.readdirSync(RECEIVED_DIR)
      .filter(f => {
        const fullPath = path.join(RECEIVED_DIR, f);
        return fs.statSync(fullPath).isFile(); // Skip directories like 'to-phone'
      })
      .map(f => {
        const stat = fs.statSync(path.join(RECEIVED_DIR, f));
        return { name: f, size: stat.size, path: path.join(RECEIVED_DIR, f), date: stat.mtime };
      });
    receivedFiles = files.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
  } catch (e) {}
}

// ─── Express + WebSocket Server ──────────────────────────────────────────────
function startServer() {
  const expressApp = express();
  server = http.createServer(expressApp);
  wss = new WebSocketServer({ server });

  expressApp.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });
  expressApp.use(express.json());

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, RECEIVED_DIR),
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${timestamp}_${safeName}`);
    }
  });
  const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

  // File upload
  expressApp.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const filePath = path.resolve(req.file.path);
    const fileSize = (req.file.size / 1024 / 1024).toFixed(2);
    
    receivedFiles.unshift({
      name: req.file.originalname,
      size: req.file.size,
      path: filePath,
      date: new Date()
    });
    if (receivedFiles.length > 50) receivedFiles = receivedFiles.slice(0, 50);

    // Smart file execution - open with system default handler
    try {
      const openModule = await import('open');
      await openModule.default(filePath);
      console.log(`Opened: ${req.file.originalname}`);
    } catch (e) {
      console.log(`Could not auto-open: ${req.file.originalname} (${e.message})`);
    }

    // Notify UI
    if (mainWindow) mainWindow.webContents.send('file-received', { name: req.file.originalname, size: fileSize });

    res.json({ status: 'success', filename: req.file.filename, originalName: req.file.originalname, size: req.file.size });
  });

  expressApp.get('/', (req, res) => res.json({ name: 'FAK Bridge', status: 'running', port: PORT }));
  expressApp.get('/clipboard', async (req, res) => {
    try {
      const clip = await import('clipboardy');
      res.json({ text: clip.default.readSync() });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  });
  expressApp.post('/clipboard', async (req, res) => {
    try {
      const clip = await import('clipboardy');
      clip.default.writeSync(req.body.text);
      res.json({ status: 'updated' });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  });

  // PC-to-Phone file push system
  const toPhoneDir = path.join(RECEIVED_DIR, 'to-phone');
  if (!fs.existsSync(toPhoneDir)) fs.mkdirSync(toPhoneDir, { recursive: true });
  const pendingForPhone = [];
  server._pendingForPhone = pendingForPhone;

  expressApp.get('/pending-for-phone', (req, res) => {
    // Deduplicate by name
    const unique = [...new Map(pendingForPhone.map(f => [f.name, f])).values()];
    res.json({ files: unique });
  });

  expressApp.post('/ack-download', (req, res) => {
    const { filename } = req.body;
    // Remove ALL instances of this filename
    while (true) {
      const idx = pendingForPhone.findIndex(f => f.name === filename);
      if (idx === -1) break;
      pendingForPhone.splice(idx, 1);
    }
    res.json({ status: 'ok' });
  });

  expressApp.get('/download/:filename', (req, res) => {
    const filePath = path.join(toPhoneDir, req.params.filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  });

  // IPC: Send file to phone (from desktop UI)
  // Remove previous handler to prevent "second handler" crash on server restart
  try { ipcMain.removeHandler('send-to-phone'); } catch(e) {}
  ipcMain.handle('send-to-phone', async (e, filePaths) => {
    for (const fp of filePaths) {
      const name = path.basename(fp);
      const dest = path.join(toPhoneDir, name);
      fs.copyFileSync(fp, dest);
      pendingForPhone.push({ name, size: fs.statSync(dest).size });
    }
    return { queued: filePaths.length };
  });

  // WebSocket
  wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress?.replace('::ffff:', '') || 'unknown';
    
    // Authorization: show dialog to confirm connection
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'question',
      buttons: ['Allow', 'Deny'],
      defaultId: 0,
      title: 'FAK Bridge — Connection Request',
      message: `Device at ${clientIP} wants to connect`,
      detail: 'This will allow clipboard sharing and file transfers between devices.',
    }).then(result => {
      if (result.response === 0) {
        // Allowed
        clients.set(ws, { ip: clientIP, name: `Phone (${clientIP})`, connectedAt: new Date() });
        if (mainWindow) mainWindow.webContents.send('clients-updated', getClientsArray());
        ws.send(JSON.stringify({ type: 'connected', message: 'FAK Bridge PC connected' }));
      } else {
        // Denied
        ws.send(JSON.stringify({ type: 'denied', message: 'Connection denied by PC user' }));
        ws.close();
      }
    });

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const clip = await import('clipboardy');
        if (msg.type === 'clipboard' && msg.text) {
          clip.default.writeSync(msg.text);
          ws.send(JSON.stringify({ type: 'ack', status: 'clipboard_updated' }));
        } else if (msg.type === 'pull_clipboard') {
          ws.send(JSON.stringify({ type: 'clipboard_response', text: clip.default.readSync() }));
        }
      } catch (e) {}
    });

    ws.on('close', () => {
      clients.delete(ws);
      if (mainWindow) mainWindow.webContents.send('clients-updated', getClientsArray());
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`FAK Bridge running on port ${PORT}`);
  });
}

function getClientsArray() {
  return Array.from(clients.values());
}

// ─── Electron Window ─────────────────────────────────────────────────────────
function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('ui.html');
  mainWindow.on('blur', () => mainWindow.hide());
  mainWindow.on('closed', () => { mainWindow = null; });

  // Position near tray
  const trayBounds = tray.getBounds();
  const windowBounds = mainWindow.getBounds();
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
  const y = Math.round(trayBounds.y - windowBounds.height - 4);
  mainWindow.setPosition(x, y);
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
ipcMain.handle('get-info', () => ({
  ip: ip.address(),
  port: PORT,
  clients: getClientsArray(),
  files: receivedFiles.slice(0, 20),
  receivedDir: RECEIVED_DIR
}));

ipcMain.handle('change-port', (e, newPort) => {
  PORT = parseInt(newPort);
  if (server) {
    server.close(() => {
      startServer();
    });
  }
  return { port: PORT };
});

let serverRunning = true;
ipcMain.handle('toggle-server', () => {
  if (serverRunning) {
    // Stop server
    if (wss) { wss.clients.forEach(ws => ws.close()); }
    if (server) { server.close(); server = null; wss = null; }
    serverRunning = false;
    clients.clear();
  } else {
    // Start server
    startServer();
    serverRunning = true;
  }
  return { running: serverRunning };
});

ipcMain.handle('open-file', (e, filePath) => {
  shell.openPath(filePath);
});

ipcMain.handle('open-folder', () => {
  shell.openPath(RECEIVED_DIR);
});

ipcMain.handle('delete-file', (e, filePath) => {
  try { fs.unlinkSync(filePath); } catch (err) {}
  loadReceivedFiles();
  return { status: 'deleted' };
});

ipcMain.handle('send-to-phone-dialog', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select files to send to phone',
    properties: ['openFile', 'multiSelections'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const toPhoneDir = path.join(RECEIVED_DIR, 'to-phone');
    if (!fs.existsSync(toPhoneDir)) fs.mkdirSync(toPhoneDir, { recursive: true });
    for (const fp of result.filePaths) {
      const name = path.basename(fp);
      const dest = path.join(toPhoneDir, name);
      fs.copyFileSync(fp, dest);
      if (server && server._pendingForPhone) {
        // Prevent duplicates
        const queue = server._pendingForPhone;
        if (!queue.find(f => f.name === name)) {
          queue.push({ name, size: fs.statSync(dest).size });
        }
      }
    }
    return { queued: result.filePaths.length };
  }
  return { queued: 0 };
});

// ─── App Lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Create tray icon
  const iconPath = path.join(__dirname, 'icon.png');
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    trayIcon = nativeImage.createFromBuffer(createTrayIconBuffer(), { width: 16, height: 16 });
  }
  trayIcon = trayIcon.resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip('FAK Bridge — Click to open');

  tray.on('click', () => createWindow());
  tray.on('right-click', () => {
    const contextMenu = Menu.buildFromTemplate([
      { label: `FAK Bridge (${ip.address()}:${PORT})`, enabled: false },
      { type: 'separator' },
      { label: 'Open Panel', click: () => createWindow() },
      { label: 'Open Received Files', click: () => shell.openPath(RECEIVED_DIR) },
      { type: 'separator' },
      { label: 'Quit', click: () => { app.quit(); } }
    ]);
    tray.popUpContextMenu(contextMenu);
  });

  loadReceivedFiles();
  startServer();

  // Add to startup
  app.setLoginItemSettings({ openAtLogin: true, path: app.getPath('exe') });
});

app.on('window-all-closed', (e) => e.preventDefault()); // Keep running in tray

function createTrayIconBuffer() {
  // 16x16 RGBA: Two linked rings (geometric abstract logo) - monochrome white
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4);
  const cx1 = 6, cy1 = 8, cx2 = 10, cy2 = 8;
  const r = 5.5, thickness = 1.3;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const d1 = Math.sqrt((x - cx1) ** 2 + (y - cy1) ** 2);
      const d2 = Math.sqrt((x - cx2) ** 2 + (y - cy2) ** 2);

      // Ring 1 outline
      const ring1 = Math.abs(d1 - r) < thickness;
      // Ring 2 outline
      const ring2 = Math.abs(d2 - r) < thickness;
      // Bridge line in the overlap zone
      const inOverlap = x >= cx1 && x <= cx2 && Math.abs(y - 8) < 1.2;

      if (ring1 || ring2 || inOverlap) {
        // Cyan/teal gradient: left=00F2FE, right=4FACFE
        const t = x / size;
        buffer[idx] = Math.round(0 + t * 79);       // R: 0 -> 79
        buffer[idx + 1] = Math.round(242 - t * 70); // G: 242 -> 172
        buffer[idx + 2] = 254;                        // B: 254
        buffer[idx + 3] = 255;                        // A
      } else {
        buffer[idx + 3] = 0; // transparent
      }
    }
  }
  return buffer;
}
