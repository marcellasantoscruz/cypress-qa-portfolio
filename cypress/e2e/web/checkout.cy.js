import InventoryPage from '../../support/pages/InventoryPage'
import CartPage from '../../support/pages/CartPage'
import CheckoutPage from '../../support/pages/CheckoutPage'
import { buildCheckoutInfo } from '../../support/factories'

describe('Web | Checkout', { tags: ['@web', '@regression'] }, () => {
  let messages

  before(() => {
    cy.fixture('web/messages').then((data) => (messages = data))
  })

  beforeEach(() => {
    cy.loginUI()
    InventoryPage.visit()
    InventoryPage.addToCart('Sauce Labs Backpack').addToCart('Sauce Labs Fleece Jacket').openCart()
    CartPage.checkout()
  })

  it('deve concluir uma compra de ponta a ponta', { tags: '@smoke' }, () => {
    CheckoutPage.fillInformation(buildCheckoutInfo()).continue()

    cy.location('pathname').should('eq', '/checkout-step-two.html')
    CheckoutPage.shouldHaveConsistentTotals().finish()

    cy.location('pathname').should('eq', '/checkout-complete.html')
    CheckoutPage.elements.completeHeader().should('have.text', messages.orderComplete)
    InventoryPage.elements.cartBadge().should('not.exist')
  })

  context('validação dos dados do comprador', () => {
    const scenarios = [
      { missing: 'firstName', error: 'firstNameRequired' },
      { missing: 'lastName', error: 'lastNameRequired' },
      { missing: 'postalCode', error: 'postalCodeRequired' },
    ]

    scenarios.forEach(({ missing, error }) => {
      it(`deve exigir o campo "${missing}"`, () => {
        CheckoutPage.fillInformation(buildCheckoutInfo({ [missing]: '' })).continue()

        CheckoutPage.shouldShowError(messages[error])
        cy.location('pathname').should('eq', '/checkout-step-one.html')
      })
    })
  })
})
