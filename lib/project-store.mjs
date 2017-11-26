import yaml from 'js-yaml'
import { ClassValidationService } from './class-validation.service'
import { ProjectsFile, ProjectFile, Project, ProjectRule } from './project-model'
import { ProjectsFileSerializationModel, ProjectRuleSerializationModel } from './project-serialization-model'
import { RuleSerializationModel } from './rule-serialization-model'
import { deserialize, serialize } from './mjs_workaround/serializr-es6-module-loader'
import { readFileAsync, globAsync, FileOperationQueue } from './fs-util'
import { RuleService } from './rule-service'
import { FunctionalValidationError, TechnicalValidationError } from './error-types'
import { Logger } from './logging'
import { config } from './config'

class ProjectStore {}

// TODO more debug logging
// TODO the isLoading is clunky... e.g. result in unhandledRejection if loading fails
class InMemoryProjectStore extends ProjectStore {
  constructor (location = config.getProperty('project.default.location'), ruleService = config.getInstance(RuleService), classValidator = config.getInstance(ClassValidationService)) {
    super()
    this.location = location
    this.ruleService = ruleService
    this.classValidator = classValidator
    this.logger = config.getClassInstance(Logger, { id: 'project-store' })
    this.storedProjects = {}
    this.isLoading = this._loadProjectsFile().catch(e => {
      this.logger.error(e, 'There was a problem loading projects file \'%s\'', this.location)
      throw e
    })
    this.fileOperationQueue = new FileOperationQueue()
  }
  async _loadProjectsFile () {
    this.logger.debug('Load projects from yaml file in location %s', this.location)
    const rawFileContent = await readFileAsync(this.location)
    let parsedFileContent = yaml.safeLoad(rawFileContent)
    if (!parsedFileContent) {
      parsedFileContent = {
        projects: []
      }
    } else if (!('projects' in parsedFileContent) || !parsedFileContent.projects) {
      parsedFileContent.projects = []
    }
    const projectsFile = deserialize(ProjectsFileSerializationModel, parsedFileContent)
    await this._validateProjectsFile(projectsFile)
    this.logger.debug(projectsFile, 'Parsed projectsFile')

    // TODO should also be possible to avoid waiting at the end of every loop iteration
    for (let project of projectsFile.projects) {
      const rulePromises = []
      // TODO avoid reading same file multiple times
      // 2 possible cases:
      //  * for one project the same rule is in the list (e.g. 2 globs returning same file)
      //  * multiple projects can refer to the same rule
      for (let ruleFilePattern of project.rules) {
        const ruleFiles = await globAsync(ruleFilePattern)
        if (ruleFiles.length === 0) {
          this.logger.warn(`No rule files match the pattern ${ruleFilePattern}`)
        }
        for (let ruleFile of ruleFiles) {
          rulePromises.push(this.ruleService.readRule(ruleFile).then((rule) => {
            return new ProjectRule(ruleFile, rule)
          }))
        }
      }

      const newProject = new Project(project.name, await Promise.all(rulePromises))
      await this._validateProject(newProject)
      this._setProject(newProject)
    }
  }
  async listProjects () {
    this.logger.debug("Retrieving all projects from InMemoryProjects store configured with location '%s'", this.location)
    await this.isLoading
    return this._getProjects()
  }
  async retrieveProject (projectName) {
    this.logger.debug("Retrieving project with name '%s' from InMemoryProjects store configured with location '%s'", projectName, this.location)
    await this.isLoading
    this._checkProjectExists(projectName)
    return this._getProject(projectName)
  }
  async createNewProject (projectName) {
    await this.isLoading
    this._checkProjectNotExists(projectName)
    const project = new Project(projectName)
    await this._validateProject(project)
    // TODO better way to clone
    this._setProject(new Project(projectName))
    this._syncProjectsFileToFileSystem()
    return project
  }
  async updateProject (projectName, updatedProject) { // only updates the name of the project!
    await this.isLoading
    await this._validateProject(updatedProject)
    this._checkProjectExists(projectName)
    const projectToUpdate = this._getProject(projectName)
    this._deleteProject(projectName)
    projectToUpdate.name = updatedProject.name
    this._setProject(projectToUpdate)
    this._syncProjectsFileToFileSystem()
    return updatedProject
  }
  async removeProject (projectName) {
    await this.isLoading
    this._checkProjectExists(projectName)
    this._deleteProjectRules(projectName)
    this._deleteProject(projectName)
    return this._syncProjectsFileToFileSystem()
  }
  async retrieveProjectRule (projectName, ruleName) {
    this.logger.debug("Retrieving project rule with name '%s' for project '%' from InMemoryProjects store configured with location '%s'", ruleName, projectName, this.location)
    await this.isLoading
    this._checkProjectExists(projectName)
    this._checkProjectRuleExists(projectName, ruleName)

    const project = this._getProject(projectName)
    const projectRule = project.rules.find((projectRule) => {
      return projectRule.rule.name === ruleName
    })
    return projectRule
  }
  async createProjectRule (projectName, projectRule) {
    await this.isLoading
    await this._validateProjectRule(projectRule)
    this._checkProjectExists(projectName)
    this._checkProjectRuleNotExists(projectName, projectRule)

    const project = this._getProject(projectName)
    // TODO find proper way to handling cloning the input so that the caller no longer has a reference with which the memory model can be updated without going through this service
    const clonedProjectRule = deserialize(ProjectRuleSerializationModel, serialize(ProjectRuleSerializationModel, projectRule))
    project.rules.push(clonedProjectRule)
    await Promise.all([
      this._syncProjectsFileToFileSystem(),
      this._syncRuleFileToFileSystem(clonedProjectRule)
    ])
    return projectRule
  }
  async updateProjectRule (projectName, originalRuleName, updatedProjectRule) {
    await this.isLoading
    await this._validateProjectRule(updatedProjectRule)
    this._checkProjectExists(projectName)
    this._checkProjectRuleExists(projectName, originalRuleName)
    if (originalRuleName !== updatedProjectRule.rule.name) {
      this._checkProjectRuleNameNotExists(projectName, updatedProjectRule)
    }
    const originalProjectRule = this._getProjectRule(projectName, originalRuleName)
    if (originalProjectRule.location !== updatedProjectRule.location) {
      this._checkProjectRuleLocationNotExists(projectName, updatedProjectRule)
    }
    if (originalProjectRule.rule.request.method !== updatedProjectRule.rule.request.method ||
        originalProjectRule.rule.request.path !== updatedProjectRule.rule.request.path) {
      this._checkProjectRuleMethodAndPathNotExists(projectName, updatedProjectRule)
    }

    const promises = []

    // TODO find proper way to handling cloning the input so that the caller no longer has a reference with which the memory model can be updated without going through this service
    const clonedUpdatedProjectRule = deserialize(ProjectRuleSerializationModel, serialize(ProjectRuleSerializationModel, updatedProjectRule))
    this._updateProjectRule(originalRuleName, clonedUpdatedProjectRule)

    promises.push(this._syncRuleFileToFileSystem(clonedUpdatedProjectRule))

    if (originalProjectRule.location !== updatedProjectRule.location) {
      this._deleteProjectRule(projectName, originalProjectRule)
      promises.push(this._syncProjectsFileToFileSystem())
    }

    await Promise.all(promises)
    return updatedProjectRule
  }
  async removeProjectRule (projectName, ruleName) {
    await this.isLoading
    this._checkProjectExists(projectName)
    this._checkProjectRuleExists(projectName, ruleName)

    this._removeProjectRule(projectName, ruleName)

    return this._syncProjectsFileToFileSystem()
  }
  async _syncProjectsFileToFileSystem () {
    const projectsFile = new ProjectsFile(Object.values(this._getProjects()).map((project) => {
      return new ProjectFile(project.name, project.rules.map((projectRule) => {
        return projectRule.location
      }))
    })) // TODO check if the .map(...) can't be done directly with a serializer model
    const serializedProjectsFile = serialize(ProjectsFileSerializationModel, projectsFile)
    const dumpedProjectsFile = yaml.safeDump(serializedProjectsFile, { skipInvalid: true })
    return this.fileOperationQueue.add(this.location, dumpedProjectsFile)
  }
  async _syncRuleFileToFileSystem (projectRule) {
    const serializedRule = serialize(RuleSerializationModel, projectRule.rule)
    const dumpedRule = yaml.safeDump(serializedRule, { skipInvalid: true })
    return this.fileOperationQueue.add(projectRule.location, dumpedRule)
  }
  _getProjects () {
    return this.storedProjects
  }
  _getProject (projectName) {
    return this.storedProjects[projectName]
  }
  _setProject (project) {
    this.storedProjects[project.name] = project
  }
  _deleteProject (projectName) {
    return delete this.storedProjects[projectName]
  }
  async _validateProjectsFile (projectsFile) {
    await this.classValidator.validate(ProjectsFile, projectsFile)
  }
  async _validateProject (project) {
    await this.classValidator.validate(Project, project)
  }
  async _validateProjectRule (projectRule) {
    await this.classValidator.validate(ProjectRule, projectRule)
  }
  _checkProjectExists (projectName) {
    if (!(projectName in this.storedProjects)) {
      throw new TechnicalValidationError(
        `The project with name ${projectName} does not exist`,
        'project not found',
        {
          project: projectName
        }
      )
    }
  }
  _checkProjectNotExists (projectName) {
    if (projectName in this.storedProjects) {
      throw new FunctionalValidationError(
        `The project with name ${projectName} already exists`,
        'project exists',
        {
          project: projectName
        }
      )
    }
  }
  _getProjectRule (projectName, ruleName) {
    return this._getProject(projectName).rules.find((projectRule) => {
      return projectRule.rule.name === ruleName
    })
  }
  _updateProjectRule (originalRuleName, updatedProjectRule) {
    for (let project of Object.values(this._getProjects())) {
      const indexOriginalRule = project.rules.findIndex((projectRule) => {
        return projectRule.rule.name === originalRuleName
      })
      if (indexOriginalRule !== -1) {
        project.rules[indexOriginalRule] = updatedProjectRule
      }
    }
  }
  _removeProjectRule (projectName, ruleName) {
    const project = this._getProject(projectName)
    const indexOriginalRule = project.rules.findIndex((projectRule) => {
      return projectRule.rule.name === ruleName
    })
    this._deleteProjectRule(projectName, project.rules[indexOriginalRule])
    project.rules.splice(indexOriginalRule, 1)
  }
  _deleteProjectRules (projectName) {
    const project = this._getProject(projectName)
    for (let projectRule of project.rules) {
      this._deleteProjectRule(projectName, projectRule)
    }
  }
  _deleteProjectRule (projectName, projectRule) {
    if (!this._isProjectRuleUsedByOtherProject(projectName, projectRule)) {
      this._removeProjectRuleFile(projectRule)
    }
  }
  _checkProjectRuleNotExists (projectName, projectRule) {
    this._checkProjectRuleNameNotExists(projectName, projectRule)
    this._checkProjectRuleLocationNotExists(projectName, projectRule)
    this._checkProjectRuleMethodAndPathNotExists(projectName, projectRule)
  }
  _checkProjectRuleNameNotExists (projectName, projectRule) {
    const nameExists = this._getProject(projectName).rules.some((aProjectRule) => {
      return aProjectRule.rule.name === projectRule.rule.name
    })
    if (nameExists) {
      throw new FunctionalValidationError(
        `A rule with name '${projectRule.rule.name}' already exists for the project with name ${projectName}`,
        'rule exists for given name',
        {
          project: projectName,
          rule: projectRule.rule.name
        }
      )
    }
  }
  _checkProjectRuleLocationNotExists (projectName, projectRule) {
    const locationExists = this._getProject(projectName).rules.some((aProjectRule) => {
      return aProjectRule.location === projectRule.location
    })
    if (locationExists) {
      throw new FunctionalValidationError(
        `A rule with location '${projectRule.location}' already exists for the project with name ${projectName}`,
        'rule exists for given location',
        {
          project: projectName,
          location: projectRule.location
        }
      )
    }
  }
  _checkProjectRuleMethodAndPathNotExists (projectName, projectRule) {
    const methodAndPathExist = this._getProject(projectName).rules.some((aProjectRule) => {
      const rule = aProjectRule.rule
      return rule.request.path === projectRule.rule.request.path && rule.request.method === projectRule.rule.request.method
    })
    if (methodAndPathExist) {
      throw new FunctionalValidationError(
        `A rule with path '${projectRule.rule.request.path}' and method '${projectRule.rule.request.method}' already exists for the project with name ${projectName}`,
        'rule exists for given method and path',
        {
          project: projectName,
          method: projectRule.rule.request.method,
          path: projectRule.rule.request.path
        }
      )
    }
  }
  _checkProjectRuleExists (projectName, ruleName) {
    const exists = this._getProject(projectName).rules.some((projectRule) => {
      return projectRule.rule.name === ruleName
    })
    if (!exists) {
      throw new TechnicalValidationError(
        `A rule with name '${ruleName}' does not exist for the project with name ${projectName}`,
        'rule not found',
        {
          project: projectName,
          rule: ruleName
        }
      )
    }
  }
  _isProjectRuleUsedByOtherProject (projectName, projectRule) {
    return Object.values(this._getProjects()).some((project) => {
      if (project.name === projectName) {
        return false
      }
      try {
        this._checkProjectRuleLocationNotExists(project.name, projectRule)
        return false
      } catch (e) {
        return true
      }
    })
  }
  async _removeProjectRuleFile (projectRule) {
    try {
      this.fileOperationQueue.remove(projectRule.location)
    } catch (e) {
      this.logger.error(e, "An error occurred when trying to delete file '%s'", projectRule.location)
    }
  }
}

export { ProjectStore, InMemoryProjectStore }
