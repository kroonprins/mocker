import yaml from 'js-yaml'

import { Project, ProjectRule } from './project-model'
import { ProjectsFileSerializationModel, ProjectRuleSerializationModel, LimitedDataProjectRuleSerializationModel } from './project-serialization-model'
import { deserialize, serialize } from './mjs_workaround/serializr-es6-module-loader'
import { readFileAsync, globAsync } from './util'
import { RuleService } from './rule-service'
import { logger } from './logging'
import { config } from './config'

class InMemoryProjectStore {
  constructor (location) {
    this.location = location
    this.storedProjects = {}
    this.isLoading = this._loadProjectsFile()
  }
  async _loadProjectsFile () {
    logger.debug('Load project from yaml file in location %s', this.location)
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

      this.storedProjects[project.name] = new Project(project.name, await Promise.all(rulePromises))
    }
  }
  async projects () {
    await this.isLoading
    return this.storedProjects
  }
  async project (projectName) {
    await this.isLoading
    this._checkProjectExists(projectName)
    return this.storedProjects[projectName]
  }
  async rule (projectName, ruleName) {
    await this.isLoading
    this._checkProjectExists(projectName)
    const project = this.storedProjects[projectName]
    const projectRule = project.rules.find((projectRule) => {
      return projectRule.rule.name === ruleName
    })
    if (!projectRule) {
      throw new Error(`The rule with name ${ruleName} was not found for project ${projectName}`)
    }
    return projectRule
  }
  _checkProjectExists (projectName) {
    if (!(projectName in this.storedProjects)) {
      throw new Error(`The project with name ${projectName} is not found`)
    }
  }
}

let PROJECT_STORE = new InMemoryProjectStore(config.projectsFileLocation)

const ProjectService = {
  updateProjectsFileLocation: async (projectsFileLocation) => { // only used for testing purposes, TODO investigate better way to make services not singletons
    PROJECT_STORE = new InMemoryProjectStore(projectsFileLocation)
  },
  listAllProjects: async () => {
    const projects = await PROJECT_STORE.projects()
    return Object.keys(projects)
  },
  listRules: async (projectName, limitedData = false) => {
    logger.debug("List rules for project '%s' from file '%s'", projectName)
    const project = await PROJECT_STORE.project(projectName)
    return project.rules.map((projectRule) => {
      return serialize(limitedData ? LimitedDataProjectRuleSerializationModel : ProjectRuleSerializationModel, projectRule)
    })
  },
  retrieveRule: async (projectName, ruleName) => {
    logger.debug("Retrieve rule with name %s for project '%s'", ruleName, projectName)
    const rule = await PROJECT_STORE.rule(projectName, ruleName)
    return serialize(ProjectRuleSerializationModel, rule)
  },
  createProject: async (projectName, ruleFiles = []) => {
    // TODO transactional stuff...
    // const projectFiles = await _listProjectFiles(projectsFileLocation)
    // if (projectFiles.projects.some((project) => {
    //   return project.name === projectName
    // })) {
    //   throw new Error(`The project with name ${projectName} already exists`)
    // }

    // projectFiles.projects.push(new ProjectFile(projectName, ruleFiles))
    // return overwriteFile(projectsFileLocation, yaml.safeDump(serialize(projectFiles)))
  }
}

export {
  ProjectService
}
