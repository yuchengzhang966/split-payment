import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Dynamic SDK
jest.mock('@dynamic-labs/sdk-react-core', () => ({
  DynamicContextProvider: ({ children }) => children,
  useDynamicContext: () => ({
    user: null,
    primaryWallet: null,
    setShowDynamicUserProfile: jest.fn(),
  }),
  DynamicWidget: () => <div data-testid="dynamic-widget" />,
}))

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

// Mock window.alert
window.alert = jest.fn()