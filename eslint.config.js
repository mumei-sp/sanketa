// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignore dist and build artifacts
  globalIgnores(['dist', 'build', 'node_modules']),

  // ---------- Main TS + React Rules ----------
  {
    files: ['**/*.{ts,tsx}'],

    extends: [
      js.configs.recommended, // Base JS rules
      tseslint.configs.recommended, // TS rules
      react.configs.flat.recommended, // React linting
      reactHooks.configs.flat.recommended, // Hooks rules
      reactRefresh.configs.vite, // Fast refresh rules
      prettier, // Disable ESLint rules conflicting with Prettier
    ],

    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },

    settings: {
      react: {
        version: 'detect',
      },
    },
  },
])
