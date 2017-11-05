import chai from 'chai'
import { ProjectService } from './../../lib/project-service'
import { config } from './../../lib/config'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  config.projectsFileLocation = './test/projects/tests.yaml'

  let exceptionThrown = false
  try {
    await ProjectService.getRules('testx1')
  } catch (e) {
    exceptionThrown = true
  }
  expect(exceptionThrown).to.be.equal(true)

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

  const listRules = await ProjectService.listRules('test_glob')
  expect(listRules.length).to.be.equal(3)
  expect(listRules).to.deep.equal([{
    name: 'testRule1',
    request: { path: '/hello1/:id', method: 'get' }
  },
  {
    name: 'testRule2',
    request: { path: '/hello2', method: 'put' }
  },
  {
    name: 'testRule3',
    request: { path: '/hello3/:id', method: 'get' }
  }])

  const retrieveRule = await ProjectService.retrieveRule('test_glob', 'testRule1')
  expect(retrieveRule).to.deep.equal({
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
  })

  const rulesTestOneFile = await ProjectService.getRules('test_one_file')
  expect(rulesTestOneFile.length).to.be.equal(1)
  expect(rulesTestOneFile[0].name).to.be.equal('testRule2')

  const rulesTestGlob = await ProjectService.getRules('test_glob')
  expect(rulesTestGlob.length).to.be.equal(3)
  expect(rulesTestGlob[0].name).to.be.equal('testRule1')
  expect(rulesTestGlob[1].name).to.be.equal('testRule2')
  expect(rulesTestGlob[2].name).to.be.equal('testRule3')

  const rulesTestMultipleFiles = await ProjectService.getRules('test_multiple_files')
  expect(rulesTestMultipleFiles.length).to.be.equal(2)
  expect(rulesTestMultipleFiles[0].name).to.be.equal('testRule2')
  expect(rulesTestMultipleFiles[1].name).to.be.equal('testRule1')

  const rulesTestMultipleGlob = await ProjectService.getRules('test_multiple_glob')
  expect(rulesTestMultipleGlob.length).to.be.equal(2)
  expect(rulesTestMultipleGlob[0].name).to.be.equal('testRule1')
  expect(rulesTestMultipleGlob[1].name).to.be.equal('testRule2')

  const rulesTestGlobNoMatch = await ProjectService.getRules('test_glob_no_match')
  expect(rulesTestGlobNoMatch.length).to.be.equal(0)

  const rulesTestFileDoesNotExist = await ProjectService.getRules('test_file_does_not_exist')
  expect(rulesTestFileDoesNotExist.length).to.be.equal(0)

  const rulesTestOneFileDoesNotExist = await ProjectService.getRules('test_one_file_does_not_exist')
  expect(rulesTestOneFileDoesNotExist.length).to.be.equal(1)
  expect(rulesTestOneFileDoesNotExist[0].name).to.be.equal('testRule2')
}

test()
