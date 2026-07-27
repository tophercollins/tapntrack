/**
 * Generate every PNG app icon from the single source `public/icon.svg`.
 *
 * Why this exists: iOS **ignores SVG** for `apple-touch-icon`, and **rejects app icons that carry
 * an alpha channel**. So the web and native targets need different rasterisations of the same mark,
 * and hand-maintaining seven PNGs guarantees drift.
 *
 * Renders in Playwright's Chromium (already installed for `probe/`) because macOS ships no reliable
 * SVG rasteriser — `sips` can't read SVG and `qlmanage` won't guarantee an exact pixel size.
 *
 * Run:  npm run icons          (needs: cd probe && npm install)
 *
 * Everything derives from the source SVG — its viewBox and background colour are read out, never
 * hardcoded, so editing `icon.svg` can't silently desync the generated set.
 *
 * 1. Read the source and extract its viewBox size + background fill
 * 2. Declare the outputs — size, corner treatment, safe-zone inset, opacity, destination
 * 3. Build each variant's SVG (strip rounding / inset for maskable)
 * 4. Rasterise at exact pixel size, and ASSERT opaque targets really came out alpha-free
 * 5. Write to public/ or the Xcode asset catalogue
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Resolve Playwright from probe/, so generating icons never pulls a browser engine into the app's
// own dependency tree. `@playwright/test` (not `playwright`) is what probe/package.json actually
// declares — requiring the bare `playwright` only works via npm hoisting and breaks under pnpm.
const require = createRequire(resolve(ROOT, 'probe/package.json'))
const { chromium } = require('@playwright/test')

// 1. Source of truth. Fail loudly if its shape isn't what the rewrites below assume.
const SOURCE_PATH = resolve(ROOT, 'public/icon.svg')
const source = readFileSync(SOURCE_PATH, 'utf8')

const viewBox = source.match(/viewBox="0 0 (\d+(?:\.\d+)?) \1"/)
if (!viewBox) throw new Error(`${SOURCE_PATH}: expected a square viewBox like viewBox="0 0 512 512"`)
const BOX = Number(viewBox[1])

// Find the background rect by reading attributes off each <rect> tag, NOT by one positional regex:
// SVG attribute order is arbitrary, and a `width="BOX" height="2"` divider would satisfy a
// width-only match and silently become the brand colour.
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]

// Scan only PAINTED markup. A full-bleed rect inside <defs>/<mask>/<clipPath> never renders, so
// treating one as "the background" reads a colour off something invisible — an Illustrator-style
// defs-first export would otherwise give the inset targets a white background.
const scannable = source.replace(/<(defs|mask|clipPath|pattern|symbol)\b[\s\S]*?<\/\1>/g, '')
const bgRect = (scannable.match(/<rect\b[^>]*>/g) ?? []).find(
  (r) => attr(r, 'width') === String(BOX) && attr(r, 'height') === String(BOX),
)
if (!bgRect) throw new Error(`${SOURCE_PATH}: no full-bleed <rect> (${BOX}x${BOX}) to read a background from`)
const BG = attr(bgRect, 'fill')

// BG is interpolated into CSS, so it must be a colour CSS renders OPAQUELY. Two distinct traps:
//  - `none`/`transparent`/`currentColor` are legal SVG paints that pass any naive colour pattern,
//    but render see-through. `omitBackground:false` then composites over WHITE, so the PNG is fully
//    opaque and the alpha assertion happily passes — shipping a white-backed icon. Reject explicitly.
//  - `url(#gradient)` and 8-digit hex carry no/partial opacity. Anchor the pattern at both ends so
//    they can't slip through on a prefix match.
if (!BG || /^(none|transparent|currentcolor)$/i.test(BG)) {
  throw new Error(`${SOURCE_PATH}: background fill "${BG}" is not opaque — icons would render white`)
}
// `[^/]` blocks the modern slash-alpha form: `rgb(15 23 42 / 0.35)` would otherwise pass here,
// composite semi-transparently over white, and still satisfy the alpha assertion — a washed-out
// icon with no error. (The legacy `rgba(...)` is already excluded by requiring `rgb`/`hsl` exactly.)
if (!/^(#([0-9a-f]{3}|[0-9a-f]{6})|rgb\([^/]+\)|hsl\([^/]+\)|[a-z]+)$/i.test(BG)) {
  throw new Error(`${SOURCE_PATH}: background fill "${BG}" is not a plain opaque CSS colour`)
}

// 2. The outputs.
//    - `square`  -> strip the rx. iOS applies its own superellipse mask, so a pre-rounded source is
//      rounded twice and shows pale wedges in the corners.
//    - `inset`   -> fraction held clear for `purpose: maskable`, whose art may be cropped to a
//      circle. NB this is a *square* inset: fine while the mark is radial, but a design with corner
//      elements would need the inset raised to keep them inside the circular safe zone.
//    - `opaque`  -> flatten onto BG. Required for iOS; asserted after render, not assumed.
const TARGETS = [
  // apple-touch-icon MUST be opaque: iOS composites any transparency onto black, so an alpha
  // background silently ships a black-cornered home-screen tile.
  { file: 'apple-touch-icon.png', size: 180, square: true, opaque: true },
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'maskable-512x512.png', size: 512, inset: 0.1, opaque: true },
  {
    file: 'AppIcon-512@2x.png',
    size: 1024,
    square: true,
    opaque: true,
    dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset',
  },
]

// Capacitor centres one square splash and letterboxes it to any screen, so the mark is inset hard —
// at 2732 a full-bleed logo would be enormous on a phone. All three scale slots take the same image.
const SPLASH = {
  files: ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'],
  size: 2732,
  square: true,
  inset: 0.38,
  opaque: true,
  dest: 'ios/App/App/Assets.xcassets/Splash.imageset',
}

// 3. Derive one variant's SVG. Note no width/height rewriting — sizing is done in CSS at render
//    time so the viewBox scales the art. A regex over the root tag's width/height is what silently
//    produces a cropped or mark-less PNG when the source is re-exported in another dialect.
const variantSvg = ({ square, inset = 0 }) => {
  let svg = source
  if (square) svg = svg.replace(/\s+rx="[^"]*"/g, '') // 3a. drop rounding; iOS masks it itself
  if (inset > 0) {
    // 3b. Shrink the art toward the centre over a full-bleed background, so a maskable crop never
    //     exposes transparent pixels at the edge.
    const pad = BOX * inset
    const scale = 1 - inset * 2
    const body = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX} ${BOX}">` +
      `<rect width="${BOX}" height="${BOX}" fill="${BG}"/>` +
      `<g transform="translate(${pad},${pad}) scale(${scale})">${body}</g></svg>`
  }
  return svg
}

const browser = await chromium.launch()
const results = []

try {
  // 4. Rasterise. The viewport IS the output size, and the SVG is stretched to fill it via CSS, so
  //    nothing is post-scaled and no dimension is parsed out of the markup.
  const render = async ({ size, square, inset, opaque }) => {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })
    await page.setContent(
      `<style>html,body{margin:0;padding:0;width:100%;height:100%;background:${opaque ? BG : 'transparent'}}` +
        `svg{display:block;width:100%;height:100%}</style>${variantSvg({ square, inset })}`,
    )
    const png = await page.screenshot({ omitBackground: !opaque })
    await page.close()

    // 4a. Assert the alpha guarantee rather than trusting it. Byte 25 is the IHDR colour type:
    //     2 = RGB, 6 = RGBA. Chromium drops the alpha plane when the bitmap is fully opaque, but
    //     that is emergent behaviour, not a documented promise — and the only other place this
    //     surfaces is an App Store upload rejection ("can't contain an alpha channel").
    if (opaque && png[25] !== 2) {
      throw new Error(`expected an alpha-free PNG (IHDR colour type 2), got ${png[25]}`)
    }
    return png
  }

  // 5. Render EVERYTHING before writing anything. The alpha assertion can throw mid-run, and a
  //    partial write would leave public/ regenerated against a stale Xcode catalogue — a split
  //    state that looks fine until an App Store upload rejects the icon.
  const pending = []
  for (const target of TARGETS) {
    pending.push({ ...target, dir: target.dest ?? 'public', png: await render(target) })
  }
  const splashPng = await render(SPLASH)
  for (const file of SPLASH.files) {
    pending.push({ ...SPLASH, file, dir: SPLASH.dest, png: splashPng })
  }

  for (const { dir, file, png, size } of pending) {
    mkdirSync(resolve(ROOT, dir), { recursive: true })
    writeFileSync(resolve(ROOT, dir, file), png)
    results.push(`  ${`${dir}/${file}`.padEnd(52)} ${size}x${size}  ${png.length} b`)
  }
} finally {
  await browser.close()
  // Report inside finally: on a mid-run throw this still names what was (and wasn't) written.
  if (results.length) console.log(`Generated from public/icon.svg:\n${results.join('\n')}`)
}
