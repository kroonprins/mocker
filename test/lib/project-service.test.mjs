import chai from 'chai'
import { Project, ProjectRule } from './../../lib/project-model'
import { Rule, Request, Response, Header, Cookie } from './../../lib/rule-model'
import { ProjectService } from './../../lib/project-service'
import { InMemoryProjectStore } from './../../lib/project-store'
import { RuleService } from './../../lib/rule-service'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'
const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)

    let projectService = new ProjectService(
      new InMemoryProjectStore(
        './test/projects/tests.yaml',
        new RuleService()
      ))

    const allProjects = await projectService.listProjects()
    expect(Object.keys(allProjects).length).to.be.equal(7)
    expect(Object.keys(allProjects)).to.deep.equal([
      'test_one_file',
      'test_glob',
      'test_multiple_files',
      'test_multiple_glob',
      'test_glob_no_match',
      'test_file_does_not_exist',
      'test_one_file_does_not_exist'])
    expect(allProjects['test_glob'].rules.length).to.be.equal(3)
    expect(allProjects['test_glob'].rules[1]).to.deep.equal(new ProjectRule(
      './test/rules/test_rule_2.yaml', new Rule(
        'testRule2',
        new Request('/hello2', 'put'),
        new Response(
          'nunjucks',
          'application/json',
          '200',
          [],
          [],
          '{\n  "respo": "Test rule 2: {{req.body.input}}"\n}\n'
        )
      )
    ))

    const listProjectRules = await projectService.listProjectRules('test_glob', true)
    expect(listProjectRules.length).to.be.equal(3)
    expect(listProjectRules[0]).to.deep.equal(new ProjectRule(
      './test/rules/test_rule_1.yaml', new Rule(
        'testRule1',
        new Request('/hello1/:id', 'get'),
        new Response(
          'nunjucks',
          'application/json',
          '{% if req.params.id > 5 %}400{% else %}200{% endif %}',
          [
            new Header('X-Powered-By', 'mocker'),
            new Header('X-positivo', 'jawohl'),
            new Header('X-zeker', 'klahr'),
            new Header('X-yup', '{{req.query.q}}')
          ],
          [
            new Cookie('koekske', 'jummie', { secure: true }),
            new Cookie('only', 'http', { httpOnly: true })
          ],
          '{\n  "respo": "Test rule 1: {{req.query.q}} / {{req.params.id}}"\n}\n'
        )
      )
    ))
    expect(listProjectRules[1]).to.deep.equal(new ProjectRule(
      './test/rules/test_rule_2.yaml', new Rule(
        'testRule2',
        new Request('/hello2', 'put'),
        new Response(
          'nunjucks',
          'application/json',
          '200',
          [],
          [],
          '{\n  "respo": "Test rule 2: {{req.body.input}}"\n}\n'
        )
      )
    ))
    expect(listProjectRules[2]).to.deep.equal(new ProjectRule(
      './test/rules/test_rule_3.yaml', new Rule(
        'testRule3',
        new Request('/hello3/:id', 'get'),
        new Response(
          'none',
          'application/json',
          '200',
          [
            new Header('X-yup', '{{req.query.q}}')
          ],
          [],
          '{\n  "respo": "Test rule 3: {{req.query.q}} / {{req.params.id}}"\n}\n'
        )
      )
    ))

    let exceptionThrown = false
    try {
      await projectService.listProjectRules('testx1')
    } catch (e) {
      expect(e.message).to.be.equal('The project with name testx1 does not exist')
      exceptionThrown = true
    }
    expect(exceptionThrown).to.be.equal(true)

    const rulesTestOneFile = await projectService.listProjectRules('test_one_file')
    expect(rulesTestOneFile.length).to.be.equal(1)
    expect(rulesTestOneFile[0].rule.name).to.be.equal('testRule2')

    const rulesTestGlob = await projectService.listProjectRules('test_glob')
    expect(rulesTestGlob.length).to.be.equal(3)
    expect(rulesTestGlob[0].rule.name).to.be.equal('testRule1')
    expect(rulesTestGlob[1].rule.name).to.be.equal('testRule2')
    expect(rulesTestGlob[2].rule.name).to.be.equal('testRule3')

    const rulesTestMultipleFiles = await projectService.listProjectRules('test_multiple_files')
    expect(rulesTestMultipleFiles.length).to.be.equal(2)
    expect(rulesTestMultipleFiles[0].rule.name).to.be.equal('testRule2')
    expect(rulesTestMultipleFiles[1].rule.name).to.be.equal('testRule1')

    const rulesTestMultipleGlob = await projectService.listProjectRules('test_multiple_glob')
    expect(rulesTestMultipleGlob.length).to.be.equal(2)
    expect(rulesTestMultipleGlob[0].rule.name).to.be.equal('testRule1')
    expect(rulesTestMultipleGlob[1].rule.name).to.be.equal('testRule2')

    const rulesTestGlobNoMatch = await projectService.listProjectRules('test_glob_no_match')
    expect(rulesTestGlobNoMatch.length).to.be.equal(0)

    const rulesTestFileDoesNotExist = await projectService.listProjectRules('test_file_does_not_exist')
    expect(rulesTestFileDoesNotExist.length).to.be.equal(0)

    const rulesTestOneFileDoesNotExist = await projectService.listProjectRules('test_one_file_does_not_exist')
    expect(rulesTestOneFileDoesNotExist.length).to.be.equal(1)
    expect(rulesTestOneFileDoesNotExist[0].rule.name).to.be.equal('testRule2')

    const retrieveProjectRule = await projectService.retrieveProjectRule('test_glob', 'testRule1')
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
    projectService = new ProjectService(
      new InMemoryProjectStore(
        crudProjectTestFile,
        new RuleService()
      ))

    const createdProjects = await Promise.all([
      projectService.createProject('createdProject1'),
      projectService.createProject('createdProject2'),
      projectService.createProject('createdProject3')
    ])
    expect(createdProjects[0].name).to.be.equal('createdProject1')
    expect(createdProjects[1].name).to.be.equal('createdProject2')
    expect(createdProjects[2].name).to.be.equal('createdProject3')

    let exceptionThrownForAlreadyCreatedProject = false
    try {
      await projectService.createProject('createdProject1')
    } catch (e) {
      expect(e.message).to.be.equal('The project with name createdProject1 already exists')
      exceptionThrownForAlreadyCreatedProject = true
    }
    expect(exceptionThrownForAlreadyCreatedProject).to.be.equal(true)

    let exceptionThrownForDeletingProjectThatDoesNotExist = false
    try {
      await projectService.removeProject('createdProject4')
    } catch (e) {
      expect(e.message).to.be.equal('The project with name createdProject4 does not exist')
      exceptionThrownForDeletingProjectThatDoesNotExist = true
    }
    expect(exceptionThrownForDeletingProjectThatDoesNotExist).to.be.equal(true)

    await Promise.all([
      projectService.updateProject('createdProject1', new Project('updatedProject1')),
      projectService.updateProject('createdProject2', new Project('updatedProject2'))
    ])

    let exceptionThrownForUpdatingProjectThatDoesNotExist = false
    try {
      await projectService.removeProject('createdProject4')
    } catch (e) {
      expect(e.message).to.be.equal('The project with name createdProject4 does not exist')
      exceptionThrownForUpdatingProjectThatDoesNotExist = true
    }
    expect(exceptionThrownForUpdatingProjectThatDoesNotExist).to.be.equal(true)

    await projectService.createProject('createdProject1')
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
    await projectService.createProjectRule('createdProject1', newRule)

    let exceptionThrownForCreatingRuleForNonExistingProject = false
    try {
      await projectService.createProjectRule('createdProject4', newRule)
    } catch (e) {
      expect(e.message).to.be.equal('The project with name createdProject4 does not exist')
      exceptionThrownForCreatingRuleForNonExistingProject = true
    }
    expect(exceptionThrownForCreatingRuleForNonExistingProject).to.be.equal(true)

    let exceptionThrownForRuleAlreadyExistsWithGivenName = false
    try {
      await projectService.createProjectRule('createdProject1', newRule)
    } catch (e) {
      expect(e.message).to.be.equal('A rule with name \'test_rule 1\' already exists for the project with name createdProject1')
      exceptionThrownForRuleAlreadyExistsWithGivenName = true
    }
    expect(exceptionThrownForRuleAlreadyExistsWithGivenName).to.be.equal(true)

    newRule.rule.name = 'test_rule 2'
    let exceptionThrownForRuleAlreadyExistsWithGivenLocation = false
    try {
      await projectService.createProjectRule('createdProject1', newRule)
    } catch (e) {
      expect(e.message).to.be.equal('A rule with location \'./test/tmp_rules/test_rule_for_created_project_1.yaml\' already exists for the project with name createdProject1')
      exceptionThrownForRuleAlreadyExistsWithGivenLocation = true
    }
    expect(exceptionThrownForRuleAlreadyExistsWithGivenLocation).to.be.equal(true)

    newRule.location = './test/tmp_rules/test_rule_for_created_project_2.yaml'
    let exceptionThrownForRuleAlreadyExistsWithSamePathAndMethod = false
    try {
      await projectService.createProjectRule('createdProject1', newRule)
    } catch (e) {
      expect(e.message).to.be.equal('A rule with path \'/test\' and method \'GET\' already exists for the project with name createdProject1')
      exceptionThrownForRuleAlreadyExistsWithSamePathAndMethod = true
    }
    expect(exceptionThrownForRuleAlreadyExistsWithSamePathAndMethod).to.be.equal(true)

    newRule.rule.request.method = 'POST'
    await projectService.createProjectRule('createdProject1', newRule)

    let exceptionThrownForUpdatingRuleForNonExistingProject = false
    try {
      await projectService.updateProjectRule('createdProject4', newRule.rule.name, newRule)
    } catch (e) {
      expect(e.message).to.be.equal('The project with name createdProject4 does not exist')
      exceptionThrownForUpdatingRuleForNonExistingProject = true
    }
    expect(exceptionThrownForUpdatingRuleForNonExistingProject).to.be.equal(true)

    newRule.rule.name = 'test_rule 1'
    let exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenName = false
    try {
      await projectService.updateProjectRule('createdProject1', 'test_rule 2', newRule)
    } catch (e) {
      expect(e.message).to.be.equal('A rule with name \'test_rule 1\' already exists for the project with name createdProject1')
      exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenName = true
    }
    expect(exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenName).to.be.equal(true)

    newRule.rule.name = 'test_rule 2'
    newRule.location = './test/tmp_rules/test_rule_for_created_project_1.yaml'
    let exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenLocation = false
    try {
      await projectService.updateProjectRule('createdProject1', newRule.rule.name, newRule)
    } catch (e) {
      expect(e.message).to.be.equal('A rule with location \'./test/tmp_rules/test_rule_for_created_project_1.yaml\' already exists for the project with name createdProject1')
      exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenLocation = true
    }
    expect(exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenLocation).to.be.equal(true)

    newRule.location = './test/tmp_rules/test_rule_for_created_project_2.yaml'
    newRule.rule.request.method = 'GET'
    let exceptionThrownForUpdatingRuleToAlreadyExistsWithSamePathAndMethod = false
    try {
      await projectService.updateProjectRule('createdProject1', newRule.rule.name, newRule)
    } catch (e) {
      expect(e.message).to.be.equal('A rule with path \'/test\' and method \'GET\' already exists for the project with name createdProject1')
      exceptionThrownForUpdatingRuleToAlreadyExistsWithSamePathAndMethod = true
    }
    expect(exceptionThrownForUpdatingRuleToAlreadyExistsWithSamePathAndMethod).to.be.equal(true)

    newRule.rule.request.method = 'PUT'
    await projectService.updateProjectRule('createdProject1', newRule.rule.name, newRule)

    await projectService.removeProjectRule('createdProject1', 'test_rule 1')

    await projectService.createProjectRule('createdProject3', newRule)
    await projectService.createProjectRule('updatedProject2', newRule)

    await projectService.removeProjectRule('createdProject3', newRule.rule.name)

    newRule.location = './test/tmp_rules/test_rule_for_created_project_3.yaml'
    newRule.rule.name = 'test_rule 3'
    await projectService.updateProjectRule('createdProject1', 'test_rule 2', newRule)

    // TODO is there a way that can actually be checked that the file content is correct (considering that the writes to the file are async)?

    await Promise.all([
      projectService.removeProject('createdProject1'),
      projectService.removeProject('updatedProject1'),
      projectService.removeProject('updatedProject2'),
      projectService.removeProject('createdProject3')
    ])
  } finally {
    config.reset()
  }
}

export {
  test
}
