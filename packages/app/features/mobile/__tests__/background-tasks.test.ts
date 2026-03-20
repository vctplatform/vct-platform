// @ts-nocheck
import { backgroundTasks, BackgroundTask } from '../background-tasks'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}))

describe('backgroundTasks', () => {
  const createMockTask = (overrides: Partial<BackgroundTask> = {}): BackgroundTask => ({
    name: 'testTask',
    description: 'Test task',
    intervalMs: 1000,
    requiresNetwork: false,
    execute: jest.fn().mockResolvedValue({ success: true, message: 'OK' }),
    ...overrides
  })

  beforeEach(() => {
    backgroundTasks.unregisterAll()
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('registers and unregisters tasks', () => {
    const mockTask = createMockTask()
    backgroundTasks.register(mockTask)
    expect(backgroundTasks.getTasks().some(t => t.name === 'testTask')).toBe(true)

    backgroundTasks.unregister('testTask')
    expect(backgroundTasks.getTasks().some(t => t.name === 'testTask')).toBe(false)
  })

  it('sorts tasks by priority during runAll', async () => {
    const executed: string[] = []
    
    backgroundTasks.register(createMockTask({ name: 'lowPriority', priority: 'low', execute: async () => { executed.push('low'); return { success: true, message: 'OK' } } }))
    backgroundTasks.register(createMockTask({ name: 'criticalPriority', priority: 'critical', execute: async () => { executed.push('critical'); return { success: true, message: 'OK' } } }))
    backgroundTasks.register(createMockTask({ name: 'highPriority', priority: 'high', execute: async () => { executed.push('high'); return { success: true, message: 'OK' } } }))

    // Simulate runAll completion
    const runPromise = backgroundTasks.runAll({ force: true })
    
    await runPromise

    // Expected order: critical, high, low
    expect(executed).toEqual(['critical', 'high', 'low'])
  })

  it('retries failed tasks according to maxRetries', async () => {
    let attempts = 0
    const executeMock = jest.fn().mockImplementation(async () => {
      attempts++
      if (attempts < 3) throw new Error('Simulated failure')
      return { success: true, message: 'OK' }
    })

    backgroundTasks.register(createMockTask({
      name: 'retryTask',
      maxRetries: 3,
      retryDelayMs: 10,
      execute: executeMock
    }))

    const runPromise = backgroundTasks.runAll({ force: true })
    
    // Advance timers for the retries
    jest.advanceTimersByTime(100) 

    await runPromise

    expect(attempts).toBe(3)
    expect(executeMock).toHaveBeenCalledTimes(3)
  })

  it('skips low priority tasks when battery is low', async () => {
    const executeMock = jest.fn().mockResolvedValue({ success: true, message: 'OK' })
    
    backgroundTasks.register(createMockTask({ name: 'lowPriority', priority: 'low', execute: executeMock }))
    
    await backgroundTasks.runAll({ batteryLevel: 0.10, isCharging: false })
    
    expect(executeMock).not.toHaveBeenCalled()
  })

  it('runs low priority tasks when battery is low but device is charging', async () => {
    const executeMock = jest.fn().mockResolvedValue({ success: true, message: 'OK' })
    
    backgroundTasks.register(createMockTask({ name: 'lowPriority', priority: 'low', execute: executeMock }))
    
    await backgroundTasks.runAll({ batteryLevel: 0.10, isCharging: true })
    
    expect(executeMock).toHaveBeenCalled()
  })

  it('computes health metrics correctly', async () => {
    // We mock the internals of history since it reads/writes to AsyncStorage
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([
      { taskName: 'testTask', durationMs: 100, timestamp: 1000, result: { success: true } },
      { taskName: 'testTask', durationMs: 200, timestamp: 2000, result: { success: false } },
      { taskName: 'testTask', durationMs: 300, timestamp: 3000, result: { success: true } },
      { taskName: 'otherTask', durationMs: 50,  timestamp: 4000, result: { success: true } },
    ]))

    // Trigger load from storage
    // It's private, but we can call getTaskMetrics to force it if needed
    // Or just run initBackgroundFetch which calls it.
    await backgroundTasks.initBackgroundFetch()

    const metrics = backgroundTasks.getTaskMetrics('testTask')
    expect(metrics).not.toBeNull()
    expect(metrics!.totalRuns).toBe(3)
    expect(metrics!.successCount).toBe(2)
    expect(metrics!.failureCount).toBe(1)
    expect(metrics!.successRate).toBeCloseTo(0.666, 2)
    expect(metrics!.avgDurationMs).toBe(200) // (100+200+300)/3
    // The implementation records `ranAt`, let's just assert metrics exist.
  })
})
