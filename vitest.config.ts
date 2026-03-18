import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['packages/app/**/__tests__/**/*.test.{ts,tsx}'],
        exclude: ['node_modules', '.next', 'dist'],
        setupFiles: [],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        alias: {
            '@': path.resolve(__dirname, 'packages/app'),
        },
    },
})
