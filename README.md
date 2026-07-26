# Tap N Track

Frictionless habit and activity tracking. Open the app, tap an emoji, done.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Building for Production

```bash
npm run build
npm run preview  # Preview the production build
```

## Native iOS app (build on your Mac)

> **Continue-from-here for the Mac.** The web app + self-hosted backend are already done and live at
> `https://tapntrack.annanil.com` (backend details in `RUNBOOK.md`). This section takes a fresh
> clone to the app running natively on your iPhone via [Capacitor](https://capacitorjs.com). The
> native lock-screen roadmap is at the bottom.

### Prerequisites (Mac)
- **Xcode** (Mac App Store — large download) + Command Line Tools: `xcode-select --install`
- **Node 20+**, and an **Apple ID** (the free tier is fine to run on your own device)

> CocoaPods is **not** needed — Capacitor 8 uses Swift Package Manager, and `npx cap add ios`
> writes a `Package.swift` instead of a Podfile.

### Phase 1 — run the app natively (from a fresh clone)
```bash
git clone https://github.com/tophercollins/tapntrack.git
cd tapntrack
npm install
npm run build          # bakes VITE_API_URL=https://tapntrack.annanil.com (from .env)
npx cap sync ios       # copies the web build + native deps into iOS
npx cap open ios       # opens the project in Xcode
```
`ios/` is committed, so `npx cap add ios` is **not** needed — running it against an existing
project is a no-op at best. Re-run `npx cap sync ios` after every `npm run build`, or use
`npm run ios` which chains build → sync → open.
In **Xcode**:
1. Select the **App** target → **Signing & Capabilities** → set **Team** to your Apple ID (fixes code signing). If Xcode says the bundle id is taken, change it (e.g. `com.tophercollins.tapntrack`).
2. Plug in your iPhone, choose it as the run destination (top bar), press **▶ Run**.
3. First launch on the phone: **Settings → General → VPN & Device Management** → trust your developer certificate.

The app runs natively against `https://tapntrack.annanil.com/api`. In the app: **Settings → Connect** → paste your access key (the VPS's `server/.env` `API_SECRET`).

### Troubleshooting — white screen / "failed to launch"
Xcode's **▶ Run** can install a broken copy and fail with
`Simulator device failed to launch … NSPOSIXErrorDomain Code 3 "No such process"`, after which
that installed app opens to a **blank white screen** on every launch. This is an Xcode
install/launch fault, **not** an app bug — the same build installed by hand runs fine.

Fix: delete the app (long-press its icon in the Simulator → Remove App) and run again. Or
reinstall the already-built product directly:
```bash
xcrun simctl uninstall booted com.tapntrack.app
xcrun simctl install booted ~/Library/Developer/Xcode/DerivedData/App-*/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch booted com.tapntrack.app
xcrun simctl io booted screenshot /tmp/shot.png   # verify it actually rendered
```
Before blaming the native shell, confirm the web build itself is sound with `cd probe && npm run
probe` — if the probe suite is green, the bundle renders and the fault is native-side.

### Phase 1 status — DONE (2026-07-26)
The generated `ios/` project is **committed**, and the app is verified running natively on the
iOS Simulator: renders, logs a tap event, and the event **survives a cold relaunch** (persisted to
IndexedDB). Still unverified: signing with a real Apple ID and running on a physical device.
That unblocks Phase 2+.

### Native lock-screen roadmap
| Phase | Feature | iOS tech |
|-------|---------|----------|
| 1 (setup) | App running natively on device | Capacitor |
| 2 | One-tap log from Lock Screen / Control Center | App Intents + WidgetKit control |
| 3 | Bouldering multi-step picker (grade → outcome → hang) | App Intents flow |
| 4 | Timer with pause, live on the Lock Screen | Live Activities (ActivityKit) |

Every phase talks to the same `/api` — the backend is finished.

### Android (later, not the current focus)
```bash
npx cap add android
npm run android   # opens Android Studio
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── activities/   # Activity-related components
│   ├── tracking/     # Logging flow components
│   └── layout/       # Layout components
├── pages/            # Page components
├── stores/           # Zustand state stores
├── db/               # Dexie.js database
├── types/            # TypeScript types
└── utils/            # Utility functions
```

## Tech Stack

- **React** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Dexie.js** - IndexedDB wrapper for local storage
- **Capacitor** - Native iOS/Android builds

## Tracking Types

| Type | Flow | Example |
|------|------|---------|
| `tap` | Tap → logged | Vitamins |
| `number` | Tap → enter a number | Pressups (reps), water (glasses) |
| `duration` | Tap → timer, or enter minutes | Meditation |
| `custom` | Tap → pick your defined options | Bouldering (grade / outcome / hang) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run ios` | Build and open in Xcode |
| `npm run android` | Build and open in Android Studio |
| `npm run sync` | Sync web build to native projects |
