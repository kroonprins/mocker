import bodyParser from 'body-parser'
import cors from 'cors'
import 'express-async-errors'
import errorHandler from './express-error-handling-middleware.json'
import { Server, ServerService } from './server.service'
import { deserialize, serialize } from './mjs_workaround/serializr-es6-module-loader'
import { ProjectSerializationModel, LimitedDataProjectSerializationModel, ProjectRuleSerializationModel, LimitedDataProjectRuleSerializationModel } from './project-serialization-model'
import { ProjectService } from './project-service'
import { LearningModeService } from './learning-mode.service'
import { LimitedDataRecordedRequestSerializationModel, RecordedRequestSerializationModel } from './learning-mode.serialization-model'
import { MockServer } from './mock-server'
import { LearningModeReverseProxyServer } from './learning-mode.reverse-proxy'
import { LearningModeForwardProxyServer } from './learning-mode.forward-proxy'
import { MockServerSerializationModel, LearningModeServerSerializationModel } from './server-serialization-model'
import { config } from './config'

const CONTEXT_ROOT = '/api'
const PROJECTS_RESOURCE = 'projects'
const PROJECT_ID = 'projectName'
const PROJECT_ID_MATCHER = `:${PROJECT_ID}`
const RULES_RESOURCE = 'rules'
const RULE_ID = 'ruleName'
const RULE_ID_MATCHER = `:${RULE_ID}`
const MOCK_SERVER_RESOURCE = 'mock-server'
const MOCK_SERVER_TYPE = 'mockServer'
const LEARNING_MODE_SERVER_RESOURCE = 'learning-mode-server'
const LEARNING_MODE_SERVER_TYPE = 'learningModeServer'
const LEARNING_MODE_ROOT = '/learning-mode'
const RECORDED_REQUESTS_RESOURCE = 'recorded-requests'
const RECORDED_REQUEST_ID = 'recordedRequestId'
const RECORDED_REQUEST_ID_MATCHER = `:${RECORDED_REQUEST_ID}`

/**
 * Server exposing service endpoints than can be used by the UI to manage projects, rules, learning mode, ...
 */
