import { buildUser } from '../../support/factories'

describe('API | /usuarios', { tags: ['@api', '@regression'] }, () => {
  const createdIds = []

  after(() => {
    createdIds.forEach((id) => cy.deleteUser(id))
  })

  it('deve listar usuários respeitando o contrato', { tags: ['@smoke', '@contract'] }, () => {
    cy.serverest('GET', '/usuarios').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.headers['content-type']).to.include('application/json')
      cy.wrap(response.body).shouldMatchSchema('users-list')
    })
  })

  it('deve executar o ciclo completo de CRUD de um usuário', { tags: '@smoke' }, () => {
    const user = buildUser()

    // CREATE
    cy.serverest('POST', '/usuarios', { body: user }).then((createResponse) => {
      expect(createResponse.status).to.eq(201)
      expect(createResponse.body.message).to.eq('Cadastro realizado com sucesso')
      const { _id: id } = createResponse.body
      createdIds.push(id)

      // READ
      cy.serverest('GET', `/usuarios/${id}`).then((getResponse) => {
        expect(getResponse.status).to.eq(200)
        expect(getResponse.body).to.include({ nome: user.nome, email: user.email, _id: id })
        cy.wrap(getResponse.body).shouldMatchSchema('user')
      })

      // UPDATE
      const updated = { ...user, nome: `${user.nome} (editado)`, administrador: 'true' }
      cy.serverest('PUT', `/usuarios/${id}`, { body: updated }).then((putResponse) => {
        expect(putResponse.status).to.eq(200)
        expect(putResponse.body.message).to.eq('Registro alterado com sucesso')
      })
      cy.serverest('GET', `/usuarios/${id}`).its('body').should('include', { nome: updated.nome, administrador: 'true' })

      // DELETE
      cy.serverest('DELETE', `/usuarios/${id}`).then((deleteResponse) => {
        expect(deleteResponse.status).to.eq(200)
        expect(deleteResponse.body.message).to.eq('Registro excluído com sucesso')
      })
      cy.serverest('GET', `/usuarios/${id}`).then((notFound) => {
        expect(notFound.status).to.eq(400)
        expect(notFound.body.message).to.eq('Usuário não encontrado')
      })
    })
  })

  it('deve filtrar usuários por e-mail via query string', () => {
    cy.createUser().then((user) => {
      createdIds.push(user._id)

      cy.serverest('GET', '/usuarios', { qs: { email: user.email } }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.quantidade).to.eq(1)
        expect(response.body.usuarios[0]._id).to.eq(user._id)
      })
    })
  })

  it('não deve permitir cadastro com e-mail duplicado', () => {
    cy.createUser().then((existing) => {
      createdIds.push(existing._id)

      cy.serverest('POST', '/usuarios', { body: buildUser({ email: existing.email }) }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.message).to.eq('Este email já está sendo usado')
      })
    })
  })

  context('validação de payload', () => {
    const scenarios = [
      { field: 'nome', value: '', message: 'nome não pode ficar em branco' },
      { field: 'email', value: 'email-invalido', message: 'email deve ser um email válido' },
      { field: 'password', value: '', message: 'password não pode ficar em branco' },
      { field: 'administrador', value: 'sim', message: "administrador deve ser 'true' ou 'false'" },
    ]

    scenarios.forEach(({ field, value, message }) => {
      it(`deve retornar 400 quando "${field}" = "${value}"`, () => {
        cy.serverest('POST', '/usuarios', { body: buildUser({ [field]: value }) }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body).to.have.property(field, message)
        })
      })
    })
  })

  it('deve retornar 400 ao buscar um ID inexistente', () => {
    cy.serverest('GET', '/usuarios/0000000000000000').then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.eq('Usuário não encontrado')
    })
  })
})
