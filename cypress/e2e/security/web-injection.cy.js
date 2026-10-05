import LoginPage from '../../support/pages/LoginPage'
import InventoryPage from '../../support/pages/InventoryPage'
import CartPage from '../../support/pages/CartPage'
import CheckoutPage from '../../support/pages/CheckoutPage'

/**
 * OWASP A03:2021 — Injection (XSS e SQLi) nos formulários do SauceDemo.
 * Testes não destrutivos: verificam que os payloads são tratados como texto
 * e nunca executados nem aceitos como credencial.
 */
describe('Segurança Web | Injeção', { tags: ['@security', '@web'] }, () => {
  const typeOptions = { parseSpecialCharSequences: false, delay: 0 }
  let xssPayloads
  let sqlPayloads
  let messages

  before(() => {
    cy.fixture('security/xss-payloads').then((data) => (xssPayloads = data))
    cy.fixture('security/injection-payloads').then(({ sql }) => (sqlPayloads = sql))
    cy.fixture('web/messages').then((data) => (messages = data))
  })

  beforeEach(() => {
    cy.armXssSensors()
  })

  it('não deve executar payloads XSS no formulário de login', () => {
    LoginPage.visit()

    xssPayloads.forEach((payload) => {
      LoginPage.elements.username().clear().type(payload, typeOptions)
      LoginPage.elements.password().clear().type(payload, typeOptions)
      LoginPage.submit()

      LoginPage.shouldShowError(messages.invalidCredentials)
      cy.shouldNotHaveExecutedXss()
    })
  })

  it('não deve autenticar com payloads de SQL Injection', { tags: '@smoke' }, () => {
    LoginPage.visit()

    sqlPayloads.forEach((payload) => {
      LoginPage.elements.username().clear().type(payload, typeOptions)
      LoginPage.elements.password().clear().type(payload, typeOptions)
      LoginPage.submit()

      LoginPage.shouldShowError(messages.invalidCredentials)
      cy.location('pathname').should('eq', '/')
    })
  })

  it('não deve executar payloads XSS nos dados do checkout', () => {
    cy.loginUI()
    InventoryPage.visit().addToCart('Sauce Labs Backpack').openCart()
    CartPage.checkout()

    const [payload] = xssPayloads.filter((p) => p.includes('onerror'))
    CheckoutPage.elements.firstName().type(payload, typeOptions)
    CheckoutPage.elements.lastName().type(payload, typeOptions)
    CheckoutPage.elements.postalCode().type(payload, typeOptions)
    CheckoutPage.continue()

    cy.location('pathname').should('eq', '/checkout-step-two.html')
    cy.get('img[src="x"]').should('not.exist')
    cy.shouldNotHaveExecutedXss()
  })
})
