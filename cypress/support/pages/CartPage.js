class CartPage {
  elements = {
    items: () => cy.get('[data-test="inventory-item"]'),
    itemNames: () => cy.get('[data-test="inventory-item-name"]'),
    checkoutButton: () => cy.get('[data-test="checkout"]'),
    continueShoppingButton: () => cy.get('[data-test="continue-shopping"]'),
  }

  visit() {
    cy.visitSpa('/cart.html')
    return this
  }

  shouldContain(productNames) {
    this.elements.items().should('have.length', productNames.length)
    productNames.forEach((name) => this.elements.itemNames().should('contain', name))
    return this
  }

  checkout() {
    this.elements.checkoutButton().click()
    return this
  }
}

export default new CartPage()
