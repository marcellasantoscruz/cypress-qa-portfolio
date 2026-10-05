import InventoryPage from '../../support/pages/InventoryPage'

describe('Web | Catálogo de produtos', { tags: ['@web', '@regression'] }, () => {
  beforeEach(() => {
    cy.loginUI()
    InventoryPage.visit().shouldBeLoaded()
  })

  it('deve listar os 6 produtos com nome, preço e botão de compra', { tags: '@smoke' }, () => {
    InventoryPage.elements.items().should('have.length', 6).each(($item) => {
      cy.wrap($item).find('[data-test="inventory-item-name"]').should('not.be.empty')
      cy.wrap($item).find('[data-test="inventory-item-price"]').invoke('text').should('match', /^\$\d+\.\d{2}$/)
      cy.wrap($item).find('button').should('have.text', 'Add to cart')
    })
  })

  context('ordenação', () => {
    it('deve ordenar por preço (menor → maior)', () => {
      InventoryPage.sortBy('lohi')
      InventoryPage.getPrices().then((prices) => {
        expect(prices).to.deep.equal([...prices].sort((a, b) => a - b))
      })
    })

    it('deve ordenar por preço (maior → menor)', () => {
      InventoryPage.sortBy('hilo')
      InventoryPage.getPrices().then((prices) => {
        expect(prices).to.deep.equal([...prices].sort((a, b) => b - a))
      })
    })

    it('deve ordenar por nome (Z → A)', () => {
      InventoryPage.sortBy('za')
      InventoryPage.getNames().then((names) => {
        expect(names).to.deep.equal([...names].sort().reverse())
      })
    })
  })

  it('deve abrir a página de detalhes do produto', () => {
    const product = 'Sauce Labs Backpack'

    InventoryPage.openProduct(product)

    cy.location('pathname').should('eq', '/inventory-item.html')
    cy.get('[data-test="inventory-item-name"]').should('have.text', product)
    cy.get('[data-test="back-to-products"]').click()
    InventoryPage.shouldBeLoaded()
  })
})
