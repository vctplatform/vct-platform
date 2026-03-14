/**
 * Solito navigation shim for Expo Web.
 *
 * Solito's web useRouter depends on Next.js App Router which doesn't exist
 * in Expo Web. This shim re-exports React Navigation's hooks so all
 * `import { useRouter } from 'solito/navigation'` calls work on Expo Web.
 */
import { useNavigation, useRoute } from '@react-navigation/native'
import { useCallback, useMemo } from 'react'

export function useRouter() {
  const navigation = useNavigation<any>()

  const push = useCallback(
    (path: string, params?: Record<string, any>) => {
      // Strip leading "/" and use as screen name
      const screenName = path.replace(/^\//, '')
      navigation.navigate(screenName, params)
    },
    [navigation]
  )

  const replace = useCallback(
    (path: string, params?: Record<string, any>) => {
      const screenName = path.replace(/^\//, '')
      navigation.reset({
        index: 0,
        routes: [{ name: screenName, params }],
      })
    },
    [navigation]
  )

  const back = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }, [navigation])

  return useMemo(
    () => ({ push, replace, back }),
    [push, replace, back]
  )
}

export function useSearchParams<T extends Record<string, string>>(): T {
  try {
    const route = useRoute<any>()
    return (route.params || {}) as T
  } catch {
    return {} as T
  }
}

export function useParams<T extends Record<string, string>>(): T {
  try {
    const route = useRoute<any>()
    return (route.params || {}) as T
  } catch {
    return {} as T
  }
}

// Re-export Link as a simple Pressable-based component
export { Link } from '@react-navigation/native'
