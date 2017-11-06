import yaml from 'js-yaml'

import { ProjectsFile, ProjectFile, Project, ProjectRule } from './project-model'
import { ProjectsFileSerializationModel, ProjectRuleSerializationModel, LimitedDataProjectRuleSerializationModel } from './project-serialization-model'
import { RuleSerializationModel } from './rule-serialization-model'
import { deserialize, serialize } from './mjs_workaround/serializr-es6-module-loader'
import { readFileAsync, unlinkAsync, globAsync, overwriteFile } from './util'
import { RuleService } from './rule-service'
import { logger } from './logging'
import { config } from './config'

// TODO: move to separate file
class FileOperationQueue {
  // TODO:
  //   * can keep a queue per file location because no need to wait writing a file while another file in another location is being actioned
  //   * if queue length > 1 when starting to write, it actually doesn't make sense anymore to do the intermediate writes => queue could actually be a variable holding the last requested write (though should be careful that skipping operation doesn't result in error, e.g. write file + delete file => if write is skipped then delete would fail)
  constructor () {
    this.queue = []
    this.isExecuting = false
  }
  add (location, content) {
    return this._pushAndExecute(async () => {
      await overwriteFile(location, content)
    })
  }
  remove (location) {
    return this._pushAndExecute(async () => {
      await unlinkAsync(location)
    })
  }
  _pushAndExecute (action) {
    return new Promise((resolve, reject) => {
      try {
        this.queue.push(action)
        this._execute()
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }
  async _execute () {
    if (this.queue.length === 0) {
      return
    }
    if (this.isExecuting) {
      return
    }
    this.isExecuting = true
    try {
      const action = this.queue.shift()
      await action()
    } finally {
      this.isExecuting = false
      this._execute()
    }
  }
}

class InMemoryProjectStore {
  constructor (location) {
    this.location = location
    this.storedProjects = {}
    this.isLoading = this._loadProjectsFile()
    this.fileOperationQueue = new FileOperationQueue()
  }
  async _loadProjectsFile () {
    logger.debug('Load projects from yaml file in location %s', this.location)
    const rawFileContent = await readFileAsync(this.location)
    const parsedFileContent = yaml.safeLoad(rawFileContent)
    if (!parsedFileContent.projects) {
      parsedFileContent.projects = []
    }
    const projectsFile = deserialize(ProjectsFileSerializationModel, parsedFileContent)
    logger.debug(projectsFile, 'Parsed projectsFile')

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
          logger.warn(`No rule files match the pattern ${ruleFilePattern}`)
        }
        for (let ruleFile of ruleFiles) {
          rulePromises.push(RuleService.readRule(ruleFile).then((rule) => {
            return new ProjectRule(ruleFile, rule)
          }))
        }
      }

      this._setProject(new Project(project.name, await Promise.all(rulePromises)))
    }
  }
  async projects () {
    logger.debug("Retrieving all projects from InMemoryProjects store configured with location '%s'", this.location)
    await this.isLoading
    return this._getProjects()
  }
  async project (projectName) {
    logger.debug("Retrieving project with name '%s' from InMemoryProjects store configured with location '%s'", projectName, this.location)
    await this.isLoading
    this._checkProjectExists(projectName)
    return this._getProject(projectName)
  }
  async projectRule (projectName, ruleName) {
    logger.debug("Retrieving project rule with name '%s' for project '%' from InMemoryProjects store configured with location '%s'", ruleName, projectName, this.location)
    await this.isLoading
    this._checkProjectExists(projectName)
    const project = this._getProject(projectName)
    const projectRule = project.rules.find((projectRule) => {
      return projectRule.rule.name === ruleName
    })
    if (!projectRule) {
      throw new Error(`The rule with name ${ruleName} was not found for project ${projectName}`)
    }
    return projectRule
  }
  async createNewProject (projectName) {
    await this.isLoading
    this._checkProjectNotExists(projectName)
    this._setProject(new Project(projectName))
    return this._syncProjectsFileToFileSystem()
  }
  async updateProject (projectName, updatedProject) { // only updates the name of the project!
    await this.isLoading
    this._checkProjectExists(projectName)
    const projectToUpdate = this._getProject(projectName)
    this._deleteProject(projectName)
    projectToUpdate.name = updatedProject.name
    this._setProject(projectToUpdate)
    return this._syncProjectsFileToFileSystem()
  }
  async removeProject (projectName) {
    await this.isLoading
    this._checkProjectExists(projectName)
    this._deleteProjectRules(projectName)
    this._deleteProject(projectName)
    return this._syncProjectsFileToFileSystem()
  }
  async createProjectRule (projectName, projectRule) {
    await this.isLoading
    this._checkProjectExists(projectName)
    this._checkProjectRuleNotExists(projectName, projectRule)

    const project = this._getProject(projectName)
    // TODO find proper way to handling cloning the input so that the caller no longer has a reference with which the memory model can be updated without going through this service
    const clonedProjectRule = deserialize(ProjectRuleSerializationModel, serialize(ProjectRuleSerializationModel, projectRule))
    project.rules.push(clonedProjectRule)
    return Promise.all([
      this._syncProjectsFileToFileSystem(),
      this._syncRuleFileToFileSystem(clonedProjectRule)
    ])
  }
  async updateProjectRule (projectName, originalRuleName, updatedProjectRule) {
    await this.isLoading
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



    return Promise.all(promises)
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
    const dumpedProjectsFile = yaml.safeDump(serializedProjectsFile)
    return this.fileOperationQueue.add(this.location, dumpedProjectsFile)
  }
  async _syncRuleFileToFileSystem (projectRule) {
    const serializedRule = serialize(RuleSerializationModel, projectRule.rule)
    const dumpedRule = yaml.safeDump(serializedRule)
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
  _checkProjectExists (projectName) {
    if (!(projectName in this.storedProjects)) {
      throw new Error(`The project with name ${projectName} does not exist`)
    }
  }
  _checkProjectNotExists (projectName) {
    if (projectName in this.storedProjects) {
      throw new Error(`The project with name ${projectName} already exists`)
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
      throw new Error(`A rule with name '${projectRule.rule.name}' already exists for the project with name ${projectName}`)
    }
  }
  _checkProjectRuleLocationNotExists (projectName, projectRule) {
    const locationExists = this._getProject(projectName).rules.some((aProjectRule) => {
      return aProjectRule.location === projectRule.location
    })
    if (locationExists) {
      throw new Error(`A rule with location '${projectRule.location}' already exists for the project with name ${projectName}`)
    }
  }
  _checkProjectRuleMethodAndPathNotExists (projectName, projectRule) {
    const methodAndPathExist = this._getProject(projectName).rules.some((aProjectRule) => {
      const rule = aProjectRule.rule
      return rule.request.path === projectRule.rule.request.path && rule.request.method === projectRule.rule.request.method
    })
    if (methodAndPathExist) {
      throw new Error(`A rule with path '${projectRule.rule.request.path}' and method '${projectRule.rule.request.method}' already exists for the project with name ${projectName}`)
    }
  }
  _checkProjectRuleExists (projectName, ruleName) {
    const exists = this._getProject(projectName).rules.some((projectRule) => {
      return projectRule.rule.name === ruleName
    })
    if (!exists) {
      throw new Error(`A rule with name '${ruleName}' does not exist for the project with name ${projectName}`)
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
      logger.error(e, "An error occurred when trying to delete file '%s'", projectRule.location)
    }
  }
}

let PROJECT_STORE = new InMemoryProjectStore(config.projectsFileLocation)

const ProjectService = {
  updateProjectsFileLocation: async (projectsFileLocation) => { // only used for testing purposes, TODO investigate better way to make services not singletons
    PROJECT_STORE = new InMemoryProjectStore(projectsFileLocation)
  },
  listProjects: async () => {
    const projects = await PROJECT_STORE.projects()
    return Object.keys(projects)
  },
  createProject: async (projectName) => {
    logger.debug("Creating new project '%s'", projectName)
    return PROJECT_STORE.createNewProject(projectName)
  },
  updateProject: async (projectName, updatedProject) => { // only allows updating project properties, not its rules
    logger.debug(updatedProject, "Updating project '%s'", projectName)
    return PROJECT_STORE.updateProject(projectName, updatedProject)
  },
  removeProject: async (projectName) => {
    logger.debug("Removing project '%s'", projectName)
    return PROJECT_STORE.removeProject(projectName)
  },
  listProjectRules: async (projectName, limitedData = false) => {
    logger.debug("List rules for project '%s' from file '%s'", projectName)
    const project = await PROJECT_STORE.project(projectName)
    return project.rules.map((projectRule) => {
      return serialize(limitedData ? LimitedDataProjectRuleSerializationModel : ProjectRuleSerializationModel, projectRule)
    })
  },
  retrieveProjectRule: async (projectName, ruleName) => {
    logger.debug("Retrieve rule with name %s for project '%s'", ruleName, projectName)
    const rule = await PROJECT_STORE.projectRule(projectName, ruleName)
    return serialize(ProjectRuleSerializationModel, rule)
  },
  createProjectRule: async (projectName, projectRule) => {
    logger.debug(projectRule, "Creating new rule for project '%s'", projectName)
    return PROJECT_STORE.createProjectRule(projectName, projectRule)
  },
  updateProjectRule: async (projectName, originalRuleName, updatedProjectRule) => {
    logger.debug(updatedProjectRule, "Update rule with name '%s' for project '%s'", originalRuleName, projectName)
    return PROJECT_STORE.updateProjectRule(projectName, originalRuleName, updatedProjectRule)
  },
  removeProjectRule: async (projectName, ruleName) => {
    logger.debug("Removing rule with name '%s' for project '%s'", ruleName, projectName)
    return PROJECT_STORE.removeProjectRule(projectName, ruleName)
  }
}

export {
  ProjectService
}
