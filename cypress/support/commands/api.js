import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { buildUser, buildProduct } from '../factories'

const ajv = addFormats(new Ajv({ allErrors: true, strict: false }))

/**
 * Wrapper de cy.request para a API ServeRest.
 * Não falha em status != 2xx: quem valida o status é o teste.
 */
Cypress.Commands.add('serverest', (method, path, { body, token, qs, headers = {} } = {}) => {
  return cy.request({
    method,
    url: `${Cypress.expose('apiUrl')}${path}`,
    body,
    qs,
    headers: token ? { Authorization: token, ...headers } : headers,
    failOnStatusCode: false,
  })
})

Cypress.Commands.add('createUser', (overrides = {}) => {
  const user = buildUser(overrides)
  return cy.serverest('POST', '/usuarios', { body: user }).then((response) => {
    expect(response.status, 'cadastro de usuário').to.eq(201)
    return { ...user, _id: response.body._id }
  })
})

Cypress.Commands.add('loginApi', ({ email, password }) => {
  return cy.serverest('POST', '/login', { body: { email, password } }).then((response) => {
    expect(response.status, 'login na API').to.eq(200)
    return response.body.authorization
  })
})

/** Cria um usuário (admin por padrão) e retorna { user, token }. */
Cypress.Commands.add('createUserAndLogin', ({ admin = true, ...overrides } = {}) => {
  return cy.createUser({ administrador: String(admin), ...overrides }).then((user) =>
    cy.loginApi(user).then((token) => ({ user, token })),
  )
})

Cypress.Commands.add('createProduct', (token, overrides = {}) => {
  const product = buildProduct(overrides)
  return cy.serverest('POST', '/produtos', { body: product, token }).then((response) => {
    expect(response.status, 'cadastro de produto').to.eq(201)
    return { ...product, _id: response.body._id }
  })
})

Cypress.Commands.add('deleteUser', (id) => cy.serverest('DELETE', `/usuarios/${id}`))

Cypress.Commands.add('deleteProduct', (id, token) => cy.serverest('DELETE', `/produtos/${id}`, { token }))

/**
 * Teste de contrato: valida o body contra um JSON Schema em cypress/fixtures/api/schemas.
 * Uso: cy.serverest('GET', '/usuarios').its('body').shouldMatchSchema('users-list')
 */
Cypress.Commands.add('shouldMatchSchema', { prevSubject: true }, (subject, schemaName) => {
  return cy.fixture(`api/schemas/${schemaName}.schema.json`).then((schema) => {
    const validate = ajv.getSchema(schema.$id) || ajv.compile(schema)
    const valid = validate(subject)
    const errors = ajv.errorsText(validate.errors, { separator: '\n' })

    expect(valid, `contrato "${schemaName}"\n${valid ? '' : errors}`).to.be.true
    return subject
  })
})
