import chai from 'chai'
import portastic from 'portastic'
import axios from 'axios'
import { config } from './../../lib/config'
import { ApiServer } from './../../lib/api-server'
import { ProjectService } from './../../lib/project-service'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  ProjectService.updateProjectsFileLocation('./test/projects/tests.yaml')

  const availablePort = (await portastic.find({
    min: 20000,
    max: 30000,
    retrieve: 1
  }))[0]

  const apiServer = new ApiServer(availablePort)
  try {
    await apiServer.start()

    const listProjects = await axios.get(`http://localhost:${availablePort}/api/projects`)
    expect(listProjects.status).to.be.equal(200)
    expect(listProjects.data).to.deep.equal([
      'test_one_file',
      'test_glob',
      'test_multiple_files',
      'test_multiple_glob',
      'test_glob_no_match',
      'test_file_does_not_exist',
      'test_one_file_does_not_exist'])

    const rules = await axios.get(`http://localhost:${availablePort}/api/rules/test_glob`)
    expect(rules.status).to.be.equal(200)
    expect(rules.data).to.deep.equal([{
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

    const rule = await axios.get(`http://localhost:${availablePort}/api/rules/test_glob/testRule1`)
    expect(rule.status).to.be.equal(200)
    expect(rule.data).to.deep.equal({
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
  } finally {
    apiServer.stop()
  }
}

export {
  test
}
