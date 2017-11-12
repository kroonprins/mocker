import chai from 'chai'
import portastic from 'portastic'
import axios from 'axios'
import { ApiServer } from './../../lib/api-server'
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
        './test/projects/tests_update.yaml',
        new RuleService()
      ))

    const availablePort = (await portastic.find({
      min: 20000,
      max: 30000,
      retrieve: 1
    }))[0]

    const apiServer = new ApiServer(availablePort, 'localhost', projectService)
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

      const updatedProject = await axios.put(`http://localhost:${availablePort}/api/projects/newProject`, {
        name: 'updatedProject'
      })
      expect(updatedProject.status).to.be.equal(200)
      expect(updatedProject.data).to.deep.equal({
        name: 'updatedProject'
      })

      const listProjectsAfterUpdateProject = await axios.get(`http://localhost:${availablePort}/api/projects`)
      expect(listProjectsAfterUpdateProject.status).to.be.equal(200)
      expect(listProjectsAfterUpdateProject.data).to.deep.equal([
        'test_one_file',
        'test_glob',
        'test_multiple_files',
        'test_multiple_glob',
        'test_glob_no_match',
        'test_file_does_not_exist',
        'test_one_file_does_not_exist',
        'updatedProject'
      ])

      const removedProject = await axios.delete(`http://localhost:${availablePort}/api/projects/updatedProject`)
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

      const createdRule = await axios.post(`http://localhost:${availablePort}/api/projects/test_glob/rules`, {
        location: './test/rules/created_test_rule.yaml',
        rule: {
          name: 'createdTestRule',
          request: { path: '/helloTest', method: 'get' },
          response:
          {
            templatingEngine: 'nunjucks',
            contentType: 'text/plain',
            statusCode: 400,
            headers: [
              {
                name: 'X-one',
                value: 'one'
              },
              {
                name: 'X-two',
                value: 'two'
              }
            ],
            cookies: [
              {
                name: 'cookie',
                value: 'monster',
                properties: {
                  httpOnly: true,
                  path: '/helloTest'
                }
              }
            ],
            body: 'Rule created'
          }
        }
      })
      expect(createdRule.status).to.be.equal(201)
      expect(createdRule.data).to.deep.equal({
        location: './test/rules/created_test_rule.yaml',
        rule: {
          name: 'createdTestRule',
          request: { path: '/helloTest', method: 'get' },
          response:
          {
            templatingEngine: 'nunjucks',
            contentType: 'text/plain',
            statusCode: 400,
            headers: [
              {
                name: 'X-one',
                value: 'one'
              },
              {
                name: 'X-two',
                value: 'two'
              }
            ],
            cookies: [
              {
                name: 'cookie',
                value: 'monster',
                properties: {
                  httpOnly: true,
                  path: '/helloTest'
                }
              }
            ],
            body: 'Rule created'
          }
        }
      })
      expect(createdRule.headers['location']).to.be.equal('/api/projects/test_glob/rules/createdTestRule')

      const rulesAfterNewRule = await axios.get(`http://localhost:${availablePort}/api/projects/test_glob/rules`)
      expect(rulesAfterNewRule.status).to.be.equal(200)
      expect(rulesAfterNewRule.data).to.deep.equal([{
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
      },
      {
        location: './test/rules/created_test_rule.yaml',
        rule: {
          name: 'createdTestRule',
          request: { path: '/helloTest', method: 'get' }
        }
      }])

      const updatedRule = await axios.put(`http://localhost:${availablePort}/api/projects/test_glob/rules/createdTestRule`, {
        location: './test/rules/updated_test_rule.yaml',
        rule: {
          name: 'updatedTestRule',
          request: { path: '/helloTestUpdate', method: 'get' },
          response:
          {
            templatingEngine: 'none',
            contentType: 'text/plain',
            statusCode: 400,
            headers: [
              {
                name: 'X-one',
                value: 'one'
              }
            ],
            cookies: [],
            body: 'Rule updated'
          }
        }
      })
      expect(updatedRule.status).to.be.equal(200)
      expect(updatedRule.data).to.deep.equal({
        location: './test/rules/updated_test_rule.yaml',
        rule: {
          name: 'updatedTestRule',
          request: { path: '/helloTestUpdate', method: 'get' },
          response:
          {
            templatingEngine: 'none',
            contentType: 'text/plain',
            statusCode: 400,
            headers: [
              {
                name: 'X-one',
                value: 'one'
              }
            ],
            cookies: [],
            body: 'Rule updated'
          }
        }
      })

      const rulesAfterUpdatedRule = await axios.get(`http://localhost:${availablePort}/api/projects/test_glob/rules`)
      expect(rulesAfterUpdatedRule.status).to.be.equal(200)
      expect(rulesAfterUpdatedRule.data).to.deep.equal([{
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
      },
      {
        location: './test/rules/updated_test_rule.yaml',
        rule: {
          name: 'updatedTestRule',
          request: { path: '/helloTestUpdate', method: 'get' }
        }
      }])

      const removedRule = await axios.delete(`http://localhost:${availablePort}/api/projects/test_glob/rules/updatedTestRule`)
      expect(removedRule.status).to.be.equal(204)
      expect(removedRule.data).to.deep.equal('')

      const rulesAfterRemovedRule = await axios.get(`http://localhost:${availablePort}/api/projects/test_glob/rules`)
      expect(rulesAfterRemovedRule.status).to.be.equal(200)
      expect(rulesAfterRemovedRule.data).to.deep.equal([{
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
    } finally {
      apiServer.stop()
    }
  } finally {
    config.reset()
  }
}

export {
  test
}
