class LoginPage {
  elements = {
    username: () => cy.get('[data-test="username"]'),
    password: () => cy.get('[data-test="password"]'),
    loginButton: () => cy.get('[data-test="login-button"]'),
    error: () => cy.get('[data-test="error"]'),
  }

  visit() {
    cy.visit('/')
    return this
  }

  fillCredentials(username, password) {
    if (username) this.elements.username().type(username, { log: false })
    if (password) this.elements.password().type(password, { log: false })
    return this
  }

  submit() {
    this.elements.loginButton().click()
    return this
  }

  login(username, password) {
    return this.fillCredentials(username, password).submit()
  }

  shouldShowError(message) {
    this.elements.error().should('be.visible').and('have.text', message)
    return this
  }
}

export default new LoginPage()
