/**
 * FAK Bridge — PC Companion Server
 * 
 * Ultra-fast local clipboard sync + file transfer over Wi-Fi.
 * Connects your Android phone to your PC seamlessly.
 * 
 * Features:
 * - WebSocket for real-time bi-directional clipboard sync
 * - HTTP POST endpoint for high-speed file transfers
 * - Auto-opens received media files instantly
 * - Zero-config LAN discovery (prints IP on start)
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ip = require('ip');

// Dynamic imports for ESM modules
let clipboardy;
let open;

async function loadESMModules() {
  clipboardy = await import('clipboardy');
  open = (await import('open')).default;
}

// ─── Configuration ───────────────────────────────────────────────────────────
const PORT = 8080;
const RECEIVED_DIR = path.join(__dirname, 'received');

// Ensure received directory exists
if (!fs.existsSync(RECEIVED_DIR)) {
  fs.mkdirSync(RECEIVED_DIR, { recursive: true });
}

// ─── Express + HTTP Server Setup ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// CORS for mobile app access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// ─── Multer File Upload Config ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RECEIVED_DIR),
  filename: (req, file, cb) => {
    // Preserve original filename with timestamp prefix to avoid collisions
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max
});

// ─── WebSocket Server ────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`✓ Device connected: ${clientIP}`);
  clients.add(ws);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'clipboard':
          // Phone is pushing clipboard text to PC
          if (message.text) {
            clipboardy.default.writeSync(message.text);
            console.log(`📋 Clipboard updated: "${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}"`);
            ws.send(JSON.stringify({ type: 'ack', status: 'clipboard_updated' }));
          }
          break;

        case 'pull_clipboard':
          // Phone is requesting PC's clipboard
          const pcClipboard = clipboardy.default.readSync();
          ws.send(JSON.stringify({ type: 'clipboard_response', text: pcClipboard }));
          console.log(`📤 Sent PC clipboard to phone: "${pcClipboard.substring(0, 50)}${pcClipboard.length > 50 ? '...' : ''}"`);
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.log(`⚠ Unknown message type: ${message.type}`);
      }
    } catch (err) {
      console.error('✗ Message parse error:', err.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`✗ Device disconnected: ${clientIP}`);
  });

  ws.on('error', (err) => {
    console.error(`✗ WebSocket error: ${err.message}`);
    clients.delete(ws);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'FAK Bridge PC connected',
    timestamp: Date.now()
  }));
});

// ─── HTTP Endpoints ──────────────────────────────────────────────────────────

// Health check + discovery endpoint (phone scans for this)
app.get('/', (req, res) => {
  res.json({
    name: 'FAK Bridge PC',
    version: '1.0.0',
    status: 'running',
    connectedDevices: clients.size,
    receivedDir: RECEIVED_DIR
  });
});

// Discovery endpoint — phone pings this to find the PC
app.get('/discover', (req, res) => {
  const os = require('os');
  res.json({
    name: 'FAK Bridge PC',
    hostname: os.hostname(),
    ip: ip.address(),
    port: PORT,
    timestamp: Date.now()
  });
});

// File upload endpoint — the "AirDrop" receiver
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file received' });
  }

  const filePath = path.resolve(req.file.path);
  const fileSize = (req.file.size / 1024 / 1024).toFixed(2);

  console.log(`📁 File received: ${req.file.originalname} (${fileSize} MB)`);
  console.log(`   Saved to: ${filePath}`);

  // Auto-open the file on PC
  try {
    await open(filePath);
    console.log(`🖥  Auto-opened: ${req.file.originalname}`);
  } catch (err) {
    console.log(`⚠ Could not auto-open file: ${err.message}`);
  }

  res.json({
    status: 'success',
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    path: filePath
  });
});

// Get clipboard via HTTP (alternative to WebSocket)
app.get('/clipboard', (req, res) => {
  try {
    const text = clipboardy.default.readSync();
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read clipboard' });
  }
});

// Set clipboard via HTTP (alternative to WebSocket)
app.post('/clipboard', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });
    clipboardy.default.writeSync(text);
    console.log(`📋 Clipboard set via HTTP: "${text.substring(0, 50)}..."`);
    res.json({ status: 'updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write clipboard' });
  }
});

// List received files
app.get('/files', (req, res) => {
  const files = fs.readdirSync(RECEIVED_DIR).map(f => {
    const stat = fs.statSync(path.join(RECEIVED_DIR, f));
    return { name: f, size: stat.size, modified: stat.mtime };
  });
  res.json({ files, count: files.length });
});

// ─── Start Server ────────────────────────────────────────────────────────────
async function start() {
  await loadESMModules();

  server.listen(PORT, '0.0.0.0', () => {
    const localIP = ip.address();
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║           FAK Bridge — PC Companion v1.0            ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  HTTP Server:    http://${localIP}:${PORT}        ║`);
    console.log(`║  WebSocket:      ws://${localIP}:${PORT}          ║`);
    console.log('║  Status:         ✓ Ready for connections            ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Enter this IP in the FAK Bridge Android app:       ║');
    console.log(`║  ➤  ${localIP}                               ║`);
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Waiting for device connections...');
    console.log('');
  });
}

start().catch(err => {
  console.error('Failed to start FAK Bridge:', err);
  process.exit(1);
});
