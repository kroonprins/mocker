import chai from 'chai'
import Ajv from 'ajv'
import ajvAsync from 'ajv-async'
import { ProjectsFile, ProjectFile, Project, ProjectRule } from '../../lib/project-model'
import { ProjectsFileValidationModel, ProjectFileValidationModel, ProjectRuleValidationModel, ProjectValidationModel } from '../../lib/project-validation-model'
import { Request, Response, Rule } from '../../lib/rule-model'
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
    .addSchema(ProjectsFileValidationModel, 'ProjectsFile')
    .addSchema(ProjectFileValidationModel, 'ProjectFile')
    .addSchema(ProjectRuleValidationModel, 'ProjectRule')
    .addSchema(ProjectValidationModel, 'Project')

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
  expect(await jsonSchemaValidator.validate('Project', new Project('x', [ 'y' ]))).to.be.equal(false)
  expect(await jsonSchemaValidator.validate('Project', new Project('x', [ new ProjectRule(
    'x',
    new Rule(
      'x',
      new Request('/test', 'GET'),
      new Response('nunjucks', 'x')
    )
  ) ]))).to.be.equal(true)
}

export {
  test
}
