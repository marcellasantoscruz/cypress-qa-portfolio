const base64UrlDecode = (segment) => {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  return atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='))
}

/** Decodifica (sem validar assinatura) header e payload de um JWT, aceitando o prefixo "Bearer ". */
export const decodeJwt = (token) => {
  const [header, payload, signature] = token.replace(/^Bearer\s+/i, '').split('.')
  return {
    header: JSON.parse(base64UrlDecode(header)),
    payload: JSON.parse(base64UrlDecode(payload)),
    signature,
  }
}

const base64UrlEncode = (obj) =>
  btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

/** Monta um JWT com assinatura arbitrária (ou nenhuma) — usado para testar rejeição de tokens forjados. */
export const forgeJwt = (header, payload, signature = '') =>
  `Bearer ${base64UrlEncode(header)}.${base64UrlEncode(payload)}.${signature}`

/** Altera o último caractere da assinatura, invalidando-a. */
export const tamperSignature = (token) => {
  const last = token.slice(-1)
  return token.slice(0, -1) + (last === 'A' ? 'B' : 'A')
}
