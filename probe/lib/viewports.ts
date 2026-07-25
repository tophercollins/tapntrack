// The standard viewport matrix every smoke recipe sweeps. Tap N Track is a phone-first PWA, so the
// matrix is weighted to phones, plus the Tailwind `sm` breakpoint (640px, where the activity grid
// flips from grid-cols-3 to grid-cols-4) and two larger widths so desktop overflow can't hide.

export interface Viewport {
  /** kebab id, used in test names + screenshot filenames */
  name: string
  width: number
  height: number
  kind: 'phone' | 'desktop'
  /** human note for the report */
  label: string
}

export const VIEWPORTS: readonly Viewport[] = [
  { name: 'iphone-se', width: 375, height: 667, kind: 'phone', label: 'iPhone SE (smallest)' },
  { name: 'iphone-14', width: 390, height: 844, kind: 'phone', label: 'iPhone 14/13/12' },
  { name: 'pixel-7', width: 412, height: 915, kind: 'phone', label: 'Pixel 7 / large Android' },
  { name: 'sm-640', width: 640, height: 900, kind: 'desktop', label: 'sm breakpoint (grid flips to 4 cols)' },
  { name: 'laptop-13', width: 1280, height: 800, kind: 'desktop', label: '13" laptop' },
  { name: 'desktop-fhd', width: 1920, height: 1080, kind: 'desktop', label: '1080p monitor' },
] as const

/** Default flow viewport: a real phone, since that's the primary target. */
export const PHONE = { width: 390, height: 844 }

/** `"iphone-14 390x844"` - for test titles + overflow messages. */
export const vpTitle = (v: Viewport): string => `${v.name} ${v.width}x${v.height}`
