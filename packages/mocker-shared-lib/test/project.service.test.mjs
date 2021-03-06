import chai from 'chai'
import path from 'path'
import { initialize as setDefaultConfig } from '../src/config-default.mjs'
import { FixedLatency, RandomLatency } from '../src/latency-model.mjs'
import { Project, ProjectRule } from '../src/project-model.mjs'
import { Rule, Request, Response, Header, Cookie } from '../src/rule-model.mjs'
import { ProjectService } from '../src/project.service.mjs'
import { InMemoryProjectStore } from '../src/project.store.mjs'
import { RuleService } from '../src/rule.service.mjs'
import { AppClassValidationService } from '../src/app-class-validation.service.mjs'
import { rimrafAsync, copyFileAsync, moveFileAsync } from '../src/fs-util.mjs'
import { Logger, PinoLogger } from '../src/logging.mjs'
import { config } from '../src/config.mjs'
const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  const temporaryRulesCreatedDuringTestsPath = '../tmp_rules'
  const crudProjectTestFile = './test/resources/projects/crud_test.yaml'
  const crudProjectTestFileBackup = `${crudProjectTestFile}.ori`

  try {
    config
      .registerProperty('logging.level.startup', 'info')
      .registerType(Logger, PinoLogger)
      .registerProperty('project.location', 'test/resources/projects/tests.yaml')

    setDefaultConfig()

    let projectService = config.getInstance(ProjectService)

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
    expect(allProjects.test_glob.rules.length).to.be.equal(3)
    expect(allProjects.test_glob.rules[1]).to.deep.equal(new ProjectRule(
      path.normalize('../rules/test_rule_2.yaml'), new Rule(
        'testRule2',
        new Request('/hello2', 'PUT'),
        new Response(
          'nunjucks',
          new FixedLatency(2000),
          undefined,
          'application/json',
          200,
          [],
          [],
          '{\n  "respo": "Test rule 2: {{req.body.input}}"\n}\n'
        ),
        undefined
      )
    ))

    const listProjectRules = await projectService.listProjectRules('test_glob', true)
    expect(listProjectRules.length).to.be.equal(3)
    expect(listProjectRules[0]).to.deep.equal(new ProjectRule(
      path.normalize('../rules/test_rule_1.yaml'), new Rule(
        'testRule1',
        new Request('/hello1/:id', 'GET'),
        new Response(
          'nunjucks',
          undefined,
          undefined,
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
      path.normalize('../rules/test_rule_2.yaml'), new Rule(
        'testRule2',
        new Request('/hello2', 'PUT'),
        new Response(
          'nunjucks',
          new FixedLatency(2000),
          undefined,
          'application/json',
          200,
          [],
          [],
          '{\n  "respo": "Test rule 2: {{req.body.input}}"\n}\n'
        ),
        undefined
      )
    ))
    expect(listProjectRules[2]).to.deep.equal(new ProjectRule(
      path.normalize('../rules/test_rule_3.yaml'), new Rule(
        'testRule3',
        new Request('/hello3/:id', 'GET'),
        new Response(
          'none',
          undefined,
          new RandomLatency(1000, 3000),
          'application/json',
          200,
          [
            new Header('X-yup', '{{req.query.q}}')
          ],
          [],
          '{\n  "respo": "Test rule 3: {{req.query.q}} / {{req.params.id}}"\n}\n'
        ),
        undefined
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
    expect(retrieveProjectRule).to.deep.equal(new ProjectRule(
      path.normalize('../rules/test_rule_1.yaml'),
      new Rule(
        'testRule1',
        new Request(
          '/hello1/:id',
          'GET'
        ),
        new Response(
          'nunjucks',
          undefined,
          undefined,
          'application/json',
          '{% if req.params.id > 5 %}400{% else %}200{% endif %}',
          [
            new Header('X-Powered-By', 'mocker'),
            new Header('X-positivo', 'jawohl'),
            new Header('X-zeker', 'klahr'),
            new Header('X-yup', '{{req.query.q}}')
          ],
          [
            new Cookie('koekske', 'jummie', {
              secure: true
            }),
            new Cookie('only', 'http', {
              httpOnly: true
            })
          ],
          '{\n  "respo": "Test rule 1: {{req.query.q}} / {{req.params.id}}"\n}\n'
        )
      )
    ))

    let exceptionThrownForNonExistingRule = false
    try {
      await projectService.retrieveProjectRule('test_glob', 'testRuleNope')
    } catch (e) {
      expect(e.message).to.be.equal('A rule with name \'testRuleNope\' does not exist for the project with name test_glob')
      exceptionThrownForNonExistingRule = true
    }
    expect(exceptionThrownForNonExistingRule).to.be.equal(true)

    // make backup of original file
    await copyFileAsync(crudProjectTestFile, crudProjectTestFileBackup)

    projectService = new ProjectService(
      new InMemoryProjectStore(
        crudProjectTestFile,
        undefined,
        new RuleService(),
        new AppClassValidationService()
      ))

    const createdProjects = await Promise.all([
      projectService.createProject('createdProject1'),
      projectService.createProject('createdProject2'),
      projectService.createProject('createdProject3')
    ])
    expect(createdProjects[0].name).to.be.equal('createdProject1')
    expect(createdProjects[1].name).to.be.equal('createdProject2')
    expect(createdProjects[2].name).to.be.equal('createdProject3')

    let exceptionThrownForEmptyProjectName = false
    try {
      await projectService.createProject('')
    } catch (e) {
      expect(e.message).to.be.equal('Validation failed')
      exceptionThrownForEmptyProjectName = true
    }
    expect(exceptionThrownForEmptyProjectName).to.be.equal(true)

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

    let exceptionThrownForUpdatingProjectToEmptyName = false
    try {
      await projectService.updateProject('updatedProject1', new Project(''))
    } catch (e) {
      expect(e.message).to.be.equal('Validation failed')
      exceptionThrownForUpdatingProjectToEmptyName = true
    }
    expect(exceptionThrownForUpdatingProjectToEmptyName).to.be.equal(true)

    let exceptionThrownForUpdatingProjectThatDoesNotExist = false
    try {
      await projectService.updateProject('createdProject4', new Project('x'))
    } catch (e) {
      expect(e.message).to.be.equal('The project with name createdProject4 does not exist')
      exceptionThrownForUpdatingProjectThatDoesNotExist = true
    }
    expect(exceptionThrownForUpdatingProjectThatDoesNotExist).to.be.equal(true)

    let exceptionThrownForUpdatingProjectToNameThatIsAlreadyUsedByOtherProject = false
    try {
      await projectService.updateProject('updatedProject1', new Project('updatedProject2'))
    } catch (e) {
      expect(e.message).to.be.equal('The project with name updatedProject2 already exists')
      exceptionThrownForUpdatingProjectToNameThatIsAlreadyUsedByOtherProject = true
    }
    expect(exceptionThrownForUpdatingProjectToNameThatIsAlreadyUsedByOtherProject).to.be.equal(true)

    await projectService.createProject('createdProject1')
    const newRule = new ProjectRule(
      `${temporaryRulesCreatedDuringTestsPath}/test_rule_for_created_project_1.yaml`,
      new Rule(
        'test_rule 1',
        new Request(
          '/test',
          'GET'
        ),
        new Response(
          'none',
          undefined,
          undefined,
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

    let exceptionThrownForCreatingInvalidRule = false
    try {
      await projectService.createProjectRule('createdProject1', new ProjectRule())
    } catch (e) {
      expect(e.code).to.be.equal('validation error')
      exceptionThrownForCreatingInvalidRule = true
    }
    expect(exceptionThrownForCreatingInvalidRule).to.be.equal(true)

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
      expect(e.message).to.be.equal(`A rule with location '${temporaryRulesCreatedDuringTestsPath}/test_rule_for_created_project_1.yaml' already exists for the project with name createdProject1`)
      exceptionThrownForRuleAlreadyExistsWithGivenLocation = true
    }
    expect(exceptionThrownForRuleAlreadyExistsWithGivenLocation).to.be.equal(true)

    newRule.location = `${temporaryRulesCreatedDuringTestsPath}/test_rule_for_created_project_2.yaml`
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

    let exceptionThrownForUpdatingNonExistingRule = false
    try {
      await projectService.updateProjectRule('createdProject1', 'testRuleNope', newRule)
    } catch (e) {
      expect(e.message).to.be.equal('A rule with name \'testRuleNope\' does not exist for the project with name createdProject1')
      exceptionThrownForUpdatingNonExistingRule = true
    }
    expect(exceptionThrownForUpdatingNonExistingRule).to.be.equal(true)

    let exceptionThrownForUpdatingToInvalidRule = false
    try {
      await projectService.updateProjectRule('createdProject1', 'test_rule 2', new ProjectRule())
    } catch (e) {
      expect(e.code).to.be.equal('validation error')
      exceptionThrownForUpdatingToInvalidRule = true
    }
    expect(exceptionThrownForUpdatingToInvalidRule).to.be.equal(true)

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
    newRule.location = `${temporaryRulesCreatedDuringTestsPath}/test_rule_for_created_project_1.yaml`
    let exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenLocation = false
    try {
      await projectService.updateProjectRule('createdProject1', newRule.rule.name, newRule)
    } catch (e) {
      expect(e.message).to.be.equal(`A rule with location '${temporaryRulesCreatedDuringTestsPath}/test_rule_for_created_project_1.yaml' already exists for the project with name createdProject1`)
      exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenLocation = true
    }
    expect(exceptionThrownForUpdatingRuleToAlreadyExistsWithGivenLocation).to.be.equal(true)

    newRule.location = `${temporaryRulesCreatedDuringTestsPath}/test_rule_for_created_project_2.yaml`
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

    newRule.location = `${temporaryRulesCreatedDuringTestsPath}/test_rule_for_created_project_3.yaml`
    newRule.rule.name = 'test_rule 3'
    await projectService.updateProjectRule('createdProject1', 'test_rule 2', newRule)

    let exceptionThrownForDeletingNonExistingRule = false
    try {
      await projectService.removeProjectRule('createdProject1', 'testRuleNope', newRule)
    } catch (e) {
      expect(e.message).to.be.equal('A rule with name \'testRuleNope\' does not exist for the project with name createdProject1')
      exceptionThrownForDeletingNonExistingRule = true
    }
    expect(exceptionThrownForDeletingNonExistingRule).to.be.equal(true)

    // TODO is there a way that can actually be checked that the file content is correct (considering that the writes to the file are async)?

    await Promise.all([
      projectService.removeProject('createdProject1'),
      projectService.removeProject('updatedProject1'),
      projectService.removeProject('updatedProject2'),
      projectService.removeProject('createdProject3')
    ])

    // TODO because of the "isLoading" stuff in the project-store this results in an unhandled rejection instead of something that can be caught
    // let exceptionThrownForInvalidProjectFile = false
    // try {
    //   const invalidProjectTestFile = './test/projects/invalid_test.yaml'
    //   projectService = new ProjectService(
    //     new InMemoryProjectStore(
    //       invalidProjectTestFile,
    //       './test/rules',
    //       new RuleService(),
    //       new AppClassValidationService()
    //     ))
    // } catch (e) {
    //   exceptionThrownForInvalidProjectFile = true
    // }
    // expect(exceptionThrownForInvalidProjectFile).to.be.equal(true)

    // let exceptionThrownForInvalidProjectFile2 = false
    // try {
    //   const invalidProjectTestFile = './test/projects/invalid_test_2.yaml'
    //   projectService = new ProjectService(
    //     new InMemoryProjectStore(
    //       invalidProjectTestFile,
    //       './test/rules',
    //       new RuleService(),
    //       new AppClassValidationService()
    //     ))
    // } catch (e) {
    //   console.dir(e, { depth: 10 })
    //   exceptionThrownForInvalidProjectFile2 = true
    // }
    // expect(exceptionThrownForInvalidProjectFile2).to.be.equal(true)
  } finally {
    config.reset()

    try {
      await rimrafAsync(temporaryRulesCreatedDuringTestsPath)
    } catch (e) {
      console.log(`Error cleaning up ${temporaryRulesCreatedDuringTestsPath}`, e)
    }

    try {
      await moveFileAsync(crudProjectTestFileBackup, crudProjectTestFile)
    } catch (e) {
      console.log(`Error restoring backup ${crudProjectTestFileBackup} to ${crudProjectTestFile}`, e)
    }
  }
}

export {
  test
}
