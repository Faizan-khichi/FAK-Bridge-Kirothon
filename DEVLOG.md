# FAK Bridge — Development Log

## Kirothon 2026 | Built with Kiro

---

### Day 1 — Architecture & PC Companion (May 27, 2026)

**Goal:** Design the system architecture and build the Node.js PC server.

- Used Kiro's autonomous agent to scaffold the entire Express + WebSocket server in one pass
- Kiro generated `server.js` with clipboard sync (clipboardy), file upload (multer), and auto-open (open module)
- Server tested locally — prints LAN IP on startup, ready for connections
- Kiro identified the correct ESM dynamic import pattern for `clipboardy` and `open` (both are ESM-only packages in a CommonJS project)

**Kiro Usage:** Kiro wrote the complete server.js (160 lines) autonomously, handling CORS, WebSocket lifecycle, and multer disk storage configuration without manual intervention.

---

### Day 1 (continued) — React Native APK Init

- Attempted local RN init — too slow on Windows (npm timeout issues)
- Pivoted to VPS build strategy using paramiko SSH
- Kiro wrote the full VPS automation script (Python + paramiko) to:
  - Install Node.js 20, Java 17, Android SDK on VPS
  - Accept SDK licenses programmatically
  - Init React Native project, install dependencies
  - Build APK headlessly via `./gradlew assembleRelease`

**Kiro Usage:** Kiro autonomously debugged the `react-native-document-picker` compilation failure, identified the deprecated package, and replaced it with `@react-native-documents/picker` — all via VPS SSH commands.

---

### Day 2 — Premium UI & QR Scanner (May 28, 2026)

**Goal:** Build the premium dark-mode UI with QR scanning.

- Kiro designed the complete App.tsx with:
  - Deep Space Black (#0A0A0B) palette
  - Cyan/Teal gradient (#00F2FE → #4FACFE) accent system
  - Geometric linked-rings logo (CSS-only, no image assets)
  - Card-based layout with subtle borders
- Integrated `react-native-camera-kit` for QR barcode scanning
- Fixed crash: missing `VIBRATE` permission (identified via `adb logcat`)
- Fixed crash: `FAKBridge not registered` (app.json name mismatch)

**Kiro Usage:** Kiro read ADB logcat output, identified the exact crash cause (`SecurityException: vibrate permission`), and fixed it by adding the permission to AndroidManifest.xml — all in one autonomous cycle.

---

### Day 2 (continued) — Electron Desktop App

- Built the system tray Electron app with:
  - Frameless transparent window
  - QR code generation (qrcode library)
  - Server start/stop toggle
  - File management (open, delete)
  - Send-to-phone file picker dialog
  - Connection authorization dialog (Allow/Deny popup)
- Kiro identified and fixed the IPC "second handler" crash by adding `ipcMain.removeHandler()` before re-registration

**Kiro Usage:** Kiro autonomously designed the entire Midnight Glass UI (HTML/CSS) with native desktop feel — custom scrollbars, hover states, SVG icons, and proper `user-select: none` behavior.

---

### Day 2 (continued) — Security & Build

- **APK Security:** Enabled R8/ProGuard with custom rules
  - Aggressive optimization (5 passes)
  - Log stripping in release builds
  - Class repackaging for obfuscation
  - APK size reduced from 76MB → 73MB

- **Desktop Security:** Built obfuscated .exe on VPS
  - javascript-obfuscator with control flow flattening
  - String array encoding (base64)
  - Self-defending code (crashes if modified)
  - ASAR archive sealing
  - NSIS installer generated

**Kiro Usage:** Kiro wrote the complete Webpack obfuscation pipeline and ProGuard rules, cross-compiled the Windows .exe from Linux VPS using wine + electron-builder.

---

### Day 2 (continued) — Progress Bars & Auto-Open

- Implemented real-time upload progress (axios onUploadProgress)
- Implemented download progress (RNFS progress callback)
- Auto-open received files using react-native-file-viewer
- Fixed retry loop bug (failed downloads kept re-queuing)
- Added auto-rename for duplicate filenames

**Kiro Usage:** Kiro diagnosed the infinite download retry loop from a screenshot of the error toast, identified the root cause (failed downloads not being acknowledged), and fixed both the mobile and desktop sides in one pass.

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| PC Server | Node.js, Express, WebSocket (ws), Electron |
| Mobile App | React Native 0.85, TypeScript |
| Communication | WebSocket (real-time), HTTP (file transfer) |
| Security | R8/ProGuard (Android), javascript-obfuscator (Desktop) |
| Build | Gradle (Android), electron-builder (Windows) |
| QR Scanning | react-native-camera-kit |
| File Handling | multer, react-native-fs, react-native-file-viewer |

---

## Kiro Features Used

1. **Autonomous Code Generation** — Full server.js, App.tsx, main.js written by Kiro
2. **Error Diagnosis** — Crash logs analyzed and fixed autonomously
3. **VPS Automation** — Python scripts for remote builds via SSH
4. **Architecture Design** — System design decisions made by Kiro
5. **Iterative Debugging** — Multiple build-fix cycles handled autonomously
6. **Documentation** — This DEVLOG and all .kiro files generated by Kiro