class ApiServer extends Server {
  /**
   * Creates an instance of ApiServer.
   *
   * @param {string} [port=config.getProperty('api-server.port')] The port on which the server should run.
   * @param {string} [bindAddress=config.getProperty('api-server.bind-address')] The address to which the server should bind.
   * @param {ProjectService} [projectService=config.getInstance(ProjectService)] An instance of a ProjectService.
   * @param {LearningModeService} [projectService=config.getInstance(LearningModeService)] An instance of a LearningModeService.
   * @memberof ApiServer
   */
  constructor (port = config.getProperty('api-server.port'), bindAddress = config.getProperty('api-server.bind-address'), projectService = config.getInstance(ProjectService), learningModeService = config.getInstance(LearningModeService), serverService = config.getInstance(ServerService)) {
    super(port, bindAddress, 'api-server')
    this.projectService = projectService
    this.learningModeService = learningModeService
    this.serverService = serverService

    // All these methods defined here as a workaround because can't use arrow function as method on the class (and need the arrow to have the correct 'this')
    this._listProjects = async (req, res) => {
      const allProjects = await this.projectService.listProjects()
      let result = Object.keys(allProjects)
      if (req.query.serverStatus) {
        result = await this.serverService.enrichProjectList(result, [
          {
            type: MOCK_SERVER_TYPE,
            serializationModel: MockServerSerializationModel
          }, {
            type: LEARNING_MODE_SERVER_TYPE,
            serializationModel: LearningModeServerSerializationModel
          }], this._serverId)
      }
      res.send(result)
    }
    this._createProject = async (req, res) => {
      const project = deserialize(ProjectSerializationModel, req.body)
      const createProject = await this.projectService.createProject(project.name)
      res.status(201)
      res.location(this._getListProjectRulesUri(project.name))
      res.send(serialize(LimitedDataProjectSerializationModel, createProject))
    }
    this._updateProject = async (req, res) => {
      const project = deserialize(ProjectSerializationModel, req.body)
      const updatedProject = await this.projectService.updateProject(req.params[PROJECT_ID], project)
      res.status(200)
      res.send(serialize(LimitedDataProjectSerializationModel, updatedProject))
    }
    this._removeProject = async (req, res) => {
      await this.projectService.removeProject(req.params[PROJECT_ID])
      res.status(204)
      res.send()
    }
    this._listProjectRules = async (req, res) => {
      const rules = await this.projectService.listProjectRules(req.params[PROJECT_ID])
      res.send(rules.map((projectRule) => {
        return serialize(LimitedDataProjectRuleSerializationModel, projectRule)
      }))
    }
    this._retrieveProjectRule = async (req, res) => {
      const rule = await this.projectService.retrieveProjectRule(req.params[PROJECT_ID], req.params[RULE_ID])
      res.send(serialize(ProjectRuleSerializationModel, rule))
    }
    this._createProjectRule = async (req, res) => {
      const projectName = req.params[PROJECT_ID]
      const projectRule = deserialize(ProjectRuleSerializationModel, req.body)
      const createdProjectRule = await this.projectService.createProjectRule(projectName, projectRule)
      res.status(201)
      res.location(this._getRetrieveProjectRulesUri(projectName, createdProjectRule.rule.name))
      res.send(serialize(ProjectRuleSerializationModel, createdProjectRule))
    }
    this._updateProjectRule = async (req, res) => {
      const projectRule = deserialize(ProjectRuleSerializationModel, req.body)
      const updatedProjectRule = await this.projectService.updateProjectRule(req.params[PROJECT_ID], req.params[RULE_ID], projectRule)
      res.status(200)
      res.send(serialize(ProjectRuleSerializationModel, updatedProjectRule))
    }
    this._removeProjectRule = async (req, res) => {
      await this.projectService.removeProjectRule(req.params[PROJECT_ID], req.params[RULE_ID])
      res.status(204)
      res.send()
    }
    this._startMockServer = async (req, res) => {
      const projectName = req.params[PROJECT_ID]
      res.status(200)
      res.send({
        serverId: await this.serverService.startNewServer(this._serverId(projectName, MOCK_SERVER_TYPE), MockServer, req.body.port, req.body.bindAddress, projectName)
      })
    }
    this._stopMockServer = async (req, res) => {
      const projectName = req.params[PROJECT_ID]
      await this.serverService.stopServer(this._serverId(projectName, MOCK_SERVER_TYPE))
      res.status(204)
      res.send()
    }
    this._startLearningModeServer = async (req, res) => {
      const projectName = req.params[PROJECT_ID]
      let serverType, args
      if (req.body.type === 'reverse-proxy') {
        serverType = LearningModeReverseProxyServer
        args = [ req.body.targetHost, projectName ]
      } else if (req.body.type === 'forward-proxy') {
        serverType = LearningModeForwardProxyServer
        args = [ projectName ]
      } else {
        // TODO error
      }
      res.status(200)
      res.send({
        serverId: await this.serverService.startNewServer(this._serverId(projectName, LEARNING_MODE_SERVER_TYPE), serverType, req.body.port, req.body.bindAddress, ...args)
      })
    }
    this._stopLearningModeServer = async (req, res) => {
      const projectName = req.params[PROJECT_ID]
      await this.serverService.stopServer(this._serverId(projectName, LEARNING_MODE_SERVER_TYPE))
      res.status(204)
      res.send()
    }
    this._listLearningModeRecordedRequests = async (req, res) => {
      const recordedRequests = await this.learningModeService.findRecordedRequests(req.params[PROJECT_ID])
      res.send(recordedRequests.map((recordedRequest) => {
        return serialize(LimitedDataRecordedRequestSerializationModel, recordedRequest)
      }))
    }
    this._retrieveLearningModeRecordedRequest = async (req, res) => {
      const recordedRequest = await this.learningModeService.retrieveRecordedRequest(req.params[PROJECT_ID], req.params[RECORDED_REQUEST_ID])
      res.send(serialize(RecordedRequestSerializationModel, recordedRequest))
    }
    this._removeLearningModeRecordedRequest = async (req, res) => {
      await this.learningModeService.removeRecordedRequest(req.params[PROJECT_ID], req.params[RECORDED_REQUEST_ID])
      res.status(204)
      res.send()
    }
    this._removeAllLearningModeRecordedRequests = async (req, res) => {
      await this.learningModeService.removeAll(req.params[PROJECT_ID])
      res.status(204)
      res.send()
    }
  }

