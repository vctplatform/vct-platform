// @ts-nocheck
import React from 'react'
import { render, screen, act } from '@testing-library/react-native'
import { View, Text, Button } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { VCTThemeProvider, useVCTTheme, type ThemeMode } from '../theme-provider'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}))

const TestComponent = () => {
  const { theme, preference, activeMode, setThemePreference } = useVCTTheme()
  return (
    <View>
      <Text testID="preference">{preference}</Text>
      <Text testID="activeMode">{activeMode}</Text>
      <Text testID="primaryColor">{theme.colors.primary}</Text>
      <Button testID="setLightBtn" title="Set Light" onPress={() => setThemePreference('light')} />
      <Button testID="setDarkBtn" title="Set Dark" onPress={() => setThemePreference('dark')} />
    </View>
  )
}

describe('VCTThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders default system theme and resolves to dark by default', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)

    render(
      <VCTThemeProvider defaultPreference="system">
        <TestComponent />
      </VCTThemeProvider>
    )

    // Wait for async load
    const userModeText = await screen.findByTestId('preference')
    expect(userModeText.props.children).toBe('system')
    expect(screen.getByTestId('activeMode').props.children).toBe('dark') // assuming useColorScheme defaults/mocked to dark or null
  })

  it('loads persisted theme mode', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('light')

    render(
      <VCTThemeProvider defaultPreference="system">
        <TestComponent />
      </VCTThemeProvider>
    )

    const userModeText = await screen.findByTestId('preference')
    expect(userModeText.props.children).toBe('light')
    expect(screen.getByTestId('activeMode').props.children).toBe('light')
  })

  it('toggles theme correctly', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)

    render(
      <VCTThemeProvider defaultPreference="dark">
        <TestComponent />
      </VCTThemeProvider>
    )

    await screen.findByTestId('preference')
    
    // Toggle to light
    act(() => {
      screen.getByTestId('setLightBtn').props.onPress()
    })

    expect(screen.getByTestId('preference').props.children).toBe('light')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('vct-theme-preference', 'light')
    
    // Toggle back to dark
    act(() => {
      screen.getByTestId('setDarkBtn').props.onPress()
    })

    expect(screen.getByTestId('preference').props.children).toBe('dark')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('vct-theme-preference', 'dark')
  })
})
