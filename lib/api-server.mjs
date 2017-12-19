import bodyParser from 'body-parser'
import cors from 'cors'
import 'express-async-errors'
import errorHandler from './express-error-handling-middleware.json'
import { Server } from './server.service'
import { deserialize, serialize } from './mjs_workaround/serializr-es6-module-loader'
import { ProjectSerializationModel, LimitedDataProjectSerializationModel, ProjectRuleSerializationModel, LimitedDataProjectRuleSerializationModel } from './project-serialization-model'
import { ProjectService } from './project-service'
import { LearningModeService } from './learning-mode.service'
import { LimitedDataRecordedRequestSerializationModel, RecordedRequestSerializationModel } from './learning-mode.serialization-model'
import { config } from './config'

const CONTEXT_ROOT = '/api'
const PROJECTS_RESOURCE = 'projects'
const PROJECT_ID = 'projectName'
const PROJECT_ID_MATCHER = `:${PROJECT_ID}`
const RULES_RESOURCE = 'rules'
const RULE_ID = 'ruleName'
const RULE_ID_MATCHER = `:${RULE_ID}`
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
  constructor (port = config.getProperty('api-server.port'), bindAddress = config.getProperty('api-server.bind-address'), projectService = config.getInstance(ProjectService), learningModeService = config.getInstance(LearningModeService)) {
    super(port, bindAddress, 'api-server')
    this.projectService = projectService
    this.learningModeService = learningModeService

    // Defined here as a workaround because can't use arrow function as method on the class (and need the arrow to have the correct 'this')
    this._listProjects = async (req, res) => {
      const allProjects = await this.projectService.listProjects()
      res.send(Object.keys(allProjects))
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

  _setup () {
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
}

export {
  ApiServer
}
