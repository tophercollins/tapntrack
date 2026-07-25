# probe/ — the live-app eyes

Boots the **real built PWA** and drives it headless with Playwright to catch bugs that `tsc` /
`vite build` never can: screens that don't render, horizontal overflow, broken flows, and
white-screen crashes. Adapted from the historycheck probe convention (DOM variant), scoped to Tap
N Track. This package is **isolated** — its `@playwright/test` dep never touches the app build.

## Run it

```bash
cd probe
npm install                       # first time only
npx playwright install chromium   # first time only (browser binary)

npm run probe                     # build (if no server up) + run every recipe
npm run probe:fresh               # force a fresh app build, then run
npm run probe -- log-event        # run one spec by name
npm run report                    # open the HTML report from the last run
```

The config serves the **production build via `vite preview`** (not the dev server) on
`http://localhost:4288`. `vite preview` is a plain static server with SPA history-fallback, which
`BrowserRouter` needs so deep routes (`/activity/new`, `/stats/bouldering`) resolve instead of
404ing. Screenshots land in `probe/out/shots/` and attach to the HTML report — **read the PNGs**.

## What each recipe covers

| Spec | What it proves |
|---|---|
| `smoke.spec.ts` | Every static route (`/`, `/stats`, `/settings`, `/auth`, `/activity/new`) renders, has **zero horizontal overflow**, and logs **zero console/page errors** — swept across the full viewport matrix (`lib/viewports.ts`: 3 phones + `sm` breakpoint + 2 desktop widths). |
| `log-event.spec.ts` | The core loop: log one event of **every tracking type** — tap (Vitamins), number (Pressups → NumberPad), duration (Meditation → Timer), custom (Bouldering → DimensionPicker) — and confirm each persisted via the Home subtitle climbing 1→2→3→4. |
| `activity-crud.spec.ts` | Full **create → edit → delete** lifecycle of a user-made activity, driven the low-tap way a user would (Add tile, Edit toggle, native delete confirm). |
| `deep-routes.spec.ts` | The param routes smoke can't reach: `/stats/:id` for every seeded activity, `/activity/:id/edit` pre-fill, and the not-found guards for unknown ids. **This is where the React #310 white-screen crash on editor deep-links was caught** (see `.claude/rules/live-app-probe.md`). |
| `auth.spec.ts` | Tier 1 (always): the auth screen + form render offline. Tier 2 (self-skips): a real Supabase sign-in — needs `TNT_EMAIL`/`TNT_PASSWORD` **and** a build embedding `VITE_SUPABASE_*`. |

## Data model

The app is **offline-first** — the whole core works with no account and no backend, seeded into
IndexedDB on boot (`src/db/seed.ts`). Every recipe except auth Tier 2 therefore needs **zero
credentials**: Playwright gives each test a fresh browser context (fresh IndexedDB), so the seed is
clean every run. Only cloud-sync recipes need the Supabase tier.

## Blind spots (not yet covered)

- **Cloud sync** end-to-end (Tier 2 needs creds + a Supabase-configured build).
- **Haptics / Capacitor native** paths (no native shell under headless web).
- **Drag-to-reorder** (dnd-kit long-press gesture) — only the edit-mode navigation is exercised.
- **PWA install / offline service-worker** behaviour.
