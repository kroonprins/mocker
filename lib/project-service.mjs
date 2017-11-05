import yaml from 'js-yaml'
import memoize from 'mem'

import { ProjectsFileSerializationModel } from './project-serialization-model'
import { RuleSerializationModel, LimitedDataRuleSerializationModel } from './rule-serialization-model'
import { deserialize, serialize } from './mjs_workaround/serializr-es6-module-loader'
import { readFileAsync, globAsync } from './util'
import { RuleService } from './rule-service'
import { logger } from './logging'
import { config } from './config'

const __listProjectFiles = async (projectsFileLocation) => {
  logger.debug('Read and parse the projects yaml file in location %s', projectsFileLocation)
  const projectsFileContent = await readFileAsync(projectsFileLocation)
  const projectsFile = yaml.safeLoad(projectsFileContent)
  return deserialize(ProjectsFileSerializationModel, projectsFile)
}

const _listProjectFiles = memoize(__listProjectFiles)

const _getProjectFile = async (projectName, projectsFileLocation) => {
  const projectFiles = await _listProjectFiles(projectsFileLocation)
  logger.debug(projectFiles, 'Parsed projects')
  const projectFile = projectFiles.projects.filter((projectFile) => {
    return projectFile.name === projectName
  })
  if (projectFile.length !== 1) {
    throw new Error(`Project with name '${projectName}' not found (${projectFile.length})`)
  }
  return projectFile[0]
}

const __getRules = async (projectName, projectsFileLocation) => {
  const rules = []
  const projectFile = await _getProjectFile(projectName, projectsFileLocation)
  logger.debug(projectFile, 'Found project file')

  for (let ruleFiles of projectFile.rules) {
    const files = await globAsync(ruleFiles)
    if (files.length === 0) {
      logger.warn(`No rule files match the pattern ${ruleFiles}`)
    }
    for (let ruleFile of files) {
      rules.push(await RuleService.readRule(ruleFile))
    }
  }
  logger.debug(rules, "Rules found for project '%s'", projectName)
  return rules
}

const _getRules = memoize(__getRules)

const ProjectService = {
  listAllProjects: async (projectsFileLocation = config.projectsFileLocation) => {
    const projectFiles = await _listProjectFiles(projectsFileLocation)
    return projectFiles.projects.map((project) => {
      return project.name
    })
  },
  listRules: async (projectName, projectsFileLocation = config.projectsFileLocation) => {
    logger.debug("List rules for project '%s' from file '%s'", projectName, projectsFileLocation)
    const rules = await _getRules(projectName, projectsFileLocation)
    return rules.map((rule) => {
      return serialize(LimitedDataRuleSerializationModel, rule)
    })
  },
  retrieveRule: async (projectName, ruleName, projectsFileLocation = config.projectsFileLocation) => {
    logger.debug("Retrieve rule with name %s for project '%s' from file '%s'", ruleName, projectName, projectsFileLocation)
    const rules = await _getRules(projectName, projectsFileLocation)
    return serialize(RuleSerializationModel, rules.find((rule) => {
      return rule.name === ruleName
    }))
  },
  getRules: async (projectName, projectsFileLocation = config.projectsFileLocation) => {
    logger.debug("Get rules for project '%s' from file '%s'", projectName, projectsFileLocation)
    return _getRules(projectName, projectsFileLocation)
  },
  createProject: async (projectName, ruleFiles = [], projectsFileLocation = config.projectsFileLocation) => {
    // // TODO transactional stuff...
    // const projectFiles = await _listProjectFiles(projectFileLocation);
    // if(projectFiles.projects.some((project) => {
    //     return project.name === projectName;
    // })) {
    //     throw new Error(`The project with name ${projectName} already exists`);
    // }

    // projectFiles.push(new ProjectFile(projectName, ruleFiles));
    // yaml.safeDump(serialize(projectFiles));
    // //...
  }
}

export {
  ProjectService
}
