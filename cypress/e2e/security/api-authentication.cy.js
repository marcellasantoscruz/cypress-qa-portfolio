import { buildProduct } from '../../support/factories'
import { decodeJwt, forgeJwt, tamperSignature } from '../../support/utils/jwt'

/**
 * OWASP API2:2023 (Broken Authentication) e API5:2023 (Broken Function Level Authorization).
 */
describe('Segurança API | Autenticação e autorização', { tags: ['@security', '@api'] }, () => {
  const INVALID_TOKEN_MESSAGE = 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'
  const ADMIN_ONLY_MESSAGE = 'Rota exclusiva para administradores'

  let admin
  let adminToken
  let regular
  let regularToken

  before(() => {
    cy.createUserAndLogin({ admin: true }).then(({ user, token }) => {
      admin = user
      adminToken = token
    })
    cy.createUserAndLogin({ admin: false }).then(({ user, token }) => {
      regular = user
      regularToken = token
    })
  })

  after(() => {
    ;[admin, regular].filter(Boolean).forEach((user) => cy.deleteUser(user._id))
  })

  const expectRejectedToken = (token) => {
    cy.serverest('POST', '/produtos', { body: buildProduct(), token }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.eq(INVALID_TOKEN_MESSAGE)
    })
  }

  context('rejeição de tokens inválidos', () => {
    it('deve retornar 401 sem header Authorization', { tags: '@smoke' }, () => {
      expectRejectedToken(undefined)
    })

    it('deve retornar 401 para token malformado', () => {
      expectRejectedToken('Bearer nao-e-um-jwt')
    })

    it('deve retornar 401 para token com assinatura adulterada', () => {
      expectRejectedToken(tamperSignature(adminToken))
    })

    it('deve retornar 401 para token forjado com "alg: none"', () => {
      const { payload } = decodeJwt(adminToken)
      expectRejectedToken(forgeJwt({ alg: 'none', typ: 'JWT' }, payload))
    })

    it('deve retornar 401 para token de usuário que foi excluído', () => {
      cy.createUserAndLogin({ admin: true }).then(({ user, token }) => {
        cy.deleteUser(user._id)
        expectRejectedToken(token)
      })
    })
  })

  context('autorização por perfil', () => {
    it('deve retornar 403 quando usuário comum tenta cadastrar produto', { tags: '@smoke' }, () => {
      cy.serverest('POST', '/produtos', { body: buildProduct(), token: regularToken }).then((response) => {
        expect(response.status).to.eq(403)
        expect(response.body.message).to.eq(ADMIN_ONLY_MESSAGE)
      })
    })

    it('deve retornar 403 quando usuário comum tenta excluir produto', () => {
      cy.createProduct(adminToken).then((product) => {
        cy.serverest('DELETE', `/produtos/${product._id}`, { token: regularToken }).then((response) => {
          expect(response.status).to.eq(403)
          expect(response.body.message).to.eq(ADMIN_ONLY_MESSAGE)
        })
        cy.deleteProduct(product._id, adminToken)
      })
    })

    it('deve retornar 403 quando usuário comum tenta alterar produto', () => {
      cy.createProduct(adminToken).then((product) => {
        cy.serverest('PUT', `/produtos/${product._id}`, { body: buildProduct(), token: regularToken })
          .its('status')
          .should('eq', 403)
        cy.deleteProduct(product._id, adminToken)
      })
    })
  })

  context('boas práticas do JWT', () => {
    it('deve usar algoritmo de assinatura forte e expiração curta', () => {
      const { header, payload } = decodeJwt(adminToken)

      expect(header.alg, 'algoritmo').to.be.oneOf(['HS256', 'HS384', 'HS512', 'RS256', 'ES256'])
      expect(payload, 'claims').to.include.all.keys('iat', 'exp')
      expect(payload.exp - payload.iat, 'validade do token (s)').to.be.within(1, 3600)
    })

    it('[VULN-API-01] payload do JWT contém a senha do usuário em texto puro', { tags: '@known-vuln' }, () => {
      const { payload } = decodeJwt(adminToken)
      cy.confirmVulnerability(
        'VULN-API-01',
        'campo "password" presente no payload do JWT',
        payload.password === admin.password,
      )
    })
  })
})
