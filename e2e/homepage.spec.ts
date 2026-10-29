import { test, expect, goto } from './helpers'


test.describe('Homepage', () => {
  test('loads the homepage', async ({ page }) => {
    await goto(page, '/')
    await expect(page).toHaveTitle(/Fresh Tech/i)
  })

  test('displays the main navigation', async ({ page }) => {
    await goto(page, '/')
    const navLinks = page.locator('header a, header button')
    expect(await navLinks.count()).toBeGreaterThan(2)
  })

  test('navigates to services page', async ({ page }) => {
    await goto(page, '/')
    const servicesLink = page.getByRole('link', { name: /services/i }).first()
    await servicesLink.click()
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('services')
  })

  test('navigates to contact page', async ({ page }) => {
    await goto(page, '/')
    const contactLink = page.getByRole('link', { name: /contact/i }).first()
    await contactLink.click()
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('contact')
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await goto(page, '/')
    const menuBtn = page.getByRole('button', { name: /menu|navigation/i })
    await expect(menuBtn).toBeVisible()
  })
})

test.describe('Footer', () => {
  test('displays footer with company info', async ({ page }) => {
    await goto(page, '/')
    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()
    await expect(footer.getByText(/fresh tech/i).first()).toBeVisible()
  })
})
