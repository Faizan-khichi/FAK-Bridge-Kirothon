# FAK Bridge — System Architecture

## Overview

FAK Bridge is a zero-configuration, offline-first cross-device sync tool that connects Android phones to Windows PCs over local Wi-Fi. It provides instant clipboard sharing, high-speed file transfer, and automatic file execution.

## Architecture Diagram

```
┌─────────────────────────┐         Local Wi-Fi LAN         ┌─────────────────────────┐
│     Android Phone       │                                  │     Windows PC          │
│   (React Native APK)    │                                  │   (Electron + Node.js)  │
│                         │                                  │                         │
│ ┌─────────────────────┐ │    WebSocket (ws://IP:8080)      │ ┌─────────────────────┐ │
│ │ Clipboard Manager   │◄├──────────────────────────────────┤►│ Clipboard Manager   │ │
│ └─────────────────────┘ │    Bi-directional real-time      │ └─────────────────────┘ │
│                         │                                  │                         │
│ ┌─────────────────────┐ │    HTTP POST /upload             │ ┌─────────────────────┐ │
│ │ File Sender         │─├──────────────────────────────────┤►│ File Receiver       │ │
│ └─────────────────────┘ │    multipart/form-data           │ │ + Auto-Open (open)  │ │
│                         │                                  │ └─────────────────────┘ │
│ ┌─────────────────────┐ │    HTTP GET /download/:file      │ ┌─────────────────────┐ │
│ │ File Receiver       │◄├──────────────────────────────────┤─│ File Sender         │ │
│ │ + Auto-Open (FV)    │ │    with progress callback        │ │ (Dialog picker)     │ │
│ └─────────────────────┘ │                                  │ └─────────────────────┘ │
│                         │                                  │                         │
│ ┌─────────────────────┐ │    HTTP GET /                    │ ┌─────────────────────┐ │
│ │ Network Discovery   │─├──────────────────────────────────┤►│ Health Endpoint     │ │
│ │ + QR Scanner        │ │    Device discovery scan         │ └─────────────────────┘ │
│ └─────────────────────┘ │                                  │                         │
└─────────────────────────┘                                  └─────────────────────────┘
```

## Communication Protocol

### WebSocket Layer (Real-time)
- **Purpose:** Clipboard sync, connection status, heartbeat
- **Messages:**
  - `{type: "clipboard", text: "..."}` — Push clipboard to PC
  - `{type: "pull_clipboard"}` — Request PC clipboard
  - `{type: "clipboard_response", text: "..."}` — PC sends clipboard back
  - `{type: "connected"}` — Connection confirmed
  - `{type: "denied"}` — Connection rejected by user

### HTTP Layer (File Transfer)
- **POST /upload** — Phone sends file to PC (multipart/form-data, 500MB max)
- **GET /pending-for-phone** — Phone polls for files queued by PC
- **GET /download/:filename** — Phone downloads a specific file
- **POST /ack-download** — Phone confirms receipt (removes from queue)

## Security Architecture

### Mobile (Android)
- R8/ProGuard enabled with aggressive optimization
- Class repackaging and method inlining
- Debug log stripping in release builds
- Camera permission requested at runtime only

### Desktop (Windows)
- javascript-obfuscator with:
  - Control flow flattening
  - String array encoding (base64)
  - Self-defending code
- ASAR archive packaging
- Connection authorization dialog (user must approve each device)

### Network Security
- All communication over local Wi-Fi only (no internet required)
- `android:usesCleartextTraffic="true"` scoped to local network
- Authorization required on both ends before data transfer

## Build Pipeline

### Android APK
```
App.tsx → Metro Bundler → JS Bundle → Gradle + R8 → Signed APK
```

### Windows .exe
```
main.js → javascript-obfuscator → Obfuscated JS → electron-builder → NSIS Installer
```
