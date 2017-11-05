import chai from 'chai'
import { ProjectService } from './../../lib/project-service'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  ProjectService.updateProjectsFileLocation('./test/projects/tests.yaml')

  const allProjects = await ProjectService.listAllProjects()
  expect(allProjects.length).to.be.equal(7)
  expect(allProjects).to.deep.equal([
    'test_one_file',
    'test_glob',
    'test_multiple_files',
    'test_multiple_glob',
    'test_glob_no_match',
    'test_file_does_not_exist',
    'test_one_file_does_not_exist'])

  const listRules = await ProjectService.listRules('test_glob', true)
  expect(listRules.length).to.be.equal(3)
  expect(listRules).to.deep.equal([{
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
    await ProjectService.listRules('testx1')
  } catch (e) {
    expect(e.message).to.be.equal('The project with name testx1 does not exist')
    exceptionThrown = true
  }
  expect(exceptionThrown).to.be.equal(true)

  const rulesTestOneFile = await ProjectService.listRules('test_one_file')
  expect(rulesTestOneFile.length).to.be.equal(1)
  expect(rulesTestOneFile[0].rule.name).to.be.equal('testRule2')

  const rulesTestGlob = await ProjectService.listRules('test_glob')
  expect(rulesTestGlob.length).to.be.equal(3)
  expect(rulesTestGlob[0].rule.name).to.be.equal('testRule1')
  expect(rulesTestGlob[1].rule.name).to.be.equal('testRule2')
  expect(rulesTestGlob[2].rule.name).to.be.equal('testRule3')

  const rulesTestMultipleFiles = await ProjectService.listRules('test_multiple_files')
  expect(rulesTestMultipleFiles.length).to.be.equal(2)
  expect(rulesTestMultipleFiles[0].rule.name).to.be.equal('testRule2')
  expect(rulesTestMultipleFiles[1].rule.name).to.be.equal('testRule1')

  const rulesTestMultipleGlob = await ProjectService.listRules('test_multiple_glob')
  expect(rulesTestMultipleGlob.length).to.be.equal(2)
  expect(rulesTestMultipleGlob[0].rule.name).to.be.equal('testRule1')
  expect(rulesTestMultipleGlob[1].rule.name).to.be.equal('testRule2')

  const rulesTestGlobNoMatch = await ProjectService.listRules('test_glob_no_match')
  expect(rulesTestGlobNoMatch.length).to.be.equal(0)

  const rulesTestFileDoesNotExist = await ProjectService.listRules('test_file_does_not_exist')
  expect(rulesTestFileDoesNotExist.length).to.be.equal(0)

  const rulesTestOneFileDoesNotExist = await ProjectService.listRules('test_one_file_does_not_exist')
  expect(rulesTestOneFileDoesNotExist.length).to.be.equal(1)
  expect(rulesTestOneFileDoesNotExist[0].rule.name).to.be.equal('testRule2')

  const retrieveRule = await ProjectService.retrieveRule('test_glob', 'testRule1')
  expect(retrieveRule).to.deep.equal({
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
    ProjectService.removeProject('createdProject1'),
    ProjectService.removeProject('createdProject2'),
    ProjectService.removeProject('createdProject3')
  ])
}

export {
  test
}
