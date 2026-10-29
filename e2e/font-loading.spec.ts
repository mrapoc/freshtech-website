import { resolve } from 'node:path'
import { test, expect, goto, type Page } from './helpers'

// Bungee (the display face) is self-hosted: @font-face in brand/tokens.css,
// files in brand/fonts/bungee. These checks cover ONLY Bungee. The shared
// fixture aborts every non-localhost request, so the Google-hosted families
// (Inter, Outfit, Archivo, Archivo Narrow) never load here and nothing below
// verifies them. Glyph proof uses the Chromium-only CDP
// CSS.getPlatformFontsForNode, so those tests skip on other engines.

// Matches the Vite dev path (/brand/fonts/bungee/bungee-v17-latin.woff2) and
// the production hashed path (/assets/bungee-v17-latin-<hash>.woff2).
const BUNGEE_FILE = /\/bungee-v17-(latin-ext|latin|vietnamese)(-[\w-]+)?\.woff2$/

function trackBungeeRequests(page: Page) {
  const urls: string[] = []
  page.on('request', r => { if (BUNGEE_FILE.test(new URL(r.url()).pathname)) urls.push(r.url()) })
  return urls
}

// Which real font files Chromium used to paint the node. Returns e.g.
// [{ familyName: 'Bungee', isCustomFont: true, glyphCount: 3 }].
async function platformFonts(page: Page, selector: string) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 })
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector })
  const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
  await cdp.detach()
  return fonts as { familyName: string; isCustomFont: boolean; glyphCount: number }[]
}

