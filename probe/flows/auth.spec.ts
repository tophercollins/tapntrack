import { test, expect } from '@playwright/test'
import { collectConsoleErrors, gotoRoute } from '../lib/app'
import { PHONE } from '../lib/viewports'

// AUTH / CLOUD SYNC
//
// Tier 1 (always runs, no creds): the auth screen is reachable offline and its form is intact.
// The app is offline-first - the whole core works with no account - so this is all that's
// guaranteed without a backend.
//
// Tier 2 (self-skips unless configured): a real sign-in against Supabase. DOUBLY gated - it needs
// BOTH (a) the build to embed VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (else the client is null
// and sign-in is a no-op), AND (b) TNT_EMAIL / TNT_PASSWORD for a dev account. Absent either, skip.

test.use({ viewport: PHONE })

test('Tier 1: auth screen + form render offline', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await gotoRoute(page, '/auth')
  // "Sign In" appears twice (mode tab + submit); assert the unique bits instead.
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Sign Up$/ })).toBeVisible()
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
  await expect(page.getByPlaceholder('Enter password')).toBeVisible()
  await expect(page.getByText(/data stays on your device/i)).toBeVisible()
  expect(errors, errors.join('\n')).toEqual([])
})

const EMAIL = process.env.TNT_EMAIL
const PASSWORD = process.env.TNT_PASSWORD

test.describe('Tier 2: cloud sync', () => {
  test.skip(!EMAIL || !PASSWORD, 'Set TNT_EMAIL/TNT_PASSWORD and build with VITE_SUPABASE_* to run')

  test('sign in with a dev account', async ({ page }) => {
    await gotoRoute(page, '/auth')
    await page.getByPlaceholder('you@example.com').fill(EMAIL!)
    await page.getByPlaceholder('Enter password').fill(PASSWORD!)
    await page.getByRole('button', { name: /^Sign In$/ }).last().click()
    // On success the app routes away from /auth; give the network round-trip room.
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 })
  })
})
