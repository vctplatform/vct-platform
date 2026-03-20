import { configManager, type AppConfig } from '../config-manager'

describe('configManager', () => {
  beforeEach(() => {
    configManager.resetOverrides()
  })

  it('detects default environment correctly', () => {
    // Assuming tests run in development or similar, the env is likely development
    expect(configManager.environment).toBeDefined()
  })

  it('returns default config values', () => {
    const apiBaseUrl = configManager.get('apiBaseUrl')
    expect(apiBaseUrl).toBeTruthy()
    expect(typeof apiBaseUrl).toBe('string')
  })

  it('allows setting runtime overrides', () => {
    const originalLogLevel = configManager.get('logLevel')
    
    configManager.set('logLevel', 'error')
    expect(configManager.get('logLevel')).toBe('error')

    configManager.resetOverrides()
    expect(configManager.get('logLevel')).toBe(originalLogLevel)
  })

  it('emits onChange events when config is updated', () => {
    const mockListener = jest.fn()
    const unsubscribe = configManager.onChange(mockListener)

    configManager.set('apiTimeout', 9999)
    expect(mockListener).toHaveBeenCalledWith('apiTimeout', 9999)

    // Should not emit if value is same
    mockListener.mockClear()
    configManager.set('apiTimeout', 9999)
    expect(mockListener).not.toHaveBeenCalled()

    unsubscribe()
    configManager.set('apiTimeout', 1000)
    expect(mockListener).not.toHaveBeenCalled()
  })

  it('fetches remote config and applies overrides', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        enableAnalytics: false,
        apiTimeout: 1234,
      } as Partial<AppConfig>),
    }
    
    global.fetch = jest.fn().mockResolvedValue(mockResponse)
    
    await configManager.fetchRemoteConfig()
    
    expect(configManager.get('enableAnalytics')).toBe(false)
    expect(configManager.get('apiTimeout')).toBe(1234)
    expect(global.fetch).toHaveBeenCalled()
  })
})
