import chai from 'chai'
import chaiExclude from 'chai-exclude'
import portastic from 'portastic'
import axios from 'axios'
import { ApiServer } from './../../lib/api-server'
import { ProjectService } from './../../lib/project-service'
import { InMemoryProjectStore } from './../../lib/project-store'
import { RuleService } from './../../lib/rule-service'
import { AppClassValidationService } from '../../lib/app-class-validation.service.mjs'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect
chai.use(chaiExclude)

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)

    let projectService = new ProjectService(
      new InMemoryProjectStore(
        './test/projects/tests_update.yaml',
        new RuleService(),
        new AppClassValidationService()
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

      let exceptionThrownBecauseProjectNameEmpty = false
      try {
        await axios.post(`http://localhost:${availablePort}/api/projects`, {
          name: ''
        })
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        expect(e.response.data).excluding('uuid').to.deep.equal({
          msg: 'Validation failed',
          code: 'validation error',
          data: {
            errors: [{
              keyword: 'type',
              dataPath: '.name',
              schemaPath: '#/properties/name/type',
              params: { type: 'string' },
              message: 'should be string'
            }]
          }
        })
        expect(e.response.data.uuid.length).is.not.equal(0)
        exceptionThrownBecauseProjectNameEmpty = true
      }
      expect(exceptionThrownBecauseProjectNameEmpty).to.be.equal(true)

      const alreadyCreatedProject = await axios.post(`http://localhost:${availablePort}/api/projects`, {
        name: 'newProject'
      })
      expect(alreadyCreatedProject.status).to.be.equal(200)
      expect(alreadyCreatedProject.data).excluding('uuid').to.deep.equal({
        error: true,
        msg: 'The project with name newProject already exists',
        code: 'project exists',
        data: {
          project: 'newProject'
        }
      })
      expect(alreadyCreatedProject.data.uuid.length).is.not.equal(0)

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

      let exceptionThrownBecauseUpdatedProjectNameEmpty = false
      try {
        await axios.put(`http://localhost:${availablePort}/api/projects/updatedProject`, {
          name: ''
        })
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        expect(e.response.data).excluding('uuid').to.deep.equal({
          msg: 'Validation failed',
          code: 'validation error',
          data: {
            errors: [{
              keyword: 'type',
              dataPath: '.name',
              schemaPath: '#/properties/name/type',
              params: { type: 'string' },
              message: 'should be string'
            }]
          }
        })
        expect(e.response.data.uuid.length).is.not.equal(0)
        exceptionThrownBecauseUpdatedProjectNameEmpty = true
      }
      expect(exceptionThrownBecauseUpdatedProjectNameEmpty).to.be.equal(true)

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

      let exceptionThrownBecauseProjectNotFound = false
      try {
        await axios.get(`http://localhost:${availablePort}/api/projects/test_nope/rules`)
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        expect(e.response.data).excluding('uuid').to.deep.equal({
          msg: 'The project with name test_nope does not exist',
          code: 'project not found',
          data: {
            project: 'test_nope'
          }
        })
        expect(e.response.data.uuid.length).is.not.equal(0)
        exceptionThrownBecauseProjectNotFound = true
      }
      expect(exceptionThrownBecauseProjectNotFound).to.be.equal(true)

      const rules = await axios.get(`http://localhost:${availablePort}/api/projects/test_glob/rules`)
      expect(rules.status).to.be.equal(200)
      expect(rules.data).to.deep.equal([{
        location: './test/rules/test_rule_1.yaml',
        rule: {
          name: 'testRule1',
          request: { path: '/hello1/:id', method: 'GET' }
        }
      },
      {
        location: './test/rules/test_rule_2.yaml',
        rule: {
          name: 'testRule2',
          request: { path: '/hello2', method: 'PUT' }
        }
      },
      {
        location: './test/rules/test_rule_3.yaml',
        rule: {
          name: 'testRule3',
          request: { path: '/hello3/:id', method: 'GET' }
        }
      }])

      let exceptionThrownBecauseRuleNotFound = false
      try {
        await axios.get(`http://localhost:${availablePort}/api/projects/test_glob/rules/testRuleNope`)
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        expect(e.response.data).excluding('uuid').to.deep.equal({
          msg: 'A rule with name \'testRuleNope\' does not exist for the project with name test_glob',
          code: 'rule not found',
          data: {
            rule: 'testRuleNope',
            project: 'test_glob'
          }
        })
        expect(e.response.data.uuid.length).is.not.equal(0)
        exceptionThrownBecauseRuleNotFound = true
      }
      expect(exceptionThrownBecauseRuleNotFound).to.be.equal(true)

      const rule = await axios.get(`http://localhost:${availablePort}/api/projects/test_glob/rules/testRule1`)
      expect(rule.status).to.be.equal(200)
      expect(rule.data).to.deep.equal({
        location: './test/rules/test_rule_1.yaml',
        rule: {
          name: 'testRule1',
          request: { path: '/hello1/:id', method: 'GET' },
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
          request: { path: '/helloTest', method: 'GET' },
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
          request: { path: '/helloTest', method: 'GET' },
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
          request: { path: '/hello1/:id', method: 'GET' }
        }
      },
      {
        location: './test/rules/test_rule_2.yaml',
        rule: {
          name: 'testRule2',
          request: { path: '/hello2', method: 'PUT' }
        }
      },
      {
        location: './test/rules/test_rule_3.yaml',
        rule: {
          name: 'testRule3',
          request: { path: '/hello3/:id', method: 'GET' }
        }
      },
      {
        location: './test/rules/created_test_rule.yaml',
        rule: {
          name: 'createdTestRule',
          request: { path: '/helloTest', method: 'GET' }
        }
      }])

      let exceptionThrownForCreateInvalidRule = false
      try {
        await axios.post(`http://localhost:${availablePort}/api/projects/test_glob/rules`, {
          location: './test/rules/created_test_rule_new_path.yaml',
          rule: {
            name: 'createdTestRule',
            request: { path: '/helloTest', method: 'GET' }
          }
        })
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        console.dir(e.response.data, { depth: 10 })
        expect(e.response.data).excluding('uuid').to.deep.equal({
          msg: 'Validation failed',
          code: 'validation error',
          data:
            {
              errors:
                [{
                  keyword: 'required',
                  dataPath: '.rule',
                  schemaPath: '#/required',
                  params: { missingProperty: 'response' },
                  message: 'should have required property \'response\''
                }]
            }
        })
        expect(e.response.data.uuid.length).is.not.equal(0)
        exceptionThrownForCreateInvalidRule = true
      }
      expect(exceptionThrownForCreateInvalidRule).to.be.equal(true)

      const alreadyCreatedRuleWithGivenName = await axios.post(`http://localhost:${availablePort}/api/projects/test_glob/rules`, {
        location: './test/rules/created_test_rule_new_path.yaml',
        rule: {
          name: 'createdTestRule',
          request: { path: '/helloTest', method: 'GET' },
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
      expect(alreadyCreatedRuleWithGivenName.status).to.be.equal(200)
      expect(alreadyCreatedRuleWithGivenName.data).excluding('uuid').to.deep.equal({
        error: true,
        msg: 'A rule with name \'createdTestRule\' already exists for the project with name test_glob',
        code: 'rule exists for given name',
        data: {
          project: 'test_glob',
          rule: 'createdTestRule'
        }
      })
      expect(alreadyCreatedRuleWithGivenName.data.uuid.length).is.not.equal(0)

      const alreadyCreatedRuleWithGivenLocation = await axios.post(`http://localhost:${availablePort}/api/projects/test_glob/rules`, {
        location: './test/rules/created_test_rule.yaml',
        rule: {
          name: 'newCreatedTestRuleWithExistingLoction',
          request: { path: '/helloTest', method: 'GET' },
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
      expect(alreadyCreatedRuleWithGivenLocation.status).to.be.equal(200)
      expect(alreadyCreatedRuleWithGivenLocation.data).excluding('uuid').to.deep.equal({
        error: true,
        msg: 'A rule with location \'./test/rules/created_test_rule.yaml\' already exists for the project with name test_glob',
        code: 'rule exists for given location',
        data: {
          project: 'test_glob',
          location: './test/rules/created_test_rule.yaml'
        }
      })
      expect(alreadyCreatedRuleWithGivenLocation.data.uuid.length).is.not.equal(0)

      const alreadyCreatedRuleWithGivenMethodAndPath = await axios.post(`http://localhost:${availablePort}/api/projects/test_glob/rules`, {
        location: './test/rules/created_test_rule_new_path.yaml',
        rule: {
          name: 'newCreatedTestRuleWithExistingLoction',
          request: { path: '/helloTest', method: 'GET' },
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
      expect(alreadyCreatedRuleWithGivenMethodAndPath.status).to.be.equal(200)
      expect(alreadyCreatedRuleWithGivenMethodAndPath.data).excluding('uuid').to.deep.equal({
        error: true,
        msg: 'A rule with path \'/helloTest\' and method \'GET\' already exists for the project with name test_glob',
        code: 'rule exists for given method and path',
        data: {
          project: 'test_glob',
          method: 'GET',
          path: '/helloTest'
        }
      })
      expect(alreadyCreatedRuleWithGivenMethodAndPath.data.uuid.length).is.not.equal(0)

      let exceptionThrownForUpdatingToInvalidRule = false
      try {
        await axios.put(`http://localhost:${availablePort}/api/projects/test_glob/rules/createdTestRule`, {
          location: './test/rules/created_test_rule_new_path.yaml',
          rule: {
            name: 'invalidUpdatedRule',
            request: { path: '/helloTest', method: 'GET' }
          }
        })
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        console.dir(e.response.data, { depth: 10 })
        expect(e.response.data).excluding('uuid').to.deep.equal({
          msg: 'Validation failed',
          code: 'validation error',
          data:
            {
              errors:
                [{
                  keyword: 'required',
                  dataPath: '.rule',
                  schemaPath: '#/required',
                  params: { missingProperty: 'response' },
                  message: 'should have required property \'response\''
                }]
            }
        })
        expect(e.response.data.uuid.length).is.not.equal(0)
        exceptionThrownForUpdatingToInvalidRule = true
      }
      expect(exceptionThrownForUpdatingToInvalidRule).to.be.equal(true)

      const updatedRule = await axios.put(`http://localhost:${availablePort}/api/projects/test_glob/rules/createdTestRule`, {
        location: './test/rules/updated_test_rule.yaml',
        rule: {
          name: 'updatedTestRule',
          request: { path: '/helloTestUpdate', method: 'GET' },
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
          request: { path: '/helloTestUpdate', method: 'GET' },
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
          request: { path: '/hello1/:id', method: 'GET' }
        }
      },
      {
        location: './test/rules/test_rule_2.yaml',
        rule: {
          name: 'testRule2',
          request: { path: '/hello2', method: 'PUT' }
        }
      },
      {
        location: './test/rules/test_rule_3.yaml',
        rule: {
          name: 'testRule3',
          request: { path: '/hello3/:id', method: 'GET' }
        }
      },
      {
        location: './test/rules/updated_test_rule.yaml',
        rule: {
          name: 'updatedTestRule',
          request: { path: '/helloTestUpdate', method: 'GET' }
        }
      }])

      let exceptionThrownForUpdateBecauseRuleNotFound = false
      try {
        await axios.put(`http://localhost:${availablePort}/api/projects/test_glob/rules/testRuleNope`, {
          location: './test/rules/updated_test_rule.yaml',
          rule: {
            name: 'updatedTestRule',
            request: { path: '/helloTestUpdate', method: 'GET' },
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
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        expect(e.response.data).excluding('uuid').to.deep.equal({
          msg: 'A rule with name \'testRuleNope\' does not exist for the project with name test_glob',
          code: 'rule not found',
          data: {
            rule: 'testRuleNope',
            project: 'test_glob'
          }
        })
        expect(e.response.data.uuid.length).is.not.equal(0)
        exceptionThrownForUpdateBecauseRuleNotFound = true
      }
      expect(exceptionThrownForUpdateBecauseRuleNotFound).to.be.equal(true)

      const removedRule = await axios.delete(`http://localhost:${availablePort}/api/projects/test_glob/rules/updatedTestRule`)
      expect(removedRule.status).to.be.equal(204)
      expect(removedRule.data).to.deep.equal('')

      const rulesAfterRemovedRule = await axios.get(`http://localhost:${availablePort}/api/projects/test_glob/rules`)
      expect(rulesAfterRemovedRule.status).to.be.equal(200)
      expect(rulesAfterRemovedRule.data).to.deep.equal([{
        location: './test/rules/test_rule_1.yaml',
        rule: {
          name: 'testRule1',
          request: { path: '/hello1/:id', method: 'GET' }
        }
      },
      {
        location: './test/rules/test_rule_2.yaml',
        rule: {
          name: 'testRule2',
          request: { path: '/hello2', method: 'PUT' }
        }
      },
      {
        location: './test/rules/test_rule_3.yaml',
        rule: {
          name: 'testRule3',
          request: { path: '/hello3/:id', method: 'GET' }
        }
      }])

      let exceptionThrownForDeleteBecauseRuleNotFound = false
      try {
        await axios.delete(`http://localhost:${availablePort}/api/projects/test_glob/rules/testRuleNope`)
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        expect(e.response.data).excluding('uuid').to.deep.equal({
          msg: 'A rule with name \'testRuleNope\' does not exist for the project with name test_glob',
          code: 'rule not found',
          data: {
            rule: 'testRuleNope',
            project: 'test_glob'
          }
        })
        expect(e.response.data.uuid.length).is.not.equal(0)
        exceptionThrownForDeleteBecauseRuleNotFound = true
      }
      expect(exceptionThrownForDeleteBecauseRuleNotFound).to.be.equal(true)
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
