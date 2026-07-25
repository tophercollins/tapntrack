# Live-App Probe (Tap N Track) — give the work eyes

The reusable primitive that lets you **boot the real app and look at it** — catching visual and
blocking bugs (horizontal overflow, screens that don't render, broken flows, white-screen crashes)
that static gates (`tsc`, `vite build`) can never see. A green build says the code compiles; it
says nothing about whether the app *renders or even boots*. This closes that gap.

Adapted from the historycheck probe convention (`~/Projects/historycheck/probe` +
`webapp/e2e`). Tap N Track is a **React DOM app**, so it uses the DOM variant: ordinary
text/role locators and DOM-overflow measurement — none of the Flutter canvas/`flt-semantics`
machinery.

## The harness

Lives in `probe/`. See `probe/README.md` for commands. In short: `cd probe && npm run probe`
serves the production build via `vite preview` on :4288 and drives it headless.

Key choices (each learned or verified while building this):
- **Serve the production build via `vite preview`, not `vite` dev.** `vite preview` is a static
  server with SPA history-fallback (required for `BrowserRouter` deep routes) and no HMR/module
  graph to wedge under repeated automated loads. It also exercises the same minified bundle users
  get.
- **Every smoke recipe sweeps the viewport matrix** (`probe/lib/viewports.ts`) and asserts three
  things per cell, in order: (1) a positive render marker is on-screen — so "no overflow / no
  error" can never silently mean "nothing rendered / mis-routed boot"; (2) zero horizontal
  overflow; (3) zero console/page errors.
- **Offline-first = no creds needed.** The core app runs entirely on seeded IndexedDB; each
  Playwright context is fresh, so the seed is clean every run. Only cloud-sync (auth Tier 2)
  needs a Supabase-configured build + dev creds, and those recipes self-skip when absent.

## The three modes (same lifecycle as historycheck)

1. **chef-explore** — improvise a live look at a brand-new screen via a throwaway Playwright
   script (resize, navigate, screenshot, read the PNG, check the console). Catches "doesn't load
   / overflows / looks wrong" on first sight.
2. **recipe-run** — run the checked-in `probe/flows/*.spec.ts` suite. Free regression guarding,
   the default gate. A bug once caught here can't silently return.
3. **chef-sweep** — periodically free-roam the whole app ignoring the recipes, hunting what they
   aren't watching. New findings **graduate into recipes**.

Lifecycle: chef explores the frontier → screen stabilises → graduate into a `*.spec.ts` recipe →
recipe-run guards it forever → periodic chef-sweep audits the blind spots.

## Origin bug — why deep-links matter (2026-07-25)

The very first probe run caught a real white-screen crash: deep-linking or refreshing
`/activity/:id/edit` for an **existing** activity blanked the whole app with React error #310
(changing hook count). Root cause: `ActivityEditorPage` had early `return`s (the "Activity not
found" guards) sitting **above** its `useState` calls. On a cold deep-link `activities` is empty
on the first render, so the guard fired (few hooks); once activities loaded async the guard was
skipped (more hooks) → hook-count mismatch → crash. In-app navigation never hit it (activities were
already loaded), which is why it sat undiscovered.

Fix: hoist all hooks above the guards and hydrate the form from `existingActivity` via a
`useEffect` keyed on its id. Lesson baked into `deep-routes.spec.ts`: **always probe param routes
by cold deep-link, not just by in-app navigation** — the two exercise different load orders.
