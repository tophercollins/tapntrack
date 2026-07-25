import { test, expect } from '@playwright/test'
import { collectConsoleErrors, gotoRoute, shoot } from '../lib/app'
import { PHONE } from '../lib/viewports'

// DEEP-ROUTES - the dynamic/param routes that smoke can't reach without an id, plus the
// not-found guards. Seed ids are stable strings, so we can deep-link straight in (also proves the
// SPA history-fallback resolves param paths, not just top-level ones).

test.use({ viewport: PHONE })

const SEEDED = [
  ['vitamins', 'Vitamins'],
  ['pressups', 'Pressups'],
  ['meditation', 'Meditation'],
  ['bouldering', 'Bouldering'],
] as const

test('stats detail renders for every seeded activity', async ({ page }, testInfo) => {
  const errors = collectConsoleErrors(page)
  for (const [id, label] of SEEDED) {
    await gotoRoute(page, `/stats/${id}`)
    await expect(page.getByRole('heading', { name: label })).toBeVisible()
    await expect(page.getByText('Activity not found')).toHaveCount(0)
  }
  await shoot(page, 'stats-detail-bouldering', testInfo)
  expect(errors, errors.join('\n')).toEqual([])
})

test('activity edit route pre-fills the seeded activity', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await gotoRoute(page, '/activity/pressups/edit')
  await expect(page.getByPlaceholder('Activity name')).toHaveValue('Pressups')
  expect(errors, errors.join('\n')).toEqual([])
})

test('unknown ids hit the not-found guards, not a crash', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await gotoRoute(page, '/stats/does-not-exist')
  await expect(page.getByText('Activity not found')).toBeVisible()
  await gotoRoute(page, '/activity/does-not-exist/edit')
  await expect(page.getByText('Activity not found')).toBeVisible()
  expect(errors, errors.join('\n')).toEqual([])
})
