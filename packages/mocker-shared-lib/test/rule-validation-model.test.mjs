import chai from 'chai'
import Ajv from 'ajv'
import ajvAsync from 'ajv-async'
import { ConfigService } from '../src/config.service'
import { Request, Header, Cookie, Response, ConditionalResponse, ConditionalResponseValue, Rule } from '../src/rule-model'
import { RuleValidationModel } from '../src/rule-validation-model'
import { LatencyValidationModel } from '../src/latency-validation-model.mjs'
import { FixedLatency, RandomLatency } from '../src/latency-model.mjs'
import { Logger, PinoLogger } from '../src/logging'
import { config } from '../src/config'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  config
    .registerProperty('logging.level.startup', 'debug')
    .registerType(Logger, PinoLogger)

  const latencyValidationModel = new LatencyValidationModel()
  const ruleValidationModel = new RuleValidationModel(new ConfigService({
    listEngines: () => {
      return [ 'none', 'nunjucks' ]
    }
  }), latencyValidationModel)

  const jsonSchemaValidator = ajvAsync(new Ajv())
  jsonSchemaValidator
    .addSchema(latencyValidationModel[FixedLatency], 'FixedLatency')
    .addSchema(latencyValidationModel[RandomLatency], 'RandomLatency')
    .addSchema(ruleValidationModel[Request], 'Request')
    .addSchema(ruleValidationModel[Header], 'Header')
    .addSchema(ruleValidationModel[Cookie], 'Cookie')
    .addSchema(ruleValidationModel[Response], 'Response')
    .addSchema(ruleValidationModel[ConditionalResponse], 'ConditionalResponse')
    .addSchema(ruleValidationModel[ConditionalResponseValue], 'ConditionalResponseValue')
    .addSchema(ruleValidationModel[Rule], 'Rule')

  expect(await jsonSchemaValidator.validate('Request', new Request())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Request', new Request(null, 'GET'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Request', new Request(null, 'GET'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Request', new Request('test', 'GET'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Request', new Request('/test', 'NOPE'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Request', new Request('/test', 'GET'))).to.be.equal(true)

  expect(await jsonSchemaValidator.validate('Header', new Header())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Header', new Header(null, 'value'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Header', new Header('X-test', 'value'))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Header', new Header('X-test', ''))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Header', new Header('X-test', null))).to.be.equal(true)

  expect(await jsonSchemaValidator.validate('Cookie', new Cookie())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Cookie', new Cookie(null, 'value'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Cookie', new Cookie('cook', 'value'))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Cookie', new Cookie('cook', ''))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Cookie', new Cookie('cook', null))).to.be.equal(true)
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
  expect(await jsonSchemaValidator.validate('Response', new Response('nunjucks', 'x', [ '200' ]))).to.be.equal(false)
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
  expect(await jsonSchemaValidator.validate('Rule', new Rule('12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901', new Request('/test', 'GET'), new Response('nunjucks', 'x')))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', 'x', new Response('nunjucks', 'x')))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), 'x'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('test', 'GET'), new Response('nunjucks', 'x')))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), new Response('x', 'x')))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), new Response('nunjucks', 'x'), undefined, new FixedLatency(1)))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), new Response('nunjucks', 'x'), undefined, undefined, new RandomLatency(1)))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), new Response('nunjucks', 'x'), undefined, undefined, new RandomLatency(1, 2)))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), undefined, 'x'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), undefined, new ConditionalResponse()))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), undefined, new ConditionalResponse('nunjucks', 'x')))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), undefined, new ConditionalResponse('nunjucks', [ new ConditionalResponseValue(true, 'x') ])))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), undefined, new ConditionalResponse('nunjucks', [ new ConditionalResponseValue(true, 'x'), 'x' ])))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), undefined, new ConditionalResponse('nunjucks', [ new ConditionalResponseValue(true, 'x'), new ConditionalResponseValue(true, 'x') ])))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), undefined, new ConditionalResponse('nunjucks', [])))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Rule', new Rule('x', new Request('/test', 'GET'), new Response('nunjucks', 'x'), new ConditionalResponse('nunjucks', [ new ConditionalResponseValue(true, 'x') ])))).to.be.equal(false)
}

export {
  test
}
