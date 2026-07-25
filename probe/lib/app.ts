import { expect, type Page, type TestInfo } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Base URL of the served build. Kept in sync with playwright.config.ts webServer + baseURL.
export const BASE = process.env.PROBE_BASE || 'http://localhost:4288'

const SHOTS = path.resolve(process.cwd(), 'out/shots')

// Console noise that is NOT a real app bug. Keep this list tiny and justify each entry - the whole
// point of the probe is that a genuine console error fails the recipe.
const BENIGN: RegExp[] = [
  /favicon/i,
  /manifest/i,
  /Download the React DevTools/i,
  // Supabase client logs this warn (not error) when creds are absent; offline-first is intended.
  /Supabase credentials not configured/i,
]

/**
 * Attach console-error + pageerror listeners and return the growing array. Call at the TOP of a
 * test, before navigating, so nothing is missed. A non-empty array at the end fails the recipe.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    if (BENIGN.some((re) => re.test(t))) return
    errors.push(t)
  })
  page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e)))
  return errors
}

/** Navigate to a route and wait for the SPA to actually mount something under #root. */
export async function gotoRoute(page: Page, route: string): Promise<void> {
  await page.goto(BASE + route, { waitUntil: 'networkidle' })
  await page.waitForSelector('#root > *', { state: 'attached', timeout: 10_000 })
}

/**
 * POSITIVE render assertion - the screen's marker text is actually on-screen. Every recipe makes
 * one so "no overflow / no error" can never silently mean "nothing rendered / mis-routed boot".
 */
export async function expectRendered(page: Page, marker: RegExp | string): Promise<void> {
  await expect(page.getByText(marker).first()).toBeVisible({ timeout: 10_000 })
}

/**
 * Horizontal-overflow detector. Returns a list of elements extending past the viewport width at
 * the current size (empty = clean). This is the DOM equivalent of Flutter's RenderFlex overflow:
 * a phone-first app that overflows sideways is the most common visual bug, invisible to tsc/build.
 */
export async function collectOverflows(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vw = window.innerWidth
    const doc = document.documentElement
    if (doc.scrollWidth <= vw + 1) return []
    const offenders: string[] = []
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right > vw + 1 && r.left >= -1) {
        const cls =
          typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
            : ''
        offenders.push(`${el.tagName.toLowerCase()}${cls} right=${Math.round(r.right)} > vw=${vw}`)
        if (offenders.length >= 6) break
      }
    }
    if (offenders.length === 0) {
      offenders.push(`documentElement scrollWidth ${doc.scrollWidth} > innerWidth ${vw}`)
    }
    return offenders
  })
}

/** Screenshot to out/shots/<name>.png and attach to the HTML report. Read the PNGs. */
export async function shoot(page: Page, name: string, testInfo: TestInfo): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true })
  const file = path.join(SHOTS, `${name}.png`)
  await page.screenshot({ path: file })
  await testInfo.attach(name, { path: file, contentType: 'image/png' })
}
