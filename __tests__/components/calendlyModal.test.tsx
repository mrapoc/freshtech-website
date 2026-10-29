import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendlyModal } from '../../components/CalendlyModal'

// jsdom never fetches script src, so the real Calendly widget is never
// loaded. Tests that need a "working" vendor install a local stub that
// places a frame in the container, mirroring what the widget does.
type CalendlyWindow = Window & { Calendly?: unknown }

const scriptSelector = 'script[src="https://assets.calendly.com/assets/external/widget.js"]'
const installVendorStub = () => {
  ;(window as CalendlyWindow).Calendly = {
    initInlineWidget: ({ parentElement }: { parentElement: HTMLElement }) => {
      parentElement.appendChild(document.createElement('iframe'))
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  delete (window as CalendlyWindow).Calendly
  document.querySelectorAll(scriptSelector).forEach(s => s.remove())
  document.body.style.overflow = ''
})

const setup = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

const Harness: React.FC<{ onClose?: () => void }> = ({ onClose = () => {} }) => (
  <>
    <button>Book a call</button>
    <CalendlyModal isOpen onClose={onClose} />
  </>
)

describe('CalendlyModal', () => {
  it('has a resolvable accessible name on every step and focuses the step heading', async () => {
    const user = setup()
    render(<Harness />)

    const dialog = screen.getByRole('dialog', { name: 'How Can We Help?' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'How Can We Help?' }))

    await user.click(screen.getByRole('button', { name: /Existing Customer/ }))
    expect(screen.getByRole('dialog', { name: "We've Got You Covered" })).toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: "We've Got You Covered" }))

    await user.click(screen.getByRole('button', { name: /Go back/ }))
    await user.click(screen.getByRole('button', { name: /Exploring IT Support/ }))
    expect(screen.getByRole('dialog', { name: "Let's See If We're a Good Fit" })).toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: "Let's See If We're a Good Fit" }))
  })

  it('keeps Tab inside, closes on Escape and restores focus when unmounted', async () => {
    const user = setup()
    const onClose = vi.fn()
    const { unmount } = render(<Harness onClose={onClose} />)
    const opener = screen.getByRole('button', { name: 'Book a call' })

    // Simulate the opener having focus before the modal mounted.
    opener.focus()
    const { unmount: unmountSecond } = render(<CalendlyModal isOpen onClose={onClose} />)
    const dialog = screen.getAllByRole('dialog')[1]
    for (let i = 0; i < 8; i++) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
    await user.tab({ shift: true })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()

    unmountSecond()
    expect(document.activeElement).toBe(opener)
    unmount()
  })

  it('shows loading, then a fallback with retry, direct link, phone and email when the script never loads', async () => {
    const user = setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Exploring IT Support/ }))

    expect(screen.getByRole('status')).toHaveTextContent('Loading the booking calendar')
    expect(document.querySelector(scriptSelector)).not.toBeNull()

    await act(async () => {
      vi.advanceTimersByTime(15000)
    })
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('did not load')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the booking page in a new tab' })).toHaveAttribute(
      'href',
      'https://calendly.com/fresh-sam/20min',
    )
    expect(screen.getByRole('link', { name: '01584 517 234' })).toHaveAttribute('href', 'tel:01584517234')
    expect(screen.getByRole('link', { name: 'hello@fresh-tech.uk' })).toHaveAttribute('href', 'mailto:hello@fresh-tech.uk')
  })

  it('script error shows the fallback and retry re-adds the script', async () => {
    const user = setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Exploring IT Support/ }))

    const first = document.querySelector(scriptSelector)!
    await act(async () => {
      first.dispatchEvent(new Event('error'))
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByRole('status')).toBeInTheDocument()
    const second = document.querySelector(scriptSelector)!
    expect(second).not.toBe(first)
    expect(first.isConnected).toBe(false)
  })

  it('retry embeds once the vendor is available, and the fallback links stay visible', async () => {
    const user = setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Exploring IT Support/ }))
    await act(async () => {
      vi.advanceTimersByTime(15000)
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()

    installVendorStub()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(document.querySelector('.calendly-inline-widget iframe')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Open the booking page in a new tab' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '01584 517 234' })).toBeInTheDocument()
  })

  it('a vendor object that places no element is treated as a failure', async () => {
    const user = setup()
    ;(window as CalendlyWindow).Calendly = { initInlineWidget: () => {} }
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Exploring IT Support/ }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('vendor places an element but the calendar stays unavailable: fallback remains, retry replaces the element', async () => {
    const user = setup()
    let placed = 0
    ;(window as CalendlyWindow).Calendly = {
      initInlineWidget: ({ parentElement }: { parentElement: HTMLElement }) => {
        const broken = document.createElement('div')
        broken.dataset.attempt = String(++placed)
        parentElement.appendChild(broken)
      },
    }
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Exploring IT Support/ }))
    // No success is claimed and the visitor still has a way to book.
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText(/calendar (is )?ready|loaded/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the booking page in a new tab' })).toHaveAttribute(
      'href',
      'https://calendly.com/fresh-sam/20min',
    )
    expect(screen.getByRole('link', { name: 'hello@fresh-tech.uk' })).toBeInTheDocument()

    // Leaving and returning to the step re-initialises from an empty container.
    await user.click(screen.getByRole('button', { name: /Go back/ }))
    await user.click(screen.getByRole('button', { name: /Exploring IT Support/ }))
    const children = document.querySelector('.calendly-inline-widget')!.children
    expect(children).toHaveLength(1)
    expect((children[0] as HTMLElement).dataset.attempt).toBe('2')
  })

  it('makes the rest of the page inert while open and restores it on unmount', () => {
    const outer = document.createElement('div')
    outer.id = 'outer'
    outer.setAttribute('inert', '')
    document.body.appendChild(outer)
    const { unmount } = render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Book a call' })
    expect(opener.closest('[inert]')).not.toBeNull()
    expect(screen.getByRole('dialog').closest('[inert]')).toBeNull()
    unmount()
    expect(document.body.querySelector('[inert]:not(#outer)')).toBeNull()
    expect(outer.hasAttribute('inert')).toBe(true)
    outer.remove()
  })
})
