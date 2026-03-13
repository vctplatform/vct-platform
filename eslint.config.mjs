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
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'dist/', 'build/'],
  },
]
