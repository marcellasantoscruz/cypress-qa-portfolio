const parseAmount = (text) => Number(text.replace(/[^0-9.]/g, ''))

class CheckoutPage {
  elements = {
    firstName: () => cy.get('[data-test="firstName"]'),
    lastName: () => cy.get('[data-test="lastName"]'),
    postalCode: () => cy.get('[data-test="postalCode"]'),
    continueButton: () => cy.get('[data-test="continue"]'),
    finishButton: () => cy.get('[data-test="finish"]'),
    error: () => cy.get('[data-test="error"]'),
    itemPrices: () => cy.get('[data-test="inventory-item-price"]'),
    subtotal: () => cy.get('[data-test="subtotal-label"]'),
    tax: () => cy.get('[data-test="tax-label"]'),
    total: () => cy.get('[data-test="total-label"]'),
    completeHeader: () => cy.get('[data-test="complete-header"]'),
  }

  fillInformation({ firstName, lastName, postalCode }) {
    if (firstName) this.elements.firstName().type(firstName)
    if (lastName) this.elements.lastName().type(lastName)
    if (postalCode) this.elements.postalCode().type(postalCode)
    return this
  }

  continue() {
    this.elements.continueButton().click()
    return this
  }

  finish() {
    this.elements.finishButton().click()
    return this
  }

  shouldShowError(message) {
    this.elements.error().should('be.visible').and('have.text', message)
    return this
  }

  /** Valida que subtotal = soma dos itens e total = subtotal + taxa. */
  shouldHaveConsistentTotals() {
    this.elements.itemPrices().then(($prices) => {
      const itemsSum = Cypress._.sumBy($prices, (el) => parseAmount(el.innerText))

      // Valores exibidos com 2 casas decimais: tolerância de 1 centavo para arredondamento.
      this.elements.subtotal().invoke('text').then(parseAmount).should('be.closeTo', itemsSum, 0.01)

      this.elements.tax().invoke('text').then(parseAmount).then((tax) => {
        this.elements.total().invoke('text').then(parseAmount).should('be.closeTo', itemsSum + tax, 0.01)
      })
    })
    return this
  }
}

export default new CheckoutPage()