  async _setup () {
    this.app.use(bodyParser.json())
    this.app.use(cors()) // TODO configure

    // GET /api/projects
    this.app.get(this._getListProjectsUri(), this._listProjects)
    // POST /api/projects
    this.app.post(this._getCreateProjectsUri(), this._createProject)
    // PUT /api/projects/:projectName
    this.app.put(this._getUpdateProjectsUri(PROJECT_ID_MATCHER), this._updateProject)
    // DELETE /api/projects/:projectName
    this.app.delete(this._getRemoveProjectsUri(PROJECT_ID_MATCHER), this._removeProject)
    // GET /api/projects/:projectName/rules
    this.app.get(this._getListProjectRulesUri(PROJECT_ID_MATCHER), this._listProjectRules)
    // GET /api/projects/:projectName/rules/:ruleName
    this.app.get(this._getRetrieveProjectRulesUri(PROJECT_ID_MATCHER, RULE_ID_MATCHER), this._retrieveProjectRule)
    // POST /api/projects/:projectName/rules
    this.app.post(this._getCreateProjectRulesUri(PROJECT_ID_MATCHER), this._createProjectRule)
    // PUT /api/projects/:projectName/rules/:ruleName
    this.app.put(this._getUpdateProjectRulesUri(PROJECT_ID_MATCHER, RULE_ID_MATCHER), this._updateProjectRule)
    // DELETE /api/projects/:projectName/rules/:ruleName
    this.app.delete(this._getRemoveProjectRulesUri(PROJECT_ID_MATCHER, RULE_ID_MATCHER), this._removeProjectRule)

    // POST /api/projects/:projectName/mock-server
    this.app.post(this._getMockServerForProjectUri(PROJECT_ID_MATCHER), this._startMockServer)
    // DELETE /api/projects/:projectName/mock-server
    this.app.delete(this._getMockServerForProjectUri(PROJECT_ID_MATCHER), this._stopMockServer)
    // POST /api/projects/:projectName/learning-mode-server
    this.app.post(this._getLearningModeServerForProjectUri(PROJECT_ID_MATCHER), this._startLearningModeServer)
    // DELETE /api/projects/:projectName/learning-mode-server
    this.app.delete(this._getLearningModeServerForProjectUri(PROJECT_ID_MATCHER), this._stopLearningModeServer)

    // GET /api/learning-mode/:projectName/recorded-requests
    this.app.get(this._getListLearningModeRecordedRequestsUri(PROJECT_ID_MATCHER), this._listLearningModeRecordedRequests)
    // GET /api/learning-mode/:projectName/recorded-requests/:recordedRequestId
    this.app.get(this._getRetrieveLearningModeRecordedRequestUri(PROJECT_ID_MATCHER, RECORDED_REQUEST_ID_MATCHER), this._retrieveLearningModeRecordedRequest)
    // DELETE /api/learning-mode/:projectName/recorded-requests/:recordedRequestId
    this.app.delete(this._getRemoveLearningModeRecordedRequestUri(PROJECT_ID_MATCHER, RECORDED_REQUEST_ID_MATCHER), this._removeLearningModeRecordedRequest)
    // DELETE /api/learning-mode/:projectName/recorded-requests
    this.app.delete(this._getRemoveAllLearningModeRecordedRequestsUri(PROJECT_ID_MATCHER), this._removeAllLearningModeRecordedRequests)

    this.app.use(errorHandler({
      logger: this.logger
    }))
  }

  _getListProjectsUri () {
    return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}`
  }
  _getCreateProjectsUri () {
    return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}`
  }
  _getUpdateProjectsUri (projectId) {
    return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}`
  }
  _getRemoveProjectsUri (projectId) {
    return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}`
  }
  _getListProjectRulesUri (projectId) {
    return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${RULES_RESOURCE}`
  }
  _getRetrieveProjectRulesUri (projectId, ruleId) {
    return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${RULES_RESOURCE}/${ruleId}`
  }
  _getCreateProjectRulesUri (projectId) {
    return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${RULES_RESOURCE}`
  }
  _getUpdateProjectRulesUri (projectId, ruleId) {
    return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${RULES_RESOURCE}/${ruleId}`
  }
  _getRemoveProjectRulesUri (projectId, ruleId) {
    return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${RULES_RESOURCE}/${ruleId}`
  }
  _getMockServerForProjectUri (projectId, ruleId) {
    return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${MOCK_SERVER_RESOURCE}`
  }
  _getLearningModeServerForProjectUri (projectId, ruleId) {
    return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${LEARNING_MODE_SERVER_RESOURCE}`
  }
  _getListLearningModeRecordedRequestsUri (projectId) {
    return `${CONTEXT_ROOT}${LEARNING_MODE_ROOT}/${projectId}/${RECORDED_REQUESTS_RESOURCE}`
  }
  _getRetrieveLearningModeRecordedRequestUri (projectId, recordedRequestId) {
    return `${CONTEXT_ROOT}${LEARNING_MODE_ROOT}/${projectId}/${RECORDED_REQUESTS_RESOURCE}/${recordedRequestId}`
  }
  _getRemoveLearningModeRecordedRequestUri (projectId, recordedRequestId) {
    return `${CONTEXT_ROOT}${LEARNING_MODE_ROOT}/${projectId}/${RECORDED_REQUESTS_RESOURCE}/${recordedRequestId}`
  }
  _getRemoveAllLearningModeRecordedRequestsUri (projectId) {
    return `${CONTEXT_ROOT}${LEARNING_MODE_ROOT}/${projectId}/${RECORDED_REQUESTS_RESOURCE}`
  }
  _serverId (projectName, serverType) {
    return `${projectName}##${serverType}`
  }
}

export {
  ApiServer
}
