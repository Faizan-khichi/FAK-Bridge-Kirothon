# ⚡ FAK Bridge

### Zero-Friction Offline Cross-Device Sync

[![Built with Kiro](https://img.shields.io/badge/Built%20with-Kiro-00F2FE?style=for-the-badge)](https://kiro.dev)
[![Kirothon 2026](https://img.shields.io/badge/Kirothon-2026-4FACFE?style=for-the-badge)](https://kirothon.dev)
[![Platform](https://img.shields.io/badge/Platform-Android%20%2B%20Windows-111113?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-00E676?style=for-the-badge)]()

---

## The Problem

Moving files and clipboard data between your phone and PC is still painfully slow in 2026:
- Cloud services require internet and have upload limits
- Bluetooth is unreliable and slow for large files
- Email/messaging apps compress your photos and videos
- USB cables are inconvenient and require drivers

**FAK Bridge eliminates all of this.** One QR scan. Instant sync. Zero cloud. Zero internet.

---

## The Solution

FAK Bridge connects your Android phone to your Windows PC over local Wi-Fi with:

| Feature | Description |
|---------|-------------|
| 📋 **Clipboard Sync** | Push/pull clipboard between devices in real-time via WebSocket |
| 📁 **Instant File Transfer** | Send photos, videos, documents at full LAN speed (no compression) |
| 📷 **QR Pairing** | Scan QR code on PC to connect — zero typing required |
| 🖥️ **Auto-Open** | Files received on PC open automatically in the default app |
| 📱 **Auto-Download** | Files sent from PC download to phone with progress bar |
| 🔒 **Authorization** | Both devices must approve the connection before any data flows |
| 🛡️ **Obfuscated Builds** | R8/ProGuard (Android) + javascript-obfuscator (Windows) |

---

## Innovation Highlights

### 1. Zero-Config QR Pairing
No IP typing. No Bluetooth pairing. Open the app, scan the QR on your PC screen, connected in under 2 seconds.

### 2. Windows Auto-Open
When you send a photo from your phone, it instantly pops open on your PC monitor. Videos play automatically. PDFs open in your reader. The `open` module triggers Windows' native file association system.

### 3. Build-Time ASAR Obfuscation
The desktop .exe contains zero readable JavaScript. Our build pipeline runs `javascript-obfuscator` with control flow flattening, string encoding, and self-defending code before packaging into a sealed ASAR archive.

### 4. Bi-Directional Transfer with Progress
Real-time progress bars for both upload (phone→PC) and download (PC→phone). No silent failures — every transfer shows percentage and confirms completion.

---

## Architecture

```
┌──────────────┐       Wi-Fi LAN        ┌──────────────┐
│  Android App │ ◄── WebSocket ────────► │  Windows PC  │
│  (React Native) │ ── HTTP POST ──────► │  (Electron)  │
│              │ ◄── HTTP GET ─────────  │              │
└──────────────┘                         └──────────────┘
```

- **WebSocket** — Real-time clipboard sync + connection management
- **HTTP** — High-speed binary file transfers (up to 500MB)
- **Express** — REST API for file management and device discovery
- **System Tray** — PC app runs silently in background

---

## Setup Instructions (For Judges)

### Prerequisites
- Windows 10/11 PC
- Android phone (Android 10+)
- Both devices on the same Wi-Fi network
- Node.js 18+ installed on PC

### 1. Clone & Install (PC)

```bash
git clone https://github.com/Faizan-khichi/FAK-Bridge-Kirothon.git
cd FAK-Bridge-Kirothon/fak-bridge-desktop
npm install
npm start
```

The app appears in your system tray. Click the icon to see your IP and QR code.

### 2. Install APK (Phone)

Transfer `FAKBridge-v2.apk` to your phone and install it.
Or use ADB:
```bash
adb install FAKBridge-v2.apk
```

### 3. Connect

1. Open FAK Bridge on your phone
2. Tap **"Scan QR"** and point at the QR code on your PC
3. Approve the connection on both devices
4. Start syncing!

### Alternative: Windows Installer

Run `FAK Bridge Setup 1.0.0.exe` from the `fak-bridge-desktop/dist/` folder for a one-click install with desktop shortcut.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.85, TypeScript, react-native-camera-kit |
| Desktop | Electron 35, Express 5, WebSocket (ws) |
| File Handling | multer, react-native-fs, react-native-file-viewer |
| Security | R8/ProGuard, javascript-obfuscator, ASAR |
| Build | Gradle (Android), electron-builder (Windows) |
| QR | qrcode (generate), react-native-camera-kit (scan) |

---

## Security

| Layer | Protection |
|-------|-----------|
| Android APK | R8 minification, ProGuard obfuscation, log stripping |
| Windows .exe | JS obfuscation (control flow flattening, string encoding, self-defending) |
| Network | Local Wi-Fi only, no internet, authorization dialogs |
| Data | No cloud storage, no telemetry, zero data leaves your network |

---

## Project Structure

```
FAK-Bridge-Kirothon/
├── fak-bridge-desktop/          # Electron PC companion app
│   ├── main.js                  # Express + WebSocket + Electron
│   ├── ui.html                  # Premium dark-mode UI
│   ├── package.json             # Build configuration
│   └── dist/                    # Built .exe installer
├── fak-bridge-pc/               # Standalone Node.js server (alternative)
│   └── server.js
├── FAKBridge-v2.apk             # Android APK (ready to install)
├── .kiro/
│   ├── steering/architecture.md # System architecture doc
│   └── prompts/master_prompts.md # Key prompts used
├── DEVLOG.md                    # Development timeline
├── PRESENTATION_SCRIPT.md       # Demo video script
└── README.md                    # This file
```

---

## Demo Video

See `PRESENTATION_SCRIPT.md` for the 3-minute demo structure.

---

## Built With Kiro

This entire project was built using Kiro's autonomous agent capabilities:
- **Code Generation** — Server, mobile app, and desktop app written by Kiro
- **Debugging** — Crash logs analyzed and fixed autonomously
- **Build Automation** — VPS builds orchestrated via Python/paramiko
- **Architecture** — System design decisions made collaboratively with Kiro
- **Documentation** — All docs generated by Kiro

---

## License

MIT License — Built for Kirothon 2026 by FAK LAB
