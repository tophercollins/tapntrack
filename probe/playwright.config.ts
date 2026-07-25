import { defineConfig } from '@playwright/test'

// Live-app probe config for Tap N Track (Vite + React + BrowserRouter PWA).
//
// Serves the PRODUCTION build via `vite preview`, NOT the `vite` dev server:
//   1. `vite preview` is a plain static server (no HMR/module graph to wedge under repeated
//      automated loads) and it applies SPA history-fallback, which BrowserRouter needs so deep
//      routes like /activity/new and /stats/bouldering resolve to index.html instead of 404.
//   2. It exercises the same minified bundle users get, catching build-only breakage.
// Build first (`npm run build`) or use `npm run probe:fresh`. The webServer command below builds
// then previews, so a bare `npm run probe` on a cold machine still works.
const PORT = 4288
const BASE = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './flows',
  outputDir: './out/test-results',
  // Real flows are ~2-10s; 60s is headroom for a cold build + first paint under machine load.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // One shared preview server; keep specs serial so a build-once server isn't fought over.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { outputFolder: './out/report', open: 'never' }]],
  use: {
    baseURL: BASE,
    // We screenshot explicitly (shoot()) and read the PNGs, rather than relying on auto-capture.
    screenshot: 'off',
    trace: 'retain-on-failure',
    // Phone-first default; smoke specs resize across the full matrix themselves.
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    // Build then serve. `--strictPort` fails loudly rather than drifting to another port (which
    // would leave baseURL pointing at nothing). reuseExistingServer skips this when a server is
    // already up on :4288 (fast iteration) - use probe:fresh to force a rebuild.
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: '..',
  },
})
