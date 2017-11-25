import chai from 'chai'
import Ajv from 'ajv'
import ajvAsync from 'ajv-async'
import { Request, Header, Cookie } from '../../lib/rule-model'
import { RequestValidationModel, HeaderValidationModel, CookieValidationModel } from '../../lib/rule-validation-model'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  const jsonSchemaValidator = ajvAsync(new Ajv())
  jsonSchemaValidator
    .addSchema(RequestValidationModel, 'Request')
    .addSchema(HeaderValidationModel, 'Header')
    .addSchema(CookieValidationModel, 'Cookie')

  expect(await jsonSchemaValidator.validate('Request', new Request())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Request', new Request(null, 'GET'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Request', new Request(null, 'GET'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Request', new Request('test', 'GET'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Request', new Request('/test', 'NOPE'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Request', new Request('/test', 'GET'))).to.be.equal(true)
  const req = new Request('/test', 'GET')
  req['bla'] = 'a'
  expect(await jsonSchemaValidator.validate('Request', req)).to.be.equal(false)

  expect(await jsonSchemaValidator.validate('Header', new Header())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Header', new Header(null, 'value'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Header', new Header('X-test', 'value'))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Header', new Header('X-test', ''))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Header', new Header('X-test', null))).to.be.equal(true)
  const header = new Header('X-test', 'value')
  header['bla'] = 'a'
  expect(await jsonSchemaValidator.validate('Header', header)).to.be.equal(false)

  expect(await jsonSchemaValidator.validate('Cookie', new Cookie())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Cookie', new Cookie(null, 'value'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Cookie', new Cookie('cook', 'value'))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Cookie', new Cookie('cook', ''))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Cookie', new Cookie('cook', null))).to.be.equal(true)
  const cookie = new Cookie('cook', 'value')
  cookie['bla'] = 'a'
  expect(await jsonSchemaValidator.validate('Cookie', cookie)).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Cookie', new Cookie('cook', 'value', {
    domain: 'x',
    encode: 'x',
    expires: 'x',
    httpOnly: true,
    maxAge: 900,
    path: 'x',
    secure: true,
    signed: true,
    sameSite: true
  }))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Cookie', new Cookie('cook', 'value', {
    x: 'x'
  }))).to.be.equal(false)

  // TODO Response, Rule
}

export {
  test
}
