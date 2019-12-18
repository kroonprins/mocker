import yaml from 'js-yaml'
import path from 'path'
import serializr from 'serializr'
import { ClassValidationService } from './class-validation.service.mjs'
import { ProjectsFile, ProjectFile, Project, ProjectRule } from './project-model.mjs'
import { ProjectsFileSerializationModel, ProjectRuleSerializationModel } from './project-serialization-model.mjs'
import { RuleSerializationModel } from './rule-serialization-model.mjs'
import { readFileAsync, globAsync, FileOperationQueue } from './fs-util.mjs'
import { RuleService } from './rule.service.mjs'
import { FunctionalValidationError, TechnicalValidationError } from './error-types.mjs'
import { Logger } from './logging.mjs'
import { config } from './config.mjs'

const { deserialize, serialize } = { ...serializr }

class ProjectStore {}

// TODO more debug logging
// TODO the isLoading is clunky... e.g. result in unhandledRejection if loading fails
class InMemoryProjectStore extends ProjectStore {
  constructor (location = config.getProperty('project.location'), defaultRuleLocation = config.getOptionalProperty('rule.default.location'), ruleService = config.getInstance(RuleService), classValidator = config.getInstance(ClassValidationService)) {
    super()
    this.location = location
    this.projectFileDirectory = path.dirname(this.location)
    this.defaultRuleLocation = defaultRuleLocation
    this.ruleService = ruleService
    this.classValidator = classValidator
    this.logger = config.getClassInstance(Logger, { id: 'project-store' })
    this.storedProjects = {}
    this.fileOperationQueue = new FileOperationQueue()

    this.initialize()
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
        // if pattern is an absolute path then it can be used as such. If it is a relative path then this is relative to the projects file location so then the pattern must be updated accordingly otherwise the system would consider it relative to the location where the program was started.
        const isAbsolutePath = ruleFilePattern === path.resolve(ruleFilePattern)
        this.logger.debug(`The rule file pattern ${ruleFilePattern} is considered an absolute path: ${isAbsolutePath}`)

        const ruleFilePatternNormalized = isAbsolutePath ? ruleFilePattern : path.normalize(path.join(this.projectFileDirectory, ruleFilePattern))
        this.logger.debug(`Normalized ruleFilePattern: ${ruleFilePatternNormalized}`)

        const ruleFiles = await globAsync(ruleFilePatternNormalized)
        if (ruleFiles.length === 0) {
          this.logger.warn(`No rule files match the pattern ${ruleFilePattern}`)
        }
        for (let ruleFile of ruleFiles) {
          const ruleFileLocation = isAbsolutePath ? ruleFile : path.relative(this.projectFileDirectory, ruleFile)
          this.logger.debug(`Rule location: ${ruleFileLocation}`)
          rulePromises.push(this.ruleService.readRule(ruleFile).then((rule) => {
            return new ProjectRule(ruleFileLocation, rule)
          }).catch(e => {
            this.logger.warn('Skipping rule \'%s\' because unable to parse it', ruleFileLocation)
          }))
        }
      }

      const newProject = new Project(project.name, await Promise.all(rulePromises).then(values => {
        return values.filter(value => value)
      }))
      await this._validateProject(newProject)
      this._setProject(newProject)
    }
  }
  async initialize () {
    this.logger.debug('Initializing project store from disk')
    this.isLoading = this._loadProjectsFile().catch(e => {
      this.logger.error(e, 'There was a problem loading projects file \'%s\'', this.location)
      throw e
    })
    return this.isLoading
  }
  async reInitialize () {
    return this.initialize()
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
    this._checkUpdateProjectNotExists(projectName, updatedProject)
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
    this._completeProjectRule(projectName, projectRule)
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
    this._completeProjectRule(projectName, updatedProjectRule)
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
    this._updateProjectRule(originalProjectRule.location, clonedUpdatedProjectRule)

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
    return this.fileOperationQueue.add(this._getProjectRuleResolvedLocation(projectRule), dumpedRule)
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
  _completeProjectRule (projectName, projectRule) { // TODO move logic somewhere else?
    if (!projectRule.location && projectRule.rule && projectRule.rule.name) {
      if (this.defaultRuleLocation) {
        projectRule.location = `${this.defaultRuleLocation}/${projectName}/${projectRule.rule.name}.yaml`
      } else {
        projectRule.location = path.relative(this.projectFileDirectory, `${this.projectFileDirectory}/../rules/${projectName}/${projectRule.rule.name}.yaml`) // TODO
      }
    }
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
  _checkUpdateProjectNotExists (projectName, updatedProject) {
    if (projectName !== updatedProject.name && this._getProject(updatedProject.name)) {
      throw new FunctionalValidationError(
        `The project with name ${updatedProject.name} already exists`,
        'project exists',
        {
          project: updatedProject.name
        }
      )
    }
  }
  _getProjectRule (projectName, ruleName) {
    return this._getProject(projectName).rules.find((projectRule) => {
      return projectRule.rule.name === ruleName
    })
  }
  _updateProjectRule (originalRuleLocation, updatedProjectRule) {
    for (let project of Object.values(this._getProjects())) {
      const indexOriginalRule = project.rules.findIndex((projectRule) => {
        return projectRule.location === originalRuleLocation
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
    const projectRuleLocation = path.normalize(projectRule.location)
    const locationExists = this._getProject(projectName).rules.some((aProjectRule) => {
      return path.normalize(aProjectRule.location) === projectRuleLocation
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
      this.fileOperationQueue.remove(this._getProjectRuleResolvedLocation(projectRule))
    } catch (e) {
      this.logger.error(e, "An error occurred when trying to delete file '%s'", projectRule.location)
    }
  }
  _getProjectRuleResolvedLocation (projectRule) {
    // if project rule location is relative then it is relative to projects file location => need to get the real path relative to where the program is running from
    const isLocationAbsolute = projectRule.location === path.resolve(projectRule.location)
    return isLocationAbsolute ? projectRule.location : path.resolve(this.projectFileDirectory, projectRule.location)
  }
}

export { ProjectStore, InMemoryProjectStore }
