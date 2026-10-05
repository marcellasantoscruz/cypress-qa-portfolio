const js = require('@eslint/js')
const pluginCypress = require('eslint-plugin-cypress')
const globals = require('globals')

module.exports = [
  { ignores: ['node_modules/', 'cypress/reports/', 'cypress/screenshots/', 'cypress/videos/', 'cypress/downloads/'] },
  js.configs.recommended,
  {
    files: ['cypress.config.js', 'eslint.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['cypress/**/*.js'],
    ...pluginCypress.configs.recommended,
    languageOptions: {
      ...pluginCypress.configs.recommended.languageOptions,
      sourceType: 'module',
      globals: { ...globals.browser, ...pluginCypress.configs.recommended.languageOptions?.globals },
    },
    rules: {
      ...pluginCypress.configs.recommended.rules,
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/no-force': 'warn',
      'cypress/no-pause': 'error',
    },
  },
]
