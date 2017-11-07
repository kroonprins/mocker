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
      'test_one_file_does_not_exist'
    ])

    const createdProject = await axios.post(`http://localhost:${availablePort}/api/projects`, {
      name: 'newProject'
    })
    expect(createdProject.status).to.be.equal(201)
    expect(createdProject.data).to.deep.equal({
      name: 'newProject'
    })
    expect(createdProject.headers['location']).to.be.equal('/api/projects/newProject/rules')

    const listProjectsAfterNewProject = await axios.get(`http://localhost:${availablePort}/api/projects`)
    expect(listProjectsAfterNewProject.status).to.be.equal(200)
    expect(listProjectsAfterNewProject.data).to.deep.equal([
      'test_one_file',
      'test_glob',
      'test_multiple_files',
      'test_multiple_glob',
      'test_glob_no_match',
      'test_file_does_not_exist',
      'test_one_file_does_not_exist',
      'newProject'
    ])

    const removedProject = await axios.delete(`http://localhost:${availablePort}/api/projects/newProject`)
    expect(removedProject.status).to.be.equal(204)
    expect(removedProject.data).to.deep.equal('')

    const listProjectsAfterRemovedProject = await axios.get(`http://localhost:${availablePort}/api/projects`)
    expect(listProjectsAfterRemovedProject.status).to.be.equal(200)
    expect(listProjectsAfterRemovedProject.data).to.deep.equal([
      'test_one_file',
      'test_glob',
      'test_multiple_files',
      'test_multiple_glob',
      'test_glob_no_match',
      'test_file_does_not_exist',
      'test_one_file_does_not_exist'
    ])

    const rules = await axios.get(`http://localhost:${availablePort}/api/projects/test_glob/rules`)
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

    const rule = await axios.get(`http://localhost:${availablePort}/api/projects/test_glob/rules/testRule1`)
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
