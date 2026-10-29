import '@testing-library/jest-dom/vitest'

// jsdom does not implement matchMedia. Keep the mock responsive to the actual
// test viewport and expose both modern and legacy listener APIs used by UI code.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => {
    const widthMatches = () => {
      const min = query.match(/\(min-width:\s*(\d+)px\)/)?.[1]
      const max = query.match(/\(max-width:\s*(\d+)px\)/)?.[1]
      return Boolean(min || max) && (!min || window.innerWidth >= Number(min)) && (!max || window.innerWidth <= Number(max))
    }
    const listeners = new Set<(event: MediaQueryListEvent) => void>()
    const mediaQueryList = {
      media: query,
      onchange: null,
      get matches() { return widthMatches() },
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => { listeners.add(listener) },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => { listeners.delete(listener) },
      addListener: (listener: (event: MediaQueryListEvent) => void) => { listeners.add(listener) },
      removeListener: (listener: (event: MediaQueryListEvent) => void) => { listeners.delete(listener) },
      dispatchEvent: (event: Event) => {
        listeners.forEach(listener => listener(event as MediaQueryListEvent))
        return true
      },
    }
    return mediaQueryList as MediaQueryList
  }
}
