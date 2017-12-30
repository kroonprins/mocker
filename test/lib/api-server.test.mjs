import chai from 'chai'
import chaiExclude from 'chai-exclude'
import portastic from 'portastic'
import axios from 'axios'
import { ApiServer } from './../../lib/api-server'
import { ProjectService } from './../../lib/project-service'
import { InMemoryProjectStore } from './../../lib/project-store'
import { RuleService } from './../../lib/rule-service'
import { AppClassValidationService } from '../../lib/app-class-validation.service.mjs'
import { LearningModeService } from './../../lib/learning-mode.service'
import { LearningModeDbService } from './../../lib/learning-mode.db.service'
import { ServerService, InMemoryServerStore, LearningModeServerTypes } from './../../lib/server.service'
import { RecordedRequest } from './../../lib/learning-mode.model'
import { TemplatingService } from './../../lib/templating-service'
import { NunjucksTemplatingHelpers } from './../../lib/templating-helpers.nunjucks'
import { NunjucksTemplatingService } from './../../lib/templating-service.nunjucks'
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
        './test/rules',
        new RuleService(),
        new AppClassValidationService()
      ))

    let learningModeDbService = new LearningModeDbService('./test/tmp/test2.db')
    let learningModeService = new LearningModeService(learningModeDbService)

    const serverService = new ServerService(new InMemoryServerStore())

    const availablePorts = (await portastic.find({
      min: 20000,
      max: 30000,
      retrieve: 3
    }))

    const availablePort = availablePorts[0]

    const apiServer = new ApiServer(availablePort, 'localhost', projectService, learningModeService, serverService)
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

      const recordedRequestsEmpty = await axios.get(`http://localhost:${availablePort}/api/learning-mode/test_project/recorded-requests`)
      expect(recordedRequestsEmpty.status).to.be.equal(200)
      expect(recordedRequestsEmpty.data.length).to.be.equal(0)

      const timestamp = new Date()
      await learningModeService.saveRecordedRequest(new RecordedRequest(undefined, 'test_project', timestamp))
      await learningModeService.saveRecordedRequest(new RecordedRequest(undefined, 'test_project', timestamp))

      const recordedRequests = await axios.get(`http://localhost:${availablePort}/api/learning-mode/test_project/recorded-requests`)
      expect(recordedRequests.status).to.be.equal(200)
      expect(recordedRequests.data.length).to.be.equal(2)
      expect(recordedRequests.data[0]).excluding('_id').to.deep.equal({ timestamp: timestamp.getTime() })

      const id = recordedRequests.data[0]['_id']
      const recordedRequest = await axios.get(`http://localhost:${availablePort}/api/learning-mode/test_project/recorded-requests/${id}`)
      expect(recordedRequest.status).to.be.equal(200)
      expect(recordedRequest.data).excluding('_id').to.deep.equal({ project: 'test_project', timestamp: timestamp.getTime() })

      let exceptionThrownForRetrieveBecauseRecordedRequestNotFound = false
      try {
        await await axios.get(`http://localhost:${availablePort}/api/learning-mode/test_project/recorded-requests/x`)
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        expect(e.response.data).excluding('uuid').to.deep.equal({
          msg: 'The recorded request with id x does not exist',
          code: 'recorded request not found',
          data: { id: 'x' }
        })
        expect(e.response.data.uuid.length).is.not.equal(0)
        exceptionThrownForRetrieveBecauseRecordedRequestNotFound = true
      }
      expect(exceptionThrownForRetrieveBecauseRecordedRequestNotFound).to.be.equal(true)

      const removedRequest = await axios.delete(`http://localhost:${availablePort}/api/learning-mode/test_project/recorded-requests/${id}`)
      expect(removedRequest.status).to.be.equal(204)
      expect(removedRequest.data).to.be.equal('')

      let exceptionThrownForDeleteBecauseRecordedRequestNotFound = false
      try {
        await axios.delete(`http://localhost:${availablePort}/api/learning-mode/test_project/recorded-requests/x`)
      } catch (e) {
        expect(e.response.status).to.be.equal(400)
        expect(e.response.data).excluding('uuid').to.deep.equal({
          msg: 'Trying to delete recorded request with id x which does not exist',
          code: 'recorded request not found',
          data: { id: 'x' }
        })
        expect(e.response.data.uuid.length).is.not.equal(0)
        exceptionThrownForDeleteBecauseRecordedRequestNotFound = true
      }
      expect(exceptionThrownForDeleteBecauseRecordedRequestNotFound).to.be.equal(true)

      const recordedRequestsAfterDelete = await axios.get(`http://localhost:${availablePort}/api/learning-mode/test_project/recorded-requests`)
      expect(recordedRequestsAfterDelete.status).to.be.equal(200)
      expect(recordedRequestsAfterDelete.data.length).to.be.equal(1)

      const removedAllRequest = await axios.delete(`http://localhost:${availablePort}/api/learning-mode/test_project/recorded-requests`)
      expect(removedAllRequest.status).to.be.equal(204)
      expect(removedAllRequest.data).to.be.equal('')

      const recordedRequestsAfterDeleteAll = await axios.get(`http://localhost:${availablePort}/api/learning-mode/test_project/recorded-requests`)
      expect(recordedRequestsAfterDeleteAll.status).to.be.equal(200)
      expect(recordedRequestsAfterDeleteAll.data.length).to.be.equal(0)

      config
        .registerInstance('NunjucksTemplatingHelpers', new NunjucksTemplatingHelpers())
        .registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService())
        .registerInstance(TemplatingService, new TemplatingService())
        .registerInstance(ProjectService, projectService)
        .registerInstance(LearningModeService, learningModeService)

      const startMockServer = await axios.post(`http://localhost:${availablePort}/api/projects/test_glob/mock-server`, {
        port: availablePorts[2],
        bindAddress: 'localhost'
      })
      expect(startMockServer.status).to.be.equal(200)
      expect(startMockServer.data).to.deep.equal({
        serverId: 'test_glob##mockServer'
      })

      const startMockServerAgain = await axios.post(`http://localhost:${availablePort}/api/projects/test_glob/mock-server`, {
        port: availablePorts[1],
        bindAddress: 'localhost'
      })

      const listEnrichedProjectsAfterMockServerStarted = await axios.get(`http://localhost:${availablePort}/api/projects?serverStatus=true`)
      expect(listEnrichedProjectsAfterMockServerStarted.status).to.be.equal(200)
      expect(listEnrichedProjectsAfterMockServerStarted.data).to.deep.equal([
        { name: 'test_one_file', mockServer: {}, learningModeServer: {} },
        { name: 'test_glob', mockServer: { port: availablePorts[1], bindAddress: 'localhost', status: 'started' }, learningModeServer: {} },
        {
          name: 'test_multiple_files',
          mockServer: {},
          learningModeServer: {}
        },
        {
          name: 'test_multiple_glob',
          mockServer: {},
          learningModeServer: {}
        },
        {
          name: 'test_glob_no_match',
          mockServer: {},
          learningModeServer: {}
        },
        {
          name: 'test_file_does_not_exist',
          mockServer: {},
          learningModeServer: {}
        },
        {
          name: 'test_one_file_does_not_exist',
          mockServer: {},
          learningModeServer: {}
        }])

      expect(startMockServerAgain.status).to.be.equal(200)
      expect(startMockServerAgain.data).to.deep.equal({
        serverId: 'test_glob##mockServer'
      })

      const stopMockServer = await axios.delete(`http://localhost:${availablePort}/api/projects/test_glob/mock-server`)
      expect(stopMockServer.status).to.be.equal(204)
      expect(stopMockServer.data).to.equal('')

      const stopAlreadyStoppedMockServer = await axios.delete(`http://localhost:${availablePort}/api/projects/test_glob/mock-server`)
      expect(stopAlreadyStoppedMockServer.status).to.be.equal(204)
      expect(stopAlreadyStoppedMockServer.data).to.equal('')

      let exceptionThrownBecauseStartingForwardProxyNotYetImplemented = false
      try {
        await axios.post(`http://localhost:${availablePort}/api/projects/test_glob/learning-mode-server`, {
          port: availablePorts[2],
          bindAddress: 'localhost',
          type: 'forward-proxy'
        })
      } catch (e) {
        expect(e.response.status).to.be.equal(500)
        expect(e.response.data).excluding('uuid').to.deep.equal({
          msg: 'An unexpected error occurred',
          code: 'unexpected error'
        })
        expect(e.response.data.uuid.length).is.not.equal(0)
        exceptionThrownBecauseStartingForwardProxyNotYetImplemented = true
      }
      expect(exceptionThrownBecauseStartingForwardProxyNotYetImplemented).to.be.equal(true)

      const startLearningModeReverseProxyServer = await axios.post(`http://localhost:${availablePort}/api/projects/test_glob/learning-mode-server`, {
        port: availablePorts[2],
        bindAddress: 'localhost',
        type: LearningModeServerTypes.REVERSE_PROXY,
        targetHost: 'http://localhost:12345'
      })
      expect(startLearningModeReverseProxyServer.status).to.be.equal(200)
      expect(startLearningModeReverseProxyServer.data).to.deep.equal({
        serverId: 'test_glob##learningModeServer'
      })

      const listEnrichedProjectsAfterLearningModeServerStarted = await axios.get(`http://localhost:${availablePort}/api/projects?serverStatus=true`)
      expect(listEnrichedProjectsAfterLearningModeServerStarted.status).to.be.equal(200)
      expect(listEnrichedProjectsAfterLearningModeServerStarted.data).to.deep.equal([
        { name: 'test_one_file', mockServer: {}, learningModeServer: {} },
        {
          name: 'test_glob',
          mockServer: {},
          learningModeServer: {
            port: 20002,
            bindAddress: 'localhost',
            status: 'started',
            type: LearningModeServerTypes.REVERSE_PROXY,
            targetHost: 'http://localhost:12345'
          }
        },
        {
          name: 'test_multiple_files',
          mockServer: {},
          learningModeServer: {}
        },
        {
          name: 'test_multiple_glob',
          mockServer: {},
          learningModeServer: {}
        },
        {
          name: 'test_glob_no_match',
          mockServer: {},
          learningModeServer: {}
        },
        {
          name: 'test_file_does_not_exist',
          mockServer: {},
          learningModeServer: {}
        },
        {
          name: 'test_one_file_does_not_exist',
          mockServer: {},
          learningModeServer: {}
        }])

      const stopLearningModeServer = await axios.delete(`http://localhost:${availablePort}/api/projects/test_glob/learning-mode-server`)
      expect(stopLearningModeServer.status).to.be.equal(204)
      expect(stopLearningModeServer.data).to.equal('')

      const stopAlreadyStoppedLearningModeServer = await axios.delete(`http://localhost:${availablePort}/api/projects/test_glob/learning-mode-server`)
      expect(stopAlreadyStoppedLearningModeServer.status).to.be.equal(204)
      expect(stopAlreadyStoppedLearningModeServer.data).to.equal('')
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
