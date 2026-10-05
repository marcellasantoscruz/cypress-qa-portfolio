import { faker } from '@faker-js/faker'

const uniqueSuffix = () => `${Date.now()}${faker.string.alphanumeric(5).toLowerCase()}`

export const buildUser = (overrides = {}) => ({
  nome: faker.person.fullName(),
  email: `qa.${uniqueSuffix()}@qa.com`,
  password: faker.internet.password({ length: 12 }),
  administrador: 'false',
  ...overrides,
})

export const buildProduct = (overrides = {}) => ({
  nome: `${faker.commerce.productName()} ${uniqueSuffix()}`,
  preco: faker.number.int({ min: 1, max: 5000 }),
  descricao: faker.commerce.productDescription().slice(0, 100),
  quantidade: faker.number.int({ min: 1, max: 500 }),
  ...overrides,
})

export const buildCheckoutInfo = (overrides = {}) => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  postalCode: faker.location.zipCode('#####-###'),
  ...overrides,
})
