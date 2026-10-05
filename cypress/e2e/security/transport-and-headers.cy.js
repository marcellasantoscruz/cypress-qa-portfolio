/**
 * OWASP A02:2021 (Cryptographic Failures) e A05:2021 (Security Misconfiguration).
 * Verifica HTTPS obrigatório e audita headers de segurança dos dois alvos.
 * O relatório de cada alvo é salvo em cypress/reports/security/*.json.
 */
describe('Segurança | Transporte e headers HTTP', { tags: '@security' }, () => {
  const webUrl = Cypress.config('baseUrl')
  const apiUrl = Cypress.expose('apiUrl')

  context('SauceDemo (web)', { tags: '@web' }, () => {
    it('deve redirecionar HTTP para HTTPS com 301', { tags: '@smoke' }, () => {
      cy.request({ url: webUrl.replace('https://', 'http://'), followRedirect: false }).then((response) => {
        expect(response.status).to.eq(301)
        expect(response.redirectedToUrl).to.match(/^https:\/\//)
      })
    })

    it('deve gerar relatório de auditoria de headers de segurança', () => {
      cy.auditSecurityHeaders(webUrl, 'saucedemo').then((report) => {
        expect(report.disclosed, 'headers que expõem tecnologia').to.be.empty
      })
    })

    context('vulnerabilidades conhecidas', { tags: '@known-vuln' }, () => {
      it('[VULN-WEB-03] não envia Content-Security-Policy (mitigação de XSS)', () => {
        cy.request(webUrl).then(({ headers }) => {
          cy.confirmVulnerability('VULN-WEB-03', 'header Content-Security-Policy ausente', !headers['content-security-policy'])
        })
      })

      it('[VULN-WEB-04] não possui proteção contra clickjacking', () => {
        cy.request(webUrl).then(({ headers }) => {
          const csp = headers['content-security-policy'] || ''
          const protectedAgainstFraming = Boolean(headers['x-frame-options']) || csp.includes('frame-ancestors')
          cy.confirmVulnerability('VULN-WEB-04', 'sem X-Frame-Options nem CSP frame-ancestors', !protectedAgainstFraming)
        })
      })

      it('[VULN-WEB-05] não envia Strict-Transport-Security (HSTS)', () => {
        cy.request(webUrl).then(({ headers }) => {
          cy.confirmVulnerability('VULN-WEB-05', 'header Strict-Transport-Security ausente', !headers['strict-transport-security'])
        })
      })
    })
  })

  context('ServeRest (API)', { tags: '@api' }, () => {
    it('deve enviar os headers de segurança essenciais', { tags: '@smoke' }, () => {
      cy.request(`${apiUrl}/produtos`).its('headers').then((headers) => {
        expect(headers['x-content-type-options']).to.eq('nosniff')
        expect(headers['x-frame-options']).to.match(/^(DENY|SAMEORIGIN)$/i)
        expect(headers['strict-transport-security']).to.match(/max-age=\d+/)
      })
    })

    it('não deve expor tecnologia do servidor (X-Powered-By)', () => {
      cy.request(`${apiUrl}/produtos`).then(({ headers }) => expect(headers).not.to.have.property('x-powered-by'))
    })

    it('deve gerar relatório de auditoria de headers de segurança', () => {
      cy.auditSecurityHeaders(`${apiUrl}/produtos`, 'serverest')
    })
  })
})
