import { test, expect } from '@playwright/test'
import { collectConsoleErrors, collectOverflows, expectRendered, gotoRoute, shoot } from '../lib/app'
import { VIEWPORTS, vpTitle } from '../lib/viewports'

// SMOKE - every static route swept across the standard viewport matrix. Each cell asserts THREE
// things, in order:
//   1. the screen ACTUALLY rendered (positive marker via getByText);
//   2. zero horizontal overflow at that width (the phone-first visual bug class);
//   3. zero console/page errors during boot + render.
// This is the free regression gate: a bug once caught here can't silently return.

const ROUTES = [
  { name: 'home', path: '/', marker: /Tap N Track/i },
  { name: 'stats', path: '/stats', marker: /Your activity overview/i },
  { name: 'settings', path: '/settings', marker: /Customize your experience/i },
  { name: 'auth', path: '/auth', marker: /Sync your data across devices/i },
  { name: 'activity-new', path: '/activity/new', marker: /New Activity/i },
] as const

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`${route.name} renders clean @ ${vpTitle(vp)}`, async ({ page }, testInfo) => {
      const errors = collectConsoleErrors(page)
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await gotoRoute(page, route.path)

      // (1) positive render
      await expectRendered(page, route.marker)
      await shoot(page, `${route.name}-${vp.name}`, testInfo)

      // (2) no horizontal overflow
      const overflows = await collectOverflows(page)
      expect(overflows, `overflow @ ${vpTitle(vp)}:\n${overflows.join('\n')}`).toEqual([])

      // (3) no console/page errors
      expect(errors, `console/page errors @ ${vpTitle(vp)}:\n${errors.join('\n')}`).toEqual([])
    })
  }
}
