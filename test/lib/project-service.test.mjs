import chai from 'chai'
import { Project, ProjectRule } from './../../lib/project-model'
import { Rule, Request, Response } from './../../lib/rule-model'
import { ProjectService } from './../../lib/project-service'
import { readFileAsync } from './../../lib/util'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  ProjectService.updateProjectsFileLocation('./test/projects/tests.yaml')

  const allProjects = await ProjectService.listProjects()
  expect(allProjects.length).to.be.equal(7)
  expect(allProjects).to.deep.equal([
    'test_one_file',
    'test_glob',
    'test_multiple_files',
    'test_multiple_glob',
    'test_glob_no_match',
    'test_file_does_not_exist',
    'test_one_file_does_not_exist'])

  const listProjectRules = await ProjectService.listProjectRules('test_glob', true)
  expect(listProjectRules.length).to.be.equal(3)
  expect(listProjectRules).to.deep.equal([{
    location: './test/rules/test_rule_1.yaml',
    rule: {
      name: 'testRule1',
      request: { path: '/hello1/:id', method: 'get' }
    }
  },
  {
    location: './test/rules/test_rule_2.yaml',
    rule: {
      name: 'testRule2',
      request: { path: '/hello2', method: 'put' }
    }
  },
  {
    location: './test/rules/test_rule_3.yaml',
    rule: {
      name: 'testRule3',
      request: { path: '/hello3/:id', method: 'get' }
    }
  }])

  let exceptionThrown = false
  try {
    await ProjectService.listProjectRules('testx1')
  } catch (e) {
    expect(e.message).to.be.equal('The project with name testx1 does not exist')
    exceptionThrown = true
  }
  expect(exceptionThrown).to.be.equal(true)

  const rulesTestOneFile = await ProjectService.listProjectRules('test_one_file')
  expect(rulesTestOneFile.length).to.be.equal(1)
  expect(rulesTestOneFile[0].rule.name).to.be.equal('testRule2')

  const rulesTestGlob = await ProjectService.listProjectRules('test_glob')
  expect(rulesTestGlob.length).to.be.equal(3)
  expect(rulesTestGlob[0].rule.name).to.be.equal('testRule1')
  expect(rulesTestGlob[1].rule.name).to.be.equal('testRule2')
  expect(rulesTestGlob[2].rule.name).to.be.equal('testRule3')

  const rulesTestMultipleFiles = await ProjectService.listProjectRules('test_multiple_files')
  expect(rulesTestMultipleFiles.length).to.be.equal(2)
  expect(rulesTestMultipleFiles[0].rule.name).to.be.equal('testRule2')
  expect(rulesTestMultipleFiles[1].rule.name).to.be.equal('testRule1')

  const rulesTestMultipleGlob = await ProjectService.listProjectRules('test_multiple_glob')
  expect(rulesTestMultipleGlob.length).to.be.equal(2)
  expect(rulesTestMultipleGlob[0].rule.name).to.be.equal('testRule1')
  expect(rulesTestMultipleGlob[1].rule.name).to.be.equal('testRule2')

  const rulesTestGlobNoMatch = await ProjectService.listProjectRules('test_glob_no_match')
  expect(rulesTestGlobNoMatch.length).to.be.equal(0)

  const rulesTestFileDoesNotExist = await ProjectService.listProjectRules('test_file_does_not_exist')
  expect(rulesTestFileDoesNotExist.length).to.be.equal(0)

  const rulesTestOneFileDoesNotExist = await ProjectService.listProjectRules('test_one_file_does_not_exist')
  expect(rulesTestOneFileDoesNotExist.length).to.be.equal(1)
  expect(rulesTestOneFileDoesNotExist[0].rule.name).to.be.equal('testRule2')

  const retrieveProjectRule = await ProjectService.retrieveProjectRule('test_glob', 'testRule1')
  expect(retrieveProjectRule).to.deep.equal({
    location: './test/rules/test_rule_1.yaml',
    rule: {
      name: 'testRule1',
      request: { path: '/hello1/:id', method: 'get' },
      response:
      {
        templatingEngine: 'nunjucks',
        contentType: 'application/json',
        statusCode: '{% if req.params.id > 5 %}400{% else %}200{% endif %}',
        headers: [
          {
            name: 'X-Powered-By',
            value: 'mocker'
          },
          {
            name: 'X-positivo',
            value: 'jawohl'
          },
          {
            name: 'X-zeker',
            value: 'klahr'
          },
          {
            name: 'X-yup',
            value: '{{req.query.q}}'
          }
        ],
        cookies: [
          {
            name: 'koekske',
            value: 'jummie',
            properties: {
              secure: true
            }
          },
          {
            name: 'only',
            value: 'http',
            properties: {
              httpOnly: true
            }
          }
        ],
        body: '{\n  "respo": "Test rule 1: {{req.query.q}} / {{req.params.id}}"\n}\n'
      }
    }
  })

  const crudProjectTestFile = './test/projects/crud_test.yaml'

  ProjectService.updateProjectsFileLocation(crudProjectTestFile)
  await Promise.all([
    ProjectService.createProject('createdProject1'),
    ProjectService.createProject('createdProject2'),
    ProjectService.createProject('createdProject3')
  ])

  let exceptionThrownForAlreadyCreatedProject = false
  try {
    await ProjectService.createProject('createdProject1')
  } catch (e) {
    expect(e.message).to.be.equal('The project with name createdProject1 already exists')
    exceptionThrownForAlreadyCreatedProject = true
  }
  expect(exceptionThrownForAlreadyCreatedProject).to.be.equal(true)

  let exceptionThrownForDeletingProjectThatDoesNotExist = false
  try {
    await ProjectService.removeProject('createdProject4')
  } catch (e) {
    expect(e.message).to.be.equal('The project with name createdProject4 does not exist')
    exceptionThrownForDeletingProjectThatDoesNotExist = true
  }
  expect(exceptionThrownForDeletingProjectThatDoesNotExist).to.be.equal(true)

  await Promise.all([
    ProjectService.updateProject('createdProject1', new Project('updatedProject1')),
    ProjectService.updateProject('createdProject2', new Project('updatedProject2'))
  ])

  let exceptionThrownForUpdatingProjectThatDoesNotExist = false
  try {
    await ProjectService.removeProject('createdProject4')
  } catch (e) {
    expect(e.message).to.be.equal('The project with name createdProject4 does not exist')
    exceptionThrownForUpdatingProjectThatDoesNotExist = true
  }
  expect(exceptionThrownForUpdatingProjectThatDoesNotExist).to.be.equal(true)

  await ProjectService.createProject('createdProject1')
  const newRule = new ProjectRule(
    './test/tmp_rules/test_rule_for_created_project_1.yaml',
    new Rule(
      'test_rule 1',
      new Request(
        '/test',
        'GET'
      ),
      new Response(
        'none',
        'application/json'
      )
    ))
  await ProjectService.createProjectRule('createdProject1', newRule)

  let exceptionThrownForCreatingRuleForNonExistingProject = false
  try {
    await ProjectService.createProjectRule('createdProject4', newRule)
  } catch (e) {
    expect(e.message).to.be.equal('The project with name createdProject4 does not exist')
    exceptionThrownForCreatingRuleForNonExistingProject = true
  }
  expect(exceptionThrownForCreatingRuleForNonExistingProject).to.be.equal(true)

  let exceptionThrownForRuleAlreadyExistsWithGivenName = false
  try {
    await ProjectService.createProjectRule('createdProject1', newRule)
  } catch (e) {
    expect(e.message).to.be.equal('A rule with name \'test_rule 1\' already exists for the project with name createdProject1')
    exceptionThrownForRuleAlreadyExistsWithGivenName = true
  }
  expect(exceptionThrownForRuleAlreadyExistsWithGivenName).to.be.equal(true)

  newRule.rule.name = 'test_rule 2'
  let exceptionThrownForRuleAlreadyExistsWithGivenLocation = false
  try {
    await ProjectService.createProjectRule('createdProject1', newRule)
  } catch (e) {
    expect(e.message).to.be.equal('A rule with location \'./test/tmp_rules/test_rule_for_created_project_1.yaml\' already exists for the project with name createdProject1')
    exceptionThrownForRuleAlreadyExistsWithGivenLocation = true
  }
  expect(exceptionThrownForRuleAlreadyExistsWithGivenLocation).to.be.equal(true)

  newRule.location = './test/tmp_rules/test_rule_for_created_project_2.yaml'
  let exceptionThrownForRuleAlreadyExistsWithSamePathAndMethod = false
  try {
    await ProjectService.createProjectRule('createdProject1', newRule)
  } catch (e) {
    expect(e.message).to.be.equal('A rule with path \'/test\' and method \'GET\' already exists for the project with name createdProject1')
    exceptionThrownForRuleAlreadyExistsWithSamePathAndMethod = true
  }
  expect(exceptionThrownForRuleAlreadyExistsWithSamePathAndMethod).to.be.equal(true)

  newRule.rule.request.method = 'POST'
  await ProjectService.createProjectRule('createdProject1', newRule)

  let exceptionThrownForUpdatingRuleForNonExistingProject = false
  try {
    await ProjectService.updateProjectRule('createdProject4', newRule.rule.name, newRule)
  } catch (e) {
    expect(e.message).to.be.equal('The project with name createdProject4 does not exist')
    exceptionThrownForUpdatingRuleForNonExistingProject = true
  }
  expect(exceptionThrownForUpdatingRuleForNonExistingProject).to.be.equal(true)

  newRule.rule.name = 'test_rule 1'
  let exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenName = false
  try {
    await ProjectService.updateProjectRule('createdProject1', 'test_rule 2', newRule)
  } catch (e) {
    expect(e.message).to.be.equal('A rule with name \'test_rule 1\' already exists for the project with name createdProject1')
    exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenName = true
  }
  expect(exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenName).to.be.equal(true)

  newRule.rule.name = 'test_rule 2'
  newRule.location = './test/tmp_rules/test_rule_for_created_project_1.yaml'
  let exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenLocation = false
  try {
    await ProjectService.updateProjectRule('createdProject1', newRule.rule.name, newRule)
  } catch (e) {
    expect(e.message).to.be.equal('A rule with location \'./test/tmp_rules/test_rule_for_created_project_1.yaml\' already exists for the project with name createdProject1')
    exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenLocation = true
  }
  expect(exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenLocation).to.be.equal(true)

  newRule.location = './test/tmp_rules/test_rule_for_created_project_2.yaml'
  newRule.rule.request.method = 'GET'
  let exceptionThrownForUpdatingRuleToAlreadyExistsWithSamePathAndMethod = false
  try {
    await ProjectService.updateProjectRule('createdProject1', newRule.rule.name, newRule)
  } catch (e) {
    expect(e.message).to.be.equal('A rule with path \'/test\' and method \'GET\' already exists for the project with name createdProject1')
    exceptionThrownForUpdatingRuleToAlreadyExistsWithSamePathAndMethod = true
  }
  expect(exceptionThrownForUpdatingRuleToAlreadyExistsWithSamePathAndMethod).to.be.equal(true)

  newRule.rule.request.method = 'PUT'
  await ProjectService.updateProjectRule('createdProject1', newRule.rule.name, newRule)

  await ProjectService.removeProjectRule('createdProject1', 'test_rule 1')

  await ProjectService.createProjectRule('createdProject3', newRule)
  await ProjectService.createProjectRule('updatedProject2', newRule)

  await ProjectService.removeProjectRule('createdProject3', newRule.rule.name)

  newRule.location = './test/tmp_rules/test_rule_for_created_project_3.yaml'
  newRule.rule.name = 'test_rule 3'
  await ProjectService.updateProjectRule('createdProject1', 'test_rule 2', newRule)

  await Promise.all([
    ProjectService.removeProject('createdProject1'),
    ProjectService.removeProject('updatedProject1'),
    ProjectService.removeProject('updatedProject2'),
    ProjectService.removeProject('createdProject3')
  ])
}

export {
  test
}
