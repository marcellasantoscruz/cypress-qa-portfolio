# Achados de segurança

Vulnerabilidades identificadas pelas suites de segurança nos sites-alvo (ambientes públicos **feitos para prática de testes**).
Cada achado tem um **teste de caracterização** com a tag `@known-vuln`, feito com o comando `cy.confirmVulnerability()`:

- **Passa** enquanto a vulnerabilidade continuar reproduzível e registra `[VULN-XXX] CONFIRMADA` no log da execução.
- **Falha** se a vulnerabilidade deixar de existir, com a mensagem *"foi corrigida no alvo — converta em teste de regressão"*. Nesse caso, reescreva o teste afirmando o comportamento seguro.

Execução isolada: `npm run test:known-vulns`. No CI eles rodam junto com a suíte de segurança.

> Todos os testes são **não destrutivos**: nenhum payload altera dados de terceiros, não há força bruta nem carga elevada. Os dados criados na API são removidos ao final de cada spec.

| ID | Alvo | Achado | OWASP | Severidade |
|----|------|--------|-------|------------|
| VULN-WEB-01 | SauceDemo | Sessão forjável via cookie no cliente | A01:2021 / A07:2021 | Alta |
| VULN-WEB-02 | SauceDemo | Cookie de sessão sem `HttpOnly` e `Secure` | A05:2021 | Média |
| VULN-WEB-03 | SauceDemo | Ausência de `Content-Security-Policy` | A05:2021 | Média |
| VULN-WEB-04 | SauceDemo | Sem proteção contra clickjacking | A05:2021 | Média |
| VULN-WEB-05 | SauceDemo | Ausência de HSTS | A02:2021 | Baixa |
| VULN-API-01 | ServeRest | Senha em texto puro no payload do JWT | API2:2023 / A02:2021 | Alta |
| VULN-API-02 | ServeRest | `GET /usuarios` retorna senhas de todos os usuários | API3:2023 | Crítica |

---

### VULN-WEB-01 — Sessão forjável via cookie
**Teste:** `cypress/e2e/security/web-access-control.cy.js`

A autenticação é controlada apenas pelo cookie `session-username`, criado via JavaScript. Basta definir `session-username=standard_user` para acessar `/inventory.html` sem senha.

**Recomendação:** sessão emitida e validada no servidor, com token opaco/assinado e não previsível.

### VULN-WEB-02 — Cookie de sessão sem `HttpOnly`/`Secure`
**Teste:** `cypress/e2e/security/web-access-control.cy.js`

O cookie de sessão é acessível por JavaScript (roubo via XSS) e pode trafegar sem TLS.

**Recomendação:** `Set-Cookie: ...; HttpOnly; Secure; SameSite=Lax`.

### VULN-WEB-03/04/05 — Headers de segurança ausentes
**Teste:** `cypress/e2e/security/transport-and-headers.cy.js` · relatório em `cypress/reports/security/saucedemo-headers.json`

Nenhum dos 6 headers recomendados pelo OWASP Secure Headers Project é enviado (CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). O redirecionamento HTTP → HTTPS (301) **está** correto.

**Recomendação:** configurar os headers na CDN/proxy. Ex.: `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'` e `Strict-Transport-Security: max-age=31536000; includeSubDomains`.

### VULN-API-01 — Senha dentro do JWT
**Teste:** `cypress/e2e/security/api-authentication.cy.js`

O payload do token (apenas codificado em Base64, não criptografado) contém `email` **e `password`** em texto puro. Qualquer log, proxy ou extensão que capture o header `Authorization` obtém a senha.

**Recomendação:** incluir apenas identificadores (`sub`, `iat`, `exp`, papéis) no JWT.

### VULN-API-02 — Exposição de senhas na listagem de usuários
**Teste:** `cypress/e2e/security/api-input-validation.cy.js`

`GET /usuarios` (rota **sem autenticação**) retorna o campo `password` de todos os usuários.

**Recomendação:** nunca retornar senhas; armazená-las com hash forte (bcrypt/argon2); exigir autenticação e autorização na listagem.

---

## Controles verificados com sucesso

Os testes abaixo **passam** e protegem contra regressões:

- **Web:** bloqueio de acesso anônimo a 6 rotas protegidas; logout invalida o histórico; payloads XSS não executam (login e checkout); SQL Injection não autentica; HTTP → HTTPS 301; campo de senha mascarado.
- **API:** 401 sem token, com token malformado, com assinatura adulterada, com `alg: none` e de usuário excluído; 403 para usuário comum em rotas de admin; JWT com HS256 e expiração ≤ 1h; rejeição de operadores NoSQL e SQLi; proteção contra mass assignment (`_id`, `role`, `isAdmin`); JSON malformado sem stack trace; validação do ID no path; headers `nosniff`, `X-Frame-Options`, HSTS e ausência de `X-Powered-By`.

## Observações (informativas)

- **ServeRest** não envia `Content-Security-Policy`, `Referrer-Policy` e `Permissions-Policy` (baixo impacto para uma API JSON) e usa `Access-Control-Allow-Origin: *` — aceitável para API pública sem cookies.
