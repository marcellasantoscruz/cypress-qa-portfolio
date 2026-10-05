import { buildUser } from '../../support/factories'

/**
 * OWASP API3:2023 (Broken Object Property Level Authorization / mass assignment),
 * A03:2021 (Injection) e A05:2021 (tratamento de erros sem vazamento de detalhes).
 */
describe('Segurança API | Validação de entrada', { tags: ['@security', '@api'] }, () => {
  let payloads

  before(() => {
    cy.fixture('security/injection-payloads').then((data) => (payloads = data))
  })

  context('injeção no login', () => {
    it('deve rejeitar operadores NoSQL no campo e-mail com 400', { tags: '@smoke' }, () => {
      payloads.nosql.forEach((operator) => {
        cy.serverest('POST', '/login', { body: { email: operator, password: 'x' } }).then((response) => {
          expect(response.status, JSON.stringify(operator)).to.eq(400)
          expect(response.body).not.to.have.property('authorization')
        })
      })
    })

    it('deve rejeitar operadores NoSQL no campo senha com 400', () => {
      payloads.nosql.forEach((operator) => {
        cy.serverest('POST', '/login', { body: { email: 'fulano@qa.com', password: operator } }).then((response) => {
          expect(response.status, JSON.stringify(operator)).to.eq(400)
          expect(response.body).to.have.property('password', 'password deve ser uma string')
        })
      })
    })

    it('deve rejeitar payloads de SQL Injection no e-mail e não autenticar pela senha', () => {
      payloads.sql.forEach((payload) => {
        cy.serverest('POST', '/login', { body: { email: payload, password: 'x' } }).its('status').should('eq', 400)
        cy.serverest('POST', '/login', { body: { email: 'fulano@qa.com', password: payload } })
          .its('status')
          .should('eq', 401)
      })
    })
  })

  context('mass assignment', () => {
    const forbiddenFields = [
      { field: '_id', value: 'AAAAAAAAAAAAAAAA' },
      { field: 'role', value: 'admin' },
      { field: 'isAdmin', value: true },
    ]

    forbiddenFields.forEach(({ field, value }) => {
      it(`deve recusar o campo não permitido "${field}" no cadastro de usuário`, () => {
        cy.serverest('POST', '/usuarios', { body: { ...buildUser(), [field]: value } }).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body).to.have.property(field, `${field} não é permitido`)
        })
      })
    })
  })

  context('tratamento de erros', () => {
    it('deve responder JSON malformado com 400 sem expor stack trace', () => {
      cy.serverest('POST', '/login', {
        body: '{"email": "qa@qa.com", "password": ',
        headers: { 'Content-Type': 'application/json' },
      }).then((response) => {
        expect(response.status).to.eq(400)
        const raw = JSON.stringify(response.body)
        expect(raw).not.to.match(/\bat .+\.js:\d+/) // frames de stack trace
        expect(raw).not.to.match(/node_modules|SyntaxError/)
      })
    })

    const maliciousIds = ['..%2F..%2Fetc%2Fpasswd', "1' OR '1'='1", '%24ne']

    maliciousIds.forEach((id) => {
      it(`deve validar o formato do ID no path: ${decodeURIComponent(id)}`, () => {
        cy.serverest('GET', `/usuarios/${id}`).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body.id).to.eq('id deve ter exatamente 16 caracteres alfanuméricos')
        })
      })
    })
  })

  context('exposição de dados sensíveis', { tags: '@known-vuln' }, () => {
    it('[VULN-API-02] listagem pública de usuários retorna a senha em texto puro', () => {
      cy.createUser().then((user) => {
        cy.serverest('GET', '/usuarios', { qs: { email: user.email } }).then(({ body }) => {
          const [listed] = body.usuarios
          cy.confirmVulnerability(
            'VULN-API-02',
            'GET /usuarios (sem autenticação) expõe o campo "password"',
            listed.password === user.password,
          )
        })
        cy.deleteUser(user._id)
      })
    })
  })
})