async function bungeeFaces(page: Page) {
  return page.evaluate(async () => {
    await document.fonts.ready
    const rules: { src: string; range: string }[] = []
    for (const sheet of Array.from(document.styleSheets)) {
      let list: CSSRuleList
      try { list = sheet.cssRules } catch { continue }
      for (const r of Array.from(list)) {
        if (r instanceof CSSFontFaceRule && r.style.getPropertyValue('font-family').replace(/['"]/g, '') === 'Bungee') {
          rules.push({ src: r.style.getPropertyValue('src'), range: r.style.getPropertyValue('unicode-range') })
        }
      }
    }
    return rules
  })
}

test.describe('Bungee self-hosted font delivery', () => {
  test('cold homepage load: exactly one Bungee request (latin), same origin, woff2', async ({ page, baseURL }) => {
    const requests = trackBungeeRequests(page)
    const fontResponse = page.waitForResponse(r => BUNGEE_FILE.test(new URL(r.url()).pathname))
    await goto(page, '/')
    const res = await fontResponse
    expect(res.status()).toBe(200)
    expect(new URL(res.url()).origin).toBe(new URL(baseURL!).origin)
    expect(res.headers()['content-type']).toContain('font/woff2')
    expect((await res.body()).subarray(0, 4).toString('latin1')).toBe('wOF2')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)
    expect(requests, requests.join('\n')).toHaveLength(1)
    expect(requests[0]).toMatch(/bungee-v17-latin(-[\w-]+)?\.woff2$/)
    expect(requests[0]).not.toMatch(/latin-ext/)

    // Critical and complete CSS may both declare identical faces. The browser
    // must still fetch only one font; compare the distinct face metadata here.
    const rules = [...new Map((await bungeeFaces(page)).map(rule => [JSON.stringify(rule), rule])).values()]
    expect(rules).toHaveLength(3)
    // Google's order: vietnamese, latin-ext, latin (ranges overlap on combining marks).
    expect(rules.map(r => r.src)).toEqual([
      expect.stringMatching(/bungee-v17-vietnamese/),
      expect.stringMatching(/bungee-v17-latin-ext/),
      expect.stringMatching(/bungee-v17-latin(-[\w-]+)?\.woff2/),
    ])
    for (const r of rules) expect(r.src).not.toMatch(/googleapis|gstatic/)
  })

  test('homepage preloads only its local latin font and never Google Bungee', async ({ page }) => {
    const googleRequests: string[] = []
    page.on('request', r => { if (r.url().includes('fonts.googleapis.com')) googleRequests.push(r.url()) })
    await goto(page, '/')
    const preload = page.locator('link[rel="preload"][as="font"]')
    const builtDocument = await page.locator('style[data-ft-bundled-css], style[data-ft-critical-css]').count() === 1
    await expect(preload).toHaveCount(builtDocument ? 1 : 0)
    if (builtDocument) {
      await expect(preload).toHaveAttribute('href', /\/assets\/bungee-v17-latin-(?!ext-)[\w-]+\.woff2$/)
      await expect(preload).toHaveAttribute('crossorigin', 'anonymous')
    }
    const hrefs = await page.locator('link[rel="stylesheet"], noscript').evaluateAll(els =>
      els.map(el => el.tagName === 'NOSCRIPT' ? el.textContent ?? '' : (el as HTMLLinkElement).href))
    for (const h of [...hrefs, ...googleRequests]) expect(h).not.toMatch(/family=Bungee/)
    // Other families keep their Google link (the fixture blocks the request; only the markup is asserted).
    expect(hrefs.some(h => /fonts\.googleapis\.com.*family=Archivo/.test(h))).toBe(true)
  })

  test('legacy route /faq does not download Bungee', async ({ page }) => {
    const requests = trackBungeeRequests(page)
    // Trailing slash on purpose. `vite preview` answers extensionless /faq with
    // the SPA fallback dist/index.html, which after prerender is the homepage
    // document (Bungee hero inline), so the browser fetched Bungee before React
    // swapped in the FAQ. /faq/ resolves to dist/faq/index.html in preview,
    // and to the FAQ document in dev and on Netlify (static file wins over the
    // non-forced /* catch-all).
    await goto(page, '/faq/')
    await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(0)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)
    expect(requests, requests.join('\n')).toHaveLength(0)
    await expect(page.locator('main h1').first()).not.toHaveCSS('font-family', /Bungee/)
  })

  test('homepage h1 is painted with Bungee (platform font check)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CSS.getPlatformFontsForNode is Chromium only')
    await goto(page, '/')
    await page.evaluate(() => document.fonts.ready)
    const fonts = await platformFonts(page, 'main h1')
    const bungee = fonts.find(f => f.familyName === 'Bungee')
    expect(bungee, JSON.stringify(fonts)).toBeDefined()
    expect(bungee!.isCustomFont).toBe(true)
    expect(bungee!.glyphCount).toBeGreaterThan(0)
    // Every glyph in the heading came from Bungee, not a fallback.
    const fallbackGlyphs = fonts.filter(f => f.familyName !== 'Bungee').reduce((n, f) => n + f.glyphCount, 0)
    expect(fallbackGlyphs, JSON.stringify(fonts)).toBe(0)
  })

  // Individual glyphs, one node each, so a fallback for any single character is caught.
  const GLYPHS: [string, string][] = [
    ['pound', '£'],
    ['curly-apostrophe', '’'],
    ['ellipsis', '…'],
    ['e-acute', 'é'],
    ['welsh-w-circumflex', 'ŵ'],
    ['welsh-y-circumflex', 'ŷ'],
  ]
  test('each probe glyph is painted with Bungee from the expected subset', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CSS.getPlatformFontsForNode is Chromium only')
    const requests = trackBungeeRequests(page)
    await goto(page, '/')
    await page.evaluate((glyphs) => {
      for (const [id, ch] of glyphs) {
        const s = document.createElement('span')
        s.id = `glyph-${id}`
        s.textContent = ch
        s.style.cssText = "position:absolute;left:0;top:0;font:400 40px/1 'Bungee', monospace"
        document.body.appendChild(s)
      }
    }, GLYPHS)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)
    for (const [id, ch] of GLYPHS) {
      const fonts = await platformFonts(page, `#glyph-${id}`)
      expect(fonts, `${id} (${ch}): ${JSON.stringify(fonts)}`).toMatchObject([{ familyName: 'Bungee', isCustomFont: true, glyphCount: 1 }])
    }
    // The Welsh probes pull latin-ext on demand; nothing else should have loaded.
    const files = requests.map(u => new URL(u).pathname.match(BUNGEE_FILE)?.[1]).sort()
    expect(files).toEqual(['latin', 'latin-ext'])
  })

  test('visible £40 price on /pricing is painted with Bungee', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CSS.getPlatformFontsForNode is Chromium only')
    await goto(page, '/pricing/')
    const price = page.getByText(/^£40$/).first()
    await expect(price).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await price.evaluate(el => el.setAttribute('data-font-probe', 'price'))
    const fonts = await platformFonts(page, '[data-font-probe="price"]')
    expect(fonts, JSON.stringify(fonts)).toMatchObject([{ familyName: 'Bungee', isCustomFont: true, glyphCount: 3 }])
  })

  for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]] as const) {
    test(`${label}: h1 in Bungee, no horizontal overflow, screenshot`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport)
      await goto(page, '/')
      await page.evaluate(() => document.fonts.ready)
      const h1 = page.locator('main h1').first()
      await expect(h1).toHaveCSS('font-family', /Bungee/)
      const box = (await h1.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
      expect(box.height).toBeGreaterThan(0)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      const dir = resolve('test-results', 'font-loading')
      await page.screenshot({ path: `${dir}/${label}-home-viewport.png` })
      await h1.screenshot({ path: `${dir}/${label}-home-h1.png` })
      await testInfo.attach(`${label}-home-viewport`, { path: `${dir}/${label}-home-viewport.png`, contentType: 'image/png' })
    })
  }
})
