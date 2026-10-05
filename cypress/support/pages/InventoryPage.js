const toSlug = (productName) => productName.toLowerCase().replace(/\s+/g, '-')

class InventoryPage {
  elements = {
    title: () => cy.get('[data-test="title"]'),
    items: () => cy.get('[data-test="inventory-item"]'),
    itemNames: () => cy.get('[data-test="inventory-item-name"]'),
    itemPrices: () => cy.get('[data-test="inventory-item-price"]'),
    sortSelect: () => cy.get('[data-test="product-sort-container"]'),
    cartBadge: () => cy.get('[data-test="shopping-cart-badge"]'),
    cartLink: () => cy.get('[data-test="shopping-cart-link"]'),
    menuButton: () => cy.get('#react-burger-menu-btn'),
    logoutLink: () => cy.get('[data-test="logout-sidebar-link"]'),
  }

  visit() {
    cy.visitSpa('/inventory.html')
    return this
  }

  shouldBeLoaded() {
    cy.location('pathname').should('eq', '/inventory.html')
    this.elements.title().should('have.text', 'Products')
    return this
  }

  sortBy(option) {
    this.elements.sortSelect().select(option)
    return this
  }

  addToCart(productName) {
    cy.get(`[data-test="add-to-cart-${toSlug(productName)}"]`).click()
    return this
  }

  removeFromCart(productName) {
    cy.get(`[data-test="remove-${toSlug(productName)}"]`).click()
    return this
  }

  openProduct(productName) {
    this.elements.itemNames().contains(productName).click()
    return this
  }

  openCart() {
    this.elements.cartLink().click()
    return this
  }

  logout() {
    this.elements.menuButton().click()
    this.elements.logoutLink().should('be.visible').click()
    return this
  }

  /** Retorna a lista de preços exibidos, na ordem da tela, como números. */
  getPrices() {
    return this.elements
      .itemPrices()
      .then(($prices) => Cypress._.map($prices, (el) => Number(el.innerText.replace('$', ''))))
  }

  getNames() {
    return this.elements.itemNames().then(($names) => Cypress._.map($names, 'innerText'))
  }
}

export default new InventoryPage()
