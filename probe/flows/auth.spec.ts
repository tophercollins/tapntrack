import { test, expect } from '@playwright/test'
import { collectConsoleErrors, gotoRoute } from '../lib/app'
import { PHONE } from '../lib/viewports'

// AUTH / SYNC (self-hosted single-user API model)
//
// Tier 1 (always runs): the Connect screen renders offline. The app is offline-first — the whole
// core works with no server — so this is all that's guaranteed without VITE_API_URL + a key.
//
// Tier 2 (self-skips): a real key sign-in against the local API. Needs the app BUILT with
// VITE_API_URL pointing at a running server AND TNT_API_KEY set. Absent either, skip.

test.use({ viewport: PHONE })

test('Tier 1: Connect screen renders offline', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await gotoRoute(page, '/auth')
  await expect(page.getByRole('heading', { name: 'Connect' })).toBeVisible()
  await expect(page.getByText('Access key')).toBeVisible()
  await expect(page.getByPlaceholder('Paste your access key')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connect' })).toBeVisible()
  await expect(page.getByText(/data stays on your device/i)).toBeVisible()
  expect(errors, errors.join('\n')).toEqual([])
})

const API_KEY = process.env.TNT_API_KEY

test.describe('Tier 2: key sign-in', () => {
  test.skip(!API_KEY, 'Set TNT_API_KEY and build with VITE_API_URL to run')

  test('connect with a valid access key', async ({ page }) => {
    await gotoRoute(page, '/auth')
    await page.getByPlaceholder('Paste your access key').fill(API_KEY!)
    await page.getByRole('button', { name: 'Connect' }).click()
    // On success the app routes to /settings and shows the connected state.
    await expect(page).toHaveURL(/\/settings/, { timeout: 15_000 })
    await expect(page.getByText('Connected')).toBeVisible()
  })
})
