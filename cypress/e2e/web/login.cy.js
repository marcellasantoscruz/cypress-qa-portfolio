import LoginPage from '../../support/pages/LoginPage'
import InventoryPage from '../../support/pages/InventoryPage'

describe('Web | Login', { tags: ['@web', '@regression'] }, () => {
  let users
  let messages

  before(() => {
    cy.fixture('web/users').then((data) => (users = data))
    cy.fixture('web/messages').then((data) => (messages = data))
  })

  beforeEach(() => {
    LoginPage.visit()
  })

  it('deve autenticar um usuário válido e exibir o catálogo', { tags: '@smoke' }, () => {
    LoginPage.login(users.standard.username, users.standard.password)
    InventoryPage.shouldBeLoaded()
  })

  it('deve bloquear o acesso de um usuário travado', () => {
    LoginPage.login(users.locked.username, users.locked.password).shouldShowError(messages.lockedOut)
    cy.location('pathname').should('eq', '/')
  })

  it('deve rejeitar credenciais inválidas', () => {
    LoginPage.login(users.invalid.username, users.invalid.password).shouldShowError(messages.invalidCredentials)
  })

  context('validação de campos obrigatórios', () => {
    const scenarios = [
      { title: 'sem usuário', username: '', password: 'secret_sauce', error: 'usernameRequired' },
      { title: 'sem senha', username: 'standard_user', password: '', error: 'passwordRequired' },
      { title: 'formulário vazio', username: '', password: '', error: 'usernameRequired' },
    ]

    scenarios.forEach(({ title, username, password, error }) => {
      it(`deve exibir erro ao submeter ${title}`, () => {
        LoginPage.login(username, password).shouldShowError(messages[error])
      })
    })
  })

  it('deve encerrar a sessão ao fazer logout', { tags: '@smoke' }, () => {
    LoginPage.login(users.standard.username, users.standard.password)
    InventoryPage.logout()

    cy.location('pathname').should('eq', '/')
    cy.getCookie('session-username').should('be.null')
  })
})
