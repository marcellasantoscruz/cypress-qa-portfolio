/**
 * Headers de segurança recomendados (OWASP Secure Headers Project).
 * `expected` descreve o valor aceitável; ausência = achado no relatório.
 */
export const RECOMMENDED_HEADERS = [
  { name: 'strict-transport-security', expected: /max-age=\d+/ },
  { name: 'content-security-policy', expected: /.+/ },
  { name: 'x-content-type-options', expected: /^nosniff$/i },
  { name: 'x-frame-options', expected: /^(deny|sameorigin)$/i },
  { name: 'referrer-policy', expected: /.+/ },
  { name: 'permissions-policy', expected: /.+/ },
]

/** Headers que não deveriam vazar detalhes de tecnologia/versão. */
export const DISCLOSURE_HEADERS = ['x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version']

/**
 * Faz uma requisição ao alvo, compara os headers com a lista recomendada
 * e grava um relatório JSON em cypress/reports/security/<name>-headers.json.
 * Retorna { url, present, missing, disclosed }.
 */
Cypress.Commands.add('auditSecurityHeaders', (url, name) => {
  return cy.request({ url, failOnStatusCode: false }).then(({ headers }) => {
    const present = []
    const missing = []

    RECOMMENDED_HEADERS.forEach(({ name: header, expected }) => {
      const value = headers[header]
      if (value && expected.test(String(value))) present.push({ header, value: String(value) })
      else missing.push({ header, value: value ? String(value) : '(ausente)' })
    })

    const disclosed = DISCLOSURE_HEADERS.filter((header) => headers[header]).map((header) => ({
      header,
      value: String(headers[header]),
    }))

    const report = { url, auditedAt: new Date().toISOString(), present, missing, disclosed }

    cy.writeFile(`cypress/reports/security/${name}-headers.json`, report, { log: false })
    cy.task('log', `\n[header-audit] ${url} — ${present.length} ok, ${missing.length} ausentes/inválidos`)
    if (missing.length) cy.task('table', missing)

    return cy.wrap(report, { log: false })
  })
})

/** Verifica que nenhum payload de XSS foi executado na janela da aplicação. */
Cypress.Commands.add('shouldNotHaveExecutedXss', () => {
  cy.window().then((win) => {
    expect(win.__xssTriggered, 'payload XSS executado').to.be.undefined
  })
  cy.get('@alert').should('not.have.been.called')
})

/**
 * Instala o "sensor" de XSS (stub de window.alert) antes de a página carregar.
 * Os payloads também tentam definir window.__xssTriggered. Chamar antes do cy.visit.
 */
Cypress.Commands.add('armXssSensors', () => {
  cy.on('window:before:load', (win) => {
    cy.stub(win, 'alert').as('alert')
  })
})

/**
 * Teste de caracterização para vulnerabilidades conhecidas (tag @known-vuln).
 * Passa enquanto a vulnerabilidade continuar reproduzível — documentando-a como evidência.
 * Se a vulnerabilidade for corrigida no alvo, o teste falha avisando que deve virar
 * um teste de regressão comum (afirmando o comportamento seguro).
 */
Cypress.Commands.add('confirmVulnerability', (id, description, isVulnerable) => {
  cy.task('log', `[${id}] ${isVulnerable ? 'CONFIRMADA' : 'NÃO REPRODUZIDA'} — ${description}`)
  expect(
    isVulnerable,
    `${id} ainda presente (se falhar: foi corrigida no alvo — converta em teste de regressão)`,
  ).to.be.true
})
