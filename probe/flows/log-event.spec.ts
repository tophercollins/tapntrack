import { test, expect } from '@playwright/test'
import { collectConsoleErrors, gotoRoute, shoot } from '../lib/app'
import { PHONE } from '../lib/viewports'

// LOG-EVENT - the core loop of the app: tap an activity, log it. The seed happens to carry ONE
// activity per tracking type, so a single fresh-context run exercises all four input widgets and
// proves each event actually persisted, by watching the Home subtitle climb 1->2->3->4
// ("N activities logged today" is driven by todayEvents reloaded from IndexedDB).

test.use({ viewport: PHONE })

test('log one event of every tracking type from Home', async ({ page }, testInfo) => {
  const errors = collectConsoleErrors(page)
  await gotoRoute(page, '/')
  await expect(page.getByText('Tap to start tracking')).toBeVisible()

  // The activity emoji is the clickable button; its name label is a separate sibling node.
  // 1) TAP (Vitamins) - logs instantly, no sheet
  await test.step('tap', async () => {
    await page.getByRole('button', { name: '💊' }).click()
    await expect(page.getByText(/1 activity logged today/i)).toBeVisible()
  })

  // 2) NUMBER (Pressups) - NumberPad bottom sheet, enter 10, confirm
  await test.step('number', async () => {
    await page.getByRole('button', { name: '💪' }).click()
    await expect(page.getByText('💪 Pressups')).toBeVisible()
    await page.getByRole('button', { name: '1', exact: true }).click()
    await page.getByRole('button', { name: '0', exact: true }).click()
    // exact: true so this doesn't also match a completed activity's "💊 ✓" overlay button.
    await page.getByRole('button', { name: '✓', exact: true }).click()
    await expect(page.getByText(/2 activities logged today/i)).toBeVisible()
  })

  // 3) DURATION (Meditation) - Timer sheet, Stop immediately
  await test.step('duration', async () => {
    await page.getByRole('button', { name: '🧘' }).click()
    await expect(page.getByText('🧘 Meditation')).toBeVisible()
    await page.getByRole('button', { name: 'Stop' }).click()
    await expect(page.getByText(/3 activities logged today/i)).toBeVisible()
  })

  // 4) CUSTOM (Bouldering) - DimensionPicker, pick one option per required dimension, Log
  await test.step('custom', async () => {
    await page.getByRole('button', { name: '🧗' }).click()
    await expect(page.getByText('🧗 Bouldering')).toBeVisible()
    await page.getByRole('button', { name: 'V2', exact: true }).click()
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await page.getByRole('button', { name: 'No', exact: true }).click()
    await page.getByRole('button', { name: 'Log', exact: true }).click()
    await expect(page.getByText(/4 activities logged today/i)).toBeVisible()
  })

  await shoot(page, 'log-event-final', testInfo)
  expect(errors, errors.join('\n')).toEqual([])
})
