import express from 'express'
import bodyParser from 'body-parser'
import 'express-async-errors'
import { deserialize, serialize } from './mjs_workaround/serializr-es6-module-loader'
import { ProjectSerializationModel, LimitedDataProjectSerializationModel, ProjectRuleSerializationModel, LimitedDataProjectRuleSerializationModel } from './project-serialization-model'
import { logger } from './logging'
import { ProjectService } from './project-service'

const CONTEXT_ROOT = '/api'
const PROJECTS_RESOURCE = 'projects'
const PROJECT_ID = 'projectName'
const PROJECT_ID_MATCHER = `:${PROJECT_ID}`
const RULES_RESOURCE = 'rules'
const RULE_ID = 'ruleName'
const RULE_ID_MATCHER = `:${RULE_ID}`

const _getListProjectsUri = () => {
  return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}`
}
const _getCreateProjectsUri = () => {
  return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}`
}
const _getUpdateProjectsUri = (projectId) => {
  return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}`
}
const _getRemoveProjectsUri = (projectId) => {
  return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}`
}
const _getListProjectRulesUri = (projectId) => {
  return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${RULES_RESOURCE}`
}
const _getRetrieveProjectRulesUri = (projectId, ruleId) => {
  return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${RULES_RESOURCE}/${ruleId}`
}
const _getCreateProjectRulesUri = (projectId) => {
  return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${RULES_RESOURCE}`
}
const _getUpdateProjectRulesUri = (projectId, ruleId) => {
  return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${RULES_RESOURCE}/${ruleId}`
}
const _getRemoveProjectRulesUri = (projectId, ruleId) => {
  return `${CONTEXT_ROOT}/${PROJECTS_RESOURCE}/${projectId}/${RULES_RESOURCE}/${ruleId}`
}

const _listProjects = async (req, res) => {
  const allProjects = await ProjectService.listProjects()
  res.send(Object.keys(allProjects))
}

const _createProject = async (req, res) => {
  const project = deserialize(ProjectSerializationModel, req.body)
  const createProject = await ProjectService.createProject(project.name)
  res.status(201)
  res.location(_getListProjectRulesUri(project.name))
  res.send(serialize(LimitedDataProjectSerializationModel, createProject))
}

const _updateProject = async (req, res) => {
  const project = deserialize(ProjectSerializationModel, req.body)
  const updatedProject = await ProjectService.updateProject(req.params[PROJECT_ID], project)
  res.status(200)
  res.send(serialize(LimitedDataProjectSerializationModel, updatedProject))
}

const _removeProject = async (req, res) => {
  await ProjectService.removeProject(req.params[PROJECT_ID])
  res.status(204)
  res.send()
}

const _listProjectRules = async (req, res) => {
  const rules = await ProjectService.listProjectRules(req.params[PROJECT_ID])
  res.send(rules.map((projectRule) => {
    return serialize(LimitedDataProjectRuleSerializationModel, projectRule)
  }))
}

const _retrieveProjectRule = async (req, res) => {
  const rule = await ProjectService.retrieveProjectRule(req.params[PROJECT_ID], req.params[RULE_ID])
  res.send(serialize(ProjectRuleSerializationModel, rule))
}

const _createProjectRule = async (req, res) => {
  const projectName = req.params[PROJECT_ID]
  const projectRule = deserialize(ProjectRuleSerializationModel, req.body)
  const createdProjectRule = await ProjectService.createProjectRule(projectName, projectRule)
  res.status(201)
  res.location(_getRetrieveProjectRulesUri(projectName, createdProjectRule.rule.name))
  res.send(serialize(ProjectRuleSerializationModel, createdProjectRule))
}

const _updateProjectRule = async (req, res) => {
  const projectRule = deserialize(ProjectRuleSerializationModel, req.body)
  const updatedProjectRule = await ProjectService.updateProjectRule(req.params[PROJECT_ID], req.params[RULE_ID], projectRule)
  res.status(200)
  res.send(serialize(ProjectRuleSerializationModel, updatedProjectRule))
}

const _removeProjectRule = async (req, res) => {
  await ProjectService.removeProjectRule(req.params[PROJECT_ID], req.params[RULE_ID])
  res.status(204)
  res.send()
}

class ApiServer {
  constructor (port) {
    this.port = port
    this.server = null
  }

  start () {
    logger.debug('Starting api server on port %s', this.port)

    const app = express()
    app.use(bodyParser.json())
    app.disable('x-powered-by')

    // GET /projects
    app.get(_getListProjectsUri(), _listProjects)
    // POST /projects
    app.post(_getCreateProjectsUri(), _createProject)
    // PUT /projects/:projectName
    app.put(_getUpdateProjectsUri(PROJECT_ID_MATCHER), _updateProject)
    // DELETE /projects/:projectName
    app.delete(_getRemoveProjectsUri(PROJECT_ID_MATCHER), _removeProject)
    // GET /projects/:projectName/rules
    app.get(_getListProjectRulesUri(PROJECT_ID_MATCHER), _listProjectRules)
    // GET /projects/:projectName/rules/:ruleName
    app.get(_getRetrieveProjectRulesUri(PROJECT_ID_MATCHER, RULE_ID_MATCHER), _retrieveProjectRule)
    // POST /projects/:projectName/rules
    app.post(_getCreateProjectRulesUri(PROJECT_ID_MATCHER), _createProjectRule)
    // PUT /projects/:projectName/rules/:ruleName
    app.put(_getUpdateProjectRulesUri(PROJECT_ID_MATCHER, RULE_ID_MATCHER), _updateProjectRule)
    // DELETE /projects/:projectName/rules/:ruleName
    app.delete(_getRemoveProjectRulesUri(PROJECT_ID_MATCHER, RULE_ID_MATCHER), _removeProjectRule)

    return new Promise((resolve, reject) => {
      this.server = app.listen(this.port, () => {
        logger.info('Api server started on port %d', this.port)
        resolve()
      })
    })
  }
  stop () {
    logger.debug('Request to stop the api server')
    if (this.server != null) {
      logger.info('Stopping the api server')
      return new Promise((resolve, reject) => {
        this.server.close(() => {
          logger.info('Stopped the api server')
          resolve()
        })
      })
    }
  }
}

export {
  ApiServer
}
