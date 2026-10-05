import LoginPage from '../../support/pages/LoginPage'
import InventoryPage from '../../support/pages/InventoryPage'

/**
 * OWASP A01:2021 — Broken Access Control
 * Garante que rotas autenticadas do SauceDemo não são acessíveis sem sessão válida.
 */
describe('Segurança Web | Controle de acesso', { tags: ['@security', '@web'] }, () => {
  const protectedRoutes = [
    '/inventory.html',
    '/inventory-item.html',
    '/cart.html',
    '/checkout-step-one.html',
    '/checkout-step-two.html',
    '/checkout-complete.html',
  ]

  protectedRoutes.forEach((route) => {
    it(`deve bloquear acesso anônimo a ${route}`, () => {
      cy.visitSpa(route)

      cy.location('pathname').should('eq', '/')
      LoginPage.elements.error().should('contain.text', `You can only access '${route}' when you are logged in.`)
    })
  })

  it('deve impedir o retorno a páginas autenticadas após logout (botão voltar)', { tags: '@smoke' }, () => {
    cy.fixture('web/users').then(({ standard }) => {
      LoginPage.visit().login(standard.username, standard.password)
      InventoryPage.shouldBeLoaded().logout()

      cy.go('back')

      cy.location('pathname').should('eq', '/')
      LoginPage.elements.error().should('contain.text', 'when you are logged in')
    })
  })

  it('deve mascarar o campo de senha', () => {
    LoginPage.visit()
    LoginPage.elements.password().should('have.attr', 'type', 'password')
  })

  context('vulnerabilidades conhecidas', { tags: '@known-vuln' }, () => {
    // A sessão é controlada apenas por um cookie legível/gravável pelo cliente.
    // Qualquer pessoa que defina o cookie acessa a área logada sem senha.
    it('[VULN-WEB-01] sessão pode ser forjada definindo o cookie no cliente', () => {
      cy.setCookie('session-username', 'standard_user')
      cy.visitSpa('/inventory.html')

      // Aguarda o desfecho: catálogo (acesso concedido) ou erro de login (acesso negado).
      cy.get('[data-test="title"], [data-test="error"]').should('exist')
      cy.location('pathname').then((pathname) => {
        cy.confirmVulnerability('VULN-WEB-01', 'acesso à área logada sem senha via cookie forjado', pathname === '/inventory.html')
      })
    })

    it('[VULN-WEB-02] cookie de sessão não possui as flags HttpOnly e Secure', () => {
      cy.fixture('web/users').then(({ standard }) => {
        LoginPage.visit().login(standard.username, standard.password)
        InventoryPage.shouldBeLoaded()

        cy.getCookie('session-username').should('exist').then((cookie) => {
          cy.confirmVulnerability(
            'VULN-WEB-02',
            `cookie de sessão com httpOnly=${cookie.httpOnly}, secure=${cookie.secure}`,
            !cookie.httpOnly || !cookie.secure,
          )
        })
      })
    })
  })
})
