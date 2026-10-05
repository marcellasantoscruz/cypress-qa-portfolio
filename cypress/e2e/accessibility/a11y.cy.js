import LoginPage from '../../support/pages/LoginPage'
import InventoryPage from '../../support/pages/InventoryPage'
import CartPage from '../../support/pages/CartPage'

/**
 * Acessibilidade com axe-core (WCAG 2.1 A/AA).
 * Todas as violações são logadas; o teste falha apenas em impacto "critical".
 */
describe('Acessibilidade | WCAG 2.1 AA', { tags: ['@a11y', '@web'] }, () => {
  it('página de login', { tags: '@smoke' }, () => {
    LoginPage.visit()
    cy.checkAccessibility()
  })

  it('catálogo de produtos', () => {
    cy.loginUI()
    InventoryPage.visit().shouldBeLoaded()
    cy.checkAccessibility()
  })

  it('carrinho', () => {
    cy.loginUI()
    InventoryPage.visit().addToCart('Sauce Labs Backpack')
    CartPage.visit().shouldContain(['Sauce Labs Backpack'])
    cy.checkAccessibility()
  })

  it('formulário de checkout', () => {
    cy.loginUI()
    cy.visitSpa('/checkout-step-one.html')
    cy.get('[data-test="firstName"]').should('be.visible')
    cy.checkAccessibility()
  })
})
