import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { CONSENT_KEY, CONSENT_EVENT, getConsent, setConsent } from '../../utils/consent'

// The analytics loader is the first inline script in index.html. It is
// evaluated here against jsdom so the tests exercise the real loader rather
// than a copy. jsdom does not fetch script src, so vendor code never runs.
const html = readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8')
const loaderSource = html.match(/<script type="text\/javascript">([\s\S]*?)<\/script>/)?.[1]

function installLoader() {
  if (!loaderSource) throw new Error('analytics loader not found in index.html')
  new Function(loaderSource)()
}

const vendorScripts = () =>
  Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'))
    .map(s => s.src)
    .filter(src => src.includes('googletagmanager') || src.includes('clarity.ms'))

const reload = vi.fn()

beforeEach(() => {
  localStorage.clear()
  document.head.innerHTML = ''
  document.body.innerHTML = '<script></script>'
  delete window.ftLoadAnalytics
  delete window.ftCancelAnalytics
  vi.useFakeTimers()
  vi.stubGlobal('location', { ...window.location, reload })
  reload.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('analytics consent', () => {
  it('fresh visit loads nothing, even after interaction and the timeout', () => {
    installLoader()
    document.dispatchEvent(new Event('click'))
    vi.advanceTimersByTime(5000)
    expect(vendorScripts()).toEqual([])
    expect(getConsent()).toBeNull()
  })

  it('accept persists consent and loads vendors on first interaction', () => {
    installLoader()
    setConsent(true)
    expect(getConsent()?.analytics).toBe(true)
    expect(vendorScripts()).toEqual([])
    document.dispatchEvent(new Event('click'))
    expect(vendorScripts()).toHaveLength(2)
  })

  it('reject persists denial and never loads', () => {
    installLoader()
    setConsent(false)
    document.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(5000)
    expect(vendorScripts()).toEqual([])
    expect(getConsent()?.analytics).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })

  it('withdrawal before loading cancels the armed load', () => {
    installLoader()
    setConsent(true)
    setConsent(false)
    document.dispatchEvent(new Event('click'))
    vi.advanceTimersByTime(5000)
    expect(vendorScripts()).toEqual([])
    expect(reload).not.toHaveBeenCalled()
  })

  it('withdrawal after loading stores denial then reloads', () => {
    installLoader()
    setConsent(true)
    vi.advanceTimersByTime(3000)
    expect(vendorScripts()).toHaveLength(2)
    const events: boolean[] = []
    window.addEventListener(CONSENT_EVENT, e => events.push((e as CustomEvent).detail.analytics))
    setConsent(false)
    expect(getConsent()?.analytics).toBe(false)
    expect(events).toEqual([false])
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('revisit with stored consent arms automatically; stored denial does not', () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true, ts: 1 }))
    installLoader()
    document.dispatchEvent(new Event('keydown'))
    expect(vendorScripts()).toHaveLength(2)

    document.head.innerHTML = ''
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: false, ts: 1 }))
    installLoader()
    document.dispatchEvent(new Event('keydown'))
    vi.advanceTimersByTime(5000)
    expect(vendorScripts()).toEqual([])
  })

  it('consent removed from storage between arming and firing blocks the load', () => {
    installLoader()
    setConsent(true)
    localStorage.removeItem(CONSENT_KEY)
    vi.advanceTimersByTime(3000)
    expect(vendorScripts()).toEqual([])
  })

  it('write-blocked storage with an old opt-in: reject removes the opt-in, then reloads', () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true, ts: 1 }))
    installLoader()
    vi.advanceTimersByTime(3000)
    expect(vendorScripts()).toHaveLength(2)
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    setConsent(false)
    setItem.mockRestore()
    expect(getConsent()).toBeNull()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  const makeReadOnly = () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
  }

  it('read-only storage with a stale opt-in never arms on a fresh load', () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true, ts: 1 }))
    makeReadOnly()
    installLoader()
    document.dispatchEvent(new Event('click'))
    vi.advanceTimersByTime(5000)
    expect(vendorScripts()).toEqual([])
    vi.restoreAllMocks()
  })

  it('loaded, then storage becomes read-only: withdrawal reloads and the reloaded page cannot re-arm', () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true, ts: 1 }))
    installLoader()
    vi.advanceTimersByTime(3000)
    expect(vendorScripts()).toHaveLength(2)

    makeReadOnly()
    setConsent(false)
    // Honest state: storage still says opt-in, but the page reloads to stop the trackers.
    expect(getConsent()?.analytics).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)

    // Simulate the reloaded page with the same read-only storage.
    document.head.innerHTML = ''
    delete window.ftLoadAnalytics
    delete window.ftCancelAnalytics
    installLoader()
    document.dispatchEvent(new Event('click'))
    vi.advanceTimersByTime(5000)
    expect(vendorScripts()).toEqual([])
    vi.restoreAllMocks()
  })

  it('storage becomes read-only after arming but before firing: nothing loads', () => {
    installLoader()
    setConsent(true)
    makeReadOnly()
    vi.advanceTimersByTime(3000)
    expect(vendorScripts()).toEqual([])
    vi.restoreAllMocks()
  })

  it('blocked storage fails closed: accept loads nothing', () => {
    const blocked = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
      clear: () => {},
    }
    vi.stubGlobal('localStorage', blocked)
    installLoader()
    expect(() => setConsent(true)).not.toThrow()
    document.dispatchEvent(new Event('click'))
    vi.advanceTimersByTime(5000)
    expect(vendorScripts()).toEqual([])
    expect(() => setConsent(false)).not.toThrow()
    expect(reload).not.toHaveBeenCalled()
  })
})
