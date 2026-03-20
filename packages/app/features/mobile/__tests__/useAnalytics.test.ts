import { renderHook, act } from '@testing-library/react-native'
import { useAnalytics, setAnalyticsProvider, setAnalyticsOnlineStatus, AnalyticsProvider } from '../useAnalytics'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}))

describe('useAnalytics', () => {
  let mockProvider: AnalyticsProvider

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockProvider = {
      trackEvent: jest.fn().mockResolvedValue(true),
      trackScreen: jest.fn(),
      setUser: jest.fn()
    }
    setAnalyticsProvider(mockProvider)
    setAnalyticsOnlineStatus(true)
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]')
  })

  it('tracks an action to provider when online', async () => {
    const { result } = renderHook(() => useAnalytics('TestScreen'))

    act(() => {
      result.current.trackAction('button_click', { button: 'login' })
    })

    // wait for async dispatch
    await new Promise(r => setTimeout(r, 10))

    expect(mockProvider.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'button_click',
      params: { screen: 'TestScreen', button: 'login' }
    }))
    expect(AsyncStorage.setItem).not.toHaveBeenCalled()
  })

  it('queues an action offline', async () => {
    setAnalyticsOnlineStatus(false)
    const { result } = renderHook(() => useAnalytics('TestScreen'))

    act(() => {
      result.current.trackAction('button_click', { button: 'offline' })
    })

    await new Promise(r => setTimeout(r, 10))

    expect(mockProvider.trackEvent).not.toHaveBeenCalled()
    expect(AsyncStorage.setItem).toHaveBeenCalled()
  })

  it('flushes offline queue when back online', async () => {
    setAnalyticsOnlineStatus(false)
    
    // Simulate stored event
    const queuedEvent = { name: 'queued_event', params: { screen: 'TestScreen' }, timestamp: 123, sessionId: '123' }
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([queuedEvent]))

    setAnalyticsOnlineStatus(true) // Should trigger flushOfflineQueue

    await new Promise(r => setTimeout(r, 10))

    expect(mockProvider.trackEvent).toHaveBeenCalledWith(queuedEvent)
    expect(AsyncStorage.removeItem).toHaveBeenCalled()
  })

  it('creates helper metrics correctly', async () => {
    const { result } = renderHook(() => useAnalytics('HelperScreen'))

    act(() => {
      result.current.trackError('test_error', 'Some info')
      result.current.trackConversion('purchase', 100)
    })

    await new Promise(r => setTimeout(r, 10))

    expect(mockProvider.trackEvent).toHaveBeenCalledWith(expect.objectContaining({ 
        name: 'error', 
        params: expect.objectContaining({ error_name: 'test_error', message: 'Some info' }) 
    }))
    expect(mockProvider.trackEvent).toHaveBeenCalledWith(expect.objectContaining({ 
        name: 'conversion', 
        params: expect.objectContaining({ name: 'purchase', value: 100 }) 
    }))
  })
})
