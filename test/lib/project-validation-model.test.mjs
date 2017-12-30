import chai from 'chai'
import Ajv from 'ajv'
import ajvAsync from 'ajv-async'
import { ConfigService } from './../../lib/config.service'
import { ProjectsFile, ProjectFile, Project, ProjectRule } from '../../lib/project-model'
import { ProjectValidationModel } from '../../lib/project-validation-model'
import { Request, Header, Cookie, Response, Rule } from '../../lib/rule-model'
import { RuleValidationModel } from '../../lib/rule-validation-model'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  config
    .registerProperty('logging.level.startup', 'debug')
    .registerType(Logger, PinoLogger)

  const ruleValidationModel = new RuleValidationModel(new ConfigService({
    listEngines: () => {
      return [ 'none', 'nunjucks' ]
    }
  }))
  const projectValidationModel = new ProjectValidationModel(ruleValidationModel)

  const jsonSchemaValidator = ajvAsync(new Ajv())
  jsonSchemaValidator
    .addSchema(ruleValidationModel[Request], 'Request')
    .addSchema(ruleValidationModel[Header], 'Header')
    .addSchema(ruleValidationModel[Cookie], 'Cookie')
    .addSchema(ruleValidationModel[Response], 'Response')
    .addSchema(ruleValidationModel[Rule], 'Rule')
    .addSchema(projectValidationModel[ProjectsFile], 'ProjectsFile')
    .addSchema(projectValidationModel[ProjectFile], 'ProjectFile')
    .addSchema(projectValidationModel[ProjectRule], 'ProjectRule')
    .addSchema(projectValidationModel[Project], 'Project')

  expect(await jsonSchemaValidator.validate('ProjectFile', new ProjectFile())).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('ProjectFile', new ProjectFile('x'))).to.be.equal(true)
  expect(await jsonSchemaValidator.validate('ProjectFile', new ProjectFile('123456789012345678901234567890123456789012'))).to.be.equal(false)
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
          new Response('nunjucks', 'x')
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
          new Response('nunjucks', 'x')
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
      new Response('nunjucks', 'x')
    )
  )]))).to.be.equal(true)
}

export {
  test
}
