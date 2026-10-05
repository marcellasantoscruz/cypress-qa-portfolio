import InventoryPage from '../../support/pages/InventoryPage'
import CartPage from '../../support/pages/CartPage'

describe('Web | Carrinho', { tags: ['@web', '@regression'] }, () => {
  const products = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Onesie']

  beforeEach(() => {
    cy.loginUI()
    InventoryPage.visit()
  })

  it('deve atualizar o contador ao adicionar e remover itens', () => {
    products.forEach((product, index) => {
      InventoryPage.addToCart(product)
      InventoryPage.elements.cartBadge().should('have.text', String(index + 1))
    })

    InventoryPage.removeFromCart(products[0])
    InventoryPage.elements.cartBadge().should('have.text', String(products.length - 1))
  })

  it('deve exibir no carrinho exatamente os itens adicionados', { tags: '@smoke' }, () => {
    products.forEach((product) => InventoryPage.addToCart(product))
    InventoryPage.openCart()

    CartPage.shouldContain(products)
  })

  it('deve manter os itens do carrinho após recarregar a página', () => {
    InventoryPage.addToCart(products[0])
    cy.reload()

    InventoryPage.elements.cartBadge().should('have.text', '1')
    CartPage.visit().shouldContain([products[0]])
  })

  it('deve remover item diretamente pela página do carrinho', () => {
    InventoryPage.addToCart(products[0]).openCart()

    cy.get(`[data-test="remove-sauce-labs-backpack"]`).click()

    CartPage.elements.items().should('not.exist')
    InventoryPage.elements.cartBadge().should('not.exist')
  })
})
