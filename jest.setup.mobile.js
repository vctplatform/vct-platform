/**
 * Setup file for mobile Jest tests.
 * Mocks native modules that don't exist in the test environment.
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map()
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key) => Promise.resolve(store.get(key) ?? null)),
      setItem: jest.fn((key, value) => {
        store.set(key, value)
        return Promise.resolve()
      }),
      removeItem: jest.fn((key) => {
        store.delete(key)
        return Promise.resolve()
      }),
      getAllKeys: jest.fn(() => Promise.resolve([...store.keys()])),
      multiRemove: jest.fn((keys) => {
        keys.forEach((k) => store.delete(k))
        return Promise.resolve()
      }),
      clear: jest.fn(() => {
        store.clear()
        return Promise.resolve()
      }),
      // Expose for test assertions
      _store: store,
    },
  }
})

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(() =>
      Promise.resolve({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      }),
    ),
  },
}))

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}))

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))

// Suppress noisy warnings in tests
jest.spyOn(console, 'warn').mockImplementation(() => {})
