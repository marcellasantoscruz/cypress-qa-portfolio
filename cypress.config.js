const { defineConfig } = require('cypress')
const { plugin: cypressGrepPlugin } = require('@cypress/grep/plugin')

module.exports = defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  viewportWidth: 1366,
  viewportHeight: 768,
  defaultCommandTimeout: 8000,
  requestTimeout: 15000,
  retries: { runMode: 2, openMode: 0 },

  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports/html',
    reportPageTitle: 'Cypress QA Portfolio — Relatório de Execução',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
  },

  // Variáveis públicas (Cypress.expose). Podem ser sobrescritas via CLI: --expose apiUrl=...
  expose: {
    apiUrl: 'https://serverest.dev',
    grepFilterSpecs: true,
    grepOmitFiltered: true,
  },

  e2e: {
    baseUrl: 'https://www.saucedemo.com',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on)
      cypressGrepPlugin(config)

      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        table(rows) {
          console.table(rows)
          return null
        },
      })

      return config
    },
  },
})
