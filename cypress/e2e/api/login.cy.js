describe('API | POST /login', { tags: ['@api', '@regression'] }, () => {
  let user

  before(() => {
    cy.createUser().then((created) => (user = created))
  })

  after(() => {
    if (user) cy.deleteUser(user._id)
  })

  it('deve autenticar com credenciais válidas e retornar um token Bearer', { tags: ['@smoke', '@contract'] }, () => {
    cy.serverest('POST', '/login', { body: { email: user.email, password: user.password } }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.duration, 'tempo de resposta (ms)').to.be.lessThan(3000)
      cy.wrap(response.body).shouldMatchSchema('login')
    })
  })

  it('deve retornar 401 para senha incorreta', () => {
    cy.serverest('POST', '/login', { body: { email: user.email, password: 'senha-incorreta' } }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.eq('Email e/ou senha inválidos')
      expect(response.body).not.to.have.property('authorization')
    })
  })

  it('deve retornar a mesma mensagem para e-mail inexistente (evita enumeração de usuários)', () => {
    cy.serverest('POST', '/login', { body: { email: 'nao.existe@qa.com', password: 'qualquer' } }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.eq('Email e/ou senha inválidos')
    })
  })

  context('validação de payload', () => {
    const scenarios = [
      { title: 'sem e-mail', body: { password: 'teste' }, field: 'email', message: 'email é obrigatório' },
      { title: 'sem senha', body: { email: 'qa@qa.com' }, field: 'password', message: 'password é obrigatório' },
      { title: 'e-mail inválido', body: { email: 'qa-sem-arroba', password: 'teste' }, field: 'email', message: 'email deve ser um email válido' },
      { title: 'e-mail vazio', body: { email: '', password: 'teste' }, field: 'email', message: 'email não pode ficar em branco' },
    ]

    scenarios.forEach(({ title, body, field, message }) => {
      it(`deve retornar 400 para requisição ${title}`, () => {
        cy.serverest('POST', '/login', { body }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body).to.have.property(field, message)
        })
      })
    })
  })
})
