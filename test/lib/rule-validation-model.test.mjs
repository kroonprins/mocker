import chai from 'chai'
import Ajv from 'ajv'
import ajvAsync from 'ajv-async'
import { Request, Header, Cookie, Response, Rule } from '../../lib/rule-model'
import { RequestValidationModel, HeaderValidationModel, CookieValidationModel, ResponseValidationModel, RuleValidationModel } from '../../lib/rule-validation-model'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  const jsonSchemaValidator = ajvAsync(new Ajv())
  jsonSchemaValidator
    .addSchema(RequestValidationModel, 'Request')
    .addSchema(HeaderValidationModel, 'Header')
    .addSchema(CookieValidationModel, 'Cookie')
    .addSchema(ResponseValidationModel, 'Response')
    .addSchema(RuleValidationModel, 'Rule')

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

  expect(await jsonSchemaValidator.validate('Response', new Response())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Response', new Response(null, 'x'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Response', new Response('x', 'x'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x'))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', null))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x', '200'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x', 500))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x', 500, [ 'header' ]))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x', 500, [ new Header('header', 'value') ]))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x', 500, [ new Header('header', 'value') ], [ 'cookie' ]))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x', 500, [ new Header('header', 'value') ], [ new Cookie('cookie', 'value') ]))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x', 500, [ new Header('header', 'value') ], [ new Cookie('cookie', 'value', { 'x': 'y' }) ]))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x', 500, [ new Header('header', 'value') ], [ new Cookie('cookie', 'value', { 'httpOnly': true }) ]))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x', 500, [ new Header('header', 'value') ], [ new Cookie('cookie', 'value') ], null))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x', 500, [ new Header('header', 'value') ], [ new Cookie('cookie', 'value') ], 'text'))).to.be.equal(true)

  expect(await jsonSchemaValidator.validate('Rule', new Rule())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule(null, new Request('/test', 'GET'), new Response('nunjucks', 'x')))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), new Response('nunjucks', 'x')))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('123456789012345678901234567890123456789011', new Request('/test', 'GET'), new Response('nunjucks', 'x')))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', 'x', new Response('nunjucks', 'x')))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), 'x'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('test', 'GET'), new Response('nunjucks', 'x')))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), new Response('x', 'x')))).to.be.equal(false)
}

export {
  test
}
