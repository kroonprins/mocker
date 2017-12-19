import express from 'express'
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
import { Logger } from './logging'
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
   * @param {any} [projectService=config.getInstance(ProjectService)] An instance of a ProjectService.
   * @memberof ApiServer
   */
  constructor (port = config.getProperty('api-server.port'), bindAddress = config.getProperty('api-server.bind-address'), projectService = config.getInstance(ProjectService), learningModeService = config.getInstance(LearningModeService)) {
    super()
    this.port = port
    this.bindAddress = bindAddress
    this.logger = config.getClassInstance(Logger, { id: 'api-server' })
    this.projectService = projectService
    this.learningModeService = learningModeService
    this.server = null

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

  /**
   * Start the server.
   *
   * @returns A promise that will resolve when the server is ready to receive requests.
   * @memberof ApiServer
   */
  start () {
    this.logger.debug('Starting api server on port %s binding on %s', this.port, this.bindAddress)

    const app = express()
    app.use(bodyParser.json())
    app.use(cors()) // TODO configure
    app.disable('x-powered-by')

    // GET /api/projects
    app.get(this._getListProjectsUri(), this._listProjects)
    // POST /api/projects
    app.post(this._getCreateProjectsUri(), this._createProject)
    // PUT /api/projects/:projectName
    app.put(this._getUpdateProjectsUri(PROJECT_ID_MATCHER), this._updateProject)
    // DELETE /api/projects/:projectName
    app.delete(this._getRemoveProjectsUri(PROJECT_ID_MATCHER), this._removeProject)
    // GET /api/projects/:projectName/rules
    app.get(this._getListProjectRulesUri(PROJECT_ID_MATCHER), this._listProjectRules)
    // GET /api/projects/:projectName/rules/:ruleName
    app.get(this._getRetrieveProjectRulesUri(PROJECT_ID_MATCHER, RULE_ID_MATCHER), this._retrieveProjectRule)
    // POST /api/projects/:projectName/rules
    app.post(this._getCreateProjectRulesUri(PROJECT_ID_MATCHER), this._createProjectRule)
    // PUT /api/projects/:projectName/rules/:ruleName
    app.put(this._getUpdateProjectRulesUri(PROJECT_ID_MATCHER, RULE_ID_MATCHER), this._updateProjectRule)
    // DELETE /api/projects/:projectName/rules/:ruleName
    app.delete(this._getRemoveProjectRulesUri(PROJECT_ID_MATCHER, RULE_ID_MATCHER), this._removeProjectRule)

    // GET /api/learning-mode/:projectName/recorded-requests
    app.get(this._getListLearningModeRecordedRequestsUri(PROJECT_ID_MATCHER), this._listLearningModeRecordedRequests)
    // GET /api/learning-mode/:projectName/recorded-requests/:recordedRequestId
    app.get(this._getRetrieveLearningModeRecordedRequestUri(PROJECT_ID_MATCHER, RECORDED_REQUEST_ID_MATCHER), this._retrieveLearningModeRecordedRequest)
    // DELETE /api/learning-mode/:projectName/recorded-requests/:recordedRequestId
    app.delete(this._getRemoveLearningModeRecordedRequestUri(PROJECT_ID_MATCHER, RECORDED_REQUEST_ID_MATCHER), this._removeLearningModeRecordedRequest)
    // DELETE /api/learning-mode/:projectName/recorded-requests
    app.delete(this._getRemoveAllLearningModeRecordedRequestsUri(PROJECT_ID_MATCHER), this._removeAllLearningModeRecordedRequests)

    app.use(errorHandler({
      logger: this.logger
    }))

    return new Promise((resolve, reject) => {
      this.server = app.listen(this.port, this.bindAddress, () => {
        this.logger.info('Api server started on port %d and binding to %s', this.port, this.bindAddress)
        resolve()
      })
    })
  }

  /**
   * Stop the server.
   *
   * @returns A promise that will resolve when the server has completely shut down.
   * @memberof ApiServer
   */
  stop () {
    this.logger.debug('Request to stop the api server')
    if (this.server != null) {
      this.logger.info('Stopping the api server')
      return new Promise((resolve, reject) => {
        this.server.close(() => {
          this.logger.info('Stopped the api server')
          resolve()
        })
      })
    }
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
