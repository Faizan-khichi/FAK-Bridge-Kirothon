# FAK Bridge — Master Prompts Used During Development

## Prompt 1: Electron Desktop App with System Tray

```
Act as a Principal Systems Architect and Lead React Native Engineer. Build a Node.js desktop 
background service that runs silently, listens for incoming files and clipboard updates via 
WebSocket on port 8080. Use clipboardy for clipboard management and the open module to 
instantly open received media files. Add a system tray icon with a premium dark-mode popup 
UI showing QR code, connected devices, and received files list.
```

**Result:** Kiro generated the complete Electron main.js (350+ lines) with Express server, 
WebSocket handling, Tray icon, frameless BrowserWindow, and IPC handlers — all in one pass.

---

## Prompt 2: QR Scanner with Apple-Style Viewfinder

```
Add a "Zero-Friction QR Scanner" so the user can scan the PC's Local IP from the desktop 
screen and automatically connect. Use react-native-camera-kit with barcode scanning. 
Overlay the camera with a translucent dark mask leaving a clear transparent square in the 
center with 4 white corner brackets. Add haptic vibration on successful scan. Parse the 
IP from the QR value and auto-connect via WebSocket.
```

**Result:** Kiro implemented the full-screen camera modal with CSS-based viewfinder mask, 
corner brackets, permission handling, vibration feedback, and auto-connection logic.

---

## Prompt 3: Obfuscated Windows .exe Build

```
Convert the Electron app into a standalone Windows .exe. Use javascript-obfuscator with 
control flow flattening, string array encoding (base64, rc4), self-defending mode, and 
split strings. Package into NSIS installer with ASAR sealing. Cross-compile from Linux 
VPS using electron-builder + wine.
```

**Result:** Kiro wrote the complete build pipeline script, uploaded files to VPS via SFTP, 
ran the obfuscator, and produced a 79MB NSIS installer with fully unreadable source code.

---

## Prompt 4: R8/ProGuard Android Security

```
Enable R8/ProGuard for the release APK. Write custom proguard-rules.pro that keeps React 
Native classes, strips debug logs, applies aggressive optimization (5 passes), repackages 
classes, and overloads aggressively. Ensure native modules are preserved.
```

**Result:** Kiro enabled `enableProguardInReleaseBuilds = true`, wrote 50+ lines of 
ProGuard rules, and rebuilt the APK — reducing size from 76MB to 73MB with full obfuscation.

---

## Prompt 5: Real-Time Progress Bars + Auto-Open

```
Implement real-time upload progress using axios onUploadProgress. Show a 6px cyan progress 
bar during transfer. For downloads, use RNFS.downloadFile with progress callback. Once 
download completes, auto-open the file using react-native-file-viewer with showOpenWithDialog. 
Handle duplicate filenames with auto-rename (append timestamp).
```

**Result:** Kiro implemented both upload and download progress bars, the auto-open logic, 
duplicate file handling, and fixed the infinite retry loop bug — all diagnosed from 
screenshot analysis of the error state.
