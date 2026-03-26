import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import boundaries from 'eslint-plugin-boundaries'
import importPlugin from 'eslint-plugin-import'

export default [
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
      boundaries,
      import: importPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      next: {
        rootDir: 'apps/next/',
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: [
            'tsconfig.json',
            'apps/*/tsconfig.json',
            'packages/*/tsconfig.json'
          ]
        },
        node: true
      },
      'boundaries/elements': [
        { type: 'shared-types', pattern: 'packages/shared-types/**/*' },
        { type: 'shared-utils', pattern: 'packages/shared-utils/**/*' },
        { type: 'ui', pattern: 'packages/ui/**/*' },
        { type: 'app', pattern: 'packages/app/**/*' },
        { type: 'apps', pattern: 'apps/**/*' }
      ],
      'boundaries/ignore': ['**/*.test.*', '**/*.spec.*']
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': 'off',
      // React hooks — only classic recommended rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      
      // Architecture Guard Rails - Boundaries
      'boundaries/element-types': ['error', {
        default: 'allow',
        rules: [
          {
            from: 'shared-types',
            disallow: ['shared-utils', 'ui', 'app', 'apps'],
            message: 'shared-types không được import từ các layer khác.'
          },
          {
            from: 'shared-utils',
            disallow: ['ui', 'app', 'apps'],
            message: 'shared-utils không được chứa logic React/UI hoặc app.'
          },
          {
            from: 'ui',
            disallow: ['app', 'apps'],
            message: 'ui components không được biết về biến trạng thái hoặc business logic của app.'
          },
          {
            from: 'app',
            disallow: ['apps'],
            message: 'app feature module không được import ngược từ ứng dụng cụ thể (next/expo).'
          }
        ]
      }]
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'dist/', 'build/'],
  },
]
