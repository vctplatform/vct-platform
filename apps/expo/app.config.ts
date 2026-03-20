import { ExpoConfig, ConfigContext } from 'expo/config'

/**
 * Dynamic Expo configuration.
 * Adjusts app display name based on environment and passes
 * runtime config to the app via `expo-constants`.
 *
 * Environment variables are set per-profile in eas.json.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env.EXPO_PUBLIC_ENV || 'development'

  const envSuffix: Record<string, string> = {
    development: ' (Dev)',
    staging: ' (Staging)',
    production: '',
  }

  return {
    ...config,
    name: `VCT Platform${envSuffix[env] ?? ` (${env})`}`,
    slug: 'vct-platform',
    extra: {
      ...config.extra,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:18080',
      environment: env,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'YOUR_EAS_PROJECT_ID',
      },
    },
  }
}
