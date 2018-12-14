import chai from 'chai'
import Ajv from 'ajv'
import ajvAsync from 'ajv-async'
import { ConfigService } from '../src/config.service'
import { LatencyValidationModel } from '../src/latency-validation-model.mjs'
import { FixedLatency, RandomLatency } from '../src/latency-model.mjs'
import { ProjectsFile, ProjectFile, Project, ProjectRule } from '../src/project-model'
import { ProjectValidationModel } from '../src/project-validation-model'
import { Request, Header, Cookie, Response, ConditionalResponse, ConditionalResponseValue, Rule } from '../src/rule-model'
import { RuleValidationModel } from '../src/rule-validation-model'
import { Logger, PinoLogger } from '../src/logging'
import { config } from '../src/config'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  config
    .registerProperty('logging.level.startup', 'info')
    .registerType(Logger, PinoLogger)

  const latencyValidationModel = new LatencyValidationModel()
  const ruleValidationModel = new RuleValidationModel(new ConfigService(), latencyValidationModel)
  const projectValidationModel = new ProjectValidationModel(ruleValidationModel)

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
    .addSchema(projectValidationModel[ProjectsFile], 'ProjectsFile')
    .addSchema(projectValidationModel[ProjectFile], 'ProjectFile')
    .addSchema(projectValidationModel[ProjectRule], 'ProjectRule')
    .addSchema(projectValidationModel[Project], 'Project')

  expect(await jsonSchemaValidator.validate('ProjectFile', new ProjectFile())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('ProjectFile', new ProjectFile('x'))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('ProjectFile', new ProjectFile('12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('ProjectFile', new ProjectFile('x', 'y'))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('ProjectFile', new ProjectFile('x', ['y']))).to.be.equal(true)

  expect(await jsonSchemaValidator.validate('ProjectsFile', new ProjectsFile())).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('ProjectsFile', new ProjectsFile(null))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('ProjectsFile', new ProjectsFile([]))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('ProjectsFile', new ProjectsFile(['x']))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('ProjectsFile', new ProjectsFile([new ProjectFile('x')]))).to.be.equal(true)

  expect(await jsonSchemaValidator.validate('ProjectRule', new ProjectRule())).to.be.equal(false)
  expect(
    await jsonSchemaValidator.validate(
      'ProjectRule',
      new ProjectRule(
        null,
        new Rule(
          'x',
          new Request('/test', 'GET'),
          new Response('nunjucks', undefined, undefined, 'x')
        )
      )
    )
  ).to.be.equal(false)
  expect(
    await jsonSchemaValidator.validate(
      'ProjectRule',
      new ProjectRule(
        'x',
        new Rule(
          'x',
          new Request('/test', 'GET'),
          new Response('nunjucks', undefined, undefined, 'x')
        )
      )
    )
  ).to.be.equal(true)

  expect(await jsonSchemaValidator.validate('Project', new Project())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Project', new Project('x'))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Project', new Project('x', []))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('Project', new Project('x', ['y']))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Project', new Project('x', [new ProjectRule(
    'x',
    new Rule(
      'x',
      new Request('/test', 'GET'),
      new Response('nunjucks', undefined, undefined, 'x')
    )
  )]))).to.be.equal(true)
}

export {
  test
}
