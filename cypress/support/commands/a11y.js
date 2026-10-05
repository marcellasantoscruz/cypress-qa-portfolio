/** Loga as violações do axe no terminal (visível no CI) em formato de tabela. */
const logViolations = (violations) => {
  cy.task('log', `\n[a11y] ${violations.length} violação(ões) de acessibilidade encontrada(s)`)
  cy.task(
    'table',
    violations.map(({ id, impact, description, nodes }) => ({
      regra: id,
      impacto: impact,
      descricao: description,
      elementos: nodes.length,
    })),
  )
}

/**
 * Executa o axe-core na página atual (WCAG 2.x A/AA) e falha apenas nos
 * níveis de impacto informados. Violações de todos os níveis são logadas.
 */
Cypress.Commands.add('checkAccessibility', ({ context = null, failOn = ['critical'] } = {}) => {
  cy.injectAxe()

  const options = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }

  // 1ª passada: apenas reporta tudo (skipFailures), para dar visibilidade.
  cy.checkA11y(context, options, logViolations, true)

  // 2ª passada: falha somente nos impactos bloqueantes.
  cy.checkA11y(context, { ...options, includedImpacts: failOn }, logViolations)
})
