# Next Steps — start here

Written 2026-07-26. This is the cold-pickup document: read it, and you can carry on without
remembering anything from the last session.

---

## 0. Where things stand

| | |
|---|---|
| Branch | `claude/plan-tap-n-track-ibRet` |
| Web app | **live** at `https://tapntrack.annanil.com` (backend details in `RUNBOOK.md`) |
| Native iOS | **runs on the Simulator** — renders, logs a tap, survives a cold relaunch |
| Native on a real iPhone | **NOT DONE** — blocked on a hardware/cost decision, see §2 |
| Lock Screen features | **NOT STARTED** — blocked on §3 |
| Test baseline | probe **36/36 PASS** — any lower means you broke something |

Everything below the phone decision is code work you can do on the Mac alone.

## 1. First thing, every time

```bash
cd ~/Projects/tapntrack
git pull
npm install
npm run build
cd probe && npm install && npx playwright install chromium   # first time on a new machine only
npx playwright test                                          # expect: PASS (36) FAIL (0)
```

If the probe is green, the app is sound. If it isn't, fix that before anything else — it means
something regressed, and every diagnosis below assumes a working web build.

To see it running natively:

```bash
npm run ios        # build → sync → open Xcode
```

Then pick an **iPhone simulator** in Xcode's destination dropdown and press ▶.

## 2. THE DECISION — getting it onto a real iPhone

This is the only genuine blocker, and it needs you, not the code.

**Confirmed:** Xcode requires a **USB cable** for the initial device pairing. Wireless debugging
only works *after* that one wired pairing. AirDrop and Bluetooth cannot install apps.
AltStore/SideStore also need a USB-generated pairing file. There is no free cable-free route.

Pick one:

### Path A — spare iPhone (free)
Needs a phone with a working port. Pair once over USB; you can go wireless afterwards.
Limits: build **expires after 7 days** and must be re-run from Xcode. Lock Screen features
(§3) are effectively out of reach on a free account.

### Path B — Apple Developer Program, $99/yr (recommended)
**This is the same mandatory fee you'd pay to release any app on the App Store — not an extra
charge.** TestFlight is included at no additional cost.

- Installs over the air via the TestFlight app. **No cable, ever.**
- **Internal testers need no App Review** (up to 100). Nothing goes public, nothing is "released".
- Builds last 90 days instead of 7.
- Unlocks the entitlements §3 needs.

### Steps for Path A (or for Path B's first local run)
1. Plug the iPhone in → unlock → tap **Trust This Computer**
2. Xcode → blue **App** icon → **App** target → **Signing & Capabilities**
3. Tick **Automatically manage signing** → **Team** → **Add an Account…** → your Apple ID →
   select **Personal Team**
4. If the bundle id is rejected, change `com.tapntrack.app` → `com.tophercollins.tapntrack`
5. Choose your iPhone as the destination → **⌘R**
6. On the phone: **Settings → General → VPN & Device Management** → **Trust** → ⌘R again
7. In the app: **Settings → Connect** → paste the VPS's `API_SECRET` (see `RUNBOOK.md`)

## 3. Next code work — move the API key to the Keychain

**Do this before any Lock Screen work. It is the hard blocker for Phase 2.**

### The problem
The access key lives in `localStorage`, inside the WKWebView sandbox:

- `src/lib/api.ts:10-12` — `getApiKey` / `setApiKey` / `clearApiKey`, all `localStorage`
- `src/lib/api.ts:17` — `apiFetch` reads it for the `Authorization: Bearer` header

A Lock Screen control is a **separate process** (a WidgetKit extension) and **cannot read WebView
storage**. So today there is no way for a native intent to authenticate. `localStorage` is also a
weak place for an API secret regardless of widgets, so this is worth doing either way.

### The shape of the fix
Store the key in the **iOS Keychain**, shared with the extension via a Keychain access group, and
fall back to `localStorage` on the web (the PWA is live and must keep working).

Note: Keychain Sharing / App Groups entitlements are believed to require the **paid** membership —
confirm against Apple's docs before relying on it.

### Blast radius — small, already mapped
Only two files. Every call site is already inside an `async` function, so making the accessors
async does not ripple further:

- `src/lib/api.ts:10,11,12,17`
- `src/stores/authStore.ts:32,41,59,65`

`src/services/syncService.ts` only calls `apiFetch`, which is already `async` — no changes needed.

### Suggested order
1. Add a storage abstraction: Keychain on native (Capacitor), `localStorage` on web
2. Make the three accessors `async`; update the four `authStore.ts` call sites
3. Re-run `npx playwright test` — must still be 36/36
4. Verify on the Simulator that Settings → Connect still saves and survives a relaunch

## 4. Then — Lock Screen roadmap

| Phase | Feature | iOS tech |
|-------|---------|----------|
| 1 ✅ | App running natively | Capacitor |
| 2 | One-tap log from Lock Screen / Control Center | `ControlWidget` (iOS 18+) + App Intents |
| 3 | Bouldering multi-step picker (grade → outcome → hang) | App Intents flow |
| 4 | Timer, live on the Lock Screen | Live Activities (ActivityKit) |

**The backend is already done.** One HTTP call logs an event:

```
POST /api/log   { activityId, value?, duration?, dimensionValues?, note? }
  → 201 { ok: true, logged: "💊 Vitamins", event: {...} }
Auth: Authorization: Bearer <API_SECRET>
```

So a Lock Screen intent needs only: read key from Keychain → POST → done. No sync logic natively.

## 5. Gotchas this project has already hit

- **Never run `npx cap add ios`.** `ios/` is committed. It exits 1 telling you to delete `ios/App`
  first — following that would destroy tracked source. Use `npx cap sync ios` / `make sync`.
- **Xcode's ▶ can install a broken copy** and fail with `NSPOSIXErrorDomain Code 3 "No such
  process"`, after which the app opens to a **white screen** every launch. It's an Xcode
  install fault, not an app bug. Fix: delete the app in the Simulator and re-run, or reinstall by
  hand — see the Troubleshooting section in `README.md`.
- **`xcodebuild` may prompt for your keychain password** (it wants a stored `github.com`
  credential for SPM). **Deny it** — the only remote package is public. Or pass
  `-disableAutomaticPackageResolution`.
- **iOS ignores SVG icons and rejects icons with an alpha channel.** All icons are generated from
  `public/icon.svg` by `npm run icons` — never hand-edit the PNGs.
- **This is a personal repo.** It is configured to commit and push as `tophercollins` via the
  `github-personal` SSH remote, so no `gh auth switch` is needed for git here.

## 6. Commands worth knowing

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (`tsc && vite build`) |
| `npm run ios` | build → sync → open Xcode |
| `npm run icons` | Regenerate all icons + splash from `public/icon.svg` |
| `cd probe && npx playwright test` | The gate — expect 36/36 |
| `make help` | All Make targets |
