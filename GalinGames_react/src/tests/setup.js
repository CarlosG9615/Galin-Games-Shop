import { JSDOM } from 'jsdom'
import '@testing-library/jest-dom/vitest'
import '../i18n'

if (typeof globalThis.localStorage === 'undefined') {
  const storage = new JSDOM('', { url: window.location.href }).window.localStorage
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
}
