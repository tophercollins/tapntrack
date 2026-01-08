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

## Mobile Apps (iOS/Android)

This app uses [Capacitor](https://capacitorjs.com) to build native iOS and Android apps from the same codebase.

### Prerequisites

**iOS** (macOS only):
- Xcode 14+ from the Mac App Store
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`

**Android**:
- [Android Studio](https://developer.android.com/studio)
- Android SDK (installed via Android Studio)
- Java 17+

### Setup Native Platforms

```bash
# Add iOS platform (macOS only)
npx cap add ios

# Add Android platform
npx cap add android
```

### Build and Run

```bash
# iOS - builds and opens Xcode
npm run ios

# Android - builds and opens Android Studio
npm run android

# Just sync web code to native projects
npm run sync
```

### Running on Device

**iOS**:
1. Open `ios/App/App.xcworkspace` in Xcode
2. Select your device/simulator
3. Click Run

**Android**:
1. Open the `android` folder in Android Studio
2. Select your device/emulator
3. Click Run

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
| `tap` | Tap → Done | Vitamins, Coffee |
| `sub-select` | Tap → Pick option → Done | Bouldering grades |
| `number` | Tap → Enter number → Done | Glasses of water |
| `sub-number` | Tap → Pick option → Enter number → Done | Weight lifting reps |
| `duration` | Tap → Timer runs → Stop → Done | Meditation |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run ios` | Build and open in Xcode |
| `npm run android` | Build and open in Android Studio |
| `npm run sync` | Sync web build to native projects |
