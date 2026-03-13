import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ resolvePluginsRelativeTo: __dirname })

export default [
  ...compat.extends('next'),
  {
    settings: {
      next: {
        rootDir: 'apps/next/',
      },
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'off',

      // ── Stricter rules ─────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'dist/', 'build/'],
  },
]
