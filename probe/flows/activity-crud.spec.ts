import { test, expect } from '@playwright/test'
import { collectConsoleErrors, gotoRoute, shoot } from '../lib/app'
import { PHONE } from '../lib/viewports'

// ACTIVITY-CRUD - the full create -> edit -> delete lifecycle of a user-made activity, driven the
// same low-tap way a user would: the Add tile, the Edit toggle, the native delete confirm.

test.use({ viewport: PHONE })

test('create -> edit -> delete a Quick Tap activity', async ({ page }, testInfo) => {
  const errors = collectConsoleErrors(page)
  // Native confirm() on delete - accept it. Registered before any delete click.
  page.on('dialog', (d) => d.accept())

  await gotoRoute(page, '/')

  await test.step('create', async () => {
    await page.getByText('Add', { exact: true }).click()
    await expect(page.getByText('New Activity')).toBeVisible()
    await page.getByPlaceholder('Tap box to add emoji').fill('🔥')
    await page.getByPlaceholder('Activity name').fill('Probe Test Habit')
    // 'Quick Tap' is the default tracking type; Save (enabled once emoji + name present)
    await page.getByRole('button', { name: /^Save$/ }).click()
    await expect(page.getByText('Probe Test Habit')).toBeVisible()
  })

  // To reach an activity's editor: enter edit mode (the "Edit" toggle), then tap its emoji button
  // (in edit mode that navigates to the editor instead of logging).
  // force: true - in edit mode the emoji button runs an infinite `animate-wiggle`, so Playwright's
  // stability check never settles; the wiggle is cosmetic, so bypass it.
  await test.step('edit (rename)', async () => {
    await page.getByRole('button', { name: /^Edit$/ }).click()
    await page.getByRole('button', { name: '🔥' }).click({ force: true })
    await expect(page).toHaveURL(/\/activity\/.+\/edit/)
    await page.getByPlaceholder('Activity name').fill('Probe Renamed')
    await page.getByRole('button', { name: /^Save$/ }).click()
    await expect(page.getByText('Probe Renamed')).toBeVisible()
  })

  await test.step('delete', async () => {
    await page.getByRole('button', { name: /^Edit$/ }).click()
    await page.getByRole('button', { name: '🔥' }).click({ force: true })
    await page.getByRole('button', { name: /Delete Activity/ }).click()
    await expect(page.getByText('Probe Renamed')).toHaveCount(0)
  })

  await shoot(page, 'crud-final', testInfo)
  expect(errors, errors.join('\n')).toEqual([])
})
