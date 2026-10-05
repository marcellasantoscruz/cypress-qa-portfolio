import { buildProduct } from '../../support/factories'

describe('API | /produtos', { tags: ['@api', '@regression'] }, () => {
  let admin
  let token
  const createdProductIds = []

  before(() => {
    cy.createUserAndLogin({ admin: true }).then((session) => {
      admin = session.user
      token = session.token
    })
  })

  after(() => {
    createdProductIds.forEach((id) => cy.deleteProduct(id, token))
    if (admin) cy.deleteUser(admin._id)
  })

  it('deve listar produtos respeitando o contrato', { tags: ['@smoke', '@contract'] }, () => {
    cy.serverest('GET', '/produtos').then((response) => {
      expect(response.status).to.eq(200)
      cy.wrap(response.body).shouldMatchSchema('products-list')
    })
  })

  it('deve cadastrar, consultar, alterar e excluir um produto (admin)', { tags: '@smoke' }, () => {
    const product = buildProduct()

    cy.serverest('POST', '/produtos', { body: product, token }).then((createResponse) => {
      expect(createResponse.status).to.eq(201)
      expect(createResponse.body.message).to.eq('Cadastro realizado com sucesso')
      const { _id: id } = createResponse.body

      cy.serverest('GET', `/produtos/${id}`).then((getResponse) => {
        expect(getResponse.status).to.eq(200)
        expect(getResponse.body).to.include({ ...product, _id: id })
        cy.wrap(getResponse.body).shouldMatchSchema('product')
      })

      cy.serverest('PUT', `/produtos/${id}`, { body: { ...product, preco: product.preco + 10 }, token })
        .its('body.message')
        .should('eq', 'Registro alterado com sucesso')

      cy.serverest('GET', `/produtos/${id}`).its('body.preco').should('eq', product.preco + 10)

      cy.serverest('DELETE', `/produtos/${id}`, { token }).its('body.message').should('eq', 'Registro excluído com sucesso')
    })
  })

  it('não deve permitir produtos com nome duplicado', () => {
    cy.createProduct(token).then((existing) => {
      createdProductIds.push(existing._id)

      cy.serverest('POST', '/produtos', { body: buildProduct({ nome: existing.nome }), token }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.message).to.eq('Já existe produto com esse nome')
      })
    })
  })

  context('validação de payload', () => {
    const scenarios = [
      { field: 'preco', value: 0, message: 'preco deve ser um número positivo' },
      { field: 'preco', value: 'dez', message: 'preco deve ser um número' },
      { field: 'quantidade', value: -1, message: 'quantidade deve ser maior ou igual a 0' },
      { field: 'nome', value: '', message: 'nome não pode ficar em branco' },
    ]

    scenarios.forEach(({ field, value, message }) => {
      it(`deve retornar 400 quando "${field}" = ${JSON.stringify(value)}`, () => {
        cy.serverest('POST', '/produtos', { body: buildProduct({ [field]: value }), token }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body).to.have.property(field, message)
        })
      })
    })
  })
})
