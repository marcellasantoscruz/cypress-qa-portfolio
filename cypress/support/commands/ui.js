import LoginPage from '../pages/LoginPage'
import InventoryPage from '../pages/InventoryPage'

/**
 * O SauceDemo é uma SPA hospedada no GitHub Pages: rotas internas (ex.: /inventory.html)
 * respondem HTTP 404 com um script de fallback que carrega o app. Por isso o deep link
 * precisa ignorar o status code do documento inicial.
 */
Cypress.Commands.add('visitSpa', (path) => cy.visit(path, { failOnStatusCode: false }))

/**
 * Login via UI com cache de sessão (cy.session): o fluxo de login roda uma única vez
 * por usuário e a sessão é restaurada nos testes seguintes.
 */
Cypress.Commands.add('loginUI', (userKey = 'standard') => {
  cy.fixture('web/users').then((users) => {
    const { username, password } = users[userKey]

    cy.session(
      ['saucedemo', username],
      () => {
        LoginPage.visit().login(username, password)
        InventoryPage.shouldBeLoaded()
      },
      {
        validate: () => cy.getCookie('session-username').should('have.property', 'value', username),
        cacheAcrossSpecs: true,
      },
    )
  })
})
