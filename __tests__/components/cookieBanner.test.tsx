import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CookieBanner } from '../../components-v2/CookieBanner'
import { CONSENT_KEY, getConsent, openCookieSettings } from '../../utils/consent'

const renderBanner = () =>
  render(
    <MemoryRouter>
      <button onClick={() => openCookieSettings()}>Cookie settings</button>
      <CookieBanner />
    </MemoryRouter>,
  )

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

const showBanner = async () => {
  renderBanner()
  await act(async () => {
    vi.advanceTimersByTime(1000)
  })
}

describe('CookieBanner', () => {
  it('banner "Let me choose" starts with analytics off and saving untouched keeps it off', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await showBanner()
    await user.click(screen.getByRole('button', { name: 'Let me choose' }))
    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute('aria-checked', 'false')
    await user.click(screen.getByRole('button', { name: 'Save choices' }))
    expect(getConsent()?.analytics).toBe(false)
  })

  it('footer entry point starts with analytics off when no choice was made', async () => {
    renderBanner()
    await act(async () => {
      openCookieSettings()
    })
    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute('aria-checked', 'false')
  })

  it('restores a saved explicit preference', async () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true, ts: 1 }))
    renderBanner()
    await act(async () => {
      openCookieSettings()
    })
    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute('aria-checked', 'true')
  })

  it('dialog is named, takes focus, contains Tab and restores focus to the footer opener on Escape', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: false, ts: 1 }))
    renderBanner()
    const opener = screen.getByRole('button', { name: 'Cookie settings' })
    await user.click(opener)

    const dialog = screen.getByRole('dialog', { name: 'Pick your cookies' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    for (let i = 0; i < 12; i++) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
    await user.tab({ shift: true })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Pick your cookies' })).not.toBeInTheDocument()
    expect(document.activeElement).toBe(opener)
  })

  it('Tab skips hidden and disabled controls and the page outside is inert only while open', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: false, ts: 1 }))
    renderBanner()
    const opener = screen.getByRole('button', { name: 'Cookie settings' })
    await user.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Pick your cookies' })
    expect(opener.closest('[inert]')).not.toBeNull()

    const hidden = document.createElement('button')
    hidden.textContent = 'Hidden'
    hidden.style.display = 'none'
    dialog.prepend(hidden)
    const locked = screen.getByRole('switch', { name: 'Strictly necessary' })
    expect(locked).toBeDisabled()

    const visited = new Set<Element | null>()
    for (let i = 0; i < 8; i++) {
      await user.tab()
      visited.add(document.activeElement)
    }
    expect(visited.has(hidden)).toBe(false)
    expect(visited.has(locked)).toBe(false)
    expect(visited.has(screen.getByRole('switch', { name: 'Analytics' }))).toBe(true)

    await user.keyboard('{Escape}')
    expect(document.querySelector('[inert]')).toBeNull()
  })

  it('closing the dialog without choosing brings the banner back', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await showBanner()
    await user.click(screen.getByRole('button', { name: 'Let me choose' }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog', { name: 'Cookie notice' })).toBeInTheDocument()
    expect(getConsent()).toBeNull()
  })
})
