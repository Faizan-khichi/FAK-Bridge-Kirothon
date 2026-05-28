# FAK Bridge — Presentation Script (2-4 min Demo Video)

---

## 1. THE HOOK (0:00 - 0:30)

**[Show split screen: phone on left, PC on right]**

> "How many times have you taken a screenshot on your phone and needed it on your PC... right now?
> 
> You email it to yourself. You upload it to Drive. You plug in a USB cable.
> 
> All of these require internet, accounts, or cables.
> 
> What if you could just... send it? Instantly. Over Wi-Fi. No cloud. No account. No setup.
> 
> This is FAK Bridge."

---

## 2. THE DEMO — QR Connect (0:30 - 1:00)

**[Show PC screen with FAK Bridge tray icon]**

> "Step one: I click the FAK Bridge icon in my system tray. It shows my local IP and a QR code."

**[Show phone opening the app]**

> "Step two: I open FAK Bridge on my phone, tap 'Scan QR'..."

**[Show camera scanning the QR code on PC screen]**

> "...point at the screen... and we're connected. That's it. Zero typing. Zero configuration."

**[Show the authorization dialog on PC: "Device wants to connect — Allow/Deny"]**

> "Both devices must authorize the connection. No unauthorized access."

---

## 3. THE DEMO — Clipboard Sync (1:00 - 1:30)

**[Copy text on phone]**

> "I copy a URL on my phone. I tap 'Push to PC'..."

**[Show PC clipboard updated instantly]**

> "...and it's on my PC clipboard. Ctrl+V. Done. Real-time WebSocket — no polling, no delay."

**[Copy text on PC, tap 'Pull from PC' on phone]**

> "Works both ways. Copy on PC, pull on phone. Universal clipboard."

---

## 4. THE DEMO — File Transfer (1:30 - 2:15)

**[Tap 'Send File to PC' on phone, pick a photo]**

> "Now the real magic. I pick a photo from my gallery..."

**[Show the cyan progress bar filling up: "Sending... 45%... 78%... 100%"]**

> "...real-time progress bar. Full LAN speed. No compression."

**[Show the photo auto-opening on PC in Windows Photos]**

> "And it auto-opens on my PC. Instantly. No clicking 'Open'. No finding the file. It just appears."

**[On PC, click 'Send File to Phone', pick a video]**

> "Reverse direction — I send a video from PC to phone..."

**[Show download progress on phone, then file auto-opening]**

> "...progress bar on the phone, auto-downloads, auto-opens in the video player."

---

## 5. THE REVEAL — Security (2:15 - 2:45)

**[Open the .exe in a hex editor or show the app.asar contents]**

> "Now let's talk security. If someone tries to reverse-engineer our desktop app..."

**[Show obfuscated JavaScript — unreadable variable names, encoded strings]**

> "...they see this. Control flow flattening. String array encoding. Self-defending code that crashes if tampered with."

**[Show Android APK decompiled — minified class names]**

> "Same on Android. R8 ProGuard strips all debug info, renames classes to a, b, c. Five optimization passes."

---

## 6. THE ARCHITECTURE (2:45 - 3:15)

**[Show architecture diagram]**

> "Under the hood: WebSocket for real-time clipboard sync. HTTP for high-speed file transfer. Express server running inside Electron with a system tray icon.
> 
> Everything stays on your local network. Zero data leaves your Wi-Fi. No cloud. No accounts. No telemetry.
> 
> Built entirely with Kiro — from the first line of code to this presentation script."

---

## 7. CLOSING (3:15 - 3:30)

> "FAK Bridge. Zero friction. Zero cloud. Zero compromise.
> 
> Built for Kirothon 2026."

**[Show logo: two linked cyan rings with bridge line]**

---

## Demo Checklist

- [ ] PC: FAK Bridge running in system tray
- [ ] Phone: FAK Bridge app installed
- [ ] Both on same Wi-Fi
- [ ] Have a photo ready on phone to send
- [ ] Have a file ready on PC to send to phone
- [ ] Screen recorder running on both devices
